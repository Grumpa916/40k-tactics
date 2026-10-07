
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

test("lethal hits convert critical hits into automatic wounds", () => {
  const values = [0.99, 0.99, 0.1];
  let index = 0;
  const result = resolveAttackRoll({
    attacks: 3, hitTarget: 4, lethalHits: true,
    random: () => values[index++]
  });
  assert.equal(result.criticalHits, 2);
  assert.equal(result.regularHits, 2);
  assert.equal(result.lethalHitWounds, 2);
  assert.equal(result.normalHitsForWounds, 0);
});

test("sustained hits add hits from critical hits", () => {
  const values = [0.99, 0.99, 0.1];
  let index = 0;
  const result = resolveAttackRoll({
    attacks: 3, hitTarget: 4, sustainedHits: 1,
    random: () => values[index++]
  });
  assert.equal(result.criticalHits, 2);
  assert.equal(result.sustainedHitCount, 2);
  assert.equal(result.hits, 4);
  assert.equal(result.normalHitsForWounds, 4);
});


test("hit modifiers expose base and modified targets", () => {
  const result = resolveAttackRoll({
    attacks: 0,
    hitTarget: 4,
    hitModifier: 1,
    random: Math.random
  });
  assert.equal(result.baseTarget, 4);
  assert.equal(result.hitModifier, 1);
  assert.equal(result.modifiedTarget, 5);
});

test("hit modifiers clamp at six", () => {
  const result = resolveAttackRoll({
    attacks: 0,
    hitTarget: 5,
    hitModifier: 4,
    random: Math.random
  });
  assert.equal(result.baseTarget, 5);
  assert.equal(result.modifiedTarget, 6);
});

test("negative hit modifiers improve the attack threshold", () => {
  const values = [0.5, 0.66];
  let i = 0;
  const result = resolveAttackRoll({
    attacks: 2,
    hitTarget: 4,
    hitModifier: -1,
    random: () => values[i++]
  });
  assert.equal(result.modifiedTarget, 3);
  assert.equal(result.hits, 2);
});
