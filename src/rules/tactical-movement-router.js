import { getMovementStrategicRecommendations as getBaseMovementStrategicRecommendations } from "./tactical-movement-opportunities.js";
import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { objectiveAdvisorLabel } from "./objective-display-labels.js";
import { getSpatialContext } from "./spatial-context.js";
import { isConsecrateMissionForPlayer } from "./consecrate-state.js";
import {
  getConsecrateObjectiveStrategySignal,
  getConsecratePrimaryStrategyContext
} from "./tactical-consecrate-strategy.js";
import {
  getBattlefieldDominanceObjectiveStrategySignal,
  getBattlefieldDominancePrimaryStrategyContext,
  isBattlefieldDominanceMissionForPlayer
} from "./tactical-battlefield-dominance-strategy.js";
import { isImmovableObjectMissionForPlayer } from "./tactical-immovable-object-strategy.js";
import { enhanceImmovableObjectMovementRecommendations } from "./tactical-immovable-object-movement.js";
import { isDeterminedAcquisitionMissionForPlayer } from "./tactical-determined-acquisition-strategy.js";
import { enhanceDeterminedAcquisitionMovementRecommendations } from "./tactical-determined-acquisition-movement.js";
import { isPurgeAndSecureMissionForPlayer } from "./tactical-purge-and-secure-strategy.js";
import { enhancePurgeAndSecureMovementRecommendations } from "./tactical-purge-and-secure-movement.js";
import { isInescapableDominionMissionForPlayer } from "./tactical-inescapable-dominion-strategy.js";
import { enhanceInescapableDominionMovementRecommendations } from "./tactical-inescapable-dominion-movement.js";
import { isDeathTrapMissionForPlayer } from "./tactical-death-trap-strategy.js";
import { enhanceDeathTrapMovementRecommendations } from "./tactical-death-trap-movement.js";
import { isDelayingActionMissionForPlayer } from "./tactical-delaying-action-strategy.js";
import { enhanceDelayingActionMovementRecommendations } from "./tactical-delaying-action-movement.js";
import { isOutmanoeuvreMissionForPlayer } from "./tactical-outmanoeuvre-strategy.js";
import { enhanceOutmanoeuvreMovementRecommendations } from "./tactical-outmanoeuvre-movement.js";
import { isSmokeAndMirrorsMissionForPlayer } from "./smoke-and-mirrors-state.js";
import { enhanceSmokeAndMirrorsMovementRecommendations } from "./tactical-smoke-and-mirrors-movement.js";
import { isReconnaissanceSweepMissionForPlayer } from "./tactical-reconnaissance-sweep-strategy.js";
import { enhanceReconnaissanceSweepMovementRecommendations } from "./tactical-reconnaissance-sweep-movement.js";
import { clamp01 } from "./tactical-context-utils.js";

function purposeFor(control, signal) {
  if (signal.unitIsConsecration && signal.availableToConsecrate) return "consecrate-objective";
  if (control === "controlled") return "hold-objective";
  if (control === "enemy-controlled") return "contest-objective";
  if (control === "contested" || control === "contested-by-others") return "swing-objective";
  return "claim-objective";
}

