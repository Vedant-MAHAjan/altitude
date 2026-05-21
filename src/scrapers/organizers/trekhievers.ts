import { createVacationLabsOrganizerScraper } from "./vacation-labs-base";
import { parseTrekhieversDetailPage } from "./parsers/trekhievers";

export const trekhieversScraper = createVacationLabsOrganizerScraper({
  organizer: {
    name: "Trekhievers",
    slug: "trekhievers",
    websiteUrl: "https://www.trekhievers.com",
    description:
      "Vacation Labs based trek organizer with city-specific trek collections and detailed cost plus inclusion sections.",
  },
  parsePackage: parseTrekhieversDetailPage,
  sources: [
    {
      label: "Mumbai treks",
      sourceUrl: "https://www.trekhievers.com/collections/treks-in-mumbai",
      parserKey: "trekhievers:v2",
      crawlStrategy: "LISTING_PAGE",
    },
    {
      label: "Pune treks",
      sourceUrl: "https://www.trekhievers.com/collections/treks-in-pune",
      parserKey: "trekhievers:v2",
      crawlStrategy: "LISTING_PAGE",
    },
  ],
});