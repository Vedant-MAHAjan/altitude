import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import {
  buildCatalogSnapshotPayload,
  buildDestinationCityComparison,
  buildOrganizerDetail,
  buildTrekComparison,
  buildTrekSearchEntries,
} from "@/lib/catalog/builders";
import {
  readActivePackagesForOrganizer,
  readActivePackagesForTrek,
  readAllActivePackageProjections,
  readTrekSearchEntries,
} from "@/lib/catalog/queries";
import {
  readDestinationCityComparisonSnapshot,
  readHomepageSnapshot,
  readOrganizerDetailSnapshot,
  readOrganizerIndexSnapshot,
  readSnapshotManifest,
  readTrekComparisonSnapshot,
  readTrekSearchSnapshot,
  readTreksIndexSnapshot,
} from "@/lib/catalog/snapshots";
import { getPrismaClient } from "@/lib/prisma";
import {
  buildVariantLabel,
  buildVariantSignature,
  getCanonicalTrekIdentity,
} from "@/lib/normalization/trek-identity";
import type {
  ComparisonPackage,
  DepartureCityCode,
  DestinationCityComparison,
  DestinationCitySummary,
  HomepageData,
  OrganizerDetail,
  OrganizerSummary,
  SnapshotManifest,
  TrekComparison,
  TrekSearchEntry,
  TrekSummary,
  VariantTagCode,
} from "@/lib/types";

function applyCatalogCache(tags: string[]) {
  cacheLife({
    stale: 60 * 60,
    revalidate: 30 * 60,
    expire: 7 * 24 * 60 * 60,
  });

  for (const tag of tags) {
    cacheTag(tag);
  }
}

