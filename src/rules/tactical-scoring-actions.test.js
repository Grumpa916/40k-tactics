import test from "node:test";
import assert from "node:assert/strict";
import { getTacticalScoringActions } from "./tactical-scoring-actions.js";
import { SCORING_EVIDENCE } from "./scoring-eligibility.js";

function state() {
  return {
    units: [{ id: "unit-1", ownerId: "p1", status: "active", position: { x: 10, y: 10 } }],
    objectives: [{ id: "obj-2" }]
  };
}

function advisories(eligible = false) {
  return {
    due: [{
      definitionId: "score-obj-2",
      timing: "command-phase",
      due: true,
      opportunity: {
        definitionId: "score-obj-2",
        timing: "command-phase",
        eligible,
        conditions: [{
          evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
          eligible,
          objectiveId: "obj-2",
          playerId: "p1",
          expected: "controlled",
          actual: eligible ? "controlled" : "uncontrolled"
        }]
      }
    }]
  };
}

test("turns an unsatisfied objective-control condition into a tactical action context", () => {
  const result = getTacticalScoringActions(state(), {
    playerId: "p1",
    scoringAdvisories: advisories()
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].available, false);
  assert.equal(result[0].actions.length, 1);
  assert.equal(result[0].actions[0].type, "secure-objective");
  assert.equal(result[0].actions[0].objectiveId, "obj-2");
  assert.deepEqual(result[0].actions[0].candidates, []);
});

test("does not create a tactical action when the scoring condition is already satisfied", () => {
  const result = getTacticalScoringActions(state(), {
    playerId: "p1",
    scoringAdvisories: advisories(true)
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].available, true);
  assert.equal(result[0].actions.length, 0);
});

test("requires a player id and scoring advisories", () => {
  assert.throws(
    () => getTacticalScoringActions(state(), { scoringAdvisories: advisories() }),
    /playerId is required/
  );
  assert.throws(
    () => getTacticalScoringActions(state(), { playerId: "p1" }),
    /Scoring advisories are required/
  );
});
