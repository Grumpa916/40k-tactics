import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { resolveUnitAttack } from "../../src/engine/combat-transitions.js";

test("end-to-end combat scenario records hits, critical hits, wounds, saves, damage, and history", () => {
  const state = createGameState({
    phase: "shooting",
    turn: 1,
    activePlayer: "p1",
    battle: {
      id: "battle-scenario",
      missionId: "test-mission",
      status: "active",
      round: 1,
      activePlayerId: "p1"
    },
    history: [{ type: "shooting.unit_activated", payload: { unitId: "attacker", round: 1, turn: 1 } }],
    units: [
      {
        id: "attacker",
        ownerId: "p1",
        name: "Attacker",
        status: "deployed",
        wounds: 5,
        profile: { characteristics: { ballisticSkill: 4, toughness: 4, save: 3 } }
      },
      {
        id: "target",
        ownerId: "p2",
        name: "Target",
        status: "deployed",
        wounds: 8,
        profile: { characteristics: { toughness: 4, save: 3 } }
      }
    ]
  });

  const weapon = {
    id: "scenario-weapon",
    name: "Scenario Weapon",
    type: "ranged",
    characteristics: { attacks: 2, strength: 8, ap: 1, damage: 2 }
  };

  const values = [0.99, 0.99, 0.99, 0.99, 0.1, 0.1];
  let index = 0;

  const next = resolveUnitAttack(state, {
    attackerId: "attacker",
    targetId: "target",
    weapon,
    random: () => values[index++]
  });

  const event = next.history.at(-1);
  assert.equal(event.type, "combat.attack_resolved");
  assert.equal(event.payload.attackerId, "attacker");
  assert.equal(event.payload.targetId, "target");
  assert.equal(event.payload.weaponId, "scenario-weapon");

  assert.deepEqual(event.payload.result.attacks.rolls, [6, 6]);
  assert.equal(event.payload.result.attacks.hits, 2);
  assert.equal(event.payload.result.attacks.criticalHits, 2);

  assert.deepEqual(event.payload.result.wounds.rolls, [6, 6]);
  assert.equal(event.payload.result.wounds.wounds, 2);

  assert.deepEqual(event.payload.result.saves.rolls, [1, 1]);
  assert.equal(event.payload.result.saves.target, 2);
  assert.equal(event.payload.result.saves.failedSaves, 2);

  assert.equal(event.payload.result.damage.totalDamage, 4);
  assert.equal(next.units.find((unit) => unit.id === "target").wounds, 4);
});
