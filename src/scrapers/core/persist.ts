import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";

import { getPrismaClient } from "../../lib/prisma";
import {
  extractPriceInr,
  normalizeWhitespace,
  slugify,
} from "../../lib/normalization/extractors";
import type {
  NormalizedScrapedPackage,
  OrganizerScraper,
} from "../types";

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
) {
  const prisma = getPrismaClient();

  if (dryRun) {
    return packages.length;
  }

  if (!prisma) {
    throw new Error(
      "DATABASE_URL is not set. Live scraping requires a PostgreSQL database. Use a Neon connection string for zero-cost deployment.",
    );
  }

  const organizer = await prisma.organizer.upsert({
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
    const persistedSource = await prisma.scrapeSource.upsert({
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
    ? await prisma.scrapeRun.create({
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
      const trek = await prisma.trek.upsert({
        where: {
          slug: packageRow.trekSlug,
        },
        update: {
          name: packageRow.trekName,
        },
        create: {
          name: packageRow.trekName,
          slug: packageRow.trekSlug,
        },
      });

      const existingPackage = await prisma.trekPackage.findUnique({
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

      const persistedPackage = await prisma.trekPackage.upsert({
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
        },
      });

      await syncDepartures(prisma, persistedPackage.id, packageRow);
      await syncInclusions(prisma, persistedPackage.id, packageRow);
      await recordPackagePriceHistory(prisma, persistedPackage.id, packageRow);

      upserted += 1;
    }

    if (scrapeRun) {
      await prisma.scrapeRun.update({
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
      await prisma.scrapeRun.update({
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