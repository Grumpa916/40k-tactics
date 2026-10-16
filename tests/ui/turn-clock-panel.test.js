import test from "node:test";
import assert from "node:assert/strict";
import { renderTurnClockPanel } from "../../src/ui/turn-clock-panel.js";

function state(overrides = {}) {
  return {
    phase: "command",
    activePlayer: "p1",
    turn: 2,
    battle: { status: "active", round: 1, activePlayerId: "p1" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    timers: {
      turnClock: {
        elapsedMsByPlayer: { p1: 65000, p2: 120000 },
        activePlayerId: "p1",
        running: false,
        startedAtMs: null
      }
    },
    ...overrides
  };
}

test("Turn Clock panel lists both players and accumulated elapsed time", () => {
  const html = renderTurnClockPanel(state(), { open: true });
  assert.match(html, /Turn Clock/);
  assert.match(html, /You/);
  assert.match(html, /Opponent/);
  assert.match(html, /01:05/);
  assert.match(html, /02:00/);
  assert.match(html, /Resume clock/);
  assert.match(html, /data-clock-player-elapsed="p1"/);
});

test("running Turn Clock offers pause and displays the clock owner", () => {
  const current = state({
    timers: {
      turnClock: {
        elapsedMsByPlayer: { p1: 10000, p2: 0 },
        activePlayerId: "p1",
        running: true,
        startedAtMs: 1000
      }
    }
  });
  const html = renderTurnClockPanel(current, { open: true, nowMs: 6000 });
  assert.match(html, /Pause clock/);
  assert.match(html, /Running for You/);
  assert.match(html, /00:15/);
});

test("Turn Clock remains accessible but hidden until opened", () => {
  const html = renderTurnClockPanel(state(), { open: false });
  assert.match(html, /data-turn-clock-panel role="region"/);
  assert.match(html, /hidden/);
});

test("starting a clock is disabled until a player turn exists", () => {
  const html = renderTurnClockPanel(state({
    activePlayer: null,
    battle: { status: "deployment", round: 0, activePlayerId: null },
    timers: { turnClock: { elapsedMsByPlayer: { p1: 0, p2: 0 }, activePlayerId: null, running: false, startedAtMs: null } }
  }), { open: true });
  assert.ok(html.includes("Start clock</button>"));
  assert.match(html, /disabled/);
});
