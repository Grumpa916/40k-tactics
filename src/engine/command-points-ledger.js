import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";

export const COMMAND_POINT_REASONS = Object.freeze({
  GAIN: "gain",
  SPEND: "spend",
  ADJUSTMENT: "adjustment"
});

function readBalance(state, playerId) {
  const value = state?.commandPoints?.[playerId];
  if (Number.isFinite(value)) return value;
  if (Number.isFinite(value?.current)) return value.current;
  return 0;
}

function withBalance(state, playerId, balance) {
  const ledger = state.commandPoints ?? {};
  const previous = ledger[playerId];
  return {
    ...state,
    commandPoints: {
      ...ledger,
      [playerId]: previous && typeof previous === "object"
        ? { ...previous, current: balance }
        : balance
    }
  };
}

export function recordCommandPointChange(state, {
  playerId,
  amount,
  reason,
  note = "",
  turn = state?.turn ?? 0,
  round = state?.battle?.round ?? 0
} = {}) {
  if (!playerId || typeof playerId !== "string") throw new TypeError("A playerId is required.");
  if (!Number.isInteger(amount) || amount === 0) throw new TypeError("Command point change must be a non-zero integer.");
  if (!Object.values(COMMAND_POINT_REASONS).includes(reason)) {
    throw new RangeError("Command point reason must be gain, spend, or adjustment.");
  }
  if (reason === COMMAND_POINT_REASONS.GAIN && amount < 0) {
    throw new RangeError("A gain must use a positive amount.");
  }
  if (reason === COMMAND_POINT_REASONS.SPEND && amount > 0) {
    throw new RangeError("A spend must use a negative amount.");
  }
  if (typeof note !== "string") throw new TypeError("Command point note must be a string.");
  if (!Number.isInteger(turn) || turn < 0) throw new TypeError("Turn must be a non-negative integer.");
  if (!Number.isInteger(round) || round < 0) throw new TypeError("Round must be a non-negative integer.");

  const balanceBefore = readBalance(state, playerId);
  const balanceAfter = balanceBefore + amount;
  if (balanceAfter < 0) throw new RangeError("Command point balance cannot be negative.");

  const updated = withBalance(state, playerId, balanceAfter);
  return appendHistoryEntry(updated, createEvent("command_points.changed", {
    playerId,
    amount,
    reason,
    note: note.trim(),
    turn,
    round,
    balanceBefore,
    balanceAfter
  }));
}

export function getCommandPointBalance(state, playerId) {
  if (!playerId) throw new TypeError("A playerId is required.");
  return readBalance(state, playerId);
}

export function getCommandPointHistory(state, playerId = null) {
  return (Array.isArray(state?.history) ? state.history : [])
    .filter((event) => event?.type === "command_points.changed")
    .filter((event) => playerId == null || event.payload?.playerId === playerId)
    .map((event) => ({ ...event.payload }));
}
