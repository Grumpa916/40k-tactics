import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { objectiveAdvisorLabel } from "./objective-display-labels.js";
import { getSpatialContext } from "./spatial-context.js";
import {
  getGatherIntelObjectiveStrategySignal,
  getGatherIntelPrimaryStrategyContext
} from "./tactical-gather-intel-strategy.js";
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

function actionHint(signal, distance, movement, cannotControl) {
  if (cannotControl && (signal.pending || signal.eligibleExtractObjective || signal.controlVpLeverage > 0)) {
    return "Do not rely on this unit for control-dependent Gather Intel scoring until its effective OC is restored";
  }
  if (signal.pending) return "Preserve tabletop objective range and control through end of turn so Extract Intelligence can complete";
  if (signal.eligibleExtractObjective) {
    if (distance <= 3) return "Remain in tabletop objective range so this unit can start Extract Intelligence in Shooting";
    if (Number.isFinite(movement) && distance <= movement + 3) return "Move into tabletop objective range to set up Extract Intelligence in Shooting";
    return "Stage toward this unmarked objective for a future Extract Intelligence attempt; confirm actual tabletop range";
  }
  if (distance <= 3) return "Hold or make only a small reposition";
  if (Number.isFinite(movement) && distance <= movement + 3) return "A Normal Move can plausibly reach the objective area";
  return "Reposition toward the objective without assuming exact legality from the map";
}

function recommendationText(unitName, option) {
  const signal = option.primaryStrategySignal;
  if (signal.pending) return `${unitName}: preserve ${option.objectiveName} through end of turn so the pending Extract Intelligence action can complete.`;
  if (signal.eligibleExtractObjective && signal.opponentHome && signal.endgameVpLeverage > 0) return `${unitName}: move toward ${option.objectiveName} to set up Extract Intelligence and establish the opponent-home endgame marker bonus.`;
  if (signal.eligibleExtractObjective) return `${unitName}: move toward ${option.objectiveName} to set up Extract Intelligence on a different unmarked objective.`;
  if (signal.central && signal.controlVpLeverage > 0) return `${unitName}: pressure ${option.objectiveName}; central control is worth 6 VP in Round 1.`;
  if (option.purpose === "hold-objective") return `${unitName}: preserve ${option.objectiveName}; it supports the active Gather Intel control checkpoint.`;
  if (option.purpose === "contest-objective" || option.purpose === "swing-objective") return `${unitName}: pressure ${option.objectiveName} for Gather Intel control value.`;
  return `${unitName}: move toward ${option.objectiveName} for Gather Intel mission value.`;
}

function objectiveOption(state, {
  playerId,
  perspectivePlayerId,
  recommendation,
  entry,
  primaryStrategy
}) {
  const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: entry.objectiveId });
  const purpose = standardObjectivePurpose(control);
  const signal = getGatherIntelObjectiveStrategySignal(state, {
    playerId,
    perspectivePlayerId,
    objectiveId: entry.objectiveId,
    control,
    purpose,
    primaryStrategy
  });
  if (!signal.active) return null;

  const missionRelevant = signal.pending || signal.eligibleExtractObjective || signal.controlVpLeverage > 0 ||
    signal.endgameVpLeverage > 0 || signal.score >= 0.25;
  if (!missionRelevant) return null;

  const cannotControl = recommendation.battleShocked === true || recommendation.effectiveOc === 0;
  let score = clamp01(0.12 + reachBoost(entry.distance, recommendation.movement) + signal.score);
  if (cannotControl && (signal.pending || signal.eligibleExtractObjective || signal.controlVpLeverage > 0)) {
    score = Math.min(score, 0.22);
  }
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
    actionHint: actionHint(signal, entry.distance, recommendation.movement, cannotControl),
    confidence: Number.isFinite(recommendation.movement) ? "moderate" : "low",
    reason: `${objectiveName} is about ${entry.distance}\" away on the approximate map. ${signal.reason}${cannotControl ? " This unit currently has no reliable effective OC for the control-dependent plan." : ""}`
  });
}

function enhanceRecommendation(state, options, recommendation, spatial, primaryStrategy) {
  const entries = (spatial.objectiveProximity ?? []).filter((entry) => entry.unitId === recommendation.unitId);
  const missionOptions = entries.map((entry) => objectiveOption(state, {
    ...options,
    recommendation,
    entry,
    primaryStrategy
  })).filter(Boolean).sort((a, b) => b.score - a.score);
  const best = missionOptions[0];
  if (!best) return recommendation;

  if (best.score <= recommendation.score) {
    const sameObjective = recommendation.objectiveId === best.objectiveId;
    return Object.freeze({
      ...recommendation,
      primaryStrategySignal: sameObjective ? best.primaryStrategySignal : recommendation.primaryStrategySignal,
      reason: sameObjective ? `${recommendation.reason} ${best.primaryStrategySignal.reason}` : recommendation.reason,
      alternatives: Object.freeze([
        ...(recommendation.alternatives ?? []),
        ...missionOptions.filter((option) => option.objectiveId !== recommendation.objectiveId)
      ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2))
    });
  }

  const signal = best.primaryStrategySignal;
  return Object.freeze({
    ...recommendation,
    score: best.score,
    priority: best.score >= 0.8 ? 5 : best.score >= 0.65 ? 4 : best.score >= 0.48 ? 3 : best.score >= 0.3 ? 2 : 1,
    purpose: signal.pending ? "complete-extract-intelligence" : signal.eligibleExtractObjective ? "extract-intelligence" : best.purpose,
    confidence: best.confidence,
    actionHint: best.actionHint,
    objectiveId: best.objectiveId,
    objectiveName: best.objectiveName,
    targetUnitId: null,
    targetName: null,
    territoryTarget: null,
    distance: best.distance,
    control: best.control,
    strategicContext: null,
    primaryStrategySignal: signal,
    recommendation: recommendationText(recommendation.unitName, best),
    reason: best.reason,
    alternatives: Object.freeze([
      ...(recommendation.alternatives ?? []),
      ...missionOptions.slice(1)
    ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2))
  });
}

export function enhanceGatherIntelMovementRecommendations(state, base, {
  playerId,
  perspectivePlayerId = playerId
} = {}) {
  const primaryStrategy = getGatherIntelPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
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