function standardObjectivePurpose(control) {
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

function actionHint(purpose, distance, movement) {
  if (purpose === "consecrate-objective") {
    if (distance <= 3) return "Stay within tabletop range through end of turn, then consecrate this objective";
    if (Number.isFinite(movement) && distance <= movement + 3) return "Move into tabletop objective range and preserve the consecration unit through end of turn";
    return "Reposition toward this objective; confirm actual range on the tabletop before relying on Consecrate";
  }
  if (distance <= 3) return "Hold or make only a small reposition";
  if (Number.isFinite(movement) && distance <= movement + 3) return "A Normal Move can plausibly reach the objective area";
  return "Reposition toward this objective without assuming exact legality from the map";
}

function recommendationText(unitName, option) {
  if (option.purpose === "consecrate-objective") return `${unitName}: move or remain within range of ${option.objectiveName} so this consecration unit can mark it at end of turn.`;
  if (option.purpose === "hold-objective") return `${unitName}: preserve ${option.objectiveName}; it currently supports Consecrate control scoring.`;
  if (option.purpose === "contest-objective") return `${unitName}: pressure ${option.objectiveName} to improve Consecrate objective control.`;
  return `${unitName}: move toward ${option.objectiveName} for Consecrate mission value.`;
}

function battlefieldDominanceRecommendationText(unitName, option) {
  if (option.primaryStrategySignal?.ownHome) {
    return option.purpose === "hold-objective"
      ? `${unitName}: preserve ${option.objectiveName}; your home objective multiplies Battlefield Dominance scoring on other controlled objectives.`
      : `${unitName}: secure ${option.objectiveName}; restoring your home objective activates the Battlefield Dominance multiplier.`;
  }
  if (option.purpose === "hold-objective") return `${unitName}: preserve ${option.objectiveName}; it carries direct Battlefield Dominance VP and can protect the objective majority.`;
  if (option.purpose === "contest-objective" || option.purpose === "swing-objective") return `${unitName}: pressure ${option.objectiveName}; changing this objective can improve both Battlefield Dominance VP and the objective count.`;
  return `${unitName}: move toward ${option.objectiveName} for Battlefield Dominance scoring value.`;
}

function consecrateOption(state, {
  playerId,
  perspectivePlayerId,
  unitRecommendation,
  entry,
  primaryStrategy
}) {
  const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: entry.objectiveId });
  const provisionalPurpose = control === "controlled" ? "hold-objective" : control === "enemy-controlled" ? "contest-objective" : "claim-objective";
  const signal = getConsecrateObjectiveStrategySignal(state, {
    playerId,
    perspectivePlayerId,
    objectiveId: entry.objectiveId,
    unitId: unitRecommendation.unitId,
    control,
    purpose: provisionalPurpose,
    primaryStrategy
  });
  if (!signal.active) return null;
  const missionRelevant = signal.unitIsConsecration && signal.availableToConsecrate || signal.vpLeverage > 0 || signal.score >= 0.2;
  if (!missionRelevant) return null;
  const purpose = purposeFor(control, signal);
  const score = clamp01(0.16 + reachBoost(entry.distance, unitRecommendation.movement) + signal.score);
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
    actionHint: actionHint(purpose, entry.distance, unitRecommendation.movement),
    confidence: Number.isFinite(unitRecommendation.movement) ? "moderate" : "low",
    reason: `${objectiveName} is about ${entry.distance}\" away on the approximate map. ${signal.reason}`
  });
}

function battlefieldDominanceOption(state, {
  playerId,
  perspectivePlayerId,
  unitRecommendation,
  entry,
  primaryStrategy
}) {
  const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: entry.objectiveId });
  const purpose = standardObjectivePurpose(control);
  const signal = getBattlefieldDominanceObjectiveStrategySignal(state, {
    playerId,
    perspectivePlayerId,
    objectiveId: entry.objectiveId,
    control,
    purpose,
    primaryStrategy
  });
  if (!signal.active || signal.vpLeverage <= 0 && signal.score < 0.18) return null;
  const score = clamp01(0.14 + reachBoost(entry.distance, unitRecommendation.movement) + signal.score);
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
    actionHint: actionHint(purpose, entry.distance, unitRecommendation.movement),
    confidence: Number.isFinite(unitRecommendation.movement) ? "moderate" : "low",
    reason: `${objectiveName} is about ${entry.distance}\" away on the approximate map. ${signal.reason}`
  });
}

