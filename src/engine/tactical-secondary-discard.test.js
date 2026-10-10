import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../state/game-state.js";
import { setSecondaryMissionMode, drawSecondaryMission, getSecondaryMissionHistory } from "../rules/secondary-mission-lifecycle.js";
import { getCommandPointBalance } from "./command-points-ledger.js";
import { discardTacticalSecondariesForCommandPoint } from "./tactical-secondary-discard.js";

function setup(mode = "tactical") {
  let state = createGameState({
    phase: "command", turn: 1, activePlayer: "p1",
    battle: { round: 1, activePlayerId: "p1" },
    commandPoints: { p1: 0 }
  });
  state = setSecondaryMissionMode(state, { mode });
  for (const id of ["card-a", "card-b"]) {
    state = drawSecondaryMission(state, {
      playerId: "p1", round: 1, turn: 1,
      definition: {
        id, name: id, category: "secondary",
        availableModes: [mode], fixedAvailable: mode === "fixed",
        timing: "end-of-turn", conditions: []
      }
    });
  }
  return { ...state, phase: "end_turn" };
}

test("discarding one or more Tactical cards at end of own turn grants exactly 1 CP", () => {
  let state = setup();
  const cards = getSecondaryMissionHistory(state, "p1");
  state = discardTacticalSecondariesForCommandPoint(state, {
    playerId: "p1",
    instanceIds: cards.map((card) => card.instanceId),
    round: 1,
    turn: 1
  });
  assert.equal(getCommandPointBalance(state, "p1"), 1);
  assert.deepEqual(getSecondaryMissionHistory(state, "p1").map((card) => card.status), ["discarded", "discarded"]);
  assert.equal(state.history.at(-2).type, "command_points.changed");
  assert.equal(state.history.at(-2).payload.amount, 1);
  assert.equal(state.history.at(-1).type, "secondary_mission.discarded_for_cp");
  assert.equal(state.history.at(-1).payload.commandPointsGained, 1);
});

test("discard-for-CP requires own end turn, Tactical mode, and active owned cards", () => {
  let state = setup();
  const card = getSecondaryMissionHistory(state, "p1")[0];
  assert.throws(() => discardTacticalSecondariesForCommandPoint({ ...state, phase: "command" }, {
    playerId: "p1", instanceIds: [card.instanceId]
  }), /only at the end of a turn/);
  assert.throws(() => discardTacticalSecondariesForCommandPoint(state, {
    playerId: "p2", instanceIds: [card.instanceId]
  }), /Only the active player/);
  assert.throws(() => discardTacticalSecondariesForCommandPoint(state, {
    playerId: "p1", instanceIds: []
  }), /Select at least one/);
  assert.throws(() => discardTacticalSecondariesForCommandPoint(state, {
    playerId: "p1", instanceIds: [card.instanceId, card.instanceId]
  }), /only be selected once/);
  assert.throws(() => discardTacticalSecondariesForCommandPoint(state, {
    playerId: "p1", instanceIds: ["missing"]
  }), /Every selected card/);
});

test("Fixed secondary cards cannot be discarded for CP", () => {
  const state = setup("fixed");
  const card = getSecondaryMissionHistory(state, "p1")[0];
  assert.throws(() => discardTacticalSecondariesForCommandPoint(state, {
    playerId: "p1", instanceIds: [card.instanceId]
  }), /only to Tactical/);
});
