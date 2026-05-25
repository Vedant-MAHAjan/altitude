import { normalizeWhitespace, slugify } from "@/lib/normalization/extractors";
import type { VariantTagCode } from "@/lib/types";

type CanonicalRule = {
  canonicalName: string;
  aliases: string[];
  patterns?: RegExp[];
};

type CanonicalTrekIdentity = {
  trekName: string;
  trekSlug: string;
  aliasValues: string[];
  matchedRule: string | null;
  variantTags: VariantTagCode[];
  variantSignature: string;
  variantLabel: string;
  normalizedTitle: string;
  canonicalKey: string;
};

const variantTagLabels: Record<VariantTagCode, string> = {
  TREK_ONLY: "Trek",
  CAMPING: "Camping",
  SUNRISE: "Sunrise",
  NIGHT_TREK: "Night trek",
  FIREFLIES: "Fireflies",
};

const variantRules: Array<{ tag: VariantTagCode; patterns: RegExp[] }> = [
  {
    tag: "CAMPING",
    patterns: [/\bcamp(?:ing)?\b/i, /\bglamp(?:ing)?\b/i, /\btent(?:s)?\b/i, /\bbonfire\b/i, /\bstay\b/i],
  },
  {
    tag: "SUNRISE",
    patterns: [/\bsunrise\b/i, /\bsun\s+rise\b/i],
  },
  {
    tag: "NIGHT_TREK",
    patterns: [/\bnight\s+trek\b/i, /\bmidnight\b/i, /\bmoonlight\b/i],
  },
  {
    tag: "FIREFLIES",
    patterns: [/\bfireflies\b/i, /\bfirefly\b/i],
  },
];

const canonicalRules: CanonicalRule[] = [
  {
    canonicalName: "Aadrai Jungle Trek",
    aliases: ["aadrai jungle trek", "aadrai forest trek", "aadrai trek"],
    patterns: [/\baadrai\b/i],
  },
  {
    canonicalName: "Harihar Fort",
    aliases: ["harihar fort", "harihar trek"],
    patterns: [/\bharihar\b/i],
  },
  {
    canonicalName: "Harishchandragad",
    aliases: ["harishchandragad", "harishchandra gad", "harishchandragad trek"],
    patterns: [/\bharishchandragad\b/i, /\bharishchandra\s*gad\b/i],
  },
  {
    canonicalName: "Kalsubai",
    aliases: ["kalsubai", "kalsubai trek", "kalsubai peak"],
    patterns: [/\bkalsubai\b/i],
  },
  {
    canonicalName: "Rajmachi Fort",
    aliases: ["rajmachi fort", "rajmachi", "rajamchi", "rajamachi"],
    patterns: [/\brajmachi\b/i, /\brajamchi\b/i, /\brajamachi\b/i],
  },
  {
    canonicalName: "Sandhan Valley",
    aliases: ["sandhan valley", "sandhan"],
    patterns: [/\bsandhan\s+valley\b/i],
  },
  {
    canonicalName: "Secret Waterfall",
    aliases: ["secret waterfall"],
    patterns: [/\bsecret\s+waterfall\b/i],
  },
  {
    canonicalName: "Ratangad",
    aliases: ["ratangad", "ratangad fort"],
    patterns: [/\bratangad\b/i],
  },
  {
    canonicalName: "Sondai Fort",
    aliases: ["sondai fort", "sondai"],
    patterns: [/\bsondai\b/i],
  },
  {
    canonicalName: "Alang Madan Kulang",
    aliases: ["alang madan kulang", "amk"],
    patterns: [/\balang\b.*\bmadan\b.*\bkulang\b/i, /\bamk\b/i],
  },
  {
    canonicalName: "Bhairavgad Climbing & Rappelling",
    aliases: ["bhairavgad", "bhairavgad rappelling"],
    patterns: [/\bbhairavgad\b/i],
  },
  {
    canonicalName: "Hadsar Fort Trekking & Khunti Climbing",
    aliases: ["hadsar fort", "hadsar khunti climbing", "hadsar"],
    patterns: [/\bhadsar\b/i],
  },
  {
    canonicalName: "Jivdhan-Vanarlingi Valley Crossing & Rappelling",
    aliases: ["jivdhan vanarlingi valley crossing", "jivdhan valley crossing", "jivdhan vanarlingi"],
    patterns: [/\bjivdhan\b/i],
  },
  {
    canonicalName: "Shitkada Waterfall Rappelling",
    aliases: ["shitkada", "shitkada waterfall rappelling"],
    patterns: [/\bshitkada\b/i],
  },
  {
    canonicalName: "Vasota Jungle",
    aliases: ["vasota", "vasota jungle", "vasota trek"],
    patterns: [/\bvasota\b/i],
  },
  {
    canonicalName: "Pawna Lake",
    aliases: ["pawna lake", "pawna"],
    patterns: [/\bpawna\b/i],
  },
  {
    canonicalName: "Bhandardara Lake",
    aliases: ["bhandardara lake", "bhandardara"],
    patterns: [/\bbhandardara\b/i],
  },
  {
    canonicalName: "Beach Camping Alibaug",
    aliases: ["beach camping alibaug", "alibaug beach camping"],
    patterns: [/\balibaug\b/i],
  },
  {
    canonicalName: "Igatpuri",
    aliases: ["igatpuri glamping", "igatpuri watersports", "igatpuri"],
    patterns: [/\bigatpuri\b/i],
  },
  {
    canonicalName: "Midnight Cycling Mumbai",
    aliases: ["midnight cycling", "mumbai midnight cycling"],
    patterns: [/\bmidnight\s+cycling\b/i],
  },
];

