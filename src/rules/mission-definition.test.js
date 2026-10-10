import test from "node:test";
import assert from "node:assert/strict";
import {
  SCORING_TIMINGS,
  createMissionDefinition,
  createScoringCondition,
  evaluateMissionDefinition
} from "./mission-definition.js";
import { SCORING_EVIDENCE } from "./scoring-eligibility.js";
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
  state = startFirstTurn(state, { activePlayerId: "p1" });
  return state;
}

test("creates a declarative mission definition", () => {
  const definition = createMissionDefinition({
    id: "hold-center",
    name: "Hold Center",
    timing: SCORING_TIMINGS.END_OF_TURN,
    conditions: [
      {
        evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
        args: { objectiveId: "obj-1", playerId: "p1", expected: "controlled" }
      }
    ]
  });

  assert.equal(definition.id, "hold-center");
  assert.equal(definition.timing, SCORING_TIMINGS.END_OF_TURN);
  assert.equal(definition.conditions.length, 1);
});

test("evaluates all declared conditions without awarding points", () => {
  let state = baseState();
  state = recordObjectiveControl(state, {
    objectiveId: "obj-1",
    controllerId: "p1"
  });

  const definition = createMissionDefinition({
    id: "hold-center",
    name: "Hold Center",
    conditions: [
      createScoringCondition({
        evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
        args: { objectiveId: "obj-1", playerId: "p1", expected: "controlled" }
      })
    ]
  });

  const result = evaluateMissionDefinition(state, definition);

  assert.equal(result.eligible, true);
  assert.equal(result.conditions.length, 1);
  assert.equal(result.conditions[0].actual, "controlled");
  assert.equal(result.points, undefined);
});

test("requires every declared condition to be satisfied", () => {
  const state = baseState();
  const definition = createMissionDefinition({
    id: "survive-and-hold",
    name: "Survive and Hold",
    conditions: [
      {
        evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
        args: { objectiveId: "obj-1", playerId: "p1", expected: "controlled" }
      },
      {
        evidence: SCORING_EVIDENCE.UNIT_STATUS,
        args: { unitId: "u1", expected: "destroyed" }
      }
    ]
  });

  const result = evaluateMissionDefinition(state, definition);

  assert.equal(result.eligible, false);
  assert.equal(result.conditions.every((condition) => condition.eligible), false);
});

test("supports command-phase timing without changing evidence evaluation", () => {
  const state = baseState();
  const definition = createMissionDefinition({
    id: "command-check",
    name: "Command Check",
    timing: SCORING_TIMINGS.COMMAND_PHASE,
    conditions: [
      {
        evidence: SCORING_EVIDENCE.TURN_SNAPSHOT,
        args: { turn: 1 }
      }
    ]
  });

  const result = evaluateMissionDefinition(state, definition);

  assert.equal(result.timing, SCORING_TIMINGS.COMMAND_PHASE);
  assert.equal(result.eligible, true);
});

test("rejects unsupported evidence and timing", () => {
  assert.throws(() => createScoringCondition({ evidence: "unknown" }));
  assert.throws(() => createMissionDefinition({
    id: "bad",
    name: "Bad",
    timing: "after-every-phase",
    conditions: [{ evidence: SCORING_EVIDENCE.TURN_SNAPSHOT, args: { turn: 1 } }]
  }));
});


test("carries Fixed or Tactical mode metadata for secondary mission caps", () => {
  const definition = createMissionDefinition({
    id: "fixed-assassination",
    name: "Assassination",
    category: "secondary",
    missionMode: "fixed",
    conditions: [{
      evidence: SCORING_EVIDENCE.TURN_SNAPSHOT,
      args: { turn: 1 }
    }]
  });
  assert.equal(definition.missionMode, "fixed");
  assert.throws(() => createMissionDefinition({
    id: "invalid-primary-mode",
    name: "Invalid",
    category: "primary",
    missionMode: "fixed",
    conditions: [{
      evidence: SCORING_EVIDENCE.TURN_SNAPSHOT,
      args: { turn: 1 }
    }]
  }), /only be supplied for secondary missions/);
});
