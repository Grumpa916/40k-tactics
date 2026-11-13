import { createCommand } from "../commands/command.js";
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { executeCommand } from "../engine/command-engine.js";
import { getTacticalCombatRecommendations } from "../rules/tactical-combat-recommendations.js";
import { unitDisplayLabels } from "../ui/map-unit-labels.js";
import { getApproximateChargeMapDistance } from "../rules/spatial-context.js";
import { getFightEngagementState } from "../rules/fight-engagement-state.js";
import { getCombatFormationRoot } from "../rules/battle-unit-reference.js";

function playerName(player) {
  return player?.name ?? player?.id ?? "Unknown";
}

function describeUnit(state, unitId, perspectivePlayerId) {
  const unit = state.units.find((item) => item?.id === unitId);
  const displayName = unitDisplayLabels(state.units).get(unitId);
  if (!unit) return { unitId, name: unitId, ownerId: null, ownerName: "Unknown", side: null, status: null };
  const owner = state.players.find((player) => player?.id === unit.ownerId);
  return {
    unitId: unit.id,
    name: displayName ?? unit.name ?? unit.id,
    ownerId: unit.ownerId ?? null,
    ownerName: playerName(owner),
    side: perspectivePlayerId ? unit.ownerId === perspectivePlayerId ? "self" : "opponent" : null,
    status: unit.status ?? null
  };
}

function chargeHistory(state) {
  return Array.isArray(state?.history)
    ? state.history.filter((event) => event?.type === "charge.outcome_recorded")
    : [];
}

function groupRecommendations(state, playerId, perspectivePlayerId) {
  if (state?.phase !== "charge" || !playerId) return [];
  const recommendations = getTacticalCombatRecommendations(state, { playerId }).charge;
  const byUnit = new Map();
  // Use 1-inch Charge display estimates instead of the shared 3-inch
  // tactical range bands. These are still map-centre approximations.
  const nearby = new Map();
  const engaged = new Set(getFightEngagementState(state).engagedUnitIds);
  const friendly = state.units.filter(unit =>
    unit?.status === "deployed" && unit.ownerId === playerId &&
    getCombatFormationRoot(state, unit)?.id === unit.id && !engaged.has(unit.id));
  const enemies = state.units.filter(unit =>
    unit?.status === "deployed" && unit.ownerId !== playerId &&
    getCombatFormationRoot(state, unit)?.id === unit.id);

  for (const unit of friendly) {
    byUnit.set(unit.id, { unit: describeUnit(state, unit.id, perspectivePlayerId), targets: [] });
    for (const enemy of enemies) nearby.set(unit.id + ":" + enemy.id,
      getApproximateChargeMapDistance(state,unit,enemy));
  }
  // Range estimates rank advice; they do not decide whether a tabletop-confirmed
  // unit or target may be selected for Charge recording.
  for (const recommendation of recommendations) {
    const candidate = byUnit.get(recommendation.unitId);
    if (candidate) candidate.targets.push({
      ...recommendation,
      targetDistance: nearby.get(recommendation.unitId + ":" + recommendation.targetUnitId) ?? recommendation.targetDistance,
      target: describeUnit(state, recommendation.targetUnitId, perspectivePlayerId)
    });
  }
  for (const unit of friendly) {
    const candidate = byUnit.get(unit.id);
    const suggested = new Set(candidate.targets.map(item => item.targetUnitId));
    for (const enemy of enemies) {
      if (suggested.has(enemy.id)) continue;
      const distance = nearby.get(unit.id + ":" + enemy.id) ?? null;
      candidate.targets.push({
        targetUnitId: enemy.id,
        targetDistance: distance,
        rangeStatus: "outside-map-envelope",
        confidence: "low",
        target: describeUnit(state, enemy.id, perspectivePlayerId)
      });
    }
  }
  return [...byUnit.values()];
}

export function getChargeViewModel(
  state,
  { perspectivePlayerId = state?.activePlayer ?? null } = {}
) {
  if (!perspectivePlayerId) throw new TypeError("A perspective player is required.");

  const history = chargeHistory(state);
  const currentTurnHistory = history.filter(
    (event) =>
      event.payload?.round === state?.battle?.round &&
      event.payload?.turn === state?.turn
  );

  return {
    phase: state?.phase ?? null,
    round: state?.battle?.round ?? null,
    turn: state?.turn ?? null,
    activePlayerId: state?.activePlayer ?? state?.battle?.activePlayerId ?? null,
    candidates: groupRecommendations(state, state?.activePlayer ?? state?.battle?.activePlayerId, perspectivePlayerId)
      .filter(item => !currentTurnHistory.some(event => event.payload?.unitId === item.unit.unitId))
      .filter(item => !state.history.some(event => event.type === "unit.fell_back" && event.payload?.unitId === item.unit.unitId && event.payload?.round === state.battle.round && event.payload?.turn === state.turn)),
    outcomes: currentTurnHistory.map((event) => ({
      ...event.payload,
      unit: describeUnit(state, event.payload.unitId, perspectivePlayerId),
      targets: (event.payload.targetIds ?? []).map((targetId) =>
        describeUnit(state, targetId, perspectivePlayerId)
      )
    })),
    canComplete:
      state?.phase === "charge" &&
      state?.battle?.status === "active"
  };
}

export function recordChargeOutcome(
  state,
  { unitId, succeeded, targetIds = [], measuredDistances = {} } = {},
  context = {}
) {
  return executeCommand(
    state,
    createCommand(COMMAND_TYPES.RECORD_CHARGE_OUTCOME, {
      unitId,
      succeeded,
      targetIds,
      measuredDistances
    }),
    context
  );
}

export function recordChargeOutcomeForSession(
  session,
  { unitId, succeeded, targetIds = [], measuredDistances = {} } = {},
  context = {}
) {
  if (!session || typeof session.dispatch !== "function") {
    throw new TypeError("A game session is required.");
  }
  return session.dispatch(
    createCommand(COMMAND_TYPES.RECORD_CHARGE_OUTCOME, {
      unitId,
      succeeded,
      targetIds,
      measuredDistances
    }),
    context
  );
}

export function recordChargeDeclinedForSession(
  session,
  { unitId } = {},
  context = {}
) {
  if (!session || typeof session.dispatch !== "function") {
    throw new TypeError("A game session is required.");
  }
  return session.dispatch(
    createCommand(COMMAND_TYPES.RECORD_CHARGE_DECLINED, { unitId }),
    context
  );
}

export function finishChargePhase(session, context = {}) {
  if (!session || typeof session.dispatch !== "function") {
    throw new TypeError("A game session is required.");
  }
  return session.dispatch(
    createCommand(COMMAND_TYPES.CHANGE_PHASE, { phase: "fight" }),
    context
  );
}

