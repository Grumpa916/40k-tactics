import test from "node:test";
import assert from "node:assert/strict";
import { evaluateFightOpportunity } from "./tactical-fight-opportunity.js";

test("identifies high retaliation risk when expected counter-damage is large", () => {
  const result = evaluateFightOpportunity({
    expectedDamage: 6,
    retaliationExpectedDamage: 5,
    remainingWounds: 5,
    maxWounds: 10,
    targetWounds: 8,
    retaliationConfidence: "moderate"
  });

  assert.equal(result.targetImpact, 0.75);
  assert.equal(result.retaliationRisk, 1);
  assert.equal(result.preservationRisk, 0.5);
  assert.equal(result.netCombatValue, 1);
  assert.equal(result.risk, "high");
  assert.equal(result.confidence, "moderate");
});

test("recognizes a lower-damage option can have lower retaliation risk", () => {
  const result = evaluateFightOpportunity({
    expectedDamage: 4,
    retaliationExpectedDamage: 1,
    remainingWounds: 6,
    targetWounds: 10,
    retaliationConfidence: "high"
  });

  assert.equal(result.netCombatValue, 3);
  assert.equal(result.retaliationRisk, 1 / 6);
  assert.equal(result.risk, "low");
  assert.equal(result.confidence, "high");
});

test("does not invent retaliation when no retaliation input is available", () => {
  const result = evaluateFightOpportunity({
    expectedDamage: 5,
    remainingWounds: 4,
    retaliationConfidence: "low"
  });

  assert.equal(result.retaliationExpectedDamage, 0);
  assert.equal(result.netCombatValue, 5);
  assert.equal(result.confidence, "low");
});
