import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getCombatFormationRoot } from "./battle-unit-reference.js";
import { getFriendlyUnitDestructionsForTurn } from "./scoring-evidence-state.js";
import { getLiveUnitPosition } from "./spatial-context.js";

const MAP_OBJECTIVE_RANGE_HINT = 6;

function playerIds(state) {
  return (Array.isArray(state?.players) ? state.players : []).map((player) => player?.id).filter(Boolean);
}

function resolveMission(state, playerId, perspectivePlayerId = null) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!setup?.myDisposition || !setup?.opponentDisposition) return null;
  const definitions = getBattlePrimaryMissionDefinitions(setup.myDisposition, setup.opponentDisposition);
  if (!definitions) return null;
  const ids = playerIds(state);
  const perspective = perspectivePlayerId ?? ids[0] ?? playerId;
  return playerId === perspective ? definitions.myMission : definitions.opponentMission;
}

export function isPunishmentMissionForPlayer(state, playerId, perspectivePlayerId = null) {
  return resolveMission(state, playerId, perspectivePlayerId)?.id === "primary-punishment";
}

function deployedEnemyFormationRoots(state, playerId) {
  const byId = new Map();
  for (const unit of Array.isArray(state?.units) ? state.units : []) {
    if (!unit?.id || unit.ownerId === playerId || unit.status !== "deployed") continue;
    const root = getCombatFormationRoot(state, unit) ?? unit;
    if (root?.status === "deployed" && root.ownerId !== playerId) byId.set(root.id, root);
  }
  return [...byId.values()];
}

function approximateObjectiveDistance(state, unit) {
  const position = getLiveUnitPosition(state, unit);
  if (!position) return null;
  let nearest = null;
  for (const objective of Array.isArray(state?.objectives) ? state.objectives : []) {
    if (!Number.isFinite(objective?.position?.x) || !Number.isFinite(objective?.position?.y)) continue;
    const distance = Math.hypot(objective.position.x - position.x, objective.position.y - position.y);
    if (nearest == null || distance < nearest) nearest = distance;
  }
  return nearest;
}

function previousTurnKillerIds(state, playerId) {
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  if (turn <= 0) return new Set();
  const ids = new Set();
  for (const loss of getFriendlyUnitDestructionsForTurn(state, playerId, turn - 1)) {
    if (!loss?.attackerId) continue;
    const attacker = (state.units ?? []).find((unit) => unit?.id === loss.attackerId);
    const root = attacker ? getCombatFormationRoot(state, attacker) ?? attacker : null;
    if (root?.id) ids.add(root.id);
  }
  return ids;
}

function woundFraction(unit) {
  const current = Number(unit?.wounds);
  const starting = Number(unit?.startingWounds ?? unit?.profile?.characteristics?.wounds);
  if (!Number.isFinite(current) || !Number.isFinite(starting) || starting <= 0) return null;
  return Math.max(0, Math.min(1, current / starting));
}

