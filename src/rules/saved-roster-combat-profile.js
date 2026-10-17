import { getBattleUnitDatasheet } from "./battle-unit-reference.js";

export function parseCombatCharacteristic(value) {
  if (Number.isFinite(value)) return Number(value);
  const match = String(value ?? "").trim().match(/^(\d+(?:\.\d+)?)\s*(?:[+"″]|in)?$/i);
  return match ? Number(match[1]) : null;
}

function weaponAbilityCharacteristics(abilities) {
  const text = String(abilities ?? "");
  const sustained = text.match(/Sustained Hits\s+(\d+)/i);
  return {
    ...(sustained ? { sustainedHits: Number(sustained[1]) } : {}),
    ...(/\bLethal Hits\b/i.test(text) ? { lethalHits: true } : {}),
    ...(/\bDevastating Wounds\b/i.test(text) ? { devastatingWounds: true } : {})
  };
}

export function getDatasheetWeaponOptions(state, unit, { type = null } = {}) {
  const weapons = getBattleUnitDatasheet(state, unit)?.weapons;
  if (!Array.isArray(weapons)) return [];

  return weapons.flatMap((weapon, index) => {
    const rawRange = weapon?.range ?? weapon?.characteristics?.range;
    const isMelee = String(rawRange ?? "").trim().toLowerCase() === "melee";
    const weaponType = isMelee ? "melee" : "ranged";
    if (type && weaponType !== type) return [];

    const range = isMelee ? null : parseCombatCharacteristic(rawRange);
    if (!isMelee && range == null) return [];

    const skill = parseCombatCharacteristic(weapon?.skill ?? weapon?.characteristics?.skill);
    const name = weapon?.name ?? `${weaponType === "melee" ? "Melee" : "Ranged"} weapon ${index + 1}`;
    return [{
      id: `datasheet:${unit.id}:${index}`,
      name,
      type: weaponType,
      characteristics: {
        ...(range == null ? {} : { range }),
        attacks: weapon?.attacks ?? weapon?.characteristics?.attacks,
        strength: weapon?.strength ?? weapon?.characteristics?.strength,
        ap: weapon?.ap ?? weapon?.characteristics?.ap ?? 0,
        damage: weapon?.damage ?? weapon?.characteristics?.damage,
        ...(skill == null ? {} : { skill }),
        ...weaponAbilityCharacteristics(weapon?.abilities ?? weapon?.characteristics?.abilities)
      }
    }];
  });
}

function firstCombatValue(unit, datasheet, liveKey, datasheetKeys) {
  const live = unit?.characteristics?.[liveKey] ?? unit?.profile?.characteristics?.[liveKey];
  if (live !== undefined && live !== null) return live;
  for (const key of datasheetKeys) {
    const value = datasheet?.characteristics?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

export function getProbabilisticUnitProfile(state, unit) {
  if (!unit) return null;
  const datasheet = getBattleUnitDatasheet(state, unit);
  const toughness = parseCombatCharacteristic(firstCombatValue(unit, datasheet, "toughness", ["Toughness", "toughness"]));
  const save = parseCombatCharacteristic(firstCombatValue(unit, datasheet, "save", ["Save", "save"]));
  const invulnerableSave = parseCombatCharacteristic(firstCombatValue(unit, datasheet, "invulnerableSave", ["Invulnerable save", "Invulnerable Save", "invulnerableSave"]));
  const ballisticSkill = parseCombatCharacteristic(firstCombatValue(unit, datasheet, "ballisticSkill", ["Ballistic Skill", "ballisticSkill"]));
  const weaponSkill = parseCombatCharacteristic(firstCombatValue(unit, datasheet, "weaponSkill", ["Weapon Skill", "weaponSkill"]));
  const startingWounds = parseCombatCharacteristic(firstCombatValue(unit, datasheet, "wounds", ["Wounds", "wounds"]));

  return {
    ...unit,
    wounds: Number.isFinite(unit?.wounds) ? unit.wounds : startingWounds,
    characteristics: {
      ...(unit?.profile?.characteristics ?? {}),
      ...(unit?.characteristics ?? {}),
      ...(toughness == null ? {} : { toughness }),
      ...(save == null ? {} : { save }),
      ...(invulnerableSave == null ? {} : { invulnerableSave }),
      ...(ballisticSkill == null ? {} : { ballisticSkill }),
      ...(weaponSkill == null ? {} : { weaponSkill })
    }
  };
}
