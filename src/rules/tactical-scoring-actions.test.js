import test from "node:test";
import assert from "node:assert/strict";
import { getTacticalScoringActions } from "./tactical-scoring-actions.js";
import { SCORING_EVIDENCE } from "./scoring-eligibility.js";
import { createGameState } from "../engine/game-state.js";
import { startBattle, startFirstTurn, recordObjectiveControl } from "../engine/state-transitions.js";
import { PLAYER_ROLES } from "../state/player.js";
import { getScoringOpportunityAdvisories } from "./tactical-scoring-opportunities.js";
import { SCORING_TIMINGS, createMissionDefinition } from "./mission-definition.js";

function player(id, role) {
  return { id, name: id, role };
}

function baseState() {
  let state = createGameState({
    players: [player("p1", PLAYER_ROLES.PLAYER_ONE), player("p2", PLAYER_ROLES.PLAYER_TWO)],
    objectives: [{ id: "obj-2", position: { x: 12, y: 12 } }],
    units: [
      { id: "close", ownerId: "p1", status: "active", position: { x: 12, y: 12 } },
      { id: "near", ownerId: "p1", status: "active", position: { x: 21, y: 12 } },
      { id: "mid", ownerId: "p1", status: "active", position: { x: 33, y: 12 } },
      { id: "dead", ownerId: "p1", status: "destroyed", position: { x: 12, y: 12 } }
    ]
  });
  state = startBattle(state, { battleId: "battle-1" });
  return startFirstTurn(state, { activePlayerId: "p1" });
}

function definition() {
  return createMissionDefinition({
    id: "score-obj-2",
    name: "Score Objective 2",
    timing: SCORING_TIMINGS.COMMAND_PHASE,
    conditions: [{
      evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
      args: { objectiveId: "obj-2", playerId: "p1", expected: "controlled" }
    }]
  });
}

test("provides approximate unit candidates for an unsatisfied objective action", () => {
  const state = baseState();
  const scoringAdvisories = getScoringOpportunityAdvisories(state, {
    definitions: [definition()],
    timing: SCORING_TIMINGS.COMMAND_PHASE
  });

  const result = getTacticalScoringActions(state, {
    playerId: "p1",
    scoringAdvisories
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
  const state = baseState();
  const scoringAdvisories = getScoringOpportunityAdvisories(state, {
    definitions: [definition()],
    timing: SCORING_TIMINGS.COMMAND_PHASE
  });

  const result = getTacticalScoringActions(state, {
    playerId: "p1",
    scoringAdvisories
  });

  const candidates = result[0].actions[0].candidates;
  assert.equal(candidates.some((candidate) => candidate.unitId === "dead"), false);
  assert.equal(candidates[0].canReach, undefined);
  assert.equal(candidates[0].legal, undefined);
});

test("keeps satisfied scoring opportunities out of action contexts", () => {
  let state = baseState();
  state = recordObjectiveControl(state, { objectiveId: "obj-2", controllerId: "p1" });

  const scoringAdvisories = getScoringOpportunityAdvisories(state, {
    definitions: [definition()],
    timing: SCORING_TIMINGS.COMMAND_PHASE
  });

  const result = getTacticalScoringActions(state, {
    playerId: "p1",
    scoringAdvisories
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].actions.length, 0);
});
