import { createLogger } from "@/scrapers/core/logger";

import { generateStaticCatalogData } from "@/lib/catalog/generator";

async function main() {
  await generateStaticCatalogData(createLogger("catalog:snapshots"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});