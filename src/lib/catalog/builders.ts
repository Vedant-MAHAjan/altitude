import { normalizeWhitespace } from "@/lib/normalization/extractors";
import {
  coerceListingCity,
  resolveDepartureCityAssignment,
} from "@/lib/normalization/departure-city";
import {
  buildVariantLabel,
  buildVariantSignature,
} from "@/lib/normalization/trek-identity";
import type {
  ComparisonFilters,
  ComparisonPackage,
  ComparisonSummaryTable,
  ComparisonTransportType,
  DepartureCityCode,
  DestinationCityComparison,
  DestinationCitySummary,
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
  VariantGroupSummary,
  VariantTagCode,
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
  rawSnapshot: unknown | null;
  normalizedSnapshot: unknown | null;
  pickupLocations: string[];
  lastScrapedAt: Date;
  organizer: OrganizerProjection;
  trek?: TrekProjection;
};

export type CatalogSnapshotPayload = {
  homepage: HomepageData;
  treks: TrekSummary[];
  destinationCards: DestinationCitySummary[];
  destinationDetails: Record<string, DestinationCityComparison>;
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

function readVariantTags(normalizedSnapshot: unknown): VariantTagCode[] {
  const snapshot = isRecord(normalizedSnapshot) ? normalizedSnapshot : null;
  const tags = readStringArray(snapshot?.variantTags).filter((item): item is VariantTagCode =>
    item === "TREK_ONLY" ||
    item === "CAMPING" ||
    item === "SUNRISE" ||
    item === "NIGHT_TREK" ||
    item === "FIREFLIES",
  );

  return tags.length > 0 ? tags : (["TREK_ONLY"] as VariantTagCode[]);
}

function cityToRouteSegment(city: DepartureCityCode) {
  return city.toLowerCase();
}

function matchesDepartureCity(listingCity: ListingCity, city: DepartureCityCode) {
  return city === "MUMBAI"
    ? listingCity === "MUMBAI" || listingCity === "MIXED"
    : listingCity === "PUNE" || listingCity === "MIXED";
}

function buildVariantGroupSummary(packages: ComparisonPackage[]): VariantGroupSummary[] {
  const groups = new Map<string, VariantGroupSummary & { packageIds: string[] }>();

  for (const item of packages) {
    const existing = groups.get(item.variantSignature);

    if (existing) {
      existing.packageCount += 1;
      existing.packageIds.push(item.id);
      existing.priceMin =
        existing.priceMin === null
          ? item.priceInr
          : item.priceInr === null
            ? existing.priceMin
            : Math.min(existing.priceMin, item.priceInr);
      existing.priceMax =
        existing.priceMax === null
          ? item.priceInr
          : item.priceInr === null
            ? existing.priceMax
            : Math.max(existing.priceMax, item.priceInr);
      continue;
    }

    groups.set(item.variantSignature, {
      signature: item.variantSignature,
      label: item.variantLabel,
      tags: item.variantTags,
      packageCount: 1,
      priceMin: item.priceInr,
      priceMax: item.priceInr,
      packageIds: [item.id],
    });
  }

  return [...groups.values()]
    .map(({ packageIds, ...summary }) => summary)
    .sort((left, right) => (left.priceMin ?? Number.MAX_SAFE_INTEGER) - (right.priceMin ?? Number.MAX_SAFE_INTEGER) || left.label.localeCompare(right.label));
}

function buildCityDestinationGroups(packages: ComparisonPackage[]) {
  const destinationGroups = new Map<
    string,
    {
      trekName: string;
      trekSlug: string;
      trekSummary: string | null;
      routePath: string;
      city: DepartureCityCode;
      packages: ComparisonPackage[];
    }
  >();

  for (const city of ["MUMBAI", "PUNE"] as const) {
    for (const item of packages) {
      if (!item.trekSlug || !item.trekName || !matchesDepartureCity(item.listingCity, city)) {
        continue;
      }

      const key = `${item.trekSlug}:${city}`;
      const existing = destinationGroups.get(key);

      if (existing) {
        existing.packages.push(item);
        continue;
      }

      destinationGroups.set(key, {
        trekName: item.trekName,
        trekSlug: item.trekSlug,
        trekSummary: item.trekSummary ?? null,
        routePath: `/treks/${item.trekSlug}/${cityToRouteSegment(city)}`,
        city,
        packages: [item],
      });
    }
  }

  return [...destinationGroups.values()];
}

function deriveListingCity(input: {
  title: string;
  organizerSlug: string;
  normalizedSnapshot: unknown;
  rawSnapshot: unknown;
  transportSignals: string;
  pickupLocations: string[];
}): ListingCity {
  const snapshot = isRecord(input.normalizedSnapshot) ? input.normalizedSnapshot : null;
  const storedListingCity = coerceListingCity(snapshot?.listingCity);

  if (storedListingCity) {
    return storedListingCity;
  }

  return resolveDepartureCityAssignment({
    title: input.title,
    pickupLocations: input.pickupLocations,
    organizerSlug: input.organizerSlug,
  }).listingCity;
}

function readDerivedDisplayDetails(input: {
  title: string;
  organizerSlug: string;
  normalizedSnapshot: unknown;
  rawSnapshot: unknown;
  transportSignals: string;
  pickupLocations: string[];
}): DerivedDisplayDetails {
  const snapshot = isRecord(input.normalizedSnapshot) ? input.normalizedSnapshot : null;
  const pipeline = snapshot && isRecord(snapshot.pipeline) ? snapshot.pipeline : null;
  const derived = pipeline && isRecord(pipeline.derived) ? pipeline.derived : null;

  return {
    listingCity: deriveListingCity(input),
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
  variantLabel?: string | null;
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
      input.variantLabel,
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
    variantTags: uniqueValues(packages.flatMap((item) => item.variantTags)),
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
    variantCount: new Set(packages.map((item) => item.variantSignature)).size,
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
  const derivedDetails = readDerivedDisplayDetails({
    title: record.title,
    organizerSlug: record.organizer.slug,
    normalizedSnapshot: record.normalizedSnapshot,
    rawSnapshot: record.rawSnapshot,
    transportSignals,
    pickupLocations: record.pickupLocations,
  });
  const transportType = toComparisonTransportType(record.transportType, transportSignals);
  const lastUpdatedAt = record.lastScrapedAt.toISOString();
  const variantTags = readVariantTags(record.normalizedSnapshot);
  const variantSignature =
    readString(isRecord(record.normalizedSnapshot) ? record.normalizedSnapshot.variantSignature : null) ??
    buildVariantSignature(variantTags);
  const variantLabel =
    readString(isRecord(record.normalizedSnapshot) ? record.normalizedSnapshot.variantLabel : null) ??
    buildVariantLabel(variantTags);

  return {
    id: record.id,
    title: record.title,
    organizerName: record.organizer.name,
    organizerSlug: record.organizer.slug,
    trekName: record.trek?.name,
    trekSlug: record.trek?.slug,
    trekSummary: record.trek?.summary ?? null,
    sourceUrl: record.sourceUrl,
    priceInr: record.priceInr,
    priceText: record.priceText,
    transportType,
    mealPlan: record.mealPlan as MealPlan,
    forestFeeStatus: record.forestFeeStatus as InclusionStatus,
    listingCity: derivedDetails.listingCity,
    variantTags,
    variantSignature,
    variantLabel,
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
      variantLabel,
      mealsSummary: derivedDetails.mealsSummary,
      staySummary: derivedDetails.staySummary,
      inclusionHighlights: derivedDetails.inclusionHighlights,
      pickupLocations: transportType === "TRAIN" ? [] : record.pickupLocations,
    }),
  };
}

