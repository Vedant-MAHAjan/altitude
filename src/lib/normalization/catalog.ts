import type {
  ComparisonTransportType,
  DifficultyLevel,
  InclusionStatus,
  DepartureCityCode,
  ListingCity,
  MealPlan,
  TransportType,
  VariantTagCode,
} from "@/lib/types";

type Rule<T extends string> = {
  value: T;
  patterns: RegExp[];
};

export const transportLabels: Record<ComparisonTransportType, string> = {
  AC_BUS: "AC Bus",
  NON_AC_BUS: "Non-AC Bus",
  TRAIN: "Train",
};

export const mealPlanLabels: Record<MealPlan, string> = {
  INCLUDED: "Included",
  PARTIAL: "Partial",
  NOT_INCLUDED: "Not included",
  UNKNOWN: "Not confirmed",
};

export const inclusionLabels: Record<InclusionStatus, string> = {
  INCLUDED: "Included",
  NOT_INCLUDED: "Excluded",
  UNKNOWN: "Not confirmed",
};

export const listingCityLabels: Record<ListingCity, string> = {
  MUMBAI: "Mumbai",
  PUNE: "Pune",
  MIXED: "Mumbai + Pune",
  OTHER: "Other",
};

export const departureCityLabels: Record<DepartureCityCode, string> = {
  MUMBAI: "Mumbai",
  PUNE: "Pune",
};

export const variantTagLabels: Record<VariantTagCode, string> = {
  TREK_ONLY: "Trek",
  CAMPING: "Camping",
  SUNRISE: "Sunrise",
  NIGHT_TREK: "Night trek",
  FIREFLIES: "Fireflies",
};

export const difficultyLabels: Record<DifficultyLevel, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  MODERATE_HARD: "Moderate hard",
  HARD: "Hard",
  UNKNOWN: "Unrated",
};

export const transportRules: Rule<TransportType>[] = [
  {
    value: "BUS",
    patterns: [/bus/i, /ac coach/i, /private vehicle/i, /tempo traveller/i],
  },
  {
    value: "TRAIN",
    patterns: [/train/i, /local train/i],
  },
  {
    value: "SELF_DRIVE",
    patterns: [/self ?drive/i, /own car/i, /drive yourself/i],
  },
  {
    value: "OWN_TRANSPORT",
    patterns: [/own transport/i, /reach base village/i],
  },
  {
    value: "LOCAL_TRANSFER",
    patterns: [
      /jeep transfer/i,
      /local transfer/i,
      /shared cab/i,
      /private jeep/i,
      /local jeep/i,
      /x-kasara/i,
      /kasara to kasara/i,
      /local transport/i,
      /pickup from kasara/i,
    ],
  },
  {
    value: "NONE",
    patterns: [/transport not included/i, /no transport/i],
  },
];

export const mealPlanRules: Rule<MealPlan>[] = [
  {
    value: "NOT_INCLUDED",
    patterns: [/meals? not included/i, /food not included/i, /without meals?/i],
  },
  {
    value: "PARTIAL",
    patterns: [/breakfast only/i, /tea and breakfast/i, /one meal/i],
  },
  {
    value: "INCLUDED",
    patterns: [
      /meals? included/i,
      /breakfast.*lunch/i,
      /dinner.*breakfast/i,
      /food included/i,
    ],
  },
];

export const inclusionRules: Rule<InclusionStatus>[] = [
  {
    value: "NOT_INCLUDED",
    patterns: [/not included/i, /excluded/i, /extra at actual/i, /excluded entry/i],
  },
  {
    value: "INCLUDED",
    patterns: [
      /included/i,
      /inclusive/i,
      /covered/i,
      /included.*entry/i,
      /entrance fees?/i,
      /entry charges?/i,
      /permit charges?/i,
    ],
  },
];

export const knownPickupLocations = [
  "CSMT",
  "Byculla",
  "Borivali",
  "Dadar",
  "Kurla",
  "Ghatkopar",
  "Thane",
  "Mulund",
  "Dombivali",
  "Kalyan",
  "Panvel",
  "Chembur",
  "Sion",
  "Lonavala",
  "Kasara",
  "Nashik",
  "Trimbak Phata",
  "Nashik Phata",
  "Bari",
  "Bari Village",
  "Baari",
  "Nirgudpada",
  "Harshewadi",
] as const;