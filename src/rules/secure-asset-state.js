import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import {
  getEnemyUnitDestructionsForTurn,
  getTurnSnapshot
} from "./scoring-evidence-state.js";

const MISSION_ID = "primary-secure-asset";
const OBJECTIVE_RANGE_INCHES = 3;

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

export function isSecureAssetMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === MISSION_ID;
}

function objectiveText(objective) {
  return [objective?.name, objective?.label, objective?.layoutObjective, objective?.role, objective?.kind]
    .filter(Boolean).join(" ");
}

export function isSecureAssetCentralObjective(objective) {
  return /cent(er|ral)/i.test(objectiveText(objective));
}

function actionKey(payload) {
  return [payload?.round, payload?.turn, payload?.unitId].join(":");
}

function relevantAttempt(payload, playerId) {
  return payload?.missionDefinitionId === MISSION_ID &&
    payload?.playerId === playerId &&
    typeof payload?.objectiveId === "string" && payload.objectiveId.length > 0;
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

  return Object.freeze({
    attemptsThisTurn: Object.freeze(attemptsThisTurn),
    pendingAttempts: Object.freeze(pendingAttempts),
    completedThisTurn: Object.freeze(completedThisTurn),
    usedThisTurn: attemptsThisTurn.length > 0,
    completedThisTurnCount: completedThisTurn.length,
    pendingObjectiveIds: Object.freeze([...new Set(pendingAttempts.map((attempt) => attempt.objectiveId))])
  });
}

function distance(first, second) {
  if (!Number.isFinite(first?.x) || !Number.isFinite(first?.y) || !Number.isFinite(second?.x) || !Number.isFinite(second?.y)) return null;
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function centralStartEvidence(state, playerId, centralObjectives) {
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const snapshot = getTurnSnapshot(state, turn);
  if (!snapshot || centralObjectives.length === 0 || centralObjectives.some((objective) => !Number.isFinite(objective?.position?.x) || !Number.isFinite(objective?.position?.y))) {
    return Object.freeze({
      known: false,
      enemyStartedInCentralRangeIds: Object.freeze([]),
      qualifyingDestroyedUnitIds: Object.freeze([]),
      remainingCentralTargetIds: Object.freeze([]),
      satisfied: false
    });
  }

  const enemiesAtStart = (snapshot.units ?? []).filter((unit) =>
    unit?.ownerId && unit.ownerId !== playerId && unit.status !== "destroyed" &&
    centralObjectives.some((objective) => {
      const measured = distance(unit.position, objective.position);
      return measured != null && measured <= OBJECTIVE_RANGE_INCHES;
    })
  );
  const startedIds = new Set(enemiesAtStart.map((unit) => unit.id));
  const destructions = getEnemyUnitDestructionsForTurn(state, playerId, turn);
  const qualifyingDestroyedUnitIds = [...new Set(destructions
    .filter((event) => startedIds.has(event.unitId))
    .map((event) => event.unitId))];
  const destroyedIds = new Set(qualifyingDestroyedUnitIds);

  return Object.freeze({
    known: true,
    enemyStartedInCentralRangeIds: Object.freeze([...startedIds]),
    qualifyingDestroyedUnitIds: Object.freeze(qualifyingDestroyedUnitIds),
    remainingCentralTargetIds: Object.freeze([...startedIds].filter((unitId) => !destroyedIds.has(unitId))),
    satisfied: qualifyingDestroyedUnitIds.length > 0
  });
}

export function getSecureAssetObjectiveOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  stateOverride = null
} = {}) {
  if (!playerId || !isSecureAssetMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze([]);
  const action = stateOverride ?? deriveActionState(state, playerId);
  if (action.usedThisTurn) return Object.freeze([]);

  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const homeIds = new Set(objectives
    .filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId))
    .map((objective) => objective.id));
  if (!homeIds.size) return Object.freeze([]);

  return Object.freeze(objectives
    .filter((objective) => objective?.id && !homeIds.has(objective.id))
    .map((objective) => Object.freeze({
      objectiveId: objective.id,
      name: objective.name ?? objective.layoutObjective ?? objective.id,
      controlledByPlayer: objective?.control?.controlState === "controlled" && objective?.control?.controllerId === playerId,
      central: isSecureAssetCentralObjective(objective)
    })));
}

export function getSecureAssetState(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const active = isSecureAssetMissionForPlayer(state, playerId, perspectivePlayerId);
  if (!active) {
    return Object.freeze({
      active: false,
      missionId: null,
      missionName: null,
      homeRoleKnown: false,
      playerHomeObjectiveIds: Object.freeze([]),
      centralObjectiveIds: Object.freeze([]),
      usedThisTurn: false,
      completedThisTurnCount: 0,
      pendingObjectiveIds: Object.freeze([]),
      actionAvailableThisTurn: false,
      centralKillEvidenceKnown: false,
      enemyStartedInCentralRangeIds: Object.freeze([]),
      qualifyingDestroyedUnitIds: Object.freeze([]),
      remainingCentralTargetIds: Object.freeze([]),
      centralKillSatisfied: false
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const playerHomeObjectiveIds = Object.freeze(objectives
    .filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId))
    .map((objective) => objective.id));
  const centralObjectives = objectives.filter(isSecureAssetCentralObjective);
  const centralObjectiveIds = Object.freeze(centralObjectives.map((objective) => objective.id));
  const homeRoleKnown = playerHomeObjectiveIds.length > 0;
  const action = deriveActionState(state, playerId);
  const killEvidence = centralStartEvidence(state, playerId, centralObjectives);

  return Object.freeze({
    active: true,
    missionId: mission?.id ?? MISSION_ID,
    missionName: mission?.name ?? "Secure Asset",
    homeRoleKnown,
    playerHomeObjectiveIds,
    centralObjectiveIds,
    usedThisTurn: action.usedThisTurn,
    completedThisTurnCount: action.completedThisTurnCount,
    pendingObjectiveIds: action.pendingObjectiveIds,
    pendingAttempts: action.pendingAttempts,
    completedThisTurn: action.completedThisTurn,
    actionAvailableThisTurn: homeRoleKnown && !action.usedThisTurn && getSecureAssetObjectiveOptions(state, {
      playerId,
      perspectivePlayerId,
      stateOverride: action
    }).length > 0,
    centralKillEvidenceKnown: killEvidence.known,
    enemyStartedInCentralRangeIds: killEvidence.enemyStartedInCentralRangeIds,
    qualifyingDestroyedUnitIds: killEvidence.qualifyingDestroyedUnitIds,
    remainingCentralTargetIds: killEvidence.remainingCentralTargetIds,
    centralKillSatisfied: killEvidence.satisfied
  });
}
