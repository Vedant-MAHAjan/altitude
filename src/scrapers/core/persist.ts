import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";

import { getPrismaClient } from "../../lib/prisma";
import {
  extractPriceInr,
  normalizeWhitespace,
  slugify,
} from "../../lib/normalization/extractors";
import {
  classifyTrekRegion,
  TREK_REGION_MAHARASHTRA,
} from "../../lib/maharashtra-destinations";
import { normalizeSlug, slugSimilarity } from "../../lib/normalize-slug";
import { validatePackageForPersistence } from "./validate";
import {
  createEmptyTrekAliasCache,
  rememberCanonicalTrek,
  rememberTrekAlias,
  resolveCanonicalTrek,
  type TrekAliasCache,
} from "./trek-alias-resolver";
import type {
  NormalizedScrapedPackage,
  OrganizerScraper,
  ScraperLogger,
} from "../types";

function toDisplayTrekName(slug: string, fallback: string) {
  const fromSlug = slug
    .split("-")
    .filter(Boolean)
    .map((token) => token[0]?.toUpperCase() + token.slice(1))
    .join(" ");

  return fromSlug || fallback;
}

function inferCanonicalTrekIdentity(
  packageRow: NormalizedScrapedPackage,
  sourceTrekName: string,
  normalizedSourceSlug: string,
) {
  const usesExistingCanonicalIdentity =
    packageRow.trekSlug !== normalizedSourceSlug ||
    normalizeWhitespace(packageRow.trekName).toLowerCase() !==
      normalizeWhitespace(sourceTrekName).toLowerCase();

  if (usesExistingCanonicalIdentity) {
    return {
      canonicalSlug: packageRow.trekSlug,
      canonicalName: packageRow.trekName,
      similarity: slugSimilarity(normalizedSourceSlug, packageRow.trekSlug),
      shouldLogAlias:
        normalizeWhitespace(sourceTrekName).toLowerCase() !==
        normalizeWhitespace(packageRow.trekName).toLowerCase(),
    };
  }

  const canonicalSlug = normalizedSourceSlug || packageRow.trekSlug;

  return {
    canonicalSlug,
    canonicalName: toDisplayTrekName(canonicalSlug, packageRow.trekName),
    similarity: 1,
    shouldLogAlias: false,
  };
}

function logAliasMatch(
  logger: ScraperLogger | undefined,
  rawName: string,
  canonicalSlug: string,
  similarity: number,
) {
  logger?.info(
    `[alias] "${rawName}" → canonical "${canonicalSlug}" (similarity: ${similarity.toFixed(2)})`,
  );
}

function logAliasReview(
  logger: ScraperLogger | undefined,
  rawName: string,
  similarSlug: string,
  similarity: number,
) {
  logger?.warn(
    `[alias:review] "${rawName}" → new trek created, but similar to "${similarSlug}" (similarity: ${similarity.toFixed(2)}) — consider merging`,
  );
}

function parseDateOnly(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function nextDepartureAt(packageRow: NormalizedScrapedPackage) {
  const values = packageRow.departureDates
    .map((item) => parseDateOnly(item.isoDate))
    .filter((item): item is Date => item !== null)
    .sort((left, right) => left.getTime() - right.getTime());

  return values[0] ?? null;
}

function inferDepartureStatus(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value).toLowerCase();

  if (!normalized) {
    return "UNKNOWN" as const;
  }

  if (normalized.includes("sold out")) {
    return "SOLD_OUT" as const;
  }

  if (normalized.includes("waitlist")) {
    return "WAITLIST" as const;
  }

  if (normalized.includes("on request") || normalized.includes("request")) {
    return "ON_REQUEST" as const;
  }

  if (normalized.includes("cancel")) {
    return "CANCELLED" as const;
  }

  if (normalized.includes("available")) {
    return "AVAILABLE" as const;
  }

  return "UNKNOWN" as const;
}

