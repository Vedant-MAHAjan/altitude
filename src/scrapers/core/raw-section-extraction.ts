import { normalizeWhitespace } from "../../lib/normalization/extractors";
import type { JsonValue, RawScrapedPackage } from "../types";
import type { RawSectionMap } from "./pipeline-types";

function splitLines(value: string | null | undefined) {
  return (value ?? "")
    .split(/\n+/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
}

function mergeSectionText(...values: Array<string | null | undefined>) {
  const uniqueLines = [...new Set(values.flatMap((value) => splitLines(value)))];
  return uniqueLines.length > 0 ? uniqueLines.join("\n") : null;
}

function findMatchingLines(
  values: Array<string | null | undefined>,
  pattern: RegExp,
) {
  return values.flatMap((value) => splitLines(value).filter((line) => pattern.test(line)));
}

function getSnapshotSections(rawPackage: RawScrapedPackage) {
  const sections = rawPackage.rawSnapshot?.sections;

  if (!sections || typeof sections !== "object" || Array.isArray(sections)) {
    return {} as Record<string, JsonValue>;
  }

  return sections as Record<string, JsonValue>;
}

function asSnapshotText(value: JsonValue | undefined) {
  return typeof value === "string" ? normalizeWhitespace(value) || null : null;
}

export function buildRawSections(rawPackage: RawScrapedPackage): RawSectionMap {
  const snapshotSections = getSnapshotSections(rawPackage);
  const basicInfo = asSnapshotText(snapshotSections.basicInfoText);
  const cost = asSnapshotText(snapshotSections.costText);
  const inclusions =
    normalizeWhitespace(rawPackage.inclusionsText) ||
    asSnapshotText(snapshotSections.inclusionText);
  const exclusions =
    normalizeWhitespace(rawPackage.exclusionsText) ||
    asSnapshotText(snapshotSections.exclusionText);
  const itinerary = asSnapshotText(snapshotSections.itineraryText);
  const pickup =
    normalizeWhitespace(rawPackage.pickupText) ||
    asSnapshotText(snapshotSections.pickupText);
  const highlights = asSnapshotText(snapshotSections.highlightsText);
  const otherInformation = asSnapshotText(snapshotSections.otherInformationText);
  const quickInformation = asSnapshotText(snapshotSections.quickInformationText);
  const departure = mergeSectionText(
    normalizeWhitespace(rawPackage.departureText) || null,
    asSnapshotText(snapshotSections.batchesText),
    itinerary,
  );
  const transport = mergeSectionText(
    normalizeWhitespace(rawPackage.transportText) || null,
    asSnapshotText(snapshotSections.modeOfTransportText),
    ...findMatchingLines(
      [cost, inclusions, itinerary, otherInformation, quickInformation, pickup, departure],
      /\b(train|bus|jeep|traveller|transport|travel|pickup|kasara|car|station|railway)\b/i,
    ),
  );
  const explicitMeals = mergeSectionText(
    ...findMatchingLines(
      [inclusions, highlights],
      /\b(breakfast|lunch|dinner|meal|tea|snack|food|veg|nonveg|non-veg)\b/i,
    ),
  );
  const contextualMeals = mergeSectionText(
    ...findMatchingLines(
      [itinerary, otherInformation, quickInformation],
      /\b(breakfast|lunch|dinner|meal|tea|snack|food|veg|nonveg|non-veg)\b/i,
    ),
  );
  const meals =
    explicitMeals || contextualMeals || normalizeWhitespace(rawPackage.mealText) || null;
  const stay = mergeSectionText(
    asSnapshotText(snapshotSections.stayText),
    ...findMatchingLines(
      [inclusions, exclusions, highlights, itinerary, otherInformation, quickInformation, basicInfo],
      /\b(stay|tent|camp|accommodation|accomodation|hotel|homestay|dormitory|dorm)\b/i,
    ),
  );
  const forestFee = mergeSectionText(
    normalizeWhitespace(rawPackage.forestFeeText) || null,
    ...findMatchingLines(
      [inclusions, exclusions],
      /\b(entry|forest|permit|fees?|ticket|charges?)\b/i,
    ),
  );

  return {
    basicInfo,
    cost,
    inclusions,
    exclusions,
    itinerary,
    pickup,
    transport,
    meals,
    stay,
    highlights,
    otherInformation,
    quickInformation,
    departure,
    forestFee,
  };
}