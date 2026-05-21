import {
  inclusionRules,
  knownPickupLocations,
  mealPlanRules,
  transportRules,
} from "@/lib/normalization/catalog";
import type { InclusionStatus, MealPlan, TransportType } from "@/lib/types";

type Rule<T extends string> = {
  value: T;
  patterns: RegExp[];
};

export function normalizeWhitespace(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function matchRule<T extends string>(
  text: string,
  rules: Rule<T>[],
  fallback: T,
) {
  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return rule.value;
    }
  }

  return fallback;
}

export function extractPriceInr(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value);
  const match = normalized.match(/(?:rs\.?|inr|₹)?\s*([\d,]{3,})/i);

  if (!match) {
    return null;
  }

  const parsed = Number(match[1].replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function inferTransportType(value: string | null | undefined): TransportType {
  const normalized = normalizeWhitespace(value);

  if (/\b(train|kasara)\b/i.test(normalized)) {
    return "TRAIN";
  }

  return matchRule(normalized, transportRules, "UNKNOWN");
}

export function inferMealPlan(value: string | null | undefined): MealPlan {
  return matchRule(normalizeWhitespace(value), mealPlanRules, "UNKNOWN");
}

export function inferInclusionStatus(
  value: string | null | undefined,
): InclusionStatus {
  return matchRule(normalizeWhitespace(value), inclusionRules, "UNKNOWN");
}

export function extractPickupLocations(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value).toLowerCase();

  return knownPickupLocations.filter((location) =>
    normalized.includes(location.toLowerCase()),
  );
}

export function slugify(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}