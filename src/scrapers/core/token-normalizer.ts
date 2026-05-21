import {
  mealTokenDefinitions,
  stayTokenDefinitions,
  transportTokenDefinitions,
} from "./normalization-dictionaries";
import type {
  NormalizedToken,
  RawSectionKey,
  RawSectionMap,
  TokenSignal,
} from "./pipeline-types";

const transportSections: RawSectionKey[] = [
  "transport",
  "pickup",
  "departure",
  "inclusions",
  "itinerary",
  "otherInformation",
  "quickInformation",
];

const mealSections: RawSectionKey[] = [
  "meals",
  "inclusions",
  "exclusions",
  "itinerary",
  "highlights",
  "otherInformation",
  "quickInformation",
];

const staySections: RawSectionKey[] = [
  "stay",
  "inclusions",
  "exclusions",
  "itinerary",
  "highlights",
  "otherInformation",
  "quickInformation",
  "basicInfo",
];

function splitLines(value: string | null) {
  return (value ?? "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

function inferSignal(sectionKey: RawSectionKey, line: string): TokenSignal {
  const normalized = line.toLowerCase();

  if (
    sectionKey === "exclusions" ||
    /\b(not included|excluded|at own cost|own expense|self sponsored|extra)\b/.test(normalized)
  ) {
    return "EXCLUDED";
  }

  if (
    sectionKey === "inclusions" ||
    sectionKey === "transport" ||
    sectionKey === "meals" ||
    sectionKey === "stay" ||
    /\b(included|complimentary|provided)\b/.test(normalized)
  ) {
    return "INCLUDED";
  }

  return "MENTIONED";
}

export function normalizeSectionTokens(sections: RawSectionMap): NormalizedToken[] {
  const tokenMap = new Map<string, NormalizedToken>();

  for (const definition of transportTokenDefinitions) {
    for (const sourceSection of transportSections) {
      for (const line of splitLines(sections[sourceSection])) {
        if (!definition.patterns.some((pattern) => pattern.test(line))) {
          continue;
        }

        if (definition.code === "BUS" && /\bac\b/i.test(line)) {
          continue;
        }

        const signal = inferSignal(sourceSection, line);
        const key = `${definition.code}:${signal}`;

        if (!tokenMap.has(key)) {
          tokenMap.set(key, {
            code: definition.code,
            label: definition.label,
            category: definition.category,
            sourceSection,
            signal,
            matchedText: line,
          });
        }
      }
    }
  }

  for (const definition of mealTokenDefinitions) {
    for (const sourceSection of mealSections) {
      for (const line of splitLines(sections[sourceSection])) {
        if (!definition.patterns.some((pattern) => pattern.test(line))) {
          continue;
        }

        const signal = inferSignal(sourceSection, line);
        const key = `${definition.code}:${signal}`;

        if (!tokenMap.has(key)) {
          tokenMap.set(key, {
            code: definition.code,
            label: definition.label,
            category: definition.category,
            sourceSection,
            signal,
            matchedText: line,
          });
        }
      }
    }
  }

  for (const definition of stayTokenDefinitions) {
    for (const sourceSection of staySections) {
      for (const line of splitLines(sections[sourceSection])) {
        if (!definition.patterns.some((pattern) => pattern.test(line))) {
          continue;
        }

        const signal = inferSignal(sourceSection, line);
        const key = `${definition.code}:${signal}`;

        if (!tokenMap.has(key)) {
          tokenMap.set(key, {
            code: definition.code,
            label: definition.label,
            category: definition.category,
            sourceSection,
            signal,
            matchedText: line,
          });
        }
      }
    }
  }

  return [...tokenMap.values()];
}