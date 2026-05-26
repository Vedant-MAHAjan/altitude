import { Prisma, type PrismaClient } from "@prisma/client";

import { TREK_REGION_MAHARASHTRA } from "@/lib/maharashtra-destinations";
import type { TrekSearchEntry } from "@/lib/types";
import type { PackageProjection as CatalogPackageProjection } from "@/lib/catalog/builders";

const activePackageSelect = Prisma.validator<Prisma.TrekPackageSelect>()({
  id: true,
  title: true,
  sourceUrl: true,
  priceInr: true,
  priceText: true,
  nextDepartureAt: true,
  transportType: true,
  rawTransportText: true,
  rawPickupText: true,
  rawDepartureText: true,
  rawInclusionsText: true,
  mealPlan: true,
  forestFeeStatus: true,
  rawSnapshot: true,
  normalizedSnapshot: true,
  pickupLocations: true,
  lastScrapedAt: true,
  organizer: {
    select: {
      name: true,
      slug: true,
      websiteUrl: true,
      description: true,
    },
  },
  trek: {
    select: {
      name: true,
      slug: true,
      region: true,
      durationDays: true,
      durationNights: true,
      difficulty: true,
      summary: true,
    },
  },
});

type ActivePackageRow = Prisma.TrekPackageGetPayload<{
  select: typeof activePackageSelect;
}>;

function toPackageProjection(row: ActivePackageRow): CatalogPackageProjection {
  return {
    id: row.id,
    title: row.title,
    sourceUrl: row.sourceUrl,
    priceInr: row.priceInr,
    priceText: row.priceText,
    nextDepartureAt: row.nextDepartureAt,
    transportType: row.transportType,
    rawTransportText: row.rawTransportText,
    rawPickupText: row.rawPickupText,
    rawDepartureText: row.rawDepartureText,
    rawInclusionsText: row.rawInclusionsText,
    mealPlan: row.mealPlan,
    forestFeeStatus: row.forestFeeStatus,
    rawSnapshot: row.rawSnapshot,
    normalizedSnapshot: row.normalizedSnapshot,
    pickupLocations: row.pickupLocations,
    lastScrapedAt: row.lastScrapedAt,
    organizer: {
      name: row.organizer.name,
      slug: row.organizer.slug,
      websiteUrl: row.organizer.websiteUrl,
      description: row.organizer.description,
    },
    trek: row.trek
      ? {
          name: row.trek.name,
          slug: row.trek.slug,
          region: row.trek.region,
          durationDays: row.trek.durationDays,
          durationNights: row.trek.durationNights,
          difficulty: row.trek.difficulty,
          summary: row.trek.summary,
        }
      : undefined,
  };
}

export async function readAllActivePackageProjections(prisma: PrismaClient) {
  const rows = await prisma.trekPackage.findMany({
    where: {
      status: "ACTIVE",
      needsReview: false,
      trek: {
        region: TREK_REGION_MAHARASHTRA,
      },
    },
    select: activePackageSelect,
  });

  return rows.map(toPackageProjection);
}

export async function readActivePackagesForTrek(prisma: PrismaClient, slug: string) {
  const rows = await prisma.trekPackage.findMany({
    where: {
      status: "ACTIVE",
      needsReview: false,
      trek: {
        slug,
        region: TREK_REGION_MAHARASHTRA,
      },
    },
    select: activePackageSelect,
  });

  return rows.map(toPackageProjection);
}

export async function readActivePackagesForOrganizer(prisma: PrismaClient, slug: string) {
  const rows = await prisma.trekPackage.findMany({
    where: {
      status: "ACTIVE",
      needsReview: false,
      trek: {
        region: TREK_REGION_MAHARASHTRA,
      },
      organizer: {
        slug,
      },
    },
    select: activePackageSelect,
  });

  return rows.map(toPackageProjection);
}

