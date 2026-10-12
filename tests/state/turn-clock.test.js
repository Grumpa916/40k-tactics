import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { startTurnClock, pauseTurnClock } from "../../src/engine/turn-clock-transitions.js";
import { getTurnClockElapsedMs, formatElapsedTime, updateTurnClockForPlayer } from "../../src/state/turn-clock.js";

function activeState(overrides = {}) {
  return createGameState({
    phase: "command",
    turn: 1,
    activePlayer: "p1",
    battle: { id: "b1", status: "active", round: 1, activePlayerId: "p1", firstPlayerId: "p1" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    ...overrides
  });
}

test("Turn Clock starts, pauses and resumes without losing accumulated time", () => {
  let state = startTurnClock(activeState(), { nowMs: 1000 });
  assert.equal(state.timers.turnClock.running, true);
  assert.equal(getTurnClockElapsedMs(state, "p1", 4000), 3000);
  state = pauseTurnClock(state, { nowMs: 5000 });
  assert.equal(state.timers.turnClock.running, false);
  assert.equal(state.timers.turnClock.elapsedMsByPlayer.p1, 4000);
  assert.equal(state.history.at(-1).type, "turn_clock.paused");

  state = startTurnClock(state, { nowMs: 9000 });
  assert.equal(state.history.at(-1).type, "turn_clock.started");
  assert.equal(state.timers.turnClock.startedAtMs, 9000);
  assert.equal(getTurnClockElapsedMs(state, "p1", 10000), 5000);
});

test("the clock only switches when the active player changes, not when phases change", () => {
  const state = startTurnClock(activeState(), { nowMs: 1000 });
  const sameTurn = updateTurnClockForPlayer({
    ...state,
    phase: "movement"
  }, "p1", 4000);
  assert.equal(sameTurn.timers.turnClock.elapsedMsByPlayer.p1 ?? 0, 0);
  assert.equal(sameTurn.timers.turnClock.activePlayerId, "p1");
  assert.equal(sameTurn.timers.turnClock.running, true);
  assert.equal(sameTurn.timers.turnClock.startedAtMs, 1000);
  assert.equal(getTurnClockElapsedMs(sameTurn, "p1", 4000), 3000);
});

test("turn transition commits the previous player's time and starts the next player's clock", () => {
  const running = startTurnClock(activeState(), { nowMs: 1000 });
  const next = updateTurnClockForPlayer({
    ...running,
    activePlayer: "p2",
    battle: { ...running.battle, activePlayerId: "p2" },
    turn: 2
  }, "p2", 61000);
  assert.equal(next.timers.turnClock.elapsedMsByPlayer.p1, 60000);
  assert.equal(next.timers.turnClock.activePlayerId, "p2");
  assert.equal(next.timers.turnClock.running, true);
  assert.equal(next.timers.turnClock.startedAtMs, 61000);
  assert.equal(getTurnClockElapsedMs(next, "p2", 67000), 6000);
});

test("pausing an already paused clock is a safe no-op and start requires an active turn", () => {
  const state = activeState();
  assert.equal(pauseTurnClock(state, { nowMs: 2000 }), state);
  assert.throws(() => startTurnClock(activeState({
    activePlayer: null,
    battle: { id: "b1", status: "active", round: 1, activePlayerId: null }
  }), { nowMs: 1000 }), /active player turn/);
});

test("clock formatting supports minutes and hours", () => {
  assert.equal(formatElapsedTime(65000), "01:05");
  assert.equal(formatElapsedTime(3661000), "01:01:01");
  assert.equal(formatElapsedTime(-5000), "00:00");
});
