import type {
  MealToken,
  NormalizedTokenCategory,
  NormalizedTokenCode,
  StayToken,
  TransportToken,
} from "./pipeline-types";

type TokenDefinition<TCode extends string> = {
  code: TCode;
  label: string;
  summaryLabel: string;
  category: NormalizedTokenCategory;
  patterns: RegExp[];
};

export const transportTokenDefinitions: TokenDefinition<TransportToken>[] = [
  {
    code: "TRAIN",
    label: "Train",
    summaryLabel: "Train",
    category: "TRANSPORT",
    patterns: [
      /\btrain\b/i,
      /\bkasara\b/i,
      /\blocal train\b/i,
      /\brailway station\b/i,
      /\bstation\b/i,
    ],
  },
  {
    code: "AC_BUS",
    label: "AC Bus",
    summaryLabel: "AC bus",
    category: "TRANSPORT",
    patterns: [/\bac\s+bus\b/i, /\bac coach\b/i, /\bvolvo\b/i],
  },
  {
    code: "BUS",
    label: "Bus",
    summaryLabel: "Bus",
    category: "TRANSPORT",
    patterns: [
      /\bnon[-\s]?ac\b/i,
      /\bpushback\b/i,
      /\bbus\b/i,
      /\bcoach\b/i,
    ],
  },
  {
    code: "TEMPO_TRAVELLER",
    label: "Tempo Traveller",
    summaryLabel: "Tempo traveller",
    category: "TRANSPORT",
    patterns: [/\btempo traveller\b/i, /\btraveller\b/i],
  },
  {
    code: "JEEP",
    label: "Jeep",
    summaryLabel: "Jeep",
    category: "TRANSPORT",
    patterns: [/\bjeep\b/i],
  },
  {
    code: "LOCAL_TRANSFER",
    label: "Local Transfer",
    summaryLabel: "Local transfer",
    category: "TRANSPORT",
    patterns: [
      /\blocal transfer\b/i,
      /\bshared cab\b/i,
      /\bshared vehicle\b/i,
      /\bbase village transfer\b/i,
    ],
  },
  {
    code: "SELF_DRIVE",
    label: "Self Drive",
    summaryLabel: "Self-drive",
    category: "TRANSPORT",
    patterns: [/\bself drive\b/i],
  },
  {
    code: "OWN_TRANSPORT",
    label: "Own Transport",
    summaryLabel: "Own transport",
    category: "TRANSPORT",
    patterns: [/\bown transport\b/i, /\bpersonal vehicle\b/i, /\bby own vehicle\b/i],
  },
];

export const mealTokenDefinitions: TokenDefinition<MealToken>[] = [
  {
    code: "BREAKFAST",
    label: "Breakfast",
    summaryLabel: "Breakfast",
    category: "MEAL",
    patterns: [/\bbreakfast\b/i],
  },
  {
    code: "LUNCH",
    label: "Lunch",
    summaryLabel: "Lunch",
    category: "MEAL",
    patterns: [/\blunch\b/i],
  },
  {
    code: "DINNER",
    label: "Dinner",
    summaryLabel: "Dinner",
    category: "MEAL",
    patterns: [/\bdinner\b/i],
  },
  {
    code: "TEA_SNACKS",
    label: "Tea and snacks",
    summaryLabel: "Tea and snacks",
    category: "MEAL",
    patterns: [/\btea\b/i, /\bsnacks?\b/i, /\brefreshments?\b/i],
  },
];

export const stayTokenDefinitions: TokenDefinition<StayToken>[] = [
  {
    code: "TENT_STAY",
    label: "Tent Stay",
    summaryLabel: "Tent stay",
    category: "STAY",
    patterns: [/\btent\b/i, /\bcamp(?:ing)?\b/i, /\bcampsite\b/i],
  },
  {
    code: "HOTEL_STAY",
    label: "Hotel Stay",
    summaryLabel: "Hotel stay",
    category: "STAY",
    patterns: [/\bhotel\b/i, /\bresort\b/i],
  },
  {
    code: "DORMITORY_STAY",
    label: "Dormitory Stay",
    summaryLabel: "Dormitory stay",
    category: "STAY",
    patterns: [/\bdormitory\b/i, /\bdorm\b/i],
  },
  {
    code: "HOMESTAY_STAY",
    label: "Homestay",
    summaryLabel: "Homestay",
    category: "STAY",
    patterns: [/\bhomestay\b/i, /\bguest house\b/i],
  },
];

export const tokenDefinitions = [
  ...transportTokenDefinitions,
  ...mealTokenDefinitions,
  ...stayTokenDefinitions,
];

const tokenSummaryLabelEntries = tokenDefinitions.map((definition) => [
  definition.code,
  definition.summaryLabel,
]);

export const tokenSummaryLabels = Object.fromEntries(tokenSummaryLabelEntries) as Record<
  NormalizedTokenCode,
  string
>;