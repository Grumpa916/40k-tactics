import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../state/game-state.js";
import { SCORING_TIMINGS } from "../rules/mission-definition.js";
import {
  recordVictoryPointsAward,
  getVictoryPointScore,
  getVictoryPointHistory,
  undoLatestVictoryPointsAward,
  getLatestUndoableVictoryPointsAward
} from "./victory-points-ledger.js";

test("records a confirmed VP award and updates only that player's score", () => {
  const initial = createGameState({ turn: 2, battle: { round: 1 }, victoryPoints: { p1: 5, p2: 3 } });
  const next = recordVictoryPointsAward(initial, {
    playerId: "p1", amount: 4, reason: "Hold objective", turn: 2, round: 1
  });
  assert.equal(getVictoryPointScore(next, "p1"), 9);
  assert.equal(getVictoryPointScore(next, "p2"), 3);
  assert.deepEqual(getVictoryPointHistory(next, "p1"), [{
    playerId: "p1", amount: 4, reason: "Hold objective", turn: 2, round: 1,
    scoreBefore: 5, scoreAfter: 9
  }]);
  assert.equal(initial.victoryPoints.p1, 5);
  assert.equal(initial.history.length, 0);
  assert.equal(next.history.at(-1).type, "victory_points.awarded");
});

test("records VP awards for both players and filters history", () => {
  let state = createGameState();
  state = recordVictoryPointsAward(state, { playerId: "p1", amount: 3, reason: "Primary" });
  state = recordVictoryPointsAward(state, { playerId: "p2", amount: 5, reason: "Secondary" });
  assert.equal(getVictoryPointScore(state, "p1"), 3);
  assert.equal(getVictoryPointScore(state, "p2"), 5);
  assert.equal(getVictoryPointHistory(state).length, 2);
  assert.equal(getVictoryPointHistory(state, "p2")[0].reason, "Secondary");
});

test("rejects invalid awards and invalid round metadata", () => {
  const state = createGameState();
  assert.throws(() => recordVictoryPointsAward(state, { playerId: "p1", amount: 0, reason: "Primary" }), /positive integer/);
  assert.throws(() => recordVictoryPointsAward(state, { playerId: "p1", amount: -1, reason: "Primary" }), /positive integer/);
  assert.throws(() => recordVictoryPointsAward(state, { playerId: "p1", amount: 1.5, reason: "Primary" }), /positive integer/);
  assert.throws(() => recordVictoryPointsAward(state, { playerId: "p1", amount: 1, reason: "  " }), /reason is required/);
  assert.throws(() => recordVictoryPointsAward(state, { playerId: "p1", amount: 1, reason: "Primary", round: -1 }), /Round must be/);
});


test("undoes only the latest VP award and appends an auditable reversal", () => {
  let state = createGameState({ victoryPoints: { p1: 5, p2: 3 } });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 4, reason: "Hold objective",
    missionDefinitionId: "primary-1", category: "primary", opportunityKey: "round-1-end"
  });
  assert.equal(getLatestUndoableVictoryPointsAward(state, "p1").amount, 4);

  const undone = undoLatestVictoryPointsAward(state, {
    playerId: "p1", reason: "Entered the wrong amount", round: 1, turn: 2
  });
  assert.equal(getVictoryPointScore(undone, "p1"), 5);
  assert.equal(getVictoryPointScore(undone, "p2"), 3);
  assert.equal(undone.history.length, 2);
  assert.equal(undone.history[0].type, "victory_points.awarded");
  assert.equal(undone.history[1].type, "victory_points.award_undone");
  assert.equal(undone.history[1].payload.amount, 4);
  assert.equal(undone.history[1].payload.reason, "Entered the wrong amount");
  assert.equal(undone.history[1].payload.missionDefinitionId, "primary-1");
  assert.equal(getLatestUndoableVictoryPointsAward(undone, "p1"), null);
  assert.equal(state.victoryPoints.p1, 9);
});

test("refuses to undo when another history event followed the award", () => {
  let state = createGameState();
  state = recordVictoryPointsAward(state, { playerId: "p1", amount: 2, reason: "Primary" });
  state = { ...state, history: [...state.history, { type: "mission.scoring_event", payload: {} }] };
  assert.equal(getLatestUndoableVictoryPointsAward(state, "p1"), null);
  assert.throws(() => undoLatestVictoryPointsAward(state, { playerId: "p1" }), /Only the latest history event/);
  assert.equal(getVictoryPointScore(state, "p1"), 2);
});

