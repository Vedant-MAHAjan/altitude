import type { Page } from "playwright";

import {
  buildDepartureDatesFromText,
  extractDepartureDatesFromBookingLinks,
  extractDurationText,
  extractFirstPriceText,
  extractListItems,
  extractLocationText,
  extractPickupLines,
  extractSection,
  findLines,
  getFirstText,
  getPageText,
  uniqueStrings,
} from "./content";
import type { RawScrapedPackage, ScraperLogger, ScraperSource } from "../types";

type ParseTourDetailPageOptions = {
  page: Page;
  pageUrl: string;
  source: ScraperSource;
  platform: string;
  titleSelectors?: string[];
  /** Price text extracted from the listing/card page, used for cross-reference. */
  listingPriceText?: string | null;
  /** Logger instance for diagnostic warnings (e.g. PRICE_MISMATCH). */
  logger?: ScraperLogger;
};

// ---------------------------------------------------------------------------
// Accordion expansion
// ---------------------------------------------------------------------------

/**
 * Expand collapsed accordion sections on Vacation Labs (and similar) pages.
 * Silently skips if no accordions are found.
 */
async function expandCollapsedAccordions(page: Page): Promise<void> {
  // Strategy 1: aria-expanded="false" buttons/triggers
  const ariaCollapsed = page.locator(
    '[aria-expanded="false"]:is(button, [role="button"], .accordion-toggle, .panel-heading a, [data-toggle="collapse"])',
  );
  const ariaCount = await ariaCollapsed.count().catch(() => 0);

  for (let i = 0; i < ariaCount; i++) {
    await ariaCollapsed.nth(i).click({ timeout: 2000 }).catch(() => {});
  }

  // Strategy 2: Vacation Labs specific — collapsed panels with .panel-collapse:not(.in)
  const vlPanels = page.locator(".panel-collapse:not(.in)");
  const vlCount = await vlPanels.count().catch(() => 0);

  if (vlCount > 0) {
    // Click the sibling heading toggles
    const vlToggles = page.locator(
      '.panel-heading a.collapsed, .panel-heading [data-toggle="collapse"]',
    );
    const toggleCount = await vlToggles.count().catch(() => 0);

    for (let i = 0; i < toggleCount; i++) {
      await vlToggles.nth(i).click({ timeout: 2000 }).catch(() => {});
    }
  }

  // Strategy 3: Generic details/summary elements that are closed
  const closedDetails = page.locator("details:not([open])");
  const detailsCount = await closedDetails.count().catch(() => 0);

  for (let i = 0; i < detailsCount; i++) {
    await closedDetails.nth(i).locator("summary").click({ timeout: 2000 }).catch(() => {});
  }

  // Brief settle after expansion clicks
  if (ariaCount > 0 || vlCount > 0 || detailsCount > 0) {
    await page.waitForTimeout(500);
  }
}

// ---------------------------------------------------------------------------
// Price cross-reference
// ---------------------------------------------------------------------------

