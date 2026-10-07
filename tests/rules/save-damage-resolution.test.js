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

test("damage resolution supports deterministic D3 damage", () => {
  const values = [0.5, 0.1];
  let index = 0;
  const result = resolveDamage({
    failedSaves: 2,
    damage: "D3",
    random: () => values[index++]
  });
  assert.deepEqual(result.damageValues, [2, 1]);
  assert.equal(result.totalRawDamage, 3);
  assert.equal(result.totalDamage, 3);
});

test("variable damage still applies prevention once per damage point", () => {
  const values = [0.99, 0.0, 0.99, 0.0, 0.99];
  let index = 0;
  const result = resolveDamage({
    failedSaves: 2,
    damage: "D3",
    damagePrevention: 4,
    random: () => values[index++]
  });
  assert.deepEqual(result.damageValues, [3, 1]);
  assert.equal(result.totalRawDamage, 4);
  assert.equal(result.preventedDamage, 2);
  assert.equal(result.totalDamage, 2);
});

test("invulnerable save is selected when better than modified armour", () => {
  const values = [0.0, 0.99];
  let i = 0;
  const result = resolveSaveRoll({
    wounds: 2, save: 6, ap: 0, saveModifier: 2,
    invulnerableSave: 4, random: () => values[i++]
  });
  assert.equal(result.modifiedArmourTarget, 7);
  assert.equal(result.invulnerableTarget, 4);
  assert.equal(result.target, 4);
  assert.equal(result.saveType, "invulnerable");
  assert.equal(result.failedSaves, 1);
});

test("armour save remains selected when it is equal or better", () => {
  const result = resolveSaveRoll({
    wounds: 0, save: 3, ap: 0, invulnerableSave: 4, random: Math.random
  });
  assert.equal(result.target, 3);
  assert.equal(result.saveType, "armour");
});

test("invulnerable saves are not modified by AP or save modifiers", () => {
  const result = resolveSaveRoll({
    wounds: 0, save: 4, ap: 0, saveModifier: 4, invulnerableSave: 4, random: Math.random
  });
  assert.equal(result.modifiedArmourTarget, 7);
  assert.equal(result.target, 4);
  assert.equal(result.saveType, "invulnerable");
});

test("cover improves an armour save by one", () => {
  const result = resolveSaveRoll({
    wounds: 0,
    save: 4,
    ap: 0,
    cover: true,
    random: Math.random
  });
  assert.equal(result.baseTarget, 4);
  assert.equal(result.coverModifier, -1);
  assert.equal(result.modifiedArmourTarget, 3);
  assert.equal(result.target, 3);
  assert.equal(result.saveType, "armour");
});

test("cover cannot improve an armour save beyond 2+", () => {
  const result = resolveSaveRoll({
    wounds: 0,
    save: 2,
    cover: true,
    random: Math.random
  });
  assert.equal(result.modifiedArmourTarget, 2);
  assert.equal(result.target, 2);
});

test("cover does not modify an invulnerable save", () => {
  const result = resolveSaveRoll({
    wounds: 0,
    save: 4,
    ap: 3,
    cover: true,
    invulnerableSave: 4,
    random: Math.random
  });
  assert.equal(result.modifiedArmourTarget, 2);
  assert.equal(result.target, 4);
  assert.equal(result.saveType, "invulnerable");
});
