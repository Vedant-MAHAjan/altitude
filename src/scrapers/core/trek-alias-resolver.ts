import type { PrismaClient } from "@prisma/client";

import { TREK_REGION_MAHARASHTRA } from "../../lib/maharashtra-destinations";
import {
  ALIAS_REVIEW_SIMILARITY_THRESHOLD,
  ALIAS_SIMILARITY_THRESHOLD,
  normalizeSlug,
  slugSimilarity,
} from "../../lib/normalize-slug";

export type TrekAliasCandidate = {
  id: string;
  name: string;
  slug: string;
  region: string;
  normalizedSlug: string;
};

export type TrekAliasCache = {
  candidates: TrekAliasCandidate[];
  candidatesBySlug: Map<string, TrekAliasCandidate>;
  aliasesByNormalizedValue: Map<string, TrekAliasCandidate>;
};

export type TrekAliasResolution = {
  rawName: string;
  normalizedSlug: string;
  canonicalTrek: TrekAliasCandidate | null;
  matchedBy: "alias" | "similarity" | null;
  similarity: number;
  reviewCandidate: TrekAliasCandidate | null;
};

function addCandidate(cache: TrekAliasCache, candidate: TrekAliasCandidate) {
  const existing = cache.candidatesBySlug.get(candidate.slug);

  if (!existing) {
    cache.candidates.push(candidate);
  }

  cache.candidatesBySlug.set(candidate.slug, candidate);
  cache.aliasesByNormalizedValue.set(candidate.normalizedSlug, candidate);
}

export function createEmptyTrekAliasCache(): TrekAliasCache {
  return {
    candidates: [],
    candidatesBySlug: new Map<string, TrekAliasCandidate>(),
    aliasesByNormalizedValue: new Map<string, TrekAliasCandidate>(),
  };
}

export async function loadTrekAliasCache(
  prisma: PrismaClient,
): Promise<TrekAliasCache> {
  const cache = createEmptyTrekAliasCache();
  const treks = await prisma.trek.findMany({
    where: {
      region: TREK_REGION_MAHARASHTRA,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      region: true,
      aliases: {
        select: {
          value: true,
        },
      },
    },
  });

  for (const trek of treks) {
    const candidate: TrekAliasCandidate = {
      id: trek.id,
      name: trek.name,
      slug: trek.slug,
      region: trek.region,
      normalizedSlug: normalizeSlug(trek.name || trek.slug),
    };

    addCandidate(cache, candidate);

    for (const alias of trek.aliases) {
      const normalizedAlias = normalizeSlug(alias.value);

      if (normalizedAlias) {
        cache.aliasesByNormalizedValue.set(normalizedAlias, candidate);
      }
    }
  }

  return cache;
}

export function rememberCanonicalTrek(
  cache: TrekAliasCache,
  trek: { id: string; name: string; slug: string; region: string },
) {
  if (trek.region !== TREK_REGION_MAHARASHTRA) {
    return;
  }

  addCandidate(cache, {
    id: trek.id,
    name: trek.name,
    slug: trek.slug,
    region: trek.region,
    normalizedSlug: normalizeSlug(trek.name || trek.slug),
  });
}

export function rememberTrekAlias(
  cache: TrekAliasCache,
  aliasValue: string,
  trek: TrekAliasCandidate | { id: string; name: string; slug: string; region: string },
) {
  if (trek.region !== TREK_REGION_MAHARASHTRA) {
    return;
  }

  const normalizedAlias = normalizeSlug(aliasValue);

  if (!normalizedAlias) {
    return;
  }

  const candidate = cache.candidatesBySlug.get(trek.slug) ?? {
    id: trek.id,
    name: trek.name,
    slug: trek.slug,
    region: trek.region,
    normalizedSlug: normalizeSlug(trek.name || trek.slug),
  };

  addCandidate(cache, candidate);
  cache.aliasesByNormalizedValue.set(normalizedAlias, candidate);
}

export function resolveCanonicalTrek(
  cache: TrekAliasCache,
  rawName: string,
): TrekAliasResolution {
  const normalizedIncomingSlug = normalizeSlug(rawName);

  if (!normalizedIncomingSlug) {
    return {
      rawName,
      normalizedSlug: normalizedIncomingSlug,
      canonicalTrek: null,
      matchedBy: null,
      similarity: 0,
      reviewCandidate: null,
    };
  }

  const aliasMatch = cache.aliasesByNormalizedValue.get(normalizedIncomingSlug);

  if (aliasMatch) {
    return {
      rawName,
      normalizedSlug: normalizedIncomingSlug,
      canonicalTrek: aliasMatch,
      matchedBy: "alias",
      similarity: slugSimilarity(normalizedIncomingSlug, aliasMatch.normalizedSlug),
      reviewCandidate: null,
    };
  }

  let bestCandidate: TrekAliasCandidate | null = null;
  let bestSimilarity = 0;

  for (const candidate of cache.candidates) {
    const similarity = slugSimilarity(normalizedIncomingSlug, candidate.normalizedSlug);

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestCandidate = candidate;
    }
  }

  if (bestCandidate && bestSimilarity >= ALIAS_SIMILARITY_THRESHOLD) {
    return {
      rawName,
      normalizedSlug: normalizedIncomingSlug,
      canonicalTrek: bestCandidate,
      matchedBy: "similarity",
      similarity: bestSimilarity,
      reviewCandidate: null,
    };
  }

  return {
    rawName,
    normalizedSlug: normalizedIncomingSlug,
    canonicalTrek: null,
    matchedBy: null,
    similarity: bestSimilarity,
    reviewCandidate:
      bestCandidate && bestSimilarity >= ALIAS_REVIEW_SIMILARITY_THRESHOLD
        ? bestCandidate
        : null,
  };
}