
import test from "node:test";
import assert from "node:assert/strict";
import { resolveAttackRoll, resolveWoundRoll } from "../../src/rules/combat-resolution.js";

test("attack resolution uses an explicit hit threshold", () => {
  const randomValues = [0, 0.5, 0.99];
  let index = 0;
  const result = resolveAttackRoll({
    attacks: 3,
    hitTarget: 4,
    random: () => randomValues[index++]
  });

  assert.deepEqual(result.rolls, [1, 4, 6]);
  assert.equal(result.hitTarget, 4);
  assert.equal(result.hits, 2);
});

test("attack resolution supports different Ballistic or Weapon Skill thresholds", () => {
  const randomValues = [0.49, 0.5, 0.99];
  let index = 0;
  const result = resolveAttackRoll({
    attacks: 3,
    hitTarget: 5,
    random: () => randomValues[index++]
  });

  assert.deepEqual(result.rolls, [3, 4, 6]);
  assert.equal(result.hits, 1);
});

test("wound resolution derives the wound threshold from strength and toughness", () => {
  const randomValues = [0.9, 0.2, 0.5];
  let index = 0;
  const result = resolveWoundRoll({
    hits: 3,
    strength: 8,
    toughness: 4,
    random: () => randomValues[index++]
  });

  assert.equal(result.target, 2);
  assert.deepEqual(result.rolls, [6, 2, 4]);
  assert.equal(result.wounds, 3);
});

test("combat resolution rejects invalid inputs", () => {
  assert.throws(() => resolveAttackRoll({ attacks: -1, hitTarget: 4, random: Math.random }), /non-negative integer/);
  assert.throws(() => resolveAttackRoll({ attacks: 1, hitTarget: 7, random: Math.random }), /2 to 6/);
  assert.throws(() => resolveWoundRoll({
    hits: 1,
    strength: 0,
    toughness: 4,
    random: Math.random
  }), /positive integers/);
});
