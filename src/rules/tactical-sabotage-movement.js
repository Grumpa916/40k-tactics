import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { objectiveAdvisorLabel } from "./objective-display-labels.js";
import { getSpatialContext } from "./spatial-context.js";
import { getSabotageState } from "./sabotage-state.js";
import {
  getSabotageObjectiveStrategySignal,
  getSabotagePrimaryStrategyContext
} from "./tactical-sabotage-strategy.js";
import { clamp01 } from "./tactical-context-utils.js";

function reachBoost(distance, movement) {
  if (!Number.isFinite(distance)) return 0;
  if (distance <= 3) return 0.28;
  if (Number.isFinite(movement) && distance <= movement + 3) return 0.2;
  if (Number.isFinite(movement) && distance <= movement + 9) return 0.1;
  return 0.02;
}

function purposeFor(control) {
  if (control === "controlled") return "hold-objective";
  if (control === "enemy-controlled") return "contest-objective";
  if (control === "contested" || control === "contested-by-others") return "swing-objective";
  return "claim-objective";
}

function sameDestination(first, second) {
  return Boolean(first?.objectiveId && second?.objectiveId && first.objectiveId === second.objectiveId);
}

function recommendationText(unitName, option) {
  const signal = option.primaryStrategySignal;
  if (signal.pending && option.pendingActingUnit) {
    return `${unitName}: preserve position at ${option.objectiveName}; this unit has a pending Sabotage Action that needs the objective controlled at end of turn.`;
  }
  if (signal.pending) {
    return `${unitName}: support control of ${option.objectiveName}; a friendly Sabotage attempt is pending there through end of turn.`;
  }
  if (signal.eligibleForAction) {
    return `${unitName}: move toward ${option.objectiveName} to set up a Sabotage Action${signal.enemyTerritory ? " and its +2 VP enemy-territory bonus" : ""}.`;
  }
  if (signal.controlVpLeverage > 0 && option.purpose === "hold-objective") {
    return `${unitName}: preserve ${option.objectiveName}; it currently carries Sabotage's recurring 4 VP control condition.`;
  }
  if (signal.controlVpLeverage > 0) {
    return `${unitName}: pressure ${option.objectiveName}; taking it can establish Sabotage's recurring 4 VP control condition.`;
  }
  return `${unitName}: preserve ${option.objectiveName} for Sabotage mission value.`;
}

function objectiveOptions(state, recommendation, spatial, sabotage, { playerId, perspectivePlayerId }, primaryStrategy) {
  return (spatial.objectiveProximity ?? [])
    .filter((entry) => entry.unitId === recommendation.unitId)
    .map((entry) => {
      const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: entry.objectiveId });
      const purpose = purposeFor(control);
      const signal = getSabotageObjectiveStrategySignal(state, {
        playerId,
        perspectivePlayerId,
        objectiveId: entry.objectiveId,
        control,
        purpose,
        primaryStrategy
      });
      if (!signal.active || signal.vpLeverage <= 0 && signal.score < 0.2) return null;

      const pendingAttempt = sabotage.pendingAttempts.find((attempt) => attempt.objectiveId === entry.objectiveId) ?? null;
      const pendingActingUnit = pendingAttempt?.unitId === recommendation.unitId;
      const cannotControl = recommendation.battleShocked === true || recommendation.effectiveOc === 0;
      let score = clamp01(0.1 + reachBoost(entry.distance, recommendation.movement) + signal.score + (pendingActingUnit ? 0.12 : 0));
      if (cannotControl && (signal.controlVpLeverage > 0 || signal.actionVpLeverage > 0)) score = Math.min(score, 0.22);
      const objectiveName = objectiveAdvisorLabel(state, entry.objectiveId, perspectivePlayerId);

      let actionHint;
      if (cannotControl && (signal.controlVpLeverage > 0 || signal.actionVpLeverage > 0)) {
        actionHint = "Do not rely on this unit for the control-dependent Sabotage plan until its effective OC is restored";
      } else if (pendingActingUnit) {
        actionHint = "Keep this unit within range and preserve control of the selected objective through end of turn";
      } else if (signal.pending) {
        actionHint = "Support control of this objective so the pending Sabotage Action can complete";
      } else if (signal.eligibleForAction && entry.distance <= 3) {
        actionHint = "Confirm objective range on the tabletop, then start Sabotage in the Shooting phase";
      } else if (signal.eligibleForAction && Number.isFinite(recommendation.movement) && entry.distance <= recommendation.movement + 3) {
        actionHint = "A Normal Move can plausibly reach objective range for a Sabotage attempt; confirm exact range on the tabletop";
      } else {
        actionHint = "Reposition toward this objective without assuming exact legality from the approximate map";
      }

      return Object.freeze({
        kind: "objective",
        purpose,
        score,
        objectiveId: entry.objectiveId,
        objectiveName,
        terrainAreaId: null,
        distance: entry.distance,
        control,
        pendingActingUnit,
        primaryStrategySignal: signal,
        confidence: Number.isFinite(recommendation.movement) ? "moderate" : "low",
        actionHint,
        reason: `${objectiveName} is about ${entry.distance}\" away on the approximate map. ${signal.reason}${cannotControl && (signal.controlVpLeverage > 0 || signal.actionVpLeverage > 0) ? " This unit currently has no reliable effective OC for the control-dependent plan." : ""}`
      });
    })
    .filter(Boolean);
}

export function enhanceSabotageMovementRecommendations(state, base, {
  playerId,
  perspectivePlayerId = playerId
} = {}) {
  const primaryStrategy = getSabotagePrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const sabotage = getSabotageState(state, { playerId, perspectivePlayerId });
  const spatial = getSpatialContext(state, { playerId });
  const recommendations = (base.recommendations ?? []).map((recommendation) => {
    const options = objectiveOptions(state, recommendation, spatial, sabotage, { playerId, perspectivePlayerId }, primaryStrategy)
      .sort((a, b) => b.score - a.score);
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
      objectiveId: best.objectiveId,
      objectiveName: best.objectiveName,
      terrainAreaId: null,
      targetUnitId: null,
      targetName: null,
      territoryTarget: best.primaryStrategySignal?.enemyTerritory ? "opponent" : null,
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
