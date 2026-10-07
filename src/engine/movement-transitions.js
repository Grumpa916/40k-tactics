import { UNIT_STATUS } from "../state/unit.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";

function positionIsValid(position) {
  return position && Number.isFinite(position.x) && Number.isFinite(position.y);
}

function movementCharacteristic(unit) {
  const value = unit.profile?.characteristics?.movement ?? unit.characteristics?.movement;
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
      return { id: model.id, position: model.position };
    });
  }
  if (positionIsValid(unit.position)) {
    return [{ id: unit.id, position: unit.position }];
  }
  throw new Error("Every model in the unit must have a battlefield position.");
}

/**
 * Resolve a Normal Move using per-model paths. Each path is a sequence of
 * battlefield points after that model's current position; segment lengths are
 * summed so a curved route cannot bypass the Movement characteristic.
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
  const movement = movementCharacteristic(unit);
  if (!Array.isArray(moves) || moves.length !== models.length) {
    throw new Error("A Normal Move must include a path for every model in the unit.");
  }

  const pathsById = new Map();
  for (const move of moves) {
    if (!move?.modelId || pathsById.has(move.modelId)) {
      throw new Error("Each model must have exactly one movement path.");
    }
    if (!Array.isArray(move.path) || move.path.length === 0 || move.path.some((point) => !positionIsValid(point))) {
      throw new TypeError("Each model movement path must contain valid battlefield points.");
    }
    pathsById.set(move.modelId, move.path);
  }

  const movedModels = models.map((model) => {
    const path = pathsById.get(model.id);
    if (!path) throw new Error("A Normal Move must include a path for every model in the unit.");
    let previous = model.position;
    let distance = 0;
    for (const point of path) {
      distance += distanceBetween(previous, point);
      previous = point;
    }
    if (distance > movement + 1e-9) {
      throw new Error("A model cannot move farther than its Movement characteristic.");
    }
    return { id: model.id, position: { ...path.at(-1) } };
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
    movement,
    moves: movedModels.map((model) => ({ modelId: model.id, position: model.position }))
  });

  return appendHistoryEntry({
    ...state,
    units: state.units.map((item) => item.id === unitId ? nextUnit : item)
  }, event);
}
