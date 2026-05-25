import type {
  InclusionStatus,
  MealPlan,
  TransportType,
  VariantTagCode,
} from "../lib/types";

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

export type LogMeta = Record<string, unknown>;

export type ScraperLogger = {
  child(scope: string): ScraperLogger;
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
};

export type RawDepartureDate = {
  label: string;
  isoDate?: string | null;
  availability?: string | null;
  priceText?: string | null;
};

export type DepartureDate = {
  label: string;
  isoDate: string | null;
  availability: string | null;
  priceText: string | null;
};

export type RawScrapedPackage = {
  title: string;
  sourceUrl: string;
  canonicalTrekName?: string;
  canonicalTrekSlug?: string;
  canonicalDestinationName?: string;
  priceText?: string | null;
  durationText?: string | null;
  locationText?: string | null;
  transportText?: string | null;
  mealText?: string | null;
  forestFeeText?: string | null;
  pickupText?: string | null;
  departureText?: string | null;
  inclusionsText?: string | null;
  exclusionsText?: string | null;
  inclusions?: string[];
  exclusions?: string[];
  pickupPoints?: string[];
  departureDates?: RawDepartureDate[];
  pageText?: string | null;
  rawSnapshot?: Record<string, JsonValue>;
};

export type NormalizedScrapedPackage = {
  title: string;
  sourceUrl: string;
  trekName: string;
  trekSlug: string;
  variantTags: VariantTagCode[];
  variantSignature: string;
  variantLabel: string;
  priceInr: number | null;
  priceText: string | null;
  durationText: string | null;
  locationText: string | null;
  transportType: TransportType;
  mealPlan: MealPlan;
  forestFeeStatus: InclusionStatus;
  pickupLocations: string[];
  departureDates: DepartureDate[];
  inclusions: string[];
  exclusions: string[];
  rawPageText: string | null;
  rawSnapshot: Record<string, JsonValue> | null;
  rawPriceText: string | null;
  rawDurationText: string | null;
  rawLocationText: string | null;
  rawTransportText: string | null;
  rawMealText: string | null;
  rawForestFeeText: string | null;
  rawPickupText: string | null;
  rawDepartureText: string | null;
  rawInclusionsText: string | null;
  rawExclusionsText: string | null;
  normalizedSnapshot: Record<string, JsonValue>;
  pageFingerprint: string;
};

export type CrawlStrategy = "LISTING_PAGE" | "DETAIL_PAGE";

export type ScraperSource = {
  label: string;
  sourceUrl: string;
  parserKey: string;
  crawlStrategy: CrawlStrategy;
  canonicalTrekName?: string;
  canonicalTrekSlug?: string;
};

export type OrganizerDefinition = {
  name: string;
  slug: string;
  websiteUrl: string;
  description?: string;
};

export type ScraperContext = {
  dryRun: boolean;
  userAgent: string;
  now: Date;
  maxAttempts: number;
  maxToursPerSource: number | null;
  navigationTimeoutMs: number;
  logger: ScraperLogger;
};

export type OrganizerScraper = {
  organizer: OrganizerDefinition;
  sources: ScraperSource[];
  scrape(context: ScraperContext): Promise<RawScrapedPackage[]>;
};

export type ScraperRunOptions = {
  dryRun: boolean;
  organizer: string | null;
  limit: number | null;
};

export type ScraperRunResult = {
  organizerSlug: string;
  packagesFound: number;
  packagesUpserted: number;
  durationMs: number;
  dryRun: boolean;
  status: "success" | "failed";
  error?: string;
};