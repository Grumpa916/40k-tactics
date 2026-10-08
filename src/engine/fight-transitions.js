import { UNIT_STATUS } from "../state/unit.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { getFightCandidates } from "../rules/fight-candidates.js";

export function recordFightActivation(state, { unitId } = {}) {
  if (!unitId) throw new TypeError("Fight activation unit id is required.");
  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "fight") throw new Error("Fight activations may only be recorded in the Fight phase.");

  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Fight activation unit not found: " + unitId);
  if (unit.status !== UNIT_STATUS.DEPLOYED) {
    throw new Error("Fight activation unit must be deployed.");
  }
  if (!unit.ownerId) throw new Error("Fight activation unit must have an owner.");
  if (state.players.length > 0 && !state.players.some((player) => player.id === unit.ownerId)) {
    throw new Error("Fight activation unit owner must be a player in the game.");
  }

  const candidates = getFightCandidates(state);
  const isCandidate = candidates.fightsFirst.includes(unitId) || candidates.normal.includes(unitId);
  if (!isCandidate) {
    throw new Error("Unit is not an available Fight candidate.");
  }

  if (state.history.some((event) =>
    event.type === "fight.unit_activated" &&
    event.payload?.unitId === unitId &&
    event.payload?.turn === state.turn
  )) {
    throw new Error("A unit can be activated to fight only once per turn.");
  }

  const chargedThisTurn = state.history.some((event) =>
    event.type === "charge.outcome_recorded" &&
    event.payload?.unitId === unitId &&
    event.payload?.outcome === "successful" &&
    event.payload?.round === state.battle.round &&
    event.payload?.turn === state.turn
  );
  const event = createEvent("fight.unit_activated", {
    unitId,
    playerId: unit.ownerId,
    round: state.battle.round,
    turn: state.turn,
    fightsFirst: chargedThisTurn
  });
  return appendHistoryEntry(state, event);
}

export function completeFightPhase(state) {
  if (!state.battle || state.battle.status !== "active") {
    throw new Error("Battle must be active.");
  }
  if (state.phase !== "fight") {
    throw new Error("Fight phase must be active before it can be completed.");
  }

  const candidates = getFightCandidates(state);
  if (candidates.fightsFirst.length > 0 || candidates.normal.length > 0) {
    throw new Error("Fight phase cannot be completed while Fight candidates remain.");
  }

  const nextState = {
    ...state,
    phase: "end_turn"
  };
  return appendHistoryEntry(nextState, createEvent("fight.phase_completed", {
    round: state.battle.round,
    turn: state.turn
  }));
}
