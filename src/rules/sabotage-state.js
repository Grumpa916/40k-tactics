import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getTerritoryStatusForPosition } from "./battlefield-territory.js";

const MISSION_ID = "primary-sabotage";

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

export function isSabotageMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
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

function objectiveTerritory(state, playerId, objectiveId) {
  const objective = (state?.objectives ?? []).find((item) => item?.id === objectiveId);
  if (!objective || !Number.isFinite(objective?.position?.x) || !Number.isFinite(objective?.position?.y)) {
    return Object.freeze({ territory: "unknown", confidence: "low", distanceToBoundary: null });
  }
  return getTerritoryStatusForPosition(state, { playerId, position: objective.position });
}

function deriveActionState(state, playerId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const attempts = new Map();
  const reviews = new Map();
  const round = state?.battle?.round ?? null;
  const turn = state?.turn ?? null;

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
    if (event?.type === "mission_action.reviewed" && event.payload?.playerId === playerId && attempts.has(event.payload?.actionKey)) {
      reviews.set(event.payload.actionKey, event.payload);
    }
  }

  const attemptsThisTurn = [...attempts.values()].filter((attempt) => attempt.round === round && attempt.turn === turn);
  const pendingAttempts = attemptsThisTurn.filter((attempt) => !reviews.has(attempt.actionKey));
  const completedThisTurn = attemptsThisTurn.filter((attempt) => reviews.get(attempt.actionKey)?.outcome === "completed");
  const failedThisTurn = attemptsThisTurn.filter((attempt) => reviews.get(attempt.actionKey)?.outcome === "failed");

  return Object.freeze({
    attemptsThisTurn: Object.freeze(attemptsThisTurn),
    pendingAttempts: Object.freeze(pendingAttempts),
    completedThisTurn: Object.freeze(completedThisTurn),
    failedThisTurn: Object.freeze(failedThisTurn),
    reservedObjectiveIds: Object.freeze([...new Set(attemptsThisTurn.map((attempt) => attempt.objectiveId))])
  });
}

export function getSabotageObjectiveOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  stateOverride = null
} = {}) {
  if (!playerId || !isSabotageMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze([]);
  const action = stateOverride ?? deriveActionState(state, playerId);
  const reserved = new Set(action.reservedObjectiveIds ?? []);
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];

  return Object.freeze(objectives
    .filter((objective) => objective?.id &&
      !isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId) &&
      !reserved.has(objective.id))
    .map((objective) => {
      const territory = objectiveTerritory(state, playerId, objective.id);
      return Object.freeze({
        objectiveId: objective.id,
        name: objective.name ?? objective.id,
        controlledByPlayer: objective?.control?.controlState === "controlled" && objective?.control?.controllerId === playerId,
        territory: territory.territory,
        territoryConfidence: territory.confidence,
        enemyTerritory: territory.territory === "opponent",
        territoryUncertain: ["boundary", "unknown"].includes(territory.territory),
        potentialVp: territory.territory === "opponent" ? 5 : 3
      });
    }));
}

export function getSabotageState(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const active = isSabotageMissionForPlayer(state, playerId, perspectivePlayerId);
  if (!active) {
    return Object.freeze({
      active: false,
      missionId: null,
      missionName: null,
      actionAvailableThisTurn: false,
      attemptsThisTurn: Object.freeze([]),
      pendingAttempts: Object.freeze([]),
      completedThisTurn: Object.freeze([]),
      failedThisTurn: Object.freeze([]),
      reservedObjectiveIds: Object.freeze([]),
      completedThisTurnCount: 0,
      enemyTerritoryCompletedCount: 0,
      uncertainTerritoryCompletedCount: 0,
      actionRawVp: 0,
      eligibleObjectiveIds: Object.freeze([]),
      objectiveOptions: Object.freeze([])
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const action = deriveActionState(state, playerId);
  const options = getSabotageObjectiveOptions(state, { playerId, perspectivePlayerId, stateOverride: action });
  const enrich = (attempt) => {
    const territory = objectiveTerritory(state, playerId, attempt.objectiveId);
    return Object.freeze({
      ...attempt,
      territory: territory.territory,
      territoryConfidence: territory.confidence,
      enemyTerritory: territory.territory === "opponent",
      territoryUncertain: ["boundary", "unknown"].includes(territory.territory),
      projectedVp: territory.territory === "opponent" ? 5 : 3
    });
  };
  const completed = Object.freeze(action.completedThisTurn.map(enrich));
  const pending = Object.freeze(action.pendingAttempts.map(enrich));
  const failed = Object.freeze(action.failedThisTurn.map(enrich));
  const enemyTerritoryCompletedCount = completed.filter((attempt) => attempt.enemyTerritory).length;
  const uncertainTerritoryCompletedCount = completed.filter((attempt) => attempt.territoryUncertain).length;
  const actionRawVp = completed.length * 3 + enemyTerritoryCompletedCount * 2;

  return Object.freeze({
    active: true,
    missionId: mission?.id ?? MISSION_ID,
    missionName: mission?.name ?? "Sabotage",
    actionAvailableThisTurn: options.length > 0,
    attemptsThisTurn: action.attemptsThisTurn,
    pendingAttempts: pending,
    completedThisTurn: completed,
    failedThisTurn: failed,
    reservedObjectiveIds: action.reservedObjectiveIds,
    completedThisTurnCount: completed.length,
    enemyTerritoryCompletedCount,
    uncertainTerritoryCompletedCount,
    actionRawVp,
    eligibleObjectiveIds: Object.freeze(options.map((option) => option.objectiveId)),
    objectiveOptions: options
  });
}
