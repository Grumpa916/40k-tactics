import test from "node:test";
import assert from "node:assert/strict";
import { resolveAttack } from "../../src/rules/attack-resolution.js";

test("devastating wounds convert critical wounds into unsavable damage", () => {
  const values = [0.99, 0.99, 0.99, 0.1];
  let index = 0;

  const result = resolveAttack({
    attacks: 2,
    hitTarget: 4,
    strength: 8,
    toughness: 4,
    devastatingWounds: true,
    save: 3,
    ap: 0,
    damage: 2,
    random: () => values[index++]
  });

  assert.equal(result.attacks.hits, 2);
  assert.equal(result.wounds.criticalWounds, 2);
  assert.equal(result.wounds.devastatingWoundCount, 2);
  assert.equal(result.wounds.normalWounds, 0);
  assert.equal(result.saves.rolls.length, 0);
  assert.equal(result.wounds.devastatingDamage, 4);
  assert.equal(result.damage.totalDamage, 4);
});

test("non-critical wounds still use normal save resolution when devastating wounds are present", () => {
  const values = [0.1, 0.99, 0.5];
  let index = 0;

  const result = resolveAttack({
    attacks: 2,
    hitTarget: 4,
    strength: 8,
    toughness: 4,
    devastatingWounds: true,
    save: 4,
    ap: 0,
    damage: 2,
    random: () => values[index++]
  });

  assert.equal(result.attacks.hits, 1);
  assert.equal(result.wounds.criticalWounds, 1);
  assert.equal(result.wounds.devastatingWoundCount, 1);
  assert.equal(result.saves.rolls.length, 0);
  assert.equal(result.damage.totalDamage, 2);
});

test("devastating wounds disabled keeps critical wounds in normal wound pool", () => {
  const result = resolveAttack({
    attacks: 1,
    hitTarget: 4,
    strength: 8,
    toughness: 4,
    devastatingWounds: false,
    save: 4,
    damage: 1,
    random: () => 0.99
  });

  assert.equal(result.wounds.criticalWounds, 1);
  assert.equal(result.wounds.devastatingWoundCount, 0);
  assert.equal(result.saves.rolls.length, 1);
});
