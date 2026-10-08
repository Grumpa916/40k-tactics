import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { createTurnSnapshot } from "../rules/scoring-evidence-state.js";

function withScoringState(state, snapshot) {
  const previous = state.scoring ?? {};
  const snapshots = Array.isArray(previous.turnSnapshots) ? previous.turnSnapshots : [];
  return {
    ...state,
    scoring: {
      ...previous,
      turnSnapshots: [...snapshots.filter((item) => item.turn !== snapshot.turn), snapshot]
    }
  };
}

export function captureTurnStartSnapshot(state, {
  turn = state.turn,
  round = state?.battle?.round ?? 0,
  playerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null
} = {}) {
  if (!Number.isInteger(turn) || turn < 0) throw new TypeError("turn must be a non-negative integer.");
  const snapshot = createTurnSnapshot(state, { turn, round, playerId });
  return withScoringState(state, snapshot);
}

export function recordMissionScoringEvent(state, {
  eventType,
  playerId = state?.activePlayer ?? null,
  turn = state?.turn ?? 0,
  round = state?.battle?.round ?? 0,
  subjectId = null,
  objectiveId = null,
  targetId = null,
  details = {}
} = {}) {
  if (!eventType || typeof eventType !== "string") throw new TypeError("A mission scoring event type is required.");
  if (!Number.isInteger(turn) || turn < 0) throw new TypeError("turn must be a non-negative integer.");
  if (!Number.isInteger(round) || round < 0) throw new TypeError("round must be a non-negative integer.");
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    throw new TypeError("Mission scoring event details must be an object.");
  }
  return appendHistoryEntry(state, createEvent("mission.scoring_event", {
    eventType, playerId, turn, round, subjectId, objectiveId, targetId, details: { ...details }
  }));
}