function enhanceRecommendation(state, options, recommendation, spatial, primaryStrategy) {
  const entries = (spatial.objectiveProximity ?? []).filter((entry) => entry.unitId === recommendation.unitId);
  const missionOptions = entries.map((entry) => consecrateOption(state, {
    ...options,
    unitRecommendation: recommendation,
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

function enhanceBattlefieldDominanceRecommendation(state, options, recommendation, spatial, primaryStrategy) {
  const entries = (spatial.objectiveProximity ?? []).filter((entry) => entry.unitId === recommendation.unitId);
  const missionOptions = entries.map((entry) => battlefieldDominanceOption(state, {
    ...options,
    unitRecommendation: recommendation,
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
    distance: best.distance,
    control: best.control,
    primaryStrategySignal: best.primaryStrategySignal,
    targetUnitId: null,
    targetName: null,
    territoryTarget: null,
    strategicContext: null,
    recommendation: battlefieldDominanceRecommendationText(recommendation.unitName, best),
    reason: best.reason,
    alternatives: Object.freeze([
      ...(recommendation.alternatives ?? []),
      ...missionOptions.slice(1)
    ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2))
  });
}

export function getMovementStrategicRecommendations(state, { playerId, perspectivePlayerId = playerId } = {}) {
  const base = getBaseMovementStrategicRecommendations(state, { playerId, perspectivePlayerId });
  if (!playerId || state?.phase !== "movement") return base;

  const spatial = getSpatialContext(state, { playerId });
  if (isConsecrateMissionForPlayer(state, playerId, perspectivePlayerId)) {
    const primaryStrategy = getConsecratePrimaryStrategyContext(state, { playerId, perspectivePlayerId });
    const recommendations = (base.recommendations ?? []).map((recommendation) =>
      enhanceRecommendation(state, { playerId, perspectivePlayerId }, recommendation, spatial, primaryStrategy)
    ).sort((a, b) => b.score - a.score || b.priority - a.priority || a.unitName.localeCompare(b.unitName));
    return Object.freeze({
      ...base,
      primaryStrategy,
      recommendations: Object.freeze(recommendations)
    });
  }

  if (isBattlefieldDominanceMissionForPlayer(state, playerId, perspectivePlayerId)) {
    const primaryStrategy = getBattlefieldDominancePrimaryStrategyContext(state, { playerId, perspectivePlayerId });
    const recommendations = (base.recommendations ?? []).map((recommendation) =>
      enhanceBattlefieldDominanceRecommendation(state, { playerId, perspectivePlayerId }, recommendation, spatial, primaryStrategy)
    ).sort((a, b) => b.score - a.score || b.priority - a.priority || a.unitName.localeCompare(b.unitName));
    return Object.freeze({
      ...base,
      primaryStrategy,
      recommendations: Object.freeze(recommendations)
    });
  }

  if (isImmovableObjectMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return enhanceImmovableObjectMovementRecommendations(state, base, { playerId, perspectivePlayerId });
  }

  if (isDeterminedAcquisitionMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return enhanceDeterminedAcquisitionMovementRecommendations(state, base, { playerId, perspectivePlayerId });
  }

  if (isPurgeAndSecureMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return enhancePurgeAndSecureMovementRecommendations(state, base, { playerId, perspectivePlayerId });
  }

  if (isInescapableDominionMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return enhanceInescapableDominionMovementRecommendations(state, base, { playerId, perspectivePlayerId });
  }

  if (isDeathTrapMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return enhanceDeathTrapMovementRecommendations(state, base, { playerId, perspectivePlayerId });
  }

  if (isDelayingActionMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return enhanceDelayingActionMovementRecommendations(state, base, { playerId, perspectivePlayerId });
  }

  if (isOutmanoeuvreMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return enhanceOutmanoeuvreMovementRecommendations(state, base, { playerId, perspectivePlayerId });
  }

  if (isSmokeAndMirrorsMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return enhanceSmokeAndMirrorsMovementRecommendations(state, base, { playerId, perspectivePlayerId });
  }

  if (isReconnaissanceSweepMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return enhanceReconnaissanceSweepMovementRecommendations(state, base, { playerId, perspectivePlayerId });
  }

  return base;
}
