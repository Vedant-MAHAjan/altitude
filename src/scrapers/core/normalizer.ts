import { createHash } from "node:crypto";

import {
  extractPickupLocations,
  extractPriceInr,
  normalizeWhitespace,
} from "../../lib/normalization/extractors";
import {
  buildVariantLabel,
  buildVariantSignature,
  getCanonicalTrekIdentity,
} from "../../lib/normalization/trek-identity";
import { buildLayeredPipeline } from "./layered-pipeline";
import { validateNormalizedPackage } from "./schema";
import type {
  DepartureDate,
  NormalizedScrapedPackage,
  RawScrapedPackage,
} from "../types";

function createFingerprint(payload: Record<string, unknown>) {
  return createHash("sha1").update(JSON.stringify(payload)).digest("hex");
}

function normalizeList(values: string[] | undefined) {
  return [...new Set((values ?? []).map((value) => normalizeWhitespace(value)).filter(Boolean))];
}

function normalizeDepartureDates(values: RawScrapedPackage["departureDates"]): DepartureDate[] {
  const dates = (values ?? [])
    .map((value) => ({
      label: normalizeWhitespace(value.label),
      isoDate: normalizeWhitespace(value.isoDate) || null,
      availability: normalizeWhitespace(value.availability) || null,
      priceText: normalizeWhitespace(value.priceText) || null,
    }))
    .filter((value) => value.label);

  const uniqueByKey = new Map<string, DepartureDate>();

  for (const value of dates) {
    uniqueByKey.set(`${value.label}:${value.isoDate ?? ""}`, value);
  }

  return [...uniqueByKey.values()];
}

export function normalizeScrapedPackage(
  rawPackage: RawScrapedPackage,
): NormalizedScrapedPackage {
  const canonicalIdentity = getCanonicalTrekIdentity(
    rawPackage.canonicalTrekName ?? rawPackage.title,
    rawPackage.canonicalTrekName ?? null,
  );
  const trekSlug = rawPackage.canonicalTrekSlug ?? canonicalIdentity.trekSlug;
  const variantTags = canonicalIdentity.variantTags;
  const variantSignature = buildVariantSignature(variantTags);
  const variantLabel = buildVariantLabel(variantTags);
  const trekName = canonicalIdentity.trekName;
  const layeredPipeline = buildLayeredPipeline(rawPackage);
  const mealText = layeredPipeline.sections.meals;
  const transportText = layeredPipeline.sections.transport;
  const forestFeeText = layeredPipeline.sections.forestFee;
  const pickupSource = [
    rawPackage.pickupText,
    layeredPipeline.sections.pickup,
    rawPackage.locationText,
    ...(rawPackage.pickupPoints ?? []),
  ]
    .filter(Boolean)
    .join(" ");
  const departureDates = normalizeDepartureDates(rawPackage.departureDates);
  const inclusions = normalizeList(rawPackage.inclusions);
  const exclusions = normalizeList(rawPackage.exclusions);
  const transportType = layeredPipeline.derived.transportType;
  const pickupLocations =
    transportType === "TRAIN" ? [] : extractPickupLocations(pickupSource);
  const normalizedSnapshot = {
    trekSlug,
    variantTags,
    variantSignature,
    variantLabel,
    priceInr: extractPriceInr(rawPackage.priceText),
    durationText: normalizeWhitespace(rawPackage.durationText) || null,
    locationText: normalizeWhitespace(rawPackage.locationText) || null,
    transportType,
    mealPlan: layeredPipeline.derived.mealPlan,
    forestFeeStatus: layeredPipeline.derived.forestFeeStatus,
    pickupLocations,
    departureDates,
    inclusions,
    exclusions,
    pipeline: layeredPipeline,
  };

  return validateNormalizedPackage({
    title: normalizeWhitespace(rawPackage.title),
    sourceUrl: rawPackage.sourceUrl,
    sourceTrekName:
      normalizeWhitespace(rawPackage.canonicalTrekName ?? rawPackage.title) || trekName,
    trekName,
    trekSlug,
    variantTags,
    variantSignature,
    variantLabel,
    priceInr: normalizedSnapshot.priceInr,
    priceText: normalizeWhitespace(rawPackage.priceText) || null,
    durationText: normalizedSnapshot.durationText,
    locationText: normalizedSnapshot.locationText,
    transportType: normalizedSnapshot.transportType,
    mealPlan: normalizedSnapshot.mealPlan,
    forestFeeStatus: normalizedSnapshot.forestFeeStatus,
    pickupLocations: normalizedSnapshot.pickupLocations,
    departureDates,
    inclusions,
    exclusions,
    rawPageText: normalizeWhitespace(rawPackage.pageText) || null,
    rawSnapshot: rawPackage.rawSnapshot ?? null,
    rawPriceText: normalizeWhitespace(rawPackage.priceText) || null,
    rawDurationText: normalizeWhitespace(rawPackage.durationText) || null,
    rawLocationText: normalizeWhitespace(rawPackage.locationText) || null,
    rawTransportText: transportText,
    rawMealText: mealText,
    rawForestFeeText: forestFeeText,
    rawPickupText: normalizeWhitespace(rawPackage.pickupText) || null,
    rawDepartureText: normalizeWhitespace(rawPackage.departureText) || null,
    rawInclusionsText: normalizeWhitespace(rawPackage.inclusionsText) || null,
    rawExclusionsText: normalizeWhitespace(rawPackage.exclusionsText) || null,
    normalizedSnapshot,
    pageFingerprint: createFingerprint({
      title: rawPackage.title,
      sourceUrl: rawPackage.sourceUrl,
      ...normalizedSnapshot,
      rawSnapshot: rawPackage.rawSnapshot ?? null,
    }),
    scrapeWarnings: rawPackage._scrapeWarnings ?? [],
  });
}