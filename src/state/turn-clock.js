function nonNegativeNumber(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function getTurnClockState(state = {}) {
  const stored = state?.timers?.turnClock ?? {};
  return {
    elapsedMsByPlayer: { ...(stored.elapsedMsByPlayer ?? {}) },
    activePlayerId: stored.activePlayerId ?? null,
    running: stored.running === true,
    startedAtMs: Number.isFinite(stored.startedAtMs) ? stored.startedAtMs : null
  };
}

export function getTurnClockElapsedMs(state = {}, playerId, nowMs = Date.now()) {
  if (!playerId) return 0;
  const clock = getTurnClockState(state);
  let elapsed = nonNegativeNumber(clock.elapsedMsByPlayer[playerId]);
  if (clock.running && clock.activePlayerId === playerId && Number.isFinite(clock.startedAtMs)) {
    elapsed += Math.max(0, nowMs - clock.startedAtMs);
  }
  return Math.floor(elapsed);
}

export function formatElapsedTime(milliseconds) {
  const totalSeconds = Math.floor(nonNegativeNumber(milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");
  return hours > 0
    ? pad(hours) + ":" + pad(minutes) + ":" + pad(seconds)
    : pad(minutes) + ":" + pad(seconds);
}

/**
 * Called only when the active player changes, never for a phase transition.
 * The previous player's running interval is committed before the next clock
 * starts, so each player's total remains independently accumulated.
 */
export function updateTurnClockForPlayer(state, nextPlayerId, nowMs = Date.now()) {
  const stored = state?.timers?.turnClock;
  if (!stored || typeof stored !== "object") return state;

  const clock = getTurnClockState(state);
  if (clock.activePlayerId === (nextPlayerId ?? null)) return state;
  const elapsedMsByPlayer = { ...clock.elapsedMsByPlayer };
  if (clock.running && clock.activePlayerId && Number.isFinite(clock.startedAtMs)) {
    elapsedMsByPlayer[clock.activePlayerId] =
      nonNegativeNumber(elapsedMsByPlayer[clock.activePlayerId]) +
      Math.max(0, nowMs - clock.startedAtMs);
  }

  const running = clock.running && Boolean(nextPlayerId);
  return {
    ...state,
    timers: {
      ...(state.timers ?? {}),
      turnClock: {
        ...clock,
        elapsedMsByPlayer,
        activePlayerId: nextPlayerId ?? null,
        running,
        startedAtMs: running ? nowMs : null
      }
    }
  };
}
