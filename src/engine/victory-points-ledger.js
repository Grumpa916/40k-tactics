import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { SCORING_TIMINGS } from "../rules/mission-definition.js";

export const VICTORY_POINT_CAPS = Object.freeze({
  primaryPerTurn: 15,
  primaryPerGame: 45,
  secondaryPerTurn: 15,
  secondaryPerGame: 45,
  fixedSecondaryPerCard: 20
});

function getEffectiveAwardEvents(state, playerId = null) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const reversedIds = new Set(history
    .filter((event) => ["victory_points.award_undone", "victory_points.adjustment_undone"].includes(event?.type))
    .map((event) => event.payload?.originalAwardEventId)
    .filter((id) => id != null));
  const reversedIndices = new Set(history
    .filter((event) => ["victory_points.award_undone", "victory_points.adjustment_undone"].includes(event?.type))
    .map((event) => event.payload?.originalAwardEventIndex)
    .filter((index) => Number.isInteger(index)));
  return history
    .map((event, index) => ({ event, index }))
    .filter(({ event, index }) => event?.type === "victory_points.awarded" &&
      !reversedIndices.has(index) && (!event.id || !reversedIds.has(event.id)))
    .filter(({ event }) => playerId == null || event.payload?.playerId === playerId)
    .map(({ event }) => ({ eventId: event.id ?? null, ...event.payload }));
}

function calculateCappedAward(state, {
  playerId, amount, category, missionDefinitionId, missionMode, scoringTiming, turn, round
}) {
  if (category == null) return { amount, appliedCaps: [] };

  const prior = getEffectiveAwardEvents(state, playerId)
    .filter((entry) => entry.category === category);
  const turnUsed = prior
    .filter((entry) => entry.turn === turn && entry.round === round)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const gameUsed = prior.reduce((sum, entry) => sum + entry.amount, 0);
  const perTurnLimit = category === "primary"
    ? VICTORY_POINT_CAPS.primaryPerTurn
    : VICTORY_POINT_CAPS.secondaryPerTurn;
  const perGameLimit = category === "primary"
    ? VICTORY_POINT_CAPS.primaryPerGame
    : VICTORY_POINT_CAPS.secondaryPerGame;

  // The Event Companion v1.2 FAQ clarifies that end-of-battle VP is not
  // subject to the 15 VP per battle-round limit. Game and Fixed-card caps
  // still apply, so only the per-turn portion is bypassed.
  const exemptFromTurnCap = scoringTiming === SCORING_TIMINGS.END_OF_BATTLE;
  const turnRemaining = exemptFromTurnCap ? Number.POSITIVE_INFINITY : perTurnLimit - turnUsed;
  let allowed = Math.min(amount, turnRemaining, perGameLimit - gameUsed);
  const appliedCaps = [];
  if (!exemptFromTurnCap && amount > perTurnLimit - turnUsed) appliedCaps.push(category + "-turn");
  if (amount > perGameLimit - gameUsed) appliedCaps.push(category + "-game");

  if (category === "secondary" && missionMode === "fixed") {
    const cardUsed = prior
      .filter((entry) => entry.missionMode === "fixed" &&
        entry.missionDefinitionId === missionDefinitionId)
      .reduce((sum, entry) => sum + entry.amount, 0);
    const cardRemaining = VICTORY_POINT_CAPS.fixedSecondaryPerCard - cardUsed;
    if (amount > cardRemaining) appliedCaps.push("fixed-secondary-card");
    allowed = Math.min(allowed, cardRemaining);
  }

  if (allowed <= 0) {
    const capLabel = appliedCaps.includes("fixed-secondary-card")
      ? "the 20 VP Fixed Secondary card limit"
      : appliedCaps.includes(category + "-game")
        ? "the 45 VP " + category + " game limit"
        : "the 15 VP " + category + " turn limit";
    throw new Error("No VP can be added: " + capLabel + " has been reached.");
  }
  return { amount: allowed, appliedCaps: [...new Set(appliedCaps)] };
}