function inferInclusionCategory(value: string) {
  const normalized = normalizeWhitespace(value).toLowerCase();

  if (/(bus|train|transport|pickup|drop|transfer|jeep|travel)/.test(normalized)) {
    return "TRANSPORT" as const;
  }

  if (/(breakfast|lunch|dinner|meal|tea|snack|food)/.test(normalized)) {
    return "MEAL" as const;
  }

  if (/(stay|tent|camp|accommodation|hotel|homestay)/.test(normalized)) {
    return "STAY" as const;
  }

  if (/(entry|forest|ticket|fees?|charges?)/.test(normalized)) {
    return "ENTRY_FEE" as const;
  }

  if (/(guide|leader|expert|captain)/.test(normalized)) {
    return "GUIDE" as const;
  }

  if (/permit/.test(normalized)) {
    return "PERMIT" as const;
  }

  if (/(first aid|safety|equipment|rope|technical)/.test(normalized)) {
    return "SAFETY" as const;
  }

  if (/(rental|rent|gear|pole|bag|mat|shoe)/.test(normalized)) {
    return "RENTAL" as const;
  }

  return "OTHER" as const;
}

function buildDepartureKey(
  departure: NormalizedScrapedPackage["departureDates"][number],
) {
  const labelSlug = slugify(departure.label || "departure");
  return departure.isoDate ? `${departure.isoDate}:${labelSlug}` : labelSlug;
}

function buildPackageSlug(
  title: string,
  sourceUrl: string,
  existingSlug?: string | null,
) {
  if (existingSlug) {
    return existingSlug;
  }

  const sourceSuffix = createHash("sha1").update(sourceUrl).digest("hex").slice(0, 8);
  return `${slugify(title)}-${sourceSuffix}`;
}

function buildInclusionRows(packageRow: NormalizedScrapedPackage) {
  const rows = [
    ...packageRow.inclusions.map((label, sortOrder) => ({
      code: slugify(label),
      label,
      category: inferInclusionCategory(label),
      status: "INCLUDED" as const,
      rawText: label,
      sortOrder,
    })),
    ...packageRow.exclusions.map((label, sortOrder) => ({
      code: slugify(label),
      label,
      category: inferInclusionCategory(label),
      status: "EXCLUDED" as const,
      rawText: label,
      sortOrder: packageRow.inclusions.length + sortOrder,
    })),
  ];

  return [...new Map(rows.map((row) => [`${row.status}:${row.code}`, row])).values()];
}

async function syncInclusions(
  prisma: NonNullable<ReturnType<typeof getPrismaClient>>,
  trekPackageId: string,
  packageRow: NormalizedScrapedPackage,
) {
  const inclusionRows = buildInclusionRows(packageRow);

  await prisma.inclusion.deleteMany({
    where: {
      trekPackageId,
    },
  });

  if (inclusionRows.length === 0) {
    return;
  }

  await prisma.inclusion.createMany({
    data: inclusionRows.map((row) => ({
      trekPackageId,
      code: row.code,
      label: row.label,
      category: row.category,
      status: row.status,
      rawText: row.rawText,
      sortOrder: row.sortOrder,
      isFilterable: true,
    })),
  });
}

async function recordPackagePriceHistory(
  prisma: NonNullable<ReturnType<typeof getPrismaClient>>,
  trekPackageId: string,
  packageRow: NormalizedScrapedPackage,
) {
  if (packageRow.priceInr === null && !packageRow.priceText) {
    return;
  }

  const latestPrice = await prisma.priceHistory.findFirst({
    where: {
      trekPackageId,
      departureId: null,
    },
    orderBy: {
      capturedAt: "desc",
    },
    select: {
      priceInr: true,
      priceText: true,
      sourceFingerprint: true,
    },
  });

  const shouldCreateHistory =
    !latestPrice ||
    latestPrice.priceInr !== packageRow.priceInr ||
    latestPrice.priceText !== packageRow.priceText ||
    latestPrice.sourceFingerprint !== packageRow.pageFingerprint;

  if (!shouldCreateHistory) {
    return;
  }

  await prisma.priceHistory.create({
    data: {
      trekPackageId,
      priceInr: packageRow.priceInr,
      priceText: packageRow.priceText,
      currencyCode: "INR",
      sourceKind: "SCRAPE",
      sourceFingerprint: packageRow.pageFingerprint,
      rawSnapshot: packageRow.rawSnapshot ?? Prisma.JsonNull,
    },
  });
}

