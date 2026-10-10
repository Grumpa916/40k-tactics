import { recordVictoryPointsAward } from "./victory-points-ledger.js";
import {
  getSecondaryMissionHistory,
  recordSecondaryMissionScored,
  SECONDARY_MISSION_STATUS,
  SECONDARY_MISSION_MODES
} from "../rules/secondary-mission-lifecycle.js";

/**
 * Atomically records a player-confirmed secondary award and applies the
 * card's lifecycle rule: Tactical cards leave play after scoring; Fixed cards
 * remain active and can score again later.
 */
export function recordSecondaryMissionScore(state, {
  instanceId,
  playerId,
  amount,
  scoringTiming = null,
  round = state?.battle?.round ?? 0,
  turn = state?.turn ?? 0
} = {}) {
  if (typeof instanceId !== "string" || !instanceId.trim()) {
    throw new TypeError("A secondary mission instance id is required.");
  }
  const entry = getSecondaryMissionHistory(state, playerId).find((item) =>
    item.instanceId === instanceId && item.status === SECONDARY_MISSION_STATUS.ACTIVE);
  if (!entry) throw new Error("An active secondary mission for that player is required.");

  const missionMode = state?.scoring?.secondaryMissionMode ?? entry.definition?.missionMode;
  if (!Object.values(SECONDARY_MISSION_MODES).includes(missionMode)) {
    throw new Error("Set the battle-wide Fixed or Tactical mode before recording secondary scoring.");
  }

  const opportunityKey = [instanceId, round, turn].join(":");
  const awarded = recordVictoryPointsAward(state, {
    playerId,
    amount,
    reason: entry.definition?.name ?? entry.definitionId,
    missionDefinitionId: entry.definitionId,
    category: "secondary",
    missionMode,
    opportunityKey,
    scoringTiming,
    round,
    turn
  });
  const award = awarded.history?.at(-1)?.payload;
  return recordSecondaryMissionScored(awarded, {
    instanceId,
    playerId,
    round,
    turn,
    notes: "Confirmed " + (award?.amount ?? amount) + " VP"
  });
}
