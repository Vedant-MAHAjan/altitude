import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import {
  buildCatalogSnapshotPayload,
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
  readHomepageSnapshot,
  readOrganizerDetailSnapshot,
  readOrganizerIndexSnapshot,
  readSnapshotManifest,
  readTrekComparisonSnapshot,
  readTrekSearchSnapshot,
  readTreksIndexSnapshot,
} from "@/lib/catalog/snapshots";
import { getPrismaClient } from "@/lib/prisma";
import type {
  HomepageData,
  OrganizerDetail,
  OrganizerSummary,
  SnapshotManifest,
  TrekComparison,
  TrekSearchEntry,
  TrekSummary,
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

async function getCachedCatalogFallback() {
  "use cache";

  applyCatalogCache(["catalog", "treks", "organizers", "homepage"]);

  const prisma = getPrismaClient();

  if (!prisma) {
    return {
      homepage: {
        featuredTreks: [],
        organizerCount: 0,
        trekCount: 0,
        packageCount: 0,
        priceFloor: null,
        lastUpdatedAt: null,
      } satisfies HomepageData,
      treks: [] as TrekSummary[],
      organizers: [] as OrganizerSummary[],
      manifest: {
        generatedAt: new Date(0).toISOString(),
        trekSlugs: [],
        organizerSlugs: [],
        featuredTrekSlugs: [],
        featuredOrganizerSlugs: [],
        prerenderTrekSlugs: [],
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
      organizers: payload.organizers,
      manifest: payload.manifest,
    };
  } catch (error) {
    console.error("Failed to build catalog fallback", error);

    return {
      homepage: {
        featuredTreks: [],
        organizerCount: 0,
        trekCount: 0,
        packageCount: 0,
        priceFloor: null,
        lastUpdatedAt: null,
      } satisfies HomepageData,
      treks: [] as TrekSummary[],
      organizers: [] as OrganizerSummary[],
      manifest: {
        generatedAt: new Date(0).toISOString(),
        trekSlugs: [],
        organizerSlugs: [],
        featuredTrekSlugs: [],
        featuredOrganizerSlugs: [],
        prerenderTrekSlugs: [],
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
    return snapshot;
  }

  return (await getCachedCatalogFallback()).manifest;
}

async function getCachedTreksIndex() {
  "use cache";

  applyCatalogCache(["catalog", "treks"]);

  const snapshot = await readTreksIndexSnapshot();

  if (snapshot) {
    return snapshot;
  }

  return (await getCachedCatalogFallback()).treks;
}

async function getCachedHomepageData() {
  "use cache";

  applyCatalogCache(["catalog", "homepage"]);

  const snapshot = await readHomepageSnapshot();

  if (snapshot) {
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

export async function getTrekSlugs() {
  const manifest = await getCachedSnapshotManifest();
  return manifest.trekSlugs;
}

export async function getPrerenderTrekSlugs() {
  const manifest = await getCachedSnapshotManifest();
  return manifest.prerenderTrekSlugs;
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