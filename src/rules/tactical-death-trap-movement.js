import { getEventCompanionMapForForceDispositions } from "./event-companion-map-catalog.js";
import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { objectiveAdvisorLabel } from "./objective-display-labels.js";
import { getLiveUnitPosition } from "./spatial-context.js";
import { getDeathTrapState, pointInTerrainPolygon } from "./death-trap-state.js";
import {
  getDeathTrapObjectiveStrategySignal,
  getDeathTrapPrimaryStrategyContext
} from "./tactical-death-trap-strategy.js";
import { clamp01 } from "./tactical-context-utils.js";

function geometry(state) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!setup?.myDisposition || !setup?.opponentDisposition || !setup?.layout) return null;
  return getEventCompanionMapForForceDispositions(setup.myDisposition, setup.opponentDisposition, setup.layout);
}

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
  if (distance <= 3) return 0.25;
  if (Number.isFinite(movement) && distance <= movement) return 0.18;
  if (Number.isFinite(movement) && distance <= movement + 6) return 0.1;
  return 0.02;
}

function usableOcFactor(recommendation) {
  if (recommendation?.battleShocked === true) return 0;
  const effectiveOc = Number(recommendation?.effectiveOc);
  if (!Number.isFinite(effectiveOc)) return 0.7;
  if (effectiveOc <= 0) return 0;
  return 0.58 + 0.42 * clamp01(effectiveOc / 8);
}

function terrainOptions(state, recommendation, deathTrap, primaryStrategy) {
  const unit = (state?.units ?? []).find((item) => item.id === recommendation.unitId);
  const position = unit ? getLiveUnitPosition(state, unit) : null;
  const map = geometry(state);
  if (!position || !map?.terrainGeometry) return [];
  const unresolvedKillTerrain = new Set(
    deathTrap.unresolvedKills.flatMap((item) => item.terrainAreaIds ?? (item.terrainAreaId ? [item.terrainAreaId] : []))
  );
  return deathTrap.terrain.filter((entry) => !entry.trapped).map((entry) => {
    const shape = map.terrainGeometry?.[entry.terrainAreaId];
    const distance = distanceToPolygon(position, shape?.points ?? []);
    const objectiveId = entry.objectiveIds?.[0] ?? null;
    let objectiveSignal = null;
    if (objectiveId) {
      const control = getObjectiveControlForPlayer(state, { playerId: primaryStrategy.playerId ?? unit?.ownerId, objectiveId });
      objectiveSignal = getDeathTrapObjectiveStrategySignal(state, {
        playerId: unit?.ownerId,
        perspectivePlayerId: primaryStrategy.perspectivePlayerId ?? unit?.ownerId,
        objectiveId,
        control,
        primaryStrategy
      });
      if (objectiveSignal?.ownHome) return null;
    }
    const trapVp = entry.containsObjective ? 5 : 2;
    const killCombo = unresolvedKillTerrain.has(entry.terrainAreaId) ? 3 : 0;
    const ocFactor = usableOcFactor(recommendation);
    const controlValue = objectiveSignal?.controlVpLeverage ? objectiveSignal.controlVpLeverage * ocFactor : 0;
    const missionWeight = clamp01((trapVp + killCombo + controlValue) / 12);
    const score = clamp01(0.15 + reachBoost(distance, recommendation.movement) + missionWeight * 0.48);
    const objectiveName = objectiveId ? objectiveAdvisorLabel(state, objectiveId, unit?.ownerId) : null;
    return Object.freeze({
      kind: "terrain",
      purpose: "booby-trap-terrain",
      score,
      terrainAreaId: entry.terrainAreaId,
      objectiveId,
      objectiveName,
      distance,
      trapVpLeverage: trapVp,
      killComboVpLeverage: killCombo,
      primaryStrategySignal: objectiveSignal,
      confidence: Number.isFinite(distance) ? "moderate" : "low",
      actionHint: distance === 0
        ? "If the physical card confirms eligibility, use Booby Trap in the Shooting phase"
        : "Reposition toward this terrain area, then confirm Booby Trap eligibility on the tabletop",
      reason: `${entry.terrainAreaId} is about ${distance ?? "?"}\" from this unit on the approximate map. Trapping it is worth ${trapVp} VP this turn${killCombo ? ` and can also unlock the 3 VP destruction condition from a recorded kill that began there` : ""}.${objectiveName ? ` It contains ${objectiveName}.` : ""}`
    });
  }).filter(Boolean).sort((a, b) => b.score - a.score);
}

function recommendationText(unitName, option) {
  if (option.killComboVpLeverage > 0) return `${unitName}: prioritize ${option.terrainAreaId}; Booby Trapping it can convert the terrain award and a recorded trapped-terrain kill condition this turn.`;
  if (option.trapVpLeverage >= 5) return `${unitName}: position for Booby Trap on ${option.terrainAreaId}; objective terrain is worth 5 VP when newly trapped.`;
  return `${unitName}: consider ${option.terrainAreaId} for a 2 VP Booby Trap if higher-value objective terrain is not available.`;
}

export function enhanceDeathTrapMovementRecommendations(state, base, { playerId, perspectivePlayerId = playerId } = {}) {
  const primaryStrategy = getDeathTrapPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const deathTrap = getDeathTrapState(state, { playerId, perspectivePlayerId });
  const strategyWithRouting = Object.freeze({ ...primaryStrategy, playerId, perspectivePlayerId });
  const recommendations = (base.recommendations ?? []).map((recommendation) => {
    const options = terrainOptions(state, recommendation, deathTrap, strategyWithRouting);
    const best = options[0];
    if (!best) return recommendation;
    if (best.score <= recommendation.score) {
      return Object.freeze({
        ...recommendation,
        alternatives: Object.freeze([
          ...(recommendation.alternatives ?? []),
          ...options
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
      objectiveId: best.objectiveId,
      objectiveName: best.objectiveName,
      terrainAreaId: best.terrainAreaId,
      targetUnitId: null,
      targetName: null,
      territoryTarget: null,
      distance: best.distance,
      strategicContext: null,
      primaryStrategySignal: best.primaryStrategySignal,
      recommendation: recommendationText(recommendation.unitName, best),
      reason: best.reason,
      alternatives: Object.freeze([
        ...(recommendation.alternatives ?? []),
        ...options.slice(1)
      ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2))
    });
  }).sort((a, b) => b.score - a.score || b.priority - a.priority || a.unitName.localeCompare(b.unitName));
  return Object.freeze({
    ...base,
    primaryStrategy,
    recommendations: Object.freeze(recommendations)
  });
}
