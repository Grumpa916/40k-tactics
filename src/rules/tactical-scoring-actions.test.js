import test from "node:test";
import assert from "node:assert/strict";
import { getTacticalScoringActions } from "./tactical-scoring-actions.js";
import { SCORING_EVIDENCE } from "./scoring-eligibility.js";

function baseState() {
  return {
    units: [
      { id: "close", ownerId: "p1", status: "active", position: { x: 12, y: 12 } },
      { id: "near", ownerId: "p1", status: "active", position: { x: 21, y: 12 } },
      { id: "mid", ownerId: "p1", status: "active", position: { x: 33, y: 12 } },
      { id: "dead", ownerId: "p1", status: "destroyed", position: { x: 12, y: 12 } }
    ],
    objectives: [{ id: "obj-2", position: { x: 12, y: 12 } }]
  };
}

function advisories(eligible = false) {
  return {
    timing: "command-phase",
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
    }],
    available: eligible ? [{
      definitionId: "score-obj-2",
      timing: "command-phase",
      eligible: true,
      conditions: [{
        evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
        eligible: true,
        objectiveId: "obj-2",
        playerId: "p1",
        expected: "controlled",
        actual: "controlled"
      }]
    }] : [],
    evaluations: []
  };
}

test("provides approximate unit candidates for an unsatisfied objective action", () => {
  const result = getTacticalScoringActions(baseState(), {
    playerId: "p1",
    scoringAdvisories: advisories()
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].actions[0].type, "secure-objective");
  assert.deepEqual(
    result[0].actions[0].candidates.map((candidate) => candidate.unitId),
    ["close", "near", "mid"]
  );
  assert.equal(result[0].actions[0].candidates[0].confidence, "high");
  assert.equal(result[0].actions[0].candidates[1].confidence, "moderate");
  assert.equal(result[0].actions[0].candidates[2].confidence, "low");
});

test("does not select destroyed units or claim exact legality", () => {
  const result = getTacticalScoringActions(baseState(), {
    playerId: "p1",
    scoringAdvisories: advisories()
  });

  const candidates = result[0].actions[0].candidates;
  assert.equal(candidates.some((candidate) => candidate.unitId === "dead"), false);
  assert.equal(candidates[0].canReach, undefined);
  assert.equal(candidates[0].legal, undefined);
});

test("keeps satisfied scoring opportunities out of action contexts", () => {
  const result = getTacticalScoringActions(baseState(), {
    playerId: "p1",
    scoringAdvisories: advisories(true)
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].actions.length, 0);
});
