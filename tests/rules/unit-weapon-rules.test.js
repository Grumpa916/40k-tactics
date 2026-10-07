import test from "node:test";
import assert from "node:assert/strict";
import { createUnitProfile } from "../../src/rules/unit-profile.js";
import { createWeaponProfile } from "../../src/rules/weapon-profile.js";
import { getUnitWeapons, getUnitCharacteristic } from "../../src/rules/unit-rules.js";
import {
  getWeaponCharacteristic,
  isRangedWeapon,
  isMeleeWeapon
} from "../../src/rules/weapon-rules.js";

test("unit profiles resolve their weapons through the rules layer", () => {
  const weapon = createWeaponProfile({
    id: "w1",
    name: "Bolt Rifle",
    characteristics: { attacks: 2, strength: 4 }
  });
  const unit = createUnitProfile({
    id: "u1",
    name: "Intercessors",
    characteristics: { movement: 6 },
    weaponIds: ["w1"]
  });

  const weapons = getUnitWeapons(unit, new Map([["w1", weapon]]));

  assert.equal(weapons[0].name, "Bolt Rifle");
  assert.equal(getUnitCharacteristic(unit, "movement"), 6);
  assert.equal(getWeaponCharacteristic(weapon, "strength"), 4);
  assert.equal(isRangedWeapon(weapon), true);
  assert.equal(isMeleeWeapon(weapon), false);
});

test("weapon profiles distinguish ranged and melee weapons", () => {
  const melee = createWeaponProfile({
    id: "w2",
    name: "Chainsword",
    type: "melee",
    characteristics: { attacks: 5, strength: 4 }
  });

  assert.equal(isMeleeWeapon(melee), true);
  assert.equal(isRangedWeapon(melee), false);
});

test("unit weapon lookup rejects missing data", () => {
  const unit = createUnitProfile({
    id: "u1",
    name: "Test Unit",
    weaponIds: ["missing"]
  });

  assert.throws(
    () => getUnitWeapons(unit, new Map()),
    /Weapon not found/
  );
});
