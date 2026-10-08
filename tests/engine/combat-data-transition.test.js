import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { resolveUnitAttack } from "../../src/engine/combat-transitions.js";

test("combat transition consumes weapon and target data instead of raw attack parameters", () => {
  const state = createGameState({
    phase: "shooting",
    turn: 1,
    battle: { id: "b1", status: "active", round: 1, activePlayerId: "p1" },
    units: [
      { id: "a", ownerId: "p1", status: "deployed", wounds: 5, profile: { characteristics: { ballisticSkill: 4, toughness: 4, save: 3 } } },
      { id: "t", ownerId: "p2", status: "deployed", wounds: 5, profile: { characteristics: { ballisticSkill: 4, toughness: 4, save: 3 } } }
    ],
    history: [{ type: "shooting.unit_activated", payload: { unitId: "a", round: 1, turn: 1 } }]
  });

  const weapon = {
    id: "laser",
    name: "Laser",
    type: "ranged",
    characteristics: { attacks: 2, strength: 8, ap: 1, damage: 2 }
  };
  const values = [0.9, 0.9, 0.9, 0.9, 0.1, 0.1];
  let index = 0;

  const next = resolveUnitAttack(state, {
    attackerId: "a",
    targetId: "t",
    weapon,
    random: () => values[index++]
  });

  assert.equal(next.units.find((unit) => unit.id === "t").wounds, 1);
  assert.equal(next.history.at(-1).payload.weaponId, "laser");
  assert.equal(next.history.at(-1).payload.profile.damage, 2);
});
