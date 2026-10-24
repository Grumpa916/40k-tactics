import { getProbabilisticUnitProfile } from "./saved-roster-combat-profile.js";
import { getShootingTargetPriorities } from "./tactical-shooting-targets.js";
import { getTargetStrategicContext } from "./tactical-target-context.js";
import { getFireCoordinationContext } from "./tactical-fire-coordination.js";

function unitById(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : [])
    .find((unit) => unit?.id === unitId) ?? null;
}

// The engine replaces state after accepted actions. Target browsing changes UI
// selection only, so reuse the last weapon comparison until state or weapon changes.
export function createShootingComparisonCache(compare = getShootingTargetComparison) {
  let priorState, priorKey, result;
  return (state, options) => {
    const key = JSON.stringify(options);
    if (state !== priorState || key !== priorKey) {
      result = compare(state, options);
      priorState = state; priorKey = key;
    }
    return result;
  };
}

function probabilityAtLeast(distribution, threshold) {
  if (!distribution || !Array.isArray(distribution.outcomes) || !Number.isFinite(threshold)) return null;
  return distribution.outcomes
    .filter((outcome) => outcome.damage >= threshold)
    .reduce((sum, outcome) => sum + outcome.probability, 0);
}

function probabilityAnyDamage(distribution) {
  if (!distribution || !Array.isArray(distribution.outcomes)) return null;
  const noDamage = distribution.outcomes
    .filter((outcome) => outcome.damage <= 0)
    .reduce((sum, outcome) => sum + outcome.probability, 0);
  return Math.max(0, Math.min(1, 1 - noDamage));
}

function strategicRecommendation({ strategicContext, fireCoordination, impactClassification, destructionProbability, expectedDamage }) {
  const killChance = Number.isFinite(destructionProbability) ? destructionProbability : 0;
  if (strategicContext.battleShock.active && strategicContext.objectiveSwing.targetNominalOc > 0 && strategicContext.objectiveSwing.targetOc === 0 && strategicContext.threat.score < 0.4 && strategicContext.retaliation.score < 0.4) {
    return "Lower marginal kill value: Battle-shock is already suppressing this unit's OC and Stratagem access. Prefer another target unless removing it serves the mission or prevents meaningful damage.";
  }
  if (strategicContext.objectiveSwing.potentialFlip && killChance >= 0.5) {
    return `Priority target: a successful kill could flip ${strategicContext.objectiveSwing.objectiveId} based on recorded OC and control context.`;
  }
  if ((strategicContext.secondary.potentialVp >= 3 || strategicContext.secondary.denialVp >= 3) && killChance >= 0.5) {
    const vp = Math.max(strategicContext.secondary.potentialVp, strategicContext.secondary.denialVp);
    return `Priority target: this attack can directly support or deny about ${vp} verified Secondary VP if the card conditions are met.`;
  }
  if (strategicContext.secondary.score >= 0.7) {
    return "Priority target: destroying or degrading this unit has strong verified active-secondary impact in addition to its combat value.";
  }
  if (strategicContext.primary.score >= 0.7 || strategicContext.scoringRole.role === "key-scoring-unit") {
    return "Priority target: this is a key scoring piece with strong objective-linked Primary or OC leverage; confirm exact contesting models at the table.";
  }
  if (strategicContext.retaliation.score >= 0.7 || strategicContext.threat.score >= 0.7) {
    return "Priority target: recorded history or saved-profile retaliation identifies this unit as a major damage threat worth suppressing.";
  }
  if (fireCoordination.betterMatch && !fireCoordination.concentratedFireViable) {
    return `Consider another target for this weapon: ${fireCoordination.bestAlternative?.unitName ?? "another friendly unit"} has a substantially better saved-profile match into this enemy.`;
  }
  if (fireCoordination.concentratedFireViable && strategicContext.score >= 0.45) {
    return "High-value target but likely a multi-activation problem: plan concentrated fire rather than expecting this weapon to solve it alone.";
  }
  if (destructionProbability >= 0.8) {
    return "Strong offensive opportunity with a likely destruction result; compare mission value and overkill risk before committing the activation.";
  }
  if (strategicContext.primary.score >= 0.4 || strategicContext.secondary.score >= 0.4 || strategicContext.objectiveSwing.score >= 0.4) {
    return "Mission-relevant target: its scoring impact may justify attacking it even if another target offers slightly better raw damage.";
  }
  if (strategicContext.threat.score >= 0.4 || strategicContext.retaliation.score >= 0.4) {
    return "Threat-suppression candidate: this unit has meaningful recorded or projected combat impact.";
  }
  if (impactClassification === "possible-destruction") {
    return "Possible destruction opportunity; weigh the kill chance against mission value and other available targets.";
  }
  if (impactClassification === "likely-severe-degradation") {
    return "Strong degradation opportunity; expected damage is at least half the target's remaining wounds.";
  }
  if (Number.isFinite(expectedDamage) && expectedDamage > 0) {
    return "Limited baseline impact; prefer this target only if its mission or threat value justifies the shooting commitment.";
  }
  return "Insufficient combat or strategic evidence for a stronger recommendation.";
}

