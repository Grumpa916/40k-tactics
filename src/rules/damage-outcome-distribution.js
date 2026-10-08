import { buildAttackProfile } from "./combat-profile.js";

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

function damageValues(damage) {
  if (Number.isInteger(damage) && damage >= 1) return [[damage, 1]];
  if (damage === "D3") return [[1, 1 / 3], [2, 1 / 3], [3, 1 / 3]];
  if (damage === "D6") return Array.from({ length: 6 }, (_, index) => [index + 1, 1 / 6]);
  throw new RangeError("Damage must be a positive integer, D3, or D6.");
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
  return Array.from({ length: sides }, (_, index) => [count ? count * (index + 1) + modifier : index + 1 + modifier, 1 / sides]);
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

function oneNormalHitDamageDistribution(profile, woundTargetValue, saveFailure) {
  const result = new Map();
  const woundProbability = successProbability(woundTargetValue);
  const criticalWoundProbability = profile.devastatingWounds ? 1 / 6 : 0;
  const normalWoundProbability = Math.max(0, woundProbability - criticalWoundProbability);
  addProbability(result, 0, 1 - (normalWoundProbability + criticalWoundProbability));
  for (const [damage, probability] of damageValues(profile.damage)) {
    addProbability(result, damage, normalWoundProbability * saveFailure * probability);
    addProbability(result, damage, criticalWoundProbability * probability);
  }
  return result;
}

function oneAttackDistribution(profile, woundTargetValue, saveFailure) {
  const result = new Map();
  const hitTarget = targetAfterModifier(profile.hitTarget, profile.hitModifier);
  const critical = 1 / 6;
  const regular = successProbability(hitTarget);
  const nonCriticalHit = Math.max(0, regular - critical);
  const miss = Math.max(0, 1 - regular);
  const normalHit = oneNormalHitDamageDistribution(profile, woundTargetValue, saveFailure);

  addProbability(result, 0, miss);
  for (const [damage, probability] of normalHit) {
    addProbability(result, damage, nonCriticalHit * probability);
  }

  if (profile.lethalHits) {
    for (const [damage, probability] of damageValues(profile.damage)) {
      addProbability(result, damage, critical * probability);
    }
  } else {
    for (const [damage, probability] of normalHit) {
      addProbability(result, damage, critical * probability);
    }
  }

  if (profile.sustainedHits > 0) {
    const sustainedCount = profile.sustainedHits;
    const sustainedDistribution = new Map([[0, 1]]);
    for (let index = 0; index < sustainedCount; index += 1) {
      const next = convolve(sustainedDistribution, normalHit);
      sustainedDistribution.clear();
      for (const [damage, probability] of next) sustainedDistribution.set(damage, probability);
    }

    const criticalBase = profile.lethalHits
      ? new Map(damageValues(profile.damage))
      : normalHit;
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
 * attack profile. This is intentionally separate from getExpectedDamage().
 *
 * The distribution uses the supplied profiles and known modifiers. It is
 * advisory infrastructure and does not model hidden cover, future abilities,
 * positioning, or limited-count rerolls.
 */
export function getDamageOutcomeDistribution({ attacker, target, weapon } = {}) {
  const profile = buildAttackProfile({ attacker, target, weapon });
  const saveModifier = target?.characteristics?.saveModifier ?? weapon?.characteristics?.saveModifier ?? 0;
  const woundTargetValue = targetAfterModifier(
    woundTarget(profile.strength, profile.toughness),
    profile.woundModifier
  );
  const saveFailure = singleSaveFailureProbability(profile, saveModifier);
  const outcomes = new Map();

  for (const [attackCount, attackCountProbability] of attackCountValues(profile.attacks)) {
    let distribution = new Map([[0, 1]]);
    const perAttack = oneAttackDistribution(profile, woundTargetValue, saveFailure);
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
    totalProbability: entries.reduce((sum, outcome) => sum + outcome.probability, 0)
  });
}
