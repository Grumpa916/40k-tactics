import { UNIT_STATUS } from "../state/unit.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { getShootingCandidates } from "../rules/shooting-candidates.js";
import { changePhase } from "./state-transitions.js";

const SHOOTING_ACTION_TYPES = new Set(["shoot", "mission_action", "special_action"]);

export function recordShootingActivation(state, {
  unitId,
  actionType = "shoot",
  actionId = null
} = {}) {
  if (!unitId) throw new TypeError("Shooting activation unit id is required.");
  if (!SHOOTING_ACTION_TYPES.has(actionType)) {
    throw new TypeError("Shooting activation action type is invalid.");
  }
  if (actionType !== "shoot" && !actionId) {
    throw new TypeError("A Shooting action id is required for non-shoot activations.");
  }
  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "shooting") throw new Error("Shooting activations may only be recorded in the Shooting phase.");

  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Shooting activation unit not found: " + unitId);
  if (unit.status !== UNIT_STATUS.DEPLOYED) throw new Error("Shooting activation unit must be deployed.");
  if (actionType === "shoot" && state.history.some((event) =>
    event?.type === "unit.fell_back" &&
    event?.payload?.unitId === unitId &&
    event?.payload?.round === state.battle.round &&
    event?.payload?.turn === state.turn
  )) {
    throw new Error("A unit that Fell Back cannot shoot this turn.");
  }
  if (!unit.ownerId) throw new Error("Shooting activation unit must have an owner.");

  const activePlayerId = state.activePlayer ?? state.battle.activePlayerId ?? null;
  if (activePlayerId && unit.ownerId !== activePlayerId) {
    throw new Error("Only the active player's units can be selected for a Shooting activation.");
  }

  const candidates = getShootingCandidates(state);
  if (!candidates.available.includes(unitId)) {
    throw new Error("Unit is not an available Shooting candidate.");
  }

  return appendHistoryEntry(state, createEvent("shooting.unit_activated", {
    unitId,
    playerId: unit.ownerId,
    round: state.battle.round,
    turn: state.turn,
    actionType,
    actionId
  }));
}

export function completeShootingPhase(state) {
  const candidates = getShootingCandidates(state);
  if (candidates.available.length > 0) {
    throw new Error("Shooting phase cannot be completed while eligible units remain.");
  }
  return changePhase(state, { phase: "charge" });
}
