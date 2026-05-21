import { gotoAndSettle, withChromiumPage } from "../core/browser";
import { collectLinksByPathPatterns, uniqueStrings } from "../core/content";
import { getMaharashtraCatalogVerdict } from "../core/catalog-scope";
import { withRetry } from "../core/retry";
import { parseDurgviharDetailPage } from "./parsers/durgvihar";
import type { OrganizerScraper, RawScrapedPackage, ScraperSource } from "../types";

const sources: ScraperSource[] = [
  {
    label: "Durgvihar trip listings",
    sourceUrl: "https://durgvihar.in/",
    parserKey: "durgvihar:v1",
    crawlStrategy: "LISTING_PAGE",
  },
  {
    label: "Durgvihar destinations",
    sourceUrl: "https://durgvihar.in/destination",
    parserKey: "durgvihar:v1",
    crawlStrategy: "LISTING_PAGE",
  },
];

export function shouldKeepDurgviharPackage(title: string) {
  return getMaharashtraCatalogVerdict(
    {
      title,
      sourceUrl: "",
      locationText: null,
      pageText: null,
    },
    {
      requireAdventureSignal: true,
    },
  ).include;
}

export const durgviharScraper: OrganizerScraper = {
  organizer: {
    name: "Durgvihar",
    slug: "durgvihar",
    websiteUrl: "https://durgvihar.in",
    description:
      "Durgvihar runs a custom trip platform with trek detail pages under /trip/.",
  },
  sources,
  async scrape(context) {
    return withChromiumPage(context.userAgent, async (page) => {
      const discoveredLinks: string[] = [];

      for (const source of sources) {
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
            minDelayMs: 800,
          },
        );

        const links = await collectLinksByPathPatterns(page, source.sourceUrl, {
          includePathPatterns: [/\/trip\/[^/]+$/i],
        });
        const limitedLinks = context.maxToursPerSource
          ? links.slice(0, context.maxToursPerSource)
          : links;

        context.logger.info("Discovered organizer links", {
          organizer: "durgvihar",
          source: source.label,
          discovered: limitedLinks.length,
        });

        discoveredLinks.push(...limitedLinks);
      }

      const packages: RawScrapedPackage[] = [];
      let skippedPackages = 0;

      for (const link of uniqueStrings(discoveredLinks)) {
        const rawPackage = await withRetry(
          async () => {
            await gotoAndSettle(
              page,
              link,
              context.logger,
              context.navigationTimeoutMs,
            );

            return parseDurgviharDetailPage({
              page,
              pageUrl: link,
              source: sources[0],
            });
          },
          {
            attempts: context.maxAttempts,
            minDelayMs: 900,
          },
        );

        const verdict = getMaharashtraCatalogVerdict(rawPackage, {
          requireAdventureSignal: true,
        });

        if (!verdict.include) {
          skippedPackages += 1;

          context.logger.info("Skipping non-trek Durgvihar package", {
            organizer: "durgvihar",
            title: rawPackage.title,
            sourceUrl: rawPackage.sourceUrl,
            reason: verdict.reason,
          });

          continue;
        }

        packages.push(rawPackage);
      }

      context.logger.info("Filtered Durgvihar packages", {
        organizer: "durgvihar",
        kept: packages.length,
        skipped: skippedPackages,
      });

      return packages;
    });
  },
};