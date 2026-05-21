import {
  inferInclusionStatus,
  inferMealPlan,
  inferTransportType,
} from "../../lib/normalization/extractors";
import type { TransportType } from "../../lib/types";
import { tokenSummaryLabels } from "./normalization-dictionaries";
import type {
  DerivedPackageFields,
  MealToken,
  NormalizedToken,
  RawSectionMap,
  StayToken,
  TransportToken,
} from "./pipeline-types";

function uniqueCodes<T extends string>(values: T[]) {
  return [...new Set(values)];
}

function summarizeCodes<T extends string>(codes: T[]) {
  const labels = uniqueCodes(codes).map(
    (code) => tokenSummaryLabels[code as keyof typeof tokenSummaryLabels],
  );
  return labels.length > 0 ? labels.join(", ") : null;
}

function getCodesByCategory<TCode extends string>(
  tokens: NormalizedToken[],
  category: NormalizedToken["category"],
  excluded: boolean,
) {
  return uniqueCodes(
    tokens
      .filter((token) => token.category === category)
      .filter((token) => (excluded ? token.signal === "EXCLUDED" : token.signal !== "EXCLUDED"))
      .map((token) => token.code as TCode),
  );
}

function deriveTransportType(
  transportCodes: TransportToken[],
  fallbackTransportType: TransportType,
) {
  const hasRoadTransport = transportCodes.some((code) =>
    ["AC_BUS", "BUS", "TEMPO_TRAVELLER", "JEEP"].includes(code),
  );
  const hasTrain = transportCodes.includes("TRAIN");
  const hasSelfDrive = transportCodes.includes("SELF_DRIVE");
  const hasOwnTransport = transportCodes.includes("OWN_TRANSPORT");
  const hasLocalTransfer = transportCodes.includes("LOCAL_TRANSFER");

  if (hasTrain) {
    return "TRAIN";
  }

  if (hasRoadTransport && (hasSelfDrive || hasOwnTransport)) {
    return "MIXED";
  }

  if (hasRoadTransport) {
    return "BUS";
  }

  if (hasSelfDrive) {
    return "SELF_DRIVE";
  }

  if (hasOwnTransport) {
    return "OWN_TRANSPORT";
  }

  if (hasLocalTransfer) {
    return "LOCAL_TRANSFER";
  }

  return fallbackTransportType;
}

export function derivePackageFields(
  sections: RawSectionMap,
  tokens: NormalizedToken[],
): DerivedPackageFields {
  const transportText = [sections.transport, sections.pickup, sections.departure]
    .filter(Boolean)
    .join("\n");
  const mealText = [sections.meals, sections.inclusions, sections.exclusions]
    .filter(Boolean)
    .join("\n");
  const forestFeeText = [sections.forestFee, sections.inclusions, sections.exclusions]
    .filter(Boolean)
    .join("\n");

  const transportTokens = getCodesByCategory<TransportToken>(tokens, "TRANSPORT", false);
  const allIncludedMealTokens = getCodesByCategory<MealToken>(tokens, "MEAL", false);
  const explicitMealTokens = uniqueCodes(
    tokens
      .filter((token) => token.category === "MEAL")
      .filter((token) => token.signal !== "EXCLUDED")
      .filter((token) =>
        ["inclusions", "meals", "highlights"].includes(token.sourceSection),
      )
      .map((token) => token.code as MealToken),
  );
  const includedMealTokens =
    explicitMealTokens.length > 0 ? explicitMealTokens : allIncludedMealTokens;
  const excludedMealTokens = getCodesByCategory<MealToken>(tokens, "MEAL", true);
  const includedStayTokens = getCodesByCategory<StayToken>(tokens, "STAY", false);
  const excludedStayTokens = getCodesByCategory<StayToken>(tokens, "STAY", true);
  const fallbackMealPlan = inferMealPlan(mealText);
  const transportType = deriveTransportType(
    transportTokens,
    inferTransportType(transportText),
  );

  let mealPlan = fallbackMealPlan;

  if (includedMealTokens.length > 0 && excludedMealTokens.length === 0) {
    mealPlan = "INCLUDED";
  } else if (includedMealTokens.length > 0 && excludedMealTokens.length > 0) {
    mealPlan = fallbackMealPlan === "INCLUDED" ? "INCLUDED" : "PARTIAL";
  } else if (includedMealTokens.length === 0 && excludedMealTokens.length > 0) {
    mealPlan = "NOT_INCLUDED";
  }

  const mealsAvailable =
    includedMealTokens.length > 0 || mealPlan === "INCLUDED" || mealPlan === "PARTIAL";
  const mealsSummary =
    summarizeCodes(includedMealTokens) ??
    (mealPlan === "INCLUDED"
      ? "Meals included"
      : mealPlan === "PARTIAL"
        ? "Some meals included"
        : null);
  const stayIncluded = includedStayTokens.length > 0;
  const staySummary =
    summarizeCodes(includedStayTokens) ?? (stayIncluded ? "Stay included" : null);
  const forestFeeStatus = inferInclusionStatus(forestFeeText);
  const inclusionHighlights = [mealsSummary, staySummary].filter(
    (value): value is string => Boolean(value),
  );
  const exclusionHighlights = [
    excludedMealTokens.length > 0
      ? `${summarizeCodes(excludedMealTokens) ?? "Meals"} excluded`
      : null,
    excludedStayTokens.length > 0
      ? `${summarizeCodes(excludedStayTokens) ?? "Stay"} excluded`
      : null,
  ].filter((value): value is string => Boolean(value));

  return {
    transportType,
    transportSummary: summarizeCodes(transportTokens),
    transportTokens,
    mealPlan,
    mealsAvailable,
    mealsSummary,
    mealTokens: includedMealTokens,
    stayIncluded,
    staySummary,
    stayTokens: includedStayTokens,
    forestFeeStatus,
    inclusionHighlights,
    exclusionHighlights,
  };
}