import { Prisma, type PrismaClient } from "@prisma/client";

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
    },
    select: activePackageSelect,
  });

  return rows.map(toPackageProjection);
}

export async function readActivePackagesForTrek(prisma: PrismaClient, slug: string) {
  const rows = await prisma.trekPackage.findMany({
    where: {
      status: "ACTIVE",
      trek: {
        slug,
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
    aliases: trek.aliases.map((alias) => alias.value),
  }));
}