export function getWeaponCharacteristic(weapon, key) {
  if (!weapon || !weapon.characteristics) {
    throw new TypeError("A weapon profile is required.");
  }
  return weapon.characteristics[key];
}

export function isRangedWeapon(weapon) {
  return weapon?.type === "ranged";
}

export function isMeleeWeapon(weapon) {
  return weapon?.type === "melee";
}
