import { slugify } from "@/lib/normalization/extractors";

export const ALIAS_SIMILARITY_THRESHOLD = 0.8;
export const ALIAS_REVIEW_SIMILARITY_THRESHOLD = 0.7;

const WHOLE_PHRASE_PATTERNS = [
  /\bfort\s+trek\b/g,
  /\btemple\s+trek\b/g,
  /\bpeth\s+fort\b/g,
  /\bone\s+day\b/g,
  /\btrekking\b/g,
  /\btrek\b/g,
  /\bjungle\b/g,
  /\bspecial\b/g,
  /\b20(?:24|25|26)\b/g,
];

const TRAILING_TOKEN_PATTERNS = [
  /\band\b$/,
  /\bto\b$/,
  /\bpeth\b$/,
  /\bfort\b$/,
  /\bdurg\b$/,
];

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeSlug(name: string): string {
  let normalized = name
    .toLowerCase()
    .replace(/\bvia\b[^|,()/-]*$/g, " ")
    .replace(/[&/_,()|]+/g, " ")
    .replace(/[^a-z0-9\s-]+/g, " ");

  for (const pattern of WHOLE_PHRASE_PATTERNS) {
    normalized = normalized.replace(pattern, " ");
  }

  normalized = collapseWhitespace(normalized);

  if (normalized.startsWith("to ")) {
    normalized = normalized.slice(3);
  }

  let changed = true;

  while (changed) {
    changed = false;

    for (const pattern of TRAILING_TOKEN_PATTERNS) {
      const nextValue = collapseWhitespace(normalized.replace(pattern, " "));

      if (nextValue !== normalized) {
        normalized = nextValue;
        changed = true;
      }
    }
  }

  const candidate = slugify(normalized);
  return candidate || slugify(name);
}

export function slugSimilarity(a: string, b: string): number {
  const left = normalizeSlug(a);
  const right = normalizeSlug(b);

  if (left === right) {
    return 1;
  }

  if (!left || !right) {
    return 0;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const current = previous[rightIndex];
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      previous[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + 1,
        diagonal + substitutionCost,
      );

      diagonal = current;
    }
  }

  const distance = previous[right.length];
  const longestLength = Math.max(left.length, right.length);

  return longestLength === 0 ? 1 : 1 - distance / longestLength;
}