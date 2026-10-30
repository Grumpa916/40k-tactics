import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { objectiveAdvisorLabel } from "./objective-display-labels.js";
import { getSpatialContext } from "./spatial-context.js";
import {
  getSearchAndScourObjectiveStrategySignal,
  getSearchAndScourPrimaryStrategyContext
} from "./tactical-search-and-scour-strategy.js";
import { clamp01 } from "./tactical-context-utils.js";

function purposeFor(control) {
  if (control === "controlled") return "hold-objective";
  if (control === "enemy-controlled") return "contest-objective";
  if (control === "contested" || control === "contested-by-others") return "swing-objective";
  return "claim-objective";
}

function reachBoost(distance, movement) {
  if (!Number.isFinite(distance)) return 0;
  if (distance <= 3) return 0.28;
  if (Number.isFinite(movement) && distance <= movement + 3) return 0.2;
  if (Number.isFinite(movement) && distance <= movement + 9) return 0.11;
  return 0.03;
}

function usableOcFactor(recommendation) {
  if (recommendation?.battleShocked === true) return 0;
  const effectiveOc = Number(recommendation?.effectiveOc);
  if (Number.isFinite(effectiveOc)) {
    if (effectiveOc <= 0) return 0;
    return 0.58 + 0.42 * clamp01(effectiveOc / 8);
  }
  return 0.7;
}

function objectiveActionHint(purpose, distance, movement) {
  if (distance <= 3) return purpose === "hold-objective"
    ? "Hold or make only a small reposition"
    : "Confirm tabletop control after positioning";
  if (Number.isFinite(movement) && distance <= movement + 3) return "A Normal Move can plausibly reach the objective area";
  return "Reposition toward this objective without assuming exact legality from the map";
}

function objectiveRecommendationText(unitName, option) {
  const signal = option.primaryStrategySignal;
  if (signal?.central && signal?.nonHomeVpLeverage > 0) {
    return option.purpose === "hold-objective"
      ? `${unitName}: preserve ${option.objectiveName}; it can support both Search and Scour central-control and non-home-objective scoring.`
      : `${unitName}: prioritize ${option.objectiveName}; a central non-home objective can satisfy both Search and Scour scoring lanes.`;
  }
  if (signal?.centralVpLeverage > 0) {
    return option.purpose === "hold-objective"
      ? `${unitName}: preserve ${option.objectiveName}; it protects the 3 VP end-of-turn central condition.`
      : `${unitName}: move toward ${option.objectiveName}; securing a central objective can add 3 VP at end of turn.`;
  }
  if (signal?.nonHomeVpLeverage > 0) {
    return option.purpose === "hold-objective"
      ? `${unitName}: preserve ${option.objectiveName}; it is worth 4 VP at the active Search and Scour control checkpoint.`
      : `${unitName}: pressure ${option.objectiveName}; each non-home objective is worth 4 VP at the active checkpoint.`;
  }
  if (signal?.nextCheckpointVpLeverage > 0) {
    return `${unitName}: stage on ${option.objectiveName}; the current Command checkpoint has passed, but this can set up 4 VP at the next Search and Scour checkpoint.`;
  }
  return `${unitName}: maintain useful objective pressure for Search and Scour.`;
}

function objectiveOption(state, { playerId, perspectivePlayerId, recommendation, entry, primaryStrategy }) {
  const ocFactor = usableOcFactor(recommendation);
  if (ocFactor <= 0) return null;
  const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: entry.objectiveId });
  const purpose = purposeFor(control);
  const signal = getSearchAndScourObjectiveStrategySignal(state, {
    playerId,
    perspectivePlayerId,
    objectiveId: entry.objectiveId,
    control,
    purpose,
    primaryStrategy
  });
  if (!signal.active || signal.vpLeverage <= 0 && signal.nextCheckpointVpLeverage <= 0 && signal.score < 0.2) return null;
  const score = clamp01(0.12 + reachBoost(entry.distance, recommendation.movement) + signal.score * ocFactor);
  const objectiveName = objectiveAdvisorLabel(state, entry.objectiveId, perspectivePlayerId);
  return Object.freeze({
    kind: "objective",
    purpose,
    score,
    objectiveId: entry.objectiveId,
    objectiveName,
    distance: entry.distance,
    control,
    primaryStrategySignal: signal,
    actionHint: objectiveActionHint(purpose, entry.distance, recommendation.movement),
    confidence: Number.isFinite(recommendation.movement) ? "moderate" : "low",
    reason: `${objectiveName} is about ${entry.distance}\" away on the approximate map. ${signal.reason}`
  });
}

