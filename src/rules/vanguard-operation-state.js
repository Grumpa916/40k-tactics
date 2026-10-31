import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getEventCompanionMapForForceDispositions } from "./event-companion-map-catalog.js";
import { getBattlefieldTerritoryContext } from "./battlefield-territory.js";
import { pointInTerrainPolygon } from "./death-trap-state.js";
import { getLiveUnitPosition } from "./spatial-context.js";
import { getEnemyUnitDestructionsForTurn } from "./scoring-evidence-state.js";

const MISSION_ID = "primary-vanguard-operation";

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

export function isVanguardOperationMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === MISSION_ID;
}

function mapGeometry(state) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!setup?.myDisposition || !setup?.opponentDisposition || !setup?.layout) return null;
  return getEventCompanionMapForForceDispositions(setup.myDisposition, setup.opponentDisposition, setup.layout);
}

function terrainEntries(state) {
  const geometry = mapGeometry(state);
  if (!geometry?.terrainGeometry) return [];
  return Object.entries(geometry.terrainGeometry).map(([terrainAreaId, shape]) => Object.freeze({
    terrainAreaId,
    points: Object.freeze((shape?.points ?? []).map((point) => Object.freeze({ x: point.x, y: point.y })))
  }));
}

function pointInRect(point, rect) {
  if (!rect || !Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return false;
  return point.x >= rect.x && point.x <= rect.x + rect.width &&
    point.y >= rect.y && point.y <= rect.y + rect.height;
}

function terrainTerritoryStatus(state, playerId, entry) {
  const context = getBattlefieldTerritoryContext(state, { playerId });
  if (!context?.perspectiveRole || !entry?.points?.length) {
    return Object.freeze({ enemyTerritoryByMap: null, territoryConfidence: "low" });
  }
  const allOpponent = entry.points.every((point) => pointInRect(point, context.opponentTerritory));
  const allMine = entry.points.every((point) => pointInRect(point, context.myTerritory));
  if (allOpponent) return Object.freeze({ enemyTerritoryByMap: true, territoryConfidence: "moderate" });
  if (allMine) return Object.freeze({ enemyTerritoryByMap: false, territoryConfidence: "moderate" });
  return Object.freeze({ enemyTerritoryByMap: null, territoryConfidence: "low" });
}

function actionKey(payload) {
  return [payload?.round, payload?.turn, payload?.unitId].join(":");
}

function relevantAttempt(payload, playerId) {
  return payload?.missionDefinitionId === MISSION_ID &&
    payload?.playerId === playerId &&
    typeof payload?.terrainAreaId === "string" && payload.terrainAreaId.length > 0;
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
        terrainAreaId: event.payload.terrainAreaId,
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

  return Object.freeze({
    attemptsThisTurn: Object.freeze(attemptsThisTurn),
    pendingAttempts: Object.freeze(pendingAttempts),
    completedThisTurn: Object.freeze(completedThisTurn),
    usedThisTurn: attemptsThisTurn.length > 0,
    completedThisTurnCount: completedThisTurn.length,
    pendingTerrainAreaIds: Object.freeze([...new Set(pendingAttempts.map((attempt) => attempt.terrainAreaId))])
  });
}

export function getVanguardOperationTerrainOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  stateOverride = null
} = {}) {
  if (!playerId || !isVanguardOperationMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze([]);
  const action = stateOverride ?? deriveActionState(state, playerId);
  if (action.usedThisTurn) return Object.freeze([]);

  return Object.freeze(terrainEntries(state)
    .map((entry) => {
      const territory = terrainTerritoryStatus(state, playerId, entry);
      return Object.freeze({
        terrainAreaId: entry.terrainAreaId,
        label: `${entry.terrainAreaId}${territory.enemyTerritoryByMap === true ? " · enemy territory" : territory.enemyTerritoryByMap == null ? " · confirm territory" : ""}`,
        points: entry.points,
        ...territory
      });
    })
    .filter((entry) => entry.enemyTerritoryByMap !== false));
}

function pendingBlockers(state, playerId, pendingAttempts) {
  const geometry = mapGeometry(state);
  if (!geometry?.terrainGeometry) {
    return Object.freeze({ blockerEvidenceKnown: false, blockerUnitIds: Object.freeze([]), blockersByTerrain: Object.freeze({}) });
  }
  const enemies = (Array.isArray(state?.units) ? state.units : []).filter((unit) =>
    unit?.ownerId != null && unit.ownerId !== playerId && unit.status === "deployed"
  );
  const blockersByTerrain = {};
  const blockerIds = new Set();
  for (const attempt of pendingAttempts) {
    const points = geometry.terrainGeometry?.[attempt.terrainAreaId]?.points ?? [];
    if (points.length < 3) continue;
    const ids = enemies.filter((unit) => pointInTerrainPolygon(getLiveUnitPosition(state, unit), points)).map((unit) => unit.id);
    blockersByTerrain[attempt.terrainAreaId] = Object.freeze(ids);
    ids.forEach((id) => blockerIds.add(id));
  }
  return Object.freeze({
    blockerEvidenceKnown: true,
    blockerUnitIds: Object.freeze([...blockerIds]),
    blockersByTerrain: Object.freeze(blockersByTerrain)
  });
}

export function getVanguardOperationState(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const active = isVanguardOperationMissionForPlayer(state, playerId, perspectivePlayerId);
  if (!active) {
    return Object.freeze({
      active: false,
      missionId: null,
      missionName: null,
      usedThisTurn: false,
      completedThisTurnCount: 0,
      pendingTerrainAreaIds: Object.freeze([]),
      actionAvailableThisTurn: false,
      killSatisfied: false,
      killVp: 0,
      enemyKillsThisTurn: 0,
      blockerEvidenceKnown: false,
      blockerUnitIds: Object.freeze([]),
      blockersByTerrain: Object.freeze({})
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const action = deriveActionState(state, playerId);
  const terrainOptions = getVanguardOperationTerrainOptions(state, {
    playerId,
    perspectivePlayerId,
    stateOverride: action
  });
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const kills = getEnemyUnitDestructionsForTurn(state, playerId, turn);
  const blockers = pendingBlockers(state, playerId, action.pendingAttempts);

  return Object.freeze({
    active: true,
    missionId: mission?.id ?? MISSION_ID,
    missionName: mission?.name ?? "Vanguard Operation",
    usedThisTurn: action.usedThisTurn,
    attemptsThisTurn: action.attemptsThisTurn,
    completedThisTurn: action.completedThisTurn,
    completedThisTurnCount: action.completedThisTurnCount,
    pendingAttempts: action.pendingAttempts,
    pendingTerrainAreaIds: action.pendingTerrainAreaIds,
    actionAvailableThisTurn: !action.usedThisTurn && terrainOptions.length > 0,
    eligibleTerrainAreaIds: Object.freeze(terrainOptions.map((entry) => entry.terrainAreaId)),
    terrainOptions,
    killSatisfied: kills.length > 0,
    killVp: kills.length > 0 ? 2 : 0,
    enemyKillsThisTurn: kills.length,
    qualifyingDestroyedUnitIds: Object.freeze([...new Set(kills.map((entry) => entry.unitId).filter(Boolean))]),
    ...blockers
  });
}
