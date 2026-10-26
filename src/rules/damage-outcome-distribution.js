import { buildAttackProfile } from "./combat-profile.js";
import { getContextualWeaponProfile } from "./contextual-weapon-abilities.js";
import { getWoundBracketModifiers } from "./wound-bracket.js";
import { getRollSuccessProbabilities, strongestReroll } from "./attack-roll-probabilities.js";

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

function damageValues(damage) {
  if (Number.isInteger(damage) && damage >= 1) return [[damage, 1]];
  const text = String(damage ?? '').trim().toUpperCase();
  if (/^\d+$/.test(text)) return [[Number(text), 1]];
  const match = text.match(/^D([36])(?:\+(\d+))?$/);
  if (!match) throw new RangeError("Damage must be a positive integer or supported D3/D6 expression.");
  const sides = Number(match[1]);
  const modifier = Number(match[2] || 0);
  return Array.from({ length: sides }, (_, index) => [index + 1 + modifier, 1 / sides]);
}

function attackCountValues(attacks) {
  if (Number.isInteger(attacks) && attacks >= 0) return [[attacks, 1]];
  if (typeof attacks !== "string") {
    throw new RangeError("Attacks must be a non-negative integer or supported dice expression.");
  }
  const match = /^(\d*)D([36])(?:\+(\d+))?$/.exec(attacks);
  if (!match) throw new RangeError("Unsupported attack-count dice expression.");
  const count = Number(match[1] || 1);
  const sides = Number(match[2]);
  const modifier = Number(match[3] || 0);
  let distribution = new Map([[modifier, 1]]);
  const die = new Map(Array.from({ length: sides }, (_, index) => [index + 1, 1 / sides]));
  for (let i = 0; i < count; i++) distribution = convolve(distribution, die);
  return [...distribution];
}

function addProbability(map, value, probability) {
  map.set(value, (map.get(value) ?? 0) + probability);
}

function convolve(left, right) {
  const result = new Map();
  for (const [a, pa] of left) {
    for (const [b, pb] of right) addProbability(result, a + b, pa * pb);
  }
  return result;
}

function singleSaveFailureProbability(profile, saveModifier = 0) {
  const armourTarget = Math.min(
    7,
    Math.max(
      2,
      profile.save + (-profile.ap) +
        Math.min(1, Math.max(-1, saveModifier)) +
        (profile.cover ? -1 : 0)
    )
  );
  const target = profile.invulnerableSave !== null && profile.invulnerableSave < armourTarget
    ? profile.invulnerableSave
    : armourTarget;
  if (target > 6) return 1;
  const failure = (target - 1) / 6;
  if (profile.saveRerollCount !== null) return failure;
  if (profile.saveReroll === "failed") return failure * failure;
  if (profile.saveReroll === "ones") return Math.max(0, failure - (1 / 6) + (failure / 6));
  return failure;
}

function oneSavedWoundDamageDistribution(profile, saveFailure) {
  const result = new Map();
  addProbability(result, 0, 1 - saveFailure);
  for (const [damage, probability] of damageValues(profile.damage)) {
    addProbability(result, damage, saveFailure * probability);
  }
  return result;
}

function woundProbabilities(profile, woundTargetValue) {
  return getRollSuccessProbabilities({
    successTarget: woundTargetValue,
    criticalTarget: profile.criticalWoundTarget,
    reroll: strongestReroll(profile.woundReroll, profile.twinLinked ? "failed" : "none")
  });
}

function oneNormalHitDamageDistribution(profile, woundTargetValue, saveFailure) {
  const result = new Map();
  const woundRoll = woundProbabilities(profile, woundTargetValue);
  const critical = profile.devastatingWounds ? woundRoll.critical : 0;
  const normalWoundProbability = Math.max(0, woundRoll.success - critical);
  addProbability(result, 0, 1 - (normalWoundProbability * saveFailure + critical));
  for (const [damage, probability] of damageValues(profile.damage)) {
    addProbability(result, damage, normalWoundProbability * saveFailure * probability);
    addProbability(result, damage, critical * probability);
  }
  return result;
}