function blockerOption(state, { playerId, perspectivePlayerId, recommendation, entry, primaryStrategy }) {
  const blockerIds = new Set(primaryStrategy.territoryBlockerUnitIds ?? []);
  if (!blockerIds.has(entry.otherUnitId)) return null;
  const target = (state?.units ?? []).find((unit) => unit?.id === entry.otherUnitId);
  if (!target || target.status === "destroyed") return null;
  const targetStrategy = getSearchAndScourPrimaryStrategyContext(state, {
    playerId,
    perspectivePlayerId,
    targetUnitId: target.id
  });
  const proximity = clamp01(1 - Math.max(0, entry.distance) / 36);
  const moveReach = Number.isFinite(recommendation.movement) && entry.distance <= recommendation.movement + 12
    ? 0.16
    : Number.isFinite(recommendation.movement) && entry.distance <= recommendation.movement + 18
      ? 0.08
      : 0.02;
  const score = clamp01(0.18 + proximity * 0.2 + moveReach + targetStrategy.targetingScore * 0.5);
  return Object.freeze({
    kind: "target",
    purpose: "clear-own-territory",
    score,
    targetUnitId: target.id,
    targetName: target.name ?? target.id,
    distance: entry.distance,
    primaryStrategySignal: targetStrategy.targetOpportunity,
    actionHint: "Reposition to pressure this intruder while preserving higher-value objective plays; confirm actual ranges on the tabletop",
    confidence: Number.isFinite(recommendation.movement) ? "moderate" : "low",
    reason: `${target.name ?? target.id} is about ${entry.distance}\" away and is mapped clearly inside your territory. ${targetStrategy.reason}`
  });
}

function enhanceRecommendation(state, options, recommendation, spatial, primaryStrategy) {
  const objectiveEntries = (spatial.objectiveProximity ?? []).filter((entry) => entry.unitId === recommendation.unitId);
  const unitEntries = (spatial.unitProximity ?? []).filter((entry) => entry.unitId === recommendation.unitId);
  const missionOptions = [
    ...objectiveEntries.map((entry) => objectiveOption(state, { ...options, recommendation, entry, primaryStrategy })),
    ...unitEntries.map((entry) => blockerOption(state, { ...options, recommendation, entry, primaryStrategy }))
  ].filter(Boolean).sort((a, b) => b.score - a.score);
  const best = missionOptions[0];
  if (!best) return recommendation;

  if (best.score <= recommendation.score) {
    return Object.freeze({
      ...recommendation,
      alternatives: Object.freeze([
        ...(recommendation.alternatives ?? []),
        ...missionOptions
      ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2))
    });
  }

  if (best.kind === "target") {
    return Object.freeze({
      ...recommendation,
      score: best.score,
      priority: best.score >= 0.8 ? 5 : best.score >= 0.65 ? 4 : best.score >= 0.48 ? 3 : best.score >= 0.3 ? 2 : 1,
      purpose: best.purpose,
      confidence: best.confidence,
      actionHint: best.actionHint,
      objectiveId: null,
      objectiveName: null,
      targetUnitId: best.targetUnitId,
      targetName: best.targetName,
      territoryTarget: "mine",
      distance: best.distance,
      primaryStrategySignal: best.primaryStrategySignal,
      recommendation: `${recommendation.unitName}: pressure ${best.targetName}; it is a likely blocker to Search and Scour's 5 VP endgame territory condition.`,
      reason: best.reason,
      alternatives: Object.freeze(missionOptions.slice(1, 3))
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
    targetUnitId: null,
    targetName: null,
    territoryTarget: null,
    distance: best.distance,
    primaryStrategySignal: best.primaryStrategySignal,
    recommendation: objectiveRecommendationText(recommendation.unitName, best),
    reason: best.reason,
    alternatives: Object.freeze(missionOptions.slice(1, 3))
  });
}

export function enhanceSearchAndScourMovementRecommendations(state, base, {
  playerId,
  perspectivePlayerId = playerId
} = {}) {
  const primaryStrategy = getSearchAndScourPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const spatial = getSpatialContext(state, { playerId });
  const recommendations = (base.recommendations ?? []).map((recommendation) =>
    enhanceRecommendation(state, { playerId, perspectivePlayerId }, recommendation, spatial, primaryStrategy)
  ).sort((a, b) => b.score - a.score || b.priority - a.priority || a.unitName.localeCompare(b.unitName));
  return Object.freeze({
    ...base,
    primaryStrategy,
    recommendations: Object.freeze(recommendations)
  });
}
