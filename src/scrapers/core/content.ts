import type { Page } from "playwright";

import { normalizeWhitespace } from "../../lib/normalization/extractors";
import type { DepartureDate } from "../types";

const SECTION_BOUNDARIES = [
  /^overview$/i,
  /^highlights$/i,
  /^itinerary$/i,
  /^detailed itinerary$/i,
  /^basic info:?$/i,
  /^batches:?$/i,
  /^cost:?/i,
  /^dates and rates$/i,
  /^trip calendar/i,
  /^pickup points?$/i,
  /^other information$/i,
  /^mode of transport$/i,
  /^quick information$/i,
  /^what is included in the tour$/i,
  /^what is not included in the tour$/i,
  /^what(?:'|’)?s included$/i,
  /^what(?:'|’)?s excluded$/i,
  /^inclusions?$/i,
  /^exclusions?$/i,
  /^inclusions\/exclusions$/i,
  /^things to carry$/i,
  /^policies?\s*&\s*terms$/i,
  /^offers?$/i,
  /^reviews?$/i,
  /^event updates?$/i,
  /^additional links$/i,
  /^quick links$/i,
  /^company$/i,
  /^support info$/i,
  /^contact info$/i,
  /^photo gallery$/i,
  /^about us$/i,
  /^who we are$/i,
];

const PICKUP_HINT_PATTERN =
  /\b(CSMT|Byculla|Dadar|Kurla|Ghatkopar|Thane|Dombivali|Kalyan|Borivali|Mulund|Panvel|Chembur|Sion|Kasara|Nashik(?: Phata)?|Lonavala|Pune|Nirgudpada|Harshewadi|Bari(?: Gaon)?|Baari)\b/i;

export function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const value of values) {
    const normalized = normalizeWhitespace(value);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    results.push(normalized);
  }

  return results;
}

