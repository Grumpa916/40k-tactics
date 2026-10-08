import test from "node:test";
import assert from "node:assert/strict";
import { SCORING_TIMINGS, createMissionDefinition } from "./mission-definition.js";
import { SCORING_EVIDENCE } from "./scoring-eligibility.js";
import {
  evaluateScoringOpportunityAtTiming,
  isScoringTimingDue
} from "./scoring-opportunity-timing.js";
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

function definition(timing = SCORING_TIMINGS.COMMAND_PHASE) {
  return createMissionDefinition({
    id: "command-check",
    name: "Command Check",
    timing,
    conditions: [{
      evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
      args: { objectiveId: "obj-1", playerId: "p1", expected: "controlled" }
    }]
  });
}

test("recognizes when a definition is due at its declared timing", () => {
  assert.equal(isScoringTimingDue(definition(), SCORING_TIMINGS.COMMAND_PHASE), true);
  assert.equal(isScoringTimingDue(definition(), SCORING_TIMINGS.END_OF_TURN), false);
});

test("does not evaluate an opportunity before its declared timing", () => {
  const result = evaluateScoringOpportunityAtTiming(
    baseState(),
    definition(SCORING_TIMINGS.END_OF_TURN),
    SCORING_TIMINGS.COMMAND_PHASE
  );

  assert.equal(result.due, false);
  assert.equal(result.opportunity, null);
});

test("evaluates the opportunity when its declared timing is reached", () => {
  let state = baseState();
  state = recordObjectiveControl(state, {
    objectiveId: "obj-1",
    controllerId: "p1"
  });

  const result = evaluateScoringOpportunityAtTiming(
    state,
    definition(SCORING_TIMINGS.COMMAND_PHASE),
    SCORING_TIMINGS.COMMAND_PHASE
  );

  assert.equal(result.due, true);
  assert.equal(result.opportunity.eligible, true);
  assert.equal(result.opportunity.state, "available");
});

test("preserves event timing as an explicit evaluation point", () => {
  const result = evaluateScoringOpportunityAtTiming(
    baseState(),
    definition(SCORING_TIMINGS.EVENT),
    SCORING_TIMINGS.EVENT
  );

  assert.equal(result.due, true);
  assert.equal(result.evaluationTiming, SCORING_TIMINGS.EVENT);
});
