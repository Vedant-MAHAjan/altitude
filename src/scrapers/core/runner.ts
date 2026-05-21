import { createLogger } from "./logger";
import { normalizeScrapedPackage } from "./normalizer";
import { persistPackages } from "./persist";
import { reconcileTrekCatalog } from "./reconcile";
import { withRetry } from "./retry";
import type {
  OrganizerScraper,
  ScraperRunOptions,
  ScraperRunResult,
} from "../types";

async function executeScraper(
  scraper: OrganizerScraper,
  options: ScraperRunOptions,
): Promise<ScraperRunResult> {
  const startedAt = Date.now();
  const logger = createLogger(`scrape:${scraper.organizer.slug}`);

  try {
    logger.info("Starting organizer scrape", {
      dryRun: options.dryRun,
      limit: options.limit,
    });

    const rawPackages = await withRetry(
      () =>
        scraper.scrape({
          dryRun: options.dryRun,
          userAgent:
            process.env.SCRAPE_USER_AGENT ??
            "MahaTrekCompareBot/0.1",
          now: new Date(),
          maxAttempts: 3,
          maxToursPerSource:
            options.limit ?? (Number(process.env.SCRAPE_TOUR_LIMIT ?? 6) || 6),
          navigationTimeoutMs: Number(process.env.SCRAPE_NAV_TIMEOUT_MS ?? 45_000),
          logger,
        }),
      {
        attempts: 3,
        minDelayMs: 600,
      },
    );
    const normalizedPackages = rawPackages.map(normalizeScrapedPackage);
    const packagesUpserted = await persistPackages(
      scraper,
      normalizedPackages,
      options.dryRun,
    );

    logger.info("Finished organizer scrape", {
      packagesFound: rawPackages.length,
      packagesUpserted,
      durationMs: Date.now() - startedAt,
    });

    return {
      organizerSlug: scraper.organizer.slug,
      packagesFound: rawPackages.length,
      packagesUpserted,
      durationMs: Date.now() - startedAt,
      dryRun: options.dryRun,
      status: "success",
    };
  } catch (error) {
    logger.error("Organizer scrape failed", {
      error: error instanceof Error ? error.message : "Unknown scrape error",
      durationMs: Date.now() - startedAt,
    });

    return {
      organizerSlug: scraper.organizer.slug,
      packagesFound: 0,
      packagesUpserted: 0,
      durationMs: Date.now() - startedAt,
      dryRun: options.dryRun,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown scrape error",
    };
  }
}

export async function runScrapers(
  scrapers: OrganizerScraper[],
  options: ScraperRunOptions,
) {
  const logger = createLogger("scrape");
  const selectedScrapers = options.organizer
    ? scrapers.filter((scraper) => scraper.organizer.slug === options.organizer)
    : scrapers;

  if (selectedScrapers.length === 0) {
    logger.warn("No scrapers selected", {
      organizer: options.organizer,
    });
    return [];
  }

  const pending = [...selectedScrapers];
  const results: ScraperRunResult[] = [];
  const concurrency = Math.max(
    1,
    Number(process.env.SCRAPE_CONCURRENCY ?? 2) || 1,
  );

  logger.info("Launching scrape run", {
    organizers: selectedScrapers.map((scraper) => scraper.organizer.slug),
    concurrency,
    dryRun: options.dryRun,
    limit: options.limit,
  });

  await Promise.all(
    Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
      while (pending.length > 0) {
        const scraper = pending.shift();

        if (!scraper) {
          break;
        }

        const result = await executeScraper(scraper, options);
        results.push(result);
      }
    }),
  );

  if (!options.dryRun && results.some((result) => result.status === "success")) {
    await reconcileTrekCatalog(logger.child("reconcile"));
  }

  return results.sort((left, right) =>
    left.organizerSlug.localeCompare(right.organizerSlug),
  );
}