import { applyTargetModifier, isCriticalHit } from "./combat-modifiers.js";

export function resolveSaveRoll({
  wounds,
  save,
  ap = 0,
  saveModifier = 0,
  random
}) {
  if (!Number.isInteger(wounds) || wounds < 0) throw new RangeError("Wounds must be a non-negative integer.");
  if (!Number.isInteger(save) || save < 2 || save > 6) throw new RangeError("Save must be an integer from 2 to 6.");
  if (!Number.isInteger(ap)) throw new RangeError("Armour penetration must be an integer.");
  if (!Number.isInteger(saveModifier)) throw new TypeError("Save modifier must be an integer.");
  if (typeof random !== "function") throw new TypeError("A random function is required.");

  const armourTarget = Math.min(7, Math.max(2, save - ap));
  const target = Math.min(7, Math.max(2, armourTarget + saveModifier));
  const rolls = Array.from({ length: wounds }, () => Math.floor(random() * 6) + 1);

  return Object.freeze({
    rolls,
    baseTarget: armourTarget,
    target,
    ap,
    saveModifier,
    criticalSaves: rolls.filter((roll) => isCriticalHit(roll)).length,
    failedSaves: rolls.filter((roll) => roll < target).length
  });
}

function resolveDamageValue(damage, random) {
  if (Number.isInteger(damage) && damage >= 1) return { value: damage, roll: null };
  if (damage === "D3") return { value: Math.floor(random() * 3) + 1, roll: Math.floor(random() * 3) + 1 };
  if (damage === "D6") return { value: Math.floor(random() * 6) + 1, roll: Math.floor(random() * 6) + 1 };
  throw new RangeError("Damage must be a positive integer, D3, or D6.");
}

export function resolveDamage({
  failedSaves,
  damage = 1,
  damagePrevention = 0,
  random = Math.random
}) {
  if (!Number.isInteger(failedSaves) || failedSaves < 0) throw new RangeError("Failed saves must be a non-negative integer.");
  if (!Number.isInteger(damagePrevention) || damagePrevention < 0 || damagePrevention > 6) {
    throw new RangeError("Damage prevention must be an integer from 0 to 6.");
  }
  if (typeof random !== "function") throw new TypeError("A random function is required.");

  const damageResults = Array.from({ length: failedSaves }, () => resolveDamageValue(damage, random));
  const damageValues = damageResults.map((entry) => entry.value);
  const totalRawDamage = damageValues.reduce((sum, value) => sum + value, 0);
  const totalPreventionRolls = totalRawDamage;
  const damageRolls = Array.from({ length: totalPreventionRolls }, () => {
    const roll = damagePrevention > 0 ? Math.floor(random() * 6) + 1 : null;
    return Object.freeze({ roll, prevented: roll !== null && roll >= damagePrevention });
  });
  const preventedDamage = damageRolls.filter((entry) => entry.prevented).length;
  const totalDamage = Math.max(0, totalRawDamage - preventedDamage);

  return Object.freeze({
    damagePerUnsavedWound: damage,
    damageValues,
    damagePrevention,
    damageRolls,
    preventedDamage,
    totalRawDamage,
    totalDamage
  });
}
