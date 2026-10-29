import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { objectiveAdvisorLabel } from "./objective-display-labels.js";
import { getLiveUnitPosition, getSpatialContext } from "./spatial-context.js";
import {
  RECONNAISSANCE_SWEEP_QUARTERS,
  getReconnaissanceSweepObjectiveStrategySignal,
  getReconnaissanceSweepPrimaryStrategyContext,
  getReconnaissanceSweepQuarterState
} from "./tactical-reconnaissance-sweep-strategy.js";
import { clamp01 } from "./tactical-context-utils.js";

function standardObjectivePurpose(control) {
  if (control === "controlled") return "hold-objective";
  if (control === "enemy-controlled") return "contest-objective";
  if (control === "contested" || control === "contested-by-others") return "swing-objective";
  return "claim-objective";
}

function roughDistance(first, second) {
  if (!Number.isFinite(first?.x) || !Number.isFinite(first?.y) || !Number.isFinite(second?.x) || !Number.isFinite(second?.y)) return null;
  return Math.round(Math.hypot(second.x - first.x, second.y - first.y) / 3) * 3;
}

function reachBoost(distance, movement) {
  if (!Number.isFinite(distance)) return 0;
  if (distance <= 3) return 0.2;
  if (Number.isFinite(movement) && distance <= movement + 3) return 0.16;
  if (Number.isFinite(movement) && distance <= movement + 9) return 0.09;
  return 0.02;
}

function quarterById(id) {
  return RECONNAISSANCE_SWEEP_QUARTERS.find((quarter) => quarter.id === id) ?? null;
}

function projectedPrimaryVp(primaryStrategy, rawMissionVp) {
  const raw = Math.max(0, Number(rawMissionVp) || 0);
  const actual = Math.max(0, Number(primaryStrategy?.actualMissionVpThisTurn) || 0);
  const allowance = Math.max(0, Number(primaryStrategy?.additionalPrimaryAllowance) || 0);
  const desired = Math.max(actual, Math.min(15, raw));
  return actual + Math.min(Math.max(0, desired - actual), allowance);
}

function projectedQuarterTier(primaryStrategy, quarterVp) {
  const rawWithoutCurrentQuarterTier = Math.max(0,
    (Number(primaryStrategy?.rawAdvisoryVp) || 0) - (Number(primaryStrategy?.mapQuarterVpEstimate) || 0));
  return projectedPrimaryVp(primaryStrategy, rawWithoutCurrentQuarterTier + Math.max(0, Number(quarterVp) || 0));
}

function quarterOption(state, recommendation, primaryStrategy, quarterState) {
  if ((Number(primaryStrategy?.remainingPrimaryGameVp) || 0) <= 0 ||
      (Number(primaryStrategy?.additionalPrimaryAllowance) || 0) <= 0) return null;

  const unit = (state?.units ?? []).find((entry) => entry?.id === recommendation.unitId);
  const position = unit ? getLiveUnitPosition(state, unit) : null;
  const currentQuarterId = quarterState.unitQuarterById[recommendation.unitId] ?? null;
  const currentCount = currentQuarterId ? quarterState.counts[currentQuarterId] ?? 0 : 0;
  const isSoleRepresentative = currentQuarterId != null && currentCount === 1;

  if (isSoleRepresentative && quarterState.representedQuarterCount >= 3) {
    const current = quarterById(currentQuarterId);
    const lowerQuarterVp = quarterState.representedQuarterCount >= 4 ? 3 : 0;
    const atRiskVp = Math.max(0,
      (Number(primaryStrategy?.cappedAdvisoryVp) || 0) - projectedQuarterTier(primaryStrategy, lowerQuarterVp));
    if (atRiskVp <= 0) return null;
    const score = clamp01(quarterState.representedQuarterCount >= 4 ? 0.9 : 0.84);
    return Object.freeze({
      kind: "quarter",
      purpose: "preserve-quarter",
      score,
      quarterId: currentQuarterId,
      quarterName: current?.label ?? currentQuarterId,
      distance: 0,
      vpLeverage: atRiskVp,
      actionHint: "Remain wholly within this table quarter and more than 6 inches from the battlefield centre",
      confidence: "low",
      reason: `This unit is the approximate map's sole representative of the ${current?.label ?? currentQuarterId}. Moving it out can reduce the capped Reconnaissance Sweep projection by ${atRiskVp} VP. Confirm the whole unit's tabletop position before relying on this.`
    });
  }

  if (quarterState.missingQuarterIds.length === 0) return null;
  if (isSoleRepresentative) return null;

  const candidates = quarterState.missingQuarterIds.map((quarterId) => {
    const quarter = quarterById(quarterId);
    return { quarter, distance: roughDistance(position, quarter?.anchor) };
  }).filter((entry) => entry.quarter);
  candidates.sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY));
  const best = candidates[0];
  if (!best) return null;

  const currentTier = quarterState.mapQuarterVpEstimate;
  const nextCount = Math.min(4, quarterState.representedQuarterCount + 1);
  const nextTier = nextCount >= 4 ? 6 : nextCount >= 3 ? 3 : 0;
  const nextProjectedVp = projectedQuarterTier(primaryStrategy, nextTier);
  const vpLeverage = Math.max(0, nextProjectedVp - (Number(primaryStrategy?.cappedAdvisoryVp) || 0));
  const staging = nextTier === currentTier;
  if (!staging && vpLeverage <= 0) return null;
  const score = clamp01(
    (vpLeverage > 0 ? 0.48 + vpLeverage / 8 : 0.24) +
    reachBoost(best.distance, recommendation.movement)
  );
  return Object.freeze({
    kind: "quarter",
    purpose: "spread-to-quarter",
    score,
    quarterId: best.quarter.id,
    quarterName: best.quarter.label,
    distance: best.distance,
    vpLeverage,
    staging,
    actionHint: `Reposition toward the ${best.quarter.label}; confirm the entire unit is wholly inside it and more than 6 inches from centre`,
    confidence: "low",
    reason: vpLeverage > 0
      ? `The ${best.quarter.label} is not represented on the approximate map. Filling it can raise the capped Reconnaissance Sweep projection by ${vpLeverage} VP if the tabletop wholly-within condition is met.`
      : `The ${best.quarter.label} is not represented on the approximate map. Moving toward it builds the spread needed to reach the three-quarter scoring threshold.`
  });
}

