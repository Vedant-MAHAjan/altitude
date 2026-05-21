import { createOrganizerDetailParser } from "./shared";

export const parseDurgviharDetailPage = createOrganizerDetailParser({
  platform: "durgvihar",
  titleSelectors: ["h1", "main h1", ".trip-title", "h2"],
});