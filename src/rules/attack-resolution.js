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
    ap,
    saveModifier,
    random
  });
  const devastatingDamage = woundResult.devastatingWoundCount * damage;
  const damageResult = resolveDamage({
    failedSaves: saveResult.failedSaves,
    damage,
    damagePrevention,
    random
  });

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
      devastatingDamage,
      totalDamage: damageResult.totalDamage + devastatingDamage
    })
  });
}
