import { classifyTrekRegion } from "../src/lib/maharashtra-destinations";
import { getPrismaClient } from "../src/lib/prisma";

const prisma = getPrismaClient();

async function main() {
  if (!prisma) {
    throw new Error("DATABASE_URL is required to backfill trek regions.");
  }

  const treks = await prisma.trek.findMany({
    select: {
      id: true,
      name: true,
      region: true,
    },
  });

  const maharashtraIds = treks
    .filter((trek) => classifyTrekRegion(trek.name) === TREK_REGION_MAHARASHTRA)
    .map((trek) => trek.id);

  const otherIds = treks
    .filter((trek) => classifyTrekRegion(trek.name) !== TREK_REGION_MAHARASHTRA)
    .map((trek) => trek.id);

  if (maharashtraIds.length > 0) {
    await prisma.trek.updateMany({
      where: {
        id: { in: maharashtraIds },
      },
      data: {
        region: TREK_REGION_MAHARASHTRA,
      },
    });
  }

  if (otherIds.length > 0) {
    await prisma.trek.updateMany({
      where: {
        id: { in: otherIds },
      },
      data: {
        region: "other",
      },
    });
  }

  const maharashtraCount = maharashtraIds.length;
  const updatedCount = treks.filter(
    (trek) => trek.region !== classifyTrekRegion(trek.name),
  ).length;

  console.log(
    `Backfilled trek regions for ${updatedCount} treks (${maharashtraCount} Maharashtra, ${treks.length - maharashtraCount} other)`,
  );
}

const TREK_REGION_MAHARASHTRA = "maharashtra";

main()
  .catch((error) => {
    console.error("Failed to backfill trek regions", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });