import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getSmokeAndMirrorsState } from "./smoke-and-mirrors-state.js";
import { getLiveUnitPosition } from "./spatial-context.js";

const MISSION_ID = "primary-surveil-the-foe";
const OBJECTIVE_RANGE_ESTIMATE = 3;

function players(state) {
  return Array.isArray(state?.players) ? state.players : [];
}

function units(state) {
  return Array.isArray(state?.units) ? state.units : [];
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

export function isSurveilTheFoeMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === MISSION_ID;
}

function currentTurnSurveilEvents(state, playerId) {
  const round = state?.battle?.round ?? null;
  const turn = state?.turn ?? null;
  return (Array.isArray(state?.history) ? state.history : []).filter((event) =>
    event?.type === "shooting.unit_activated" &&
    event.payload?.missionDefinitionId === MISSION_ID &&
    event.payload?.playerId === playerId &&
    event.payload?.round === round &&
    event.payload?.turn === turn &&
    typeof event.payload?.targetUnitId === "string" &&
    event.payload.targetUnitId.length > 0
  );
}

function enemyMarkerObjectives(state, playerId, perspectivePlayerId) {
  const objectiveIds = new Set();
  for (const opponent of players(state)) {
    if (!opponent?.id || opponent.id === playerId) continue;
    const smoke = getSmokeAndMirrorsState(state, {
      playerId: opponent.id,
      perspectivePlayerId
    });
    if (!smoke.active) continue;
    for (const objectiveId of smoke.decoyObjectiveIds) objectiveIds.add(objectiveId);
  }
  return [...objectiveIds];
}

function validPosition(position) {
  return Number.isFinite(position?.x) && Number.isFinite(position?.y);
}

function distanceBetween(a, b) {
  if (!validPosition(a) || !validPosition(b)) return null;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function markerProtectionEstimate(state, targetUnit, markerObjectiveIds) {
  if (!targetUnit || markerObjectiveIds.length === 0) return false;
  const targetPosition = getLiveUnitPosition(state, targetUnit);
  if (!validPosition(targetPosition)) return null;
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  let unknown = false;
  for (const objectiveId of markerObjectiveIds) {
    const objective = objectives.find((item) => item?.id === objectiveId);
    if (!validPosition(objective?.position)) {
      unknown = true;
      continue;
    }
    const distance = distanceBetween(targetPosition, objective.position);
    if (distance != null && distance <= OBJECTIVE_RANGE_ESTIMATE) return true;
  }
  return unknown ? null : false;
}

export function getSurveilTheFoeState(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const active = isSurveilTheFoeMissionForPlayer(state, playerId, perspectivePlayerId);
  if (!active) {
    return Object.freeze({
      active: false,
      missionId: null,
      missionName: null,
      surveilledTargetIds: Object.freeze([]),
      surveilledTargets: Object.freeze([]),
      enemyMarkerObjectiveIds: Object.freeze([]),
      enemyMarkerCount: 0,
      enemyMarkersCleared: false,
      qualifyingSurveilEstimate: "none"
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const markerObjectiveIds = enemyMarkerObjectives(state, playerId, perspectivePlayerId);
  const targetIds = [...new Set(currentTurnSurveilEvents(state, playerId).map((event) => event.payload.targetUnitId))];
  const targetEntries = targetIds.map((targetUnitId) => {
    const targetUnit = units(state).find((unit) => unit?.id === targetUnitId) ?? null;
    const protectedByMarkedObjectiveEstimate = markerProtectionEstimate(state, targetUnit, markerObjectiveIds);
    return Object.freeze({
      targetUnitId,
      targetName: targetUnit?.name ?? targetUnitId,
      protectedByMarkedObjectiveEstimate
    });
  });

  let qualifyingSurveilEstimate = "none";
  if (targetEntries.length > 0) {
    if (targetEntries.some((entry) => entry.protectedByMarkedObjectiveEstimate === false)) qualifyingSurveilEstimate = "likely";
    else if (targetEntries.every((entry) => entry.protectedByMarkedObjectiveEstimate === true)) qualifyingSurveilEstimate = "blocked";
    else qualifyingSurveilEstimate = "uncertain";
  }

  return Object.freeze({
    active: true,
    missionId: mission?.id ?? MISSION_ID,
    missionName: mission?.name ?? "Surveil the Foe",
    surveilledTargetIds: Object.freeze(targetIds),
    surveilledTargets: Object.freeze(targetEntries),
    enemyMarkerObjectiveIds: Object.freeze(markerObjectiveIds),
    enemyMarkerCount: markerObjectiveIds.length,
    enemyMarkersCleared: markerObjectiveIds.length === 0,
    qualifyingSurveilEstimate
  });
}

export function getSurveilTheFoeTargetOptions(state, {
  playerId,
  unitId = null,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId || !isSurveilTheFoeMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze([]);
  const surveil = getSurveilTheFoeState(state, { playerId, perspectivePlayerId });
  const alreadySurveilled = new Set(surveil.surveilledTargetIds);
  const sourceUnit = unitId ? units(state).find((unit) => unit?.id === unitId) : null;
  const sourcePosition = sourceUnit ? getLiveUnitPosition(state, sourceUnit) : null;

  return Object.freeze(units(state)
    .filter((unit) => unit?.ownerId && unit.ownerId !== playerId && unit.status === "deployed" && !alreadySurveilled.has(unit.id))
    .map((unit) => {
      const targetPosition = getLiveUnitPosition(state, unit);
      const approximateDistance = distanceBetween(sourcePosition, targetPosition);
      const rangeEstimate = approximateDistance == null ? "unknown" : approximateDistance <= 18 ? "within" : "outside";
      return Object.freeze({
        targetUnitId: unit.id,
        targetName: unit.name ?? unit.id,
        approximateDistance,
        rangeEstimate,
        requiresVisibilityConfirmation: true,
        requiresTabletopRangeConfirmation: true
      });
    }));
}
