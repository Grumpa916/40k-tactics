import { BATTLE_STATUS } from "../state/battle.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { getTurnClockState } from "../state/turn-clock.js";

function activePlayerId(state) {
  return state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
}

function clockEvent(state, type, payload, clock) {
  return appendHistoryEntry({
    ...state,
    timers: {
      ...(state.timers ?? {}),
      turnClock: clock
    }
  }, createEvent(type, {
    playerId: clock.activePlayerId,
    round: state.battle?.round ?? null,
    turn: state.turn ?? null,
    ...payload
  }));
}

export function startTurnClock(state, { nowMs = Date.now() } = {}) {
  if (state?.battle?.status !== BATTLE_STATUS.ACTIVE) {
    throw new Error("The Turn Clock can only run during an active battle.");
  }
  if (!Number.isFinite(nowMs)) throw new TypeError("A valid clock timestamp is required.");
  const playerId = activePlayerId(state);
  if (!playerId) throw new Error("The Turn Clock needs an active player turn.");
  const previous = getTurnClockState(state);
  if (previous.running) return state;

  const clock = {
    ...previous,
    activePlayerId: playerId,
    running: true,
    startedAtMs: nowMs
  };
  return clockEvent(state, "turn_clock.started", { resumed: Object.values(previous.elapsedMsByPlayer).some((value) => value > 0) }, clock);
}

export function pauseTurnClock(state, { nowMs = Date.now() } = {}) {
  if (!Number.isFinite(nowMs)) throw new TypeError("A valid clock timestamp is required.");
  const previous = getTurnClockState(state);
  if (!previous.running) return state;
  const elapsedMsByPlayer = { ...previous.elapsedMsByPlayer };
  if (previous.activePlayerId && Number.isFinite(previous.startedAtMs)) {
    elapsedMsByPlayer[previous.activePlayerId] =
      (Number.isFinite(elapsedMsByPlayer[previous.activePlayerId]) ? elapsedMsByPlayer[previous.activePlayerId] : 0) +
      Math.max(0, nowMs - previous.startedAtMs);
  }
  const clock = {
    ...previous,
    elapsedMsByPlayer,
    running: false,
    startedAtMs: null
  };
  const elapsedMs = clock.elapsedMsByPlayer[clock.activePlayerId] ?? 0;
  return clockEvent(state, "turn_clock.paused", { elapsedMs }, clock);
}
