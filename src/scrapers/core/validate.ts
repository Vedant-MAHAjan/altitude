import type { NormalizedScrapedPackage } from "../types";

export type ValidationResult = {
  valid: boolean;
  warnings: string[];
  errors: string[];
};

export function validatePackageForPersistence(
  pkg: NormalizedScrapedPackage,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [...pkg.scrapeWarnings];

  // Hard-fail checks

  if (pkg.priceInr === null || pkg.priceInr === 0 || !Number.isFinite(pkg.priceInr) || pkg.priceInr < 0) {
    errors.push(
      `priceInr must be a positive number, got: ${pkg.priceInr}`,
    );
  }

  if (!pkg.transportType || pkg.transportType === "UNKNOWN") {
    errors.push("transportType must not be null or UNKNOWN");
  }

  if (!pkg.mealPlan || pkg.mealPlan === "UNKNOWN") {
    errors.push("mealPlan must not be null or UNKNOWN");
  }

  // Soft checks (warnings only)

  if (!pkg.pickupLocations || pkg.pickupLocations.length === 0) {
    warnings.push("pickupLocations is empty (some treks may genuinely have no pickup)");
  }

  const nextDeparture = pkg.departureDates.find((d) => d.isoDate);

  if (nextDeparture?.isoDate) {
    const departureDate = new Date(`${nextDeparture.isoDate}T00:00:00.000Z`);

    if (!Number.isNaN(departureDate.getTime()) && departureDate < new Date()) {
      warnings.push(
        `nextDepartureAt is in the past: ${nextDeparture.isoDate}`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
