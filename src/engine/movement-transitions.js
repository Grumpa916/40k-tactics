import { getBattleUnitMovement } from "../rules/battle-unit-reference.js";
import { UNIT_STATUS } from "../state/unit.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { BASE_MOVEMENT_EVENT_TYPES, hasBaseMovementAction, isMovementRefinementEvent } from "./movement-refinement-transitions.js";

function positionIsValid(position) {
  return position && Number.isFinite(position.x) && Number.isFinite(position.y);
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
  if (hasBaseMovementAction(state, unitId)) {
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
    const movement = getBattleUnitMovement(state, unit, model) ?? null;
    const distance = distanceBetween(model.position, position);
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
  if (hasBaseMovementAction(state, unitId)) {
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

export function resolveAdvance(state, { unitId, moves, advanceRoll } = {}) {
  if (!Number.isInteger(advanceRoll) || advanceRoll < 1 || advanceRoll > 6) throw new TypeError("Enter the actual Advance roll (1–6).");
  if (!unitId) throw new TypeError("Unit id is required.");
  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "movement") throw new Error("Advance may only be recorded in the Movement phase.");
  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Unit not found: " + unitId);
  if (unit.ownerId !== state.activePlayer) throw new Error("Only the active player's units may Advance.");
  if (unit.status !== UNIT_STATUS.DEPLOYED) throw new Error("Unit must be deployed before it can Advance.");
  if (hasBaseMovementAction(state, unitId)) throw new Error("A unit can record only one movement action per turn.");
  const models = getModels(unit);
  if (!Array.isArray(moves) || moves.length !== models.length) throw new Error("An Advance must include a destination for every model.");
  const destinations = new Map();
  for (const move of moves) {
    if (!move?.modelId || destinations.has(move.modelId) || !positionIsValid(move.position)) throw new Error("Each model must have exactly one valid destination.");
    destinations.set(move.modelId, move.position);
  }
  const records = [];
  const movedModels = models.map((model) => {
    const destination = destinations.get(model.id);
    if (!destination) throw new Error("An Advance must include a destination for every model.");
    const movement = getBattleUnitMovement(state, unit, model) ?? null;
    const distance = distanceBetween(model.position, destination);
    records.push({ modelId: model.id, from: { ...model.position }, to: { ...destination }, distance, movement, advanceRoll });
    return { ...model, position: { ...destination } };
  });
  const nextUnit = Array.isArray(unit.models) && unit.models.length > 0 ? { ...unit, models: movedModels } : { ...unit, position: movedModels[0].position };
  return appendHistoryEntry({ ...state, units: state.units.map((item) => item.id === unitId ? nextUnit : item) }, createEvent("unit.advanced", {
    unitId, playerId: state.activePlayer, phase: state.phase, round: state.battle.round, turn: state.turn, advanceRoll, moves: records
  }));
}

export function recordStationary(state, { unitId } = {}) {
  if (!unitId) throw new TypeError("Unit id is required.");
  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "movement") throw new Error("Stationary status may only be recorded in the Movement phase.");
  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Unit not found: " + unitId);
  if (unit.ownerId !== state.activePlayer) throw new Error("Only the active player's units may be recorded stationary.");
  if (unit.status !== UNIT_STATUS.DEPLOYED) throw new Error("Unit must be deployed.");
  if (hasBaseMovementAction(state, unitId)) throw new Error("A unit can record only one movement action per turn.");
  return appendHistoryEntry(state, createEvent("unit.stationary_recorded", {
    unitId, playerId: state.activePlayer, phase: state.phase, round: state.battle.round, turn: state.turn
  }));
}

const MOVEMENT_ACTION_EVENT_TYPES = new Set(BASE_MOVEMENT_EVENT_TYPES);

/** Undo the selected unit's current-turn Movement action.
 * Normal Move and Advance restore the positions recorded before the action.
 * Fall Back and Stationary only remove their gameplay fact. Any optional
 * refinement is removed with the base action so history cannot be left dangling.
 */
export function undoMovementAction(state, { unitId } = {}) {
  if (!unitId) throw new TypeError("Unit id is required.");
  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "movement") throw new Error("Movement actions may only be undone in the Movement phase.");
  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Unit not found: " + unitId);
  if (unit.ownerId !== state.activePlayer) throw new Error("Only the active player's movement action may be undone.");

  const history = Array.isArray(state.history) ? state.history : [];
  let eventIndex = -1;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index];
    if (isMovementRefinementEvent(event)) continue;
    if (MOVEMENT_ACTION_EVENT_TYPES.has(event?.type) && event.payload?.unitId === unitId && event.payload?.turn === state.turn) {
      eventIndex = index;
      break;
    }
  }
  if (eventIndex < 0) throw new Error("This unit has no movement action to undo this turn.");

  const event = history[eventIndex];
  let nextUnit = unit;
  if (["unit.normal_move_resolved", "unit.advanced"].includes(event.type)) {
    const records = Array.isArray(event.payload?.moves) ? event.payload.moves : [];
    if (!records.length || records.some((record) => !record?.modelId || !positionIsValid(record.from))) {
      throw new Error("The original movement positions are unavailable for this action.");
    }
    const originals = new Map(records.map((record) => [record.modelId, { ...record.from }]));
    if (Array.isArray(unit.models) && unit.models.length > 0) {
      nextUnit = {
        ...unit,
        models: unit.models.map((model) => {
          const position = originals.get(model.id);
          if (!position) throw new Error("The original movement position is unavailable for model " + model.id + ".");
          return { ...model, position };
        })
      };
    } else {
      const position = originals.get(unit.id) ?? records[0]?.from;
      if (!positionIsValid(position)) throw new Error("The original movement position is unavailable.");
      nextUnit = { ...unit, position: { ...position } };
    }
  }

  return {
    ...state,
    units: state.units.map((item) => item.id === unitId ? nextUnit : item),
    history: history.filter((candidate, index) =>
      index !== eventIndex && !isMovementRefinementEvent(candidate, unitId, state)
    )
  };
}
