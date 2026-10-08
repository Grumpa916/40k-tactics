import { UNIT_STATUS } from "../state/unit.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";

export function recordChargeOutcome(state, {
  unitId,
  succeeded,
  targetIds = []
} = {}) {
  if (!unitId) throw new TypeError("Charging unit id is required.");
  if (typeof succeeded !== "boolean") {
    throw new TypeError("Charge outcome must be successful or failed.");
  }
  if (!Array.isArray(targetIds)) throw new TypeError("Charge targets must be an array.");
  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "charge") throw new Error("Charge outcomes may only be recorded in the Charge phase.");

  const charger = state.units.find((unit) => unit.id === unitId);
  if (!charger) throw new Error("Charging unit not found: " + unitId);
  if (charger.ownerId !== state.activePlayer) {
    throw new Error("Only the active player's units may attempt a charge.");
  }
  if (charger.status !== UNIT_STATUS.DEPLOYED) {
    throw new Error("Charging unit must be deployed.");
  }
  if (state.history.some((event) =>
    event.type === "unit.fell_back" &&
    event.payload?.unitId === unitId &&
    event.payload?.round === state.battle.round &&
    event.payload?.turn === state.turn
  )) {
    throw new Error("A unit that Fell Back cannot declare a charge this turn.");
  }

  if (state.history.some((event) =>
    event.type === "charge.outcome_recorded" &&
    event.payload?.unitId === unitId &&
    event.payload?.turn === state.turn
  )) {
    throw new Error("A unit can attempt only one charge per turn.");
  }

  const uniqueTargets = new Set(targetIds);
  if (uniqueTargets.size !== targetIds.length || targetIds.some((id) => !id)) {
    throw new Error("Charge targets must be unique valid unit ids.");
  }
  if (succeeded && targetIds.length === 0) {
    throw new Error("A successful charge must record at least one target.");
  }
  if (!succeeded && targetIds.length > 0) {
    throw new Error("A failed charge cannot record targets.");
  }

  for (const targetId of targetIds) {
    const target = state.units.find((unit) => unit.id === targetId);
    if (!target || target.status !== UNIT_STATUS.DEPLOYED || target.ownerId === charger.ownerId) {
      throw new Error("Charge targets must be deployed enemy units.");
    }
  }

  const event = createEvent("charge.outcome_recorded", {
    unitId,
    playerId: state.activePlayer,
    outcome: succeeded ? "successful" : "failed",
    targetIds: [...targetIds],
    round: state.battle.round,
    turn: state.turn
  });
  return appendHistoryEntry(state, event);
}
