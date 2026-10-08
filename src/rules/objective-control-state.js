export const OBJECTIVE_CONTROL_STATES = Object.freeze({
  UNCONTROLLED: "uncontrolled",
  CONTROLLED: "controlled",
  CONTESTED: "contested"
});

export function createObjectiveState({
  id,
  controllerId = null,
  contestingPlayerIds = [],
  controlState = null
} = {}) {
  if (!id) throw new TypeError("Objective id is required.");
  if (!Array.isArray(contestingPlayerIds)) {
    throw new TypeError("Objective contestingPlayerIds must be an array.");
  }

  const uniqueContesters = [...new Set(contestingPlayerIds.filter(Boolean))];

  let resolvedState = controlState;
  if (!resolvedState) {
    if (uniqueContesters.length > 1) {
      resolvedState = OBJECTIVE_CONTROL_STATES.CONTESTED;
    } else if (controllerId) {
      resolvedState = OBJECTIVE_CONTROL_STATES.CONTROLLED;
    } else {
      resolvedState = OBJECTIVE_CONTROL_STATES.UNCONTROLLED;
    }
  }

  if (!Object.values(OBJECTIVE_CONTROL_STATES).includes(resolvedState)) {
    throw new RangeError("Unknown objective control state: " + resolvedState);
  }

  if (resolvedState === OBJECTIVE_CONTROL_STATES.CONTROLLED && !controllerId) {
    throw new Error("A controlled objective requires a controller.");
  }
  if (resolvedState === OBJECTIVE_CONTROL_STATES.CONTESTED && uniqueContesters.length < 2) {
    throw new Error("A contested objective requires at least two contesting players.");
  }

  return Object.freeze({
    id,
    controllerId,
    contestingPlayerIds: Object.freeze(uniqueContesters),
    controlState: resolvedState
  });
}

export function getObjectiveControl(state, objectiveId) {
  if (!objectiveId) throw new TypeError("objectiveId is required.");
  const objective = (Array.isArray(state?.objectives) ? state.objectives : [])
    .find((item) => item?.id === objectiveId);
  return objective?.control ?? null;
}

export function getObjectiveControlForPlayer(state, { playerId, objectiveId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");

  const control = getObjectiveControl(state, objectiveId);
  if (!control) return null;

  if (control.controlState === OBJECTIVE_CONTROL_STATES.CONTROLLED) {
    return control.controllerId === playerId ? "controlled" : "enemy-controlled";
  }
  if (control.controlState === OBJECTIVE_CONTROL_STATES.CONTESTED) {
    return control.contestingPlayerIds.includes(playerId) ? "contested" : "contested-by-others";
  }
  return "uncontrolled";
}
