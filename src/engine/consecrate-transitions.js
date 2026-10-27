import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import {
  CONSECRATE_EVENT_TYPES,
  getConsecrateReviewState,
  isConsecrateMissionForPlayer,
  isPlayerHomeObjective
} from "../rules/consecrate-state.js";

function requireActivePlayer(state, playerId) {
  if (!state?.battle || state.battle.status !== "active") throw new Error("Consecrate can only be reviewed during an active battle.");
  if (state.phase !== "end_turn") throw new Error("Consecrate is reviewed at the end of your turn.");
  const activePlayerId = state.activePlayer ?? state.battle.activePlayerId ?? null;
  if (!playerId || playerId !== activePlayerId) throw new Error("Consecrate must be reviewed for the active player.");
  if (!isConsecrateMissionForPlayer(state, playerId)) throw new Error("The active player's Primary Mission is not Consecrate.");
}

export function recordConsecrateReview(state, {
  playerId,
  assignments = [],
  tabletopConfirmed = false
} = {}) {
  requireActivePlayer(state, playerId);
  const review = getConsecrateReviewState(state, { playerId });
  if (review.reviewedThisTurn) throw new Error("Consecrate has already been reviewed this turn.");
  if (!Array.isArray(assignments)) throw new TypeError("Consecrate assignments must be an array.");

  const activeUnitIds = new Set(review.allConsecrationUnitIds);
  const consecratedObjectiveIds = new Set(review.consecratedObjectiveIds);
  const usedUnits = new Set();
  const usedObjectives = new Set();
  const objectives = Array.isArray(state.objectives) ? state.objectives : [];
  const units = Array.isArray(state.units) ? state.units : [];
  const normalized = [];

  for (const assignment of assignments) {
    const unitId = assignment?.unitId ?? null;
    const objectiveId = assignment?.objectiveId ?? null;
    if (!unitId || !objectiveId) throw new TypeError("Each Consecrate assignment requires a unit and objective.");
    if (usedUnits.has(unitId)) throw new Error("A consecration unit can consecrate at most one objective at the end of a turn.");
    if (usedObjectives.has(objectiveId)) throw new Error("An objective can only be consecrated once.");
    if (!activeUnitIds.has(unitId)) throw new Error("Selected unit is not currently a consecration unit.");
    const unit = units.find((item) => item?.id === unitId);
    if (!unit || unit.ownerId !== playerId || unit.status !== "deployed") {
      throw new Error("Only a deployed consecration unit can consecrate an objective.");
    }
    const objective = objectives.find((item) => item?.id === objectiveId);
    if (!objective) throw new Error("Selected Consecrate objective was not found.");
    if (isPlayerHomeObjective(state, objective, playerId)) throw new Error("Your home objective cannot be consecrated.");
    if (consecratedObjectiveIds.has(objectiveId)) throw new Error("That objective has already been consecrated.");
    usedUnits.add(unitId);
    usedObjectives.add(objectiveId);
    normalized.push({ unitId, objectiveId });
  }

  if (normalized.length > 0 && tabletopConfirmed !== true) {
    throw new Error("Confirm the selected units are within range of their chosen objectives on the physical tabletop.");
  }

  const round = state.battle.round ?? 0;
  const turn = state.turn ?? 0;
  let next = state;
  for (const assignment of normalized) {
    next = appendHistoryEntry(next, createEvent(CONSECRATE_EVENT_TYPES.OBJECTIVE_CONSECRATED, {
      playerId,
      unitId: assignment.unitId,
      objectiveId: assignment.objectiveId,
      round,
      turn,
      phase: state.phase,
      tabletopConfirmed: true
    }));
  }

  return appendHistoryEntry(next, createEvent(CONSECRATE_EVENT_TYPES.REVIEWED, {
    playerId,
    round,
    turn,
    phase: state.phase,
    consecratedThisReview: normalized.map((item) => ({ ...item })),
    reviewedConsecrationUnitIds: review.deployedConsecrationUnits.map((unit) => unit.id)
  }));
}
