import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getEventCompanionMapForForceDispositions } from "./event-companion-map-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { pointInTerrainPolygon } from "./death-trap-state.js";
import { getEnemyUnitDestructionsForTurn, getUnitStateAtTurnStart } from "./scoring-evidence-state.js";
import { getLiveUnitPosition } from "./spatial-context.js";

const MISSION_ID = "primary-locate-and-deny";
const EXTRACT_RELIC_MISSION_ID = "primary-extract-relic";
const SETUP_EVENT = "locate_and_deny.setup_recorded";
const MARKER_TYPE = "locate-and-deny-operation";

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

export function isLocateAndDenyMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === MISSION_ID;
}

function mapGeometry(state) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!setup?.myDisposition || !setup?.opponentDisposition || !setup?.layout) return null;
  return getEventCompanionMapForForceDispositions(setup.myDisposition, setup.opponentDisposition, setup.layout);
}

function ownDeploymentZonePoints(state, playerId) {
  const geometry = mapGeometry(state);
  const attackerPlayerId = state?.preGameSetup?.attackerPlayerId ?? null;
  const defenderPlayerId = state?.preGameSetup?.defenderPlayerId ?? null;
  const key = playerId === attackerPlayerId
    ? "attackerDeployment"
    : playerId === defenderPlayerId
      ? "defenderDeployment"
      : null;
  const points = key ? geometry?.deploymentZones?.[key]?.points : null;
  return Array.isArray(points) && points.length >= 3 ? points : null;
}

function terrainEntries(state) {
  const geometry = mapGeometry(state);
  if (!geometry?.terrainGeometry) return [];
  return Object.entries(geometry.terrainGeometry).map(([terrainAreaId, shape]) => Object.freeze({
    terrainAreaId,
    points: Object.freeze((shape?.points ?? []).map((point) => Object.freeze({ x: point.x, y: point.y })))
  }));
}

function terrainWhollyWithinDeploymentZone(entry, deploymentPoints) {
  if (!deploymentPoints) return null;
  return entry.points.length >= 3 && entry.points.every((point) => pointInTerrainPolygon(point, deploymentPoints));
}

function objectiveLabel(objective) {
  return String(objective?.name ?? objective?.layoutObjective ?? objective?.id ?? "objective");
}

function isCentralObjective(objective) {
  const text = `${objectiveLabel(objective)} ${String(objective?.layoutObjective ?? "")} ${String(objective?.id ?? "")}`;
  return /cent(er|ral)/i.test(text);
}

function actionKey(payload) {
  return [payload?.round, payload?.turn, payload?.unitId].join(":");
}

function latestSetupEvent(state, playerId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index];
    if (event?.type === SETUP_EVENT && event.payload?.playerId === playerId) return event;
  }
  return null;
}

export function getLocateAndDenyTerrainOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId || !isLocateAndDenyMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze([]);
  const deploymentPoints = ownDeploymentZonePoints(state, playerId);
  const setupEvent = latestSetupEvent(state, playerId);
  const selected = new Set(setupEvent?.payload?.terrainAreaIds ?? []);
  return Object.freeze(terrainEntries(state).map((entry) => {
    const withinOwnDeploymentZone = terrainWhollyWithinDeploymentZone(entry, deploymentPoints);
    return Object.freeze({
      terrainAreaId: entry.terrainAreaId,
      label: entry.terrainAreaId,
      points: entry.points,
      withinOwnDeploymentZone,
      eligible: withinOwnDeploymentZone === false,
      selected: selected.has(entry.terrainAreaId)
    });
  }));
}

export function getLocateAndDenySetup(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  const active = !!playerId && isLocateAndDenyMissionForPlayer(state, playerId, perspectivePlayerId);
  if (!active) return Object.freeze({ active: false, missionId: null, setupComplete: false, terrainAreaIds: Object.freeze([]) });
  const options = getLocateAndDenyTerrainOptions(state, { playerId, perspectivePlayerId });
  const eligible = options.filter((entry) => entry.eligible);
  const setupEvent = latestSetupEvent(state, playerId);
  const terrainAreaIds = Object.freeze([...(setupEvent?.payload?.terrainAreaIds ?? [])]);
  const expectedMarkerCount = eligible.length > 0 ? Math.min(5, eligible.length) : 5;
  const eligibleIds = new Set(eligible.map((entry) => entry.terrainAreaId));
  const setupComplete = terrainAreaIds.length === expectedMarkerCount &&
    new Set(terrainAreaIds).size === terrainAreaIds.length &&
    terrainAreaIds.every((id) => eligibleIds.has(id));
  return Object.freeze({
    active: true,
    missionId: MISSION_ID,
    missionName: "Locate and Deny",
    terrainKnown: options.length > 0 && eligible.length > 0,
    eligibleTerrainAreaIds: Object.freeze(eligible.map((entry) => entry.terrainAreaId)),
    expectedMarkerCount,
    terrainAreaIds,
    setupComplete,
    setupRecorded: !!setupEvent
  });
}

function completedSensorSweeps(state) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const reviews = new Map(history
    .filter((event) => event?.type === "mission_action.reviewed")
    .map((event) => [event.payload?.actionKey, event.payload]));
  return history.filter((event) =>
    event?.type === "shooting.unit_activated" &&
    [MISSION_ID, EXTRACT_RELIC_MISSION_ID].includes(event.payload?.missionDefinitionId) &&
    typeof event.payload?.terrainAreaId === "string" &&
    reviews.get(actionKey(event.payload))?.outcome === "completed"
  );
}

