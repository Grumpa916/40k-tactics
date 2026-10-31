import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { objectiveAdvisorLabel } from "./objective-display-labels.js";
import { getLiveUnitPosition, getSpatialContext } from "./spatial-context.js";
import { pointInTerrainPolygon } from "./death-trap-state.js";
import { getVanguardOperationState } from "./vanguard-operation-state.js";
import {
  getVanguardOperationObjectiveStrategySignal,
  getVanguardOperationPrimaryStrategyContext
} from "./tactical-vanguard-operation-strategy.js";
import { clamp01 } from "./tactical-context-utils.js";

function segmentDistance(point, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (!lengthSq) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function distanceToPolygon(point, points) {
  if (!point || !Array.isArray(points) || points.length < 3) return null;
  if (pointInTerrainPolygon(point, points)) return 0;
  let best = Infinity;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    best = Math.min(best, segmentDistance(point, points[j], points[i]));
  }
  return Number.isFinite(best) ? Math.round(best) : null;
}

function reachBoost(distance, movement) {
  if (!Number.isFinite(distance)) return 0;
  if (distance <= 0) return 0.3;
  if (distance <= 3) return 0.24;
  if (Number.isFinite(movement) && distance <= movement) return 0.18;
  if (Number.isFinite(movement) && distance <= movement + 6) return 0.1;
  return 0.02;
}

function purposeFor(control) {
  if (control === "controlled") return "hold-objective";
  if (control === "enemy-controlled") return "contest-objective";
  if (control === "contested" || control === "contested-by-others") return "swing-objective";
  return "claim-objective";
}

function objectiveOptions(state, recommendation, spatial, { playerId, perspectivePlayerId }, primaryStrategy) {
  return (spatial.objectiveProximity ?? [])
    .filter((entry) => entry.unitId === recommendation.unitId)
    .map((entry) => {
      const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: entry.objectiveId });
      const purpose = purposeFor(control);
      const signal = getVanguardOperationObjectiveStrategySignal(state, {
        playerId,
        perspectivePlayerId,
        objectiveId: entry.objectiveId,
        control,
        purpose,
        primaryStrategy
      });
      if (!signal.active || signal.vpLeverage <= 0 && signal.score < 0.2) return null;
      const cannotControl = recommendation.battleShocked === true || recommendation.effectiveOc === 0;
      let score = clamp01(0.12 + reachBoost(entry.distance, recommendation.movement) + signal.score);
      if (cannotControl && signal.controlVpLeverage > 0) score = Math.min(score, 0.22);
      const objectiveName = objectiveAdvisorLabel(state, entry.objectiveId, perspectivePlayerId);
      return Object.freeze({
        kind: "objective",
        purpose,
        score,
        objectiveId: entry.objectiveId,
        objectiveName,
        terrainAreaId: null,
        distance: entry.distance,
        control,
        primaryStrategySignal: signal,
        confidence: Number.isFinite(recommendation.movement) ? "moderate" : "low",
        actionHint: cannotControl && signal.controlVpLeverage > 0
          ? "Do not rely on this unit for the control checkpoint until its effective OC is restored"
          : entry.distance <= 3
            ? "Hold or make only a small reposition"
            : Number.isFinite(recommendation.movement) && entry.distance <= recommendation.movement + 3
              ? "A Normal Move can plausibly reach the objective area"
              : "Reposition toward this objective without assuming exact legality from the map",
        reason: `${objectiveName} is about ${entry.distance}\" away on the approximate map. ${signal.reason}${cannotControl && signal.controlVpLeverage > 0 ? " This unit currently has no reliable effective OC for the control-dependent plan." : ""}`
      });
    })
    .filter(Boolean);
}

function terrainOptions(state, recommendation, vanguard, primaryStrategy, playerId) {
  if (!vanguard.actionAvailableThisTurn || primaryStrategy.nextActionVpLeverage <= 0) return [];
  const unit = (state?.units ?? []).find((item) => item.id === recommendation.unitId);
  const position = unit ? getLiveUnitPosition(state, unit) : null;
  if (!position) return [];
  const enemies = (state?.units ?? []).filter((item) => item?.ownerId && item.ownerId !== playerId && item.status === "deployed");

  return vanguard.terrainOptions.map((entry) => {
    const distance = distanceToPolygon(position, entry.points);
    const blockerIds = enemies
      .filter((enemy) => pointInTerrainPolygon(getLiveUnitPosition(state, enemy), entry.points))
      .map((enemy) => enemy.id);
    const clearByMap = blockerIds.length === 0;
    const territoryConfidence = entry.enemyTerritoryByMap === true ? 1 : 0.55;
    const blockerPenalty = Math.min(0.24, blockerIds.length * 0.08);
    const score = clamp01(0.2 + reachBoost(distance, recommendation.movement) + primaryStrategy.nextActionVpLeverage * 0.08 + territoryConfidence * 0.12 - blockerPenalty);
    return Object.freeze({
      kind: "terrain",
      purpose: "vanguard-operation-terrain",
      score,
      terrainAreaId: entry.terrainAreaId,
      objectiveId: null,
      objectiveName: null,
      distance,
      blockerUnitIds: Object.freeze(blockerIds),
      clearByMap,
      enemyTerritoryByMap: entry.enemyTerritoryByMap,
      primaryStrategySignal: null,
      confidence: entry.enemyTerritoryByMap === true && Number.isFinite(distance) ? "moderate" : "low",
      actionHint: distance === 0
        ? "If the tabletop confirms this terrain is in enemy territory, start Vanguard Operation in Shooting and keep the area clear through end of turn"
        : Number.isFinite(recommendation.movement) && Number.isFinite(distance) && distance <= recommendation.movement
          ? "Move into this enemy-territory terrain to set up Vanguard Operation in Shooting"
          : "Stage toward this enemy-territory terrain for a Vanguard Operation attempt; confirm the physical terrain boundary",
      reason: `${entry.terrainAreaId} is about ${distance ?? "?"}\" from this unit on the approximate map. It offers up to ${primaryStrategy.nextActionVpLeverage} current-round Primary VP from Vanguard Operation${entry.enemyTerritoryByMap === true ? " and is mapped wholly in the opponent's territory" : "; territory placement needs tabletop confirmation"}.${clearByMap ? " No enemy unit is currently recorded inside it." : ` ${blockerIds.length} enemy unit${blockerIds.length === 1 ? " is" : "s are"} currently recorded inside it and would need to be cleared by end of turn.`}`
    });
  });
}

