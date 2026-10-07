export function getUnitWeapons(unit, weaponMap) {
  if (!unit || !Array.isArray(unit.weaponIds)) {
    throw new TypeError("A unit profile with weapon ids is required.");
  }
  if (!(weaponMap instanceof Map)) {
    throw new TypeError("Weapon data must be a Map.");
  }

  return unit.weaponIds.map((weaponId) => {
    const weapon = weaponMap.get(weaponId);
    if (!weapon) {
      throw new Error("Weapon not found: " + weaponId);
    }
    return weapon;
  });
}

export function getUnitCharacteristic(unit, key) {
  if (!unit || !unit.characteristics) {
    throw new TypeError("A unit profile is required.");
  }
  return unit.characteristics[key];
}