function normalizeAlias(value: string | null | undefined) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, " ")
    .replace(/[-_/|]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toDisplayTitle(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      if (/^[A-Z0-9&()/-]+$/.test(token)) {
        return token;
      }

      return token[0]?.toUpperCase() + token.slice(1).toLowerCase();
    })
    .join(" ");
}

function buildAliasValues(...values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => normalizeWhitespace(value)).filter(Boolean))];
}

function stripGenericNoise(value: string) {
  let normalized = normalizeAlias(value)
    .replace(/\btrek\s+only\b/gi, " ")
    .replace(/\bcamp(?:ing)?\b/gi, " ")
    .replace(/\bglamp(?:ing)?\b/gi, " ")
    .replace(/\btent(?:s)?\b/gi, " ")
    .replace(/\bstay\b/gi, " ")
    .replace(/\bbonfire\b/gi, " ")
    .replace(/\bsunrise\b/gi, " ")
    .replace(/\bnight\s+trek\b/gi, " ")
    .replace(/\bmidnight\b/gi, " ")
    .replace(/\bmoonlight\b/gi, " ")
    .replace(/\bfireflies\b/gi, " ")
    .replace(/\bfirefly\b/gi, " ")
    .replace(/₹\s*[\d,]+/g, " ")
    .replace(/\b(?:rs\.?|inr)\s*[\d,]+\b/gi, " ")
    .replace(/\b20\d{2}\b/g, " ")
    .replace(/\b(?:the\s+)?unexplored\b/gi, " ")
    .replace(/\bpremium\b/gi, " ")
    .replace(/\bdeal\b/gi, " ")
    .replace(/\bpackage\b/gi, " ")
    .replace(/\btour\b/gi, " ")
    .replace(/\btrip\b/gi, " ")
    .replace(/\bweekend\b/gi, " ")
    .replace(/\bmonsoon\b/gi, " ")
    .replace(/\bdeparture(?:s)?\b/gi, " ")
    .replace(/\bbatch(?:es)?\b/gi, " ")
    .replace(/\bfrom\s+(?:mumbai|pune|thane|kasara|lonavala)\b/gi, " ")
    .replace(/\b(?:mumbai|pune|thane|kasara|lonavala)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!normalized) {
    normalized = normalizeAlias(value);
  }

  return normalized;
}

function extractVariantTags(...values: Array<string | null | undefined>): VariantTagCode[] {
  const sourceText = values.map((value) => normalizeWhitespace(value)).filter(Boolean).join(" ");
  const tags = variantRules
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(sourceText)))
    .map((rule) => rule.tag);

  return tags.length > 0 ? ([...new Set(tags)] as VariantTagCode[]) : (["TREK_ONLY"] as VariantTagCode[]);
}

function sortVariantTags(tags: VariantTagCode[]) {
  const order: VariantTagCode[] = ["SUNRISE", "NIGHT_TREK", "FIREFLIES", "CAMPING", "TREK_ONLY"];

  return [...new Set(tags)].sort((left, right) => order.indexOf(left) - order.indexOf(right));
}

export function buildVariantSignature(tags: VariantTagCode[]) {
  return sortVariantTags(tags).join("__");
}

export function buildVariantLabel(tags: VariantTagCode[]) {
  return sortVariantTags(tags)
    .map((tag) => variantTagLabels[tag])
    .join(" + ");
}

export function normalizeTrekAliasValue(value: string | null | undefined) {
  return normalizeAlias(value);
}

export function getCanonicalTrekIdentity(
  rawTitle: string,
  fallbackName?: string | null,
): CanonicalTrekIdentity {
  const sourceTitle = normalizeWhitespace(rawTitle || fallbackName || "Untitled Trek");
  const baseSegment = normalizeWhitespace(sourceTitle).split("|")[0] ?? sourceTitle;
  const normalizedTitle = stripGenericNoise(baseSegment);
  const variantTags = extractVariantTags(sourceTitle, fallbackName);
  const canonicalKey = normalizedTitle || normalizeWhitespace(fallbackName) || sourceTitle;
  const candidateSlug = slugify(canonicalKey);

  for (const rule of canonicalRules) {
    const aliasMatch = rule.aliases.some((alias) => normalizedTitle === normalizeAlias(alias) || candidateSlug === slugify(alias));
    const patternMatch = rule.patterns?.some((pattern) => pattern.test(normalizedTitle));

    if (!aliasMatch && !patternMatch) {
      continue;
    }

    return {
      trekName: rule.canonicalName,
      trekSlug: slugify(rule.canonicalName),
      aliasValues: buildAliasValues(sourceTitle, fallbackName, normalizedTitle, rule.canonicalName),
      matchedRule: rule.canonicalName,
      variantTags,
      variantSignature: buildVariantSignature(variantTags),
      variantLabel: buildVariantLabel(variantTags),
      normalizedTitle,
      canonicalKey,
    };
  }

  const fallbackCanonicalName = toDisplayTitle(normalizedTitle || normalizeWhitespace(fallbackName) || sourceTitle);

  return {
    trekName: fallbackCanonicalName,
    trekSlug: slugify(fallbackCanonicalName),
    aliasValues: buildAliasValues(sourceTitle, fallbackName, normalizedTitle, fallbackCanonicalName),
    matchedRule: null,
    variantTags,
    variantSignature: buildVariantSignature(variantTags),
    variantLabel: buildVariantLabel(variantTags),
    normalizedTitle,
    canonicalKey,
  };
}