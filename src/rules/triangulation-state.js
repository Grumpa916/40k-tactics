import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";

const MISSION_ID = "primary-triangulation";

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

export function isTriangulationMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
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

function deriveActionState(state, playerId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const attempts = new Map();
  const reviewed = new Set();
  const triangulated = new Map();
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
      if (event.payload?.round === round && event.payload?.turn === turn) usedThisTurn = true;
      continue;
    }

    if (event?.type === "mission_action.reviewed" && event.payload?.playerId === playerId) {
      const attempt = attempts.get(event.payload?.actionKey);
      if (!attempt) continue;
      reviewed.add(event.payload.actionKey);
      if (event.payload?.outcome === "completed") {
        triangulated.set(attempt.objectiveId, Object.freeze({
          objectiveId: attempt.objectiveId,
          unitId: attempt.unitId,
          completedRound: Number.isInteger(event.payload?.round) ? event.payload.round : attempt.round,
          completedTurn: Number.isInteger(event.payload?.turn) ? event.payload.turn : attempt.turn,
          actionKey: event.payload.actionKey
        }));
      }
    }
  }

  const pendingObjectiveIds = [];
  for (const attempt of attempts.values()) {
    if (attempt.round === round && attempt.turn === turn && !reviewed.has(attempt.actionKey)) {
      pendingObjectiveIds.push(attempt.objectiveId);
    }
  }

  return Object.freeze({
    usedThisTurn,
    pendingObjectiveIds: Object.freeze([...new Set(pendingObjectiveIds)]),
    triangulatedObjectiveIds: Object.freeze([...triangulated.keys()])
  });
}

export function getTriangulationTierVp(count) {
  const value = Math.max(0, Number(count) || 0);
  if (value >= 3) return 10;
  if (value === 2) return 6;
  if (value === 1) return 3;
  return 0;
}

export function getTriangulationState(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const active = isTriangulationMissionForPlayer(state, playerId, perspectivePlayerId);
  if (!active) {
    return Object.freeze({
      active: false,
      missionId: null,
      missionName: null,
      homeRoleKnown: false,
      playerHomeObjectiveIds: Object.freeze([]),
      triangulatedObjectiveIds: Object.freeze([]),
      pendingObjectiveIds: Object.freeze([]),
      triangulatedCount: 0,
      triangulatedTierVp: 0,
      usedThisTurn: false,
      actionAvailableThisTurn: false
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const homeObjectives = objectives.filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const playerHomeObjectiveIds = Object.freeze(homeObjectives.map((objective) => objective.id));
  const homeRoleKnown = playerHomeObjectiveIds.length > 0;
  const action = deriveActionState(state, playerId);
  const triangulatedCount = action.triangulatedObjectiveIds.length;
  const round = Math.max(1, Number(state?.battle?.round) || 1);

  return Object.freeze({
    active: true,
    missionId: mission?.id ?? MISSION_ID,
    missionName: mission?.name ?? "Triangulation",
    homeRoleKnown,
    playerHomeObjectiveIds,
    triangulatedObjectiveIds: action.triangulatedObjectiveIds,
    pendingObjectiveIds: action.pendingObjectiveIds,
    triangulatedCount,
    triangulatedTierVp: getTriangulationTierVp(triangulatedCount),
    usedThisTurn: action.usedThisTurn,
    actionAvailableThisTurn: round >= 2 && homeRoleKnown && !action.usedThisTurn
  });
}

export function getTriangulationObjectiveOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) return Object.freeze([]);
  const triangulation = getTriangulationState(state, { playerId, perspectivePlayerId });
  if (!triangulation.active || !triangulation.actionAvailableThisTurn) return Object.freeze([]);

  const homeIds = new Set(triangulation.playerHomeObjectiveIds);
  const triangulatedIds = new Set(triangulation.triangulatedObjectiveIds);
  const pendingIds = new Set(triangulation.pendingObjectiveIds);
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];

  return Object.freeze(objectives
    .filter((objective) => objective?.id &&
      !homeIds.has(objective.id) &&
      !triangulatedIds.has(objective.id) &&
      !pendingIds.has(objective.id))
    .map((objective) => Object.freeze({
      objectiveId: objective.id,
      name: objective.name ?? objective.id,
      controlledByPlayer: objective?.control?.controlState === "controlled" && objective?.control?.controllerId === playerId
    })));
}
