import { getFightCandidates } from "./fight-candidates.js";
import { getShootingTargetPriorities } from "./tactical-shooting-targets.js";
import { getSpatialContext } from "./spatial-context.js";

const CHARGE_MAX_DISTANCE = 12;

function unitById(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : [])
    .find((unit) => unit?.id === unitId) ?? null;
}

function chargeCandidates(state, { playerId }) {
  if (state?.phase !== "charge") return [];

  const spatial = getSpatialContext(state, { playerId });
  const candidates = [];

  for (const proximity of spatial.unitProximity) {
    const attacker = unitById(state, proximity.unitId);
    const target = unitById(state, proximity.otherUnitId);

    if (!attacker || !target) continue;
    if (attacker.ownerId !== playerId || target.ownerId === playerId) continue;
    if (attacker.status === "destroyed" || target.status === "destroyed") continue;

    // A charge roll can reach at most 12 inches. Because map distance is
    // deliberately coarse, this is an eligibility screen, not exact legality.
    if (proximity.distance > CHARGE_MAX_DISTANCE) continue;

    const confidence =
      proximity.distance <= 6 ? "high" :
      proximity.distance < CHARGE_MAX_DISTANCE ? "moderate" :
      "low";

    candidates.push({
      type: "charge",
      priority: confidence === "high" ? 3 : confidence === "moderate" ? 2 : 1,
      unitId: attacker.id,
      targetUnitId: target.id,
      targetDistance: proximity.distance,
      targetBand: proximity.band,
      confidence,
      reason: confidence === "low"
        ? "Enemy is approximately at the maximum charge distance; exact legality requires the tabletop measurement."
        : "Enemy is within the approximate maximum charge envelope."
    });
  }

  return candidates.sort((a, b) =>
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
      }).priorities.map((item) => ({
        ...item,
        confidence: item.targetBand === "close"
          ? "high"
          : item.targetBand === "near"
            ? "moderate"
            : "low"
      }))
    : [];

  const charge = chargeCandidates(state, { playerId });
  const fight = fightRecommendations(state);

  return {
    shooting,
    charge,
    fight,
    recommendations: [...shooting, ...charge, ...fight]
  };
}