function oneAttackDistribution(profile, woundTargetValue, saveFailure) {
  if (profile.torrent) return oneNormalHitDamageDistribution(profile, woundTargetValue, saveFailure);
  const result = new Map();
  const hitTarget = targetAfterModifier(profile.hitTarget, profile.hitModifier);
  const hitRoll = getRollSuccessProbabilities({
    successTarget: hitTarget,
    criticalTarget: 6,
    reroll: profile.hitReroll
  });
  const critical = hitRoll.critical;
  const nonCriticalHit = hitRoll.nonCritical;
  const miss = hitRoll.failure;
  const normalHit = oneNormalHitDamageDistribution(profile, woundTargetValue, saveFailure);
  const lethalHit = oneSavedWoundDamageDistribution(profile, saveFailure);

  addProbability(result, 0, miss);
  for (const [damage, probability] of normalHit) {
    addProbability(result, damage, nonCriticalHit * probability);
  }

  const criticalBase = profile.lethalHits ? lethalHit : normalHit;
  for (const [damage, probability] of criticalBase) {
    addProbability(result, damage, critical * probability);
  }

  if (profile.sustainedHits > 0) {
    const sustainedCount = profile.sustainedHits;
    let sustainedDistribution = new Map([[0, 1]]);
    for (let index = 0; index < sustainedCount; index += 1) {
      sustainedDistribution = convolve(sustainedDistribution, normalHit);
    }

    result.clear();
    addProbability(result, 0, miss);
    for (const [damage, probability] of normalHit) {
      addProbability(result, damage, nonCriticalHit * probability);
    }
    for (const [baseDamage, baseProbability] of criticalBase) {
      for (const [extraDamage, extraProbability] of sustainedDistribution) {
        addProbability(result, baseDamage + extraDamage, critical * baseProbability * extraProbability);
      }
    }
  }

  return result;
}

/**
 * Return the baseline probability distribution of damage outcomes for one
 * attack profile. Contextual abilities use known target model count, keywords
 * and conservative approximate half-range context from the live map.
 */
export function getDamageOutcomeDistribution({ attacker, target, weapon, attackerRemainingWounds = attacker?.wounds } = {}) {
  const baseProfile = buildAttackProfile({ attacker, target, weapon });
  const profile = getContextualWeaponProfile({ attacker, target, profile: baseProfile });
  const saveModifier = target?.characteristics?.saveModifier ?? weapon?.characteristics?.saveModifier ?? 0;
  const woundBracket = getWoundBracketModifiers(attacker, { remainingWounds: attackerRemainingWounds });
  const woundTargetValue = targetAfterModifier(
    woundTarget(profile.strength, profile.toughness),
    profile.woundModifier
  );
  const saveFailure = singleSaveFailureProbability(profile, saveModifier);
  const hitModifier = profile.hitModifier + woundBracket.hitModifier;
  const outcomes = new Map();

  for (const [attackCount, attackCountProbability] of attackCountValues(profile.attacks)) {
    let distribution = new Map([[0, 1]]);
    const perAttack = oneAttackDistribution({ ...profile, hitModifier }, woundTargetValue, saveFailure);
    for (let index = 0; index < attackCount; index += 1) {
      distribution = convolve(distribution, perAttack);
    }
    for (const [damage, probability] of distribution) {
      addProbability(outcomes, damage, attackCountProbability * probability);
    }
  }

  const entries = [...outcomes.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([damage, probability]) => Object.freeze({ damage, probability }));

  return Object.freeze({
    outcomes: Object.freeze(entries),
    expectedDamage: entries.reduce((sum, outcome) => sum + outcome.damage * outcome.probability, 0),
    totalProbability: entries.reduce((sum, outcome) => sum + outcome.probability, 0),
    contextualAbilities: Object.freeze({
      blastBonus: profile.blastBonus,
      rapidFireBonus: profile.rapidFireBonus,
      meltaBonus: profile.meltaBonus,
      antiMatched: profile.antiMatched,
      criticalWoundTarget: profile.criticalWoundTarget,
      halfRangeStatus: profile.halfRangeStatus,
      approximateDistance: profile.approximateDistance,
      precision: profile.precision,
      extraAttacks: profile.extraAttacks,
      hitReroll: profile.hitReroll,
      woundReroll: strongestReroll(profile.woundReroll, profile.twinLinked ? "failed" : "none")
    })
  });
}
