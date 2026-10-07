import test from "node:test";
import assert from "node:assert/strict";
import { buildAttackProfile } from "../../src/rules/combat-profile.js";

test("builds an attack profile from unit and weapon characteristics", () => {
  const profile = buildAttackProfile({
    unit: { characteristics: { toughness: 4, save: 3 } },
    weapon: { characteristics: { attacks: 2, strength: 8, ap: 1, damage: 2 } }
  });
  assert.deepEqual(profile, { attacks: 2, strength: 8, toughness: 4, save: 3, ap: 1, damage: 2 });
});

test("defaults AP when the weapon has no AP characteristic", () => {
  const profile = buildAttackProfile({
    unit: { characteristics: { toughness: 4, save: 3 } },
    weapon: { characteristics: { attacks: 1, strength: 4, damage: 1 } }
  });
  assert.equal(profile.ap, 0);
});

test("rejects incomplete combat data", () => {
  assert.throws(
    () => buildAttackProfile({
      unit: { characteristics: { toughness: 4, save: 3 } },
      weapon: { characteristics: { attacks: 2, strength: 8 } }
    }),
    /missing characteristic: damage/
  );
});
