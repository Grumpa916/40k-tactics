import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import { clearCommandHandlers } from "../../src/engine/command-engine.js";
import { registerCoreCommandHandlers } from "../../src/engine/register-core-commands.js";
import { createCommand } from "../../src/commands/command.js";
import { COMMAND_TYPES } from "../../src/commands/game-commands.js";
import { createGameSession } from "../../src/application/game-session.js";

function fightState() {
  return createGameState({
    phase: "fight",
    turn: 2,
    activePlayer: "p1",
    players: [
      { id: "p1", name: "You" },
      { id: "p2", name: "Opponent" }
    ],
    battle: { id: "b1", status: "active", round: 1 },
    units: [
      createUnit({ id: "friendly", ownerId: "p1", name: "Friendly", status: "deployed" }),
      createUnit({ id: "enemy", ownerId: "p2", name: "Enemy", status: "deployed" })
    ]
  });
}

test("session owns current state and notifies subscribers after a command", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();

  const session = createGameSession(fightState());
  const observed = [];
  const unsubscribe = session.subscribe((state) => observed.push(state.history.at(-1).type));

  session.dispatch(createCommand(COMMAND_TYPES.RECORD_FIGHT_ACTIVATION, {
    unitId: "enemy"
  }));

  assert.equal(session.getState().history.at(-1).type, "fight.unit_activated");
  assert.deepEqual(observed, ["fight.unit_activated"]);
  assert.equal(unsubscribe(), true);

  clearCommandHandlers();
});

test("session preserves opponent activation in the live game state", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();

  const session = createGameSession(fightState());

  session.dispatch(createCommand(COMMAND_TYPES.RECORD_FIGHT_ACTIVATION, {
    unitId: "enemy"
  }));

  assert.equal(session.getState().history.at(-1).payload.playerId, "p2");
  assert.equal(session.getState().phase, "fight");

  clearCommandHandlers();
});
