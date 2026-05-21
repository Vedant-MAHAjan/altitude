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
      label: "Maharashtra treks",
      sourceUrl: "https://www.treksandtrails.org/collections/maharashtra-treks",
      parserKey: "treksandtrails:v2",
      crawlStrategy: "LISTING_PAGE",
    },
    {
      label: "Upcoming events",
      sourceUrl: "https://www.treksandtrails.org/collections/upcoming-events",
      parserKey: "treksandtrails:v2",
      crawlStrategy: "LISTING_PAGE",
    },
  ],
  filterPackage: (rawPackage) =>
    getMaharashtraCatalogVerdict(rawPackage, {
      requireAdventureSignal: true,
    }),
});