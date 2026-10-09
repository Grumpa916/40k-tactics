import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";

export function recordVictoryPointsAward(state, {
  playerId,
  amount,
  reason,
  missionDefinitionId = null,
  category = null,
  opportunityKey = null,
  turn = state?.turn ?? 0,
  round = state?.battle?.round ?? 0
} = {}) {
  if (typeof playerId !== "string" || !playerId.trim()) throw new TypeError("A playerId is required.");
  if (!Number.isInteger(amount) || amount <= 0) throw new TypeError("Victory points awarded must be a positive integer.");
  if (typeof reason !== "string" || !reason.trim()) throw new TypeError("A scoring reason is required.");
  if (!Number.isInteger(turn) || turn < 0) throw new TypeError("Turn must be a non-negative integer.");
  if (!Number.isInteger(round) || round < 0) throw new TypeError("Round must be a non-negative integer.");

  if (missionDefinitionId !== null && (typeof missionDefinitionId !== "string" || !missionDefinitionId.trim())) {
    throw new TypeError("Mission definition id must be a non-empty string when supplied.");
  }
  if (category !== null && !["primary", "secondary"].includes(category)) {
    throw new TypeError("Mission category must be primary or secondary.");
  }
  if (opportunityKey !== null && (typeof opportunityKey !== "string" || !opportunityKey.trim())) {
    throw new TypeError("Opportunity key must be a non-empty string when supplied.");
  }
  const priorAwards = getVictoryPointHistory(state, playerId);
  if (missionDefinitionId && opportunityKey && priorAwards.some((entry) =>
    entry.missionDefinitionId === missionDefinitionId && entry.opportunityKey === opportunityKey
  )) {
    throw new Error("This mission scoring opportunity has already been recorded.");
  }

  const scores = state?.victoryPoints ?? {};
  const scoreBefore = Number.isInteger(scores[playerId]) ? scores[playerId] : 0;
  const scoreAfter = scoreBefore + amount;
  const updated = {
    ...state,
    victoryPoints: { ...scores, [playerId]: scoreAfter }
  };
  return appendHistoryEntry(updated, createEvent("victory_points.awarded", {
    playerId, amount, reason: reason.trim(), turn, round, scoreBefore, scoreAfter,
    ...(missionDefinitionId ? { missionDefinitionId } : {}),
    ...(category ? { category } : {}),
    ...(opportunityKey ? { opportunityKey } : {})
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
