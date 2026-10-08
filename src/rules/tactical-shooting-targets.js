import { getCombatHistorySummary } from "./combat-history-summary.js";
import { getSpatialContext } from "./spatial-context.js";
import { getDamageOutcomeDistribution } from "./damage-outcome-distribution.js";
import { getPostFightTargetStates } from "./post-fight-target-states.js";
import { evaluateShootingOpportunity } from "./tactical-shooting-opportunity.js";

function unitById(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : []).find((unit) => unit.id === unitId) ?? null;
}

const RANGE_UNCERTAINTY_MARGIN = 3;

function rangeFromWeapon(weapon) {
  const value = weapon?.characteristics?.range ?? weapon?.range;
  return Number.isFinite(value) ? value : null;
}

function proximityScore(band) {
  return {
    close: 3,
    near: 2,
    mid: 1,
    far: 0,
    "very-far": -2
  }[band] ?? 0;
}

export function classifyShootingImpact({ expectedDamage, destructionProbability, targetWounds } = {}) {
  if (!Number.isFinite(expectedDamage) || !Number.isFinite(destructionProbability) || !Number.isFinite(targetWounds) || targetWounds <= 0) return "unknown";
  if (destructionProbability >= 0.8) return "likely-destruction";
  if (destructionProbability >= 0.5) return "possible-destruction";
  if (expectedDamage >= targetWounds * 0.5) return "likely-severe-degradation";
  if (expectedDamage > 0) return "limited-impact";
  return "no-baseline-impact";
}

function rangeScore(distance, range) {
  if (range == null || distance == null) return 0;
  return distance <= range ? 2 : -2;
}

/**
 * Rank enemy targets for a player's Shooting activation.
 *
 * This is advisory only. It uses the coarse spatial context and authoritative
 * combat history, but never determines whether an attack is legally possible.
 * A weapon range, when supplied, is treated as an approximate prioritization
 * signal rather than a range/LOS legality check.
 */
export function getShootingTargetPriorities(state, {
  playerId,
  attackerId,
  weapon = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!attackerId) throw new TypeError("attackerId is required.");

  const attacker = unitById(state, attackerId);
  if (!attacker || attacker.ownerId !== playerId) {
    throw new Error("Shooting attacker must belong to playerId.");
  }

  const combat = getCombatHistorySummary(state, { playerId });
  const attackerSummary = combat.units.find((unit) => unit.unitId === attackerId);
  const spatial = getSpatialContext(state, { playerId });
  const proximities = spatial.unitProximity.filter(
    (item) => item.unitId === attackerId
  );
  const range = rangeFromWeapon(weapon);
  const priorities = [];

  for (const proximity of proximities) {
    const target = unitById(state, proximity.otherUnitId);
    if (!target || target.ownerId === playerId || target.status === "destroyed") continue;

    const engaged = attackerSummary?.engagedWith?.includes(target.id) ?? false;

    // Normal Fight-engaged targets are not Shooting recommendations. Any
    // future exceptions should be supplied by authoritative unit/rule data.
    if (engaged) continue;

    // Keep one coarse bucket beyond range as borderline; screen farther targets.
    if (range != null && proximity.distance > range + RANGE_UNCERTAINTY_MARGIN) continue;

    let priority = proximityScore(proximity.band);
    priority += rangeScore(proximity.distance, range);

    let expectedDamage = null;
    let destructionProbability = null;
    let survivalProbability = null;
    let mostLikelyRemainingWounds = null;
    let impactClassification = "unknown";
    if (weapon?.characteristics && attacker.characteristics && target.characteristics) {
      try {
        const distribution = getDamageOutcomeDistribution({ attacker, target, weapon });
        const postTarget = getPostFightTargetStates({ target, attacker, weapon, distribution });
        expectedDamage = distribution.expectedDamage;
        destructionProbability = postTarget.destructionProbability;
        survivalProbability = postTarget.survivalProbability;
        const mostLikelyState = postTarget.states.reduce((best, state) =>
          !best || state.probability > best.probability ? state : best,
          null
        );
        mostLikelyRemainingWounds = mostLikelyState?.remainingWounds ?? null;
        impactClassification = classifyShootingImpact({ expectedDamage, destructionProbability, targetWounds: target.wounds });
        priority += Math.min(3, expectedDamage);
        priority += Math.min(2, destructionProbability * 2);
      } catch {
        // Incomplete profiles remain eligible; probabilistic impact is optional advisory data.
      }
    }

    const reasons = [];
    const rangeStatus = range == null ? "unknown" : proximity.distance <= range ? "within" : "borderline";
    const opportunity = evaluateShootingOpportunity({
      expectedDamage,
      destructionProbability,
      survivalProbability,
      targetWounds: target.wounds,
      impactClassification,
      rangeStatus
    });
    if (proximity.band === "close" || proximity.band === "near") {
      reasons.push("Enemy is approximately " + proximity.distance + " inches away.");
    }
    if (expectedDamage != null) {
      reasons.push("Baseline expected damage is approximately " + expectedDamage.toFixed(2) + ".");
    }
    if (impactClassification !== "unknown") {
      reasons.push("Outcome profile: " + impactClassification.replaceAll("-", " ") + ".");
    }
    if (destructionProbability != null) {
      reasons.push("Estimated destruction chance is approximately " + (destructionProbability * 100).toFixed(0) + "%.");
    }
    if (range != null) {
      reasons.push(
        proximity.distance <= range
          ? "Target is within the weapon's approximate range."
          : "Target is just beyond the weapon's approximate range; exact tabletop measurement is required."
      );
    }

    priorities.push({
      type: "shooting-target",
      priority,
      unitId: attackerId,
      targetUnitId: target.id,
      targetDistance: proximity.distance,
      targetBand: proximity.band,
      weaponId: weapon?.id ?? null,
      rangeStatus,
      expectedDamage,
      destructionProbability,
      survivalProbability,
      mostLikelyRemainingWounds,
      impactClassification,
      targetImpact: opportunity.targetImpact,
      normalizedImpact: opportunity.normalizedImpact,
      rangeConfidence: opportunity.rangeConfidence,
      confidence: opportunity.confidence,
      recommendationReason: opportunity.recommendationReason,
      reason: reasons.join(" ")
    });
  }

  priorities.sort((a, b) =>
    b.priority - a.priority ||
    (a.targetDistance ?? Infinity) - (b.targetDistance ?? Infinity) ||
    a.targetUnitId.localeCompare(b.targetUnitId)
  );

  return {
    playerId,
    attackerId,
    weaponId: weapon?.id ?? null,
    priorities
  };
}
