import { getProbabilisticUnitProfile } from "./saved-roster-combat-profile.js";
import { getShootingTargetPriorities } from "./tactical-shooting-targets.js";
import { getTargetStrategicContext } from "./tactical-target-context.js";

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

function strategicRecommendation({ strategicContext, impactClassification, destructionProbability, expectedDamage }) {
  if (strategicContext.secondary.score >= 0.7) {
    return "Priority target: destroying or degrading this unit has strong verified active-secondary impact in addition to its combat value.";
  }
  if (strategicContext.primary.score >= 0.7) {
    return "Priority target: this unit has strong objective-linked Primary scoring or denial value; confirm actual OC and mission conditions at the table.";
  }
  if (strategicContext.threat.score >= 0.7) {
    return "Priority target: recorded combat history identifies this unit as a proven threat worth suppressing.";
  }
  if (destructionProbability >= 0.8) {
    return "Strong offensive opportunity with a likely destruction result; compare its mission value before committing the activation.";
  }
  if (strategicContext.primary.score >= 0.4 || strategicContext.secondary.score >= 0.4) {
    return "Mission-relevant target: its scoring impact may justify attacking it even if another target offers slightly better raw damage.";
  }
  if (strategicContext.threat.score >= 0.4) {
    return "Threat-suppression candidate: this unit has meaningful recorded combat impact.";
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
 * enriches its candidates with mission context, active verified secondaries,
 * recorded opponent threat and probability detail, then ranks the candidates
 * for advice. The UI can render this without duplicating Tactical Advisor math.
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

    const primaryMissionPoints = strategicContext.primary.score * 3.5;
    const secondaryMissionPoints = strategicContext.secondary.score * 3.5;
    const threatPoints = strategicContext.threat.score * 2.25;
    const objectiveContextPoints = strategicContext.objective.score * 0.75;
    const strategicPoints = primaryMissionPoints + secondaryMissionPoints + threatPoints + objectiveContextPoints;
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
      strategicContext,
      decisionScore,
      decisionBreakdown: Object.freeze({
        baselineTargetPriority: item.priority,
        primaryMissionPoints,
        secondaryMissionPoints,
        threatPoints,
        objectiveContextPoints,
        strategicPoints,
        weights: Object.freeze({
          primaryMission: 3.5,
          secondaryMission: 3.5,
          threat: 2.25,
          objectiveContext: 0.75
        })
      }),
      recommendation: strategicRecommendation({
        strategicContext,
        impactClassification: item.impactClassification,
        destructionProbability: item.destructionProbability,
        expectedDamage
      }),
      assumptions: Object.freeze([
        "Battlefield distances are approximate and tabletop measurement remains authoritative.",
        "Probabilities use saved profiles and known weapon characteristics only.",
        ...(weapon?.quantityUncertain ? ["Remaining models are known, but the surviving mixed-weapon models are not; probability is withheld until weapon casualties are known."] : []),
        "Mission impact never awards VP automatically.",
        "Unverified secondary-card text is not used to change target ranking."
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
