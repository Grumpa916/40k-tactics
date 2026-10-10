import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { recordCommandPointChange } from "./command-points-ledger.js";
import {
  discardSecondaryMission,
  getSecondaryMissionHistory,
  SECONDARY_MISSION_MODES,
  SECONDARY_MISSION_STATUS
} from "../rules/secondary-mission-lifecycle.js";

/** Discard one or more active Tactical cards at the end of your own turn for +1 CP. */
export function discardTacticalSecondariesForCommandPoint(state, {
  playerId,
  instanceIds,
  round = state?.battle?.round ?? 0,
  turn = state?.turn ?? 0
} = {}) {
  if (state?.phase !== "end_turn") {
    throw new Error("Tactical secondary discards for CP are available only at the end of a turn.");
  }
  if (state?.scoring?.secondaryMissionMode !== SECONDARY_MISSION_MODES.TACTICAL) {
    throw new Error("This discard-for-CP rule applies only to Tactical secondary missions.");
  }
  const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId;
  if (!playerId || playerId !== activePlayerId) {
    throw new Error("Only the active player can discard Tactical secondaries for CP on their turn.");
  }
  if (!Array.isArray(instanceIds) || instanceIds.length === 0) {
    throw new TypeError("Select at least one active Tactical secondary card to discard.");
  }
  if (new Set(instanceIds).size !== instanceIds.length) {
    throw new Error("A Tactical secondary card can only be selected once.");
  }

  const active = getSecondaryMissionHistory(state, playerId);
  for (const instanceId of instanceIds) {
    const entry = active.find((item) =>
      item.instanceId === instanceId && item.status === SECONDARY_MISSION_STATUS.ACTIVE);
    if (!entry) throw new Error("Every selected card must be one of your active Tactical secondaries.");
    if (entry.definition?.missionMode !== SECONDARY_MISSION_MODES.TACTICAL) {
      throw new Error("Fixed secondary cards cannot be discarded for CP.");
    }
  }

  let next = state;
  for (const instanceId of instanceIds) {
    next = discardSecondaryMission(next, { instanceId, playerId, round, turn });
  }
  next = recordCommandPointChange(next, {
    playerId,
    amount: 1,
    reason: "gain",
    note: "Discarded " + instanceIds.length + " Tactical secondary card(s) at end of turn",
    round,
    turn
  });
  return appendHistoryEntry(next, createEvent("secondary_mission.discarded_for_cp", {
    playerId, instanceIds: [...instanceIds], round, turn, commandPointsGained: 1
  }));
}
