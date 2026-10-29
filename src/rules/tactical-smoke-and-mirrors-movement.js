import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { objectiveAdvisorLabel } from "./objective-display-labels.js";
import { getSpatialContext } from "./spatial-context.js";
import {
  getSmokeAndMirrorsObjectiveStrategySignal,
  getSmokeAndMirrorsPrimaryStrategyContext
} from "./tactical-smoke-and-mirrors-strategy.js";
import { clamp01 } from "./tactical-context-utils.js";

function purposeFor(control, signal) {
  if (!signal?.decoyed && !signal?.pendingDecoy) return "set-decoy";
  if (signal?.pendingDecoy) return "complete-decoy";
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

function actionHint(option, movement) {
  if (option.purpose === "set-decoy") {
    if (option.distance <= 3) return "Stay within tabletop objective range; in Shooting start Decoy and preserve control through end of turn";
    if (Number.isFinite(movement) && option.distance <= movement + 3) return "Move into tabletop objective range, then start Decoy in Shooting and preserve control through end of turn";
    return "Reposition toward this objective; confirm actual range on the tabletop before planning the Decoy Action";
  }
  if (option.purpose === "complete-decoy") return "Preserve control through end of turn so the pending Decoy Action completes";
  if (option.distance <= 3) return "Hold or make only a small reposition";
  if (Number.isFinite(movement) && option.distance <= movement + 3) return "A Normal Move can plausibly reach the objective area";
  return "Reposition toward this objective without assuming exact legality from the map";
}

function recommendationText(unitName, option) {
  const signal = option.primaryStrategySignal;
  if (option.purpose === "set-decoy") {
    if (signal?.endgameVpLeverage > 0) {
      return `${unitName}: set up a Decoy at ${option.objectiveName}; this can establish the fourth persistent marker and the endgame threshold.`;
    }
    if (signal?.enemyTerritory) {
      return `${unitName}: pressure ${option.objectiveName} for a Decoy; an enemy-territory marker is worth 4 raw VP every end turn while it survives.`;
    }
    return `${unitName}: move toward ${option.objectiveName} to create another persistent Decoy scoring point.`;
  }
  if (option.purpose === "complete-decoy") return `${unitName}: preserve control of ${option.objectiveName} so the pending Decoy completes at end of turn.`;
  if (signal?.decoyed) return `${unitName}: protect useful control around ${option.objectiveName}; its Decoy marker already scores independently while it survives.`;
  return `${unitName}: maintain useful non-home objective pressure for Smoke and Mirrors.`;
}

function missionOption(state, { playerId, perspectivePlayerId, recommendation, entry, primaryStrategy }) {
  const ocFactor = usableOcFactor(recommendation);
  if (ocFactor <= 0) return null;
  const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: entry.objectiveId });
  const signal = getSmokeAndMirrorsObjectiveStrategySignal(state, {
    playerId,
    perspectivePlayerId,
    objectiveId: entry.objectiveId,
    control,
    primaryStrategy
  });
  const missionRelevant = signal.active && !signal.ownHome && (
    signal.decoyActionVpLeverage > 0 ||
    signal.pendingCompletionVpLeverage > 0 ||
    signal.controlVpLeverage > 0 ||
    signal.controlPreservationVpLeverage > 0 ||
    signal.stagingVpLeverage > 0 ||
    signal.endgameVpLeverage > 0 ||
    signal.score >= 0.35
  );
  if (!missionRelevant) return null;
  const purpose = purposeFor(control, signal);
  const score = clamp01(0.1 + reachBoost(entry.distance, recommendation.movement) + signal.score * ocFactor);
  const objectiveName = objectiveAdvisorLabel(state, entry.objectiveId, perspectivePlayerId);
  const ocText = Number.isFinite(Number(recommendation?.effectiveOc))
    ? ` This formation currently contributes about ${Number(recommendation.effectiveOc)} usable OC.`
    : "";
  const option = {
    kind: "objective",
    purpose,
    score,
    objectiveId: entry.objectiveId,
    objectiveName,
    distance: entry.distance,
    control,
    primaryStrategySignal: signal,
    confidence: Number.isFinite(recommendation.movement) ? "moderate" : "low",
    reason: `${objectiveName} is about ${entry.distance}\" away on the approximate map.${ocText} ${signal.reason}`
  };
  option.actionHint = actionHint(option, recommendation.movement);
  return Object.freeze(option);
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

export function enhanceSmokeAndMirrorsMovementRecommendations(state, base, { playerId, perspectivePlayerId = playerId } = {}) {
  const primaryStrategy = getSmokeAndMirrorsPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
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
