import { getProbabilisticUnitProfile } from "./saved-roster-combat-profile.js";
import { getFightEngagementState } from "./fight-engagement-state.js";
import { getCustodesKatahState, isMartialKatahEligible } from "./custodes-tactical-advisor.js";

function unitById(state, unitId) {
  return (state?.units ?? []).find((unit) => unit?.id === unitId) ?? null;
}

function hasKeyword(profile, keyword) {
  return (profile?.keywords ?? []).some((item) => String(item).trim().toLowerCase() === keyword.toLowerCase());
}

export function getCustodesFightKatahRecommendations(state, { playerId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (state?.phase !== "fight") return Object.freeze([]);

  const engagement = getFightEngagementState(state);
  const recommendations = [];

  for (const relationship of engagement.relationships ?? []) {
    const friendlyId = relationship.unitIds.find((id) => unitById(state, id)?.ownerId === playerId);
    const enemyId = relationship.unitIds.find((id) => unitById(state, id)?.ownerId !== playerId);
    if (!friendlyId || !enemyId || !isMartialKatahEligible(state, friendlyId)) continue;

    const readiness = getCustodesKatahState(state, { playerId, unitId: friendlyId });
    if (!readiness.readied) continue;
    const target = unitById(state, enemyId);
    if (!target || target.status === "destroyed") continue;
    const profile = getProbabilisticUnitProfile(state, target);
    const monsterVehicle = hasKeyword(profile, "Monster") || hasKeyword(profile, "Vehicle");

    recommendations.push(Object.freeze({
      type: "custodes-katah",
      priority: monsterVehicle ? 4 : 3,
      confidence: "high",
      unitId: friendlyId,
      targetUnitId: enemyId,
      katahName: monsterVehicle ? "Rendax" : "Dacatarai",
      reason: monsterVehicle
        ? "Rendax is available for this readied unit and gives its melee attacks Lethal Hits against the engaged Monster/Vehicle. Compare the modeled damage before confirming the Ka'tah."
        : "Dacatarai is available for this readied unit and lets its melee attacks re-roll Hit rolls of 1 against this non-Monster/Vehicle target."
    }));

    recommendations.push(Object.freeze({
      type: "custodes-katah",
      priority: 3,
      confidence: "high",
      unitId: friendlyId,
      targetUnitId: enemyId,
      katahName: "Kaptaris",
      reason: "Kaptaris is available for this readied unit and gives enemy melee attacks targeting it -1 to Hit; consider it when preserving the unit is more important than offensive Ka'tah value."
    }));
  }

  const unique = new Map();
  for (const item of recommendations) {
    unique.set(`${item.unitId}:${item.targetUnitId}:${item.katahName}`, item);
  }
  return Object.freeze([...unique.values()]);
}