test("refuses undo if current score does not match the award result", () => {
  let state = createGameState({ victoryPoints: { p1: 9 } });
  state = recordVictoryPointsAward(state, { playerId: "p1", amount: 4, reason: "Primary" });
  state = { ...state, victoryPoints: { ...state.victoryPoints, p1: 10 } };
  assert.equal(getLatestUndoableVictoryPointsAward(state, "p1"), null);
  assert.throws(() => undoLatestVictoryPointsAward(state, { playerId: "p1" }), /no longer matches/);
  assert.equal(getVictoryPointScore(state, "p1"), 10);
});

test("refuses undo when the latest VP award belongs to the other player", () => {
  let state = createGameState();
  state = recordVictoryPointsAward(state, { playerId: "p1", amount: 2, reason: "Primary" });
  state = recordVictoryPointsAward(state, { playerId: "p2", amount: 3, reason: "Secondary" });
  assert.equal(getLatestUndoableVictoryPointsAward(state, "p1"), null);
  assert.throws(() => undoLatestVictoryPointsAward(state, { playerId: "p1" }), /latest history event/);
});


test("caps primary scoring at 15 VP per turn and 45 VP per game", () => {
  let state = createGameState({ battle: { round: 1 }, turn: 1 });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 10, reason: "Primary A",
    category: "primary", missionDefinitionId: "primary-a", turn: 1, round: 1
  });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 10, reason: "Primary B",
    category: "primary", missionDefinitionId: "primary-b", turn: 1, round: 1
  });
  const cappedTurnAward = getVictoryPointHistory(state, "p1").at(-1);
  assert.equal(cappedTurnAward.amount, 5);
  assert.equal(cappedTurnAward.requestedAmount, 10);
  assert.deepEqual(cappedTurnAward.appliedCaps, ["primary-turn"]);
  assert.equal(getVictoryPointScore(state, "p1"), 15);

  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 15, reason: "Primary C",
    category: "primary", missionDefinitionId: "primary-c", turn: 2, round: 1
  });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 15, reason: "Primary D",
    category: "primary", missionDefinitionId: "primary-d", turn: 3, round: 2
  });
  assert.equal(getVictoryPointScore(state, "p1"), 45);
  assert.throws(() => recordVictoryPointsAward(state, {
    playerId: "p1", amount: 1, reason: "Primary E",
    category: "primary", missionDefinitionId: "primary-e", turn: 4, round: 2
  }), /45 VP primary game limit/);
});

test("enforces secondary per-turn and game caps independently of primary scoring", () => {
  let state = createGameState({ battle: { round: 1 }, turn: 1 });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 15, reason: "Primary",
    category: "primary", missionDefinitionId: "primary", turn: 1, round: 1
  });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 10, reason: "Secondary A",
    category: "secondary", missionDefinitionId: "secondary-a", turn: 1, round: 1
  });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 10, reason: "Secondary B",
    category: "secondary", missionDefinitionId: "secondary-b", turn: 1, round: 1
  });
  assert.equal(getVictoryPointHistory(state, "p1").at(-1).amount, 5);
  assert.equal(getVictoryPointScore(state, "p1"), 30);

  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 15, reason: "Secondary C",
    category: "secondary", missionDefinitionId: "secondary-c", turn: 2, round: 1
  });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 15, reason: "Secondary D",
    category: "secondary", missionDefinitionId: "secondary-d", turn: 3, round: 2
  });
  assert.equal(getVictoryPointHistory(state, "p1").filter((entry) => entry.category === "secondary")
    .reduce((sum, entry) => sum + entry.amount, 0), 45);
  assert.throws(() => recordVictoryPointsAward(state, {
    playerId: "p1", amount: 1, reason: "Secondary E",
    category: "secondary", missionDefinitionId: "secondary-e", turn: 4, round: 2
  }), /45 VP secondary game limit/);
});

