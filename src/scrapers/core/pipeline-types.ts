import type {
  InclusionStatus,
  MealPlan,
  TransportType,
} from "../../lib/types";

export type RawSectionKey =
  | "basicInfo"
  | "cost"
  | "inclusions"
  | "exclusions"
  | "itinerary"
  | "pickup"
  | "transport"
  | "meals"
  | "stay"
  | "highlights"
  | "otherInformation"
  | "quickInformation"
  | "departure"
  | "forestFee";

export type RawSectionMap = Record<RawSectionKey, string | null>;

export type NormalizedTokenCategory = "TRANSPORT" | "MEAL" | "STAY";

export type TokenSignal = "INCLUDED" | "EXCLUDED" | "MENTIONED";

export type TransportToken =
  | "TRAIN"
  | "AC_BUS"
  | "BUS"
  | "TEMPO_TRAVELLER"
  | "JEEP"
  | "LOCAL_TRANSFER"
  | "SELF_DRIVE"
  | "OWN_TRANSPORT";

export type MealToken = "BREAKFAST" | "LUNCH" | "DINNER" | "TEA_SNACKS";

export type StayToken =
  | "TENT_STAY"
  | "HOTEL_STAY"
  | "DORMITORY_STAY"
  | "HOMESTAY_STAY";

export type NormalizedTokenCode = TransportToken | MealToken | StayToken;

export type NormalizedToken = {
  code: NormalizedTokenCode;
  label: string;
  category: NormalizedTokenCategory;
  sourceSection: RawSectionKey;
  signal: TokenSignal;
  matchedText: string;
};

export type DerivedPackageFields = {
  transportType: TransportType;
  transportSummary: string | null;
  transportTokens: TransportToken[];
  mealPlan: MealPlan;
  mealsAvailable: boolean;
  mealsSummary: string | null;
  mealTokens: MealToken[];
  stayIncluded: boolean;
  staySummary: string | null;
  stayTokens: StayToken[];
  forestFeeStatus: InclusionStatus;
  inclusionHighlights: string[];
  exclusionHighlights: string[];
};

export type ValidationIssue = {
  code: string;
  severity: "warning" | "error";
  message: string;
  sourceSections: RawSectionKey[];
};

export type LayeredPipelineSnapshot = {
  sections: RawSectionMap;
  tokens: NormalizedToken[];
  derived: DerivedPackageFields;
  validationIssues: ValidationIssue[];
};