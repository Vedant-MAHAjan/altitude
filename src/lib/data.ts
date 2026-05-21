import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { normalizeWhitespace } from "@/lib/normalization/extractors";
import { getPrismaClient } from "@/lib/prisma";
import type {
  ComparisonTransportType,
  ComparisonPackage,
  DifficultyLevel,
  HomepageData,
  InclusionStatus,
  ListingCity,
  MealPlan,
  OrganizerDetail,
  OrganizerSummary,
  TrekComparison,
  TrekSummary,
  TransportType,
} from "@/lib/types";

type DatabasePackageRecord = {
  id: string;
  title: string;
  sourceUrl: string;
  priceInr: number | null;
  priceText: string | null;
  transportType: string;
  rawTransportText: string | null;
  rawPickupText: string | null;
  rawDepartureText: string | null;
  rawInclusionsText: string | null;
  rawSnapshot: unknown | null;
  mealPlan: string;
  forestFeeStatus: string;
  normalizedSnapshot: unknown | null;
  pickupLocations: string[];
  lastScrapedAt: Date;
  organizer: {
    name: string;
    slug: string;
    websiteUrl: string;
  };
  trek?: {
    name: string;
    slug: string;
  };
};

type DatabaseTrekRecord = {
  name: string;
  slug: string;
  region: string | null;
  durationDays: number | null;
  durationNights: number | null;
  difficulty: string;
  summary: string | null;
  trekPackages: DatabasePackageRecord[];
};

type DatabaseOrganizerRecord = {
  name: string;
  slug: string;
  websiteUrl: string;
  description: string | null;
  trekPackages: DatabasePackageRecord[];
};

type TrekSearchEntry = {
  name: string;
  slug: string;
  aliases: string[];
};

