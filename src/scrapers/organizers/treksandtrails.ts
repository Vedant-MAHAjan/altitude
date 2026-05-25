import { createVacationLabsOrganizerScraper } from "./vacation-labs-base";
import { parseTreksAndTrailsDetailPage } from "./parsers/treksandtrails";
import { getMaharashtraCatalogVerdict } from "../core/catalog-scope";

export const treksAndTrailsScraper = createVacationLabsOrganizerScraper({
  organizer: {
    name: "Treks and Trails India",
    slug: "treks-and-trails-india",
    websiteUrl: "https://www.treksandtrails.org",
    description:
      "Vacation Labs based catalog with trek detail pages exposing cost, dates, inclusions, exclusions, and itinerary blocks.",
  },
  parsePackage: parseTreksAndTrailsDetailPage,
  sources: [
    {
      label: "Sitemap (all tours)",
      sourceUrl: "https://www.treksandtrails.org/sitemap",
      parserKey: "treksandtrails:v2",
      crawlStrategy: "LISTING_PAGE",
    },
  ],
  filterPackage: (rawPackage) =>
    getMaharashtraCatalogVerdict(rawPackage, {
      requireAdventureSignal: true,
    }),
});