export type DifficultyLevel =
  | "EASY"
  | "MODERATE"
  | "MODERATE_HARD"
  | "HARD"
  | "UNKNOWN";

export type ComparisonTransportType = "AC_BUS" | "NON_AC_BUS" | "TRAIN";

export type ListingCity = "MUMBAI" | "PUNE" | "MIXED" | "OTHER";

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

export type ComparisonFilters = {
  transportTypes: ComparisonTransportType[];
  mealPlans: MealPlan[];
  cities: Array<Exclude<ListingCity, "OTHER">>;
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
};

export type ComparisonPackage = {
  id: string;
  title: string;
  organizerName: string;
  organizerSlug: string;
  trekName?: string;
  trekSlug?: string;
  sourceUrl: string;
  priceInr: number | null;
  priceText: string | null;
  transportType: ComparisonTransportType;
  mealPlan: MealPlan;
  forestFeeStatus: InclusionStatus;
  listingCity: ListingCity;
  mealsSummary: string | null;
  staySummary: string | null;
  inclusionHighlights: string[];
  pickupLocations: string[];
  lastUpdatedAt: string;
  updatedAtMs: number;
  searchText: string;
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
  featuredTreks: TrekSummary[];
  organizerCount: number;
  trekCount: number;
  packageCount: number;
  priceFloor: number | null;
  lastUpdatedAt: string | null;
};

export type SnapshotManifest = {
  generatedAt: string;
  trekSlugs: string[];
  organizerSlugs: string[];
  featuredTrekSlugs: string[];
  featuredOrganizerSlugs: string[];
  prerenderTrekSlugs: string[];
  prerenderOrganizerSlugs: string[];
};