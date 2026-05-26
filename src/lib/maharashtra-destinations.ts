import { normalizeSlug } from "@/lib/normalize-slug";

export const TREK_REGION_MAHARASHTRA = "maharashtra" as const;
export const TREK_REGION_OTHER = "other" as const;

export const MAHARASHTRA_DESTINATIONS: string[] = [...new Set([
  "sahyadri",
  "western ghats",
  "konkan",
  "igatpuri",
  "kasara",
  "bhandardara",
  "bhandaradara",
  "matheran",
  "lonavala",
  "khandala",
  "pawna",
  "pawna lake",
  "panshet",
  "panshet dam",
  "karjat",
  "malshej",
  "malshej ghat",
  "mahabaleshwar",
  "wai",
  "satara",
  "kolad",
  "alibag",
  "murbad",
  "nashik",
  "pune",
  "palghar",
  "thane",
  "ratnagiri",
  "sindhudurg",
  "tamhini",
  "tamhini ghat",
  "rajmachi",
  "rajmachi fort",
  "harishchandragad",
  "kalsubai",
  "harihar",
  "harihar fort",
  "harihar gad",
  "ratangad",
  "alang madan kulang",
  "amk",
  "alang",
  "madan",
  "kulang",
  "kalavantin",
  "kalavantin durg",
  "kalavantin pinnacle",
  "prabalgad",
  "prabalmachi",
  "irshalgad",
  "kohoj",
  "kohoj fort",
  "kavnai",
  "kavnai fort",
  "tandulwadi",
  "sagargad",
  "sondai",
  "tikona",
  "tikona fort",
  "lohagad",
  "lohagad fort",
  "visapur",
  "visapur fort",
  "rajgad",
  "rajgad fort",
  "torna",
  "torna fort",
  "sudhagad",
  "sudhagad fort",
  "bhimashankar",
  "bhimashankar forest",
  "kothaligad",
  "peth fort",
  "hadsar",
  "anjaneri",
  "asherigad",
  "tringalwadi",
  "bhairavgad",
  "bhairavgad moroshi",
  "garbett",
  "devkund",
  "devkund waterfall",
  "domzira",
  "gokundi",
  "kalu",
  "kalu waterfall",
  "dukes nose",
  "duke s nose",
  "nagphani",
  "aadrai",
  "aadrai forest",
  "aadrai jungle",
  "revdanda",
  "peb",
  "peb fort",
  "vikatgad",
  "sandhan valley",
  "vasota",
  "vasota jungle trek",
  "andharban",
  "tailbaila",
  "dhak bahiri",
  "jivdhan",
  "naneghat",
  "shivneri",
  "chavand",
  "nimgiri",
  "gorakhgad",
  "machindragad",
  "siddhagad",
  "chanderi",
  "mrugagad",
  "manikgad",
  "karnala",
  "carnala",
  "ajoba",
  "madhe ghat",
  "lingana",
  "raigad",
  "raigad fort",
  "pratapgad",
  "pratapgad fort",
  "sinhagad",
  "sinhagad fort",
  "purandar",
  "purandar fort",
  "malhargad",
  "tung",
  "korigad",
  "korigad fort",
  "sarasgad",
  "morgiri",
  "bhorgiri",
  "rajgad to torna",
  "torna to rajgad",
  "mangi tungi",
  "salher",
  "salota",
  "dhodap",
  "ahivant",
  "markanda",
  "ramsej",
  "trimbak",
  "brahmagiri",
  "taramati",
  "kokankada",
  "mahipatgad",
  "sumargad",
  "rasalgad",
  "kamalgad",
  "kenjalgad",
  "rohida",
  "rohideshwar",
  "sajjangad",
  "vasind",
  "ulhas valley",
  "diksal",
  "kondana",
  "thanale",
  "ghangad",
  "mahuli",
  "takmak",
  "katraj to sinhagad",
  "gorakhgad machindragad",
  "bhandardara fireflies",
])];

function normalizeForComparison(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactNormalizedValue(value: string) {
  return value.replace(/[^a-z0-9]+/g, "");
}

const NORMALIZED_MAHARASHTRA_DESTINATIONS = MAHARASHTRA_DESTINATIONS
  .map(normalizeForComparison)
  .filter(Boolean)
  .sort((left, right) => right.length - left.length);

const NORMALIZED_MAHARASHTRA_DESTINATION_SLUGS = MAHARASHTRA_DESTINATIONS
  .map(normalizeSlug)
  .filter(Boolean)
  .sort((left, right) => right.length - left.length);

const COMPACT_MAHARASHTRA_DESTINATION_SLUGS = NORMALIZED_MAHARASHTRA_DESTINATION_SLUGS
  .map(compactNormalizedValue)
  .filter(Boolean)
  .sort((left, right) => right.length - left.length);

export function isMaharashtraTrek(trekName: string): boolean {
  const normalizedTrekName = normalizeForComparison(trekName);
  const normalizedTrekSlug = normalizeSlug(trekName);
  const compactTrekSlug = compactNormalizedValue(normalizedTrekSlug);

  if (!normalizedTrekName && !normalizedTrekSlug && !compactTrekSlug) {
    return false;
  }

  return (
    NORMALIZED_MAHARASHTRA_DESTINATIONS.some((destination) =>
      normalizedTrekName.includes(destination),
    ) ||
    NORMALIZED_MAHARASHTRA_DESTINATION_SLUGS.some((destinationSlug) =>
      normalizedTrekSlug.includes(destinationSlug),
    ) ||
    COMPACT_MAHARASHTRA_DESTINATION_SLUGS.some((destinationSlug) =>
      compactTrekSlug.includes(destinationSlug),
    )
  );
}

export function classifyTrekRegion(
  trekName: string,
): typeof TREK_REGION_MAHARASHTRA | typeof TREK_REGION_OTHER {
  return isMaharashtraTrek(trekName)
    ? TREK_REGION_MAHARASHTRA
    : TREK_REGION_OTHER;
}