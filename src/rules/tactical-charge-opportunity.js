import { getExpectedDamage } from "./expected-damage.js";
import {
  getCombatFormationWeaponOptions,
  getProbabilisticUnitProfile
} from "./saved-roster-combat-profile.js";
import { getTargetStrategicContext } from "./tactical-target-context.js";

function unitById(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : [])
    .find((unit) => unit?.id === unitId) ?? null;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function getChargeSuccessProbability(distance) {
  const numeric = Number(distance);
  if (!Number.isFinite(numeric)) return null;
  const required = Math.ceil(numeric);
  if (required <= 2) return 1;
  if (required > 12) return 0;

  let successful = 0;
  for (let first = 1; first <= 6; first += 1) {
    for (let second = 1; second <= 6; second += 1) {
      if (first + second >= required) successful += 1;
    }
  }
  return successful / 36;
}

function expectedDamageForWeapon(state, sourceUnit, target, weapon) {
  try {
    const attackerProfile = getProbabilisticUnitProfile(state, sourceUnit);
    const targetProfile = getProbabilisticUnitProfile(state, target);
    const result = getExpectedDamage({ attacker: attackerProfile, target: targetProfile, weapon });
    return Number.isFinite(result?.expectedDamage) ? result.expectedDamage : null;
  } catch {
    return null;
  }
}

function meleeProjection(state, attacker, target) {
  if (!attacker || !target) {
    return Object.freeze({ available: false, expectedDamage: null, targetImpact: 0, primaryWeapon: null, extraAttackWeapons: [] });
  }

  const options = getCombatFormationWeaponOptions(state, attacker, { type: "melee" })
    .map((weapon) => {
      const source = unitById(state, weapon.sourceUnitId) ?? attacker;
      const expectedDamage = expectedDamageForWeapon(state, source, target, weapon);
      return expectedDamage == null ? null : { weapon, expectedDamage };
    })
    .filter(Boolean);

  if (!options.length) {
    return Object.freeze({ available: false, expectedDamage: null, targetImpact: 0, primaryWeapon: null, extraAttackWeapons: [] });
  }

  const extra = options.filter((item) => item.weapon?.characteristics?.extraAttacks === true);
  const normal = options.filter((item) => item.weapon?.characteristics?.extraAttacks !== true);
  const primary = (normal.length ? normal : options)
    .slice()
    .sort((a, b) => b.expectedDamage - a.expectedDamage || a.weapon.name.localeCompare(b.weapon.name))[0];
  const extraExpectedDamage = extra
    .filter((item) => item !== primary)
    .reduce((sum, item) => sum + item.expectedDamage, 0);
  const expectedDamage = primary.expectedDamage + extraExpectedDamage;
  const targetProfile = getProbabilisticUnitProfile(state, target);
  const targetWounds = Number(targetProfile?.wounds);

  return Object.freeze({
    available: true,
    expectedDamage,
    targetImpact: Number.isFinite(targetWounds) && targetWounds > 0
      ? clamp01(expectedDamage / targetWounds)
      : 0,
    primaryWeapon: primary.weapon,
    extraAttackWeapons: Object.freeze(extra.filter((item) => item !== primary).map((item) => item.weapon))
  });
}

