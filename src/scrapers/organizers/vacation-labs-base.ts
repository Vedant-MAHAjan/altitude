import { gotoAndSettle, withChromiumPage } from "../core/browser";
import { collectTourLinksWithPrices } from "../core/content";
import { withRetry } from "../core/retry";
import type { OrganizerDetailParser } from "./parsers/shared";
import type {
  OrganizerDefinition,
  OrganizerScraper,
  RawScrapedPackage,
  ScraperSource,
} from "../types";

type VacationLabsScraperConfig = {
  organizer: OrganizerDefinition;
  sources: ScraperSource[];
  parsePackage: OrganizerDetailParser;
  filterPackage?: (rawPackage: RawScrapedPackage) => {
    include: boolean;
    reason: string;
  };
};

export function createVacationLabsOrganizerScraper(
  config: VacationLabsScraperConfig,
): OrganizerScraper {
  return {
    organizer: config.organizer,
    sources: config.sources,
    async scrape(context) {
      return withChromiumPage(context.userAgent, async (page) => {
        const discoveredLinks: Array<{ url: string; listingPriceText: string | null }> = [];

        for (const source of config.sources) {
          if (source.crawlStrategy === "DETAIL_PAGE") {
            discoveredLinks.push({ url: source.sourceUrl, listingPriceText: null });
            continue;
          }

          await withRetry(
            async () => {
              await gotoAndSettle(
                page,
                source.sourceUrl,
                context.logger,
                context.navigationTimeoutMs,
              );
            },
            {
              attempts: context.maxAttempts,
              minDelayMs: 750,
            },
          );

          const linksWithPrices = await collectTourLinksWithPrices(page, source.sourceUrl);
          const limitedLinks = context.maxToursPerSource
            ? linksWithPrices.slice(0, context.maxToursPerSource)
            : linksWithPrices;

          if (context.maxToursPerSource && linksWithPrices.length > context.maxToursPerSource) {
            context.logger.warn("Discovery truncated by tour limit", {
              organizer: config.organizer.slug,
              source: source.label,
              totalAvailable: linksWithPrices.length,
              limit: context.maxToursPerSource,
              skipped: linksWithPrices.length - context.maxToursPerSource,
            });
          }

          context.logger.info("Discovered organizer links", {
            organizer: config.organizer.slug,
            source: source.label,
            discovered: limitedLinks.length,
          });

          discoveredLinks.push(...limitedLinks);
        }

        // Deduplicate by URL, keeping first occurrence's price
        const seen = new Set<string>();
        const uniqueLinks: Array<{ url: string; listingPriceText: string | null }> = [];

        for (const link of discoveredLinks) {
          if (!seen.has(link.url)) {
            seen.add(link.url);
            uniqueLinks.push(link);
          }
        }

        const packages: RawScrapedPackage[] = [];
  let skippedPackages = 0;

        for (const link of uniqueLinks) {
          const source =
            config.sources.find((candidate) =>
              link.url.startsWith(candidate.sourceUrl),
            ) ?? config.sources[0];

          const rawPackage = await withRetry(
            async () => {
              await gotoAndSettle(
                page,
                link.url,
                context.logger,
                context.navigationTimeoutMs,
              );

              return config.parsePackage({
                page,
                pageUrl: link.url,
                source,
                listingPriceText: link.listingPriceText,
                logger: context.logger,
              });
            },
            {
              attempts: context.maxAttempts,
              minDelayMs: 900,
            },
          );

          const verdict = config.filterPackage?.(rawPackage);

          if (verdict && !verdict.include) {
            skippedPackages += 1;

            context.logger.info("Skipping filtered organizer package", {
              organizer: config.organizer.slug,
              title: rawPackage.title,
              sourceUrl: rawPackage.sourceUrl,
              reason: verdict.reason,
            });

            continue;
          }

          packages.push(rawPackage);
        }

        if (config.filterPackage) {
          context.logger.info("Filtered organizer packages", {
            organizer: config.organizer.slug,
            kept: packages.length,
            skipped: skippedPackages,
          });
        }

        return packages;
      });
    },
  };
}