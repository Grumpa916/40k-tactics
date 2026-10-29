import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getTerritoryStatusForPosition } from "./battlefield-territory.js";

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

export function isSmokeAndMirrorsMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === "primary-smoke-and-mirrors";
}

function actionKey(payload) {
  return [payload?.round, payload?.turn, payload?.unitId].join(":");
}

function relevantAttempt(payload, playerId) {
  return payload?.missionDefinitionId === "primary-smoke-and-mirrors" &&
    payload?.playerId === playerId &&
    typeof payload?.objectiveId === "string" && payload.objectiveId.length > 0;
}

function activeDecoysFromHistory(state, playerId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const attempts = new Map();
  const active = new Map();

  for (const event of history) {
    if (event?.type === "shooting.unit_activated" && relevantAttempt(event.payload, playerId)) {
      attempts.set(actionKey(event.payload), {
        objectiveId: event.payload.objectiveId,
        unitId: event.payload.unitId,
        round: event.payload.round,
        turn: event.payload.turn
      });
      continue;
    }

    if (event?.type === "mission_action.reviewed" && event.payload?.playerId === playerId) {
      const attempt = attempts.get(event.payload?.actionKey);
      if (attempt && event.payload?.outcome === "completed") {
        active.set(attempt.objectiveId, Object.freeze({
          objectiveId: attempt.objectiveId,
          unitId: attempt.unitId,
          placedRound: Number.isInteger(event.payload?.round) ? event.payload.round : attempt.round,
          placedTurn: Number.isInteger(event.payload?.turn) ? event.payload.turn : attempt.turn,
          actionKey: event.payload.actionKey
        }));
      }
      continue;
    }

    if (event?.type === "mission_marker.removed" &&
      event.payload?.markerType === "smoke-and-mirrors-decoy" &&
      event.payload?.ownerPlayerId === playerId &&
      typeof event.payload?.objectiveId === "string") {
      active.delete(event.payload.objectiveId);
    }
  }

  return active;
}

function pendingObjectiveIdsForTurn(state, playerId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const round = state?.battle?.round ?? null;
  const turn = state?.turn ?? null;
  const reviewed = new Set(history
    .filter((event) => event?.type === "mission_action.reviewed")
    .map((event) => event.payload?.actionKey)
    .filter(Boolean));

  return new Set(history
    .filter((event) => event?.type === "shooting.unit_activated" &&
      relevantAttempt(event.payload, playerId) &&
      event.payload?.round === round &&
      event.payload?.turn === turn &&
      !reviewed.has(actionKey(event.payload)))
    .map((event) => event.payload.objectiveId));
}

function territoryForObjective(state, playerId, objective) {
  if (!Number.isFinite(objective?.position?.x) || !Number.isFinite(objective?.position?.y)) {
    return Object.freeze({ territory: "unknown", confidence: "low", distanceToBoundary: null });
  }
  return getTerritoryStatusForPosition(state, { playerId, position: objective.position });
}

export function getSmokeAndMirrorsState(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const active = isSmokeAndMirrorsMissionForPlayer(state, playerId, perspectivePlayerId);
  if (!active) {
    return Object.freeze({
      active: false,
      missionId: null,
      missionName: null,
      homeRoleKnown: false,
      playerHomeObjectiveIds: Object.freeze([]),
      decoyObjectiveIds: Object.freeze([]),
      enemyTerritoryDecoyObjectiveIds: Object.freeze([]),
      territoryUncertainDecoyObjectiveIds: Object.freeze([]),
      pendingObjectiveIds: Object.freeze([]),
      decoyCount: 0,
      recurringDecoyVp: 0,
      endgameThresholdMet: false,
      decoysNeededForEndgame: 4
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const homeObjectives = objectives.filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const playerHomeObjectiveIds = Object.freeze(homeObjectives.map((objective) => objective.id));
  const homeRoleKnown = playerHomeObjectiveIds.length > 0;
  const activeDecoys = activeDecoysFromHistory(state, playerId);
  const pending = pendingObjectiveIdsForTurn(state, playerId);
  const decoyObjectiveIds = [];
  const enemyTerritoryDecoyObjectiveIds = [];
  const territoryUncertainDecoyObjectiveIds = [];

  for (const [objectiveId] of activeDecoys) {
    const objective = objectives.find((item) => item?.id === objectiveId);
    if (!objective) continue;
    decoyObjectiveIds.push(objectiveId);
    const territory = territoryForObjective(state, playerId, objective);
    if (territory.territory === "opponent") enemyTerritoryDecoyObjectiveIds.push(objectiveId);
    else if (["boundary", "unknown"].includes(territory.territory)) territoryUncertainDecoyObjectiveIds.push(objectiveId);
  }

  const recurringDecoyVp = decoyObjectiveIds.length * 2 + enemyTerritoryDecoyObjectiveIds.length * 2;
  return Object.freeze({
    active: true,
    missionId: mission?.id ?? "primary-smoke-and-mirrors",
    missionName: mission?.name ?? "Smoke and Mirrors",
    homeRoleKnown,
    playerHomeObjectiveIds,
    decoyObjectiveIds: Object.freeze(decoyObjectiveIds),
    enemyTerritoryDecoyObjectiveIds: Object.freeze(enemyTerritoryDecoyObjectiveIds),
    territoryUncertainDecoyObjectiveIds: Object.freeze(territoryUncertainDecoyObjectiveIds),
    pendingObjectiveIds: Object.freeze([...pending]),
    decoyCount: decoyObjectiveIds.length,
    recurringDecoyVp,
    endgameThresholdMet: decoyObjectiveIds.length >= 4,
    decoysNeededForEndgame: Math.max(0, 4 - decoyObjectiveIds.length)
  });
}

export function getSmokeAndMirrorsObjectiveOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) return Object.freeze([]);
  const decoyState = getSmokeAndMirrorsState(state, { playerId, perspectivePlayerId });
  if (!decoyState.active || !decoyState.homeRoleKnown) return Object.freeze([]);
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const decoyIds = new Set(decoyState.decoyObjectiveIds);
  const pendingIds = new Set(decoyState.pendingObjectiveIds);
  const homeIds = new Set(decoyState.playerHomeObjectiveIds);

  return Object.freeze(objectives
    .filter((objective) => objective?.id && !homeIds.has(objective.id) && !decoyIds.has(objective.id) && !pendingIds.has(objective.id))
    .map((objective) => {
      const territory = territoryForObjective(state, playerId, objective);
      const enemyTerritory = territory.territory === "opponent";
      const territoryKnown = !["boundary", "unknown"].includes(territory.territory);
      return Object.freeze({
        objectiveId: objective.id,
        name: objective.name ?? objective.id,
        enemyTerritory,
        territoryKnown,
        territory: territory.territory,
        recurringVpIfDecoyed: 2 + (enemyTerritory ? 2 : 0)
      });
    }));
}
