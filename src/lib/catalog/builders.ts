import { normalizeWhitespace } from "@/lib/normalization/extractors";
import type {
  ComparisonFilters,
  ComparisonPackage,
  ComparisonSummaryTable,
  ComparisonTransportType,
  DifficultyLevel,
  HomepageData,
  InclusionStatus,
  ListingCity,
  MealPlan,
  OrganizerDetail,
  OrganizerSummary,
  SnapshotManifest,
  TrekComparison,
  TrekSearchEntry,
  TrekSummary,
} from "@/lib/types";

type DerivedDisplayDetails = {
  listingCity: ListingCity;
  mealsSummary: string | null;
  staySummary: string | null;
  inclusionHighlights: string[];
};

export type TrekProjection = {
  name: string;
  slug: string;
  region: string | null;
  durationDays: number | null;
  durationNights: number | null;
  difficulty: string;
  summary: string | null;
};

export type OrganizerProjection = {
  name: string;
  slug: string;
  websiteUrl: string;
  description: string | null;
};

export type PackageProjection = {
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
  mealPlan: string;
  forestFeeStatus: string;
  normalizedSnapshot: unknown | null;
  pickupLocations: string[];
  lastScrapedAt: Date;
  organizer: OrganizerProjection;
  trek?: TrekProjection;
};

export type CatalogSnapshotPayload = {
  homepage: HomepageData;
  treks: TrekSummary[];
  organizers: OrganizerSummary[];
  trekDetails: Record<string, TrekComparison>;
  organizerDetails: Record<string, OrganizerDetail>;
  search: TrekSearchEntry[];
  manifest: SnapshotManifest;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
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
    mealsSummary: readString(derived?.mealsSummary),
    staySummary: readString(derived?.staySummary),
    inclusionHighlights: readStringArray(derived?.inclusionHighlights),
  };
}

function toComparisonTransportType(
  transportType: string,
  transportSignals: string | null,
): ComparisonTransportType {
  const normalizedText = normalizeWhitespace(transportSignals).toLowerCase();

  if (transportType === "TRAIN" || /\btrain\b/.test(normalizedText)) {
    return "TRAIN";
  }

  if (/\bnon[-\s]?ac\b/.test(normalizedText) || /\bpushback\b/.test(normalizedText)) {
    return "NON_AC_BUS";
  }

  if (/\bac\b/.test(normalizedText) || /\bvolvo\b/.test(normalizedText) || /\bac coach\b/.test(normalizedText)) {
    return "AC_BUS";
  }

  return "NON_AC_BUS";
}

