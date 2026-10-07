import { resolveAttackRoll, resolveWoundRoll } from "./combat-resolution.js";
import { resolveSaveRoll, resolveDamage } from "./save-damage-resolution.js";

export function resolveAttack({
  attacks,
  hitTarget,
  hitModifier = 0,
  sustainedHits = 0,
  lethalHits = false,
  strength,
  toughness,
  woundModifier = 0,
  devastatingWounds = false,
  save,
  invulnerableSave = null,
  cover = false,
  saveReroll = "none",
  saveRerollCount = null,
  ap = 0,
  saveModifier = 0,
  damage = 1,
  damagePrevention = 0,
  random
} = {}) {
  const attackResult = resolveAttackRoll({ attacks, hitTarget, hitModifier, sustainedHits, lethalHits, random });
  const woundResult = resolveWoundRoll({
    hits: attackResult.normalHitsForWounds,
    strength,
    toughness,
    woundModifier,
    devastatingWounds,
    random
  });
  const totalWounds = woundResult.wounds + attackResult.lethalHitWounds;
  const normalWounds = Math.max(0, totalWounds - woundResult.devastatingWoundCount);
  const saveResult = resolveSaveRoll({
    wounds: normalWounds,
    save,
    invulnerableSave,
    cover,
    saveReroll,
    saveRerollCount,
    ap,
    saveModifier,
    random
  });
  const damageResult = resolveDamage({
    failedSaves: saveResult.failedSaves,
    damage,
    damagePrevention,
    random
  });
  const devastatingDamageResult = resolveDamage({
    failedSaves: woundResult.devastatingWoundCount,
    damage,
    damagePrevention,
    random
  });
  const devastatingDamage = devastatingDamageResult.totalDamage;

  return Object.freeze({
    attacks: attackResult,
    wounds: Object.freeze({
      ...woundResult,
      totalWounds,
      automaticWounds: attackResult.lethalHitWounds,
      normalWounds,
      devastatingDamage
    }),
    saves: saveResult,
    damage: Object.freeze({
      ...damageResult,
      damageValues: [...damageResult.damageValues, ...devastatingDamageResult.damageValues],
      damageRolls: [...damageResult.damageRolls, ...devastatingDamageResult.damageRolls],
      preventedDamage: damageResult.preventedDamage + devastatingDamageResult.preventedDamage,
      totalRawDamage: damageResult.totalRawDamage + devastatingDamageResult.totalRawDamage,
      devastatingDamage,
      devastatingDamageResult,
      totalDamage: damageResult.totalDamage + devastatingDamage
    })
  });
}
