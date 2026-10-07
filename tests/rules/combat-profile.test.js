import test from "node:test";
import assert from "node:assert/strict";
import { buildAttackProfile } from "../../src/rules/combat-profile.js";

test("builds an attack profile from unit and weapon characteristics", () => {
  const profile = buildAttackProfile({
    unit: {
      characteristics: { toughness: 4, save: 3 }
    },
    weapon: {
      characteristics: {
        attacks: 2, strength: 8, ap: 1, damage: 2
      }
    }
  });

  assert.deepEqual(profile, {
    attacks: 2, strength: 8, toughness: 4, save: 3, ap: 1, damage: 2
  });
});

test("rejects incomplete combat data", () => {
  assert.throws(
    () => buildAttackProfile({
      unit: { characteristics: { toughness: 4, save: 3 } },
      weapon: { characteristics: { attacks: 2, strength: 8, damage: 2 } }
    }),
    /missing characteristic: ap/
  );
});
