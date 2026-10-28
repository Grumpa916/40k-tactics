import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { UNIT_STATUS } from "../state/unit.js";

export const BASE_MOVEMENT_EVENT_TYPES = Object.freeze([
  "unit.normal_move_resolved",
  "unit.advanced",
  "unit.fell_back",
  "unit.stationary_recorded"
]);

const BASE_MOVEMENT_TYPES = new Set(BASE_MOVEMENT_EVENT_TYPES);

function currentTurn(state) {
  return state?.turn ?? 0;
}

function currentRound(state) {
  return state?.battle?.round ?? 0;
}

export function isMovementRefinementEvent(event, unitId = null, state = null) {
  if (event?.payload?.movementRefinement !== true) return false;
  if (unitId && event.payload?.unitId !== unitId) return false;
  if (state) {
    if (event.payload?.turn !== currentTurn(state)) return false;
    if (event.payload?.round !== currentRound(state)) return false;
  }
  return true;
}

export function getBaseMovementAction(state, unitId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index];
    if (isMovementRefinementEvent(event)) continue;
    if (BASE_MOVEMENT_TYPES.has(event?.type) &&
      event?.payload?.unitId === unitId &&
      event?.payload?.turn === currentTurn(state)) {
      return event;
    }
  }
  return null;
}

export function hasBaseMovementAction(state, unitId) {
  return Boolean(getBaseMovementAction(state, unitId));
}

export function getMovementRefinement(state, unitId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index];
    if (!isMovementRefinementEvent(event, unitId, state)) continue;
    return Object.freeze({
      movementType: event.payload?.movementType ?? null,
      advanceRoll: Number.isInteger(event.payload?.advanceRoll) ? event.payload.advanceRoll : null,
      reason: event.payload?.reason ?? null,
      eventType: event.type
    });
  }
  return null;
}

export function getEffectiveMovementAction(state, unitId) {
  const base = getBaseMovementAction(state, unitId);
  if (!base) return null;
  const refinement = getMovementRefinement(state, unitId);
  let movementType = base.type === "unit.advanced" ? "advance"
    : base.type === "unit.fell_back" ? "fall_back"
      : base.type === "unit.stationary_recorded" ? "stationary"
        : "normal";
  let advanceRoll = base.type === "unit.advanced" && Number.isInteger(base.payload?.advanceRoll)
    ? base.payload.advanceRoll
    : null;
  if (refinement?.movementType) {
    movementType = refinement.movementType;
    advanceRoll = refinement.movementType === "advance" ? refinement.advanceRoll : null;
  }
  return Object.freeze({
    movementType,
    advanceRoll,
    baseEventType: base.type,
    baseEvent: base,
    refinement
  });
}

function validateUnit(state, unitId) {
  if (!unitId) throw new TypeError("Unit id is required.");
  if (!state?.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "movement") throw new Error("Movement can only be refined during the Movement phase.");
  const unit = (state.units ?? []).find((item) => item.id === unitId);
  if (!unit) throw new Error("Unit not found: " + unitId);
  if (unit.ownerId !== state.activePlayer) throw new Error("Only the active player's movement can be refined.");
  if (unit.status !== UNIT_STATUS.DEPLOYED) throw new Error("Unit must be deployed.");
  return unit;
}

function removeExistingRefinement(state, unitId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  return {
    ...state,
    history: history.filter((event) => !isMovementRefinementEvent(event, unitId, state))
  };
}

/**
 * Dragging the live map remains the fast path and records a Normal Move.
 * This optional correction records only the tabletop fact that differs from
 * that default; it never moves the unit again or rewrites the saved geometry.
 */
export function refineMovementAction(state, { unitId, movementType, advanceRoll = null } = {}) {
  const unit = validateUnit(state, unitId);
  const base = getBaseMovementAction(state, unitId);
  if (!base) throw new Error("Move the unit on the map before refining its movement type.");
  if (base.type === "unit.stationary_recorded") throw new Error("A stationary unit has no movement to refine.");
  if (!["normal", "advance", "fall_back", "special"].includes(movementType)) {
    throw new RangeError("Choose Normal Move, Advance, Fall Back, or Special movement.");
  }

  const next = removeExistingRefinement(state, unitId);
  if (movementType === "normal") return next;

  if (movementType === "advance" && (!Number.isInteger(advanceRoll) || advanceRoll < 1 || advanceRoll > 6)) {
    throw new TypeError("Choose the actual Advance roll (1–6).");
  }

  const reason = movementType === "advance"
    ? `Advance +${advanceRoll}\"`
    : movementType === "fall_back"
      ? "Fall Back"
      : "Special movement rule";
  const eventType = movementType === "fall_back" ? "unit.fell_back" : "unit.movement_refined";

  return appendHistoryEntry(next, createEvent(eventType, {
    unitId,
    playerId: unit.ownerId,
    phase: state.phase,
    round: currentRound(state),
    turn: currentTurn(state),
    movementRefinement: true,
    movementType,
    ...(movementType === "advance" ? { advanceRoll } : {}),
    reason
  }));
}

export function undoMovementRefinement(state, { unitId } = {}) {
  validateUnit(state, unitId);
  if (!getMovementRefinement(state, unitId)) {
    throw new Error("This unit has no movement refinement to undo.");
  }
  return removeExistingRefinement(state, unitId);
}
