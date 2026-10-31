import { getEventCompanionMapForForceDispositions } from "./event-companion-map-catalog.js";
import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { objectiveAdvisorLabel } from "./objective-display-labels.js";
import { getLiveUnitPosition, getSpatialContext } from "./spatial-context.js";
import {
  getExtractRelicObjectiveStrategySignal,
  getExtractRelicPrimaryStrategyContext
} from "./tactical-extract-relic-strategy.js";
import { clamp01 } from "./tactical-context-utils.js";

function standardObjectivePurpose(control) {
  if (control === "controlled") return "hold-objective";
  if (control === "enemy-controlled") return "contest-objective";
  if (control === "contested" || control === "contested-by-others") return "swing-objective";
  return "claim-objective";
}

function reachBoost(distance, movement) {
  if (!Number.isFinite(distance)) return 0;
  if (distance <= 3) return 0.24;
  if (Number.isFinite(movement) && distance <= movement + 3) return 0.18;
  if (Number.isFinite(movement) && distance <= movement + 9) return 0.09;
  return 0.02;
}

function objectiveActionHint(signal, distance, movement, cannotControl) {
  if (cannotControl && (signal.pending || signal.eligibleSensorSweepObjective || signal.controlVpLeverage > 0)) {
    return "Do not rely on this unit for Extract Relic control-dependent scoring until its effective OC is restored";
  }
  if (signal.pending) return "Preserve tabletop objective range and control through end of turn so Sensor Sweep can complete";
  if (signal.eligibleSensorSweepObjective) {
    if (distance <= 3) return "Remain in tabletop objective range so this unit can start Sensor Sweep in Shooting";
    if (Number.isFinite(movement) && distance <= movement + 3) return "Move into tabletop objective range to set up Sensor Sweep in Shooting";
    return "Stage toward this central objective for a future Sensor Sweep attempt; confirm actual tabletop range";
  }
  if (distance <= 3) return "Hold or make only a small reposition";
  if (Number.isFinite(movement) && distance <= movement + 3) return "A Normal Move can plausibly reach the objective area";
  return "Reposition toward the objective without assuming exact legality from the map";
}

function objectiveRecommendationText(unitName, option) {
  const signal = option.primaryStrategySignal;
  if (signal.pending) return `${unitName}: preserve ${option.objectiveName} through end of turn so the pending Sensor Sweep can complete and remove its selected opponent marker.`;
  if (signal.eligibleSensorSweepObjective) return `${unitName}: move toward ${option.objectiveName} to set up this turn's Sensor Sweep and progress the opponent marker pool toward one.`;
  if (option.purpose === "hold-objective") return `${unitName}: preserve ${option.objectiveName}; it supports Extract Relic's binary non-home control condition.`;
  if (option.purpose === "contest-objective" || option.purpose === "swing-objective") return `${unitName}: pressure ${option.objectiveName} for Extract Relic control value.`;
  return `${unitName}: move toward ${option.objectiveName} for Extract Relic mission value.`;
}

function objectiveOption(state, { playerId, perspectivePlayerId, recommendation, entry, primaryStrategy }) {
  const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: entry.objectiveId });
  const purpose = standardObjectivePurpose(control);
  const signal = getExtractRelicObjectiveStrategySignal(state, { playerId, perspectivePlayerId, objectiveId: entry.objectiveId, control, purpose, primaryStrategy });
  if (!signal.active) return null;
  const missionRelevant = signal.pending || signal.eligibleSensorSweepObjective || signal.controlVpLeverage > 0 || signal.score >= 0.22;
  if (!missionRelevant) return null;
  const cannotControl = recommendation.battleShocked === true || recommendation.effectiveOc === 0;
  let score = clamp01(0.12 + reachBoost(entry.distance, recommendation.movement) + signal.score);
  if (cannotControl && (signal.pending || signal.eligibleSensorSweepObjective || signal.controlVpLeverage > 0)) score = Math.min(score, 0.22);
  const objectiveName = objectiveAdvisorLabel(state, entry.objectiveId, perspectivePlayerId);
  return Object.freeze({
    kind: "objective", purpose, score, objectiveId: entry.objectiveId, objectiveName, distance: entry.distance, control,
    primaryStrategySignal: signal,
    actionHint: objectiveActionHint(signal, entry.distance, recommendation.movement, cannotControl),
    confidence: Number.isFinite(recommendation.movement) ? "moderate" : "low",
    reason: `${objectiveName} is about ${entry.distance}\" away on the approximate map. ${signal.reason}${cannotControl ? " This unit currently has no reliable effective OC for the control-dependent plan." : ""}`
  });
}

