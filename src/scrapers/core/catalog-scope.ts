import { normalizeWhitespace } from "../../lib/normalization/extractors";
import { getCanonicalTrekIdentity } from "../../lib/normalization/trek-identity";
import type { RawScrapedPackage } from "../types";

type CatalogScopeCandidate = Pick<
  RawScrapedPackage,
  "title" | "sourceUrl" | "locationText" | "pageText"
>;

type MaharashtraCatalogOptions = {
  requireAdventureSignal?: boolean;
};

export type CatalogScopeVerdict = {
  include: boolean;
  reason: string;
};

const adventureSignalPattern =
  /\b(trek|trekking|fort|camp(?:ing)?|glamping|climbing|rappelling|waterfall|cycling|valley|peak|summit|jungle|trail|lake|watersports?)\b/i;

const maharashtraSignalPatterns = [
  /\bmaharashtra\b/i,
  /\bmumbai\b/i,
  /\bpune\b/i,
  /\bnashik\b/i,
  /\bkasara\b/i,
  /\btrimbak\b/i,
  /\blonavala\b/i,
  /\bkarjat\b/i,
  /\bigatpuri\b/i,
  /\bbhandardara\b/i,
  /\bpawna\b/i,
  /\balibaug\b/i,
  /\brevdanda\b/i,
  /\bkolad\b/i,
  /\bkonkan\b/i,
  /\bsatara\b/i,
  /\bharihar\b/i,
  /\bharishchandragad\b/i,
  /\bkalsubai\b/i,
  /\brajmach[ia]\b/i,
  /\bsandhan\b/i,
  /\bratangad\b/i,
  /\bsondai\b/i,
  /\balang\b/i,
  /\bmadan\b/i,
  /\bkulang\b/i,
  /\bbhairavgad\b/i,
  /\bhadsar\b/i,
  /\bjivdhan\b/i,
  /\bshitkada\b/i,
  /\bvasota\b/i,
  /\bsahyadri\b/i,
];

const outOfStateSignalPatterns = [
  /\bchopta\b/i,
  /\bchandrashila\b/i,
  /\brishikesh\b/i,
  /\bdehradun\b/i,
  /\buttarakhand\b/i,
  /\bkedarnath\b/i,
  /\bbadrinath\b/i,
  /\bhimachal\b/i,
  /\bmanali\b/i,
  /\bkasol\b/i,
  /\btriund\b/i,
  /\bspiti\b/i,
  /\bmeghalaya\b/i,
  /\bthailand\b/i,
  /\buttar\s+pradesh\b/i,
  /\bgoa\b/i,
  /\bladakh\b/i,
  /\bkashmir\b/i,
  /\bsikkim\b/i,
  /\bdarjeeling\b/i,
];

function buildScopeText(candidate: CatalogScopeCandidate) {
  return normalizeWhitespace(
    [candidate.title, candidate.locationText, candidate.sourceUrl, candidate.pageText]
      .filter(Boolean)
      .join(" | "),
  );
}

export function getMaharashtraCatalogVerdict(
  candidate: CatalogScopeCandidate,
  options: MaharashtraCatalogOptions = {},
): CatalogScopeVerdict {
  const scopeText = buildScopeText(candidate);

  if (!scopeText) {
    return {
      include: false,
      reason: "empty-package-text",
    };
  }

  const canonicalIdentity = getCanonicalTrekIdentity(candidate.title, candidate.locationText);

  if (canonicalIdentity.matchedRule) {
    return {
      include: true,
      reason: "canonical-maharashtra-activity",
    };
  }

  if (outOfStateSignalPatterns.some((pattern) => pattern.test(scopeText))) {
    return {
      include: false,
      reason: "explicit-out-of-state-signal",
    };
  }

  const hasAdventureSignal = adventureSignalPattern.test(scopeText);

  if (options.requireAdventureSignal !== false && !hasAdventureSignal) {
    return {
      include: false,
      reason: "missing-adventure-signal",
    };
  }

  if (maharashtraSignalPatterns.some((pattern) => pattern.test(scopeText))) {
    return {
      include: true,
      reason: "maharashtra-signal",
    };
  }

  return {
    include: false,
    reason: "missing-maharashtra-signal",
  };
}