/**
 * Stable view-model contract for the tablet "Compare your targets" surface.
 *
 * The existing Shooting target resolver remains untouched. This decision layer
 * enriches candidates with mission, OC/control swing, active secondaries,
 * historical and projected threat, CP/Stratagem context and remaining-friendly
 * fire allocation before ranking the candidates for advice.
 */
export function getShootingTargetComparison(state, {
  playerId,
  attackerId,
  weapon = null
} = {}) {
  const attacker = unitById(state, attackerId);
  const sourceAttacker = weapon?.sourceUnitId ? unitById(state, weapon.sourceUnitId) ?? attacker : attacker;
  const base = getShootingTargetPriorities(state, { playerId, attackerId, weapon });

  const comparisons = base.priorities.map((item) => {
    const target = unitById(state, item.targetUnitId);
    const strategicContext = getTargetStrategicContext(state, {
      playerId,
      targetUnitId: item.targetUnitId
    });

    const distribution = item.damageDistribution;

    const expectedDamage = item.expectedDamage;
    const expectedDamageThreshold = Number.isFinite(expectedDamage) && expectedDamage > 0
      ? Math.max(1, Math.ceil(expectedDamage))
      : 1;
    const targetProfile = target ? getProbabilisticUnitProfile(state, target) : null;
    const severeDamageThreshold = Number.isFinite(targetProfile?.wounds) && targetProfile.wounds > 0
      ? Math.max(1, Math.ceil(targetProfile.wounds * 0.5))
      : null;
    const probabilityAnyDamageValue = probabilityAnyDamage(distribution);
    const probabilityAtLeastExpectedDamage = probabilityAtLeast(distribution, expectedDamageThreshold);
    const severeDamageProbability = severeDamageThreshold == null
      ? null
      : probabilityAtLeast(distribution, severeDamageThreshold);
    const destructionProbability = Number.isFinite(item.destructionProbability) ? item.destructionProbability : 0;
    const killLeverage = Number.isFinite(item.destructionProbability)
      ? Math.max(0.15, Math.min(1, item.destructionProbability))
      : Number.isFinite(expectedDamage) && Number.isFinite(targetProfile?.wounds) && targetProfile.wounds > 0
        ? Math.max(0.15, Math.min(1, expectedDamage / targetProfile.wounds))
        : 0.2;
    const degradationLeverage = Number.isFinite(expectedDamage) && Number.isFinite(targetProfile?.wounds) && targetProfile.wounds > 0
      ? Math.min(1, expectedDamage / targetProfile.wounds)
      : killLeverage;

    const fireCoordination = getFireCoordinationContext(state, {
      playerId,
      attackerId,
      targetUnitId: item.targetUnitId,
      currentWeapon: weapon,
      currentExpectedDamage: expectedDamage,
      currentDestructionProbability: item.destructionProbability
    });
    const strategyWeights = strategicContext.gameStrategy.weights;
    const primaryMissionPoints = strategicContext.primary.score * 3.5 * strategyWeights.primary * Math.max(killLeverage, degradationLeverage * 0.7);
    const secondaryMissionPoints = strategicContext.secondary.score * 3.5 * strategyWeights.secondary * killLeverage;
    const objectiveSwingPoints = strategicContext.objectiveSwing.score * 4.25 * strategyWeights.objectiveSwing * killLeverage;
    const threatPoints = strategicContext.threat.score * 2.0 * strategyWeights.threat * Math.max(killLeverage, degradationLeverage);
    const retaliationPoints = strategicContext.retaliation.score * 1.9 * strategyWeights.retaliation * Math.max(killLeverage, degradationLeverage * 0.8);
    const objectiveContextPoints = strategicContext.objective.score * 0.75;
    const scoringRolePoints = strategicContext.scoringRole.score * 0.8 * killLeverage;
    const verifiedVp = Math.max(strategicContext.secondary.potentialVp ?? 0, strategicContext.secondary.denialVp ?? 0);
    const verifiedVpPoints = Math.min(3, verifiedVp * 0.55) * killLeverage;
    const battleShockPenalty = strategicContext.battleShock.marginalKillPenalty * 2.25;
    const betterMatchPenalty = fireCoordination.betterMatch
      ? 1.5 * fireCoordination.score * strategyWeights.efficiency
      : 0;
    const overkillPenalty = fireCoordination.likelyOverkill ? 0.9 * strategyWeights.efficiency : 0;
    const concentrationBonus = fireCoordination.concentratedFireViable && strategicContext.score >= 0.45
      ? 0.75 * strategicContext.score
      : 0;
    const defenceUncertaintyPenalty = strategicContext.stratagems.opponentCanAffectTarget &&
      (strategicContext.stratagems.opponent?.defence?.length ?? 0) > 0 ? 0.2 : 0;
    const strategicPoints = primaryMissionPoints + secondaryMissionPoints + objectiveSwingPoints + threatPoints +
      retaliationPoints + objectiveContextPoints + scoringRolePoints + verifiedVpPoints + concentrationBonus -
      battleShockPenalty - betterMatchPenalty - overkillPenalty - defenceUncertaintyPenalty;
    const decisionScore = item.priority + strategicPoints;

    return {
      ...item,
      targetName: target?.name ?? item.targetUnitId,
      probabilityAnyDamage: probabilityAnyDamageValue,
      expectedDamageThreshold,
      probabilityAtLeastExpectedDamage,
      severeDamageThreshold,
      severeDamageProbability,
      objectiveImpact: strategicContext.objective,
      primaryMissionImpact: strategicContext.primary,
      secondaryMissionImpact: strategicContext.secondary,
      recentThreat: strategicContext.threat,
      objectiveSwing: strategicContext.objectiveSwing,
      retaliationRisk: strategicContext.retaliation,
      scoringRole: strategicContext.scoringRole,
      battleShockTacticalValue: strategicContext.battleShock,
      stratagemContext: strategicContext.stratagems,
      gameStrategy: strategicContext.gameStrategy,
      fireCoordination,
      strategicContext,
      verifiedVpLeverage: verifiedVp,
      decisionScore,
      decisionBreakdown: Object.freeze({
        baselineTargetPriority: item.priority,
        primaryMissionPoints,
        secondaryMissionPoints,
        objectiveSwingPoints,
        threatPoints,
        retaliationPoints,
        objectiveContextPoints,
        scoringRolePoints,
        verifiedVpPoints,
        concentrationBonus,
        battleShockPenalty,
        betterMatchPenalty,
        overkillPenalty,
        defenceUncertaintyPenalty,
        strategicPoints,
        killLeverage,
        degradationLeverage,
        strategyPosture: strategicContext.gameStrategy.posture
      }),
      recommendation: strategicRecommendation({
        strategicContext,
        fireCoordination,
        impactClassification: item.impactClassification,
        destructionProbability,
        expectedDamage
      }),
      assumptions: Object.freeze([
        "Battlefield distances and objective proximity are approximate; tabletop measurement and actual contesting models remain authoritative.",
        "Probabilities use saved profiles and known weapon characteristics only.",
        ...(weapon?.quantityUncertain ? ["Remaining models are known, but the surviving mixed-weapon models are not; probability is withheld until weapon casualties are known."] : []),
        "Mission impact never awards VP automatically.",
        "Only verified secondary-card rules alter target ranking; unverified VP references remain manual-review-only.",
        fireCoordination.assumption,
        strategicContext.retaliation.assumption,
        strategicContext.stratagems.assumption
      ])
    };
  }).sort((a, b) =>
    b.decisionScore - a.decisionScore ||
    (a.targetDistance ?? Infinity) - (b.targetDistance ?? Infinity) ||
    a.targetUnitId.localeCompare(b.targetUnitId)
  );

  return Object.freeze({
    playerId,
    attackerId,
    sourceUnitId: sourceAttacker?.id ?? attackerId,
    weaponId: weapon?.id ?? null,
    comparisons: Object.freeze(comparisons.map((item, index) => Object.freeze({
      ...item,
      rank: index + 1
    })))
  });
}
