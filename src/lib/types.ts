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

export type ComparisonPackage = {
  id: string;
  title: string;
  organizerName: string;
  organizerSlug: string;
  organizerWebsiteUrl?: string;
  trekName?: string;
  trekSlug?: string;
  sourceUrl: string;
  priceInr: number | null;
  priceText: string | null;
  transportType: ComparisonTransportType;
  mealPlan: MealPlan;
  forestFeeStatus: InclusionStatus;
  listingCity: ListingCity;
  mealsAvailable: boolean;
  mealsSummary: string | null;
  stayIncluded: boolean;
  staySummary: string | null;
  inclusionHighlights: string[];
  exclusionHighlights: string[];
  transportSummary: string | null;
  pickupLocations: string[];
  lastUpdatedAt: string;
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