function buildSearchText(input: {
  organizerName: string;
  title: string;
  trekName?: string;
  listingCity: ListingCity;
  mealsSummary: string | null;
  staySummary: string | null;
  inclusionHighlights: string[];
  pickupLocations: string[];
}) {
  return normalizeWhitespace(
    [
      input.organizerName,
      input.title,
      input.trekName,
      input.listingCity,
      input.mealsSummary,
      input.staySummary,
      ...input.inclusionHighlights,
      ...input.pickupLocations,
    ]
      .filter(Boolean)
      .join(" "),
  ).toLowerCase();
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

function buildComparisonFilters(packages: ComparisonPackage[]): ComparisonFilters {
  return {
    transportTypes: uniqueValues(packages.map((item) => item.transportType)),
    mealPlans: uniqueValues(packages.map((item) => item.mealPlan)),
    cities: uniqueValues(
      packages
        .map((item) => item.listingCity)
        .filter((item): item is Exclude<ListingCity, "OTHER"> => item !== "OTHER"),
    ),
    organizers: [...new Map(packages.map((item) => [item.organizerSlug, {
      name: item.organizerName,
      slug: item.organizerSlug,
    }])).values()].sort((left, right) => left.name.localeCompare(right.name)),
  };
}

function buildComparisonSummaryTable(packages: ComparisonPackage[]): ComparisonSummaryTable {
  const cheapestPackage = [...packages]
    .filter((item) => item.priceInr !== null)
    .sort((left, right) => (left.priceInr as number) - (right.priceInr as number))[0] ?? null;

  const mealsSummary = uniqueValues(
    packages
      .flatMap((item) => (item.mealsSummary ? item.mealsSummary.split(",") : []))
      .map((value) => value.trim())
      .filter(Boolean),
  ).slice(0, 6);

  return {
    lowestPrice: cheapestPackage?.priceInr ?? null,
    cheapestOrganizerName: cheapestPackage?.organizerName ?? null,
    cheapestOrganizerSlug: cheapestPackage?.organizerSlug ?? null,
    cheapestPackageTitle: cheapestPackage?.title ?? null,
    mealsSummary,
    organizerCount: new Set(packages.map((item) => item.organizerSlug)).size,
  };
}

export function toComparisonPackage(record: PackageProjection): ComparisonPackage {
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
  const transportType = toComparisonTransportType(record.transportType, transportSignals);
  const lastUpdatedAt = record.lastScrapedAt.toISOString();

  return {
    id: record.id,
    title: record.title,
    organizerName: record.organizer.name,
    organizerSlug: record.organizer.slug,
    trekName: record.trek?.name,
    trekSlug: record.trek?.slug,
    sourceUrl: record.sourceUrl,
    priceInr: record.priceInr,
    priceText: record.priceText,
    transportType,
    mealPlan: record.mealPlan as MealPlan,
    forestFeeStatus: record.forestFeeStatus as InclusionStatus,
    listingCity: derivedDetails.listingCity,
    mealsSummary: derivedDetails.mealsSummary,
    staySummary: derivedDetails.staySummary,
    inclusionHighlights: derivedDetails.inclusionHighlights,
    pickupLocations: transportType === "TRAIN" ? [] : record.pickupLocations,
    lastUpdatedAt,
    updatedAtMs: Date.parse(lastUpdatedAt),
    searchText: buildSearchText({
      organizerName: record.organizer.name,
      title: record.title,
      trekName: record.trek?.name,
      listingCity: derivedDetails.listingCity,
      mealsSummary: derivedDetails.mealsSummary,
      staySummary: derivedDetails.staySummary,
      inclusionHighlights: derivedDetails.inclusionHighlights,
      pickupLocations: transportType === "TRAIN" ? [] : record.pickupLocations,
    }),
  };
}

export function summarizeTrek(comparison: TrekComparison): TrekSummary {
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

export function summarizeOrganizer(detail: OrganizerDetail): OrganizerSummary {
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
  };
}

export function buildTrekComparison(trek: TrekProjection, packageRecords: PackageProjection[]): TrekComparison {
  const packages = sortPackages(
    packageRecords.map((item) =>
      toComparisonPackage({
        ...item,
        trek,
      }),
    ),
  );
  const prices = priceRange(packages);

  return {
    name: trek.name,
    slug: trek.slug,
    region: trek.region,
    durationDays: trek.durationDays,
    durationNights: trek.durationNights,
    difficulty: trek.difficulty as DifficultyLevel,
    summary: trek.summary,
    packageCount: packages.length,
    organizerCount: new Set(packages.map((item) => item.organizerSlug)).size,
    priceMin: prices.min,
    priceMax: prices.max,
    updatedAt: maxUpdatedAt(packages.map((item) => item.lastUpdatedAt)),
    filters: buildComparisonFilters(packages),
    summaryTable: buildComparisonSummaryTable(packages),
    packages,
  };
}

export function buildOrganizerDetail(
  organizer: OrganizerProjection,
  packageRecords: PackageProjection[],
): OrganizerDetail {
  const packages = sortPackages(packageRecords.map(toComparisonPackage));
  const prices = priceRange(packages);

  return {
    name: organizer.name,
    slug: organizer.slug,
    websiteUrl: organizer.websiteUrl,
    description: organizer.description,
    packageCount: packages.length,
    activeTreks: new Set(
      packages.map((item) => item.trekSlug).filter((item): item is string => Boolean(item)),
    ).size,
    priceMin: prices.min,
    priceMax: prices.max,
    pickupLocations: uniqueValues(packages.flatMap((item) => item.pickupLocations)),
    updatedAt: maxUpdatedAt(packages.map((item) => item.lastUpdatedAt)),
    treks: [...new Map(
      packages
        .filter((item) => item.trekSlug && item.trekName)
        .map((item) => [item.trekSlug as string, {
          name: item.trekName as string,
          slug: item.trekSlug as string,
        }]),
    ).values()],
    packages,
  };
}

export function buildHomepageData(
  treks: TrekSummary[],
  organizers: OrganizerSummary[],
): HomepageData {
  return {
    featuredTreks: [...treks]
      .sort((left, right) => right.packageCount - left.packageCount || left.name.localeCompare(right.name))
      .slice(0, 3),
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

export function buildTrekSearchEntries(
  records: Array<{ name: string; slug: string; aliases: string[] }>,
): TrekSearchEntry[] {
  return [...records]
    .map((record) => ({
      name: record.name,
      slug: record.slug,
      aliases: uniqueValues([record.name, ...record.aliases]).sort((left, right) =>
        left.localeCompare(right),
      ),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function buildSnapshotManifest(
  treks: TrekSummary[],
  organizers: OrganizerSummary[],
  generatedAt: string,
): SnapshotManifest {
  const trekSlugs = treks.map((item) => item.slug);
  const organizerSlugs = organizers.map((item) => item.slug);
  const popularTreks = [...treks].sort(
    (left, right) =>
      right.packageCount - left.packageCount ||
      (Date.parse(right.updatedAt ?? "1970-01-01T00:00:00.000Z") -
        Date.parse(left.updatedAt ?? "1970-01-01T00:00:00.000Z")) ||
      left.name.localeCompare(right.name),
  );
  const popularOrganizers = [...organizers].sort(
    (left, right) =>
      right.packageCount - left.packageCount ||
      (Date.parse(right.updatedAt ?? "1970-01-01T00:00:00.000Z") -
        Date.parse(left.updatedAt ?? "1970-01-01T00:00:00.000Z")) ||
      left.name.localeCompare(right.name),
  );

  return {
    generatedAt,
    trekSlugs,
    organizerSlugs,
    featuredTrekSlugs: popularTreks.slice(0, 6).map((item) => item.slug),
    featuredOrganizerSlugs: popularOrganizers.slice(0, 6).map((item) => item.slug),
    prerenderTrekSlugs: popularTreks.slice(0, 24).map((item) => item.slug),
    prerenderOrganizerSlugs: popularOrganizers.slice(0, 16).map((item) => item.slug),
  };
}

export function buildCatalogSnapshotPayload(params: {
  packages: PackageProjection[];
  search: TrekSearchEntry[];
  generatedAt?: string;
}): CatalogSnapshotPayload {
  const trekGroups = new Map<string, { trek: TrekProjection; packages: PackageProjection[] }>();
  const organizerGroups = new Map<string, { organizer: OrganizerProjection; packages: PackageProjection[] }>();

  for (const packageRecord of params.packages) {
    if (packageRecord.trek) {
      const trekGroup = trekGroups.get(packageRecord.trek.slug) ?? {
        trek: packageRecord.trek,
        packages: [],
      };
      trekGroup.packages.push(packageRecord);
      trekGroups.set(packageRecord.trek.slug, trekGroup);
    }

    const organizerGroup = organizerGroups.get(packageRecord.organizer.slug) ?? {
      organizer: packageRecord.organizer,
      packages: [],
    };
    organizerGroup.packages.push(packageRecord);
    organizerGroups.set(packageRecord.organizer.slug, organizerGroup);
  }

  const trekDetails = Object.fromEntries(
    [...trekGroups.values()]
      .map(
        ({ trek, packages }) =>
          [trek.slug, buildTrekComparison(trek, packages)] as const,
      )
      .sort(([leftSlug], [rightSlug]) => leftSlug.localeCompare(rightSlug)),
  ) as Record<string, TrekComparison>;
  const organizerDetails = Object.fromEntries(
    [...organizerGroups.values()]
      .map(
        ({ organizer, packages }) =>
          [organizer.slug, buildOrganizerDetail(organizer, packages)] as const,
      )
      .sort(([leftSlug], [rightSlug]) => leftSlug.localeCompare(rightSlug)),
  ) as Record<string, OrganizerDetail>;
  const treks = Object.values(trekDetails)
    .map(summarizeTrek)
    .sort((left, right) => left.name.localeCompare(right.name));
  const organizers = Object.values(organizerDetails)
    .map(summarizeOrganizer)
    .sort((left, right) => left.name.localeCompare(right.name));
  const homepage = buildHomepageData(treks, organizers);
  const generatedAt = params.generatedAt ?? new Date().toISOString();

  return {
    homepage,
    treks,
    organizers,
    trekDetails,
    organizerDetails,
    search: params.search,
    manifest: buildSnapshotManifest(treks, organizers, generatedAt),
  };
}