export function getPunishmentCondemnationCandidates(state, {
  playerId,
  perspectivePlayerId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isPunishmentMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze([]);
  const killers = previousTurnKillerIds(state, playerId);
  const candidates = deployedEnemyFormationRoots(state, playerId).map((unit) => {
    const nearestObjectiveDistance = approximateObjectiveDistance(state, unit);
    const recordedPreviousTurnKiller = killers.has(unit.id);
    const mapSuggestsObjectiveRange = Number.isFinite(nearestObjectiveDistance) && nearestObjectiveDistance <= MAP_OBJECTIVE_RANGE_HINT;
    const likelyQualifier = recordedPreviousTurnKiller || mapSuggestsObjectiveRange;
    return Object.freeze({
      unitId: unit.id,
      unitName: unit.name ?? unit.id,
      recordedPreviousTurnKiller,
      mapSuggestsObjectiveRange,
      nearestObjectiveDistance: Number.isFinite(nearestObjectiveDistance)
        ? Math.round(nearestObjectiveDistance * 10) / 10
        : null,
      likelyQualifier,
      woundFraction: woundFraction(unit),
      eligibilityNote: recordedPreviousTurnKiller
        ? "Recorded as an attacker that destroyed one of your units last turn."
        : mapSuggestsObjectiveRange
          ? "Approximate map suggests it may be within objective range; verify on the tabletop."
          : "Not confirmed by recorded evidence; select only if it qualifies on the tabletop, or as the one-unit fallback if none qualify."
    });
  });

  candidates.sort((a, b) => {
    if (a.recordedPreviousTurnKiller !== b.recordedPreviousTurnKiller) return a.recordedPreviousTurnKiller ? -1 : 1;
    if (a.mapSuggestsObjectiveRange !== b.mapSuggestsObjectiveRange) return a.mapSuggestsObjectiveRange ? -1 : 1;
    const aw = a.woundFraction ?? 2;
    const bw = b.woundFraction ?? 2;
    if (aw !== bw) return aw - bw;
    return a.unitName.localeCompare(b.unitName);
  });
  return Object.freeze(candidates);
}

export function getPunishmentCondemnationRecords(state) {
  return Object.freeze([...(state?.scoring?.punishmentCondemnations ?? [])]);
}

export function getPunishmentCondemnationForTurn(state, playerId, turn = state?.turn ?? 0) {
  return getPunishmentCondemnationRecords(state).find((record) =>
    record?.playerId === playerId && record?.turn === turn
  ) ?? null;
}

export function getActivePunishmentCondemnation(state, playerId) {
  const records = getPunishmentCondemnationRecords(state)
    .filter((record) => record?.playerId === playerId)
    .sort((a, b) => Number(b.turn ?? -1) - Number(a.turn ?? -1));
  const record = records[0] ?? null;
  if (!record) return null;
  const currentTurn = Number.isInteger(state?.turn) ? state.turn : 0;
  const activePlayerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
  if (record.turn === currentTurn) return record;
  if (record.turn < currentTurn && activePlayerId !== playerId) return record;
  return null;
}

export function isPunishmentCondemnationRequired(state, {
  playerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null,
  perspectivePlayerId = null
} = {}) {
  if (!playerId || state?.battle?.status !== "active" || state?.phase !== "start_turn") return false;
  if (!isPunishmentMissionForPlayer(state, playerId, perspectivePlayerId)) return false;
  if (deployedEnemyFormationRoots(state, playerId).length === 0) return false;
  return !getPunishmentCondemnationForTurn(state, playerId, state.turn ?? 0);
}

export function getPunishmentCondemnedUnitsLeftThisTurn(state, playerId) {
  const record = getActivePunishmentCondemnation(state, playerId);
  if (!record?.unitIds?.length) return Object.freeze([]);
  const currentTurn = Number.isInteger(state?.turn) ? state.turn : 0;
  const condemned = new Set(record.unitIds);
  const left = new Set();

  for (const event of Array.isArray(state?.history) ? state.history : []) {
    if (event?.payload?.turn !== currentTurn) continue;
    if (event.type === "unit.destroyed" && condemned.has(event.payload?.unitId)) left.add(event.payload.unitId);
    if (event.type === "combat.attack_resolved") {
      const delta = event.payload?.stateDelta?.target;
      const id = delta?.unitId ?? event.payload?.allocationTargetId ?? event.payload?.targetId ?? null;
      if (id && condemned.has(id) && delta?.statusAfter === "destroyed" && delta?.statusBefore !== "destroyed") left.add(id);
    }
    if (event.type === "unit.entered_reserves" && condemned.has(event.payload?.unitId)) left.add(event.payload.unitId);
  }

  return Object.freeze([...left]);
}

export const PUNISHMENT_CONDEMNATION_MAP_NOTE =
  "Objective-range hints use the approximate battle map with uncertainty and never determine tabletop legality.";
