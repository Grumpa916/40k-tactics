import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getDeathTrapTerrainAreasForPosition } from "./death-trap-state.js";
import { getLiveUnitPosition } from "./spatial-context.js";
import { getEnemyUnitDestructionsForTurn, getUnitStateAtTurnStart } from "./scoring-evidence-state.js";
import { getTerritoryStatusForPosition } from "./battlefield-territory.js";

const MISSION_ID = "primary-search-and-scour";

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

export function isSearchAndScourMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === MISSION_ID;
}

function objectiveText(objective) {
  return [objective?.name, objective?.label, objective?.layoutObjective, objective?.role, objective?.kind]
    .filter(Boolean).join(" ");
}

export function isSearchAndScourCentralObjective(objective) {
  return /cent(er|ral)/i.test(objectiveText(objective));
}

function liveEnemyUnits(state, playerId) {
  return (Array.isArray(state?.units) ? state.units : []).filter((unit) =>
    unit?.ownerId != null && unit.ownerId !== playerId && unit.status === "deployed"
  );
}

function terrainKillEvidence(state, playerId, turn) {
  const kills = getEnemyUnitDestructionsForTurn(state, playerId, turn);
  const qualifying = [];
  const unresolved = [];
  for (const kill of kills) {
    const start = getUnitStateAtTurnStart(state, kill.unitId, turn);
    const terrainAreaIds = Object.freeze(getDeathTrapTerrainAreasForPosition(state, start?.position).map((entry) => entry.terrainAreaId));
    const item = Object.freeze({ ...kill, turnStartPosition: start?.position ?? null, terrainAreaIds });
    if (terrainAreaIds.length > 0) qualifying.push(item);
    else unresolved.push(item);
  }
  return Object.freeze({
    enemyKillsThisTurn: kills.length,
    qualifyingKills: Object.freeze(qualifying),
    unresolvedKills: Object.freeze(unresolved),
    terrainKillSatisfied: qualifying.length > 0,
    terrainKillVp: qualifying.length > 0 ? 2 : 0
  });
}

function territoryEvidence(state, playerId) {
  const entries = liveEnemyUnits(state, playerId).map((unit) => {
    const position = getLiveUnitPosition(state, unit);
    const status = getTerritoryStatusForPosition(state, { playerId, position });
    return Object.freeze({
      unitId: unit.id,
      unitName: unit.name ?? unit.id,
      position: position ?? null,
      territory: status.territory,
      confidence: status.confidence,
      distanceToBoundary: status.distanceToBoundary
    });
  });
  const blockers = entries.filter((entry) => entry.territory === "mine" && entry.confidence !== "low");
  const uncertain = entries.filter((entry) => entry.territory === "boundary" || entry.territory === "unknown" || entry.confidence === "low");
  const clearByMap = blockers.length === 0 && uncertain.length === 0;
  return Object.freeze({
    enemyTerritoryEvidence: Object.freeze(entries),
    territoryBlockerCandidates: Object.freeze(blockers),
    uncertainTerritoryEnemies: Object.freeze(uncertain),
    territoryClearLikelyByMap: clearByMap,
    territoryEvidenceKnown: entries.length === 0 || entries.some((entry) => entry.territory !== "unknown")
  });
}

export function getSearchAndScourState(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const active = isSearchAndScourMissionForPlayer(state, playerId, perspectivePlayerId);
  if (!active) return Object.freeze({ active: false, missionId: null });

  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const controlKnown = objectives.length > 0 && objectives.every((objective) => objective?.control != null);
  const centralObjectives = objectives.filter(isSearchAndScourCentralObjective);
  const controlledObjectives = controlKnown
    ? objectives.filter((objective) => objective.control?.controlState === "controlled" && objective.control?.controllerId === playerId)
    : [];
  const centralControlled = controlledObjectives.filter(isSearchAndScourCentralObjective);
  const nonHomeControlled = controlledObjectives.filter((objective) => !isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const kills = terrainKillEvidence(state, playerId, turn);
  const territory = territoryEvidence(state, playerId);

  return Object.freeze({
    active: true,
    missionId: MISSION_ID,
    missionName: "Search and Scour",
    round,
    turn,
    controlKnown,
    centralObjectiveIds: Object.freeze(centralObjectives.map((objective) => objective.id)),
    centralControlledIds: Object.freeze(centralControlled.map((objective) => objective.id)),
    centralControlledCount: centralControlled.length,
    centralControlVp: centralControlled.length > 0 ? 3 : 0,
    nonHomeControlledIds: Object.freeze(nonHomeControlled.map((objective) => objective.id)),
    nonHomeControlledCount: nonHomeControlled.length,
    nonHomeControlRawVp: round >= 2 ? nonHomeControlled.length * 4 : 0,
    ...kills,
    ...territory
  });
}
