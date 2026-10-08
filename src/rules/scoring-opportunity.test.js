import test from "node:test";
import assert from "node:assert/strict";
import { createMissionDefinition } from "./mission-definition.js";
import { SCORING_EVIDENCE } from "./scoring-eligibility.js";
import {
  SCORING_OPPORTUNITY_STATES,
  evaluateScoringOpportunity
} from "./scoring-opportunity.js";
import { createGameState } from "../engine/game-state.js";
import { recordObjectiveControl, startBattle, startFirstTurn } from "../engine/state-transitions.js";
import { PLAYER_ROLES } from "../state/player.js";

function createPlayer(id, role) {
  return { id, name: id, role };
}

function baseState() {
  let state = createGameState({
    players: [
      createPlayer("p1", PLAYER_ROLES.PLAYER_ONE),
      createPlayer("p2", PLAYER_ROLES.PLAYER_TWO)
    ],
    objectives: [{ id: "obj-1" }],
    units: [{ id: "u1", ownerId: "p1", status: "active" }]
  });

  state = startBattle(state, { battleId: "battle-1" });
  return startFirstTurn(state, { activePlayerId: "p1" });
}

function definition() {
  return createMissionDefinition({
    id: "hold-center",
    name: "Hold Center",
    conditions: [{
      evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
      args: { objectiveId: "obj-1", playerId: "p1", expected: "controlled" }
    }]
  });
}

test("reports a scoring opportunity when all conditions are satisfied", () => {
  let state = baseState();
  state = recordObjectiveControl(state, {
    objectiveId: "obj-1",
    controllerId: "p1"
  });

  const result = evaluateScoringOpportunity(state, definition());

  assert.equal(result.state, SCORING_OPPORTUNITY_STATES.AVAILABLE);
  assert.equal(result.eligible, true);
  assert.equal(result.definitionId, "hold-center");
  assert.equal(result.conditions.length, 1);
});

test("reports no scoring opportunity when a declared condition is unsatisfied", () => {
  const result = evaluateScoringOpportunity(baseState(), definition());

  assert.equal(result.state, SCORING_OPPORTUNITY_STATES.NOT_AVAILABLE);
  assert.equal(result.eligible, false);
  assert.equal(result.conditions[0].eligible, false);
});

test("does not award victory points", () => {
  let state = baseState();
  state = recordObjectiveControl(state, {
    objectiveId: "obj-1",
    controllerId: "p1"
  });

  const result = evaluateScoringOpportunity(state, definition());

  assert.equal(result.points, undefined);
});