function objectiveOption(state, { playerId, perspectivePlayerId, recommendation, entry, primaryStrategy }) {
  const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: entry.objectiveId });
  const purpose = standardObjectivePurpose(control);
  const signal = getReconnaissanceSweepObjectiveStrategySignal(state, {
    playerId,
    perspectivePlayerId,
    objectiveId: entry.objectiveId,
    control,
    purpose,
    primaryStrategy
  });
  if (!signal.active || signal.vpLeverage <= 0 && signal.stagingVpLeverage <= 0 && signal.score < 0.2) return null;
  const score = clamp01(0.12 + reachBoost(entry.distance, recommendation.movement) + signal.score);
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
    actionHint: entry.distance <= 3
      ? "Hold or make only a small reposition"
      : "Move toward objective range and confirm control on the tabletop",
    confidence: Number.isFinite(recommendation.movement) ? "moderate" : "low",
    reason: `${objectiveName} is about ${entry.distance}\" away on the approximate map. ${signal.reason}`
  });
}

function recommendationText(unitName, option) {
  if (option.kind === "quarter") {
    if (option.purpose === "preserve-quarter") return `${unitName}: preserve the ${option.quarterName}; this unit is currently carrying one of the required Reconnaissance Sweep quarters.`;
    return `${unitName}: spread toward the ${option.quarterName} to improve Reconnaissance Sweep quarter coverage.`;
  }
  if (option.purpose === "hold-objective") return `${unitName}: preserve ${option.objectiveName}; it may be carrying the binary 3 VP non-home control condition.`;
  return `${unitName}: pressure ${option.objectiveName} for Reconnaissance Sweep's non-home control condition.`;
}

function enhanceRecommendation(state, options, recommendation, spatial, primaryStrategy, quarterState) {
  const objectiveEntries = (spatial.objectiveProximity ?? []).filter((entry) => entry.unitId === recommendation.unitId);
  const optionsForUnit = [
    quarterOption(state, recommendation, primaryStrategy, quarterState),
    ...objectiveEntries.map((entry) => objectiveOption(state, {
      ...options,
      recommendation,
      entry,
      primaryStrategy
    }))
  ].filter(Boolean).sort((a, b) => b.score - a.score);
  const best = optionsForUnit[0];
  if (!best) return recommendation;

  if (best.score <= recommendation.score) {
    return Object.freeze({
      ...recommendation,
      reason: best.kind === "objective" && recommendation.objectiveId === best.objectiveId
        ? `${recommendation.reason} ${best.primaryStrategySignal.reason}`
        : recommendation.reason,
      alternatives: Object.freeze([
        ...(recommendation.alternatives ?? []),
        ...optionsForUnit
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
    objectiveId: best.kind === "objective" ? best.objectiveId : null,
    objectiveName: best.kind === "objective" ? best.objectiveName : null,
    targetUnitId: null,
    targetName: null,
    territoryTarget: best.kind === "quarter" ? best.quarterName : null,
    distance: best.distance,
    strategicContext: null,
    primaryStrategySignal: best.kind === "objective" ? best.primaryStrategySignal : null,
    recommendation: recommendationText(recommendation.unitName, best),
    reason: best.reason,
    alternatives: Object.freeze([
      ...(recommendation.alternatives ?? []),
      ...optionsForUnit.slice(1)
    ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2))
  });
}

export function enhanceReconnaissanceSweepMovementRecommendations(state, base, { playerId, perspectivePlayerId = playerId } = {}) {
  const primaryStrategy = getReconnaissanceSweepPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const quarterState = getReconnaissanceSweepQuarterState(state, { playerId });
  const spatial = getSpatialContext(state, { playerId });
  const recommendations = (base.recommendations ?? []).map((recommendation) =>
    enhanceRecommendation(state, { playerId, perspectivePlayerId }, recommendation, spatial, primaryStrategy, quarterState)
  ).sort((a, b) => b.score - a.score || b.priority - a.priority || a.unitName.localeCompare(b.unitName));
  return Object.freeze({
    ...base,
    primaryStrategy,
    recommendations: Object.freeze(recommendations)
  });
}
