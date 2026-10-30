import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getEventCompanionMapForForceDispositions } from "./event-companion-map-catalog.js";
import { pointInTerrainPolygon } from "./death-trap-state.js";

function defaultPerspectivePlayerId(state) {
  return state?.players?.[0]?.id ?? state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
}

function missionActions(state, playerId, definitionId) {
  return (state?.history ?? []).filter((event) =>
    event?.type === "shooting.unit_activated" &&
    event.payload?.playerId === playerId &&
    event.payload?.missionDefinitionId === definitionId
  );
}

function mapGeometry(state) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!setup?.myDisposition || !setup?.opponentDisposition || !setup?.layout) return null;
  return getEventCompanionMapForForceDispositions(setup.myDisposition, setup.opponentDisposition, setup.layout);
}

function ownDeploymentPoints(state, playerId, geometry) {
  const attackerId = state?.preGameSetup?.attackerPlayerId;
  const defenderId = state?.preGameSetup?.defenderPlayerId;
  const key = playerId === attackerId ? "attackerDeployment" :
    playerId === defenderId ? "defenderDeployment" : null;
  const points = key ? geometry?.deploymentZones?.[key]?.points : null;
  return Array.isArray(points) && points.length >= 3 ? points : null;
}

function isInsideOwnDeploymentZone(terrain, points) {
  return Array.isArray(points) && terrain.points?.length >= 3 &&
    terrain.points.every((point) => pointInTerrainPolygon(point, points));
}

export function getCleanseObjectiveOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) return Object.freeze([]);
  const round = state?.battle?.round ?? 0;
  const turn = state?.turn ?? 0;
  const used = new Set(missionActions(state, playerId, "secondary-cleanse")
    .filter((event) => event.payload?.round === round && event.payload?.turn === turn)
    .map((event) => event.payload?.objectiveId).filter(Boolean));
  return Object.freeze((state?.objectives ?? [])
    .filter((objective) => objective?.id &&
      !isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId) &&
      !used.has(objective.id))
    .map((objective) => Object.freeze({
      objectiveId: objective.id,
      name: objective.name ?? objective.label ?? objective.id
    })));
}

export function getPlunderTerrainOptions(state, { playerId } = {}) {
  if (!playerId) return Object.freeze([]);
  const geometry = mapGeometry(state);
  if (!geometry?.terrainGeometry) return Object.freeze([]);
  const deploymentPoints = ownDeploymentPoints(state, playerId, geometry);
  return Object.freeze(Object.entries(geometry.terrainGeometry).map(([terrainAreaId, shape]) => {
    const points = (shape?.points ?? []).map((point) => ({ x: point.x, y: point.y }));
    const inOwnDeploymentZone = isInsideOwnDeploymentZone({ points }, deploymentPoints);
    return Object.freeze({
      terrainAreaId,
      label: terrainAreaId,
      withinOwnDeploymentZone: deploymentPoints ? inOwnDeploymentZone : null,
      eligibleByMap: inOwnDeploymentZone === false,
      points: Object.freeze(points)
    });
  }));
}

export function getCleanseActionState(state, {
  playerId,
  instanceId = null,
  turn = state?.turn ?? 0,
  round = state?.battle?.round ?? 0
} = {}) {
  const actions = missionActions(state, playerId, "secondary-cleanse")
    .filter((event) => event.payload?.round === round && event.payload?.turn === turn &&
      (!instanceId || event.payload?.missionInstanceId === instanceId));
  const reviews = new Map((state?.history ?? [])
    .filter((event) => event?.type === "mission_action.reviewed")
    .map((event) => [event.payload?.actionKey, event.payload]));
  const completed = actions.filter((event) => {
    const key = [event.payload.round, event.payload.turn, event.payload.unitId].join(":");
    return reviews.get(key)?.outcome === "completed";
  });
  const pending = actions.filter((event) => {
    const key = [event.payload.round, event.payload.turn, event.payload.unitId].join(":");
    return !reviews.has(key);
  });
  const failed = actions.length - completed.length - pending.length;
  return Object.freeze({
    attemptCount: actions.length,
    completedObjectiveIds: Object.freeze([...new Set(completed.map((event) => event.payload.objectiveId).filter(Boolean))]),
    pendingCount: pending.length,
    failedCount: failed,
    cleansedCount: new Set(completed.map((event) => event.payload.objectiveId).filter(Boolean)).size
  });
}

export function getPlunderActionState(state, {
  playerId,
  instanceId = null,
  turn = state?.turn ?? 0,
  round = state?.battle?.round ?? 0
} = {}) {
  const actions = missionActions(state, playerId, "secondary-plunder")
    .filter((event) => event.payload?.round === round && event.payload?.turn === turn &&
      (!instanceId || event.payload?.missionInstanceId === instanceId));
  const completed = actions.filter((event) => event.payload?.actionCompletedImmediately === true);
  return Object.freeze({
    usedThisTurn: actions.length > 0,
    plunderedTerrainAreaIds: Object.freeze([...new Set(completed.map((event) => event.payload?.terrainAreaId).filter(Boolean))]),
    completedCount: completed.length,
    attemptCount: actions.length
  });
}
