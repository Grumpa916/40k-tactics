import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { getSpatialContext } from "./spatial-context.js";
import {
  clamp01,
  impactLabel,
  opponentPlayerIds,
  unitById
} from "./tactical-context-utils.js";

function objectiveBandWeight(band) {
  return {
    close: 1,
    near: 0.72,
    mid: 0.3,
    far: 0.08,
    "very-far": 0
  }[band] ?? 0;
}

function objectiveControlWeight(control) {
  return {
    "enemy-controlled": 1,
    contested: 0.9,
    "contested-by-others": 0.7,
    uncontrolled: 0.45,
    controlled: 0.35
  }[control] ?? 0.25;
}

function primaryOwnScoringWeight(control) {
  return {
    "enemy-controlled": 0.95,
    contested: 0.9,
    "contested-by-others": 0.8,
    uncontrolled: 0.55,
    controlled: 0.2
  }[control] ?? 0.25;
}

function primaryDenialWeight(control) {
  return {
    "enemy-controlled": 1,
    contested: 0.75,
    "contested-by-others": 0.65,
    uncontrolled: 0.15,
    controlled: 0.05
  }[control] ?? 0.15;
}

function scoreForPlayer(state, playerId) {
  const value = state?.victoryPoints?.[playerId];
  return Number.isFinite(value) ? Number(value) : 0;
}

function scoringUrgency(state, playerId) {
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const ownScore = scoreForPlayer(state, playerId);
  const opponents = opponentPlayerIds(state, playerId);
  const opponentScore = opponents.length
    ? Math.max(...opponents.map((id) => scoreForPlayer(state, id)))
    : ownScore;
  const gap = ownScore - opponentScore;
  return clamp01(
    (round >= 4 ? 0.45 : round >= 3 ? 0.25 : 0.1) +
    (gap < 0 ? Math.min(0.4, Math.abs(gap) / 30) : 0)
  );
}

/**
 * Objective ownership is authoritative; the unit-to-objective distance is only
 * approximate battlefield context and never establishes legality or OC.
 */
export function getTargetObjectiveImpact(state, { playerId, targetUnitId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!targetUnitId) throw new TypeError("targetUnitId is required.");

  const target = unitById(state, targetUnitId);
  if (!target || target.ownerId === playerId || target.status === "destroyed") {
    return Object.freeze({
      score: 0,
      label: "none",
      confidence: "low",
      objectiveId: null,
      control: null,
      distance: null,
      band: "unknown",
      reason: "No enemy objective context is available for this target."
    });
  }

  let spatial = null;
  try {
    spatial = getSpatialContext(state, { playerId: target.ownerId });
  } catch {
    spatial = null;
  }

  const nearby = (spatial?.objectiveProximity ?? [])
    .filter((entry) => entry.unitId === targetUnitId)
    .map((entry) => {
      const control = getObjectiveControlForPlayer(state, {
        playerId,
        objectiveId: entry.objectiveId
      });
      const score = clamp01(objectiveBandWeight(entry.band) * objectiveControlWeight(control));
      return { ...entry, control, score };
    })
    .sort((a, b) => b.score - a.score || a.distance - b.distance || a.objectiveId.localeCompare(b.objectiveId));

  const strongest = nearby[0];
  if (!strongest || strongest.score <= 0) {
    return Object.freeze({
      score: 0,
      label: "none",
      confidence: "low",
      objectiveId: null,
      control: null,
      distance: null,
      band: "unknown",
      reason: "No nearby objective meaningfully changes this target's mission priority."
    });
  }

  const controlPhrase = strongest.control === "enemy-controlled"
    ? "an opponent-controlled objective"
    : strongest.control === "controlled"
      ? "one of your controlled objectives"
      : strongest.control === "contested"
        ? "a contested objective"
        : strongest.control === "uncontrolled"
          ? "an uncontrolled objective"
          : "an objective";

  return Object.freeze({
    score: strongest.score,
    label: impactLabel(strongest.score),
    confidence: strongest.band === "close" ? "moderate" : "low",
    objectiveId: strongest.objectiveId,
    control: strongest.control,
    distance: strongest.distance,
    band: strongest.band,
    reason: `Target is approximately ${strongest.distance} inches from ${controlPhrase}; tabletop position and actual OC remain authoritative.`
  });
}

/**
 * Translate objective context into Primary board-control and score-denial value.
 * It does not claim that a particular Primary card scores from this objective.
 */
export function getTargetPrimaryMissionImpact(state, { playerId, targetUnitId } = {}) {
  const objective = getTargetObjectiveImpact(state, { playerId, targetUnitId });
  if (!objective.objectiveId || objective.score <= 0) {
    return Object.freeze({
      score: 0,
      label: "none",
      confidence: "low",
      objectiveId: null,
      ownScoringValue: 0,
      denyScoringValue: 0,
      urgency: scoringUrgency(state, playerId),
      reason: "No objective-linked Primary scoring impact is established for this target."
    });
  }

  const ownScoringValue = clamp01(objective.score * primaryOwnScoringWeight(objective.control));
  const denyScoringValue = clamp01(objective.score * primaryDenialWeight(objective.control));
  const urgency = scoringUrgency(state, playerId);
  const score = clamp01(
    0.48 * ownScoringValue +
    0.38 * denyScoringValue +
    0.14 * urgency * objective.score
  );

  return Object.freeze({
    score,
    label: impactLabel(score),
    confidence: objective.confidence,
    objectiveId: objective.objectiveId,
    control: objective.control,
    ownScoringValue,
    denyScoringValue,
    urgency,
    reason: `${objective.reason} Removing or degrading this unit may change Primary board control or deny scoring, but the physical mission card and actual OC determine the score.`
  });
}