function mapGeometry(state) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!setup?.myDisposition || !setup?.opponentDisposition || !setup?.layout) return null;
  return getEventCompanionMapForForceDispositions(setup.myDisposition, setup.opponentDisposition, setup.layout);
}

function terrainCentroid(points) {
  if (!Array.isArray(points) || points.length < 3) return null;
  return {
    x: points.reduce((sum, point) => sum + (Number(point?.x) || 0), 0) / points.length,
    y: points.reduce((sum, point) => sum + (Number(point?.y) || 0), 0) / points.length
  };
}

function terrainTarget(state, terrainAreaId) {
  const shape = mapGeometry(state)?.terrainGeometry?.[terrainAreaId];
  const center = terrainCentroid(shape?.points);
  return center ? Object.freeze({ terrainAreaId, position: center }) : null;
}

function mapDistance(first, second) {
  if (!Number.isFinite(first?.x) || !Number.isFinite(first?.y) || !Number.isFinite(second?.x) || !Number.isFinite(second?.y)) return null;
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function lastMarkerTerrainOption(state, recommendation, primaryStrategy) {
  if (primaryStrategy.activeOpponentMarkerCount !== 1 || primaryStrategy.lastMarkerPositionMapSatisfied || !primaryStrategy.lastOpponentMarkerTerrainAreaId) return null;
  const target = terrainTarget(state, primaryStrategy.lastOpponentMarkerTerrainAreaId);
  const unit = (state?.units ?? []).find((item) => item?.id === recommendation.unitId);
  const position = unit ? getLiveUnitPosition(state, unit) : null;
  const distance = target ? mapDistance(position, target.position) : null;
  if (!target || !Number.isFinite(distance)) return null;
  const unitAlreadyInside = primaryStrategy.friendlyUnitIdsInLastMarkerTerrain.includes(recommendation.unitId);
  const cannotControl = recommendation.battleShocked === true || recommendation.effectiveOc === 0;
  let score = clamp01(0.26 + reachBoost(distance, recommendation.movement) + (primaryStrategy.lastMarkerCurrentVpLeverage > 0 ? 0.3 : 0) + (primaryStrategy.endgameLastMarkerVp > 0 ? 0.12 : 0));
  if (unitAlreadyInside) score = Math.max(score, 0.82);
  if (cannotControl) score = Math.max(0.25, score - 0.08); // Terrain occupation itself does not require OC, so do not suppress heavily.
  const terrainName = primaryStrategy.lastOpponentMarkerTerrainAreaId;
  return Object.freeze({
    kind: "terrain",
    purpose: unitAlreadyInside ? "hold-relic-terrain" : "occupy-relic-terrain",
    score,
    objectiveId: null,
    objectiveName: null,
    terrainTarget: target,
    distance,
    control: null,
    primaryStrategySignal: Object.freeze({
      active: true,
      lastMarkerTerrain: true,
      lastMarkerCurrentVpLeverage: primaryStrategy.lastMarkerCurrentVpLeverage,
      endgameVpLeverage: primaryStrategy.endgameLastMarkerVp,
      enemyBlockerCount: primaryStrategy.enemyUnitIdsInLastMarkerTerrain.length
    }),
    actionHint: unitAlreadyInside
      ? "Remain within the physical terrain area while keeping enemy units out"
      : Number.isFinite(recommendation.movement) && distance <= recommendation.movement + 3
        ? "Move into the last-marker terrain area; confirm actual terrain occupancy on the tabletop"
        : "Stage toward the last-marker terrain area without assuming exact map reach",
    confidence: Number.isFinite(recommendation.movement) ? "moderate" : "low",
    reason: `${terrainName} is the last opponent marker terrain. The map places its centre about ${distance.toFixed(1)}\" away; physical terrain-area occupancy remains authoritative.`
  });
}

function enhanceRecommendation(state, options, recommendation, spatial, primaryStrategy) {
  const entries = (spatial.objectiveProximity ?? []).filter((entry) => entry.unitId === recommendation.unitId);
  const objectiveOptions = entries.map((entry) => objectiveOption(state, { ...options, recommendation, entry, primaryStrategy })).filter(Boolean);
  const terrainOption = lastMarkerTerrainOption(state, recommendation, primaryStrategy);
  const missionOptions = [...objectiveOptions, ...(terrainOption ? [terrainOption] : [])].sort((a, b) => b.score - a.score);
  const best = missionOptions[0];
  if (!best) return recommendation;
  if (best.score <= recommendation.score) {
    const sameObjective = best.objectiveId && recommendation.objectiveId === best.objectiveId;
    return Object.freeze({
      ...recommendation,
      primaryStrategySignal: sameObjective ? best.primaryStrategySignal : recommendation.primaryStrategySignal,
      reason: sameObjective ? `${recommendation.reason} ${best.primaryStrategySignal.reason ?? ""}`.trim() : recommendation.reason,
      alternatives: Object.freeze([...(recommendation.alternatives ?? []), ...missionOptions.filter((option) => !sameObjective || option !== best)]
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2))
    });
  }
  const signal = best.primaryStrategySignal;
  return Object.freeze({
    ...recommendation,
    score: best.score,
    priority: best.score >= 0.8 ? 5 : best.score >= 0.65 ? 4 : best.score >= 0.48 ? 3 : best.score >= 0.3 ? 2 : 1,
    purpose: best.purpose,
    confidence: best.confidence,
    actionHint: best.actionHint,
    objectiveId: best.objectiveId,
    objectiveName: best.objectiveName,
    targetUnitId: null,
    targetName: null,
    territoryTarget: null,
    terrainTarget: best.terrainTarget ?? null,
    distance: best.distance,
    control: best.control,
    strategicContext: null,
    primaryStrategySignal: signal,
    recommendation: best.kind === "terrain"
      ? `${recommendation.unitName}: ${best.purpose === "hold-relic-terrain" ? "hold" : "move toward"} ${primaryStrategy.lastOpponentMarkerTerrainAreaId}; the last opponent marker can support 4 VP at end of turn and 5 VP at battle end when the terrain-area condition is met.`
      : objectiveRecommendationText(recommendation.unitName, best),
    reason: best.reason,
    alternatives: Object.freeze([...(recommendation.alternatives ?? []), ...missionOptions.slice(1)]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2))
  });
}

export function enhanceExtractRelicMovementRecommendations(state, base, { playerId, perspectivePlayerId = playerId } = {}) {
  const primaryStrategy = getExtractRelicPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const spatial = getSpatialContext(state, { playerId });
  const recommendations = (base.recommendations ?? []).map((recommendation) =>
    enhanceRecommendation(state, { playerId, perspectivePlayerId }, recommendation, spatial, primaryStrategy)
  ).sort((a, b) => b.score - a.score || b.priority - a.priority || a.unitName.localeCompare(b.unitName));
  return Object.freeze({ ...base, primaryStrategy, recommendations: Object.freeze(recommendations) });
}
