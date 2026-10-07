import { applyRollModifier, isCriticalHit } from "./combat-modifiers.js";

export function resolveSaveRoll({
  wounds,
  save,
  ap = 0,
  saveModifier = 0,
  cover = false,
  invulnerableSave = null,
  saveReroll = "none",
  saveRerollCount = null,
  random
}) {
  if (!Number.isInteger(wounds) || wounds < 0) throw new RangeError("Wounds must be a non-negative integer.");
  if (!Number.isInteger(save) || save < 2 || save > 6) throw new RangeError("Save must be an integer from 2 to 6.");
  if (!Number.isInteger(ap)) throw new RangeError("Armour penetration must be an integer.");
  if (!Number.isInteger(saveModifier)) throw new TypeError("Save modifier must be an integer.");
  if (typeof cover !== "boolean") throw new TypeError("Cover must be a boolean.");
  if (!["none", "ones", "failed"].includes(saveReroll)) throw new RangeError("Save reroll must be none, ones, or failed.");
  if (saveRerollCount !== null && (!Number.isInteger(saveRerollCount) || saveRerollCount < 1)) throw new RangeError("Save reroll count must be null or a positive integer.");
  if (invulnerableSave !== null && (!Number.isInteger(invulnerableSave) || invulnerableSave < 2 || invulnerableSave > 6)) {
    throw new RangeError("Invulnerable save must be null or an integer from 2 to 6.");
  }
  if (typeof random !== "function") throw new TypeError("A random function is required.");

  const armourBaseTarget = Math.min(7, Math.max(2, save));
  const apModifier = -ap;
  const postApArmourTarget = Math.min(7, Math.max(2, armourBaseTarget + apModifier));
  const appliedSaveModifier = Math.min(1, Math.max(-1, saveModifier));
  const coverModifier = cover ? -1 : 0;
  const modifiedArmourTarget = Math.min(7, Math.max(2, postApArmourTarget + appliedSaveModifier + coverModifier));
  const invulnerableTarget = invulnerableSave;
  const usesInvulnerableSave = invulnerableTarget !== null && invulnerableTarget < modifiedArmourTarget;
  const target = usesInvulnerableSave ? invulnerableTarget : modifiedArmourTarget;
  const saveType = usesInvulnerableSave ? "invulnerable" : "armour";
  const initialRolls = Array.from({ length: wounds }, () => Math.floor(random() * 6) + 1);
  const eligibleIndexes = initialRolls.reduce((indexes, roll, index) => {
    const eligible = saveReroll === "ones" ? roll === 1 : saveReroll === "failed" ? roll < target : false;
    if (eligible) indexes.push(index);
    return indexes;
  }, []);
  const rerollIndexes = saveRerollCount === null ? eligibleIndexes : eligibleIndexes.slice(0, saveRerollCount);
  const rerolledIndexes = new Set(rerollIndexes);
  const rolls = initialRolls.map((roll, index) => rerolledIndexes.has(index) ? Math.floor(random() * 6) + 1 : roll);

  return Object.freeze({
    rolls,
    initialRolls,
    reroll: Object.freeze({ type: saveReroll, requestedCount: saveRerollCount, eligibleCount: eligibleIndexes.length, rerolledCount: rerollIndexes.length }),
    baseTarget: postApArmourTarget,
    armourBaseTarget,
    apModifier,
    postApArmourTarget,
    saveModifier,
    appliedSaveModifier,
    coverModifier,
    modifiedArmourTarget,
    invulnerableTarget,
    target,
    saveType,
    ap,
    cover,
    criticalSaves: rolls.filter((roll) => isCriticalHit(roll)).length,
    failedSaves: rolls.filter((roll) => roll < target).length
  });
}

function resolveDamageValue(damage, random) {
  if (Number.isInteger(damage) && damage >= 1) return { value: damage, roll: null };
  if (damage === "D3") {
    const roll = Math.floor(random() * 3) + 1;
    return { value: roll, roll };
  }
  if (damage === "D6") {
    const roll = Math.floor(random() * 6) + 1;
    return { value: roll, roll };
  }
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
