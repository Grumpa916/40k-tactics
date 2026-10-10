import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../state/game-state.js";
import { drawSecondaryMission, getSecondaryMissionHistory, setSecondaryMissionMode } from "../rules/secondary-mission-lifecycle.js";
import { recordSecondaryMissionScore } from "./secondary-mission-scoring.js";
import { getVictoryPointScore } from "./victory-points-ledger.js";

function setup(mode = "tactical") {
  let state = createGameState({
    phase: "command",
    turn: 1,
    activePlayer: "p1",
    battle: { round: 1, activePlayerId: "p1" }
  });
  state = setSecondaryMissionMode(state, { mode });
  state = drawSecondaryMission(state, {
    playerId: "p1",
    round: 1,
    turn: 1,
    definition: {
      id: "secondary-sample",
      name: "Sample secondary",
      category: "secondary",
      availableModes: ["fixed", "tactical"],
      fixedAvailable: true,
      timing: "end-of-turn",
      conditions: []
    }
  });
  return state;
}

test("scoring a Tactical secondary atomically awards VP and removes the card from active play", () => {
  const initial = setup("tactical");
  const card = getSecondaryMissionHistory(initial, "p1")[0];
  const next = recordSecondaryMissionScore(initial, {
    instanceId: card.instanceId,
    playerId: "p1",
    amount: 4,
    round: 1,
    turn: 1
  });
  assert.equal(getVictoryPointScore(next, "p1"), 4);
  assert.equal(getSecondaryMissionHistory(next, "p1")[0].status, "scored");
  assert.deepEqual(getSecondaryMissionHistory(next, "p1")[0].scoringHistory, [
    { round: 1, turn: 1, notes: "Confirmed 4 VP" }
  ]);
});

test("scoring a Fixed secondary keeps it active and enforces its 20 VP card cap across turns", () => {
  let state = setup("fixed");
  let card = getSecondaryMissionHistory(state, "p1")[0];
  state = recordSecondaryMissionScore(state, {
    instanceId: card.instanceId, playerId: "p1", amount: 15, round: 1, turn: 1
  });
  assert.equal(getSecondaryMissionHistory(state, "p1")[0].status, "active");
  state = { ...state, turn: 2 };
  state = recordSecondaryMissionScore(state, {
    instanceId: card.instanceId, playerId: "p1", amount: 10, round: 1, turn: 2
  });
  assert.equal(getVictoryPointScore(state, "p1"), 20);
  const history = getSecondaryMissionHistory(state, "p1")[0];
  assert.equal(history.status, "active");
  assert.equal(history.scoringHistory.length, 2);
  assert.equal(state.history.at(-1).payload.amount, 5);
  assert.deepEqual(state.history.at(-1).payload.appliedCaps, ["fixed-secondary-card"]);
});

test("failed secondary scoring does not change the card lifecycle", () => {
  let state = setup("tactical");
  const card = getSecondaryMissionHistory(state, "p1")[0];
  state = { ...state, victoryPoints: { p1: 45 } };
  assert.throws(() => recordSecondaryMissionScore(state, {
    instanceId: card.instanceId, playerId: "p1", amount: 3, round: 1, turn: 1
  }), /45 VP secondary game limit/);
  assert.equal(getSecondaryMissionHistory(state, "p1")[0].status, "active");
});
