import { createOrganizerDetailParser } from "./shared";

export const parseSahyadriTreksAndToursDetailPage = createOrganizerDetailParser({
  platform: "sahyadritreksandtours",
  titleSelectors: ["h1", "main h1", "section h1", "h2"],
});