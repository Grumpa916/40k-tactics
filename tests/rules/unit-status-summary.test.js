import test from "node:test";
import assert from "node:assert/strict";
import { getBattleShockEligibility, getUnitStrengthAssessment, renderEventLogPanel, renderUnitStatusPanel, summarizeGameEvent } from "../../src/rules/unit-status-summary.js";

test("strength assessment distinguishes at-half strength from unknown strength", () => {
  assert.equal(getUnitStrengthAssessment({ startingStrength: 10, currentStrength: 5 }).belowHalfStrength, true);
  assert.equal(getUnitStrengthAssessment({ startingStrength: 10, currentStrength: 6 }).belowHalfStrength, false);
  assert.equal(getUnitStrengthAssessment({ metadata: { modelCount: 10 } }).known, false);
});

test("single-model units can use current wounds when starting wounds are known", () => {
  const assessment = getUnitStrengthAssessment({
    metadata: { modelCount: 1 },
    wounds: 4,
    startingWounds: 8
  });
  assert.equal(assessment.known, true);
  assert.equal(assessment.belowHalfStrength, true);
  assert.equal(assessment.source, "single-model-wounds");
});

test("Battle-shock eligibility includes already shocked units and below-half-strength units", () => {
  assert.equal(getBattleShockEligibility({
    status: "deployed", battleShocked: true
  }).requiresTest, true);
  assert.equal(getBattleShockEligibility({
    status: "deployed", startingStrength: 5, currentStrength: 3
  }).requiresTest, false);
  assert.equal(getBattleShockEligibility({
    status: "deployed", startingStrength: 5, currentStrength: 2
  }).requiresTest, true);
  assert.equal(getBattleShockEligibility({ status: "reserves" }).requiresTest, false);
});

test("Unit Status labels unknown strength without inventing a Battle-shock result", () => {
  const html = renderUnitStatusPanel({
    units: [{ id: "u1", ownerId: "p1", name: "Warriors", status: "deployed", metadata: { modelCount: 5 } }],
    players: [{ id: "p1", name: "You" }]
  });
  assert.match(html, /Unit Status/);
  assert.match(html, /Strength untracked/);
  assert.doesNotMatch(html, /Battle-shocked<\/span>/);
});

test("Event Log summarizes combat and Battle-shock events with unit names", () => {
  const state = {
    units: [
      { id: "a", name: "Attacker", ownerId: "p1", status: "deployed" },
      { id: "t", name: "Target", ownerId: "p2", status: "deployed" }
    ],
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    history: [
      { type: "combat.attack_resolved", payload: { attackerId: "a", targetId: "t", weaponId: "Rifle", actualDamage: 3, round: 1, turn: 2 } },
      { type: "battle_shock.test_recorded", payload: { unitId: "t", result: "failed", battleShockedAfter: true, round: 1, turn: 2 } }
    ]
  };
  const combat = summarizeGameEvent(state.history[0], state);
  assert.equal(combat.title, "Attack resolved");
  assert.match(combat.detail, /Attacker → Target/);
  assert.match(combat.detail, /3 actual damage/);
  const html = renderEventLogPanel(state);
  assert.match(html, /Battle-shock test/);
  assert.match(html, /failed/i);
  assert.match(html, /2 events/);
});
