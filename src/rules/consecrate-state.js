import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";

const CONSECRATED_EVENT = "primary.objective_consecrated";
const REVIEWED_EVENT = "primary.consecration_reviewed";

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

export function isConsecrateMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === "primary-consecrate";
}

function objectiveText(objective) {
  const layout = objective?.layoutObjective ?? "";
  return `${objective?.name ?? ""} ${objective?.id ?? ""} ${layout}`;
}

function objectiveLayoutName(objective) {
  if (objective?.layoutObjective) return String(objective.layoutObjective);
  const id = String(objective?.id ?? "");
  return id.startsWith("event-companion:") ? id.slice("event-companion:".length) : String(objective?.name ?? id);
}

export function isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  const layout = objectiveLayoutName(objective);
  const attacker = state?.preGameSetup?.attackerPlayerId ?? null;
  const defender = state?.preGameSetup?.defenderPlayerId ?? null;
  if (layout === "Attacker Home" && attacker) return attacker === playerId;
  if (layout === "Defender Home" && defender) return defender === playerId;

  const text = objectiveText(objective);
  if (/my\s*home|myhome/i.test(text)) return playerId === perspectivePlayerId;
  if (/opponent.*home|enemy.*home|opponenthome/i.test(text)) return playerId !== perspectivePlayerId;
  return false;
}

export function isOpponentHomeObjectiveForPlayer(state, objective, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  const layout = objectiveLayoutName(objective);
  const attacker = state?.preGameSetup?.attackerPlayerId ?? null;
  const defender = state?.preGameSetup?.defenderPlayerId ?? null;
  if (layout === "Attacker Home" && attacker) return attacker !== playerId;
  if (layout === "Defender Home" && defender) return defender !== playerId;

  const text = objectiveText(objective);
  if (/my\s*home|myhome/i.test(text)) return playerId !== perspectivePlayerId;
  if (/opponent.*home|enemy.*home|opponenthome/i.test(text)) return playerId === perspectivePlayerId;
  return false;
}

function unitOwner(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : []).find((unit) => unit?.id === unitId)?.ownerId ?? null;
}

function consecrationKillUnitId(state, event, playerId) {
  if (event?.type !== "combat.attack_resolved") return null;
  const delta = event.payload?.stateDelta?.target;
  if (!delta || delta.statusAfter !== "destroyed" || delta.statusBefore === "destroyed") return null;
  const attackerId = event.payload?.attackerId ?? event.payload?.sourceAttackerId ?? null;
  if (!attackerId || unitOwner(state, attackerId) !== playerId) return null;
  const targetId = delta.unitId ?? event.payload?.allocationTargetId ?? event.payload?.targetId ?? null;
  const targetOwnerId = targetId ? unitOwner(state, targetId) : null;
  if (targetOwnerId != null && targetOwnerId === playerId) return null;
  return attackerId;
}

export function getConsecratedObjectiveIds(state, playerId) {
  const ids = [];
  const seen = new Set();
  for (const event of Array.isArray(state?.history) ? state.history : []) {
    if (event?.type !== CONSECRATED_EVENT || event.payload?.playerId !== playerId) continue;
    const objectiveId = event.payload?.objectiveId;
    if (objectiveId && !seen.has(objectiveId)) {
      seen.add(objectiveId);
      ids.push(objectiveId);
    }
  }
  return Object.freeze(ids);
}

export function getConsecrationUnitIds(state, playerId) {
  const active = new Set();
  for (const event of Array.isArray(state?.history) ? state.history : []) {
    const killUnitId = consecrationKillUnitId(state, event, playerId);
    if (killUnitId) active.add(killUnitId);
    if (event?.type === CONSECRATED_EVENT && event.payload?.playerId === playerId && event.payload?.unitId) {
      active.delete(event.payload.unitId);
    }
  }
  return Object.freeze([...active]);
}

export function wasConsecrateReviewedThisTurn(state, playerId) {
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const round = Number(state?.battle?.round) || 0;
  return (Array.isArray(state?.history) ? state.history : []).some((event) =>
    event?.type === REVIEWED_EVENT &&
    event.payload?.playerId === playerId &&
    event.payload?.turn === turn &&
    event.payload?.round === round
  );
}

export function getConsecrateReviewState(state, {
  playerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  const active = Boolean(playerId) && isConsecrateMissionForPlayer(state, playerId, perspectivePlayerId);
  const consecratedObjectiveIds = active ? getConsecratedObjectiveIds(state, playerId) : Object.freeze([]);
  const consecrated = new Set(consecratedObjectiveIds);
  const allConsecrationUnitIds = active ? getConsecrationUnitIds(state, playerId) : Object.freeze([]);
  const units = Array.isArray(state?.units) ? state.units : [];
  const deployedConsecrationUnits = units.filter((unit) =>
    allConsecrationUnitIds.includes(unit?.id) && unit?.ownerId === playerId && unit?.status === "deployed"
  );
  const availableObjectives = (Array.isArray(state?.objectives) ? state.objectives : []).filter((objective) =>
    objective?.id && !consecrated.has(objective.id) && !isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId)
  );
  const reviewedThisTurn = active ? wasConsecrateReviewedThisTurn(state, playerId) : false;
  const inOwnEndTurn = state?.battle?.status === "active" && state?.phase === "end_turn" &&
    (state?.activePlayer ?? state?.battle?.activePlayerId) === playerId;
  const required = active && inOwnEndTurn && !reviewedThisTurn && deployedConsecrationUnits.length > 0 && availableObjectives.length > 0;
  const opponentHomeObjectiveIds = (Array.isArray(state?.objectives) ? state.objectives : [])
    .filter((objective) => isOpponentHomeObjectiveForPlayer(state, objective, playerId, perspectivePlayerId))
    .map((objective) => objective.id);
  const opponentHomeConsecrated = opponentHomeObjectiveIds.some((id) => consecrated.has(id));
  const consecratedCount = consecratedObjectiveIds.length;
  const endTurnConsecrationVp = consecratedCount >= 3 ? 6 : consecratedCount >= 1 ? 3 : 0;

  return Object.freeze({
    active,
    playerId,
    required,
    reviewedThisTurn,
    allConsecrationUnitIds,
    deployedConsecrationUnits: Object.freeze(deployedConsecrationUnits),
    availableObjectives: Object.freeze(availableObjectives),
    consecratedObjectiveIds,
    consecratedCount,
    endTurnConsecrationVp,
    opponentHomeObjectiveIds: Object.freeze(opponentHomeObjectiveIds),
    opponentHomeConsecrated
  });
}

export function isConsecrateReviewRequired(state, options = {}) {
  return getConsecrateReviewState(state, options).required;
}

export const CONSECRATE_EVENT_TYPES = Object.freeze({
  OBJECTIVE_CONSECRATED: CONSECRATED_EVENT,
  REVIEWED: REVIEWED_EVENT
});
