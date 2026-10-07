import test from "node:test";
import assert from "node:assert/strict";
import {
  clearCommandHandlers,
  createCommand,
  executeCommand,
  registerCoreCommandHandlers
} from "../../src/engine/index.js";

test("combat command executes through the command engine and records history", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();

  const state = {
    version: 1,
    phase: "shooting",
    turn: 1,
    activePlayer: "p1",
    players: [],
    battle: { id: "battle-1", missionId: null, status: "active", round: 1, activePlayerId: "p1" },
    units: [
      { id: "attacker", ownerId: "p1", name: "Attacker", status: "deployed", wounds: 5, position: null, metadata: {} },
      { id: "target", ownerId: "p2", name: "Target", status: "deployed", wounds: 5, position: null, metadata: {} }
    ],
    objectives: [],
    commandPoints: {},
    timers: {},
    history: []
  };

  const command = createCommand("combat.resolve_attack", {
    attackerId: "attacker",
    targetId: "target",
    attacks: 2,
    strength: 8,
    toughness: 4,
    save: 4,
    ap: 1,
    damage: 2
  });

  const values = [0.9, 0.9, 0.9, 0.9, 0.1, 0.1];
  let index = 0;
  const next = executeCommand(state, command, { random: () => values[index++] });

  assert.equal(next.units.find((unit) => unit.id === "target").wounds, 1);
  assert.equal(next.history.length, 1);
  assert.equal(next.history[0].type, "combat.attack_resolved");
});