function sensorSweepAttemptsThisTurn(state, playerId) {
  const round = state?.battle?.round ?? null;
  const turn = state?.turn ?? null;
  return (Array.isArray(state?.history) ? state.history : []).filter((event) =>
    event?.type === "shooting.unit_activated" &&
    event.payload?.playerId === playerId &&
    event.payload?.missionDefinitionId === MISSION_ID &&
    event.payload?.round === round &&
    event.payload?.turn === turn
  );
}

export function getLocateAndDenyCentralObjectiveOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId || !isLocateAndDenyMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze([]);
  return Object.freeze((state?.objectives ?? []).filter(isCentralObjective).map((objective) => Object.freeze({
    objectiveId: objective.id,
    name: objectiveLabel(objective)
  })));
}

function activeMarkerTerrainIds(state, playerId, perspectivePlayerId) {
  const setup = getLocateAndDenySetup(state, { playerId, perspectivePlayerId });
  if (!setup.setupComplete) return Object.freeze([]);
  const removed = new Set(completedSensorSweeps(state).map((event) => event.payload.terrainAreaId));
  return Object.freeze(setup.terrainAreaIds.filter((terrainAreaId) => !removed.has(terrainAreaId)));
}

export function getLocateAndDenyMarkerRemovalOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  const activeIds = activeMarkerTerrainIds(state, playerId, perspectivePlayerId);
  const byId = new Map(getLocateAndDenyTerrainOptions(state, { playerId, perspectivePlayerId }).map((entry) => [entry.terrainAreaId, entry]));
  return Object.freeze(activeIds.map((terrainAreaId) => Object.freeze({
    terrainAreaId,
    label: byId.get(terrainAreaId)?.label ?? terrainAreaId
  })));
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

function markerTerrainEntry(state, terrainAreaId) {
  return terrainEntries(state).find((entry) => entry.terrainAreaId === terrainAreaId) ?? null;
}

function unitsInsideTerrain(state, terrainAreaId) {
  const terrain = markerTerrainEntry(state, terrainAreaId);
  if (!terrain) return Object.freeze([]);
  return Object.freeze((state?.units ?? []).filter((unit) => unit?.status !== "destroyed").filter((unit) => {
    const position = getLiveUnitPosition(state, unit);
    return pointInTerrainPolygon(position, terrain.points);
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

export function getLocateAndDenyState(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  const active = !!playerId && isLocateAndDenyMissionForPlayer(state, playerId, perspectivePlayerId);
  if (!active) return Object.freeze({ active: false, missionId: null });
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const setup = getLocateAndDenySetup(state, { playerId, perspectivePlayerId });
  const removedTerrainAreaIds = Object.freeze(completedSensorSweeps(state).map((event) => event.payload.terrainAreaId));
  const activeTerrainAreaIds = activeMarkerTerrainIds(state, playerId, perspectivePlayerId);
  const attemptsThisTurn = sensorSweepAttemptsThisTurn(state, playerId);
  const killEvidence = objectiveRangeKillEvidence(state, playerId, turn);
  const qualifyingMapKills = killEvidence.filter((item) => item.mapSupportsQualification);
  const controls = controlSnapshot(state, playerId, perspectivePlayerId);
  const lastMarkerTerrainAreaId = activeTerrainAreaIds.length === 1 ? activeTerrainAreaIds[0] : null;
  const unitsInLastMarkerTerrain = lastMarkerTerrainAreaId ? unitsInsideTerrain(state, lastMarkerTerrainAreaId) : [];
  const friendlyInLastMarkerTerrain = unitsInLastMarkerTerrain.filter((unit) => unit.ownerId === playerId);
  const enemyInLastMarkerTerrain = unitsInLastMarkerTerrain.filter((unit) => unit.ownerId !== playerId);
  const lastMarkerPositionMapSatisfied = lastMarkerTerrainAreaId
    ? friendlyInLastMarkerTerrain.length > 0 && enemyInLastMarkerTerrain.length === 0
    : false;
  return Object.freeze({
    active: true,
    missionId: MISSION_ID,
    missionName: "Locate and Deny",
    markerType: MARKER_TYPE,
    round,
    turn,
    setup,
    setupComplete: setup.setupComplete,
    startingMarkerCount: setup.terrainAreaIds.length,
    removedTerrainAreaIds,
    activeTerrainAreaIds,
    activeMarkerCount: activeTerrainAreaIds.length,
    sensorSweepUsedThisTurn: attemptsThisTurn.length > 0,
    sensorSweepAvailable: setup.setupComplete && activeTerrainAreaIds.length > 1 && attemptsThisTurn.length === 0,
    killEvidence,
    qualifyingMapKills: Object.freeze(qualifyingMapKills),
    objectiveRangeKillMapSatisfied: qualifyingMapKills.length > 0,
    controlKnown: controls.known,
    nonHomeControlledCount: controls.nonHomeControlledCount,
    nonHomeControlledIds: controls.nonHomeControlledIds,
    nonHomeControlSatisfied: round >= 2 && controls.known ? controls.nonHomeControlledCount > 0 : round >= 2 ? null : false,
    lastMarkerTerrainAreaId,
    friendlyUnitIdsInLastMarkerTerrain: Object.freeze(friendlyInLastMarkerTerrain.map((unit) => unit.id)),
    enemyUnitIdsInLastMarkerTerrain: Object.freeze(enemyInLastMarkerTerrain.map((unit) => unit.id)),
    lastMarkerPositionMapSatisfied
  });
}
