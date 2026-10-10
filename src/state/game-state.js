import { GAME_STATE_VERSION } from "./version.js";

export { GAME_STATE_VERSION };

export function createGameState(overrides = {}) {
  return {
    version: GAME_STATE_VERSION,
    phase: "setup",
    turn: 0,
    activePlayer: null,
    players: [],
    battle: null,
    units: [],
    objectives: [],
    commandPoints: {},
    timers: {},
    history: [],
    scoring: { turnSnapshots: [], secondaryMissionMode: null },
    ...overrides
  };
}
