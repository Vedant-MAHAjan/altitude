import { createVacationLabsOrganizerScraper } from "./vacation-labs-base";
import { parseBhataknaDetailPage } from "./parsers/bhatakna";

export const bhataknaScraper = createVacationLabsOrganizerScraper({
  organizer: {
    name: "Bhatakna",
    slug: "bhatakna",
    websiteUrl: "https://www.bhatakna.com",
    description:
      "Vacation Labs based organizer with trip calendar, fireflies trek collection, and detailed itinerary pages.",
  },
  parsePackage: parseBhataknaDetailPage,
  sources: [
    {
      label: "Sitemap (all tours)",
      sourceUrl: "https://www.bhatakna.com/sitemap",
      parserKey: "bhatakna:v2",
      crawlStrategy: "LISTING_PAGE",
    },
  ],
});