export function normalizeModifier(value = 0) {
  if (!Number.isInteger(value)) throw new TypeError("Combat modifiers must be integers.");
  return value;
}

export function applyTargetModifier(target, modifier = 0, { minimum = 2, maximum = 6 } = {}) {
  normalizeModifier(modifier);
  if (!Number.isInteger(target)) throw new TypeError("A target value must be an integer.");
  if (target < minimum || target > maximum) throw new RangeError("Target must be within the allowed range.");
  return Math.min(maximum, Math.max(minimum, target + modifier));
}

export function isCriticalHit(roll) {
  if (!Number.isInteger(roll)) throw new TypeError("A roll must be an integer.");
  return roll === 6;
}
