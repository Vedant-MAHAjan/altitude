import { getPrismaClient } from "@/lib/prisma";
import { buildCatalogSnapshotPayload, buildTrekSearchEntries } from "@/lib/catalog/builders";
import type { CatalogLogger } from "@/lib/catalog/logger";
import {
  readAllActivePackageProjections,
  readAllPendingOrganizerTrekPairs,
  readTrekSearchEntries,
} from "@/lib/catalog/queries";
import { writeCatalogSnapshots } from "@/lib/catalog/snapshots";

type SnapshotGenerationResult = {
  generatedAt: string;
  trekCount: number;
  organizerCount: number;
  packageCount: number;
};

function createNoopLogger(): CatalogLogger {
  return {
    child() {
      return createNoopLogger();
    },
    debug() {},
    info() {},
    warn() {},
    error() {},
  };
}

export async function generateStaticCatalogData(
  logger: CatalogLogger = createNoopLogger(),
): Promise<SnapshotGenerationResult> {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("DATABASE_URL is required to generate static catalog snapshots.");
  }

  logger.info("Generating static catalog snapshots");

  const [packages, searchRecords, pendingOrganizers] = await Promise.all([
    readAllActivePackageProjections(prisma),
    readTrekSearchEntries(prisma),
    readAllPendingOrganizerTrekPairs(prisma),
  ]);
  const generatedAt = new Date().toISOString();
  const payload = buildCatalogSnapshotPayload({
    packages,
    search: buildTrekSearchEntries(searchRecords),
    pendingOrganizers,
    generatedAt,
  });

  await writeCatalogSnapshots(payload);

  logger.info("Static catalog snapshots generated", {
    generatedAt,
    trekCount: payload.treks.length,
    organizerCount: payload.organizers.length,
    packageCount: payload.homepage.packageCount,
  });

  return {
    generatedAt,
    trekCount: payload.treks.length,
    organizerCount: payload.organizers.length,
    packageCount: payload.homepage.packageCount,
  };
}