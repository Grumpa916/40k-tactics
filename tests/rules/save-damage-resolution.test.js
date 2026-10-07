import test from "node:test";
import assert from "node:assert/strict";
import { resolveSaveRoll, resolveDamage } from "../../src/rules/save-damage-resolution.js";
import { resolveAttack } from "../../src/rules/attack-resolution.js";

test("save resolution applies armour penetration and counts failed saves", () => {
  const values = [0.9, 0.2, 0.5];
  let index = 0;
  const result = resolveSaveRoll({ wounds: 3, save: 4, ap: 1, random: () => values[index++] });
  assert.equal(result.target, 3);
  assert.deepEqual(result.rolls, [6, 2, 4]);
  assert.equal(result.failedSaves, 1);
});

test("damage resolution totals unsaved wound damage", () => {
  const result = resolveDamage({ failedSaves: 3, damage: 2 });
  assert.equal(result.totalDamage, 6);
});

test("full attack resolution composes attacks, wounds, saves, and damage", () => {
  const values = [0.5, 0.5, 0.5, 0.5, 0.1, 0.1];
  let index = 0;
  const result = resolveAttack({
    attacks: 2, hitTarget: 4, strength: 8, toughness: 4,
    save: 4, ap: 1, damage: 2, random: () => values[index++]
  });
  assert.equal(result.attacks.hits, 2);
  assert.equal(result.wounds.wounds, 2);
  assert.equal(result.saves.target, 3);
  assert.equal(result.saves.failedSaves, 2);
  assert.equal(result.damage.totalDamage, 4);
});

test("save modifiers adjust the post-AP target", () => {
  const values = [0.49, 0.5, 0.99];
  let i = 0;
  const result = resolveSaveRoll({ wounds: 3, save: 4, ap: 1, saveModifier: 1, random: () => values[i++] });
  assert.equal(result.baseTarget, 3);
  assert.equal(result.target, 4);
  assert.equal(result.failedSaves, 1);
});

test("save modifiers clamp the target", () => {
  assert.equal(resolveSaveRoll({ wounds: 0, save: 2, saveModifier: -5, random: Math.random }).target, 2);
  assert.equal(resolveSaveRoll({ wounds: 0, save: 6, ap: -1, saveModifier: 5, random: Math.random }).target, 7);
});

test("natural sixes are tracked as critical saves", () => {
  const values = [0.99, 0.5];
  let i = 0;
  const result = resolveSaveRoll({ wounds: 2, save: 4, random: () => values[i++] });
  assert.equal(result.criticalSaves, 1);
});
