export function buildAttackProfile({ attacker, target, weapon } = {}) {
  if (!attacker || !attacker.characteristics) throw new TypeError("An attacker unit profile is required.");
  if (!target || !target.characteristics) throw new TypeError("A target unit profile is required.");
  if (!weapon || !weapon.characteristics) throw new TypeError("A weapon profile is required.");

  const attackerCharacteristics = attacker.characteristics;
  const targetCharacteristics = target.characteristics;
  const weaponCharacteristics = weapon.characteristics;

  const hitTargetKey = weapon.type === "melee" ? "weaponSkill" : "ballisticSkill";
  const hitTarget = attackerCharacteristics[hitTargetKey];

  if (hitTarget === undefined) {
    throw new Error("Attack profile is missing characteristic: " + hitTargetKey);
  }

  const characteristics = {
    ...targetCharacteristics,
    ...weaponCharacteristics
  };

  for (const key of ["attacks", "strength", "toughness", "save", "damage"]) {
    if (characteristics[key] === undefined) {
      throw new Error("Attack profile is missing characteristic: " + key);
    }
  }

  return Object.freeze({
    attacks: characteristics.attacks,
    hitTarget,
    hitTargetKey,
    hitModifier: characteristics.hitModifier ?? 0,
    strength: characteristics.strength,
    toughness: characteristics.toughness,
    woundModifier: characteristics.woundModifier ?? 0,
    save: characteristics.save,
    invulnerableSave: characteristics.invulnerableSave ?? null,
    cover: characteristics.cover ?? false,
    saveReroll: characteristics.saveReroll ?? "none",
    saveRerollCount: characteristics.saveRerollCount ?? null,
    ap: characteristics.ap ?? 0,
    damage: characteristics.damage,
    damagePrevention: characteristics.damagePrevention ?? 0,
    sustainedHits: characteristics.sustainedHits ?? 0,
    lethalHits: characteristics.lethalHits ?? false,
    devastatingWounds: characteristics.devastatingWounds ?? false
  });
}
