import { normalizeWhitespace, slugify } from "@/lib/normalization/extractors";

type CanonicalRule = {
  canonicalName: string;
  patterns: RegExp[];
  campingVariantName?: string;
};

type CanonicalTrekIdentity = {
  trekName: string;
  trekSlug: string;
  aliasValues: string[];
  matchedRule: string | null;
};

const canonicalRules: CanonicalRule[] = [
  {
    canonicalName: "Harihar Fort",
    patterns: [/\bharihar\b/i],
    campingVariantName: "Harihar Fort Camping",
  },
  {
    canonicalName: "Harishchandragad",
    patterns: [/\bharishchandragad\b/i, /\bharishchandra\s*gad\b/i],
    campingVariantName: "Harishchandragad Camping",
  },
  {
    canonicalName: "Kalsubai",
    patterns: [/\bkalsubai\b/i],
    campingVariantName: "Kalsubai Camping",
  },
  {
    canonicalName: "Rajmachi Fort",
    patterns: [/\brajmachi\b/i, /\brajamchi\b/i, /\brajamachi\b/i],
    campingVariantName: "Rajmachi Fort Camping",
  },
  {
    canonicalName: "Sandhan Valley",
    patterns: [/\bsandhan\s+valley\b/i],
    campingVariantName: "Sandhan Valley Camping",
  },
  {
    canonicalName: "Secret Waterfall",
    patterns: [/\bsecret\s+waterfall\b/i],
  },
  {
    canonicalName: "Ratangad",
    patterns: [/\bratangad\b/i],
  },
  {
    canonicalName: "Sondai Fort",
    patterns: [/\bsondai\s+fort\b/i],
  },
  {
    canonicalName: "Alang Madan Kulang",
    patterns: [
      /\balang\b.*\bmadan\b.*\bkulang\b/i,
      /\bamk\b/i,
    ],
  },
  {
    canonicalName: "Bhairavgad Climbing & Rappelling",
    patterns: [/\bbhairavgad\b/i],
  },
  {
    canonicalName: "Hadsar Fort Trekking & Khunti Climbing",
    patterns: [/\bhadsar\b.*\bkhunti\b/i, /\bhadsar\s+fort\b/i],
  },
  {
    canonicalName: "Jivdhan-Vanarlingi Valley Crossing & Rappelling",
    patterns: [/\bjivdhan\b.*\bvanarlingi\b/i, /\bjivdhan\b.*\bvalley\s+crossing\b/i],
  },
  {
    canonicalName: "Shitkada Waterfall Rappelling",
    patterns: [/\bshitkada\b/i],
  },
  {
    canonicalName: "Vasota Jungle",
    patterns: [/\bvasota\b/i],
    campingVariantName: "Vasota Jungle Camping",
  },
  {
    canonicalName: "Pawna Lake Camping",
    patterns: [/\bpawna\s+lake\s+camping\b/i],
  },
  {
    canonicalName: "Bhandardara Lake Camping",
    patterns: [/\bbhandardara\s+lake\s+camping\b/i],
  },
  {
    canonicalName: "Beach Camping Alibaug",
    patterns: [/\bbeach\s+camping\s+alibaug\b/i],
  },
  {
    canonicalName: "Igatpuri Glamping & Watersports",
    patterns: [/\bigatpuri\b.*\bglamping\b/i],
  },
  {
    canonicalName: "Mumbai Midnight Cycling",
    patterns: [/\bmidnight\s+cycling\b/i],
  },
];

function toDisplayTitle(value: string) {
  return value
    .split(/\s+/)
    .map((token) => {
      if (!token) {
        return token;
      }

      if (/^[A-Z0-9&()/-]+$/.test(token)) {
        return token;
      }

      return token[0].toUpperCase() + token.slice(1).toLowerCase();
    })
    .join(" ");
}

function normalizeAlias(value: string | null | undefined) {
  return normalizeWhitespace(value)
    .replace(/[|]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildAliasValues(...values: Array<string | null | undefined>) {
  return [...new Set(values.map(normalizeAlias).filter(Boolean))];
}

function extractBaseSegment(value: string) {
  return normalizeWhitespace(value).split("|")[0] ?? normalizeWhitespace(value);
}

function stripGenericNoise(value: string) {
  return normalizeWhitespace(value)
    .replace(/₹\s*[\d,]+/g, " ")
    .replace(/\b(?:rs\.?|inr)\s*[\d,]+\b/gi, " ")
    .replace(/\b20\d{2}\b/g, " ")
    .replace(/\bfrom\s+(?:mumbai|pune)\b/gi, " ")
    .replace(/\b(?:mumbai|pune|lonavala)\b/gi, " ")
    .replace(/\b(?:cloud\s+formation|sunrise|fireflies|premium|monsoon|weekend|night|departure|departures|batch|batches)\b/gi, " ")
    .replace(/\bwith\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[|]+/g, " ")
    .replace(/^[,&\-\s]+|[,&\-\s]+$/g, " ")
    .trim();
}

function supportsCampingVariant(rule: CanonicalRule, rawTitle: string) {
  if (!rule.campingVariantName) {
    return false;
  }

  return /\b(camp(?:ing)?|glamping|tent|tents|bonfire|stay)\b/i.test(rawTitle);
}

export function getCanonicalTrekIdentity(
  rawTitle: string,
  fallbackName?: string | null,
): CanonicalTrekIdentity {
  const sourceTitle = normalizeWhitespace(rawTitle || fallbackName || "Untitled Trek");
  const baseSegment = extractBaseSegment(sourceTitle);
  const normalizedBase = stripGenericNoise(baseSegment);

  for (const rule of canonicalRules) {
    if (!rule.patterns.some((pattern) => pattern.test(normalizedBase))) {
      continue;
    }

    const trekName = supportsCampingVariant(rule, sourceTitle)
      ? rule.campingVariantName ?? rule.canonicalName
      : rule.canonicalName;

    return {
      trekName,
      trekSlug: slugify(trekName),
      aliasValues: buildAliasValues(sourceTitle, fallbackName, normalizedBase),
      matchedRule: rule.canonicalName,
    };
  }

  const fallbackCanonicalName =
    toDisplayTitle(stripGenericNoise(baseSegment) || normalizeWhitespace(fallbackName) || sourceTitle);

  return {
    trekName: fallbackCanonicalName,
    trekSlug: slugify(fallbackCanonicalName),
    aliasValues: buildAliasValues(sourceTitle, fallbackName, fallbackCanonicalName),
    matchedRule: null,
  };
}