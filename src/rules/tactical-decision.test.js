import test from "node:test";
import assert from "node:assert/strict";
import {
  rankTacticalRecommendations,
  getTacticalOpportunityValue
} from "./tactical-decision.js";

test("ranks recommendations by priority and confidence without exposing a raw score", () => {
  const result = rankTacticalRecommendations([
    { type: "shooting-target", priority: 2, confidence: "low", unitId: "a", targetUnitId: "x" },
    { type: "fight", priority: 3, confidence: "high", unitId: "b" },
    { type: "scoring", priority: 3, confidence: "moderate", unitId: "c" }
  ]);

  assert.equal(result.length, 3);
  assert.equal(result[0].unitId, "b");
  assert.equal(Object.hasOwn(result[0], "score"), false);
});

test("limits tactical recommendations to the requested number", () => {
  const result = rankTacticalRecommendations([
    { type: "fight", priority: 3, confidence: "high", unitId: "a" },
    { type: "charge", priority: 2, confidence: "moderate", unitId: "b" },
    { type: "objective", priority: 2, confidence: "high", unitId: "c" }
  ], { limit: 2 });

  assert.equal(result.length, 2);
});

test("opportunity value exposes transparent components for engine use", () => {
  const value = getTacticalOpportunityValue({
    type: "fight",
    priority: 3,
    confidence: "high"
  });

  assert.deepEqual(value, {
    priority: 3,
    confidence: "high",
    categoryValue: 4
  });
});
