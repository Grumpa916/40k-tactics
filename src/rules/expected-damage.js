import { buildAttackProfile } from "./combat-profile.js";

function expectedDice(expression) {
  if (Number.isInteger(expression) && expression >= 0) return expression;
  if (typeof expression !== "string") {
    throw new RangeError("Attacks must be a non-negative integer or supported dice expression.");
  }

  const match = /^(\d*)D([36])(?:\+(\d+))?$/.exec(expression);
  if (!match) throw new RangeError("Unsupported attack-count dice expression.");

  const count = Number(match[1] || 1);
  const sides = Number(match[2]);
  const modifier = Number(match[3] || 0);
  return count * ((sides + 1) / 2) + modifier;
}

function targetAfterModifier(target, modifier = 0) {
  const cappedModifier = Math.min(1, Math.max(-1, modifier));
  return Math.min(6, Math.max(2, target + cappedModifier));
}

function woundTarget(strength, toughness) {
  if (strength >= toughness * 2) return 2;
  if (strength > toughness) return 3;
  if (strength === toughness) return 4;
  if (strength * 2 <= toughness) return 6;
  return 5;
}

function successProbability(target) {
  return (7 - target) / 6;
}

function expectedDamageValue(damage) {
  if (Number.isInteger(damage) && damage >= 1) return damage;
  if (damage === "D3") return 2;
  if (damage === "D6") return 3.5;
  throw new RangeError("Damage must be a positive integer, D3, or D6.");
}

function saveFailureProbability(profile) {
  const armourTarget = Math.min(
    7,
    Math.max(
      2,
      profile.save + (-profile.ap) +
        Math.min(1, Math.max(-1, profile.saveModifier ?? 0)) +
        (profile.cover ? -1 : 0)
    )
  );

  const target = profile.invulnerableSave !== null &&
    profile.invulnerableSave < armourTarget
    ? profile.invulnerableSave
    : armourTarget;

  const failure = target > 6 ? 1 : (target - 1) / 6;
  const reroll = profile.saveReroll;

  if (profile.saveRerollCount !== null) return failure;
  if (reroll === "failed") return failure * failure;
  if (reroll === "ones") return Math.max(0, failure - (1 / 6) + (failure / 6));
  return failure;
}

function damagePreventionMultiplier(prevention) {
  if (prevention <= 0) return 1;
  return 1 - ((7 - prevention) / 6);
}

/**
 * Calculate a baseline expected damage value for one weapon profile against
 * one target profile.
 *
 * This is advisory infrastructure, not an exact battlefield prediction.
 * It uses the supplied profiles and known modifiers, but does not model
 * hidden cover, future abilities, positioning, or limited-count save rerolls.
 */
export function getExpectedDamage({ attacker, target, weapon } = {}) {
  const profile = buildAttackProfile({ attacker, target, weapon });
  const attacks = expectedDice(profile.attacks);

  const hitTarget = targetAfterModifier(profile.hitTarget, profile.hitModifier);
  const criticalHits = attacks / 6;
  const regularHits = attacks * successProbability(hitTarget);
  const sustainedHits = criticalHits * profile.sustainedHits;
  const lethalHitWounds = profile.lethalHits ? criticalHits : 0;
  const normalHits = Math.max(0, regularHits + sustainedHits - lethalHitWounds);

  const woundTargetValue = targetAfterModifier(
    woundTarget(profile.strength, profile.toughness),
    profile.woundModifier
  );
  const woundProbability = successProbability(woundTargetValue);
  const criticalWounds = normalHits / 6;
  const normalWoundsTotal = normalHits * woundProbability;
  const devastatingWounds = profile.devastatingWounds
    ? criticalWounds
    : 0;
  const normalWounds = Math.max(0, normalWoundsTotal - devastatingWounds);
  const lethalWounds = lethalHitWounds;

  const saveFailure = saveFailureProbability(profile);
  const unsavedNormalWounds = normalWounds * saveFailure;
  const damagePerUnsavedWound = expectedDamageValue(profile.damage);
  const preventionMultiplier = damagePreventionMultiplier(profile.damagePrevention);

  const expectedDamage =
    (unsavedNormalWounds + lethalWounds + devastatingWounds) *
    damagePerUnsavedWound *
    preventionMultiplier;

  return Object.freeze({
    expectedDamage,
    attacks,
    hitProbability: successProbability(hitTarget),
    woundProbability,
    saveFailureProbability: saveFailure,
    normalWounds,
    lethalWounds,
    devastatingWounds,
    damagePerUnsavedWound,
    damagePreventionMultiplier: preventionMultiplier
  });
}
