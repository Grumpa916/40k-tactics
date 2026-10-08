import test from "node:test";
import assert from "node:assert/strict";
import { SCORING_ACTION_TYPES, getScoringActionContext, getScoringActionContexts } from "./scoring-action-context.js";
import { SCORING_EVIDENCE } from "./scoring-eligibility.js";

function opportunity(actual, eligible = false) {
  return {
    definitionId: "primary-objective",
    timing: "command-phase",
    eligible,
    conditions: [{
      evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
      eligible,
      objectiveId: "obj-2",
      playerId: "p1",
      expected: "controlled",
      actual
    }]
  };
}

test("translates an uncontrolled objective into a secure-objective action context", () => {
  const result = getScoringActionContext(opportunity("uncontrolled"));
  assert.equal(result.available, false);
  assert.equal(result.actions.length, 1);
  assert.equal(result.actions[0].type, SCORING_ACTION_TYPES.SECURE_OBJECTIVE);
  assert.equal(result.actions[0].objectiveId, "obj-2");
  assert.equal(result.actions[0].status, "not-satisfied");
});

test("translates an enemy-controlled objective into a contest-objective action context", () => {
  const result = getScoringActionContext(opportunity("enemy-controlled"));
  assert.equal(result.actions[0].type, SCORING_ACTION_TYPES.CONTEST_OBJECTIVE);
  assert.equal(result.actions[0].objectiveId, "obj-2");
});

test("translates a contested objective into a break-contest action context", () => {
  const result = getScoringActionContext(opportunity("contested"));
  assert.equal(result.actions[0].type, SCORING_ACTION_TYPES.BREAK_CONTEST);
});

test("does not invent an action when the objective condition is already satisfied", () => {
  const result = getScoringActionContext(opportunity("controlled", true));
  assert.equal(result.available, true);
  assert.equal(result.actions.length, 0);
});

test("does not infer map legality or select a unit", () => {
  const result = getScoringActionContext(opportunity("enemy-controlled"));
  assert.equal(result.actions[0].unitId, undefined);
  assert.equal(result.actions[0].distance, undefined);
  assert.equal(result.actions[0].canReach, undefined);
});

test("converts available scoring opportunities without duplicating mission logic", () => {
  const result = getScoringActionContexts({ available: [opportunity("uncontrolled")] });
  assert.equal(result.length, 1);
  assert.equal(result[0].actions[0].type, SCORING_ACTION_TYPES.SECURE_OBJECTIVE);
});
