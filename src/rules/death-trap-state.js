import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getEventCompanionMapForForceDispositions } from "./event-companion-map-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getEnemyUnitDestructionsForTurn, getUnitStateAtTurnStart } from "./scoring-evidence-state.js";

const MISSION_ID = "primary-death-trap";

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

export function isDeathTrapMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === MISSION_ID;
}

function mapGeometry(state) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!setup?.myDisposition || !setup?.opponentDisposition || !setup?.layout) return null;
  return getEventCompanionMapForForceDispositions(setup.myDisposition, setup.opponentDisposition, setup.layout);
}

function onSegment(point, a, b) {
  const cross = (point.y - a.y) * (b.x - a.x) - (point.x - a.x) * (b.y - a.y);
  if (Math.abs(cross) > 1e-7) return false;
  return point.x >= Math.min(a.x, b.x) - 1e-7 && point.x <= Math.max(a.x, b.x) + 1e-7 &&
    point.y >= Math.min(a.y, b.y) - 1e-7 && point.y <= Math.max(a.y, b.y) + 1e-7;
}

export function pointInTerrainPolygon(point, points) {
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y) || !Array.isArray(points) || points.length < 3) return false;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[j], b = points[i];
    if (onSegment(point, a, b)) return true;
    const crosses = ((b.y > point.y) !== (a.y > point.y)) &&
      point.x < ((a.x - b.x) * (point.y - b.y)) / ((a.y - b.y) || Number.EPSILON) + b.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function terrainEntries(state) {
  const geometry = mapGeometry(state);
  if (!geometry?.terrainGeometry) return [];
  return Object.entries(geometry.terrainGeometry).map(([terrainAreaId, shape]) => Object.freeze({
    terrainAreaId,
    points: Object.freeze((shape?.points ?? []).map((point) => Object.freeze({ x: point.x, y: point.y })))
  }));
}

export function getDeathTrapTerrainAreaForPosition(state, position) {
  return terrainEntries(state).find((entry) => pointInTerrainPolygon(position, entry.points)) ?? null;
}

function objectiveIdsForTerrain(state, entry) {
  return Object.freeze((state?.objectives ?? [])
    .filter((objective) => pointInTerrainPolygon(objective?.position, entry.points))
    .map((objective) => objective.id));
}

export function getDeathTrapTrapEvents(state, playerId) {
  return Object.freeze((state?.history ?? []).filter((event) =>
    event?.type === "shooting.unit_activated" &&
    event?.payload?.playerId === playerId &&
    event?.payload?.missionDefinitionId === MISSION_ID &&
    event?.payload?.terrainAreaId
  ));
}

export function getDeathTrapTerrainOptions(state, { playerId, perspectivePlayerId = defaultPerspectivePlayerId(state) } = {}) {
  if (!playerId || !isDeathTrapMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze([]);
  const events = getDeathTrapTrapEvents(state, playerId);
  const round = state?.battle?.round ?? 0;
  const turn = state?.turn ?? 0;
  const trappedIds = new Set(events.map((event) => event.payload.terrainAreaId));
  const trappedThisTurnIds = new Set(events.filter((event) => event.payload.round === round && event.payload.turn === turn).map((event) => event.payload.terrainAreaId));
  return Object.freeze(terrainEntries(state).map((entry) => {
    const objectiveIds = objectiveIdsForTerrain(state, entry);
    return Object.freeze({
      terrainAreaId: entry.terrainAreaId,
      label: `${entry.terrainAreaId}${objectiveIds.length ? " · objective terrain" : ""}`,
      objectiveIds,
      containsObjective: objectiveIds.length > 0,
      trapped: trappedIds.has(entry.terrainAreaId),
      trappedThisTurn: trappedThisTurnIds.has(entry.terrainAreaId)
    });
  }));
}

export function getDeathTrapState(state, { playerId, perspectivePlayerId = defaultPerspectivePlayerId(state) } = {}) {
  const active = !!playerId && isDeathTrapMissionForPlayer(state, playerId, perspectivePlayerId);
  if (!active) return Object.freeze({ active: false, missionId: null, terrainKnown: false });
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const terrain = getDeathTrapTerrainOptions(state, { playerId, perspectivePlayerId });
  const trapped = terrain.filter((entry) => entry.trapped);
  const trappedThisTurn = terrain.filter((entry) => entry.trappedThisTurn);
  const objectiveTrappedThisTurn = trappedThisTurn.filter((entry) => entry.containsObjective);
  const controlKnown = (state?.objectives ?? []).length > 0 && (state?.objectives ?? []).every((objective) => objective?.control != null);
  const nonHomeControlled = controlKnown
    ? (state.objectives ?? []).filter((objective) =>
        !isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId) &&
        objective?.control?.controlState === "controlled" && objective?.control?.controllerId === playerId
      )
    : [];
  const kills = getEnemyUnitDestructionsForTurn(state, playerId, turn);
  const qualifyingKills = [];
  const unresolvedKills = [];
  const trappedIds = new Set(trapped.map((entry) => entry.terrainAreaId));
  for (const kill of kills) {
    const start = getUnitStateAtTurnStart(state, kill.unitId, turn);
    const area = getDeathTrapTerrainAreaForPosition(state, start?.position);
    if (!area) {
      unresolvedKills.push(Object.freeze({ ...kill, terrainAreaId: null }));
      continue;
    }
    const item = Object.freeze({ ...kill, terrainAreaId: area.terrainAreaId });
    if (trappedIds.has(area.terrainAreaId)) qualifyingKills.push(item);
    else unresolvedKills.push(item);
  }
  return Object.freeze({
    active: true,
    missionId: MISSION_ID,
    missionName: "Death Trap",
    round,
    turn,
    terrainKnown: terrain.length > 0,
    terrain,
    trappedTerrainIds: Object.freeze(trapped.map((entry) => entry.terrainAreaId)),
    trappedThisTurnIds: Object.freeze(trappedThisTurn.map((entry) => entry.terrainAreaId)),
    objectiveTrappedThisTurnIds: Object.freeze(objectiveTrappedThisTurn.map((entry) => entry.terrainAreaId)),
    trappedThisTurnCount: trappedThisTurn.length,
    objectiveTrappedThisTurnCount: objectiveTrappedThisTurn.length,
    trapVp: trappedThisTurn.length * 2 + objectiveTrappedThisTurn.length * 3,
    enemyKillsThisTurn: kills.length,
    qualifyingKills: Object.freeze(qualifyingKills),
    unresolvedKills: Object.freeze(unresolvedKills),
    trappedKillSatisfied: qualifyingKills.length > 0,
    trappedKillVp: qualifyingKills.length > 0 ? 3 : 0,
    controlKnown,
    nonHomeControlledCount: nonHomeControlled.length,
    nonHomeControlSatisfied: round >= 2 && controlKnown ? nonHomeControlled.length > 0 : round >= 2 ? null : false,
    nonHomeControlVp: round >= 2 && controlKnown && nonHomeControlled.length > 0 ? 4 : 0
  });
}
