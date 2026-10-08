import { UNIT_STATUS } from "../state/unit.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { getShootingCandidates } from "../rules/shooting-candidates.js";
import { changePhase } from "./state-transitions.js";

export function recordShootingActivation(state, { unitId } = {}) {
  if (!unitId) throw new TypeError("Shooting activation unit id is required.");
  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "shooting") throw new Error("Shooting activations may only be recorded in the Shooting phase.");

  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Shooting activation unit not found: " + unitId);
  if (unit.status !== UNIT_STATUS.DEPLOYED) throw new Error("Shooting activation unit must be deployed.");
  if (!unit.ownerId) throw new Error("Shooting activation unit must have an owner.");

  const activePlayerId = state.activePlayer ?? state.battle.activePlayerId ?? null;
  if (activePlayerId && unit.ownerId !== activePlayerId) {
    throw new Error("Only the active player's units can be selected to shoot.");
  }

  const candidates = getShootingCandidates(state);
  if (!candidates.available.includes(unitId)) {
    throw new Error("Unit is not an available Shooting candidate.");
  }

  return appendHistoryEntry(state, createEvent("shooting.unit_activated", {
    unitId,
    playerId: unit.ownerId,
    round: state.battle.round,
    turn: state.turn
  }));
}

export function completeShootingPhase(state) {
  const candidates = getShootingCandidates(state);
  if (candidates.available.length > 0) {
    throw new Error("Shooting phase cannot be completed while eligible units remain.");
  }
  return changePhase(state, { phase: "charge" });
}
