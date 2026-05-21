import { getPrismaClient } from "../../lib/prisma";
import { getCanonicalTrekIdentity } from "../../lib/normalization/trek-identity";
import type { ScraperLogger } from "../types";

type TrekPackageWithTrek = {
  id: string;
  title: string;
  trekId: string;
  trek: {
    id: string;
    name: string;
    slug: string;
    state: string;
    region: string | null;
    durationDays: number | null;
    durationNights: number | null;
    difficulty: "EASY" | "MODERATE" | "MODERATE_HARD" | "HARD" | "UNKNOWN";
    summary: string | null;
    heroImageUrl: string | null;
  };
};

export async function reconcileTrekCatalog(logger?: ScraperLogger) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return;
  }

  const trekPackages = await prisma.trekPackage.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      title: true,
      trekId: true,
      trek: {
        select: {
          id: true,
          name: true,
          slug: true,
          state: true,
          region: true,
          durationDays: true,
          durationNights: true,
          difficulty: true,
          summary: true,
          heroImageUrl: true,
        },
      },
    },
  }) as TrekPackageWithTrek[];

  const canonicalTrekIds = new Map<string, string>();
  let packagesRelinked = 0;

  for (const trekPackage of trekPackages) {
    const canonical = getCanonicalTrekIdentity(trekPackage.title, trekPackage.trek.name);

    let targetTrekId = canonicalTrekIds.get(canonical.trekSlug);

    if (!targetTrekId) {
      const targetTrek = await prisma.trek.upsert({
        where: {
          slug: canonical.trekSlug,
        },
        update: {
          name: canonical.trekName,
        },
        create: {
          name: canonical.trekName,
          slug: canonical.trekSlug,
          state: trekPackage.trek.state,
          region: trekPackage.trek.region,
          durationDays: trekPackage.trek.durationDays,
          durationNights: trekPackage.trek.durationNights,
          difficulty: trekPackage.trek.difficulty,
          summary: trekPackage.trek.summary,
          heroImageUrl: trekPackage.trek.heroImageUrl,
        },
        select: {
          id: true,
        },
      });

      targetTrekId = targetTrek.id;
      canonicalTrekIds.set(canonical.trekSlug, targetTrek.id);
    }

    if (trekPackage.trekId !== targetTrekId) {
      await prisma.trekPackage.update({
        where: {
          id: trekPackage.id,
        },
        data: {
          trekId: targetTrekId,
        },
      });

      packagesRelinked += 1;
    }

    for (const aliasValue of canonical.aliasValues) {
      await prisma.trekAlias.upsert({
        where: {
          value: aliasValue,
        },
        update: {
          trekId: targetTrekId,
        },
        create: {
          trekId: targetTrekId,
          value: aliasValue,
        },
      });
    }
  }

  const deletedTreks = await prisma.trek.deleteMany({
    where: {
      trekPackages: {
        none: {},
      },
    },
  });

  logger?.info("Reconciled trek catalog", {
    packagesProcessed: trekPackages.length,
    packagesRelinked,
    treksRemoved: deletedTreks.count,
    canonicalTreks: canonicalTrekIds.size,
  });
}