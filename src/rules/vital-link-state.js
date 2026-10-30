import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";

const MISSION_ID = "primary-vital-link";

function players(state) {
  return Array.isArray(state?.players) ? state.players : [];
}

function defaultPerspectivePlayerId(state) {
  return players(state)[0]?.id ?? state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
}

function missionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!playerId || !setup?.myDisposition || !setup?.opponentDisposition) return null;
  const definitions = getBattlePrimaryMissionDefinitions(setup.myDisposition, setup.opponentDisposition);
  if (!definitions) return null;
  return playerId === perspectivePlayerId ? definitions.myMission : definitions.opponentMission;
}

export function isVitalLinkMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === MISSION_ID;
}

function objectiveText(objective) {
  return [objective?.name, objective?.label, objective?.layoutObjective, objective?.role, objective?.kind]
    .filter(Boolean).join(" ");
}

export function isVitalLinkCentralObjective(objective) {
  return /cent(er|ral)/i.test(objectiveText(objective));
}

function actionKey(payload) {
  return [payload?.round, payload?.turn, payload?.unitId].join(":");
}

function relevantAttempt(payload, playerId) {
  return payload?.missionDefinitionId === MISSION_ID &&
    payload?.playerId === playerId &&
    typeof payload?.objectiveId === "string" && payload.objectiveId.length > 0;
}

function deriveActionState(state, playerId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const attempts = new Map();
  const reviewed = new Set();
  const markers = [];
  const round = state?.battle?.round ?? null;
  const turn = state?.turn ?? null;
  let usedThisTurn = false;

  for (const event of history) {
    if (event?.type === "shooting.unit_activated" && relevantAttempt(event.payload, playerId)) {
      const key = actionKey(event.payload);
      const attempt = Object.freeze({
        actionKey: key,
        objectiveId: event.payload.objectiveId,
        unitId: event.payload.unitId,
        round: event.payload.round,
        turn: event.payload.turn
      });
      attempts.set(key, attempt);
      if (attempt.round === round && attempt.turn === turn) usedThisTurn = true;
      continue;
    }

    if (event?.type === "mission_action.reviewed" && event.payload?.playerId === playerId) {
      const attempt = attempts.get(event.payload?.actionKey);
      if (!attempt) continue;
      reviewed.add(event.payload.actionKey);
      if (event.payload?.outcome !== "completed") continue;
      markers.push(Object.freeze({
        objectiveId: attempt.objectiveId,
        unitId: attempt.unitId,
        completedRound: Number.isInteger(event.payload?.round) ? event.payload.round : attempt.round,
        completedTurn: Number.isInteger(event.payload?.turn) ? event.payload.turn : attempt.turn,
        actionKey: event.payload.actionKey
      }));
    }
  }

  const pendingAttempts = [];
  for (const attempt of attempts.values()) {
    if (attempt.round === round && attempt.turn === turn && !reviewed.has(attempt.actionKey)) pendingAttempts.push(attempt);
  }

  const markerCountByObjective = {};
  for (const marker of markers) {
    markerCountByObjective[marker.objectiveId] = (markerCountByObjective[marker.objectiveId] ?? 0) + 1;
  }

  return Object.freeze({
    usedThisTurn,
    pendingAttempts: Object.freeze(pendingAttempts),
    pendingObjectiveIds: Object.freeze([...new Set(pendingAttempts.map((attempt) => attempt.objectiveId))]),
    markers: Object.freeze(markers),
    markerCount: markers.length,
    markerCountByObjective: Object.freeze(markerCountByObjective)
  });
}

export function getVitalLinkState(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const active = isVitalLinkMissionForPlayer(state, playerId, perspectivePlayerId);
  if (!active) {
    return Object.freeze({
      active: false,
      missionId: null,
      missionName: null,
      playerHomeRoleKnown: false,
      opponentHomeRoleKnown: false,
      centralRoleKnown: false,
      playerHomeObjectiveIds: Object.freeze([]),
      opponentHomeObjectiveIds: Object.freeze([]),
      centralObjectiveIds: Object.freeze([]),
      usedThisTurn: false,
      actionAvailableThisTurn: false,
      pendingAttempts: Object.freeze([]),
      pendingObjectiveIds: Object.freeze([]),
      markers: Object.freeze([]),
      markerCount: 0,
      markerCountByObjective: Object.freeze({})
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const playerHomeObjectiveIds = Object.freeze(objectives
    .filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId))
    .map((objective) => objective.id));
  const opponentIds = players(state).map((player) => player?.id).filter((id) => id && id !== playerId);
  const opponentHomeObjectiveIds = Object.freeze(objectives
    .filter((objective) => opponentIds.some((opponentId) => isPlayerHomeObjective(state, objective, opponentId, perspectivePlayerId)))
    .map((objective) => objective.id));
  const centralObjectiveIds = Object.freeze(objectives.filter(isVitalLinkCentralObjective).map((objective) => objective.id));
  const action = deriveActionState(state, playerId);

  return Object.freeze({
    active: true,
    missionId: mission?.id ?? MISSION_ID,
    missionName: mission?.name ?? "Vital Link",
    playerHomeRoleKnown: playerHomeObjectiveIds.length > 0,
    opponentHomeRoleKnown: opponentHomeObjectiveIds.length > 0,
    centralRoleKnown: centralObjectiveIds.length > 0,
    playerHomeObjectiveIds,
    opponentHomeObjectiveIds,
    centralObjectiveIds,
    usedThisTurn: action.usedThisTurn,
    actionAvailableThisTurn: centralObjectiveIds.length > 0 && !action.usedThisTurn,
    pendingAttempts: action.pendingAttempts,
    pendingObjectiveIds: action.pendingObjectiveIds,
    markers: action.markers,
    markerCount: action.markerCount,
    markerCountByObjective: action.markerCountByObjective
  });
}

export function getVitalLinkObjectiveOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId || !isVitalLinkMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze([]);
  const vital = getVitalLinkState(state, { playerId, perspectivePlayerId });
  if (!vital.actionAvailableThisTurn) return Object.freeze([]);
  const centralIds = new Set(vital.centralObjectiveIds);
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  return Object.freeze(objectives
    .filter((objective) => objective?.id && centralIds.has(objective.id))
    .map((objective) => Object.freeze({
      objectiveId: objective.id,
      name: objective.name ?? objective.layoutObjective ?? objective.id,
      controlledByPlayer: objective?.control?.controlState === "controlled" && objective?.control?.controllerId === playerId,
      markerCount: vital.markerCountByObjective[objective.id] ?? 0
    })));
}
