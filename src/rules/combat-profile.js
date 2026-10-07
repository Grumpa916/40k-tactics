export function buildAttackProfile({ unit, weapon } = {}) {
  if (!unit || !unit.characteristics) throw new TypeError("A unit profile is required.");
  if (!weapon || !weapon.characteristics) throw new TypeError("A weapon profile is required.");

  const characteristics = {
    ...unit.characteristics,
    ...weapon.characteristics
  };

  for (const key of ["attacks", "strength", "toughness", "save", "damage"]) {
    if (characteristics[key] === undefined) {
      throw new Error("Attack profile is missing characteristic: " + key);
    }
  }

  return Object.freeze({
    attacks: characteristics.attacks,
    strength: characteristics.strength,
    toughness: characteristics.toughness,
    save: characteristics.save,
    ap: characteristics.ap ?? 0,
    damage: characteristics.damage
  });
}
