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
      label: "Sitemap (all tours)",
      sourceUrl: "https://www.trekhievers.com/sitemap",
      parserKey: "trekhievers:v2",
      crawlStrategy: "LISTING_PAGE",
    },
  ],
});