async function syncDepartures(
  prisma: NonNullable<ReturnType<typeof getPrismaClient>>,
  trekPackageId: string,
  packageRow: NormalizedScrapedPackage,
) {
  const activeDepartureKeys: string[] = [];

  for (const departure of packageRow.departureDates) {
    const departureKey = buildDepartureKey(departure);
    activeDepartureKeys.push(departureKey);

    const departurePriceInr = extractPriceInr(departure.priceText);
    const persistedDeparture = await prisma.departure.upsert({
      where: {
        trekPackageId_departureKey: {
          trekPackageId,
          departureKey,
        },
      },
      update: {
        sourceUrl: packageRow.sourceUrl,
        label: departure.label,
        startDate: parseDateOnly(departure.isoDate),
        availabilityStatus: inferDepartureStatus(departure.availability),
        priceInr: departurePriceInr,
        priceText: departure.priceText,
        currencyCode: "INR",
        pickupLocation: packageRow.pickupLocations[0] ?? null,
        rawSnapshot: {
          isoDate: departure.isoDate,
          availability: departure.availability,
          priceText: departure.priceText,
        },
        lastSeenAt: new Date(),
      },
      create: {
        trekPackageId,
        departureKey,
        sourceUrl: packageRow.sourceUrl,
        label: departure.label,
        startDate: parseDateOnly(departure.isoDate),
        availabilityStatus: inferDepartureStatus(departure.availability),
        priceInr: departurePriceInr,
        priceText: departure.priceText,
        currencyCode: "INR",
        pickupLocation: packageRow.pickupLocations[0] ?? null,
        rawSnapshot: {
          isoDate: departure.isoDate,
          availability: departure.availability,
          priceText: departure.priceText,
        },
      },
      select: {
        id: true,
      },
    });

    if (departurePriceInr !== null || departure.priceText) {
      const latestDeparturePrice = await prisma.priceHistory.findFirst({
        where: {
          departureId: persistedDeparture.id,
        },
        orderBy: {
          capturedAt: "desc",
        },
        select: {
          priceInr: true,
          priceText: true,
        },
      });

      const shouldCreateHistory =
        !latestDeparturePrice ||
        latestDeparturePrice.priceInr !== departurePriceInr ||
        latestDeparturePrice.priceText !== departure.priceText;

      if (shouldCreateHistory) {
        await prisma.priceHistory.create({
          data: {
            trekPackageId,
            departureId: persistedDeparture.id,
            priceInr: departurePriceInr,
            priceText: departure.priceText,
            currencyCode: "INR",
            sourceKind: "SCRAPE",
            rawSnapshot: {
              isoDate: departure.isoDate,
              availability: departure.availability,
              priceText: departure.priceText,
            },
          },
        });
      }
    }
  }

  await prisma.departure.deleteMany({
    where: activeDepartureKeys.length > 0
      ? {
          trekPackageId,
          departureKey: {
            notIn: activeDepartureKeys,
          },
        }
      : {
          trekPackageId,
        },
  });
}