export async function readTrekSearchEntries(prisma: PrismaClient): Promise<TrekSearchEntry[]> {
  const treks = await prisma.trek.findMany({
    where: {
      region: TREK_REGION_MAHARASHTRA,
      trekPackages: {
        some: {
          status: "ACTIVE",
          needsReview: false,
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
    aliases: trek.aliases.map((alias) => alias.value),
  }));
}

export type PendingOrganizerForTrek = {
  organizerName: string;
  organizerSlug: string;
  organizerWebsiteUrl: string;
  trekSlug: string;
  trekName: string;
};

/**
 * Find organizers that have packages for a given trek but ALL those packages are needsReview: true.
 * These organizers should show as "data pending" placeholder rows.
 */
export async function readPendingOrganizersForTrek(
  prisma: PrismaClient,
  trekSlug: string,
): Promise<PendingOrganizerForTrek[]> {
  // Filter out organizers that also have valid (non-review) packages
  const organizersWithValidPackages = await prisma.trekPackage.findMany({
    where: {
      status: "ACTIVE",
      needsReview: false,
      trek: {
        slug: trekSlug,
        region: TREK_REGION_MAHARASHTRA,
      },
    },
    select: { organizerId: true },
    distinct: ["organizerId"],
  });

  const validOrganizerIds = new Set(
    organizersWithValidPackages.map((r) => r.organizerId),
  );

  // We need organizerId to filter — re-query with it
  const reviewRows = await prisma.trekPackage.findMany({
    where: {
      status: "ACTIVE",
      needsReview: true,
      trek: {
        slug: trekSlug,
        region: TREK_REGION_MAHARASHTRA,
      },
    },
    select: {
      organizerId: true,
      organizer: {
        select: { name: true, slug: true, websiteUrl: true },
      },
      trek: {
        select: { name: true, slug: true },
      },
    },
    distinct: ["organizerId"],
  });

  return reviewRows
    .filter((row) => !validOrganizerIds.has(row.organizerId))
    .map((row) => ({
      organizerName: row.organizer.name,
      organizerSlug: row.organizer.slug,
      organizerWebsiteUrl: row.organizer.websiteUrl,
      trekSlug: row.trek.slug,
      trekName: row.trek.name,
    }));
}

/**
 * Read all pending organizer/trek pairs across the whole catalog.
 * Used by the snapshot generator to include placeholder data.
 */
export async function readAllPendingOrganizerTrekPairs(
  prisma: PrismaClient,
): Promise<PendingOrganizerForTrek[]> {
  // All organizer+trek combinations where every package is needsReview
  const reviewRows = await prisma.trekPackage.groupBy({
    by: ["organizerId", "trekId"],
    where: {
      status: "ACTIVE",
      needsReview: true,
      trek: {
        region: TREK_REGION_MAHARASHTRA,
      },
    },
  });

  const validRows = await prisma.trekPackage.groupBy({
    by: ["organizerId", "trekId"],
    where: {
      status: "ACTIVE",
      needsReview: false,
      trek: {
        region: TREK_REGION_MAHARASHTRA,
      },
    },
  });

  const validKeys = new Set(
    validRows.map((r) => `${r.organizerId}:${r.trekId}`),
  );

  const pendingKeys = reviewRows.filter(
    (r) => !validKeys.has(`${r.organizerId}:${r.trekId}`),
  );

  if (pendingKeys.length === 0) {
    return [];
  }

  // Fetch organizer and trek details for pending pairs
  const results: PendingOrganizerForTrek[] = [];

  for (const key of pendingKeys) {
    const row = await prisma.trekPackage.findFirst({
      where: {
        organizerId: key.organizerId,
        trekId: key.trekId,
        status: "ACTIVE",
        needsReview: true,
        trek: {
          region: TREK_REGION_MAHARASHTRA,
        },
      },
      select: {
        organizer: { select: { name: true, slug: true, websiteUrl: true } },
        trek: { select: { name: true, slug: true } },
      },
    });

    if (row) {
      results.push({
        organizerName: row.organizer.name,
        organizerSlug: row.organizer.slug,
        organizerWebsiteUrl: row.organizer.websiteUrl,
        trekSlug: row.trek.slug,
        trekName: row.trek.name,
      });
    }
  }

  return results;
}