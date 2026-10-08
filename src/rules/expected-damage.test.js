import test from "node:test";
import assert from "node:assert/strict";
import { getExpectedDamage } from "./expected-damage.js";

function profiles(overrides = {}) {
  return {
    attacker: {
      id: "attacker",
      characteristics: {
        ballisticSkill: 3
      }
    },
    target: {
      id: "target",
      characteristics: {
        toughness: 4,
        save: 4
      }
    },
    weapon: {
      id: "weapon",
      type: "ranged",
      characteristics: {
        attacks: 4,
        range: 24,
        strength: 5,
        ap: -1,
        damage: 2
      }
    },
    ...overrides
  };
}

test("calculates baseline expected damage from attack profile probabilities", () => {
  const result = getExpectedDamage(profiles());

  assert.ok(Math.abs(result.expectedDamage - (64 / 27)) < 1e-12);
  assert.equal(result.attacks, 4);
  assert.equal(result.hitProbability, 4 / 6);
  assert.equal(result.woundProbability, 4 / 6);
  assert.equal(result.saveFailureProbability, 4 / 6);
});

test("supports variable attack counts and variable damage", () => {
  const result = getExpectedDamage(profiles({
    weapon: {
      id: "variable",
      type: "ranged",
      characteristics: {
        attacks: "D3+1",
        range: 24,
        strength: 4,
        ap: 0,
        damage: "D3"
      }
    }
  }));

  assert.equal(result.attacks, 3);
  assert.equal(result.damagePerUnsavedWound, 2);
  assert.ok(result.expectedDamage > 0);
});

test("accounts for lethal hits without double-counting critical hits", () => {
  const result = getExpectedDamage(profiles({
    weapon: {
      id: "lethal",
      type: "ranged",
      characteristics: {
        attacks: 6,
        range: 24,
        strength: 4,
        ap: 0,
        damage: 1,
        lethalHits: true
      }
    }
  }));

  assert.equal(result.lethalWounds, 1);
  assert.ok(result.expectedDamage > 0);
});

test("accounts for devastating wounds and damage prevention", () => {
  const result = getExpectedDamage(profiles({
    target: {
      id: "target",
      characteristics: {
        toughness: 4,
        save: 4,
        damagePrevention: 6
      }
    },
    weapon: {
      id: "devastating",
      type: "ranged",
      characteristics: {
        attacks: 6,
        range: 24,
        strength: 4,
        ap: 0,
        damage: 1,
        devastatingWounds: true
      }
    }
  }));

  assert.equal(result.devastatingWounds, 1 / 9);
  assert.ok(result.damagePreventionMultiplier > 0);
  assert.ok(result.expectedDamage > 0);
});
