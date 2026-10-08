import test from "node:test";
import assert from "node:assert/strict";
import {
  SCORING_TIMINGS,
  createMissionDefinition
} from "./mission-definition.js";
import { SCORING_EVIDENCE } from "./scoring-eligibility.js";
import { getScoringOpportunityAdvisories } from "./tactical-scoring-opportunities.js";
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

function definition(id, timing = SCORING_TIMINGS.COMMAND_PHASE) {
  return createMissionDefinition({
    id,
    name: id,
    timing,
    conditions: [{
      evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
      args: { objectiveId: "obj-1", playerId: "p1", expected: "controlled" }
    }]
  });
}

test("surfaces only currently due and eligible scoring opportunities", () => {
  let state = baseState();
  state = recordObjectiveControl(state, {
    objectiveId: "obj-1",
    controllerId: "p1"
  });

  const result = getScoringOpportunityAdvisories(state, {
    definitions: [
      definition("available"),
      definition("not-due", SCORING_TIMINGS.END_OF_TURN)
    ],
    timing: SCORING_TIMINGS.COMMAND_PHASE
  });

  assert.equal(result.timing, SCORING_TIMINGS.COMMAND_PHASE);
  assert.equal(result.evaluations.length, 2);
  assert.equal(result.available.length, 1);
  assert.equal(result.available[0].definitionId, "available");
});

test("keeps ineligible definitions as evaluations without surfacing them as opportunities", () => {
  const result = getScoringOpportunityAdvisories(baseState(), {
    definitions: [definition("not-available")],
    timing: SCORING_TIMINGS.COMMAND_PHASE
  });

  assert.equal(result.evaluations[0].due, true);
  assert.equal(result.evaluations[0].opportunity.eligible, false);
  assert.equal(result.available.length, 0);
});

test("does not award VP", () => {
  let state = baseState();
  state = recordObjectiveControl(state, {
    objectiveId: "obj-1",
    controllerId: "p1"
  });

  const result = getScoringOpportunityAdvisories(state, {
    definitions: [definition("available")],
    timing: SCORING_TIMINGS.COMMAND_PHASE
  });

  assert.equal(result.available[0].points, undefined);
});


test("provides generic condition context for due scoring opportunities", () => {
  const result = getScoringOpportunityAdvisories(baseState(), {
    definitions: [definition("blocked")],
    timing: SCORING_TIMINGS.COMMAND_PHASE
  });

  assert.equal(result.due.length, 1);
  assert.equal(result.advisories.length, 1);
  assert.equal(result.advisories[0].definitionId, "blocked");
  assert.equal(result.advisories[0].available, false);
  assert.equal(result.advisories[0].conditions.length, 1);
  assert.equal(result.advisories[0].conditions[0].evidence, SCORING_EVIDENCE.OBJECTIVE_CONTROL);
  assert.equal(result.advisories[0].conditions[0].status, "not-satisfied");
  assert.equal(result.advisories[0].conditions[0].details.actual, "uncontrolled");
});

test("reports satisfied condition context without adding scoring rules", () => {
  let state = baseState();
  state = recordObjectiveControl(state, {
    objectiveId: "obj-1",
    controllerId: "p1"
  });

  const result = getScoringOpportunityAdvisories(state, {
    definitions: [definition("available")],
    timing: SCORING_TIMINGS.COMMAND_PHASE
  });

  assert.equal(result.advisories[0].available, true);
  assert.equal(result.advisories[0].conditions[0].status, "satisfied");
  assert.equal(result.advisories[0].conditions[0].details.actual, "controlled");
});
