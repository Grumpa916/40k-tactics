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
  save,
  ap = 0,
  saveModifier = 0,
  damage = 1,
  random
} = {}) {
  const attackResult = resolveAttackRoll({ attacks, hitTarget, hitModifier, sustainedHits, lethalHits, random });
  const woundResult = resolveWoundRoll({
    hits: attackResult.normalHitsForWounds,
    strength,
    toughness,
    woundModifier,
    random
  });
  const saveResult = resolveSaveRoll({
    wounds: woundResult.wounds,
    save,
    ap,
    saveModifier,
    random
  });
  const damageResult = resolveDamage({
    failedSaves: saveResult.failedSaves,
    damage
  });

  return Object.freeze({
    attacks: attackResult,
    wounds: woundResult,
    saves: saveResult,
    damage: damageResult
  });
}
