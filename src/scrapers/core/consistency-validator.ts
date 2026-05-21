import type {
  DerivedPackageFields,
  RawSectionMap,
  ValidationIssue,
} from "./pipeline-types";

function hasPattern(value: string | null, pattern: RegExp) {
  return pattern.test(value ?? "");
}

export function validateLayeredConsistency(
  sections: RawSectionMap,
  derived: DerivedPackageFields,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const transportSignals = [sections.transport, sections.pickup, sections.departure]
    .filter(Boolean)
    .join("\n");
  const mealSignals = [sections.meals, sections.inclusions, sections.exclusions]
    .filter(Boolean)
    .join("\n");
  const staySignals = [sections.stay, sections.inclusions, sections.itinerary, sections.highlights]
    .filter(Boolean)
    .join("\n");

  if (
    hasPattern(transportSignals, /\b(train|kasara|railway station|local train)\b/i) &&
    derived.transportType !== "TRAIN"
  ) {
    issues.push({
      code: "transport-train-signal-mismatch",
      severity: "error",
      message: "Raw transport text signals train-led travel but the derived transport type is not TRAIN.",
      sourceSections: ["transport", "pickup", "departure"],
    });
  }

  if (
    hasPattern(transportSignals, /\b(bus|coach|jeep|traveller|transport)\b/i) &&
    derived.transportTokens.length === 0
  ) {
    issues.push({
      code: "transport-signal-unresolved",
      severity: "warning",
      message: "Raw transport text mentions transport arrangements but no normalized transport tokens were derived.",
      sourceSections: ["transport", "pickup", "departure"],
    });
  }

  if (
    hasPattern(mealSignals, /\b(breakfast|lunch|dinner|meal|tea|snack)\b/i) &&
    !derived.mealsAvailable &&
    derived.mealPlan === "UNKNOWN"
  ) {
    issues.push({
      code: "meal-signal-unresolved",
      severity: "warning",
      message: "Raw meal text mentions meals but the derived meal fields stayed UNKNOWN.",
      sourceSections: ["meals", "inclusions", "exclusions"],
    });
  }

  if (
    hasPattern(staySignals, /\b(tent|camp|stay|accommodation|hotel|homestay|dormitory|dorm)\b/i) &&
    !derived.stayIncluded
  ) {
    issues.push({
      code: "stay-signal-unresolved",
      severity: "warning",
      message: "Raw stay text mentions accommodation but no stay summary was derived.",
      sourceSections: ["stay", "inclusions", "itinerary", "highlights"],
    });
  }

  if (
    hasPattern(sections.forestFee, /\b(entry|forest|permit|fees?|ticket|charges?)\b/i) &&
    derived.forestFeeStatus === "UNKNOWN"
  ) {
    issues.push({
      code: "forest-fee-unresolved",
      severity: "warning",
      message: "Raw inclusion text mentions entry or forest fees but the derived inclusion status is still UNKNOWN.",
      sourceSections: ["forestFee", "inclusions", "exclusions"],
    });
  }

  return issues;
}