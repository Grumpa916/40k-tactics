import test from "node:test";
import assert from "node:assert/strict";
import { createCommand } from "../../src/commands/command.js";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import { clearCommandHandlers, executeCommand } from "../../src/engine/command-engine.js";
import { registerCoreCommandHandlers } from "../../src/engine/register-core-commands.js";
import { COMMAND_TYPES } from "../../src/commands/game-commands.js";

function advanceToEndOfTurn(state) {
  for (const phase of ["command", "movement", "shooting", "charge", "fight", "end_turn"]) {
    state = executeCommand(state, createCommand(COMMAND_TYPES.CHANGE_PHASE, { phase }));
  }
  return state;
}

test("core commands execute through the command engine", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();

  let state = createGameState({
    units: [createUnit({ id: "u1", ownerId: "p1", name: "Unit 1" })]
  });

  state = executeCommand(state, createCommand(COMMAND_TYPES.START_BATTLE, {
    battleId: "b1",
    missionId: "m1"
  }));
  state = executeCommand(state, createCommand(COMMAND_TYPES.DEPLOY_UNIT, {
    unitId: "u1",
    position: { x: 5, y: 10 }
  }));
  state = executeCommand(state, createCommand(COMMAND_TYPES.START_FIRST_TURN, {
    activePlayerId: "p1"
  }));
  state = executeCommand(state, createCommand(COMMAND_TYPES.CHANGE_PHASE, {
    phase: "command"
  }));
  state = executeCommand(state, createCommand(COMMAND_TYPES.CHANGE_PHASE, {
    phase: "movement"
  }));

  assert.equal(state.battle.status, "active");
  assert.equal(state.phase, "movement");
  assert.equal(state.units[0].status, "deployed");
  assert.equal(state.history.length, 6);
  assert.deepEqual(
    state.history.map((event) => event.type),
    [
      "battle.started",
      "unit.deployed",
      "battle.round_started",
      "turn.started",
      "turn.phase_changed",
      "turn.phase_changed"
    ]
  );
});

test("turn commands advance both players and start the next battle round", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();

  let state = createGameState({ players: [{ id: "p1" }, { id: "p2" }] });
  state = executeCommand(state, createCommand(COMMAND_TYPES.START_BATTLE, { battleId: "b1" }));
  state = executeCommand(state, createCommand(COMMAND_TYPES.START_FIRST_TURN, { activePlayerId: "p1" }));
  state = advanceToEndOfTurn(state);
  state = executeCommand(state, createCommand(COMMAND_TYPES.END_TURN, { nextActivePlayerId: "p2" }));
  state = advanceToEndOfTurn(state);
  state = executeCommand(state, createCommand(COMMAND_TYPES.END_TURN, { nextActivePlayerId: "p1" }));
  state = executeCommand(state, createCommand(COMMAND_TYPES.ADVANCE_BATTLE_ROUND));

  assert.equal(state.battle.round, 2);
  assert.equal(state.turn, 3);
  assert.equal(state.phase, "start_turn");
  assert.equal(state.activePlayer, "p1");
  clearCommandHandlers();
});

test("normal move command updates per-model positions and records an event", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const state = createGameState({
    phase: "movement",
    activePlayer: "p1",
    battle: { id: "b1", status: "active", round: 1 },
    units: [createUnit({
      id: "u1",
      ownerId: "p1",
      name: "Unit 1",
      status: "deployed",
      profile: { characteristics: { movement: 6 } },
      models: [{ id: "m1", position: { x: 0, y: 0 } }]
    })]
  });

  const next = executeCommand(state, createCommand(COMMAND_TYPES.RESOLVE_NORMAL_MOVE, {
    unitId: "u1",
    moves: [{ modelId: "m1", position: { x: 3, y: 4 } }]
  }));

  assert.deepEqual(next.units[0].models[0].position, { x: 3, y: 4 });
  assert.equal(next.history.at(-1).type, "unit.normal_move_resolved");
  clearCommandHandlers();
});

