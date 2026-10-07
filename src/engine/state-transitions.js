import { BATTLE_STATUS } from "../state/battle.js";
import { UNIT_STATUS } from "../state/unit.js";
import { PHASES, TURN_STEPS } from "../state/turn.js";
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
      activePlayerId: null,
      firstPlayerId: null
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

  const roundStarted = transition(state, "battle.round_started", {
    round: 1,
    firstPlayerId: activePlayerId
  }, (current) => ({
    ...current,
    phase: "start_battle_round",
    battle: {
      ...current.battle,
      status: BATTLE_STATUS.ACTIVE,
      round: 1,
      activePlayerId: null,
      firstPlayerId: activePlayerId
    }
  }));

  return transition(roundStarted, "turn.started", { number: 1, activePlayerId }, (current) => ({
    ...current,
    phase: "start_turn",
    turn: 1,
    activePlayer: activePlayerId,
    battle: { ...current.battle, activePlayerId }
  }));
}

export function changePhase(state, { phase } = {}) {
  if (![...TURN_STEPS, "end_battle_round", "start_battle_round"].includes(phase)) {
    throw new RangeError("Unknown turn step or phase: " + phase);
  }
  if (!state.battle || state.battle.status !== BATTLE_STATUS.ACTIVE) {
    throw new Error("Battle must be active.");
  }
  const phaseIndex = TURN_STEPS.indexOf(state.phase);
  const nextPhase = TURN_STEPS[phaseIndex + 1];
  if (phaseIndex < 0 || phase !== nextPhase) {
    throw new Error("Turn steps must resolve in order.");
  }
  return transition(state, "turn.phase_changed", { phase }, (current) => ({
    ...current,
    phase
  }));
}

function requirePlayer(state, playerId) {
  if (!playerId) throw new TypeError("An active player is required.");
  if (state.players.length > 0 && !state.players.some((player) => player.id === playerId)) {
    throw new Error("Active player must exist in the game state.");
  }
}

export function endTurn(state, { nextActivePlayerId } = {}) {
  if (!state.battle || state.battle.status !== BATTLE_STATUS.ACTIVE) {
    throw new Error("Battle must be active.");
  }
  if (state.phase !== "end_turn") {
    throw new Error("The turn must reach its end step before it can end.");
  }
  requirePlayer(state, nextActivePlayerId);
  if (nextActivePlayerId === state.activePlayer) {
    throw new Error("The next turn must belong to the other player.");
  }
  if (!state.battle.firstPlayerId) {
    throw new Error("The first player for this battle round is not set.");
  }

  const battleRoundComplete = nextActivePlayerId === state.battle.firstPlayerId;
  const ended = transition(state, "turn.ended", {
    playerId: state.activePlayer,
    nextActivePlayerId,
    turn: state.turn,
    battleRoundComplete
  }, (current) => ({
    ...current,
    phase: battleRoundComplete ? "end_battle_round" : "start_turn",
    turn: battleRoundComplete ? current.turn : current.turn + 1,
    activePlayer: battleRoundComplete ? null : nextActivePlayerId,
    battle: {
      ...current.battle,
      activePlayerId: battleRoundComplete ? null : nextActivePlayerId
    }
  }));

  return battleRoundComplete
    ? transition(ended, "battle.round_ended", { round: state.battle.round }, (current) => current)
    : ended;
}

export function advanceBattleRound(state) {
  if (!state.battle || state.battle.status !== BATTLE_STATUS.ACTIVE) {
    throw new Error("Battle must be active.");
  }
  if (state.phase !== "end_battle_round") {
    throw new Error("Both players must finish their turns before the battle round can end.");
  }
  if (!state.battle.firstPlayerId) {
    throw new Error("The first player for this battle round is not set.");
  }

  const roundStarted = transition(state, "battle.round_started", {
    round: state.battle.round + 1,
    firstPlayerId: state.battle.firstPlayerId
  }, (current) => ({
    ...current,
    phase: "start_battle_round",
    activePlayer: null,
    battle: {
      ...current.battle,
      round: current.battle.round + 1,
      activePlayerId: null
    }
  }));

  const turnNumber = state.turn + 1;
  return transition(roundStarted, "turn.started", {
    number: turnNumber,
    activePlayerId: state.battle.firstPlayerId
  }, (current) => ({
    ...current,
    phase: "start_turn",
    turn: turnNumber,
    activePlayer: current.battle.firstPlayerId,
    battle: { ...current.battle, activePlayerId: current.battle.firstPlayerId }
  }));
}

export function changeActivePlayer(state, { activePlayerId } = {}) {
  requirePlayer(state, activePlayerId);
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