function parsePriceNumeric(priceText: string | null | undefined): number | null {
  if (!priceText) return null;
  const digits = priceText.replace(/[^\d]/g, "");
  const value = Number(digits);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function mergeText(...values: Array<string | null | undefined>) {
  const merged = uniqueStrings(values.flatMap((value) => (value ? [value] : []))).join("\n");
  return merged || null;
}

export async function parseTourDetailPage(
  options: ParseTourDetailPageOptions,
): Promise<RawScrapedPackage> {
  // Expand any collapsed accordions before reading page text
  await expandCollapsedAccordions(options.page);

  const pageText = await getPageText(options.page);
  const title =
    (await getFirstText(options.page, options.titleSelectors ?? ["h1", "main h1"])) ??
    options.source.canonicalTrekName ??
    options.source.label;

  const basicInfoText = extractSection(pageText, [
    /^basic info:?$/i,
    /event details/i,
    /trek details/i,
  ]);
  const costText = extractSection(pageText, [/^cost:?/i, /^cost for /i]);
  const inclusionText = extractSection(pageText, [
    /^what is included in the tour$/i,
    /^what(?:'|’)?s included$/i,
    /^what(?:'|’)?s included in (?:the )?(?:tour|trip)$/i,
    /^inclusion\s*:?$/i,
    /^inclusions\s*:?$/i,
  ]);
  const exclusionText = extractSection(pageText, [
    /^what is not included in the tour$/i,
    /^what(?:'|’)?s excluded$/i,
    /^what(?:'|’)?s excluded from (?:the )?(?:tour|trip)$/i,
    /^exclusion\s*:?$/i,
    /^exclusions\s*:?$/i,
  ]);
  const itineraryText = extractSection(pageText, [/^itinerary$/i, /detailed itinerary/i]);
  const pickupText = extractSection(pageText, [/^pickup points?$/i]);
  const otherInformationText = extractSection(pageText, [/^other information$/i]);
  const modeOfTransportText = extractSection(pageText, [/^mode of transport$/i]);
  const stayText = extractSection(pageText, [
    /^stay\s*(?:details)?\s*:?$/i,
    /^accommodation\s*(?:details)?\s*:?$/i,
    /^stay & accommodation\s*:?$/i,
  ]);
  const quickInformationText = extractSection(pageText, [/^quick information$/i]);
  const batchesText = extractSection(pageText, [/^batches\s*:?$/i, /^dates and rates$/i]);
  const highlightsText = extractSection(pageText, [/^highlights$/i]);
  const departureDates = await extractDepartureDatesFromBookingLinks(
    options.page,
    options.pageUrl,
  );
  const fallbackDepartureDates = buildDepartureDatesFromText(
    mergeText(batchesText, itineraryText, pageText),
  );
  const transportText = mergeText(
    ...findLines(
      mergeText(
        costText,
        inclusionText,
        itineraryText,
        otherInformationText,
        modeOfTransportText,
        quickInformationText,
      ),
      /\b(train|bus|jeep|transport|travel|pickup|kasara|car|base village)\b/i,
      16,
    ),
    modeOfTransportText,
  );
  const mealText = mergeText(
    ...findLines(
      mergeText(inclusionText, highlightsText, itineraryText, otherInformationText),
      /\b(breakfast|lunch|dinner|meal|tea|veg|nonveg|non-veg|food)\b/i,
      16,
    ),
  );
  const forestFeeText = mergeText(
    ...findLines(inclusionText, /\b(entry|forest|permit|fees?)\b/i, 12).map(
      (line) => `included ${line}`,
    ),
    ...findLines(exclusionText, /\b(entry|forest|permit|fees?)\b/i, 12).map(
      (line) => `not included ${line}`,
    ),
  );
  const pickupSummary = mergeText(
    pickupText,
    quickInformationText,
    ...extractPickupLines(itineraryText),
    ...extractPickupLines(otherInformationText),
  );

  // Price cross-reference: detail page price is canonical
  const detailPriceText = extractFirstPriceText(mergeText(costText, pageText));
  const detailPrice = parsePriceNumeric(detailPriceText);
  const listingPrice = parsePriceNumeric(options.listingPriceText);

  if (
    options.logger &&
    detailPrice &&
    listingPrice &&
    detailPrice !== listingPrice
  ) {
    const deviation = Math.abs(detailPrice - listingPrice) / listingPrice;

    if (deviation > 0.2) {
      options.logger.warn("PRICE_MISMATCH", {
        sourceUrl: options.pageUrl,
        listingPrice,
        listingPriceText: options.listingPriceText,
        detailPrice,
        detailPriceText,
        deviationPercent: Math.round(deviation * 100),
      });
    }
  }

  return {
    title,
    sourceUrl: options.pageUrl,
    canonicalTrekName: options.source.canonicalTrekName,
    canonicalTrekSlug: options.source.canonicalTrekSlug,
    priceText: detailPriceText,
    durationText: extractDurationText(mergeText(basicInfoText, itineraryText, pageText)),
    locationText: extractLocationText(pageText),
    transportText,
    mealText,
    forestFeeText,
    pickupText: pickupSummary,
    departureText: mergeText(batchesText, itineraryText),
    inclusionsText: inclusionText,
    exclusionsText: exclusionText,
    inclusions: extractListItems(inclusionText),
    exclusions: extractListItems(exclusionText),
    pickupPoints: extractPickupLines(mergeText(pickupText, itineraryText)),
    departureDates: departureDates.length > 0 ? departureDates : fallbackDepartureDates,
    pageText,
    rawSnapshot: {
      platform: options.platform,
      parserKey: options.source.parserKey,
      sourceLabel: options.source.label,
      sections: {
        basicInfoText,
        costText,
        inclusionText,
        exclusionText,
        itineraryText,
        pickupText,
        otherInformationText,
        modeOfTransportText,
        stayText,
        quickInformationText,
        batchesText,
        highlightsText,
      },
    },
  };
}