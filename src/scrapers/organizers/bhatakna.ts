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
      label: "Treks and camping Mumbai Pune",
      sourceUrl: "https://www.bhatakna.com/collections/treks-camping-mumbai-pune",
      parserKey: "bhatakna:v2",
      crawlStrategy: "LISTING_PAGE",
    },
    {
      label: "Night treks and camping",
      sourceUrl: "https://www.bhatakna.com/collections/night-treks-camping-near-mumbai",
      parserKey: "bhatakna:v2",
      crawlStrategy: "LISTING_PAGE",
    },
  ],
});