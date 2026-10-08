import test from "node:test";
import assert from "node:assert/strict";
import { getDamageOutcomeDistribution } from "./damage-outcome-distribution.js";
import { getExpectedDamage } from "./expected-damage.js";

function profiles(overrides = {}) {
  return {
    attacker: { characteristics: { ballisticSkill: 3 } },
    target: { characteristics: { toughness: 4, save: 4 } },
    weapon: {
      type: "ranged",
      characteristics: {
        attacks: 4,
        strength: 5,
        ap: -1,
        damage: 2
      }
    },
    ...overrides
  };
}

test("damage outcome probabilities sum to one", () => {
  const result = getDamageOutcomeDistribution(profiles());
  assert.ok(Math.abs(result.totalProbability - 1) < 1e-12);
  assert.equal(result.outcomes[0].damage, 0);
  assert.ok(result.outcomes.some((outcome) => outcome.damage > 0));
});

test("distribution expected value matches existing expected damage", () => {
  const distribution = getDamageOutcomeDistribution(profiles());
  const expected = getExpectedDamage(profiles());
  assert.ok(Math.abs(distribution.expectedDamage - expected.expectedDamage) < 1e-12);
});

test("distribution preserves variable attack and damage rolls", () => {
  const result = getDamageOutcomeDistribution(profiles({
    weapon: {
      type: "ranged",
      characteristics: {
        attacks: "D3+1",
        strength: 4,
        ap: 0,
        damage: "D3"
      }
    }
  }));

  assert.ok(Math.abs(result.totalProbability - 1) < 1e-12);
  assert.ok(result.outcomes.some((outcome) => outcome.damage >= 1));
});

test("lethal hits and sustained hits are represented in the distribution", () => {
  const result = getDamageOutcomeDistribution(profiles({
    weapon: {
      type: "ranged",
      characteristics: {
        attacks: 6,
        strength: 4,
        ap: 0,
        damage: 1,
        lethalHits: true,
        sustainedHits: 1
      }
    }
  }));

  assert.ok(Math.abs(result.totalProbability - 1) < 1e-12);
  assert.ok(result.outcomes.some((outcome) => outcome.damage >= 2));
});
