import test from "node:test";
import assert from "node:assert/strict";
import { getBattleShockEligibility, getUnitStrengthAssessment } from "../../src/rules/unit-status-summary.js";

test("strength assessment distinguishes at-half from above-half model count", () => {
  assert.equal(getUnitStrengthAssessment({ startingStrength: 10, currentStrength: 5 }).belowHalfStrength, true);
  assert.equal(getUnitStrengthAssessment({ startingStrength: 10, currentStrength: 6 }).belowHalfStrength, false);
  assert.equal(getUnitStrengthAssessment({ startingStrength: 5, currentStrength: 3 }).belowHalfStrength, false);
  assert.equal(getUnitStrengthAssessment({ startingStrength: 5, currentStrength: 2 }).belowHalfStrength, true);
});

test("single-model strength uses remaining wounds rather than model count", () => {
  const atHalf = getUnitStrengthAssessment({
    metadata: { modelCount: 1 }, wounds: 4, startingWounds: 8
  });
  const aboveHalf = getUnitStrengthAssessment({
    metadata: { modelCount: 1 }, wounds: 5, startingWounds: 8
  });
  const belowHalfOdd = getUnitStrengthAssessment({
    startingStrength: 1, wounds: 3, profile: { characteristics: { wounds: 11 } }
  });
  assert.equal(atHalf.belowHalfStrength, true);
  assert.equal(aboveHalf.belowHalfStrength, false);
  assert.equal(belowHalfOdd.belowHalfStrength, true);
});

test("unknown strength remains unknown when remaining model data is missing", () => {
  const assessment = getUnitStrengthAssessment({ metadata: { modelCount: 10 } });
  assert.equal(assessment.known, false);
  assert.equal(assessment.belowHalfStrength, null);
});

test("Battle-shock eligibility includes already shocked units and at-half-strength units", () => {
  assert.equal(getBattleShockEligibility({
    status: "deployed", battleShocked: true
  }).requiresTest, true);
  assert.equal(getBattleShockEligibility({
    status: "deployed", startingStrength: 10, currentStrength: 5
  }).requiresTest, true);
  assert.equal(getBattleShockEligibility({
    status: "deployed", startingStrength: 5, currentStrength: 3
  }).requiresTest, false);
  assert.equal(getBattleShockEligibility({ status: "reserves" }).requiresTest, false);
  assert.equal(getBattleShockEligibility({ status: "reserves", battleShocked: true }).requiresTest, true);
  assert.equal(getBattleShockEligibility({ status: "destroyed", battleShocked: true }).requiresTest, false);
});

test("eligible status exposes unknown strength as review required", () => {
  const eligibility = getBattleShockEligibility({
    id: "u1", status: "deployed", metadata: { modelCount: 5 }
  });
  assert.equal(eligibility.requiresTest, null);
  assert.equal(eligibility.status, "strength-review-required");
});
