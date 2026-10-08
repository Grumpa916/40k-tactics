export function createTurnSnapshot(state, {
  turn = state?.turn ?? 0,
  round = state?.battle?.round ?? 0,
  playerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null
} = {}) {
  return Object.freeze({
    turn,
    round,
    playerId,
    objectives: Object.freeze(
      (Array.isArray(state?.objectives) ? state.objectives : []).map((objective) =>
        Object.freeze({ id: objective.id, control: objective.control ?? null })
      )
    ),
    units: Object.freeze(
      (Array.isArray(state?.units) ? state.units : []).map((unit) =>
        Object.freeze({
          id: unit.id,
          ownerId: unit.ownerId,
          status: unit.status,
          wounds: unit.wounds ?? null,
          position: unit.position ?? null
        })
      )
    )
  });
}

export function getTurnSnapshot(state, turn) {
  if (!Number.isInteger(turn) || turn < 0) throw new TypeError("turn must be a non-negative integer.");
  return (Array.isArray(state?.scoring?.turnSnapshots) ? state.scoring.turnSnapshots : [])
    .find((snapshot) => snapshot.turn === turn) ?? null;
}

export function getPreviousTurnSnapshot(state) {
  const currentTurn = Number.isInteger(state?.turn) ? state.turn : 0;
  return getTurnSnapshot(state, Math.max(0, currentTurn - 1));
}

export function getScoringEventsForTurn(state, turn) {
  if (!Number.isInteger(turn) || turn < 0) throw new TypeError("turn must be a non-negative integer.");
  return (Array.isArray(state?.history) ? state.history : [])
    .filter((event) => event?.payload?.turn === turn);
}

function destructionFromEvent(event) {
  if (event?.type === "unit.destroyed") {
    return event.payload?.unitId
      ? { unitId: event.payload.unitId, ownerId: event.payload.ownerId ?? null, source: event.type }
      : null;
  }
  if (event?.type !== "combat.attack_resolved") return null;
  const delta = event.payload?.stateDelta?.target;
  if (!delta || delta.statusAfter !== "destroyed" || delta.statusBefore === "destroyed") return null;
  return event.payload?.targetId
    ? {
        unitId: event.payload.targetId,
        ownerId: event.payload.targetOwnerId ?? (Array.isArray(state?.units) ? state.units.find((unit) => unit.id === event.payload.targetId)?.ownerId ?? null : null),
        source: event.type,
        attackerId: event.payload.attackerId ?? null,
        phase: event.payload.phase ?? null
      }
    : null;
}

export function getUnitDestructionsForTurn(state, turn) {
  return getScoringEventsForTurn(state, turn).map(destructionFromEvent).filter(Boolean);
}

export function getFriendlyUnitDestructionsForTurn(state, playerId, turn) {
  if (!playerId) throw new TypeError("playerId is required.");
  return getUnitDestructionsForTurn(state, turn).filter((event) => event.ownerId === playerId);
}

export function getEnemyUnitDestructionsForTurn(state, playerId, turn) {
  if (!playerId) throw new TypeError("playerId is required.");
  return getUnitDestructionsForTurn(state, turn).filter(
    (event) => event.ownerId != null && event.ownerId !== playerId
  );
}

export function getUnitStateAtTurnStart(state, unitId, turn) {
  if (!unitId) throw new TypeError("unitId is required.");
  const snapshot = getTurnSnapshot(state, turn);
  return snapshot?.units.find((unit) => unit.id === unitId) ?? null;
}

export function getObjectiveStateAtTurnStart(state, objectiveId, turn) {
  if (!objectiveId) throw new TypeError("objectiveId is required.");
  const snapshot = getTurnSnapshot(state, turn);
  return snapshot?.objectives.find((objective) => objective.id === objectiveId) ?? null;
}