function applySearchCache(tags: string[]) {
  cacheLife({
    stale: 12 * 60 * 60,
    revalidate: 6 * 60 * 60,
    expire: 7 * 24 * 60 * 60,
  });

  for (const tag of tags) {
    cacheTag(tag);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function synthesizeDestinationRoutePaths(slugs: string[]) {
  return slugs.flatMap((slug) => [`/treks/${slug}/mumbai`, `/treks/${slug}/pune`]);
}

function normalizeManifestSnapshot(snapshot: SnapshotManifest | null): SnapshotManifest | null {
  if (!snapshot) {
    return null;
  }

  const trekSlugs = Array.isArray(snapshot.trekSlugs) ? snapshot.trekSlugs : [];
  const featuredTrekSlugs = Array.isArray(snapshot.featuredTrekSlugs) ? snapshot.featuredTrekSlugs : [];
  const prerenderTrekSlugs = Array.isArray(snapshot.prerenderTrekSlugs) ? snapshot.prerenderTrekSlugs : [];

  return {
    ...snapshot,
    destinationRoutePaths:
      Array.isArray(snapshot.destinationRoutePaths) && snapshot.destinationRoutePaths.length > 0
        ? snapshot.destinationRoutePaths
        : synthesizeDestinationRoutePaths(trekSlugs),
    featuredDestinationRoutePaths:
      Array.isArray(snapshot.featuredDestinationRoutePaths) &&
      snapshot.featuredDestinationRoutePaths.length > 0
        ? snapshot.featuredDestinationRoutePaths
        : synthesizeDestinationRoutePaths(featuredTrekSlugs),
    prerenderDestinationRoutePaths:
      Array.isArray(snapshot.prerenderDestinationRoutePaths) &&
      snapshot.prerenderDestinationRoutePaths.length > 0
        ? snapshot.prerenderDestinationRoutePaths
        : synthesizeDestinationRoutePaths(prerenderTrekSlugs),
  };
}

function isDestinationCitySummary(value: unknown): value is DestinationCitySummary {
  return (
    isRecord(value) &&
    typeof value.routePath === "string" &&
    typeof value.destinationName === "string" &&
    typeof value.departureCity === "string"
  );
}

function isDestinationCitySummaryArray(value: unknown): value is DestinationCitySummary[] {
  return Array.isArray(value) && value.every(isDestinationCitySummary);
}

function isHomepageData(value: unknown): value is HomepageData {
  return isRecord(value) && Array.isArray(value.featuredDestinations) && typeof value.routeCount === "number";
}

async function getCachedCatalogFallback() {
  "use cache";

  applyCatalogCache(["catalog", "treks", "organizers", "homepage"]);

  const prisma = getPrismaClient();

  if (!prisma) {
    return {
      homepage: {
        featuredDestinations: [],
        routeCount: 0,
        organizerCount: 0,
        packageCount: 0,
        priceFloor: null,
        lastUpdatedAt: null,
      } satisfies HomepageData,
      treks: [] as TrekSummary[],
      destinationCards: [] as DestinationCitySummary[],
      destinationDetails: {} as Record<string, DestinationCityComparison>,
      organizers: [] as OrganizerSummary[],
      manifest: {
        generatedAt: new Date(0).toISOString(),
        trekSlugs: [],
        destinationRoutePaths: [],
        organizerSlugs: [],
        featuredTrekSlugs: [],
        featuredDestinationRoutePaths: [],
        featuredOrganizerSlugs: [],
        prerenderTrekSlugs: [],
        prerenderDestinationRoutePaths: [],
        prerenderOrganizerSlugs: [],
      } satisfies SnapshotManifest,
    };
  }

  try {
    const packages = await readAllActivePackageProjections(prisma);
    const payload = buildCatalogSnapshotPayload({
      packages,
      search: [],
    });

    return {
      homepage: payload.homepage,
      treks: payload.treks,
      destinationCards: payload.destinationCards,
      destinationDetails: payload.destinationDetails,
      organizers: payload.organizers,
      manifest: payload.manifest,
    };
  } catch (error) {
    console.error("Failed to build catalog fallback", error);

    return {
      homepage: {
        featuredDestinations: [],
        routeCount: 0,
        organizerCount: 0,
        packageCount: 0,
        priceFloor: null,
        lastUpdatedAt: null,
      } satisfies HomepageData,
      treks: [] as TrekSummary[],
      destinationCards: [] as DestinationCitySummary[],
      destinationDetails: {} as Record<string, DestinationCityComparison>,
      organizers: [] as OrganizerSummary[],
      manifest: {
        generatedAt: new Date(0).toISOString(),
        trekSlugs: [],
        destinationRoutePaths: [],
        organizerSlugs: [],
        featuredTrekSlugs: [],
        featuredDestinationRoutePaths: [],
        featuredOrganizerSlugs: [],
        prerenderTrekSlugs: [],
        prerenderDestinationRoutePaths: [],
        prerenderOrganizerSlugs: [],
      } satisfies SnapshotManifest,
    };
  }
}

async function getCachedSnapshotManifest() {
  "use cache";

  applyCatalogCache(["catalog", "manifest"]);

  const snapshot = await readSnapshotManifest();

  if (snapshot) {
    return normalizeManifestSnapshot(snapshot) ?? (await getCachedCatalogFallback()).manifest;
  }

  return (await getCachedCatalogFallback()).manifest;
}

async function getCachedTreksIndex() {
  "use cache";

  applyCatalogCache(["catalog", "treks"]);

  const snapshot = await readTreksIndexSnapshot();

  if (isDestinationCitySummaryArray(snapshot)) {
    return snapshot;
  }

  return (await getCachedCatalogFallback()).destinationCards;
}

async function getCachedDestinationCityComparison(destinationSlug: string, city: string) {
  "use cache";

  applyCatalogCache(["catalog", "treks", `destination:${destinationSlug}:${city}`]);

  const snapshot = await readDestinationCityComparisonSnapshot(destinationSlug, city);

  if (snapshot) {
    return snapshot;
  }

  const fallback = await getCachedCatalogFallback();

  const destinationRoutePath = `/treks/${destinationSlug}/${city}`;

  if (fallback.destinationDetails[destinationRoutePath]) {
    return fallback.destinationDetails[destinationRoutePath];
  }

  const legacyComparison = await getCachedTrekComparison(destinationSlug);

  if (!legacyComparison) {
    return null;
  }

  return buildDestinationCityComparisonFromLegacy(legacyComparison, city);
}

function matchesDepartureCity(listingCity: string, city: DepartureCityCode) {
  if (city === "MUMBAI") {
    return listingCity === "MUMBAI" || listingCity === "MIXED";
  }

  return listingCity === "PUNE" || listingCity === "MIXED";
}

function coerceComparisonPackage(item: ComparisonPackage): ComparisonPackage {
  const fallbackIdentity = getCanonicalTrekIdentity(item.title, item.trekName ?? null);
  const variantTags =
    Array.isArray(item.variantTags) && item.variantTags.length > 0
      ? (item.variantTags as VariantTagCode[])
      : fallbackIdentity.variantTags;
  const variantSignature = item.variantSignature || buildVariantSignature(variantTags);
  const variantLabel = item.variantLabel || buildVariantLabel(variantTags);

  return {
    ...item,
    variantTags,
    variantSignature,
    variantLabel,
    nextDepartureAt: item.nextDepartureAt ?? null,
    trekSummary: item.trekSummary ?? null,
  };
}

function buildDestinationCityComparisonFromLegacy(
  comparison: TrekComparison,
  city: string,
): DestinationCityComparison | null {
  const cityCode = city.toUpperCase() as DepartureCityCode;
  const packages = comparison.packages
    .filter((item) => matchesDepartureCity(item.listingCity, cityCode))
    .map(coerceComparisonPackage);

  if (packages.length === 0) {
    return null;
  }

  return buildDestinationCityComparison({
    trekName: comparison.name,
    trekSlug: comparison.slug,
    trekSummary: comparison.summary ?? null,
    routePath: `/treks/${comparison.slug}/${city}`,
    city: cityCode,
    packages,
  });
}

async function getCachedHomepageData() {
  "use cache";

  applyCatalogCache(["catalog", "homepage"]);

  const snapshot = await readHomepageSnapshot();

  if (isHomepageData(snapshot)) {
    return snapshot;
  }

  return (await getCachedCatalogFallback()).homepage;
}

async function getCachedOrganizerIndex() {
  "use cache";

  applyCatalogCache(["catalog", "organizers"]);

  const snapshot = await readOrganizerIndexSnapshot();

  if (snapshot) {
    return snapshot;
  }

  return (await getCachedCatalogFallback()).organizers;
}

async function getCachedTrekSearchIndex() {
  "use cache";

  applySearchCache(["catalog", "treks", "search"]);

  const snapshot = await readTrekSearchSnapshot();

  if (snapshot) {
    return snapshot;
  }

  const prisma = getPrismaClient();

  if (!prisma) {
    return [] as TrekSearchEntry[];
  }

  try {
    const treks = await readTrekSearchEntries(prisma);
    return buildTrekSearchEntries(treks);
  } catch (error) {
    console.error("Failed to fetch trek search index", error);
    return [] as TrekSearchEntry[];
  }
}

async function getCachedTrekComparison(slug: string) {
  "use cache";

  applyCatalogCache(["catalog", "treks", `trek:${slug}`]);

  const snapshot = await readTrekComparisonSnapshot(slug);

  if (snapshot) {
    return snapshot;
  }

  const prisma = getPrismaClient();

  if (!prisma) {
    return null;
  }

  try {
    const packages = await readActivePackagesForTrek(prisma, slug);

    if (packages.length === 0 || !packages[0]?.trek) {
      return null;
    }

    return buildTrekComparison(packages[0].trek, packages);
  } catch (error) {
    console.error(`Failed to fetch trek comparison for ${slug}`, error);
    return null;
  }
}

async function getCachedOrganizerDetail(slug: string) {
  "use cache";

  applyCatalogCache(["catalog", "organizers", `organizer:${slug}`]);

  const snapshot = await readOrganizerDetailSnapshot(slug);

  if (snapshot) {
    return snapshot;
  }

  const prisma = getPrismaClient();

  if (!prisma) {
    return null;
  }

  try {
    const packages = await readActivePackagesForOrganizer(prisma, slug);

    if (packages.length === 0) {
      return null;
    }

    return buildOrganizerDetail(packages[0].organizer, packages);
  } catch (error) {
    console.error(`Failed to fetch organizer detail for ${slug}`, error);
    return null;
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

export async function getDestinationCityIndex() {
  return getCachedTreksIndex();
}

export async function getDestinationCityComparison(destinationSlug: string, city: string) {
  return getCachedDestinationCityComparison(destinationSlug, city);
}

export async function getTrekSlugs() {
  const manifest = await getCachedSnapshotManifest();
  return manifest.trekSlugs;
}

export async function getDestinationRoutePaths() {
  const manifest = await getCachedSnapshotManifest();
  return manifest.destinationRoutePaths;
}

export async function getPrerenderTrekSlugs() {
  const manifest = await getCachedSnapshotManifest();
  return manifest.prerenderTrekSlugs;
}

export async function getPrerenderDestinationRoutePaths() {
  const manifest = await getCachedSnapshotManifest();
  return manifest.prerenderDestinationRoutePaths;
}

export async function getOrganizerIndex() {
  return getCachedOrganizerIndex();
}

export async function getOrganizerBySlug(slug: string) {
  return getCachedOrganizerDetail(slug);
}

export async function getOrganizerSlugs() {
  const manifest = await getCachedSnapshotManifest();
  return manifest.organizerSlugs;
}

export async function getPrerenderOrganizerSlugs() {
  const manifest = await getCachedSnapshotManifest();
  return manifest.prerenderOrganizerSlugs;
}

export async function getHomepageData() {
  return getCachedHomepageData();
}