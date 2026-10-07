export function resolveAttackRoll({ attacks, hitTarget, random }) {
  if (!Number.isInteger(attacks) || attacks < 0) {
    throw new RangeError("Attacks must be a non-negative integer.");
  }
  if (!Number.isInteger(hitTarget) || hitTarget < 2 || hitTarget > 6) {
    throw new RangeError("Hit target must be an integer from 2 to 6.");
  }
  if (typeof random !== "function") {
    throw new TypeError("A random function is required.");
  }

  const rolls = Array.from({ length: attacks }, () => Math.floor(random() * 6) + 1);
  return Object.freeze({
    rolls,
    hitTarget,
    hits: rolls.filter((roll) => roll >= hitTarget).length
  });
}

export function resolveWoundRoll({ hits, strength, toughness, random }) {
  if (!Number.isInteger(hits) || hits < 0) {
    throw new RangeError("Hits must be a non-negative integer.");
  }
  if (!Number.isInteger(strength) || !Number.isInteger(toughness) || strength < 1 || toughness < 1) {
    throw new RangeError("Strength and toughness must be positive integers.");
  }
  if (typeof random !== "function") {
    throw new TypeError("A random function is required.");
  }

  const target = strength >= toughness * 2 ? 2 : strength > toughness ? 3 : strength === toughness ? 4 : strength * 2 <= toughness ? 6 : 5;
  const rolls = Array.from({ length: hits }, () => Math.floor(random() * 6) + 1);
  return Object.freeze({
    rolls,
    wounds: rolls.filter((roll) => roll >= target).length,
    target
  });
}