type DerivedDisplayDetails = {
  listingCity: ListingCity;
  mealsAvailable: boolean;
  mealsSummary: string | null;
  stayIncluded: boolean;
  staySummary: string | null;
  inclusionHighlights: string[];
  exclusionHighlights: string[];
  transportSummary: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function deriveListingCity(normalizedSnapshot: unknown): ListingCity {
  const snapshot = isRecord(normalizedSnapshot) ? normalizedSnapshot : null;
  const sourceLabel = snapshot ? readString(snapshot.sourceLabel) : null;
  const sourceText = normalizeWhitespace(sourceLabel).toLowerCase();

  const hasMumbai = /\bmumbai\b/.test(sourceText);
  const hasPune = /\bpune\b/.test(sourceText);

  if (hasMumbai && hasPune) {
    return "MIXED";
  }

  if (hasMumbai) {
    return "MUMBAI";
  }

  if (hasPune) {
    return "PUNE";
  }

  return "OTHER";
}

function readDerivedDisplayDetails(normalizedSnapshot: unknown): DerivedDisplayDetails {
  const snapshot = isRecord(normalizedSnapshot) ? normalizedSnapshot : null;
  const pipeline = snapshot && isRecord(snapshot.pipeline) ? snapshot.pipeline : null;
  const derived = pipeline && isRecord(pipeline.derived) ? pipeline.derived : null;

  return {
    listingCity: deriveListingCity(snapshot),
    mealsAvailable: readBoolean(derived?.mealsAvailable),
    mealsSummary: readString(derived?.mealsSummary),
    stayIncluded: readBoolean(derived?.stayIncluded),
    staySummary: readString(derived?.staySummary),
    inclusionHighlights: readStringArray(derived?.inclusionHighlights),
    exclusionHighlights: readStringArray(derived?.exclusionHighlights),
    transportSummary: readString(derived?.transportSummary),
  };
}

function maxUpdatedAt(values: Array<string | null>) {
  const timestamps = values.filter(Boolean).map((value) => Date.parse(value as string));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

function priceRange(packages: ComparisonPackage[]) {
  const values = packages
    .map((item) => item.priceInr)
    .filter((item): item is number => item !== null);

  if (values.length === 0) {
    return {
      min: null,
      max: null,
    };
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function sortPackages(packages: ComparisonPackage[]) {
  return [...packages].sort((left, right) => {
    const leftPrice = left.priceInr ?? Number.MAX_SAFE_INTEGER;
    const rightPrice = right.priceInr ?? Number.MAX_SAFE_INTEGER;

    if (leftPrice !== rightPrice) {
      return leftPrice - rightPrice;
    }

    return left.organizerName.localeCompare(right.organizerName);
  });
}

function toComparisonTransportType(
  transportType: string,
  transportSignals: string | null,
): ComparisonTransportType {
  const normalizedText = normalizeWhitespace(transportSignals).toLowerCase();

  if (transportType === "TRAIN" || /\btrain\b/.test(normalizedText)) {
    return "TRAIN";
  }

  if (
    /\bnon[-\s]?ac\b/.test(normalizedText) ||
    /\bpushback\b/.test(normalizedText)
  ) {
    return "NON_AC_BUS";
  }

  if (
    /\bac\b/.test(normalizedText) ||
    /\bvolvo\b/.test(normalizedText) ||
    /\bac coach\b/.test(normalizedText)
  ) {
    return "AC_BUS";
  }

  return "NON_AC_BUS";
}

function toComparisonPackage(record: DatabasePackageRecord): ComparisonPackage {
  const transportSignals = [
    record.rawTransportText,
    record.rawPickupText,
    record.rawDepartureText,
    record.rawInclusionsText,
    record.pickupLocations.join(" "),
  ]
    .filter(Boolean)
    .join(" ");
  const derivedDetails = readDerivedDisplayDetails(record.normalizedSnapshot);
  const comparisonTransportType = toComparisonTransportType(
    record.transportType,
    transportSignals,
  );

  return {
    id: record.id,
    title: record.title,
    organizerName: record.organizer.name,
    organizerSlug: record.organizer.slug,
    organizerWebsiteUrl: record.organizer.websiteUrl,
    trekName: record.trek?.name,
    trekSlug: record.trek?.slug,
    sourceUrl: record.sourceUrl,
    priceInr: record.priceInr,
    priceText: record.priceText,
    transportType: comparisonTransportType,
    mealPlan: record.mealPlan as MealPlan,
    forestFeeStatus: record.forestFeeStatus as InclusionStatus,
    listingCity: derivedDetails.listingCity,
    mealsAvailable:
      derivedDetails.mealsAvailable ||
      record.mealPlan === "INCLUDED" ||
      record.mealPlan === "PARTIAL",
    mealsSummary: derivedDetails.mealsSummary,
    stayIncluded: derivedDetails.stayIncluded,
    staySummary: derivedDetails.staySummary,
    inclusionHighlights: derivedDetails.inclusionHighlights,
    exclusionHighlights: derivedDetails.exclusionHighlights,
    transportSummary: derivedDetails.transportSummary,
    pickupLocations:
      comparisonTransportType === "TRAIN" ? [] : record.pickupLocations,
    lastUpdatedAt: record.lastScrapedAt.toISOString(),
  };
}

function summarizeTrek(comparison: TrekComparison): TrekSummary {
  return {
    name: comparison.name,
    slug: comparison.slug,
    region: comparison.region,
    durationDays: comparison.durationDays,
    durationNights: comparison.durationNights,
    difficulty: comparison.difficulty,
    summary: comparison.summary,
    packageCount: comparison.packageCount,
    organizerCount: comparison.organizerCount,
    priceMin: comparison.priceMin,
    priceMax: comparison.priceMax,
    updatedAt: comparison.updatedAt,
  };
}

function buildTrekComparison(record: DatabaseTrekRecord): TrekComparison {
  const packages = sortPackages(
    record.trekPackages.map((item) =>
      toComparisonPackage({
        ...item,
        trek: {
          name: record.name,
          slug: record.slug,
        },
      }),
    ),
  );
  const prices = priceRange(packages);

  return {
    name: record.name,
    slug: record.slug,
    region: record.region,
    durationDays: record.durationDays,
    durationNights: record.durationNights,
    difficulty: record.difficulty as DifficultyLevel,
    summary: record.summary,
    packageCount: packages.length,
    organizerCount: new Set(packages.map((item) => item.organizerSlug)).size,
    priceMin: prices.min,
    priceMax: prices.max,
    updatedAt: maxUpdatedAt(packages.map((item) => item.lastUpdatedAt)),
    packages,
  };
}

function buildOrganizerDetail(record: DatabaseOrganizerRecord): OrganizerDetail {
  const packages = sortPackages(record.trekPackages.map(toComparisonPackage));
  const prices = priceRange(packages);

  return {
    name: record.name,
    slug: record.slug,
    websiteUrl: record.websiteUrl,
    description: record.description,
    packageCount: packages.length,
    activeTreks: new Set(
      packages.map((item) => item.trekSlug).filter((item): item is string => Boolean(item)),
    ).size,
    priceMin: prices.min,
    priceMax: prices.max,
    pickupLocations: [...new Set(packages.flatMap((item) => item.pickupLocations))],
    updatedAt: maxUpdatedAt(packages.map((item) => item.lastUpdatedAt)),
    treks: [...new Map(packages
      .filter((item) => item.trekSlug && item.trekName)
      .map((item) => [item.trekSlug as string, {
        name: item.trekName as string,
        slug: item.trekSlug as string,
      }])).values()],
    packages,
  };
}

async function getCachedTreksIndex() {
  "use cache";

  cacheLife("hours");
  cacheTag("treks");

  const prisma = getPrismaClient();

  if (!prisma) {
    return [];
  }

  try {
    const treks = await prisma.trek.findMany({
      where: {
        trekPackages: {
          some: {
            status: "ACTIVE",
          },
        },
      },
      include: {
        trekPackages: {
          where: {
            status: "ACTIVE",
          },
          include: {
            organizer: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return treks.map((item) => summarizeTrek(buildTrekComparison(item)));
  } catch (error) {
    console.error("Failed to fetch trek summaries", error);
    return [];
  }
}

async function getCachedTrekComparison(slug: string) {
  "use cache";

  cacheLife("hours");
  cacheTag("treks");
  cacheTag(`trek:${slug}`);

  const prisma = getPrismaClient();

  if (!prisma) {
    return null;
  }

  try {
    const trek = await prisma.trek.findUnique({
      where: {
        slug,
      },
      include: {
        trekPackages: {
          where: {
            status: "ACTIVE",
          },
          include: {
            organizer: true,
          },
        },
      },
    });

    if (!trek || trek.trekPackages.length === 0) {
      return null;
    }

    return buildTrekComparison(trek);
  } catch (error) {
    console.error(`Failed to fetch trek comparison for ${slug}`, error);
    return null;
  }
}

async function getCachedOrganizerIndex() {
  "use cache";

  cacheLife("hours");
  cacheTag("organizers");

  const prisma = getPrismaClient();

  if (!prisma) {
    return [];
  }

  try {
    const organizers = await prisma.organizer.findMany({
      where: {
        isActive: true,
        trekPackages: {
          some: {
            status: "ACTIVE",
          },
        },
      },
      include: {
        trekPackages: {
          where: {
            status: "ACTIVE",
          },
          include: {
            organizer: true,
            trek: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return organizers.map((item) => {
      const detail = buildOrganizerDetail(item);

      return {
        name: detail.name,
        slug: detail.slug,
        websiteUrl: detail.websiteUrl,
        description: detail.description,
        packageCount: detail.packageCount,
        activeTreks: detail.activeTreks,
        priceMin: detail.priceMin,
        priceMax: detail.priceMax,
        pickupLocations: detail.pickupLocations,
        updatedAt: detail.updatedAt,
      } satisfies OrganizerSummary;
    });
  } catch (error) {
    console.error("Failed to fetch organizer summaries", error);
    return [];
  }
}

async function getCachedOrganizerDetail(slug: string) {
  "use cache";

  cacheLife("hours");
  cacheTag("organizers");
  cacheTag(`organizer:${slug}`);

  const prisma = getPrismaClient();

  if (!prisma) {
    return null;
  }

  try {
    const organizer = await prisma.organizer.findUnique({
      where: {
        slug,
      },
      include: {
        trekPackages: {
          where: {
            status: "ACTIVE",
          },
          include: {
            organizer: true,
            trek: true,
          },
        },
      },
    });

    if (!organizer || organizer.trekPackages.length === 0) {
      return null;
    }

    return buildOrganizerDetail(organizer);
  } catch (error) {
    console.error(`Failed to fetch organizer detail for ${slug}`, error);
    return null;
  }
}

async function getCachedTrekSearchIndex() {
  "use cache";

  cacheLife("hours");
  cacheTag("treks");

  const prisma = getPrismaClient();

  if (!prisma) {
    return [];
  }

  try {
    const treks = await prisma.trek.findMany({
      where: {
        trekPackages: {
          some: {
            status: "ACTIVE",
          },
        },
      },
      select: {
        name: true,
        slug: true,
        aliases: {
          select: {
            value: true,
          },
          orderBy: {
            value: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return treks.map((trek) => ({
      name: trek.name,
      slug: trek.slug,
      aliases: [...new Set([trek.name, ...trek.aliases.map((alias) => alias.value)])],
    } satisfies TrekSearchEntry));
  } catch (error) {
    console.error("Failed to fetch trek search index", error);
    return [];
  }
}

export async function getTreksIndex() {
  return getCachedTreksIndex();
}

export async function getTrekSearchIndex() {
  return getCachedTrekSearchIndex();
}

export async function getTrekComparison(slug: string) {
  return getCachedTrekComparison(slug);
}

export async function getTrekSlugs() {
  const treks = await getTreksIndex();
  return treks.map((item) => item.slug);
}

export async function getOrganizerIndex() {
  return getCachedOrganizerIndex();
}

export async function getOrganizerBySlug(slug: string) {
  return getCachedOrganizerDetail(slug);
}

export async function getOrganizerSlugs() {
  const organizers = await getOrganizerIndex();
  return organizers.map((item) => item.slug);
}

export async function getHomepageData(): Promise<HomepageData> {
  const [treks, organizers] = await Promise.all([
    getTreksIndex(),
    getOrganizerIndex(),
  ]);

  return {
    featuredTreks: treks.slice(0, 3),
    organizerCount: organizers.length,
    trekCount: treks.length,
    packageCount: treks.reduce((count, item) => count + item.packageCount, 0),
    priceFloor: treks
      .map((item) => item.priceMin)
      .filter((item): item is number => item !== null)
      .sort((left, right) => left - right)[0] ?? null,
    lastUpdatedAt: maxUpdatedAt([
      ...treks.map((item) => item.updatedAt),
      ...organizers.map((item) => item.updatedAt),
    ]),
  };
}