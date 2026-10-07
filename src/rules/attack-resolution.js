import { resolveAttackRoll, resolveWoundRoll } from "./combat-resolution.js";
import { resolveSaveRoll, resolveDamage } from "./save-damage-resolution.js";

export function resolveAttack({
  attacks,
  strength,
  toughness,
  save,
  ap = 0,
  damage = 1,
  random
} = {}) {
  const attackResult = resolveAttackRoll({ attacks, random });
  const woundResult = resolveWoundRoll({
    hits: attackResult.hits,
    strength,
    toughness,
    random
  });
  const saveResult = resolveSaveRoll({
    wounds: woundResult.wounds,
    save,
    ap,
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
