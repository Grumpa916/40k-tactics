import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { useSecondaryMissionRedraw } from "../../src/engine/secondary-mission-redraw.js";
import {
  drawSecondaryMission,
  releaseSecondaryMissionSelection,
  setSecondaryMissionMode,
  getSecondaryMissionHistory,
  SECONDARY_MISSION_STATUS
} from "../../src/rules/secondary-mission-lifecycle.js";

const beacon = {
  id: "secondary-beacon",
  name: "Beacon",
  category: "secondary",
  availableModes: ["tactical"],
  scoringWindows: [{ timing: "end-of-turn", timingLabel: "End of your turn", modes: ["tactical"], tiers: [{ vp: "3/5" }] }]
};
const cleanse = {
  id: "secondary-cleanse",
  name: "Cleanse",
  category: "secondary",
  availableModes: ["tactical"],
  scoringWindows: [{ timing: "end-of-turn", timingLabel: "End of your turn", modes: ["tactical"], tiers: [{ vp: "2/5" }] }]
};

function battle() {
  const state = createGameState({
    phase: "command",
    turn: 1,
    activePlayer: "p1",
    battle: { id: "new-orders", status: "active", round: 1, firstPlayerId: "p1", activePlayerId: "p1" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    commandPoints: { p1: 2 }
  });
  return setSecondaryMissionMode(state, { playerId: "p1", mode: "tactical" });
}

test("New Orders discards the card and still lets Command and Cards record a replacement", () => {
  const drawn = drawSecondaryMission(battle(), { definition: beacon, playerId: "p1", round: 1, turn: 1 });
  const beaconCard = getSecondaryMissionHistory(drawn, "p1")[0];
  assert.equal(drawn.scoring.secondaryMissionCardChoicePendingByPlayer.p1.instanceId, beaconCard.instanceId);

  const redrawn = useSecondaryMissionRedraw(drawn, { playerId: "p1", instanceId: beaconCard.instanceId, round: 1, turn: 1 });
  assert.equal(redrawn.scoring.secondaryMissionCardChoicePendingByPlayer.p1, undefined);
  assert.equal(redrawn.scoring.secondaryMissionRedrawPendingByPlayer.p1.round, 1);
  assert.equal(getSecondaryMissionHistory(redrawn, "p1")[0].status, SECONDARY_MISSION_STATUS.DISCARDED);

  const replaced = drawSecondaryMission(redrawn, { definition: cleanse, playerId: "p1", round: 1, turn: 1 });
  const active = getSecondaryMissionHistory(replaced, "p1").filter((item) => item.status === SECONDARY_MISSION_STATUS.ACTIVE);
  assert.deepEqual(active.map((item) => item.definitionId), ["secondary-cleanse"]);
  assert.equal(active[0].isRedrawReplacement, true);
  assert.equal(replaced.scoring.secondaryMissionRedrawPendingByPlayer.p1, undefined);
});

test("Removing the New Orders replacement puts Command back to waiting for that card", () => {
  const drawn = drawSecondaryMission(battle(), { definition: beacon, playerId: "p1", round: 1, turn: 1 });
  const beaconCard = getSecondaryMissionHistory(drawn, "p1")[0];
  const redrawn = useSecondaryMissionRedraw(drawn, { playerId: "p1", instanceId: beaconCard.instanceId, round: 1, turn: 1 });
  const replaced = drawSecondaryMission(redrawn, { definition: cleanse, playerId: "p1", round: 1, turn: 1 });
  const replacement = getSecondaryMissionHistory(replaced, "p1").find((item) => item.status === SECONDARY_MISSION_STATUS.ACTIVE);

  const removed = releaseSecondaryMissionSelection(replaced, {
    playerId: "p1", instanceId: replacement.instanceId, round: 1, turn: 1
  });
  const active = getSecondaryMissionHistory(removed, "p1").filter((item) => item.status === SECONDARY_MISSION_STATUS.ACTIVE);
  assert.equal(active.length, 0);
  assert.deepEqual(removed.scoring.secondaryMissionRedrawPendingByPlayer.p1, { round: 1, turn: 1 });
});
