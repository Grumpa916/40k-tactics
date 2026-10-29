import { getEventCompanionMapForForceDispositions } from "./event-companion-map-catalog.js";
import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { objectiveAdvisorLabel } from "./objective-display-labels.js";
import { getLiveUnitPosition, getSpatialContext } from "./spatial-context.js";
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

function purposeFor(control) {
  if (control === "controlled") return "hold-objective";
  if (control === "enemy-controlled") return "contest-objective";
  if (control === "contested" || control === "contested-by-others") return "swing-objective";
  return "claim-objective";
}

function objectiveActionHint(purpose, distance, movement) {
  if (distance <= 3) return purpose === "hold-objective" ? "Hold or make only a small reposition" : "Confirm tabletop control after positioning";
  if (Number.isFinite(movement) && distance <= movement + 3) return "A Normal Move can plausibly reach the objective area";
  return "Reposition toward this objective without assuming exact legality from the map";
}

function objectiveOptions(state, recommendation, spatial, { playerId, perspectivePlayerId }, primaryStrategy) {
  const ocFactor = usableOcFactor(recommendation);
  if (ocFactor <= 0) return [];
  return (spatial.objectiveProximity ?? [])
    .filter((entry) => entry.unitId === recommendation.unitId)
    .map((entry) => {
      const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: entry.objectiveId });
      const purpose = purposeFor(control);
      const signal = getDeathTrapObjectiveStrategySignal(state, {
        playerId,
        perspectivePlayerId,
        objectiveId: entry.objectiveId,
        control,
        purpose,
        primaryStrategy
      });
      if (!signal.active || signal.vpLeverage <= 0 && signal.score < 0.18) return null;
      const score = clamp01(0.12 + reachBoost(entry.distance, recommendation.movement) + signal.score * ocFactor);
      const objectiveName = objectiveAdvisorLabel(state, entry.objectiveId, perspectivePlayerId);
      const ocText = Number.isFinite(Number(recommendation?.effectiveOc))
        ? ` This formation currently contributes about ${Number(recommendation.effectiveOc)} usable OC.`
        : "";
      return Object.freeze({
        kind: "objective",
        purpose,
        score,
        objectiveId: entry.objectiveId,
        objectiveName,
        terrainAreaId: signal.terrainAreaId ?? null,
        distance: entry.distance,
        control,
        trapVpLeverage: signal.trapVpLeverage ?? 0,
        killComboVpLeverage: 0,
        primaryStrategySignal: signal,
        confidence: Number.isFinite(recommendation.movement) ? "moderate" : "low",
        actionHint: objectiveActionHint(purpose, entry.distance, recommendation.movement),
        reason: `${objectiveName} is about ${entry.distance}\" away on the approximate map.${ocText} ${signal.reason}`
      });
    })
    .filter(Boolean);
}

function terrainOptions(state, recommendation, deathTrap, primaryStrategy) {
  const unit = (state?.units ?? []).find((item) => item.id === recommendation.unitId);
  const position = unit ? getLiveUnitPosition(state, unit) : null;
  const map = geometry(state);
  if (!position || !map?.terrainGeometry) return [];
  const unresolvedKillTerrain = new Set(
    deathTrap.unresolvedKills.flatMap((item) => item.terrainAreaIds ?? (item.terrainAreaId ? [item.terrainAreaId] : []))
  );
  return deathTrap.terrain.filter((entry) => !entry.trapped && entry.boobyTrapEligibleByGeometry !== false).map((entry) => {
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
  }).filter(Boolean);
}

function recommendationText(unitName, option) {
  if (option.kind === "objective") {
    const signal = option.primaryStrategySignal;
    if (signal?.controlVpLeverage > 0 && option.purpose === "hold-objective") {
      return `${unitName}: preserve ${option.objectiveName}; it protects Death Trap's binary 4 VP non-home control condition.`;
    }
    if (signal?.controlVpLeverage > 0) {
      return `${unitName}: pressure ${option.objectiveName}; taking it can establish Death Trap's binary 4 VP non-home control condition.`;
    }
    if (signal?.trapVpLeverage > 0) {
      return `${unitName}: position around ${option.objectiveName}; its terrain can support a 5 VP Booby Trap opportunity.`;
    }
    return `${unitName}: preserve ${option.objectiveName} for Death Trap scoring value.`;
  }
  if (option.killComboVpLeverage > 0) return `${unitName}: prioritize ${option.terrainAreaId}; Booby Trapping it can convert the terrain award and a recorded trapped-terrain kill condition this turn.`;
  if (option.trapVpLeverage >= 5) return `${unitName}: position for Booby Trap on ${option.terrainAreaId}; objective terrain is worth 5 VP when newly trapped.`;
  return `${unitName}: consider ${option.terrainAreaId} for a 2 VP Booby Trap if higher-value objective terrain is not available.`;
}

function sameDestination(first, second) {
  if (first?.objectiveId && second?.objectiveId) return first.objectiveId === second.objectiveId;
  if (first?.terrainAreaId && second?.terrainAreaId) return first.terrainAreaId === second.terrainAreaId;
  return false;
}

export function enhanceDeathTrapMovementRecommendations(state, base, { playerId, perspectivePlayerId = playerId } = {}) {
  const primaryStrategy = getDeathTrapPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const deathTrap = getDeathTrapState(state, { playerId, perspectivePlayerId });
  const spatial = getSpatialContext(state, { playerId });
  const strategyWithRouting = Object.freeze({ ...primaryStrategy, playerId, perspectivePlayerId });
  const recommendations = (base.recommendations ?? []).map((recommendation) => {
    const options = [
      ...terrainOptions(state, recommendation, deathTrap, strategyWithRouting),
      ...objectiveOptions(state, recommendation, spatial, { playerId, perspectivePlayerId }, strategyWithRouting)
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
      territoryTarget: null,
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
