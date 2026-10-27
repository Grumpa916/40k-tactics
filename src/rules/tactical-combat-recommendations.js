import { getFightCandidates } from "./fight-candidates.js";
import { getFightEngagementState } from "./fight-engagement-state.js";
import { getShootingTargetPriorities } from "./tactical-shooting-targets.js";
import { getSpatialContext } from "./spatial-context.js";
import { getChargeOpportunity } from "./tactical-charge-opportunity.js";
import { getMovementStrategicRecommendations } from "./tactical-movement-router.js";
import { getCustodesPhaseRecommendations } from "./custodes-tactical-advisor.js";
import { getCustodesMovementRecommendations } from "./custodes-movement-advisor.js";
import { getCustodesFightKatahRecommendations } from "./custodes-fight-katah-recommendations.js";

const CHARGE_MAX_DISTANCE = 12;
const CHARGE_RANGE_UNCERTAINTY_MARGIN = 3;

function unitById(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : [])
    .find((unit) => unit?.id === unitId) ?? null;
}

function chargeCandidates(state, { playerId }) {
  if (state?.phase !== "charge") return [];

  const spatial = getSpatialContext(state, { playerId });
  const engagedUnitIds = new Set(getFightEngagementState(state).engagedUnitIds);
  const candidates = [];

  for (const proximity of spatial.unitProximity) {
    const attacker = unitById(state, proximity.unitId);
    const target = unitById(state, proximity.otherUnitId);

    if (!attacker || !target) continue;
    if (attacker.ownerId !== playerId || target.ownerId === playerId) continue;
    if (attacker.status === "destroyed" || target.status === "destroyed") continue;
    if (engagedUnitIds.has(attacker.id)) continue;

    if (proximity.distance > CHARGE_MAX_DISTANCE + CHARGE_RANGE_UNCERTAINTY_MARGIN) continue;

    const rangeStatus = proximity.distance <= CHARGE_MAX_DISTANCE ? "within" : "borderline";
    const confidence =
      rangeStatus === "borderline" ? "low" :
      proximity.distance <= 6 ? "high" :
      "moderate";
    const basePriority = confidence === "high" ? 3 : confidence === "moderate" ? 2 : 1;

    let opportunity = null;
    try {
      opportunity = getChargeOpportunity(state, {
        playerId,
        attackerId: attacker.id,
        targetUnitId: target.id,
        mapDistance: proximity.distance
      });
    } catch {
      opportunity = null;
    }

    const strategicBoost = opportunity?.strategicContext?.score >= 0.65 ? 1 : 0;
    const fightBoost = opportunity?.projectedFight?.targetImpact >= 0.5 ? 1 : 0;
    const priority = Math.min(5, basePriority + strategicBoost + fightBoost);

    candidates.push({
      type: "charge",
      priority,
      unitId: attacker.id,
      targetUnitId: target.id,
      targetDistance: proximity.distance,
      targetBand: proximity.band,
      confidence,
      rangeStatus,
      mapSuccessProbability: opportunity?.mapSuccessProbability ?? null,
      unmodifiedMapSuccessProbability: opportunity?.unmodifiedMapSuccessProbability ?? null,
      custodesCharge: opportunity?.custodesCharge ?? null,
      projectedFight: opportunity?.projectedFight ?? null,
      projectedCounterFight: opportunity?.projectedCounterFight ?? null,
      strategicContext: opportunity?.strategicContext ?? null,
      decisionScore: opportunity?.decisionScore ?? basePriority,
      recommendation: opportunity?.recommendation ?? null,
      reason: opportunity?.recommendation ?? (rangeStatus === "borderline"
        ? "Enemy is just beyond the maximum charge distance; exact tabletop measurement is required."
        : "Enemy is within the approximate maximum charge envelope.")
    });
  }

  return candidates.sort((a, b) =>
    (b.decisionScore ?? b.priority) - (a.decisionScore ?? a.priority) ||
    b.priority - a.priority ||
    (a.targetDistance ?? Infinity) - (b.targetDistance ?? Infinity) ||
    a.unitId.localeCompare(b.unitId) ||
    a.targetUnitId.localeCompare(b.targetUnitId)
  );
}

function fightRecommendations(state) {
  if (state?.phase !== "fight") return [];

  const candidates = getFightCandidates(state);
  const recommendations = [];

  for (const unitId of candidates.fightsFirst) {
    recommendations.push({
      type: "fight",
      priority: 3,
      unitId,
      fightOrder: "fights-first",
      confidence: "high",
      reason: "Unit is eligible to activate in Fight and has Fights First."
    });
  }

  for (const unitId of candidates.normal) {
    recommendations.push({
      type: "fight",
      priority: 2,
      unitId,
      fightOrder: "normal",
      confidence: "high",
      reason: "Unit is eligible to activate in Fight."
    });
  }

  return recommendations;
}

export function getTacticalCombatRecommendations(
  state,
  { playerId, shootingContext = null } = {}
) {
  if (!playerId) throw new TypeError("playerId is required.");

  const shooting = shootingContext?.attackerId
    ? getShootingTargetPriorities(state, {
        playerId,
        attackerId: shootingContext.attackerId,
        weapon: shootingContext.weapon ?? null
      }).priorities
    : [];

  const movement = state?.phase === "movement"
    ? getMovementStrategicRecommendations(state, { playerId }).recommendations
    : [];
  const charge = chargeCandidates(state, { playerId });
  const fight = fightRecommendations(state);
  const phaseCustodes = getCustodesPhaseRecommendations(state, { playerId })
    .filter((item) => item.katahName !== "Calistus");
  const custodesMovement = getCustodesMovementRecommendations(state, { playerId });
  const custodesFight = getCustodesFightKatahRecommendations(state, { playerId });
  const custodes = [...phaseCustodes, ...custodesMovement, ...custodesFight];

  return {
    shooting,
    movement,
    charge,
    fight,
    custodes,
    recommendations: [...shooting, ...movement, ...charge, ...fight, ...custodes]
  };
}