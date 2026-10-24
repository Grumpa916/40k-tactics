import { buildAttackProfile } from "./combat-profile.js";
import { getContextualWeaponProfile } from "./contextual-weapon-abilities.js";
import { getWoundBracketModifiers } from "./wound-bracket.js";

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
  const text = String(damage ?? '').trim().toUpperCase();
  if (/^\d+$/.test(text)) return Number(text);
  const match = text.match(/^D([36])(?:\+(\d+))?$/);
  if (!match) throw new RangeError("Damage must be a positive integer or supported D3/D6 expression.");
  const sides = Number(match[1]);
  const modifier = Number(match[2] || 0);
  return ((sides + 1) / 2) + modifier;
}

function saveFailureProbability(profile, saveModifier = 0) {
  const armourTarget = Math.min(
    7,
    Math.max(
      2,
      profile.save + (-profile.ap) +
        Math.min(1, Math.max(-1, saveModifier)) +
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

function woundProbabilities(profile, woundTargetValue) {
  const normalBase = successProbability(woundTargetValue);
  const criticalBase = successProbability(profile.criticalWoundTarget);
  const successBase = Math.max(normalBase, criticalBase);
  if (!profile.twinLinked) {
    return { success: successBase, critical: criticalBase };
  }
  const failedFirstRoll = 1 - successBase;
  return {
    success: successBase + (failedFirstRoll * successBase),
    critical: criticalBase + (failedFirstRoll * criticalBase)
  };
}

/**
 * Calculate a baseline expected damage value for one weapon profile against
 * one target profile.
 *
 * Contextual weapon abilities use known battle state only. Range-dependent
 * bonuses are deliberately withheld inside the established ±3" approximate
 * map uncertainty band, so tabletop measurement remains authoritative.
 */
export function getExpectedDamage({ attacker, target, weapon, attackerRemainingWounds = attacker?.wounds } = {}) {
  const baseProfile = buildAttackProfile({ attacker, target, weapon });
  const profile = getContextualWeaponProfile({ attacker, target, profile: baseProfile });
  const saveModifier = target?.characteristics?.saveModifier ?? target?.profile?.characteristics?.saveModifier ?? weapon?.characteristics?.saveModifier ?? 0;
  const woundBracket = getWoundBracketModifiers(attacker, { remainingWounds: attackerRemainingWounds });
  const attacks = expectedDice(profile.attacks);

  const hitTarget = targetAfterModifier(profile.hitTarget, profile.hitModifier + woundBracket.hitModifier);
  const criticalHits = profile.torrent ? 0 : attacks / 6;
  const regularHits = attacks * (profile.torrent ? 1 : successProbability(hitTarget));
  const sustainedHits = criticalHits * profile.sustainedHits;
  const lethalHitWounds = profile.lethalHits ? criticalHits : 0;
  const normalHits = Math.max(0, regularHits + sustainedHits - lethalHitWounds);

  const woundTargetValue = targetAfterModifier(
    woundTarget(profile.strength, profile.toughness),
    profile.woundModifier
  );
  const woundRoll = woundProbabilities(profile, woundTargetValue);
  const criticalWounds = normalHits * woundRoll.critical;
  const normalWoundsTotal = normalHits * woundRoll.success;
  const devastatingWounds = profile.devastatingWounds ? criticalWounds : 0;
  const normalWounds = Math.max(0, normalWoundsTotal - devastatingWounds);

  const saveFailure = saveFailureProbability(profile, saveModifier);
  const unsavedNormalWounds = normalWounds * saveFailure;
  const unsavedLethalWounds = lethalHitWounds * saveFailure;
  const damagePerUnsavedWound = expectedDamageValue(profile.damage);
  const preventionMultiplier = damagePreventionMultiplier(profile.damagePrevention);

  const expectedDamage =
    (unsavedNormalWounds + unsavedLethalWounds + devastatingWounds) *
    damagePerUnsavedWound *
    preventionMultiplier;

  return Object.freeze({
    expectedDamage,
    attacks,
    hitProbability: profile.torrent ? 1 : successProbability(hitTarget),
    woundProbability: woundRoll.success,
    criticalWoundProbability: woundRoll.critical,
    saveFailureProbability: saveFailure,
    normalWounds,
    lethalWounds: lethalHitWounds,
    devastatingWounds,
    damagePerUnsavedWound,
    damagePreventionMultiplier: preventionMultiplier,
    contextualAbilities: Object.freeze({
      blastBonus: profile.blastBonus,
      rapidFireBonus: profile.rapidFireBonus,
      meltaBonus: profile.meltaBonus,
      antiMatched: profile.antiMatched,
      criticalWoundTarget: profile.criticalWoundTarget,
      halfRangeStatus: profile.halfRangeStatus,
      approximateDistance: profile.approximateDistance,
      precision: profile.precision,
      extraAttacks: profile.extraAttacks
    })
  });
}