function recommendationFor({ successProbability, measuredDistance, strategicContext, projectedFight, projectedCounterFight }) {
  const exact = Number.isFinite(measuredDistance) && Number.isFinite(successProbability);
  if (exact && successProbability < 0.3 && strategicContext.score < 0.65) {
    return "Low-probability charge with limited strategic leverage. Prefer a stronger mission or combat opportunity unless the table position changes the calculation.";
  }
  if (strategicContext.objectiveSwing?.potentialFlip && (!exact || successProbability >= 0.5)) {
    return "Priority charge opportunity: reaching this target could support an objective-control swing as well as the Fight that follows.";
  }
  if ((strategicContext.secondary?.score ?? 0) >= 0.7 && (!exact || successProbability >= 0.5)) {
    return "Priority charge opportunity: this target has strong active-secondary relevance in addition to the projected Fight value.";
  }
  if (strategicContext.scoringRole?.role === "key-scoring-unit" && (!exact || successProbability >= 0.4)) {
    return "Mission-relevant charge: the target is a key scoring piece, so disrupting it can be worth more than raw melee efficiency alone.";
  }
  if (projectedFight.available && projectedFight.targetImpact >= 0.5 && (!exact || successProbability >= 0.5)) {
    return "Strong charge-and-fight opportunity: the best saved melee profile projects meaningful damage if the charge succeeds.";
  }
  if (projectedCounterFight.available && projectedFight.available && projectedCounterFight.expectedDamage > projectedFight.expectedDamage * 1.25) {
    return "Caution: the saved melee profiles suggest the target can return more damage than this unit projects. Mission value may still justify the charge.";
  }
  if (exact) {
    return "Measured charge probability is known; weigh that chance against the target's mission value and projected Fight trade before committing.";
  }
  return "Measure the charge on the table for the exact 2D6 success chance; the map distance is only approximate tactical context.";
}

export function getChargeOpportunity(state, {
  playerId,
  attackerId,
  targetUnitId,
  measuredDistance = null,
  mapDistance = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!attackerId) throw new TypeError("attackerId is required.");
  if (!targetUnitId) throw new TypeError("targetUnitId is required.");

  const attacker = unitById(state, attackerId);
  const target = unitById(state, targetUnitId);
  if (!attacker || attacker.ownerId !== playerId) throw new Error("Charge attacker must belong to playerId.");
  if (!target || target.ownerId === playerId) throw new Error("Charge target must be an enemy unit.");

  const strategicContext = getTargetStrategicContext(state, { playerId, targetUnitId });
  const projectedFight = meleeProjection(state, attacker, target);
  const projectedCounterFight = meleeProjection(state, target, attacker);
  const exactSuccessProbability = getChargeSuccessProbability(measuredDistance);
  const mapSuccessProbability = getChargeSuccessProbability(mapDistance);
  const probabilityForRanking = exactSuccessProbability ?? mapSuccessProbability ?? 0.5;
  const counterProfile = getProbabilisticUnitProfile(state, attacker);
  const counterWounds = Number(counterProfile?.wounds);
  const counterImpact = projectedCounterFight.available && Number.isFinite(counterWounds) && counterWounds > 0
    ? clamp01(projectedCounterFight.expectedDamage / counterWounds)
    : 0;
  const battleShockPenalty = (strategicContext.battleShock?.marginalKillPenalty ?? 0) * 0.75;
  const decisionScore =
    strategicContext.score * 4 +
    projectedFight.targetImpact * 3 +
    probabilityForRanking * 2 -
    counterImpact * 1.25 -
    battleShockPenalty;

  return Object.freeze({
    playerId,
    attackerId,
    targetUnitId,
    measuredDistance: Number.isFinite(Number(measuredDistance)) ? Number(measuredDistance) : null,
    mapDistance: Number.isFinite(Number(mapDistance)) ? Number(mapDistance) : null,
    successProbability: exactSuccessProbability,
    mapSuccessProbability,
    probabilityBasis: exactSuccessProbability != null ? "measured" : mapSuccessProbability != null ? "map-approximation" : "unknown",
    projectedFight,
    projectedCounterFight,
    strategicContext,
    decisionScore,
    recommendation: recommendationFor({
      successProbability: exactSuccessProbability,
      measuredDistance: Number.isFinite(Number(measuredDistance)) ? Number(measuredDistance) : null,
      strategicContext,
      projectedFight,
      projectedCounterFight
    }),
    assumption: "Charge probability uses an unmodified 2D6 roll against the measured distance. Re-rolls, charge modifiers, terrain, model placement and special rules are not applied unless separately modeled; tabletop legality remains authoritative."
  });
}