export type PendingOrganizerEntry = {
  organizerName: string;
  organizerSlug: string;
  organizerWebsiteUrl: string;
  trekSlug: string;
  trekName: string;
};

export function buildPendingPlaceholderRow(
  entry: PendingOrganizerEntry,
): ComparisonPackage {
  return {
    id: `pending:${entry.organizerSlug}:${entry.trekSlug}`,
    title: "Data under review",
    organizerName: entry.organizerName,
    organizerSlug: entry.organizerSlug,
    trekName: entry.trekName,
    trekSlug: entry.trekSlug,
    trekSummary: null,
    sourceUrl: entry.organizerWebsiteUrl,
    priceInr: null,
    priceText: null,
    transportType: "NON_AC_BUS",
    mealPlan: "UNKNOWN",
    forestFeeStatus: "UNKNOWN",
    listingCity: "OTHER",
    variantTags: ["TREK_ONLY"],
    variantSignature: "TREK_ONLY",
    variantLabel: "Trek Only",
    mealsSummary: null,
    staySummary: null,
    inclusionHighlights: [],
    pickupLocations: [],
    lastUpdatedAt: new Date().toISOString(),
    updatedAtMs: Date.now(),
    searchText: `${entry.organizerName} ${entry.trekName}`.toLowerCase(),
    isPending: true,
    organizerWebsiteUrl: entry.organizerWebsiteUrl,
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

function buildDestinationCitySummary(
  group: ReturnType<typeof buildCityDestinationGroups>[number],
): DestinationCitySummary {
  const packages = sortPackages(group.packages);
  const prices = priceRange(packages);
  const availableVariants = uniqueValues(packages.flatMap((item) => item.variantTags)).sort(
    (left, right) => {
      const order: VariantTagCode[] = ["SUNRISE", "NIGHT_TREK", "FIREFLIES", "CAMPING", "TREK_ONLY"];

      return order.indexOf(left) - order.indexOf(right);
    },
  );

  return {
    destinationName: group.trekName,
    destinationSlug: group.trekSlug,
    departureCity: group.city,
    routePath: group.routePath,
    availableVariants,
    startingPrice: prices.min,
    organizerCount: new Set(packages.map((item) => item.organizerSlug)).size,
    packageCount: packages.length,
    updatedAt: maxUpdatedAt(packages.map((item) => item.lastUpdatedAt)),
    summary: group.trekSummary,
  };
}

export function buildDestinationCityComparison(
  group: ReturnType<typeof buildCityDestinationGroups>[number],
): DestinationCityComparison {
  const packages = sortPackages(group.packages);
  const prices = priceRange(packages);

  return {
    destinationName: group.trekName,
    destinationSlug: group.trekSlug,
    departureCity: group.city,
    routePath: group.routePath,
    summary: group.trekSummary,
    packageCount: packages.length,
    organizerCount: new Set(packages.map((item) => item.organizerSlug)).size,
    startingPrice: prices.min,
    priceMin: prices.min,
    priceMax: prices.max,
    availableVariants: uniqueValues(packages.flatMap((item) => item.variantTags)).sort((left, right) => {
      const order: VariantTagCode[] = ["SUNRISE", "NIGHT_TREK", "FIREFLIES", "CAMPING", "TREK_ONLY"];

      return order.indexOf(left) - order.indexOf(right);
    }),
    filters: buildComparisonFilters(packages),
    summaryTable: buildComparisonSummaryTable(packages),
    variantGroups: buildVariantGroupSummary(packages),
    packages,
    updatedAt: maxUpdatedAt(packages.map((item) => item.lastUpdatedAt)),
  };
}

export function buildHomepageData(
  destinationCards: DestinationCitySummary[],
  organizers: OrganizerSummary[],
): HomepageData {
  return {
    featuredDestinations: [...destinationCards]
      .sort(
        (left, right) =>
          right.packageCount - left.packageCount ||
          left.destinationName.localeCompare(right.destinationName) ||
          left.departureCity.localeCompare(right.departureCity),
      )
      .slice(0, 3),
    routeCount: destinationCards.length,
    organizerCount: organizers.length,
    packageCount: destinationCards.reduce((count, item) => count + item.packageCount, 0),
    priceFloor: destinationCards
      .map((item) => item.startingPrice)
      .filter((item): item is number => item !== null)
      .sort((left, right) => left - right)[0] ?? null,
    lastUpdatedAt: maxUpdatedAt([
      ...destinationCards.map((item) => item.updatedAt),
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
  legacyTreks: TrekSummary[],
  destinationCards: DestinationCitySummary[],
  organizers: OrganizerSummary[],
  generatedAt: string,
): SnapshotManifest {
  const trekSlugs = legacyTreks.map((item) => item.slug);
  const destinationRoutePaths = destinationCards.map((item) => item.routePath);
  const organizerSlugs = organizers.map((item) => item.slug);
  const popularTreks = [...legacyTreks].sort(
    (left, right) =>
      right.packageCount - left.packageCount ||
      (Date.parse(right.updatedAt ?? "1970-01-01T00:00:00.000Z") -
        Date.parse(left.updatedAt ?? "1970-01-01T00:00:00.000Z")) ||
      left.name.localeCompare(right.name),
  );
  const popularDestinationCards = [...destinationCards].sort(
    (left, right) =>
      right.packageCount - left.packageCount ||
      (Date.parse(right.updatedAt ?? "1970-01-01T00:00:00.000Z") -
        Date.parse(left.updatedAt ?? "1970-01-01T00:00:00.000Z")) ||
      left.destinationName.localeCompare(right.destinationName) ||
      left.departureCity.localeCompare(right.departureCity),
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
    destinationRoutePaths,
    organizerSlugs,
    featuredTrekSlugs: popularTreks.slice(0, 6).map((item) => item.slug),
    featuredDestinationRoutePaths: popularDestinationCards.slice(0, 6).map((item) => item.routePath),
    featuredOrganizerSlugs: popularOrganizers.slice(0, 6).map((item) => item.slug),
    prerenderTrekSlugs: popularTreks.slice(0, 24).map((item) => item.slug),
    prerenderDestinationRoutePaths: popularDestinationCards.slice(0, 24).map((item) => item.routePath),
    prerenderOrganizerSlugs: popularOrganizers.slice(0, 16).map((item) => item.slug),
  };
}

export function buildCatalogSnapshotPayload(params: {
  packages: PackageProjection[];
  search: TrekSearchEntry[];
  pendingOrganizers?: PendingOrganizerEntry[];
  generatedAt?: string;
}): CatalogSnapshotPayload {
  const trekGroups = new Map<string, { trek: TrekProjection; packages: PackageProjection[] }>();
  const organizerGroups = new Map<string, { organizer: OrganizerProjection; packages: PackageProjection[] }>();
  const comparisonPackages = params.packages.map((item) => toComparisonPackage(item));

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

  const destinationGroups = buildCityDestinationGroups(comparisonPackages);

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
  const destinationCards = destinationGroups
    .map(buildDestinationCitySummary)
    .sort(
      (left, right) =>
        right.packageCount - left.packageCount ||
        left.destinationName.localeCompare(right.destinationName) ||
        left.departureCity.localeCompare(right.departureCity),
    );
  const destinationDetails = Object.fromEntries(
    destinationGroups
      .map((group) => [group.routePath, buildDestinationCityComparison(group)] as const)
      .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath)),
  ) as Record<string, DestinationCityComparison>;

  // Inject pending organizer placeholder rows into destination details
  if (params.pendingOrganizers && params.pendingOrganizers.length > 0) {
    for (const entry of params.pendingOrganizers) {
      const placeholder = buildPendingPlaceholderRow(entry);

      // Add to all destination/city routes that match this trek
      for (const [routePath, detail] of Object.entries(destinationDetails)) {
        if (detail.destinationSlug === entry.trekSlug) {
          detail.packages.push(placeholder);
        }
      }

      // Also add to trek details
      const trekDetail = trekDetails[entry.trekSlug];
      if (trekDetail) {
        trekDetail.packages.push(placeholder);
      }
    }
  }

  const homepage = buildHomepageData(destinationCards, organizers);
  const generatedAt = params.generatedAt ?? new Date().toISOString();

  return {
    homepage,
    treks,
    destinationCards,
    destinationDetails,
    organizers,
    trekDetails,
    organizerDetails,
    search: params.search,
    manifest: buildSnapshotManifest(treks, destinationCards, organizers, generatedAt),
  };
}