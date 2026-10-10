import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { getCommandPointBalance, recordCommandPointChange } from "./command-points-ledger.js";
import {
  discardSecondaryMission,
  getSecondaryMissionHistory,
  SECONDARY_MISSION_MODES,
  SECONDARY_MISSION_STATUS
} from "../rules/secondary-mission-lifecycle.js";

/** Apply the once-per-player-per-battle New Orders redraw without drawing randomly. */
export function useSecondaryMissionRedraw(state, {
  playerId,
  instanceId,
  round = state?.battle?.round ?? 0,
  turn = state?.turn ?? 0
} = {}) {
  if (state?.phase !== "command") {
    throw new Error("New Orders can only be used during the Command phase.");
  }
  if (state?.scoring?.secondaryMissionMode !== SECONDARY_MISSION_MODES.TACTICAL) {
    throw new Error("New Orders is available only when using Tactical secondary missions.");
  }
  const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId;
  if (!playerId || playerId !== activePlayerId) {
    throw new Error("Only the active player can use New Orders during their Command phase.");
  }

  const used = state.scoring?.secondaryMissionRedrawUsedByPlayer ?? {};
  if (used[playerId]) throw new Error("New Orders has already been used by this player in this battle.");
  const pending = state.scoring?.secondaryMissionRedrawPendingByPlayer ?? {};
  if (pending[playerId]) throw new Error("A New Orders replacement card is still pending.");

  const entry = getSecondaryMissionHistory(state, playerId).find((item) =>
    item.instanceId === instanceId && item.status === SECONDARY_MISSION_STATUS.ACTIVE);
  if (!entry) throw new Error("Select one of your active Tactical secondary cards.");
  if (getCommandPointBalance(state, playerId) < 1) {
    throw new Error("New Orders costs 1 CP; this player does not have enough Command Points.");
  }

  const spent = recordCommandPointChange(state, {
    playerId,
    amount: -1,
    reason: "spend",
    note: "New Orders: discard and replace a Tactical secondary",
    round,
    turn
  });
  const discarded = discardSecondaryMission(spent, { instanceId, playerId, round, turn });
  const updated = {
    ...discarded,
    scoring: {
      ...discarded.scoring,
      secondaryMissionRedrawUsedByPlayer: { ...used, [playerId]: true },
      secondaryMissionRedrawPendingByPlayer: { ...pending, [playerId]: { round, turn } }
    }
  };
  return appendHistoryEntry(updated, createEvent("secondary_mission.redraw_used", {
    playerId, instanceId, round, turn, commandPointsSpent: 1
  }));
}
