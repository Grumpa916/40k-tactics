import {
  getTurnSnapshot,
  getUnitStateAtTurnStart,
  getObjectiveStateAtTurnStart,
  getUnitDestructionsForTurn
} from "./scoring-evidence-state.js";

export const SCORING_EVIDENCE = Object.freeze({
  OBJECTIVE_CONTROL: "objective-control",
  UNIT_STATUS: "unit-status",
  UNIT_OWNERSHIP: "unit-ownership",
  UNIT_DESTRUCTION: "unit-destruction",
  TURN_SNAPSHOT: "turn-snapshot"
});

export function evaluateObjectiveControl(state, {
  objectiveId,
  playerId,
  expected = "controlled",
  turn = null
} = {}) {
  if (!objectiveId) throw new TypeError("objectiveId is required.");
  if (!playerId) throw new TypeError("playerId is required.");

  const objective = turn == null
    ? (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId) ?? null
    : getObjectiveStateAtTurnStart(state, objectiveId, turn);

  if (!objective) {
    return { eligible: false, evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL, reason: "Objective state is unavailable." };
  }

  const control = objective.control;
  let actual = "uncontrolled";
  if (control?.controlState === "contested") {
    actual = control.contestingPlayerIds?.includes(playerId) ? "contested" : "contested-by-others";
  } else if (control?.controllerId === playerId) {
    actual = "controlled";
  } else if (control?.controllerId) {
    actual = "enemy-controlled";
  }

  return {
    eligible: actual === expected,
    evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
    objectiveId,
    playerId,
    expected,
    actual,
    turn
  };
}

export function evaluateUnitStatus(state, {
  unitId,
  expected,
  turn = null
} = {}) {
  if (!unitId) throw new TypeError("unitId is required.");
  if (!expected) throw new TypeError("expected status is required.");

  const unit = turn == null
    ? (Array.isArray(state?.units) ? state.units : []).find((item) => item?.id === unitId) ?? null
    : getUnitStateAtTurnStart(state, unitId, turn);

  return {
    eligible: unit?.status === expected,
    evidence: SCORING_EVIDENCE.UNIT_STATUS,
    unitId,
    expected,
    actual: unit?.status ?? null,
    turn
  };
}

export function evaluateUnitOwnership(state, {
  unitId,
  playerId,
  turn = null
} = {}) {
  if (!unitId) throw new TypeError("unitId is required.");
  if (!playerId) throw new TypeError("playerId is required.");

  const unit = turn == null
    ? (Array.isArray(state?.units) ? state.units : []).find((item) => item?.id === unitId) ?? null
    : getUnitStateAtTurnStart(state, unitId, turn);

  return {
    eligible: unit?.ownerId === playerId,
    evidence: SCORING_EVIDENCE.UNIT_OWNERSHIP,
    unitId,
    playerId,
    ownerId: unit?.ownerId ?? null,
    turn
  };
}

export function evaluateUnitDestruction(state, {
  unitId,
  turn,
  expected = true
} = {}) {
  if (!unitId) throw new TypeError("unitId is required.");
  if (!Number.isInteger(turn) || turn < 0) {
    throw new TypeError("turn must be a non-negative integer.");
  }

  const destroyed = getUnitDestructionsForTurn(state, turn).some(
    (event) => event.unitId === unitId
  );

  return {
    eligible: destroyed === expected,
    evidence: SCORING_EVIDENCE.UNIT_DESTRUCTION,
    unitId,
    turn,
    expected,
    actual: destroyed
  };
}

export function evaluateTurnSnapshot(state, { turn } = {}) {
  if (!Number.isInteger(turn) || turn < 0) {
    throw new TypeError("turn must be a non-negative integer.");
  }

  return {
    eligible: Boolean(getTurnSnapshot(state, turn)),
    evidence: SCORING_EVIDENCE.TURN_SNAPSHOT,
    turn
  };
}
