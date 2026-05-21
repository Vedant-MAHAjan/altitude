import assert from "node:assert/strict";
import test from "node:test";

import { buildLayeredPipeline } from "./layered-pipeline";

test("layered pipeline derives concrete meal and stay summaries", () => {
  const pipeline = buildLayeredPipeline({
    title: "Rajmachi Fort Trek",
    sourceUrl: "https://example.com/rajmachi",
    transportText: "Travel by AC bus from Pune",
    inclusionsText: "AC bus travel\nBreakfast\nLunch\nTent stay",
    exclusionsText: "Dinner during travel",
    rawSnapshot: {
      sections: {
        inclusionText: "AC bus travel\nBreakfast\nLunch\nTent stay",
        exclusionText: "Dinner during travel",
        stayText: "Tent stay",
        modeOfTransportText: "AC bus travel",
      },
    },
  });

  assert.equal(pipeline.derived.transportType, "BUS");
  assert.equal(pipeline.derived.transportSummary, "AC bus");
  assert.equal(pipeline.derived.mealPlan, "INCLUDED");
  assert.equal(pipeline.derived.mealsSummary, "Breakfast, Lunch");
  assert.equal(pipeline.derived.stayIncluded, true);
  assert.equal(pipeline.derived.staySummary, "Tent stay");
  assert.deepEqual(pipeline.derived.inclusionHighlights, ["Breakfast, Lunch", "Tent stay"]);
  assert.deepEqual(pipeline.validationIssues, []);
});

test("layered pipeline flags unresolved stay signals", () => {
  const pipeline = buildLayeredPipeline({
    title: "Generic Stay Example",
    sourceUrl: "https://example.com/stay-gap",
    rawSnapshot: {
      sections: {
        stayText: "Stay in rooms near base village",
        inclusionText: "Stay in rooms near base village",
      },
    },
  });

  assert.equal(pipeline.derived.stayIncluded, false);
  assert.ok(
    pipeline.validationIssues.some((issue) => issue.code === "stay-signal-unresolved"),
  );
});