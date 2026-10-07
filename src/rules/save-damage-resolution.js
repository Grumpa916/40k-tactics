export function resolveSaveRoll({ wounds, save, ap = 0, random }) {
  if (!Number.isInteger(wounds) || wounds < 0) {
    throw new RangeError("Wounds must be a non-negative integer.");
  }
  if (!Number.isInteger(save) || save < 2 || save > 6) {
    throw new RangeError("Save must be an integer from 2 to 6.");
  }
  if (!Number.isInteger(ap)) {
    throw new RangeError("Armour penetration must be an integer.");
  }
  if (typeof random !== "function") {
    throw new TypeError("A random function is required.");
  }

  const target = Math.min(7, Math.max(2, save - ap));
  const rolls = Array.from({ length: wounds }, () => Math.floor(random() * 6) + 1);
  return Object.freeze({
    rolls,
    target,
    failedSaves: rolls.filter((roll) => roll < target).length
  });
}

export function resolveDamage({ failedSaves, damage = 1, random = Math.random }) {
  if (!Number.isInteger(failedSaves) || failedSaves < 0) {
    throw new RangeError("Failed saves must be a non-negative integer.");
  }
  if (!Number.isInteger(damage) || damage < 1) {
    throw new RangeError("Damage must be a positive integer.");
  }
  if (typeof random !== "function") {
    throw new TypeError("A random function is required.");
  }

  return Object.freeze({
    damagePerUnsavedWound: damage,
    totalDamage: failedSaves * damage
  });
}
