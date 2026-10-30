import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import {
  getLocateAndDenyMarkerRemovalOptions,
  getLocateAndDenyState,
  isLocateAndDenyMissionForPlayer
} from "./locate-and-deny-state.js";
import { getEnemyUnitDestructionsForTurn, getUnitStateAtTurnStart } from "./scoring-evidence-state.js";

const MISSION_ID = "primary-extract-relic";

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

function opponentPlayerId(state, playerId) {
  return players(state).map((player) => player?.id).find((id) => id && id !== playerId) ?? null;
}

export function isExtractRelicMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === MISSION_ID;
}

function objectiveText(objective) {
  return [objective?.name, objective?.label, objective?.layoutObjective, objective?.role, objective?.kind, objective?.id]
    .filter(Boolean).join(" ");
}

export function isExtractRelicCentralObjective(objective) {
  return /cent(er|ral)/i.test(objectiveText(objective));
}

function actionKey(payload) {
  return [payload?.round, payload?.turn, payload?.unitId].join(":");
}

function actionState(state, playerId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const round = state?.battle?.round ?? null;
  const turn = state?.turn ?? null;
  const attempts = history.filter((event) =>
    event?.type === "shooting.unit_activated" &&
    event.payload?.playerId === playerId &&
    event.payload?.missionDefinitionId === MISSION_ID
  );
  const reviews = new Map(history
    .filter((event) => event?.type === "mission_action.reviewed" && event.payload?.playerId === playerId)
    .map((event) => [event.payload?.actionKey, event.payload]));
  const attemptsThisTurn = attempts.filter((event) => event.payload?.round === round && event.payload?.turn === turn);
  const completedThisTurn = attemptsThisTurn.filter((event) => reviews.get(actionKey(event.payload))?.outcome === "completed");
  const pendingThisTurn = attemptsThisTurn.filter((event) => !reviews.has(actionKey(event.payload)));
  return Object.freeze({
    usedThisTurn: attemptsThisTurn.length > 0,
    completedThisTurn: completedThisTurn.length > 0,
    completedAttemptsThisTurn: Object.freeze(completedThisTurn.map((event) => Object.freeze({ ...event.payload, actionKey: actionKey(event.payload) }))),
    pendingAttemptsThisTurn: Object.freeze(pendingThisTurn.map((event) => Object.freeze({ ...event.payload, actionKey: actionKey(event.payload) })))
  });
}

