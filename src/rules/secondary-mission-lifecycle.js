export const SECONDARY_MISSION_STATUS = Object.freeze({
  ACTIVE: "active",
  SCORED: "scored",
  DISCARDED: "discarded"
});

function normalizeMissionDefinition(definition) {
  if (!definition || typeof definition.id !== "string" || !definition.id) {
    throw new TypeError("A secondary mission definition with an id is required.");
  }
  if (definition.category !== "secondary") {
    throw new Error("Only definitions categorized as secondary can enter the secondary mission lifecycle.");
  }
  return Object.freeze({ ...definition });
}

function missionList(state) {
  const list = state?.scoring?.secondaryMissions;
  return Array.isArray(list) ? list : [];
}

function withMissionList(state, secondaryMissions) {
  return {
    ...state,
    scoring: {
      ...(state.scoring ?? {}),
      secondaryMissions
    }
  };
}

/** Add a newly drawn secondary mission without changing the player's VP score. */
export function drawSecondaryMission(state, {
  definition,
  playerId,
  round = state?.battle?.round ?? 0,
  turn = state?.turn ?? 0
} = {}) {
  if (!playerId) throw new TypeError("The player drawing the secondary mission is required.");
  if (!Number.isInteger(round) || round < 0) throw new TypeError("Round must be a non-negative integer.");
  if (!Number.isInteger(turn) || turn < 0) throw new TypeError("Turn must be a non-negative integer.");
  const normalized = normalizeMissionDefinition(definition);
  const existing = missionList(state);
  if (existing.some((entry) => entry.playerId === playerId &&
      entry.definitionId === normalized.id && entry.status === SECONDARY_MISSION_STATUS.ACTIVE)) {
    throw new Error("This secondary mission is already active for that player.");
  }
  const entry = Object.freeze({
    instanceId: playerId + ":" + normalized.id + ":" + round + ":" + turn + ":" + (existing.length + 1),
    definitionId: normalized.id,
    definition: normalized,
    playerId,
    status: SECONDARY_MISSION_STATUS.ACTIVE,
    drawnRound: round,
    drawnTurn: turn,
    resolvedRound: null,
    resolvedTurn: null
  });
  return withMissionList(state, [...existing, entry]);
}

/** Mark an active secondary as scored or discarded; scoring itself is recorded separately. */
export function resolveSecondaryMission(state, {
  instanceId,
  playerId,
  status,
  round = state?.battle?.round ?? 0,
  turn = state?.turn ?? 0
} = {}) {
  if (!instanceId) throw new TypeError("A secondary mission instance id is required.");
  if (!playerId) throw new TypeError("The resolving player is required.");
  if (![SECONDARY_MISSION_STATUS.SCORED, SECONDARY_MISSION_STATUS.DISCARDED].includes(status)) {
    throw new Error("A secondary mission can only be resolved as scored or discarded.");
  }
  const existing = missionList(state);
  const index = existing.findIndex((entry) => entry.instanceId === instanceId);
  if (index < 0) throw new Error("Secondary mission instance not found.");
  const entry = existing[index];
  if (entry.playerId !== playerId) throw new Error("Only the owning player can resolve this secondary mission.");
  if (entry.status !== SECONDARY_MISSION_STATUS.ACTIVE) throw new Error("Only an active secondary mission can be resolved.");
  if (!Number.isInteger(round) || round < 0 || !Number.isInteger(turn) || turn < 0) {
    throw new TypeError("Round and turn must be non-negative integers.");
  }
  const updated = Object.freeze({ ...entry, status, resolvedRound: round, resolvedTurn: turn });
  return withMissionList(state, existing.map((item, i) => i === index ? updated : item));
}

export function getActiveSecondaryMissionDefinitions(state, playerId) {
  if (!playerId) throw new TypeError("A player id is required.");
  return missionList(state)
    .filter((entry) => entry.playerId === playerId && entry.status === SECONDARY_MISSION_STATUS.ACTIVE)
    .map((entry) => entry.definition);
}

export function getSecondaryMissionHistory(state, playerId = null) {
  return missionList(state)
    .filter((entry) => playerId == null || entry.playerId === playerId)
    .map((entry) => ({ ...entry }));
}
