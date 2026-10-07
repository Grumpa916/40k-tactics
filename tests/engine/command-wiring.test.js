import test from "node:test";
import assert from "node:assert/strict";
import { createCommand } from "../../src/commands/command.js";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import { clearCommandHandlers, executeCommand } from "../../src/engine/command-engine.js";
import { registerCoreCommandHandlers } from "../../src/engine/register-core-commands.js";
import { COMMAND_TYPES } from "../../src/commands/game-commands.js";

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
    phase: "movement"
  }));

  assert.equal(state.battle.status, "active");
  assert.equal(state.phase, "movement");
  assert.equal(state.units[0].status, "deployed");
  assert.equal(state.history.length, 4);
  assert.deepEqual(
    state.history.map((event) => event.type),
    [
      "battle.started",
      "unit.deployed",
      "turn.started",
      "turn.phase_changed"
    ]
  );
});

test("core command registration rejects duplicate registration", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  assert.throws(() => registerCoreCommandHandlers(), /already registered/);
  clearCommandHandlers();
});
