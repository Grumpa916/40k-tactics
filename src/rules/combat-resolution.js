import { applyTargetModifier, isCriticalHit } from "./combat-modifiers.js";

function validateExtraHits(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(name + " must be a non-negative integer.");
  }
}

export function resolveAttackRoll({
  attacks,
  hitTarget,
  hitModifier = 0,
  sustainedHits = 0,
  lethalHits = false,
  random
}) {
  if (!Number.isInteger(attacks) || attacks < 0) throw new RangeError("Attacks must be a non-negative integer.");
  if (!Number.isInteger(hitTarget) || hitTarget < 2 || hitTarget > 6) throw new RangeError("Hit target must be an integer from 2 to 6.");
  if (!Number.isInteger(hitModifier)) throw new TypeError("Hit modifier must be an integer.");
  validateExtraHits(sustainedHits, "Sustained hits");
  if (typeof lethalHits !== "boolean") throw new TypeError("Lethal hits must be boolean.");
  if (typeof random !== "function") throw new TypeError("A random function is required.");

  const baseTarget = hitTarget;
  const modifiedTarget = applyTargetModifier(baseTarget, hitModifier);
  const rolls = Array.from({ length: attacks }, () => Math.floor(random() * 6) + 1);
  const criticalHits = rolls.filter((roll) => isCriticalHit(roll)).length;
  const regularHits = rolls.filter((roll) => roll >= modifiedTarget).length;
  const sustainedHitCount = criticalHits * sustainedHits;
  const hits = regularHits + sustainedHitCount;
  const lethalHitWounds = lethalHits ? criticalHits : 0;
  const normalHitsForWounds = Math.max(0, hits - lethalHitWounds);

  return Object.freeze({
    rolls,
    hitTarget,
    baseTarget,
    hitModifier,
    modifiedTarget,
    sustainedHits,
    lethalHits,
    criticalHits,
    sustainedHitCount,
    regularHits,
    hits,
    lethalHitWounds,
    normalHitsForWounds
  });
}

export function resolveWoundRoll({
  hits,
  strength,
  toughness,
  woundModifier = 0,
  devastatingWounds = false,
  random
}) {
  if (!Number.isInteger(hits) || hits < 0) throw new RangeError("Hits must be a non-negative integer.");
  if (!Number.isInteger(woundModifier)) throw new TypeError("Wound modifier must be an integer.");
  if (!Number.isInteger(strength) || !Number.isInteger(toughness) || strength < 1 || toughness < 1) {
    throw new RangeError("Strength and toughness must be positive integers.");
  }
  if (typeof devastatingWounds !== "boolean") throw new TypeError("Devastating wounds must be boolean.");
  if (typeof random !== "function") throw new TypeError("A random function is required.");

  const baseTarget = strength >= toughness * 2 ? 2 : strength > toughness ? 3 : strength === toughness ? 4 : strength * 2 <= toughness ? 6 : 5;
  const target = applyTargetModifier(baseTarget, woundModifier);
  const rolls = Array.from({ length: hits }, () => Math.floor(random() * 6) + 1);
  const criticalWounds = rolls.filter((roll) => isCriticalHit(roll)).length;
  const wounds = rolls.filter((roll) => roll >= target).length;
  const devastatingWoundCount = devastatingWounds ? criticalWounds : 0;
  const normalWounds = Math.max(0, wounds - devastatingWoundCount);

  return Object.freeze({
    rolls,
    baseTarget,
    target,
    woundModifier,
    devastatingWounds,
    criticalWounds,
    wounds,
    devastatingWoundCount,
    normalWounds
  });
}