function distance(first, second) {
  if (!Number.isFinite(first?.x) || !Number.isFinite(first?.y) || !Number.isFinite(second?.x) || !Number.isFinite(second?.y)) return null;
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function objectiveRangeKillEvidence(state, playerId, turn) {
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const kills = getEnemyUnitDestructionsForTurn(state, playerId, turn);
  return Object.freeze(kills.map((kill) => {
    const start = getUnitStateAtTurnStart(state, kill.unitId, turn);
    const matches = objectives.filter((objective) => {
      const d = distance(start?.position, objective?.position);
      return Number.isFinite(d) && d <= 3;
    });
    return Object.freeze({
      ...kill,
      objectiveIds: Object.freeze(matches.map((objective) => objective.id)),
      mapSupportsQualification: matches.length > 0
    });
  }));
}

function controlSnapshot(state, playerId, perspectivePlayerId) {
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const homeKnown = objectives.some((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const known = objectives.length > 0 && homeKnown && objectives.every((objective) => objective?.control != null);
  if (!known) return Object.freeze({ known: false, nonHomeControlledCount: 0, nonHomeControlledIds: Object.freeze([]) });
  const controlled = objectives.filter((objective) =>
    !isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId) &&
    objective?.control?.controlState === "controlled" &&
    objective?.control?.controllerId === playerId
  );
  return Object.freeze({
    known: true,
    nonHomeControlledCount: controlled.length,
    nonHomeControlledIds: Object.freeze(controlled.map((objective) => objective.id))
  });
}

export function getExtractRelicState(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isExtractRelicMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({ active: false, missionId: null, missionName: null });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const opponentId = opponentPlayerId(state, playerId);
  const opponentHasLocateAndDeny = !!opponentId && isLocateAndDenyMissionForPlayer(state, opponentId, perspectivePlayerId);
  const markerPool = opponentHasLocateAndDeny
    ? getLocateAndDenyState(state, { playerId: opponentId, perspectivePlayerId })
    : Object.freeze({ setupComplete: false, startingMarkerCount: 0, activeMarkerCount: 0, activeTerrainAreaIds: Object.freeze([]), removedTerrainAreaIds: Object.freeze([]), lastMarkerTerrainAreaId: null, friendlyUnitIdsInLastMarkerTerrain: Object.freeze([]), enemyUnitIdsInLastMarkerTerrain: Object.freeze([]) });
  const action = actionState(state, playerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const killEvidence = objectiveRangeKillEvidence(state, playerId, turn);
  const qualifyingMapKills = killEvidence.filter((entry) => entry.mapSupportsQualification);
  const controls = controlSnapshot(state, playerId, perspectivePlayerId);
  const centralObjectiveIds = Object.freeze((state?.objectives ?? []).filter(isExtractRelicCentralObjective).map((objective) => objective.id));

  // Locate and Deny reports occupancy from the marker owner's perspective. For Extract Relic those roles invert.
  const friendlyUnitIdsInLastMarkerTerrain = Object.freeze([...(markerPool.enemyUnitIdsInLastMarkerTerrain ?? [])]);
  const enemyUnitIdsInLastMarkerTerrain = Object.freeze([...(markerPool.friendlyUnitIdsInLastMarkerTerrain ?? [])]);
  const lastMarkerPositionMapSatisfied = markerPool.activeMarkerCount === 1 &&
    friendlyUnitIdsInLastMarkerTerrain.length > 0 && enemyUnitIdsInLastMarkerTerrain.length === 0;

  return Object.freeze({
    active: true,
    missionId: mission?.id ?? MISSION_ID,
    missionName: mission?.name ?? "Extract Relic",
    playerId,
    opponentId,
    opponentMarkerMissionAvailable: opponentHasLocateAndDeny,
    round,
    turn,
    centralObjectiveIds,
    opponentMarkerSetupComplete: markerPool.setupComplete === true,
    startingOpponentMarkerCount: markerPool.startingMarkerCount ?? 0,
    activeOpponentMarkerCount: markerPool.activeMarkerCount ?? 0,
    activeOpponentMarkerTerrainAreaIds: Object.freeze([...(markerPool.activeTerrainAreaIds ?? [])]),
    removedOpponentMarkerTerrainAreaIds: Object.freeze([...(markerPool.removedTerrainAreaIds ?? [])]),
    lastOpponentMarkerTerrainAreaId: markerPool.lastMarkerTerrainAreaId ?? null,
    friendlyUnitIdsInLastMarkerTerrain,
    enemyUnitIdsInLastMarkerTerrain,
    lastMarkerPositionMapSatisfied,
    sensorSweepUsedThisTurn: action.usedThisTurn,
    sensorSweepCompletedThisTurn: action.completedThisTurn,
    pendingSensorSweepAttempts: action.pendingAttemptsThisTurn,
    completedSensorSweepAttempts: action.completedAttemptsThisTurn,
    sensorSweepAvailable: markerPool.setupComplete === true && markerPool.activeMarkerCount > 1 && centralObjectiveIds.length > 0 && !action.usedThisTurn,
    killEvidence,
    qualifyingMapKills: Object.freeze(qualifyingMapKills),
    objectiveRangeKillMapSatisfied: qualifyingMapKills.length > 0,
    controlKnown: controls.known,
    nonHomeControlledCount: controls.nonHomeControlledCount,
    nonHomeControlledIds: controls.nonHomeControlledIds,
    nonHomeControlSatisfied: round >= 2 && controls.known ? controls.nonHomeControlledCount > 0 : round >= 2 ? null : false
  });
}

export function getExtractRelicCentralObjectiveOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId || !isExtractRelicMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze([]);
  const relic = getExtractRelicState(state, { playerId, perspectivePlayerId });
  if (!relic.sensorSweepAvailable) return Object.freeze([]);
  const centralIds = new Set(relic.centralObjectiveIds);
  return Object.freeze((state?.objectives ?? []).filter((objective) => centralIds.has(objective?.id)).map((objective) => Object.freeze({
    objectiveId: objective.id,
    name: objective.name ?? objective.layoutObjective ?? objective.id,
    controlledByPlayer: objective?.control?.controlState === "controlled" && objective?.control?.controllerId === playerId
  })));
}

export function getExtractRelicMarkerRemovalOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId || !isExtractRelicMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze([]);
  const relic = getExtractRelicState(state, { playerId, perspectivePlayerId });
  if (!relic.sensorSweepAvailable || !relic.opponentId) return Object.freeze([]);
  return getLocateAndDenyMarkerRemovalOptions(state, { playerId: relic.opponentId, perspectivePlayerId });
}
