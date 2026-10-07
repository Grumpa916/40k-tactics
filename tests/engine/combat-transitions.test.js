import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { resolveUnitAttack } from "../../src/engine/combat-transitions.js";

function activeState() {
  return createGameState({
    phase: "shooting",
    turn: 1,
    activePlayer: "p1",
    battle: { id: "battle-1", missionId: null, status: "active", round: 1, activePlayerId: "p1" },
    units: [
      { id: "attacker", ownerId: "p1", name: "Attacker", status: "deployed", wounds: 5, position: null, metadata: {} },
      { id: "target", ownerId: "p2", name: "Target", status: "deployed", wounds: 5, position: null, metadata: {} }
    ]
  });
}

test("combat transition resolves an attack and updates target wounds", () => {
  const state = activeState();
  const values = [0.9, 0.9, 0.9, 0.9, 0.1, 0.1];
  let index = 0;
  const next = resolveUnitAttack(state, {
    attackerId: "attacker", targetId: "target", attacks: 2,
    strength: 8, toughness: 4, save: 4, ap: 1, damage: 2,
    random: () => values[index++]
  });
  assert.equal(next.units.find((unit) => unit.id === "target").wounds, 1);
  assert.equal(next.history.at(-1).type, "combat.attack_resolved");
  assert.equal(next.history.at(-1).payload.attackerId, "attacker");
});

test("combat transition marks a target destroyed when wounds reach zero", () => {
  const state = activeState();
  const values = [0.9, 0.9, 0.9, 0.9, 0.9, 0.9];
  let index = 0;
  const next = resolveUnitAttack(state, {
    attackerId: "attacker", targetId: "target", attacks: 2,
    strength: 8, toughness: 4, save: 4, ap: 1, damage: 3,
    random: () => values[index++]
  });
  const target = next.units.find((unit) => unit.id === "target");
  assert.equal(target.wounds, 0);
  assert.equal(target.status, "destroyed");
});

test("combat transition rejects attacks outside combat phases", () => {
  assert.throws(
    () => resolveUnitAttack(
      { ...activeState(), phase: "movement" },
      { attackerId: "attacker", targetId: "target", attacks: 1, strength: 4, toughness: 4, save: 4, random: () => 0.9 }
    ),
    /shooting or fight/
  );
});
