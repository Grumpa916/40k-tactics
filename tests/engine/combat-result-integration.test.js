import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { resolveUnitAttack } from "../../src/engine/combat-transitions.js";

function stateWithProfile(characteristics) {
  return createGameState({
    phase: "shooting",
    turn: 1,
    battle: { id: "b1", status: "active", round: 1, activePlayerId: "p1" },
    units: [
      {
        id: "a",
        ownerId: "p1",
        status: "deployed",
        wounds: 5,
        profile: { characteristics: { ballisticSkill: 4, toughness: 4, save: 3 } }
      },
      {
        id: "t",
        ownerId: "p2",
        status: "deployed",
        wounds: 6,
        profile: { characteristics: { toughness: 4, save: 4, ...characteristics } }
      }
    ],
    history: [{ type: "shooting.unit_activated", payload: { unitId: "a", round: 1, turn: 1 } }]
  });
}

test("combat transition carries Devastating Wounds into final target damage", () => {
  const state = stateWithProfile({});
  const weapon = {
    id: "dev-weapon",
    name: "Dev Weapon",
    type: "ranged",
    characteristics: {
      attacks: 1,
      strength: 8,
      damage: 3,
      devastatingWounds: true
    }
  };

  const next = resolveUnitAttack(state, {
    attackerId: "a",
    targetId: "t",
    weapon,
    random: () => 0.99
  });

  const target = next.units.find((unit) => unit.id === "t");
  const event = next.history.at(-1);

  assert.equal(target.wounds, 3);
  assert.equal(event.payload.result.wounds.devastatingWoundCount, 1);
  assert.equal(event.payload.result.damage.devastatingDamage, 3);
  assert.equal(event.payload.result.saves.rolls.length, 0);
});

test("combat transition records a resolved variable attack count", () => {
  const state = stateWithProfile({});
  const weapon = {
    id: "variable-attacks",
    name: "Variable Attacks",
    type: "ranged",
    characteristics: { attacks: "D3+1", strength: 8, damage: 1 }
  };
  const values = [0, 0.99, 0.99, 0.99, 0.99, 0, 0];
  let index = 0;
  const next = resolveUnitAttack(state, {
    attackerId: "a",
    targetId: "t",
    weapon,
    random: () => values[index++]
  });
  const target = next.units.find((unit) => unit.id === "t");
  const event = next.history.at(-1);

  assert.equal(event.payload.profile.attacks, "D3+1");
  assert.equal(event.payload.result.attacks.attackCount.total, 2);
  assert.deepEqual(event.payload.result.attacks.attackCount.rolls, [1]);
  assert.equal(target.wounds, 4);
});

test("combat transition carries damage prevention into final target damage", () => {
  const state = stateWithProfile({});
  const weapon = {
    id: "fnp-weapon",
    name: "FNP Weapon",
    type: "ranged",
    characteristics: {
      attacks: 1,
      strength: 8,
      damage: 3,
      damagePrevention: 4
    }
  };

  const values = [0.99, 0.99, 0.0, 0.99, 0.1, 0.99];
  let index = 0;
  const next = resolveUnitAttack(state, {
    attackerId: "a",
    targetId: "t",
    weapon,
    random: () => values[index++]
  });

  const target = next.units.find((unit) => unit.id === "t");
  const event = next.history.at(-1);

  assert.equal(event.payload.profile.damagePrevention, 4);
  assert.equal(event.payload.result.saves.failedSaves, 1);
  assert.equal(event.payload.result.damage.damagePrevention, 4);
  assert.equal(event.payload.result.damage.damageRolls.length, 3);
  assert.equal(target.wounds, 5);
  assert.equal(event.payload.result.damage.preventedDamage, 2);
  assert.equal(event.payload.result.damage.totalDamage, 1);
});

test("combat transition resolves variable Devastating Wounds damage and prevention", () => {
  const state = stateWithProfile({});
  const weapon = {
    id: "variable-dev-weapon",
    name: "Variable Dev Weapon",
    type: "ranged",
    characteristics: {
      attacks: 1,
      strength: 8,
      damage: "D6",
      devastatingWounds: true,
      damagePrevention: 4
    }
  };
  const values = [0.99, 0.99, 0.5, 0.99, 0.1, 0.99, 0.1];
  let index = 0;
  const next = resolveUnitAttack(state, {
    attackerId: "a",
    targetId: "t",
    weapon,
    random: () => values[index++]
  });
  const target = next.units.find((unit) => unit.id === "t");
  const result = next.history.at(-1).payload.result;

  assert.equal(result.wounds.devastatingWoundCount, 1);
  assert.equal(result.saves.rolls.length, 0);
  assert.deepEqual(result.damage.devastatingDamageResult.damageValues, [4]);
  assert.equal(result.damage.devastatingDamageResult.preventedDamage, 2);
  assert.equal(result.damage.devastatingDamage, 2);
  assert.equal(result.damage.totalDamage, 2);
  assert.equal(target.wounds, 4);
});
