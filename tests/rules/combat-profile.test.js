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
    hitModifier: 0,
    strength: 8,
    toughness: 4,
    woundModifier: 0,
    save: 3,
    invulnerableSave: null,
    cover: false,
    saveReroll: "none",
    saveRerollCount: null,
    ap: 1,
    damage: 2,
    damagePrevention: 0,
    sustainedHits: 0,
    lethalHits: false,
    devastatingWounds: false
  });
});

test("preserves variable attack characteristics from weapon data", () => {
  const profile = buildAttackProfile({
    attacker: { characteristics: { ballisticSkill: 4 } },
    target,
    weapon: {
      type: "ranged",
      characteristics: { attacks: "D6+1", strength: 4, damage: 1 }
    }
  });
  assert.equal(profile.attacks, "D6+1");
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


test("exposes save reroll settings from target characteristics", () => {
  const profile = buildAttackProfile({
    attacker: { characteristics: { ballisticSkill: 4 } },
    target: { characteristics: { toughness: 4, save: 4, saveReroll: "failed", saveRerollCount: 1 } },
    weapon: { type: "ranged", characteristics: { attacks: 1, strength: 4, damage: 1 } }
  });
  assert.equal(profile.saveReroll, "failed");
  assert.equal(profile.saveRerollCount, 1);
});


test("exposes hit and wound modifiers from combat characteristics", () => {
  const profile = buildAttackProfile({
    attacker: { characteristics: { ballisticSkill: 4 } },
    target: { characteristics: { toughness: 4, save: 4, hitModifier: 1, woundModifier: -1 } },
    weapon: { type: "ranged", characteristics: { attacks: 1, strength: 4, damage: 1 } }
  });
  assert.equal(profile.hitModifier, 1);
  assert.equal(profile.woundModifier, -1);
});
