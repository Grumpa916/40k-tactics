import { createCommand } from "../commands/command.js";
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { executeCommand } from "../engine/command-engine.js";
import { getTacticalCombatRecommendations } from "../rules/tactical-combat-recommendations.js";
import { unitDisplayLabels } from "../ui/map-unit-labels.js";

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
  const recommendations = getTacticalCombatRecommendations(state, { playerId }).charge;
  const byUnit = new Map();

  for (const recommendation of recommendations) {
    if (!byUnit.has(recommendation.unitId)) {
      byUnit.set(recommendation.unitId, {
        unit: describeUnit(state, recommendation.unitId, perspectivePlayerId),
        targets: []
      });
    }
    byUnit.get(recommendation.unitId).targets.push({
      ...recommendation,
      target: describeUnit(state, recommendation.targetUnitId, perspectivePlayerId)
    });
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

