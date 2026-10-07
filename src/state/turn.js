export const PHASES = Object.freeze([
  "command",
  "movement",
  "shooting",
  "charge",
  "fight"
]);

export const TURN_STEPS = Object.freeze([
  "start_turn",
  ...PHASES,
  "end_turn"
]);

export function createTurn({ number = 1, activePlayerId, phase = "start_turn" } = {}) {
  if (!activePlayerId) {
    throw new TypeError("An active player is required.");
  }
  if (!TURN_STEPS.includes(phase)) {
    throw new RangeError("Unknown turn step or phase: " + phase);
  }
  return { number, activePlayerId, phase };
}