export function splitLines(text: string | null | undefined) {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

export function absoluteUrl(baseUrl: string, href: string | null | undefined) {
  if (!href) {
    return null;
  }

  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

export async function getPageText(page: Page) {
  return (await page.locator("body").innerText().catch(() => "")).trim();
}

export async function getFirstText(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    const value = await page.locator(selector).first().innerText().catch(() => null);
    const normalized = normalizeWhitespace(value);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export async function collectTourLinks(page: Page, baseUrl: string) {
  return collectLinksByPathPatterns(page, baseUrl, {
    includePathPatterns: [/\/tours\/[^/]+/i],
    excludePathPatterns: [/\/itineraries\//i, /\/blog\//i],
  });
}

export type TourLinkWithPrice = {
  url: string;
  listingPriceText: string | null;
};

/**
 * Collect tour links from listing page cards along with their displayed price text.
 * Falls back to null price if no price is found on the card.
 */
export async function collectTourLinksWithPrices(
  page: Page,
  baseUrl: string,
): Promise<TourLinkWithPrice[]> {
  const baseHost = new URL(baseUrl).hostname.replace(/^www\./i, "");
  const tourPattern = /\/tours\/[^/]+/i;
  const excludePatterns = [/\/itineraries\//i, /\/blog\//i];
  const pricePattern = /(?:₹|Rs\.?|INR)\s*[\d,]+/i;

  // Evaluate cards in-page to extract both href and closest price text
  const cardData = await page.evaluate(
    ({ priceRe }) => {
      const anchors = Array.from(document.querySelectorAll("a[href]"));
      const results: Array<{ href: string; priceText: string | null }> = [];

      for (const anchor of anchors) {
        const href = anchor.getAttribute("href");

        if (!href) continue;

        // Look for price in the card/parent container
        const card =
          anchor.closest(".tour-card, .card, .listing-item, [class*='tour'], article") ??
          anchor.parentElement;
        const cardText = card?.textContent ?? "";
        const match = cardText.match(new RegExp(priceRe, "i"));

        results.push({
          href,
          priceText: match ? match[0].trim() : null,
        });
      }

      return results;
    },
    { priceRe: pricePattern.source },
  );

  // Filter and deduplicate
  const seen = new Set<string>();
  const links: TourLinkWithPrice[] = [];

  for (const { href, priceText } of cardData) {
    const absolute = absoluteUrl(baseUrl, href);

    if (!absolute) continue;

    const url = new URL(absolute);
    const host = url.hostname.replace(/^www\./i, "");
    const path = url.pathname;

    if (host !== baseHost) continue;
    if (!tourPattern.test(path)) continue;
    if (excludePatterns.some((p) => p.test(path))) continue;
    if (seen.has(absolute)) continue;

    seen.add(absolute);
    links.push({ url: absolute, listingPriceText: priceText });
  }

  return links;
}

type LinkCollectorOptions = {
  includePathPatterns: RegExp[];
  excludePathPatterns?: RegExp[];
};

export async function collectLinksByPathPatterns(
  page: Page,
  baseUrl: string,
  options: LinkCollectorOptions,
) {
  const baseHost = new URL(baseUrl).hostname.replace(/^www\./i, "");
  const hrefs = await page.locator("a[href]").evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute("href")),
  );

  return uniqueStrings(
    hrefs
      .map((href) => absoluteUrl(baseUrl, href))
      .filter((href) => {
        if (!href) {
          return false;
        }

        const url = new URL(href);
        const host = url.hostname.replace(/^www\./i, "");
        const path = url.pathname;

        return (
          host === baseHost &&
          options.includePathPatterns.some((pattern) => pattern.test(path)) &&
          !(options.excludePathPatterns ?? []).some((pattern) => pattern.test(path))
        );
      }),
  );
}

export function extractSection(
  text: string | null | undefined,
  startPatterns: RegExp[],
) {
  const lines = splitLines(text);
  const startIndex = lines.findIndex((line) =>
    startPatterns.some((pattern) => pattern.test(line)),
  );

  if (startIndex === -1) {
    return null;
  }

  const collected: string[] = [];
  const startLine = lines[startIndex];
  const inlineContent = startLine.includes(":")
    ? normalizeWhitespace(startLine.split(":").slice(1).join(":"))
    : "";

  if (inlineContent) {
    collected.push(inlineContent);
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const boundaryLine = normalizeWhitespace(line.replace(/:\s*$/, ""));

    if (
      collected.length > 0 &&
      SECTION_BOUNDARIES.some((pattern) => pattern.test(boundaryLine)) &&
      !startPatterns.some((pattern) => pattern.test(boundaryLine))
    ) {
      break;
    }

    collected.push(line);
  }

  const section = collected.join("\n").trim();
  return section || null;
}

export function extractListItems(text: string | null | undefined) {
  return uniqueStrings(
    splitLines(text).map((line) =>
      line
        .replace(/^[•\-\d.)\s]+/, "")
        .replace(/^\[[^\]]+\]\s*/, "")
        .trim(),
    ),
  );
}

export function findLines(text: string | null | undefined, pattern: RegExp, limit = 12) {
  return splitLines(text).filter((line) => pattern.test(line)).slice(0, limit);
}

export function extractFirstPriceText(text: string | null | undefined) {
  const match = (text ?? "").match(
    /(?:₹|Rs\.?|INR)\s*[\d,]+(?:\s*\/\-)?(?:\s*per\s*person)?/i,
  );

  return normalizeWhitespace(match?.[0]) || null;
}

export function extractDurationText(text: string | null | undefined) {
  const match = (text ?? "").match(
    /(?:\d+\s*(?:Night|Nights|Day|Days|Hour|Hours|Hr|Hrs|Minutes?)(?:\s*\/\s*\d+\s*(?:Night|Nights|Day|Days))?|\d+N\s*\/\s*\d+D|Overnight)/i,
  );

  return normalizeWhitespace(match?.[0]) || null;
}

export function extractLocationText(text: string | null | undefined) {
  const pickupSection = extractSection(text, [/^pickup points?$/i]);

  if (pickupSection) {
    const pickupLine = extractListItems(pickupSection)[0];

    if (pickupLine) {
      return pickupLine;
    }
  }

  const match = (text ?? "").match(/(?:|Location\s*:?|Destination\s*:?)([^\n₹]{3,80})/i);
  return normalizeWhitespace(match?.[1]) || null;
}

export function extractDepartureDateLabels(text: string | null | undefined) {
  const values = new Set<string>();
  const sourceText = text ?? "";

  for (const match of sourceText.matchAll(/\b\d{1,2}\s+[A-Z][a-z]{2,8}\b/g)) {
    values.add(match[0]);
  }

  for (const match of sourceText.matchAll(/\bEvery\s+(?:Friday|Saturday|Sunday|Weekend)\b/gi)) {
    values.add(normalizeWhitespace(match[0]));
  }

  if (/available on request/i.test(sourceText)) {
    values.add("Available on request");
  }

  return [...values];
}

export async function extractDepartureDatesFromBookingLinks(
  page: Page,
  pageUrl: string,
): Promise<DepartureDate[]> {
  const anchors = await page
    .locator('a[href*="departure_date="]')
    .evaluateAll((elements) =>
      elements.map((element) => ({
        href: element.getAttribute("href"),
        text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
      })),
    );

  return anchors
    .map((anchor) => {
      const url = absoluteUrl(pageUrl, anchor.href);
      const isoDate = url ? new URL(url).searchParams.get("departure_date") : null;
      const label = normalizeWhitespace(anchor.text.split("|")[0]) || isoDate || "";
      const availability =
        normalizeWhitespace(
          anchor.text.match(/(?:Available|Sold\s*Out|Waitlist|On\s*Request)/i)?.[0],
        ) || null;
      const priceText = extractFirstPriceText(anchor.text);

      if (!label) {
        return null;
      }

      return {
        label,
        isoDate,
        availability,
        priceText,
      } satisfies DepartureDate;
    })
    .filter((value): value is DepartureDate => value !== null);
}

export function buildDepartureDatesFromText(text: string | null | undefined) {
  return extractDepartureDateLabels(text).map((label) => ({
    label,
    isoDate: null,
    availability: /available on request/i.test(label) ? "Available on request" : null,
    priceText: null,
  }));
}

export function extractPickupLines(text: string | null | undefined) {
  return findLines(text, PICKUP_HINT_PATTERN, 24);
}