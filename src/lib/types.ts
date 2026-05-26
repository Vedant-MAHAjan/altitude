export type DifficultyLevel =
  | "EASY"
  | "MODERATE"
  | "MODERATE_HARD"
  | "HARD"
  | "UNKNOWN";

export type ComparisonTransportType = "AC_BUS" | "NON_AC_BUS" | "TRAIN";

export type ListingCity = "MUMBAI" | "PUNE" | "MIXED" | "OTHER";

export type DepartureCityCode = "MUMBAI" | "PUNE";

export type VariantTagCode =
  | "TREK_ONLY"
  | "CAMPING"
  | "SUNRISE"
  | "NIGHT_TREK"
  | "FIREFLIES";

export type TransportType =
  | "BUS"
  | "TRAIN"
  | "SELF_DRIVE"
  | "OWN_TRANSPORT"
  | "LOCAL_TRANSFER"
  | "NONE"
  | "MIXED"
  | "UNKNOWN";

export type MealPlan = "INCLUDED" | "PARTIAL" | "NOT_INCLUDED" | "UNKNOWN";

export type InclusionStatus = "INCLUDED" | "NOT_INCLUDED" | "UNKNOWN";

export type TrekSearchEntry = {
  name: string;
  slug: string;
  aliases: string[];
};

export type DestinationCitySummary = {
  destinationName: string;
  destinationSlug: string;
  departureCity: DepartureCityCode;
  routePath: string;
  availableVariants: VariantTagCode[];
  startingPrice: number | null;
  organizerCount: number;
  nextDepartureAt: string | null;
  packageCount: number;
  updatedAt: string | null;
  summary: string | null;
};

export type DestinationCityComparison = {
  destinationName: string;
  destinationSlug: string;
  departureCity: DepartureCityCode;
  routePath: string;
  summary: string | null;
  packageCount: number;
  organizerCount: number;
  startingPrice: number | null;
  priceMin: number | null;
  priceMax: number | null;
  nextDepartureAt: string | null;
  availableVariants: VariantTagCode[];
  filters: ComparisonFilters;
  summaryTable: ComparisonSummaryTable;
  variantGroups: VariantGroupSummary[];
  packages: ComparisonPackage[];
  updatedAt: string | null;
};

export type ComparisonFilters = {
  transportTypes: ComparisonTransportType[];
  mealPlans: MealPlan[];
  cities: Array<Exclude<ListingCity, "OTHER">>;
  variantTags: VariantTagCode[];
  organizers: Array<{
    name: string;
    slug: string;
  }>;
};

export type ComparisonSummaryTable = {
  lowestPrice: number | null;
  cheapestOrganizerName: string | null;
  cheapestOrganizerSlug: string | null;
  cheapestPackageTitle: string | null;
  mealsSummary: string[];
  organizerCount: number;
  variantCount: number;
};

export type VariantGroupSummary = {
  signature: string;
  label: string;
  tags: VariantTagCode[];
  packageCount: number;
  priceMin: number | null;
  priceMax: number | null;
};

export type ComparisonDepartureDate = {
  label: string;
  isoDate: string | null;
};

export type ComparisonPackage = {
  id: string;
  title: string;
  organizerName: string;
  organizerSlug: string;
  trekName?: string;
  trekSlug?: string;
  trekSummary?: string | null;
  sourceUrl: string;
  priceInr: number | null;
  priceText: string | null;
  transportType: ComparisonTransportType;
  mealPlan: MealPlan;
  forestFeeStatus: InclusionStatus;
  listingCity: ListingCity;
  variantTags: VariantTagCode[];
  variantSignature: string;
  variantLabel: string;
  nextDepartureAt: string | null;
  departureDates: ComparisonDepartureDate[];
  mealsSummary: string | null;
  staySummary: string | null;
  inclusionHighlights: string[];
  pickupLocations: string[];
  lastUpdatedAt: string;
  updatedAtMs: number;
  searchText: string;
  /** When true, this row is a placeholder for an organizer whose data is under review. */
  isPending?: boolean;
  /** Direct website URL for the organizer (used in pending placeholder rows). */
  organizerWebsiteUrl?: string;
};

export type TrekSummary = {
  name: string;
  slug: string;
  region: string | null;
  durationDays: number | null;
  durationNights: number | null;
  difficulty: DifficultyLevel;
  summary: string | null;
  packageCount: number;
  organizerCount: number;
  priceMin: number | null;
  priceMax: number | null;
  updatedAt: string | null;
};

export type TrekComparison = TrekSummary & {
  filters: ComparisonFilters;
  summaryTable: ComparisonSummaryTable;
  packages: ComparisonPackage[];
};

export type OrganizerSummary = {
  name: string;
  slug: string;
  websiteUrl: string;
  description: string | null;
  packageCount: number;
  activeTreks: number;
  priceMin: number | null;
  priceMax: number | null;
  pickupLocations: string[];
  updatedAt: string | null;
};

export type OrganizerDetail = OrganizerSummary & {
  treks: Array<{
    name: string;
    slug: string;
  }>;
  packages: ComparisonPackage[];
};

export type HomepageData = {
  featuredDestinations: DestinationCitySummary[];
  routeCount: number;
  organizerCount: number;
  packageCount: number;
  priceFloor: number | null;
  lastUpdatedAt: string | null;
};

export type SnapshotManifest = {
  generatedAt: string;
  trekSlugs: string[];
  destinationRoutePaths: string[];
  organizerSlugs: string[];
  featuredTrekSlugs: string[];
  featuredDestinationRoutePaths: string[];
  featuredOrganizerSlugs: string[];
  prerenderTrekSlugs: string[];
  prerenderDestinationRoutePaths: string[];
  prerenderOrganizerSlugs: string[];
};