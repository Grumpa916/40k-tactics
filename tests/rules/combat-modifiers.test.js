import test from "node:test";
import assert from "node:assert/strict";
import { applyTargetModifier, isCriticalHit, normalizeModifier } from "../../src/rules/combat-modifiers.js";
import { resolveAttackRoll, resolveWoundRoll } from "../../src/rules/combat-resolution.js";

test("combat modifiers clamp modified targets to the legal range", () => {
  assert.equal(applyTargetModifier(4, -3), 2);
  assert.equal(applyTargetModifier(4, 4), 6);
});

test("critical hits are natural sixes", () => {
  assert.equal(isCriticalHit(6), true);
  assert.equal(isCriticalHit(5), false);
});

test("hit modifiers change the effective hit target", () => {
  const rolls = [0.49, 0.5, 0.99];
  let i = 0;
  const result = resolveAttackRoll({ attacks: 3, hitTarget: 4, hitModifier: 1, random: () => rolls[i++] });
  assert.equal(result.modifiedTarget, 5);
  assert.equal(result.hits, 1);
  assert.equal(result.criticalHits, 1);
});

test("wound modifiers change the effective wound target", () => {
  const rolls = [0.5, 0.2, 0.99];
  let i = 0;
  const result = resolveWoundRoll({ hits: 3, strength: 4, toughness: 4, woundModifier: -1, random: () => rolls[i++] });
  assert.equal(result.baseTarget, 4);
  assert.equal(result.target, 3);
  assert.equal(result.wounds, 2);
});

test("modifiers must be integers", () => {
  assert.throws(() => normalizeModifier(0.5), /integers/);
});
