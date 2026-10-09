import test from "node:test";
import assert from "node:assert/strict";
import { buildAttackProfile } from "../../src/rules/combat-profile.js";

test("buildAttackProfile reads characteristics from standard nested unit profiles", () => {
  const profile = buildAttackProfile({
    attacker: {
      profile: { characteristics: { ballisticSkill: 3 } }
    },
    target: {
      profile: { characteristics: { toughness: 4, save: 3 } }
    },
    weapon: {
      type: "ranged",
      characteristics: { attacks: 2, strength: 4, ap: 1, damage: 1 }
    }
  });

  assert.equal(profile.hitTarget, 3);
  assert.equal(profile.attacks, 2);
  assert.equal(profile.strength, 4);
  assert.equal(profile.toughness, 4);
  assert.equal(profile.save, 3);
  assert.equal(profile.damage, 1);
});

test("direct unit characteristics remain supported", () => {
  const profile = buildAttackProfile({
    attacker: { characteristics: { ballisticSkill: 3 } },
    target: { characteristics: { toughness: 4, save: 3 } },
    weapon: {
      type: "ranged",
      characteristics: { attacks: 1, strength: 4, ap: 0, damage: 1 }
    }
  });

  assert.equal(profile.hitTarget, 3);
  assert.equal(profile.attacks, 1);
});
