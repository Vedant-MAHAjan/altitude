import { derivePackageFields } from "./derived-fields";
import { buildRawSections } from "./raw-section-extraction";
import { normalizeSectionTokens } from "./token-normalizer";
import { validateLayeredConsistency } from "./consistency-validator";
import type { LayeredPipelineSnapshot } from "./pipeline-types";
import type { RawScrapedPackage } from "../types";

export function buildLayeredPipeline(
  rawPackage: RawScrapedPackage,
): LayeredPipelineSnapshot {
  const sections = buildRawSections(rawPackage);
  const tokens = normalizeSectionTokens(sections);
  const derived = derivePackageFields(sections, tokens);
  const validationIssues = validateLayeredConsistency(sections, derived);

  return {
    sections,
    tokens,
    derived,
    validationIssues,
  };
}