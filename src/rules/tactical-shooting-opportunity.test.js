import test from "node:test";
import assert from "node:assert/strict";
import { evaluateShootingOpportunity } from "./tactical-shooting-opportunity.js";

test("derives normalized impact from expected damage without inventing a score", () => {
  const result = evaluateShootingOpportunity({
    expectedDamage: 6,
    targetWounds: 10,
    destructionProbability: 0.55,
    survivalProbability: 0.45,
    impactClassification: "possible-destruction",
    rangeStatus: "within"
  });

  assert.equal(result.targetImpact, 0.6);
  assert.equal(result.normalizedImpact, 0.6);
  assert.equal(result.rangeConfidence, "moderate");
  assert.equal(result.confidence, "moderate");
  assert.match(result.recommendationReason, /Potential destruction/);
});

test("keeps borderline range confidence low", () => {
  const result = evaluateShootingOpportunity({
    expectedDamage: 4,
    targetWounds: 8,
    destructionProbability: 0.2,
    survivalProbability: 0.8,
    impactClassification: "limited-impact",
    rangeStatus: "borderline"
  });

  assert.equal(result.targetImpact, 0.5);
  assert.equal(result.rangeConfidence, "low");
  assert.equal(result.confidence, "low");
  assert.match(result.recommendationReason, /Limited baseline impact/);
});

test("does not turn expected damage into destruction", () => {
  const result = evaluateShootingOpportunity({
    expectedDamage: 7,
    targetWounds: 10,
    destructionProbability: 0.1,
    survivalProbability: 0.9,
    impactClassification: "likely-severe-degradation",
    rangeStatus: "within"
  });

  assert.equal(result.targetImpact, 0.7);
  assert.equal(result.destructionProbability, 0.1);
  assert.equal(result.survivalProbability, 0.9);
  assert.match(result.recommendationReason, /Strong degradation/);
});
