import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";

const MISSION_ID = "primary-gather-intel";

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

export function isGatherIntelMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === MISSION_ID;
}

function actionKey(payload) {
  return [payload?.round, payload?.turn, payload?.unitId].join(":");
}

function relevantAttempt(payload, playerId) {
  return payload?.missionDefinitionId === MISSION_ID &&
    payload?.playerId === playerId &&
    typeof payload?.objectiveId === "string" && payload.objectiveId.length > 0;
}

function objectiveText(objective) {
  return [objective?.name, objective?.label, objective?.layoutObjective, objective?.role, objective?.kind]
    .filter(Boolean).join(" ");
}

export function isGatherIntelCentralObjective(objective) {
  return /cent(er|ral)/i.test(objectiveText(objective));
}

function deriveActionState(state, playerId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const attempts = new Map();
  const reviewed = new Set();
  const markers = new Map();
  const round = state?.battle?.round ?? null;
  const turn = state?.turn ?? null;
  const completedThisTurn = [];

  for (const event of history) {
    if (event?.type === "shooting.unit_activated" && relevantAttempt(event.payload, playerId)) {
      const key = actionKey(event.payload);
      attempts.set(key, Object.freeze({
        actionKey: key,
        objectiveId: event.payload.objectiveId,
        unitId: event.payload.unitId,
        round: event.payload.round,
        turn: event.payload.turn
      }));
      continue;
    }

    if (event?.type === "mission_action.reviewed" && event.payload?.playerId === playerId) {
      const attempt = attempts.get(event.payload?.actionKey);
      if (!attempt) continue;
      reviewed.add(event.payload.actionKey);
      if (event.payload?.outcome !== "completed") continue;

      const marker = Object.freeze({
        objectiveId: attempt.objectiveId,
        unitId: attempt.unitId,
        completedRound: Number.isInteger(event.payload?.round) ? event.payload.round : attempt.round,
        completedTurn: Number.isInteger(event.payload?.turn) ? event.payload.turn : attempt.turn,
        actionKey: event.payload.actionKey
      });
      markers.set(attempt.objectiveId, marker);
      if (attempt.round === round && attempt.turn === turn) completedThisTurn.push(marker);
    }
  }

  const pendingAttempts = [];
  for (const attempt of attempts.values()) {
    if (attempt.round === round && attempt.turn === turn && !reviewed.has(attempt.actionKey)) {
      pendingAttempts.push(attempt);
    }
  }

  return Object.freeze({
    markerObjectiveIds: Object.freeze([...markers.keys()]),
    pendingAttempts: Object.freeze(pendingAttempts),
    pendingObjectiveIds: Object.freeze([...new Set(pendingAttempts.map((attempt) => attempt.objectiveId))]),
    completedThisTurn: Object.freeze(completedThisTurn),
    completedThisTurnCount: completedThisTurn.length
  });
}

export function getGatherIntelState(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const active = isGatherIntelMissionForPlayer(state, playerId, perspectivePlayerId);
  if (!active) {
    return Object.freeze({
      active: false,
      missionId: null,
      missionName: null,
      homeRoleKnown: false,
      playerHomeObjectiveIds: Object.freeze([]),
      opponentHomeObjectiveIds: Object.freeze([]),
      centralObjectiveIds: Object.freeze([]),
      markerObjectiveIds: Object.freeze([]),
      pendingObjectiveIds: Object.freeze([]),
      pendingAttempts: Object.freeze([]),
      completedThisTurn: Object.freeze([]),
      completedThisTurnCount: 0,
      markerCount: 0,
      threeMarkerThresholdMet: false,
      markerAtOpponentHome: false,
      actionAvailableThisTurn: false
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
  const centralObjectiveIds = Object.freeze(objectives.filter(isGatherIntelCentralObjective).map((objective) => objective.id));
  const homeRoleKnown = playerHomeObjectiveIds.length > 0 && opponentHomeObjectiveIds.length > 0;
  const action = deriveActionState(state, playerId);
  const markerSet = new Set(action.markerObjectiveIds);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const markerAtOpponentHome = opponentHomeObjectiveIds.some((objectiveId) => markerSet.has(objectiveId));

  return Object.freeze({
    active: true,
    missionId: mission?.id ?? MISSION_ID,
    missionName: mission?.name ?? "Gather Intel",
    homeRoleKnown,
    playerHomeObjectiveIds,
    opponentHomeObjectiveIds,
    centralObjectiveIds,
    markerObjectiveIds: action.markerObjectiveIds,
    pendingObjectiveIds: action.pendingObjectiveIds,
    pendingAttempts: action.pendingAttempts,
    completedThisTurn: action.completedThisTurn,
    completedThisTurnCount: action.completedThisTurnCount,
    markerCount: action.markerObjectiveIds.length,
    threeMarkerThresholdMet: action.markerObjectiveIds.length >= 3,
    markerAtOpponentHome,
    actionAvailableThisTurn: round >= 2 && homeRoleKnown && getGatherIntelObjectiveOptions(state, { playerId, perspectivePlayerId, stateOverride: action }).length > 0
  });
}

export function getGatherIntelObjectiveOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  stateOverride = null
} = {}) {
  if (!playerId || !isGatherIntelMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze([]);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  if (round < 2) return Object.freeze([]);

  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const homeIds = new Set(objectives
    .filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId))
    .map((objective) => objective.id));
  if (!homeIds.size) return Object.freeze([]);

  const action = stateOverride ?? deriveActionState(state, playerId);
  const markerIds = new Set(action.markerObjectiveIds ?? []);
  const pendingIds = new Set(action.pendingObjectiveIds ?? []);
  const opponentIds = players(state).map((player) => player?.id).filter((id) => id && id !== playerId);
  const opponentHomeIds = new Set(objectives
    .filter((objective) => opponentIds.some((opponentId) => isPlayerHomeObjective(state, objective, opponentId, perspectivePlayerId)))
    .map((objective) => objective.id));

  return Object.freeze(objectives
    .filter((objective) => objective?.id && !homeIds.has(objective.id) && !markerIds.has(objective.id) && !pendingIds.has(objective.id))
    .map((objective) => Object.freeze({
      objectiveId: objective.id,
      name: objective.name ?? objective.layoutObjective ?? objective.id,
      controlledByPlayer: objective?.control?.controlState === "controlled" && objective?.control?.controllerId === playerId,
      central: isGatherIntelCentralObjective(objective),
      opponentHome: opponentHomeIds.has(objective.id)
    })));
}
