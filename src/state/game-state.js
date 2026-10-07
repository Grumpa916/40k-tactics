export const GAME_STATE_VERSION = 1;

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
    ...overrides
  };
}
