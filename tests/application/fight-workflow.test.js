import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import { clearCommandHandlers } from "../../src/engine/command-engine.js";
import { registerCoreCommandHandlers } from "../../src/engine/register-core-commands.js";
import {
  getFightViewModel,
  recordFightActivation,
  completeFightPhase
} from "../../src/application/fight-workflow.js";

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

test("Fight view model exposes both players' candidates with perspective labels", () => {
  const model = getFightViewModel(fightState(), { perspectivePlayerId: "p1" });

  assert.deepEqual(
    model.candidates.normal.map((unit) => ({
      unitId: unit.unitId,
      name: unit.name,
      ownerName: unit.ownerName,
      side: unit.side
    })),
    [
      {
        unitId: "friendly",
        name: "Friendly",
        ownerName: "You",
        side: "self"
      },
      {
        unitId: "enemy",
        name: "Enemy",
        ownerName: "Opponent",
        side: "opponent"
      }
    ]
  );
  assert.equal(model.canComplete, false);
});

test("Fight workflow records an opponent activation through the application boundary", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();

  const next = recordFightActivation(fightState(), { unitId: "enemy" });

  assert.equal(next.history.at(-1).type, "fight.unit_activated");
  assert.equal(next.history.at(-1).payload.playerId, "p2");

  clearCommandHandlers();
});

test("Fight workflow completes only after candidates are exhausted", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();

  let state = fightState();
  state = recordFightActivation(state, { unitId: "friendly" });
  state = recordFightActivation(state, { unitId: "enemy" });
  state = completeFightPhase(state);

  assert.equal(state.phase, "end_turn");
  assert.deepEqual(
    state.history.slice(-2).map((event) => event.type),
    ["fight.phase_completed", "turn.phase_changed"]
  );

  clearCommandHandlers();
});
