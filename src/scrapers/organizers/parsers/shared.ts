import type { Page } from "playwright";

import { parseTourDetailPage } from "../../core/detail-parser";
import type { RawScrapedPackage, ScraperLogger, ScraperSource } from "../../types";

export type OrganizerDetailParser = (options: {
  page: Page;
  pageUrl: string;
  source: ScraperSource;
  listingPriceText?: string | null;
  logger?: ScraperLogger;
}) => Promise<RawScrapedPackage>;

type OrganizerDetailParserConfig = {
  platform: string;
  titleSelectors?: string[];
};

export function createOrganizerDetailParser(
  config: OrganizerDetailParserConfig,
): OrganizerDetailParser {
  return ({ page, pageUrl, source, listingPriceText, logger }) =>
    parseTourDetailPage({
      page,
      pageUrl,
      source,
      platform: config.platform,
      titleSelectors: config.titleSelectors,
      listingPriceText,
      logger,
    });
}