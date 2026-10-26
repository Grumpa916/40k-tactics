import { getBattleUnitMovement, getCombatFormationRoot } from "./battle-unit-reference.js";
import { getCustodesMovementContext, isMartialKatahEligible } from "./custodes-tactical-advisor.js";
import { getSpatialContext } from "./spatial-context.js";

const MAP_UNCERTAINTY = 3;

export function getCustodesMovementRecommendations(state, { playerId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (state?.phase !== "movement") return Object.freeze([]);

  const spatial = getSpatialContext(state, { playerId });
  const roots = (state?.units ?? []).filter((unit) =>
    unit?.ownerId === playerId &&
    unit?.status === "deployed" &&
    getCombatFormationRoot(state, unit)?.id === unit.id &&
    isMartialKatahEligible(state, unit.id)
  );

  const recommendations = [];
  for (const unit of roots) {
    const baseMovement = getBattleUnitMovement(state, unit);
    const context = getCustodesMovementContext(state, { playerId, unitId: unit.id, baseMovement });
    if (!context.available || !Number.isFinite(context.effectiveMovement)) continue;

    const newlyReachableObjectives = (spatial.objectiveProximity ?? []).filter((entry) =>
      entry.unitId === unit.id &&
      entry.distance > context.baseMovement + MAP_UNCERTAINTY &&
      entry.distance <= context.effectiveMovement + MAP_UNCERTAINTY
    );
    const newlyReachableEnemies = (spatial.unitProximity ?? []).filter((entry) => {
      if (entry.unitId !== unit.id) return false;
      const other = (state.units ?? []).find((candidate) => candidate?.id === entry.otherUnitId);
      return other?.ownerId !== playerId &&
        other?.status !== "destroyed" &&
        entry.distance > context.baseMovement + MAP_UNCERTAINTY &&
        entry.distance <= context.effectiveMovement + MAP_UNCERTAINTY;
    });

    const specific = newlyReachableObjectives[0]
      ? ` Using Calistus makes ${newlyReachableObjectives[0].objectiveId} newly reachable inside the approximate Normal Move envelope.`
      : newlyReachableEnemies[0]
        ? ` Using Calistus makes ${newlyReachableEnemies[0].otherUnitId} newly reachable inside the approximate Normal Move envelope.`
        : " The extra 2\" increases the unit's approximate Normal Move reach; exact paths remain tabletop-authoritative.";

    recommendations.push(Object.freeze({
      type: "custodes-katah",
      priority: newlyReachableObjectives.length || newlyReachableEnemies.length ? 4 : 2,
      confidence: newlyReachableObjectives.length || newlyReachableEnemies.length ? "moderate" : "low",
      unitId: unit.id,
      katahName: "Calistus",
      baseMovement: context.baseMovement,
      effectiveMovement: context.effectiveMovement,
      newlyReachableObjectiveId: newlyReachableObjectives[0]?.objectiveId ?? null,
      newlyReachableTargetUnitId: newlyReachableEnemies[0]?.otherUnitId ?? null,
      reason: `${context.reason}${specific}`
    }));
  }

  return Object.freeze(recommendations);
}