export function recordVictoryPointsAward(state, {
  playerId,
  amount,
  reason,
  missionDefinitionId = null,
  category = null,
  missionMode = null,
  opportunityKey = null,
  scoringTiming = null,
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
  if (scoringTiming !== null && !Object.values(SCORING_TIMINGS).includes(scoringTiming)) {
    throw new TypeError("Unsupported scoring timing: " + scoringTiming);
  }
  const priorAwards = getEffectiveAwardEvents(state, playerId);
  if (missionDefinitionId && opportunityKey && priorAwards.some((entry) =>
    entry.missionDefinitionId === missionDefinitionId && entry.opportunityKey === opportunityKey
  )) {
    throw new Error("This mission scoring opportunity has already been recorded.");
  }

  const capped = calculateCappedAward(state, {
    playerId, amount, category, missionDefinitionId, missionMode, scoringTiming, turn, round
  });
  const appliedAmount = capped.amount;
  const scores = state?.victoryPoints ?? {};
  const scoreBefore = Number.isInteger(scores[playerId]) ? scores[playerId] : 0;
  const scoreAfter = scoreBefore + appliedAmount;
  const updated = {
    ...state,
    victoryPoints: { ...scores, [playerId]: scoreAfter }
  };
  return appendHistoryEntry(updated, createEvent("victory_points.awarded", {
    playerId, amount: appliedAmount, reason: reason.trim(), turn, round, scoreBefore, scoreAfter,
    ...(appliedAmount !== amount ? { requestedAmount: amount } : {}),
    ...(capped.appliedCaps.length ? { appliedCaps: capped.appliedCaps } : {}),
    ...(missionDefinitionId ? { missionDefinitionId } : {}),
    ...(category ? { category } : {}),
    ...(missionMode ? { missionMode } : {}),
    ...(scoringTiming ? { scoringTiming } : {}),
    ...(opportunityKey ? { opportunityKey } : {})
  }));
}

export function adjustVictoryPoints(state, {
  playerId,
  amount,
  reason,
  turn = state?.turn ?? 0,
  round = state?.battle?.round ?? 0
} = {}) {
  if (typeof playerId !== "string" || !playerId.trim()) throw new TypeError("A playerId is required.");
  if (!Number.isInteger(amount) || amount === 0) {
    throw new TypeError("A manual VP adjustment must be a non-zero whole number.");
  }
  if (typeof reason !== "string" || !reason.trim()) throw new TypeError("An adjustment reason is required.");
  if (!Number.isInteger(turn) || turn < 0) throw new TypeError("Turn must be a non-negative integer.");
  if (!Number.isInteger(round) || round < 0) throw new TypeError("Round must be a non-negative integer.");

  const scores = state?.victoryPoints ?? {};
  const scoreBefore = Number.isInteger(scores[playerId]) && scores[playerId] >= 0 ? scores[playerId] : 0;
  const scoreAfter = scoreBefore + amount;
  if (scoreAfter < 0) throw new Error("A manual VP adjustment cannot reduce a player's score below 0.");

  const updated = { ...state, victoryPoints: { ...scores, [playerId]: scoreAfter } };
  return appendHistoryEntry(updated, createEvent("victory_points.adjusted", {
    playerId, amount, reason: reason.trim(), turn, round, scoreBefore, scoreAfter
  }));
}

/** Return whether an opportunity still has an effective, non-reversed VP award. */
export function hasEffectiveVictoryPointOpportunity(state, playerId, missionDefinitionId, opportunityKey) {
  if (typeof playerId !== "string" || !playerId.trim()) return false;
  if (typeof missionDefinitionId !== "string" || !missionDefinitionId.trim()) return false;
  if (typeof opportunityKey !== "string" || !opportunityKey.trim()) return false;
  return getEffectiveAwardEvents(state, playerId).some((entry) =>
    entry.missionDefinitionId === missionDefinitionId && entry.opportunityKey === opportunityKey
  );
}

export function getVictoryPointScore(state, playerId) {
  if (typeof playerId !== "string" || !playerId.trim()) throw new TypeError("A playerId is required.");
  const score = state?.victoryPoints?.[playerId];
  return Number.isInteger(score) && score >= 0 ? score : 0;
}

export function getVictoryPointHistory(state, playerId = null) {
  return (Array.isArray(state?.history) ? state.history : [])
    .filter((event) => ["victory_points.awarded", "victory_points.adjusted"].includes(event?.type))
    .filter((event) => playerId == null || event.payload?.playerId === playerId)
    .map((event) => ({ ...event.payload }));
}

/**
 * Undo only the most recent history event, and only when it is a VP award
 * whose resulting score is still current. The award remains in history and
 * an explicit reversal event is appended for auditability.
 */
export function undoLatestVictoryPointsAward(state, {
  playerId,
  reason = "Correct an incorrectly entered VP award",
  turn = state?.turn ?? 0,
  round = state?.battle?.round ?? 0
} = {}) {
  if (typeof playerId !== "string" || !playerId.trim()) throw new TypeError("A playerId is required.");
  if (typeof reason !== "string" || !reason.trim()) throw new TypeError("An undo reason is required.");
  if (!Number.isInteger(turn) || turn < 0) throw new TypeError("Turn must be a non-negative integer.");
  if (!Number.isInteger(round) || round < 0) throw new TypeError("Round must be a non-negative integer.");

  const history = Array.isArray(state?.history) ? state.history : [];
  const latest = history.at(-1);
  if (!["victory_points.awarded", "victory_points.adjusted"].includes(latest?.type) || latest.payload?.playerId !== playerId) {
    throw new Error("Only the latest history event can be undone, and it must be a VP entry for this player.");
  }

  const award = latest.payload;
  if (!Number.isInteger(award.amount) || award.amount === 0 ||
      !Number.isInteger(award.scoreBefore) || !Number.isInteger(award.scoreAfter) ||
      award.scoreAfter !== award.scoreBefore + award.amount) {
    throw new Error("The latest VP entry is not a valid reversible transaction.");
  }
  const currentScore = getVictoryPointScore(state, playerId);
  if (currentScore !== award.scoreAfter) {
    throw new Error("The player's current VP total no longer matches the latest award; refusing unsafe undo.");
  }

  const updated = {
    ...state,
    victoryPoints: { ...(state.victoryPoints ?? {}), [playerId]: award.scoreBefore }
  };
  return appendHistoryEntry(updated, createEvent(latest.type === "victory_points.adjusted"
    ? "victory_points.adjustment_undone" : "victory_points.award_undone", {
    playerId,
    amount: award.amount,
    reason: reason.trim(),
    originalReason: award.reason,
    originalAwardEventId: latest.id ?? null,
    originalAwardEventIndex: history.length - 1,
    missionDefinitionId: award.missionDefinitionId ?? null,
    category: award.category ?? null,
    opportunityKey: award.opportunityKey ?? null,
    turn,
    round,
    scoreBefore: currentScore,
    scoreAfter: award.scoreBefore
  }));
}

/** Return the latest award only when it is currently safe to undo. */
export function getLatestUndoableVictoryPointsAward(state, playerId = null) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const latest = history.at(-1);
  if (!["victory_points.awarded", "victory_points.adjusted"].includes(latest?.type)) return null;
  const award = latest.payload;
  if (playerId != null && award?.playerId !== playerId) return null;
  if (!award || !Number.isInteger(award.amount) || award.amount === 0 ||
      !Number.isInteger(award.scoreBefore) || !Number.isInteger(award.scoreAfter) ||
      award.scoreAfter !== award.scoreBefore + award.amount ||
      getVictoryPointScore(state, award.playerId) !== award.scoreAfter) return null;
  return { ...award };
}
