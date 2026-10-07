import test from "node:test";
import assert from "node:assert/strict";
import { resolveDamage } from "../../src/rules/save-damage-resolution.js";
import { resolveAttack } from "../../src/rules/attack-resolution.js";

test("damage prevention rolls once per point of damage", () => {
  const values = [0.99, 0.1, 0.99, 0.1];
  let index = 0;
  const result = resolveDamage({
    failedSaves: 2,
    damage: 2,
    damagePrevention: 4,
    random: () => values[index++]
  });

  assert.equal(result.damageRolls.length, 4);
  assert.equal(result.preventedDamage, 2);
  assert.equal(result.totalDamage, 2);
});

test("damage prevention does not alter damage when disabled", () => {
  const result = resolveDamage({
    failedSaves: 2,
    damage: 3,
    damagePrevention: 0,
    random: () => 0.99
  });

  assert.equal(result.damageRolls.length, 6);
  assert.equal(result.preventedDamage, 0);
  assert.equal(result.totalDamage, 6);
});

test("damage prevention composes through full attack resolution", () => {
  const values = [0.5, 0.5, 0.1, 0.99, 0.1, 0.99];
  let index = 0;
  const result = resolveAttack({
    attacks: 1,
    hitTarget: 4,
    strength: 8,
    toughness: 4,
    save: 4,
    damage: 3,
    damagePrevention: 4,
    random: () => values[index++]
  });

  assert.equal(result.saves.failedSaves, 1);
  assert.equal(result.damage.preventedDamage, 2);
  assert.equal(result.damage.totalDamage, 1);
});
