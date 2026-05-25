import { z } from "zod";

const departureDateSchema = z.object({
  label: z.string().min(1),
  isoDate: z.string().nullable(),
  availability: z.string().nullable(),
  priceText: z.string().nullable(),
});

export const normalizedScrapedPackageSchema = z.object({
  title: z.string().min(1),
  sourceUrl: z.string().url(),
  trekName: z.string().min(1),
  trekSlug: z.string().min(1),
  variantTags: z.array(
    z.enum(["TREK_ONLY", "CAMPING", "SUNRISE", "NIGHT_TREK", "FIREFLIES"]),
  ),
  variantSignature: z.string().min(1),
  variantLabel: z.string().min(1),
  priceInr: z.number().int().nullable(),
  priceText: z.string().nullable(),
  durationText: z.string().nullable(),
  locationText: z.string().nullable(),
  transportType: z.enum([
    "BUS",
    "TRAIN",
    "SELF_DRIVE",
    "OWN_TRANSPORT",
    "LOCAL_TRANSFER",
    "NONE",
    "MIXED",
    "UNKNOWN",
  ]),
  mealPlan: z.enum(["INCLUDED", "PARTIAL", "NOT_INCLUDED", "UNKNOWN"]),
  forestFeeStatus: z.enum(["INCLUDED", "NOT_INCLUDED", "UNKNOWN"]),
  pickupLocations: z.array(z.string()),
  departureDates: z.array(departureDateSchema),
  inclusions: z.array(z.string()),
  exclusions: z.array(z.string()),
  rawPageText: z.string().nullable(),
  rawSnapshot: z.record(z.string(), z.any()).nullable(),
  rawPriceText: z.string().nullable(),
  rawDurationText: z.string().nullable(),
  rawLocationText: z.string().nullable(),
  rawTransportText: z.string().nullable(),
  rawMealText: z.string().nullable(),
  rawForestFeeText: z.string().nullable(),
  rawPickupText: z.string().nullable(),
  rawDepartureText: z.string().nullable(),
  rawInclusionsText: z.string().nullable(),
  rawExclusionsText: z.string().nullable(),
  normalizedSnapshot: z.record(z.string(), z.any()),
  pageFingerprint: z.string().min(1),
  scrapeWarnings: z.array(z.string()),
});

export function validateNormalizedPackage<T>(value: T) {
  return normalizedScrapedPackageSchema.parse(value);
}