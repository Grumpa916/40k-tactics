import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { objectiveAdvisorLabel } from "./objective-display-labels.js";
import { getSpatialContext } from "./spatial-context.js";
import {
  getPurgeAndSecureObjectiveStrategySignal,
  getPurgeAndSecurePrimaryStrategyContext
} from "./tactical-purge-and-secure-strategy.js";
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

function actionHint(purpose, distance, movement) {
  if (distance <= 3) return purpose === "hold-objective" ? "Hold or make only a small reposition" : "Confirm tabletop control after positioning";
  if (Number.isFinite(movement) && distance <= movement + 3) return "A Normal Move can plausibly reach the objective area";
  return "Reposition toward this objective without assuming exact legality from the map";
}

function recommendationText(unitName, option) {
  const signal = option.primaryStrategySignal;
  if (signal?.acquisitionEligible && !signal.controlledNow && signal.acquisitionVpLeverage > 0) {
    return `${unitName}: pressure ${option.objectiveName}; taking it can satisfy the 3 VP Purge and Secure new-capture condition${signal.checkpointVpLeverage > 0 ? " while adding non-home control value" : ""}.`;
  }
  if (signal?.acquisitionAlreadySecured && signal.acquisitionVpLeverage > 0) {
    return `${unitName}: preserve ${option.objectiveName} through end of turn; it currently supports the single 3 VP new-capture condition and non-home control scoring.`;
  }
  if (option.purpose === "hold-objective") return `${unitName}: preserve ${option.objectiveName}; each controlled non-home objective is worth 4 VP at the applicable Purge and Secure checkpoint.`;
  return `${unitName}: pressure ${option.objectiveName}; non-home control is the core Purge and Secure objective value.`;
}

function missionOption(state, { playerId, perspectivePlayerId, recommendation, entry, primaryStrategy }) {
  const ocFactor = usableOcFactor(recommendation);
  if (ocFactor <= 0) return null;
  const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: entry.objectiveId });
  const purpose = purposeFor(control);
  const signal = getPurgeAndSecureObjectiveStrategySignal(state, {
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
    distance: entry.distance,
    control,
    primaryStrategySignal: signal,
    actionHint: actionHint(purpose, entry.distance, recommendation.movement),
    confidence: Number.isFinite(recommendation.movement) ? "moderate" : "low",
    reason: `${objectiveName} is about ${entry.distance}\" away on the approximate map.${ocText} ${signal.reason}`
  });
}

function enhanceRecommendation(state, options, recommendation, spatial, primaryStrategy) {
  const entries = (spatial.objectiveProximity ?? []).filter((entry) => entry.unitId === recommendation.unitId);
  const missionOptions = entries.map((entry) => missionOption(state, {
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
    strategicContext: null,
    primaryStrategySignal: best.primaryStrategySignal,
    recommendation: recommendationText(recommendation.unitName, best),
    reason: best.reason,
    alternatives: Object.freeze([
      ...(recommendation.alternatives ?? []),
      ...missionOptions.slice(1)
    ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2))
  });
}

export function enhancePurgeAndSecureMovementRecommendations(state, base, { playerId, perspectivePlayerId = playerId } = {}) {
  const primaryStrategy = getPurgeAndSecurePrimaryStrategyContext(state, { playerId, perspectivePlayerId });
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
