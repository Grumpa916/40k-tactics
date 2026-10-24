export function buildAttackProfile({ attacker, target, weapon } = {}) {
  if (!attacker || !(attacker.characteristics ?? attacker.profile?.characteristics)) throw new TypeError("An attacker unit profile is required.");
  if (!target || !(target.characteristics ?? target.profile?.characteristics)) throw new TypeError("A target unit profile is required.");
  if (!weapon || !weapon.characteristics) throw new TypeError("A weapon profile is required.");

  const attackerCharacteristics = attacker.characteristics ?? attacker.profile.characteristics;
  const targetCharacteristics = target.characteristics ?? target.profile.characteristics;
  const weaponCharacteristics = weapon.characteristics;

  const hitTargetKey = weapon.type === "melee" ? "weaponSkill" : "ballisticSkill";
  const weaponSkill = weaponCharacteristics.skill;
  const hitTarget = Number.isInteger(weaponSkill) ? weaponSkill : attackerCharacteristics[hitTargetKey];

  if (hitTarget === undefined && !weaponCharacteristics.torrent) {
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
    torrent: weaponCharacteristics.torrent === true,
    attacks: characteristics.attacks,
    hitTarget,
    hitTargetKey,
    hitModifier: characteristics.hitModifier ?? 0,
    range: Number.isFinite(weaponCharacteristics.range) ? weaponCharacteristics.range : null,
    strength: characteristics.strength,
    toughness: characteristics.toughness,
    woundModifier: characteristics.woundModifier ?? 0,
    save: characteristics.save,
    invulnerableSave: characteristics.invulnerableSave ?? null,
    cover: weaponCharacteristics.ignoresCover ? false : characteristics.cover ?? false,
    saveReroll: characteristics.saveReroll ?? "none",
    saveRerollCount: characteristics.saveRerollCount ?? null,
    ap: characteristics.ap ?? 0,
    damage: characteristics.damage,
    damagePrevention: characteristics.damagePrevention ?? 0,
    sustainedHits: characteristics.sustainedHits ?? 0,
    lethalHits: characteristics.lethalHits ?? false,
    devastatingWounds: characteristics.devastatingWounds ?? false,
    twinLinked: characteristics.twinLinked ?? false,
    blast: characteristics.blast ?? 0,
    rapidFire: characteristics.rapidFire ?? 0,
    melta: characteristics.melta ?? 0,
    anti: Array.isArray(characteristics.anti) ? characteristics.anti : [],
    precision: characteristics.precision ?? false,
    extraAttacks: characteristics.extraAttacks ?? false
  });
}
