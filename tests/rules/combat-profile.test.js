import test from "node:test";
import assert from "node:assert/strict";
import { buildAttackProfile } from "../../src/rules/combat-profile.js";

const target = { characteristics: { toughness: 4, save: 3 } };

test("builds a ranged attack profile from attacker, target, and weapon data", () => {
  const profile = buildAttackProfile({
    attacker: { characteristics: { ballisticSkill: 3 } },
    target,
    weapon: {
      type: "ranged",
      characteristics: { attacks: 2, strength: 8, ap: 1, damage: 2 }
    }
  });

  assert.deepEqual(profile, {
    attacks: 2,
    hitTarget: 3,
    hitTargetKey: "ballisticSkill",
    strength: 8,
    toughness: 4,
    save: 3,
    ap: 1,
    damage: 2,
    sustainedHits: 0,
    lethalHits: false
  });
});

test("melee attacks use Weapon Skill", () => {
  const profile = buildAttackProfile({
    attacker: { characteristics: { weaponSkill: 4 } },
    target,
    weapon: {
      type: "melee",
      characteristics: { attacks: 4, strength: 5, damage: 1 }
    }
  });

  assert.equal(profile.hitTarget, 4);
  assert.equal(profile.hitTargetKey, "weaponSkill");
});

test("defaults AP when the weapon has no AP characteristic", () => {
  const profile = buildAttackProfile({
    attacker: { characteristics: { ballisticSkill: 4 } },
    target,
    weapon: {
      type: "ranged",
      characteristics: { attacks: 1, strength: 4, damage: 1 }
    }
  });
  assert.equal(profile.ap, 0);
});

test("requires the skill appropriate to the weapon type", () => {
  assert.throws(
    () => buildAttackProfile({
      attacker: { characteristics: { weaponSkill: 4 } },
      target,
      weapon: {
        type: "ranged",
        characteristics: { attacks: 1, strength: 4, damage: 1 }
      }
    }),
    /ballisticSkill/
  );
});

test("rejects incomplete combat data", () => {
  assert.throws(
    () => buildAttackProfile({
      attacker: { characteristics: { ballisticSkill: 4 } },
      target,
      weapon: {
        type: "ranged",
        characteristics: { attacks: 2, strength: 8 }
      }
    }),
    /missing characteristic: damage/
  );
});
