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

export function createTurn({ number = 1, activePlayerId, phase = "command" } = {}) {
  if (!activePlayerId) {
    throw new TypeError("An active player is required.");
  }
  if (!PHASES.includes(phase)) {
    throw new RangeError("Unknown phase: " + phase);
  }
  return { number, activePlayerId, phase };
}
