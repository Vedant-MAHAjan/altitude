import { gotoAndSettle, withChromiumPage } from "../core/browser";
import { withRetry } from "../core/retry";
import type { OrganizerScraper, RawScrapedPackage, ScraperSource } from "../types";

const sources: ScraperSource[] = [
  {
    label: "Unlimited Trekers listings",
    sourceUrl: "https://myair.link/unlimited-trekers",
    parserKey: "unlimited-trekers:v1",
    crawlStrategy: "LISTING_PAGE",
  },
];

export const unlimitedTrekersScraper: OrganizerScraper = {
  organizer: {
    name: "Unlimited Trekers",
    slug: "unlimited-trekers",
    websiteUrl: "https://myair.link/unlimited-trekers",
    description:
      "Mumbai-based trekking organizer running weekend treks, waterfalls, and night hikes across Maharashtra. Powered by logout.world.",
  },
  sources,
  async scrape(context) {
    return withChromiumPage(context.userAgent, async (page) => {
      const packages: RawScrapedPackage[] = [];

      await withRetry(
        async () => {
          await gotoAndSettle(
            page,
            sources[0].sourceUrl,
            context.logger,
            context.navigationTimeoutMs,
          );
        },
        {
          attempts: context.maxAttempts,
          minDelayMs: 800,
        },
      );

      // The myair.link page renders event cards with title, price, and dates.
      // Extract visible event cards from the page.
      const cards = await page.$$eval(
        "[class*='event'], [class*='card'], a[href*='logout.world/media']",
        (elements) =>
          elements.map((el) => ({
            title: el.querySelector("h6, h5, h4, [class*='title']")?.textContent?.trim() ?? "",
            priceText: el.querySelector("[class*='price'], [class*='from']")?.textContent?.trim() ?? null,
            link: (el as HTMLAnchorElement).href ?? el.querySelector("a")?.href ?? "",
          })),
      );

      // Fallback: try parsing structured text from the page
      if (cards.length === 0) {
        const allText = await page.$$eval("h6", (headings) =>
          headings.map((h) => h.textContent?.trim() ?? ""),
        );

        for (const title of allText) {
          if (title && title.length > 3 && !title.toLowerCase().includes("powered by")) {
            packages.push({
              title,
              sourceUrl: sources[0].sourceUrl,
            });
          }
        }
      } else {
        for (const card of cards) {
          if (!card.title || card.title.toLowerCase().includes("powered by")) {
            continue;
          }

          packages.push({
            title: card.title,
            sourceUrl: card.link || sources[0].sourceUrl,
            priceText: card.priceText,
          });
        }
      }

      const limit = context.maxToursPerSource;
      const result = limit ? packages.slice(0, limit) : packages;

      if (limit && packages.length > limit) {
        context.logger.warn("Discovery truncated by tour limit", {
          organizer: "unlimited-trekers",
          totalAvailable: packages.length,
          limit,
          skipped: packages.length - limit,
        });
      }

      context.logger.info("Scraped Unlimited Trekers packages", {
        total: result.length,
      });

      return result;
    });
  },
};
