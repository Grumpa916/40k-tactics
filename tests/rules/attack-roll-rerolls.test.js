import test from "node:test";
import assert from "node:assert/strict";
import { getRollSuccessProbabilities, strongestReroll } from "../../src/rules/attack-roll-probabilities.js";
import { getExpectedDamage } from "../../src/rules/expected-damage.js";
import { getDamageOutcomeDistribution } from "../../src/rules/damage-outcome-distribution.js";

function attacker(characteristics = {}) {
  return {
    characteristics: {
      weaponSkill: 3,
      ballisticSkill: 3,
      ...characteristics
    },
    wounds: 10,
    keywords: ["Infantry"]
  };
}

const target = Object.freeze({
  characteristics: { toughness: 8, save: 3, wounds: 20 },
  wounds: 20,
  keywords: ["Vehicle"]
});

function weapon(changes = {}) {
  return {
    id: "test-weapon",
    type: "melee",
    characteristics: {
      attacks: 6,
      skill: 3,
      strength: 8,
      ap: -2,
      damage: 2,
      ...changes
    }
  };
}

test("re-roll 1s increases both hit success and critical-hit probability without chaining rerolls", () => {
  const baseline = getRollSuccessProbabilities({ successTarget: 3, criticalTarget: 6 });
  const rerollOnes = getRollSuccessProbabilities({ successTarget: 3, criticalTarget: 6, reroll: "ones" });
  assert.ok(rerollOnes.success > baseline.success);
  assert.ok(rerollOnes.critical > baseline.critical);
  assert.ok(Math.abs(rerollOnes.success - 7 / 9) < 1e-12);
  assert.ok(Math.abs(rerollOnes.critical - 7 / 36) < 1e-12);
  assert.ok(Math.abs(rerollOnes.rerolledProbability - 1 / 6) < 1e-12);
});

test("failed-roll rerolls use only the original failures and dominate reroll-1s semantics", () => {
  const rerollFailed = getRollSuccessProbabilities({ successTarget: 4, criticalTarget: 6, reroll: "failed" });
  assert.ok(Math.abs(rerollFailed.success - 0.75) < 1e-12);
  assert.equal(strongestReroll("ones", "failed"), "failed");
  assert.equal(strongestReroll("ones", "none"), "ones");
});

test("hit and wound re-roll 1s increase expected damage and are reported by the engine", () => {
  const base = getExpectedDamage({ attacker: attacker(), target, weapon: weapon() });
  const improved = getExpectedDamage({
    attacker: attacker({ hitReroll: "ones", woundReroll: "ones" }),
    target,
    weapon: weapon()
  });
  assert.ok(improved.expectedDamage > base.expectedDamage);
  assert.equal(improved.hitReroll, "ones");
  assert.equal(improved.woundReroll, "ones");
});

test("Twin-linked failed-wound reroll is not double-stacked with a wound reroll of 1", () => {
  const twinOnly = getExpectedDamage({ attacker: attacker(), target, weapon: weapon({ twinLinked: true }) });
  const twinPlusOnes = getExpectedDamage({
    attacker: attacker({ woundReroll: "ones" }),
    target,
    weapon: weapon({ twinLinked: true })
  });
  assert.equal(twinPlusOnes.woundReroll, "failed");
  assert.ok(Math.abs(twinPlusOnes.expectedDamage - twinOnly.expectedDamage) < 1e-12);
});

test("damage distribution and expected-damage paths agree after hit and wound rerolls", () => {
  const source = attacker({ hitReroll: "ones", woundReroll: "ones" });
  const expected = getExpectedDamage({ attacker: source, target, weapon: weapon() });
  const distribution = getDamageOutcomeDistribution({ attacker: source, target, weapon: weapon() });
  assert.ok(Math.abs(distribution.expectedDamage - expected.expectedDamage) < 1e-10);
  assert.ok(Math.abs(distribution.totalProbability - 1) < 1e-10);
  assert.equal(distribution.contextualAbilities.hitReroll, "ones");
  assert.equal(distribution.contextualAbilities.woundReroll, "ones");
});

test("unit and weapon re-roll instructions never suppress a stronger option at either stage", () => {
  const unit = attacker({ hitReroll: "failed", woundReroll: "ones" });
  const selectedWeapon = weapon({ hitReroll: "ones", woundReroll: "failed" });
  const mean = getExpectedDamage({ attacker: unit, target, weapon: selectedWeapon });
  const distribution = getDamageOutcomeDistribution({ attacker: unit, target, weapon: selectedWeapon });
  const fullReroll = getExpectedDamage({
    attacker: attacker(), target,
    weapon: weapon({ hitReroll: "failed", woundReroll: "failed" })
  });

  assert.equal(mean.hitReroll, "failed");
  assert.equal(mean.woundReroll, "failed");
  assert.equal(distribution.contextualAbilities.hitReroll, "failed");
  assert.equal(distribution.contextualAbilities.woundReroll, "failed");
  assert.ok(Math.abs(mean.expectedDamage - fullReroll.expectedDamage) < 1e-10);
  assert.ok(Math.abs(distribution.expectedDamage - mean.expectedDamage) < 1e-10);
  assert.ok(Math.abs(distribution.totalProbability - 1) < 1e-10);
});

test("explicit no-reroll weapons cannot hide unit re-rolls, and stages stay independent", () => {
  const unit = attacker({ hitReroll: "ones", woundReroll: "failed" });
  const result = getExpectedDamage({
    attacker: unit, target,
    weapon: weapon({ hitReroll: "none", woundReroll: "none" })
  });
  assert.equal(result.hitReroll, "ones");
  assert.equal(result.woundReroll, "failed");
  const opposite = getExpectedDamage({
    attacker: attacker({ hitReroll: "failed", woundReroll: "none" }), target,
    weapon: weapon({ hitReroll: "ones", woundReroll: "ones" })
  });
  assert.equal(opposite.hitReroll, "failed");
  assert.equal(opposite.woundReroll, "ones");
});

test("recorded detachment rerolls combine with stronger weapon and unit rerolls without chaining", () => {
  const source = {
    ...attacker({ hitReroll: "ones", woundReroll: "failed" }),
    combatRules: { effects: ["tyranid-surprise-assault"] }
  };
  const selectedWeapon = weapon({ hitReroll: "failed", woundReroll: "none" });
  const mean = getExpectedDamage({ attacker: source, target, weapon: selectedWeapon });
  const distribution = getDamageOutcomeDistribution({ attacker: source, target, weapon: selectedWeapon });
  assert.equal(mean.hitReroll, "failed");
  assert.equal(mean.woundReroll, "failed");
  assert.equal(distribution.contextualAbilities.hitReroll, "failed");
  assert.equal(distribution.contextualAbilities.woundReroll, "failed");
  assert.ok(mean.contextualAbilities.appliedRules.some(rule => rule.startsWith("Subterranean Assault")));
  assert.ok(Math.abs(mean.expectedDamage - distribution.expectedDamage) < 1e-10);
});
