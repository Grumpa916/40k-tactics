import { recordVictoryPointsAward } from "./victory-points-ledger.js";
import {
  getSecondaryMissionHistory,
  getSecondaryMissionMode,
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
  retireAfterScoring = false,
  round = state?.battle?.round ?? 0,
  turn = state?.turn ?? 0
} = {}) {
  if (typeof instanceId !== "string" || !instanceId.trim()) {
    throw new TypeError("A secondary mission instance id is required.");
  }
  const entry = getSecondaryMissionHistory(state, playerId).find((item) =>
    item.instanceId === instanceId && item.status === SECONDARY_MISSION_STATUS.ACTIVE);
  if (!entry) throw new Error("An active secondary mission for that player is required.");

  const missionMode = getSecondaryMissionMode(state, playerId) ?? entry.definition?.missionMode;
  if (!Object.values(SECONDARY_MISSION_MODES).includes(missionMode)) {
    throw new Error("Set this player's Fixed or Tactical mode before recording secondary scoring.");
  }

  const opportunityKey = [instanceId, round, turn, ...(scoringTiming ? [scoringTiming] : [])].join(":");
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
  // Keep the prior card with the award so undo restores both VP and lifecycle.
  const awardEvent = awarded.history.at(-1);
  const reversibleAward = { ...awarded, history: [...awarded.history.slice(0,-1),
    { ...awardEvent, payload: { ...awardEvent.payload, secondaryMissionBefore: entry } }] };
  const award = awardEvent.payload;
  return recordSecondaryMissionScored(reversibleAward, {
    instanceId,
    playerId,
    round,
    turn,
    retireAfterScoring,
    notes: "Confirmed " + (award?.amount ?? amount) + " VP"
  });
}
