import test from "node:test";
import assert from "node:assert/strict";
import { resolveAttack } from "../../src/rules/attack-resolution.js";

test("lethal hits bypass wound rolls but still enter save resolution", () => {
  const values = [0.99, 0.1, 0.1];
  let index = 0;
  const result = resolveAttack({
    attacks: 2,
    hitTarget: 4,
    lethalHits: true,
    strength: 3,
    toughness: 8,
    save: 4,
    random: () => values[index++]
  });

  assert.equal(result.attacks.lethalHitWounds, 1);
  assert.equal(result.wounds.rolls.length, 0);
  assert.equal(result.wounds.wounds, 0);
  assert.equal(result.wounds.totalWounds, 1);
  assert.equal(result.saves.rolls.length, 1);
});

test("sustained hits increase the number of wound rolls", () => {
  const values = [0.99, 0.99, 0.99, 0.99];
  let index = 0;
  const result = resolveAttack({
    attacks: 2,
    hitTarget: 4,
    sustainedHits: 1,
    strength: 8,
    toughness: 4,
    save: 6,
    random: () => values[index++]
  });

  assert.equal(result.attacks.hits, 4);
  assert.equal(result.wounds.rolls.length, 4);
});