function recommendationText(unitName, option) {
  if (option.kind === "terrain") {
    if (option.blockerUnitIds.length > 0) return `${unitName}: move toward ${option.terrainAreaId} for Vanguard Operation only if the enemy occupants can be cleared by end of turn.`;
    return `${unitName}: move into ${option.terrainAreaId} to set up the once-per-turn Vanguard Operation Action; keep that terrain clear of enemies through end of turn.`;
  }
  const signal = option.primaryStrategySignal;
  if (signal.opponentHome) {
    return option.purpose === "hold-objective"
      ? `${unitName}: preserve ${option.objectiveName}; it is worth 10 VP at end of battle and can also satisfy the recurring non-home checkpoint.`
      : `${unitName}: pressure ${option.objectiveName}; it is Vanguard Operation's 10 VP endgame objective and can also satisfy the recurring non-home checkpoint.`;
  }
  if (signal.controlVpLeverage > 0 && option.purpose === "hold-objective") return `${unitName}: preserve ${option.objectiveName}; it currently carries the binary 4 VP non-home control condition.`;
  if (signal.controlVpLeverage > 0) return `${unitName}: pressure ${option.objectiveName}; taking it can establish the binary 4 VP non-home control condition.`;
  return `${unitName}: preserve ${option.objectiveName} for Vanguard Operation mission value.`;
}

function sameDestination(first, second) {
  if (first?.objectiveId && second?.objectiveId) return first.objectiveId === second.objectiveId;
  if (first?.terrainAreaId && second?.terrainAreaId) return first.terrainAreaId === second.terrainAreaId;
  return false;
}

export function enhanceVanguardOperationMovementRecommendations(state, base, {
  playerId,
  perspectivePlayerId = playerId
} = {}) {
  const primaryStrategy = getVanguardOperationPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const vanguard = getVanguardOperationState(state, { playerId, perspectivePlayerId });
  const spatial = getSpatialContext(state, { playerId });
  const recommendations = (base.recommendations ?? []).map((recommendation) => {
    const options = [
      ...terrainOptions(state, recommendation, vanguard, primaryStrategy, playerId),
      ...objectiveOptions(state, recommendation, spatial, { playerId, perspectivePlayerId }, primaryStrategy)
    ].sort((a, b) => b.score - a.score);
    const best = options[0];
    if (!best) return recommendation;

    if (best.score <= recommendation.score) {
      const same = sameDestination(recommendation, best);
      return Object.freeze({
        ...recommendation,
        primaryStrategySignal: same ? best.primaryStrategySignal : recommendation.primaryStrategySignal,
        reason: same && best.primaryStrategySignal?.reason
          ? `${recommendation.reason} ${best.primaryStrategySignal.reason}`
          : recommendation.reason,
        alternatives: Object.freeze([
          ...(recommendation.alternatives ?? []),
          ...options.filter((option) => !sameDestination(option, recommendation))
        ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2))
      });
    }

    return Object.freeze({
      ...recommendation,
      score: best.score,
      priority: best.score >= 0.8 ? 5 : best.score >= 0.65 ? 4 : best.score >= 0.48 ? 3 : best.score >= 0.3 ? 2 : 1,
      purpose: best.purpose,
      confidence: best.confidence,
      actionHint: best.actionHint,
      objectiveId: best.objectiveId ?? null,
      objectiveName: best.objectiveName ?? null,
      terrainAreaId: best.terrainAreaId ?? null,
      targetUnitId: null,
      targetName: null,
      territoryTarget: best.kind === "terrain" ? "opponent" : null,
      distance: best.distance,
      strategicContext: null,
      primaryStrategySignal: best.primaryStrategySignal,
      recommendation: recommendationText(recommendation.unitName, best),
      reason: best.reason,
      alternatives: Object.freeze([
        ...(recommendation.alternatives ?? []),
        ...options.slice(1).filter((option) => !sameDestination(option, best))
      ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2))
    });
  }).sort((a, b) => b.score - a.score || b.priority - a.priority || a.unitName.localeCompare(b.unitName));

  return Object.freeze({
    ...base,
    primaryStrategy,
    recommendations: Object.freeze(recommendations)
  });
}
