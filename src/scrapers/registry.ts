import type { OrganizerScraper } from "./types";
import { bhataknaScraper } from "./organizers/bhatakna";
import { durgviharScraper } from "./organizers/durgvihar";
import { sahyadriTreksAndToursScraper } from "./organizers/sahyadritreksandtours";
import { trekhieversScraper } from "./organizers/trekhievers";
import { treksAndTrailsScraper } from "./organizers/treksandtrails";
import { unlimitedTrekersScraper } from "./organizers/unlimited-trekers";

export const registeredScrapers: OrganizerScraper[] = [
	durgviharScraper,
	trekhieversScraper,
	treksAndTrailsScraper,
	bhataknaScraper,
	sahyadriTreksAndToursScraper,
	unlimitedTrekersScraper,
];