test("caps a Fixed Secondary card at 20 VP across turns while allowing other cards", () => {
  let state = createGameState({ battle: { round: 1 }, turn: 1 });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 15, reason: "Fixed card",
    category: "secondary", missionMode: "fixed",
    missionDefinitionId: "fixed-assassination", turn: 1, round: 1
  });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 10, reason: "Fixed card again",
    category: "secondary", missionMode: "fixed",
    missionDefinitionId: "fixed-assassination", turn: 2, round: 1
  });
  const cardAwards = getVictoryPointHistory(state, "p1")
    .filter((entry) => entry.missionDefinitionId === "fixed-assassination");
  assert.deepEqual(cardAwards.map((entry) => entry.amount), [15, 5]);
  assert.deepEqual(cardAwards[1].appliedCaps, ["fixed-secondary-card"]);

  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 10, reason: "Different Fixed card",
    category: "secondary", missionMode: "fixed",
    missionDefinitionId: "fixed-bring-it-down", turn: 2, round: 1
  });
  assert.equal(getVictoryPointHistory(state, "p1")
    .filter((entry) => entry.missionDefinitionId === "fixed-bring-it-down")[0].amount, 10);
});

test("manual VP adjustments remain uncapped and do not consume mission limits", () => {
  let state = createGameState({ battle: { round: 1 }, turn: 1 });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 100, reason: "Manual correction", turn: 1, round: 1
  });
  assert.equal(getVictoryPointScore(state, "p1"), 100);
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 15, reason: "Primary mission",
    category: "primary", missionDefinitionId: "primary", turn: 1, round: 1
  });
  assert.equal(getVictoryPointScore(state, "p1"), 115);
});

test("undoing a mission award releases its cap capacity", () => {
  let state = createGameState({ battle: { round: 1 }, turn: 1 });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 15, reason: "Primary",
    category: "primary", missionDefinitionId: "primary-a", turn: 1, round: 1
  });
  state = undoLatestVictoryPointsAward(state, { playerId: "p1", turn: 1, round: 1 });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 15, reason: "Corrected primary",
    category: "primary", missionDefinitionId: "primary-b", turn: 1, round: 1
  });
  assert.equal(getVictoryPointScore(state, "p1"), 15);
});


test("end-of-battle VP bypasses the 15 VP per-turn cap but retains the 45 VP game cap", () => {
  let state = createGameState({ battle: { round: 5 }, turn: 10 });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 10, reason: "Primary during turn",
    category: "primary", missionDefinitionId: "primary-a", turn: 10, round: 5
  });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 10, reason: "Primary at end of battle",
    category: "primary", missionDefinitionId: "primary-b",
    scoringTiming: SCORING_TIMINGS.END_OF_BATTLE, turn: 10, round: 5
  });

  const finalAward = getVictoryPointHistory(state, "p1").at(-1);
  assert.equal(finalAward.amount, 10);
  assert.equal(finalAward.scoringTiming, SCORING_TIMINGS.END_OF_BATTLE);
  assert.equal(finalAward.appliedCaps, undefined);
  assert.equal(getVictoryPointScore(state, "p1"), 20);

  state = createGameState({ battle: { round: 3 }, turn: 3 });
  for (const [turn, round, id] of [[1, 1, "a"], [2, 2, "b"], [3, 3, "c"]]) {
    state = recordVictoryPointsAward(state, {
      playerId: "p1", amount: 15, reason: "Primary " + id,
      category: "primary", missionDefinitionId: "primary-" + id, turn, round
    });
  }
  assert.throws(() => recordVictoryPointsAward(state, {
    playerId: "p1", amount: 1, reason: "End-of-battle primary",
    category: "primary", missionDefinitionId: "primary-final",
    scoringTiming: SCORING_TIMINGS.END_OF_BATTLE, turn: 4, round: 3
  }), /45 VP primary game limit/);
});

test("end-of-battle timing does not bypass the 20 VP Fixed Secondary card cap", () => {
  let state = createGameState({ battle: { round: 5 }, turn: 10 });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 15, reason: "Fixed card first award",
    category: "secondary", missionMode: "fixed",
    missionDefinitionId: "fixed-card", turn: 1, round: 1
  });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 10, reason: "Fixed card at end of battle",
    category: "secondary", missionMode: "fixed",
    missionDefinitionId: "fixed-card",
    scoringTiming: SCORING_TIMINGS.END_OF_BATTLE, turn: 10, round: 5
  });
  const cardAwards = getVictoryPointHistory(state, "p1")
    .filter((entry) => entry.missionDefinitionId === "fixed-card");
  assert.deepEqual(cardAwards.map((entry) => entry.amount), [15, 5]);
  assert.deepEqual(cardAwards[1].appliedCaps, ["fixed-secondary-card"]);
});

test("rejects an unsupported scoring timing", () => {
  assert.throws(() => recordVictoryPointsAward(createGameState(), {
    playerId: "p1", amount: 1, reason: "Primary", scoringTiming: "after-battle"
  }), /Unsupported scoring timing/);
});
