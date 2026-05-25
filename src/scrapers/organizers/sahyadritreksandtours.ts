import { gotoAndSettle, withChromiumPage } from "../core/browser";
import { collectLinksByPathPatterns, uniqueStrings } from "../core/content";
import { withRetry } from "../core/retry";
import { parseSahyadriTreksAndToursDetailPage } from "./parsers/sahyadritreksandtours";
import type { OrganizerScraper, RawScrapedPackage, ScraperSource } from "../types";

const sources: ScraperSource[] = [
  {
    label: "Sahyadri Treks and Tours home",
    sourceUrl: "https://sahyadritreksandtours.com/",
    parserKey: "sahyadritreksandtours:v1",
    crawlStrategy: "LISTING_PAGE",
  },
];

async function collectButtonDrivenLinks(
  sourceUrl: string,
  context: Parameters<OrganizerScraper["scrape"]>[0],
) {
  return withChromiumPage(context.userAgent, async (page) => {
    await withRetry(
      async () => {
        await gotoAndSettle(
          page,
          sourceUrl,
          context.logger,
          context.navigationTimeoutMs,
        );
      },
      {
        attempts: context.maxAttempts,
        minDelayMs: 800,
      },
    );

    const buttons = page.getByRole("button", { name: "View Details" });
    const buttonCount = await buttons.count();
    const maxButtons = context.maxToursPerSource
      ? Math.min(buttonCount, context.maxToursPerSource)
      : buttonCount;
    const discoveredLinks: string[] = [];

    for (let index = 0; index < maxButtons; index += 1) {
      await withRetry(
        async () => {
          await gotoAndSettle(
            page,
            sourceUrl,
            context.logger,
            context.navigationTimeoutMs,
          );
        },
        {
          attempts: context.maxAttempts,
          minDelayMs: 700,
        },
      );

      const button = page.getByRole("button", { name: "View Details" }).nth(index);
      const originUrl = page.url();

      await button.scrollIntoViewIfNeeded().catch(() => {});
      await button.click();
      await page
        .waitForURL((url) => url.toString() !== originUrl, {
          timeout: context.navigationTimeoutMs,
        })
        .catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

      if (page.url() !== originUrl) {
        discoveredLinks.push(page.url());
      }
    }

    return uniqueStrings(discoveredLinks);
  });
}

export const sahyadriTreksAndToursScraper: OrganizerScraper = {
  organizer: {
    name: "Sahyadri Treks and Tours",
    slug: "sahyadri-treks-and-tours",
    websiteUrl: "https://sahyadritreksandtours.com",
    description:
      "Sahyadri Treks and Tours runs a custom Next.js storefront with trek pages under /treks/.",
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
          includePathPatterns: [
            /\/treks\/[^/]+$/i,
            /\/trek\/[^/]+$/i,
            /\/upcoming-tours\/[^/]+$/i,
            /\/tour\/[^/]+$/i,
          ],
          excludePathPatterns: [/\/blogs\//i, /\/about$/i],
        });
        const fallbackLinks =
          links.length > 0 ? [] : await collectButtonDrivenLinks(source.sourceUrl, context);
        const allLinks = [...links, ...fallbackLinks];
        const limitedLinks = context.maxToursPerSource
          ? allLinks.slice(0, context.maxToursPerSource)
          : allLinks;

        if (context.maxToursPerSource && allLinks.length > context.maxToursPerSource) {
          context.logger.warn("Discovery truncated by tour limit", {
            organizer: "sahyadri-treks-and-tours",
            source: source.label,
            totalAvailable: allLinks.length,
            limit: context.maxToursPerSource,
            skipped: allLinks.length - context.maxToursPerSource,
          });
        }

        context.logger.info("Discovered organizer links", {
          organizer: "sahyadri-treks-and-tours",
          source: source.label,
          discovered: limitedLinks.length,
        });

        discoveredLinks.push(...limitedLinks);
      }

      const packages: RawScrapedPackage[] = [];

      for (const link of uniqueStrings(discoveredLinks)) {
        const rawPackage = await withRetry(
          async () => {
            await gotoAndSettle(
              page,
              link,
              context.logger,
              context.navigationTimeoutMs,
            );

            return parseSahyadriTreksAndToursDetailPage({
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

        packages.push(rawPackage);
      }

      return packages;
    });
  },
};