import { BATTLE_STATUS } from "../state/battle.js";
import { UNIT_STATUS } from "../state/unit.js";
import { PHASES } from "../state/turn.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";

function transition(state, eventType, payload, apply) {
  const nextState = apply(state);
  return appendHistoryEntry(nextState, createEvent(eventType, payload));
}

export function startBattle(state, { battleId, missionId = null } = {}) {
  if (!battleId) throw new TypeError("Battle id is required.");
  if (state.battle) throw new Error("A battle already exists.");
  return transition(state, "battle.started", { battleId, missionId }, (current) => ({
    ...current,
    phase: "deployment",
    battle: {
      id: battleId,
      missionId,
      status: BATTLE_STATUS.DEPLOYMENT,
      round: 0,
      activePlayerId: null
    }
  }));
}

export function enterDeployment(state) {
  if (!state.battle || state.battle.status !== BATTLE_STATUS.SETUP) {
    throw new Error("Battle must be in setup before deployment.");
  }
  return transition(state, "battle.deployment_started", {}, (current) => ({
    ...current,
    phase: "deployment",
    battle: { ...current.battle, status: BATTLE_STATUS.DEPLOYMENT }
  }));
}

export function deployUnit(state, { unitId, position } = {}) {
  if (!unitId) throw new TypeError("Unit id is required.");
  if (!state.battle || state.battle.status !== BATTLE_STATUS.DEPLOYMENT) {
    throw new Error("Battle must be in deployment.");
  }
  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Unit not found: " + unitId);
  if (unit.status !== UNIT_STATUS.RESERVES) {
    throw new Error("Unit must be in reserves before deployment.");
  }
  return transition(state, "unit.deployed", { unitId, position }, (current) => ({
    ...current,
    units: current.units.map((item) =>
      item.id === unitId
        ? { ...item, status: UNIT_STATUS.DEPLOYED, position: position ?? item.position }
        : item
    )
  }));
}

export function startFirstTurn(state, { activePlayerId } = {}) {
  if (!activePlayerId) throw new TypeError("An active player is required.");
  if (!state.battle || state.battle.status !== BATTLE_STATUS.DEPLOYMENT) {
    throw new Error("Battle must be in deployment before the first turn.");
  }
  return transition(state, "turn.started", { number: 1, activePlayerId }, (current) => ({
    ...current,
    phase: PHASES[0],
    turn: 1,
    activePlayer: activePlayerId,
    battle: {
      ...current.battle,
      status: BATTLE_STATUS.ACTIVE,
      round: 1,
      activePlayerId
    }
  }));
}

export function changePhase(state, { phase } = {}) {
  if (!PHASES.includes(phase)) throw new RangeError("Unknown phase: " + phase);
  if (!state.battle || state.battle.status !== BATTLE_STATUS.ACTIVE) {
    throw new Error("Battle must be active.");
  }
  return transition(state, "turn.phase_changed", { phase }, (current) => ({
    ...current,
    phase
  }));
}

export function changeActivePlayer(state, { activePlayerId } = {}) {
  if (!activePlayerId) throw new TypeError("An active player is required.");
  if (!state.battle || state.battle.status !== BATTLE_STATUS.ACTIVE) {
    throw new Error("Battle must be active.");
  }
  return transition(state, "turn.active_player_changed", { activePlayerId }, (current) => ({
    ...current,
    activePlayer: activePlayerId,
    battle: { ...current.battle, activePlayerId }
  }));
}

export function completeBattle(state) {
  if (!state.battle || state.battle.status !== BATTLE_STATUS.ACTIVE) {
    throw new Error("Battle must be active before completion.");
  }
  return transition(state, "battle.completed", {}, (current) => ({
    ...current,
    phase: "complete",
    battle: { ...current.battle, status: BATTLE_STATUS.COMPLETE }
  }));
}