test("charge outcome command records success and post-roll targets", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const state = createGameState({
    phase: "charge",
    turn: 2,
    activePlayer: "p1",
    battle: { id: "b1", status: "active", round: 1 },
    units: [
      createUnit({ id: "u1", ownerId: "p1", name: "Charger", status: "deployed" }),
      createUnit({ id: "u2", ownerId: "p2", name: "Target", status: "deployed" })
    ]
  });

  const next = executeCommand(state, createCommand(COMMAND_TYPES.RECORD_CHARGE_OUTCOME, {
    unitId: "u1",
    succeeded: true,
    targetIds: ["u2"],
    measuredDistances: { u2: 10 }
  }));

  assert.equal(next.history.at(-1).type, "charge.outcome_recorded");
  assert.deepEqual(next.history.at(-1).payload.targetIds, ["u2"]);
  assert.deepEqual(next.history.at(-1).payload.measuredDistances, { u2: 10 });
  clearCommandHandlers();
});

test("Fight activation command records the selected unit and Fights First status", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const state = createGameState({
    phase: "fight",
    turn: 2,
    activePlayer: "p1",
    players: [{ id: "p1" }, { id: "p2" }],
    battle: { id: "b1", status: "active", round: 1 },
    units: [
      createUnit({ id: "u1", ownerId: "p1", name: "Charger", status: "deployed" })
    ],
    history: [{
      type: "charge.outcome_recorded",
      payload: {
        unitId: "u1",
        outcome: "successful",
        round: 1,
        turn: 2
      }
    }]
  });

  const next = executeCommand(state, createCommand(COMMAND_TYPES.RECORD_FIGHT_ACTIVATION, {
    unitId: "u1"
  }));

  assert.equal(next.history.at(-1).type, "fight.unit_activated");
  assert.equal(next.history.at(-1).payload.fightsFirst, true);
  clearCommandHandlers();
});

test("Fight completion command advances to end of turn after candidates are exhausted", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  let state = createGameState({
    phase: "fight",
    turn: 2,
    activePlayer: "p1",
    players: [{ id: "p1" }, { id: "p2" }],
    battle: { id: "b1", status: "active", round: 1 },
    units: [
      createUnit({ id: "u1", ownerId: "p1", name: "Unit 1", status: "deployed" })
    ]
  });

  state = executeCommand(state, createCommand(COMMAND_TYPES.RECORD_FIGHT_ACTIVATION, {
    unitId: "u1"
  }));
  state = executeCommand(state, createCommand(COMMAND_TYPES.COMPLETE_FIGHT_PHASE));

  assert.equal(state.phase, "end_turn");
  assert.deepEqual(state.history.slice(-2).map((event) => event.type), [
    "fight.phase_completed",
    "turn.phase_changed"
  ]);
  clearCommandHandlers();
});

test("core command registration rejects duplicate registration", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  assert.throws(() => registerCoreCommandHandlers(), /already registered/);
  clearCommandHandlers();
});

test("Command Point changes execute through the core command engine", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const initial = createGameState({
    turn: 1,
    activePlayer: "p1",
    battle: { id: "b1", status: "active", round: 1 },
    commandPoints: { p1: 0 }
  });
  const next = executeCommand(initial, createCommand(COMMAND_TYPES.RECORD_COMMAND_POINT_CHANGE, {
    playerId: "p1", amount: 1, reason: "gain", note: "Command phase"
  }));
  assert.equal(next.commandPoints.p1, 1);
  assert.equal(next.history.at(-1).type, "command_points.changed");
  assert.equal(next.history.at(-1).payload.balanceAfter, 1);
  clearCommandHandlers();
});

test("confirmed victory-point awards execute through the core command engine", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const initial = createGameState({
    turn: 2,
    activePlayer: "p1",
    players: [{ id: "p1" }, { id: "p2" }],
    battle: { id: "b1", status: "active", round: 1 }
  });
  const next = executeCommand(initial, createCommand(COMMAND_TYPES.RECORD_VICTORY_POINTS, {
    playerId: "p2", amount: 5, reason: "Confirmed primary score"
  }));
  assert.equal(next.victoryPoints.p2, 5);
  assert.equal(next.history.at(-1).type, "victory_points.awarded");
  assert.equal(next.history.at(-1).payload.scoreAfter, 5);
  clearCommandHandlers();
});
