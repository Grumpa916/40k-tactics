import { UNIT_STATUS } from "../state/unit.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { getBattleShockEligibility, isUnitBattleShocked } from "../rules/unit-status-summary.js";

/**
 * Record the table-side result of a Battle-shock roll. The app records the
 * outcome, not individual dice, and does not infer eligibility when strength is
 * unknown unless the player explicitly confirms the test is required.
 */
export function recordBattleShockTest(state, {
  unitId,
  result,
  eligibilityConfirmed = false
} = {}) {
  if (!unitId) throw new TypeError("A unit id is required for a Battle-shock test.");
  if (!["passed", "failed"].includes(result)) {
    throw new TypeError("Battle-shock result must be 'passed' or 'failed'.");
  }
  if (!state?.battle || state.battle.status !== "active") {
    throw new Error("Battle-shock tests can only be recorded during an active battle.");
  }
  if (state.phase !== "command") {
    throw new Error("Command-phase Battle-shock tests can only be recorded during the Command phase.");
  }

  const unit = (Array.isArray(state.units) ? state.units : []).find((item) => item.id === unitId);
  if (!unit) throw new Error("Battle-shock unit not found: " + unitId);
  const wasAlreadyBattleShocked = isUnitBattleShocked(unit);
  if (unit.status !== UNIT_STATUS.DEPLOYED &&
      !(unit.status === UNIT_STATUS.RESERVES && wasAlreadyBattleShocked)) {
    throw new Error("Battle-shock tests require a deployed unit, unless a unit in reserves is already Battle-shocked.");
  }
  const activePlayerId = state.activePlayer ?? state.battle.activePlayerId ?? null;
  if (!activePlayerId || unit.ownerId !== activePlayerId) {
    throw new Error("Only the active player's units can take a Command-phase Battle-shock test.");
  }

  const eligibility = getBattleShockEligibility(unit);
  if (eligibility.requiresTest === false) {
    throw new Error("This unit is not currently indicated as requiring a Battle-shock test.");
  }
  if (eligibility.requiresTest === null && eligibilityConfirmed !== true) {
    throw new Error("Confirm at the table that this unit is currently Battle-shocked or at/below half-strength.");
  }

  const round = state.battle.round ?? 0;
  const turn = state.turn ?? 0;
  const duplicate = (Array.isArray(state.history) ? state.history : []).some((event) =>
    event?.type === "battle_shock.test_recorded" &&
    event?.payload?.unitId === unitId &&
    event?.payload?.round === round &&
    event?.payload?.turn === turn
  );
  if (duplicate) {
    throw new Error("A Battle-shock result has already been recorded for this unit in the current turn.");
  }

  const battleShockedBefore = isUnitBattleShocked(unit);
  const battleShockedAfter = result === "failed";
  const unitAfter = {
    ...unit,
    battleShocked: battleShockedAfter,
    battleShockLastTest: {
      result,
      round,
      turn,
      phase: state.phase,
      eligibilityStatus: eligibility.status
    }
  };
  const event = createEvent("battle_shock.test_recorded", {
    unitId,
    playerId: unit.ownerId,
    result,
    battleShockedBefore,
    battleShockedAfter,
    eligibilityStatus: eligibility.status,
    eligibilityConfirmed: eligibility.requiresTest === null ? eligibilityConfirmed === true : false,
    round,
    turn,
    phase: state.phase
  });

  return appendHistoryEntry({
    ...state,
    units: state.units.map((item) => item.id === unitId ? unitAfter : item)
  }, event);
}
