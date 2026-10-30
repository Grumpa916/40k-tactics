import test from "node:test";
import assert from "node:assert/strict";
import { getGatherIntelObjectiveStrategySignal } from "../../src/rules/tactical-gather-intel-strategy.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

test("pending Gather Intel objective is not double-counted as a prospective third marker", () => {
  const state = {
    activePlayer: "p1",
    battle: { round: 2, activePlayerId: "p1" },
    players: [{ id: "p1" }, { id: "p2" }],
    battlefieldMap: { missionSetup: { myDisposition: "Reconnaissance", opponentDisposition: "Reconnaissance" } },
    objectives: [
      { id: "central-2", name: "Central 2", layoutObjective: "Central 2", control: control("p1") }
    ]
  };
  const primaryStrategy = {
    round: 2,
    playerHomeObjectiveIds: ["home-p1"],
    opponentHomeObjectiveIds: ["home-p2"],
    centralObjectiveIds: ["central-1", "central-2"],
    markerObjectiveIds: ["central-1"],
    pendingObjectiveIds: ["central-2"],
    eligibleExtractObjectiveIds: [],
    nonHomeControlled: 1,
    commandCheckpointCompleted: true,
    pendingExtractVpLeverage: 7,
    projectedMarkerCount: 2,
    projectedThreeMarkerThreshold: false,
    projectedOpponentHomeMarker: false,
    markerAtOpponentHome: false,
    markerCount: 1,
    additionalPrimaryAllowance: 15,
    remainingPrimaryGameVp: 45
  };

  const signal = getGatherIntelObjectiveStrategySignal(state, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "central-2",
    primaryStrategy
  });

  assert.equal(signal.pending, true);
  assert.equal(signal.endgameVpLeverage, 0);
});