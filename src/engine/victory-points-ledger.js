import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";

export function recordVictoryPointsAward(state, {
  playerId,
  amount,
  reason,
  turn = state?.turn ?? 0,
  round = state?.battle?.round ?? 0
} = {}) {
  if (typeof playerId !== "string" || !playerId.trim()) throw new TypeError("A playerId is required.");
  if (!Number.isInteger(amount) || amount <= 0) throw new TypeError("Victory points awarded must be a positive integer.");
  if (typeof reason !== "string" || !reason.trim()) throw new TypeError("A scoring reason is required.");
  if (!Number.isInteger(turn) || turn < 0) throw new TypeError("Turn must be a non-negative integer.");
  if (!Number.isInteger(round) || round < 0) throw new TypeError("Round must be a non-negative integer.");

  const scores = state?.victoryPoints ?? {};
  const scoreBefore = Number.isInteger(scores[playerId]) ? scores[playerId] : 0;
  const scoreAfter = scoreBefore + amount;
  const updated = {
    ...state,
    victoryPoints: { ...scores, [playerId]: scoreAfter }
  };
  return appendHistoryEntry(updated, createEvent("victory_points.awarded", {
    playerId, amount, reason: reason.trim(), turn, round, scoreBefore, scoreAfter
  }));
}

export function getVictoryPointScore(state, playerId) {
  if (typeof playerId !== "string" || !playerId.trim()) throw new TypeError("A playerId is required.");
  const score = state?.victoryPoints?.[playerId];
  return Number.isInteger(score) && score >= 0 ? score : 0;
}

export function getVictoryPointHistory(state, playerId = null) {
  return (Array.isArray(state?.history) ? state.history : [])
    .filter((event) => event?.type === "victory_points.awarded")
    .filter((event) => playerId == null || event.payload?.playerId === playerId)
    .map((event) => ({ ...event.payload }));
}
