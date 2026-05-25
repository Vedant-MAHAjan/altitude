import { generateStaticCatalogData } from "@/lib/catalog/generator";
import { createCatalogLogger } from "@/lib/catalog/logger";

async function main() {
  await generateStaticCatalogData(createCatalogLogger("catalog:snapshots"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});