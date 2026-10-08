import { UNIT_STATUS } from "../state/unit.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";

function positionIsValid(position) {
  return position && Number.isFinite(position.x) && Number.isFinite(position.y);
}

function movementCharacteristic(unit, model) {
  const value = model.profile?.characteristics?.movement ??
    model.characteristics?.movement ??
    model.movement ??
    unit.profile?.characteristics?.movement ??
    unit.characteristics?.movement;
  const match = typeof value === "string" ? value.match(/^\s*(\d+(?:\.\d+)?)\s*(?:\"|in)?\s*$/i) : null;
  const movement = typeof value === "number" ? value : match ? Number(match[1]) : NaN;
  if (!Number.isFinite(movement) || movement < 0) {
    throw new Error("Unit must have a valid Movement characteristic.");
  }
  return movement;
}

function distanceBetween(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function getModels(unit) {
  if (Array.isArray(unit.models) && unit.models.length > 0) {
    const ids = new Set();
    return unit.models.map((model) => {
      if (!model?.id || ids.has(model.id) || !positionIsValid(model.position)) {
        throw new Error("Each model must have a unique id and a valid battlefield position.");
      }
      ids.add(model.id);
      return { ...model, position: model.position };
    });
  }
  if (positionIsValid(unit.position)) {
    return [{ id: unit.id, position: unit.position }];
  }
  throw new Error("Every model in the unit must have a battlefield position.");
}

/**
 * Resolve a Normal Move from each model's current position to its destination.
 * The engine records positions and displacement; presentation may show a
 * temporary drag path without storing that path in game state or history.
 */
export function resolveNormalMove(state, { unitId, moves } = {}) {
  if (!unitId) throw new TypeError("Unit id is required.");
  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "movement") throw new Error("Normal Moves may only be resolved in the Movement phase.");

  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Unit not found: " + unitId);
  if (unit.ownerId !== state.activePlayer) throw new Error("Only the active player's units may move.");
  if (unit.status !== UNIT_STATUS.DEPLOYED) throw new Error("Unit must be deployed before it can move.");
  if (state.history.some((event) =>
    event.type === "unit.normal_move_resolved" &&
    event.payload?.unitId === unitId &&
    event.payload?.turn === state.turn
  )) {
    throw new Error("A unit can make only one Normal Move per turn.");
  }

  const models = getModels(unit);
  if (!Array.isArray(moves) || moves.length !== models.length) {
    throw new Error("A Normal Move must include a destination for every model in the unit.");
  }

  const destinations = new Map();
  for (const move of moves) {
    if (!move?.modelId || destinations.has(move.modelId)) {
      throw new Error("Each model must have exactly one movement destination.");
    }
    if (!positionIsValid(move.position)) {
      throw new TypeError("Each model movement destination must be a valid battlefield position.");
    }
    destinations.set(move.modelId, move.position);
  }

  const moveRecords = [];
  const movedModels = models.map((model) => {
    const position = destinations.get(model.id);
    if (!position) throw new Error("A Normal Move must include a destination for every model in the unit.");
    const movement = movementCharacteristic(unit, model);
    const distance = distanceBetween(model.position, position);
    if (distance > movement + 1e-9) {
      throw new Error("A model cannot move farther than its Movement characteristic.");
    }
    const destination = { ...position };
    moveRecords.push({
      modelId: model.id,
      from: { ...model.position },
      to: destination,
      distance,
      movement
    });
    return { ...model, position: destination };
  });

  const nextUnit = Array.isArray(unit.models) && unit.models.length > 0
    ? { ...unit, models: movedModels }
    : { ...unit, position: movedModels[0].position };
  const event = createEvent("unit.normal_move_resolved", {
    unitId,
    playerId: state.activePlayer,
    phase: state.phase,
    round: state.battle.round,
    turn: state.turn,
    moves: moveRecords
  });

  return appendHistoryEntry({
    ...state,
    units: state.units.map((item) => item.id === unitId ? nextUnit : item)
  }, event);
}


/**
 * Record a Fall Back without inventing movement geometry. The movement UI may
 * update model positions separately; this event is the authoritative gameplay
 * fact used by later phases to determine eligibility and restrictions.
 */
export function recordFallBack(state, { unitId } = {}) {
  if (!unitId) throw new TypeError("Unit id is required.");
  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "movement") throw new Error("Fall Back may only be recorded in the Movement phase.");

  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Unit not found: " + unitId);
  if (unit.ownerId !== state.activePlayer) throw new Error("Only the active player's units may Fall Back.");
  if (unit.status !== UNIT_STATUS.DEPLOYED) throw new Error("Unit must be deployed before it can Fall Back.");
  if (state.history.some((event) =>
    event.type === "unit.fell_back" &&
    event.payload?.unitId === unitId &&
    event.payload?.turn === state.turn
  )) {
    throw new Error("A unit can Fall Back only once per turn.");
  }

  return appendHistoryEntry(state, createEvent("unit.fell_back", {
    unitId,
    playerId: state.activePlayer,
    phase: state.phase,
    round: state.battle.round,
    turn: state.turn
  }));
}