export async function persistPackages(
  scraper: OrganizerScraper,
  packages: NormalizedScrapedPackage[],
  dryRun: boolean,
  logger?: ScraperLogger,
  trekAliasCache: TrekAliasCache = createEmptyTrekAliasCache(),
) {
  const prisma = getPrismaClient();

  if (!dryRun && !prisma) {
    throw new Error(
      "DATABASE_URL is not set. Live scraping requires a PostgreSQL database. Use a Neon connection string for zero-cost deployment.",
    );
  }

  if (dryRun) {
    for (const packageRow of packages) {
      const sourceTrekName = normalizeWhitespace(
        packageRow.sourceTrekName || packageRow.trekName || packageRow.title,
      );
      const trekRegion = classifyTrekRegion(sourceTrekName || packageRow.trekName);

      if (trekRegion !== TREK_REGION_MAHARASHTRA) {
        continue;
      }

      const resolution = resolveCanonicalTrek(trekAliasCache, sourceTrekName);

      if (resolution.canonicalTrek) {
        const rawNameChanged =
          normalizeWhitespace(sourceTrekName).toLowerCase() !==
          normalizeWhitespace(resolution.canonicalTrek.name).toLowerCase();

        if (rawNameChanged) {
          logAliasMatch(logger, sourceTrekName, resolution.canonicalTrek.slug, resolution.similarity);
        }

        rememberTrekAlias(trekAliasCache, sourceTrekName, resolution.canonicalTrek);
        continue;
      }

      if (resolution.reviewCandidate) {
        logAliasReview(
          logger,
          sourceTrekName,
          resolution.reviewCandidate.slug,
          resolution.similarity,
        );
      }

      const inferredCanonical = inferCanonicalTrekIdentity(
        packageRow,
        sourceTrekName,
        resolution.normalizedSlug || packageRow.trekSlug,
      );

      if (inferredCanonical.shouldLogAlias) {
        logAliasMatch(
          logger,
          sourceTrekName,
          inferredCanonical.canonicalSlug,
          inferredCanonical.similarity,
        );
      }

      const dryRunTrek = {
        id: `dry:${inferredCanonical.canonicalSlug}`,
        name: inferredCanonical.canonicalName,
        slug: inferredCanonical.canonicalSlug,
        region: trekRegion,
      };

      rememberCanonicalTrek(trekAliasCache, dryRunTrek);
      rememberTrekAlias(trekAliasCache, sourceTrekName, dryRunTrek);
    }

    return packages.length;
  }

  const livePrisma = prisma!;

  const organizer = await livePrisma.organizer.upsert({
    where: {
      slug: scraper.organizer.slug,
    },
    update: {
      name: scraper.organizer.name,
      websiteUrl: scraper.organizer.websiteUrl,
      description: scraper.organizer.description ?? null,
      platformKey: scraper.sources[0]?.parserKey.split(":")[0] ?? null,
      metadata: {
        sourceCount: scraper.sources.length,
      },
      isActive: true,
    },
    create: {
      name: scraper.organizer.name,
      slug: scraper.organizer.slug,
      websiteUrl: scraper.organizer.websiteUrl,
      description: scraper.organizer.description ?? null,
      platformKey: scraper.sources[0]?.parserKey.split(":")[0] ?? null,
      metadata: {
        sourceCount: scraper.sources.length,
      },
    },
  });

  let primarySourceId: string | null = null;

  for (const source of scraper.sources) {
    const persistedSource = await livePrisma.scrapeSource.upsert({
      where: {
        organizerId_sourceUrl: {
          organizerId: organizer.id,
          sourceUrl: source.sourceUrl,
        },
      },
      update: {
        organizerId: organizer.id,
        label: source.label,
        parserKey: source.parserKey,
        crawlStrategy: source.crawlStrategy,
        isActive: true,
        lastSuccessAt: new Date(),
      },
      create: {
        organizerId: organizer.id,
        label: source.label,
        sourceUrl: source.sourceUrl,
        parserKey: source.parserKey,
        crawlStrategy: source.crawlStrategy,
      },
    });

    if (!primarySourceId) {
      primarySourceId = persistedSource.id;
    }
  }

  const scrapeRun = primarySourceId
    ? await livePrisma.scrapeRun.create({
        data: {
          scrapeSourceId: primarySourceId,
          status: "SUCCESS",
          attemptCount: 1,
          packagesFound: packages.length,
          packagesUpserted: 0,
          startedAt: new Date(),
        },
      })
    : null;

  let upserted = 0;

  try {
    for (const packageRow of packages) {
      // Post-scrape validation
      const validation = validatePackageForPersistence(packageRow);

      if (validation.warnings.length > 0) {
        logger?.warn("Package validation warnings", {
          sourceUrl: packageRow.sourceUrl,
          title: packageRow.title,
          warnings: validation.warnings,
        });
      }

      if (!validation.valid) {
        logger?.error("Package validation failed — marking needsReview", {
          sourceUrl: packageRow.sourceUrl,
          title: packageRow.title,
          errors: validation.errors,
        });
      }

      const sourceTrekName = normalizeWhitespace(
        packageRow.sourceTrekName || packageRow.trekName || packageRow.title,
      );
      const trekRegion = classifyTrekRegion(sourceTrekName || packageRow.trekName);
      const normalizedCanonicalSlug = normalizeSlug(sourceTrekName || packageRow.trekName);
      const resolution =
        trekRegion === TREK_REGION_MAHARASHTRA
          ? resolveCanonicalTrek(trekAliasCache, sourceTrekName)
          : null;

      let trek: { id: string; name: string; slug: string; region: string } | null =
        resolution?.canonicalTrek
          ? {
              id: resolution.canonicalTrek.id,
              name: resolution.canonicalTrek.name,
              slug: resolution.canonicalTrek.slug,
              region: resolution.canonicalTrek.region,
            }
          : null;

      if (trek && normalizeWhitespace(sourceTrekName).toLowerCase() !== normalizeWhitespace(trek.name).toLowerCase()) {
        logAliasMatch(logger, sourceTrekName, trek.slug, resolution?.similarity ?? 1);
      }

      if (!trek) {
        if (resolution?.reviewCandidate) {
          logAliasReview(
            logger,
            sourceTrekName,
            resolution.reviewCandidate.slug,
            resolution.similarity,
          );
        }

        const inferredCanonical = inferCanonicalTrekIdentity(
          packageRow,
          sourceTrekName,
          normalizedCanonicalSlug || packageRow.trekSlug,
        );

        if (inferredCanonical.shouldLogAlias) {
          logAliasMatch(
            logger,
            sourceTrekName,
            inferredCanonical.canonicalSlug,
            inferredCanonical.similarity,
          );
        }

        const canonicalSlug = inferredCanonical.canonicalSlug;
        const canonicalName = inferredCanonical.canonicalName;
        const persistedTrek = await livePrisma.trek.upsert({
          where: {
            slug: canonicalSlug,
          },
          update: {
            name: canonicalName,
            region: trekRegion,
          },
          create: {
            name: canonicalName,
            slug: canonicalSlug,
            region: trekRegion,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            region: true,
          },
        });

        trek = persistedTrek;
      }

      if (!trek) {
        throw new Error(`Failed to resolve canonical trek for ${sourceTrekName}`);
      }

      if (trekRegion === TREK_REGION_MAHARASHTRA) {
        rememberCanonicalTrek(trekAliasCache, trek);

        await livePrisma.trekAlias.upsert({
          where: {
            value: sourceTrekName,
          },
          update: {
            trekId: trek.id,
          },
          create: {
            trekId: trek.id,
            value: sourceTrekName,
          },
        });

        rememberTrekAlias(trekAliasCache, sourceTrekName, trek);
      }

      const existingPackage = await livePrisma.trekPackage.findUnique({
        where: {
          organizerId_sourceUrl: {
            organizerId: organizer.id,
            sourceUrl: packageRow.sourceUrl,
          },
        },
        select: {
          id: true,
          slug: true,
          pageFingerprint: true,
        },
      });

      const packageSlug = buildPackageSlug(
        packageRow.title,
        packageRow.sourceUrl,
        existingPackage?.slug,
      );

      const packageChanged =
        existingPackage?.pageFingerprint !== packageRow.pageFingerprint;

      const persistedPackage = await livePrisma.trekPackage.upsert({
        where: {
          organizerId_sourceUrl: {
            organizerId: organizer.id,
            sourceUrl: packageRow.sourceUrl,
          },
        },
        update: {
          organizerId: organizer.id,
          trekId: trek.id,
          title: packageRow.title,
          slug: packageSlug,
          status: "ACTIVE",
          priceInr: packageRow.priceInr,
          priceText: packageRow.priceText,
          currencyCode: "INR",
          durationText: packageRow.durationText,
          locationText: packageRow.locationText,
          nextDepartureAt: nextDepartureAt(packageRow),
          transportType: packageRow.transportType,
          mealPlan: packageRow.mealPlan,
          forestFeeStatus: packageRow.forestFeeStatus,
          pickupLocations: packageRow.pickupLocations,
          rawPageText: packageRow.rawPageText,
          rawSnapshot: packageRow.rawSnapshot ?? Prisma.JsonNull,
          rawPriceText: packageRow.rawPriceText,
          rawDurationText: packageRow.rawDurationText,
          rawLocationText: packageRow.rawLocationText,
          rawTransportText: packageRow.rawTransportText,
          rawMealText: packageRow.rawMealText,
          rawForestFeeText: packageRow.rawForestFeeText,
          rawPickupText: packageRow.rawPickupText,
          rawDepartureText: packageRow.rawDepartureText,
          rawInclusionsText: packageRow.rawInclusionsText,
          rawExclusionsText: packageRow.rawExclusionsText,
          normalizedSnapshot: packageRow.normalizedSnapshot,
          pageFingerprint: packageRow.pageFingerprint,
          needsReview: !validation.valid,
          lastSeenAt: new Date(),
          lastScrapedAt: new Date(),
          lastChangedAt: packageChanged ? new Date() : undefined,
        },
        create: {
          organizerId: organizer.id,
          trekId: trek.id,
          title: packageRow.title,
          slug: packageSlug,
          sourceUrl: packageRow.sourceUrl,
          status: "ACTIVE",
          priceInr: packageRow.priceInr,
          priceText: packageRow.priceText,
          currencyCode: "INR",
          durationText: packageRow.durationText,
          locationText: packageRow.locationText,
          nextDepartureAt: nextDepartureAt(packageRow),
          transportType: packageRow.transportType,
          mealPlan: packageRow.mealPlan,
          forestFeeStatus: packageRow.forestFeeStatus,
          pickupLocations: packageRow.pickupLocations,
          rawPageText: packageRow.rawPageText,
          rawSnapshot: packageRow.rawSnapshot ?? Prisma.JsonNull,
          rawPriceText: packageRow.rawPriceText,
          rawDurationText: packageRow.rawDurationText,
          rawLocationText: packageRow.rawLocationText,
          rawTransportText: packageRow.rawTransportText,
          rawMealText: packageRow.rawMealText,
          rawForestFeeText: packageRow.rawForestFeeText,
          rawPickupText: packageRow.rawPickupText,
          rawDepartureText: packageRow.rawDepartureText,
          rawInclusionsText: packageRow.rawInclusionsText,
          rawExclusionsText: packageRow.rawExclusionsText,
          normalizedSnapshot: packageRow.normalizedSnapshot,
          pageFingerprint: packageRow.pageFingerprint,
          needsReview: !validation.valid,
        },
      });

      await syncDepartures(livePrisma, persistedPackage.id, packageRow);
      await syncInclusions(livePrisma, persistedPackage.id, packageRow);
      await recordPackagePriceHistory(livePrisma, persistedPackage.id, packageRow);

      upserted += 1;
    }

    if (scrapeRun) {
      await livePrisma.scrapeRun.update({
        where: {
          id: scrapeRun.id,
        },
        data: {
          status: "SUCCESS",
          packagesUpserted: upserted,
          finishedAt: new Date(),
        },
      });
    }

    return upserted;
  } catch (error) {
    if (scrapeRun) {
      await livePrisma.scrapeRun.update({
        where: {
          id: scrapeRun.id,
        },
        data: {
          status: "FAILED",
          packagesUpserted: upserted,
          errorMessage: error instanceof Error ? error.message : "Unknown scrape error",
          finishedAt: new Date(),
        },
      });
    }

    throw error;
  }
}