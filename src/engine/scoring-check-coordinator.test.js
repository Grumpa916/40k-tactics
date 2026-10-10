import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "./game-state.js";
import { createMissionDefinition, SCORING_TIMINGS } from "../rules/mission-definition.js";
import { SCORING_EVIDENCE } from "../rules/scoring-eligibility.js";
import { drawSecondaryMission, recordSecondaryMissionScored, setSecondaryMissionMode } from "../rules/secondary-mission-lifecycle.js";
import { evaluateScoringCheckpoint, SCORING_CHECKPOINTS } from "./scoring-check-coordinator.js";

function definition(id, category, timing = SCORING_TIMINGS.END_OF_TURN) {
  return createMissionDefinition({
    id, name: id, category, timing,
    conditions: [{ evidence: SCORING_EVIDENCE.TURN_SNAPSHOT, args: { turn: 1 } }]
  });
}

test("selects only matching primary definitions and active secondary cards for the scoring player", () => {
  let state = createGameState({ players: [{ id: "p1" }, { id: "p2" }] });
  state = drawSecondaryMission(state, { definition: definition("sec-p1", "secondary"), playerId: "p1" });
  state = drawSecondaryMission(state, { definition: definition("sec-p2", "secondary"), playerId: "p2" });
  state = recordSecondaryMissionScored(state, { instanceId: "p1:sec-p1:0:0:1", playerId: "p1" });
  const result = evaluateScoringCheckpoint(state, {
    checkpoint: SCORING_CHECKPOINTS.END_OF_TURN,
    scoringPlayerId: "p1",
    activePlayerId: "p1",
    primaryDefinitions: [definition("primary-current", "primary"), definition("primary-command", "primary", SCORING_TIMINGS.COMMAND_PHASE)]
  });
  assert.deepEqual(result.primary.map((item) => item.definitionId), ["primary-current"]);
  assert.deepEqual(result.secondary, []);
  assert.equal(result.awardsVictoryPoints, false);
  assert.equal(result.requiresPlayerConfirmation, true);
});

test("includes eligible and ineligible candidates without changing game state", () => {
  const state = createGameState();
  const result = evaluateScoringCheckpoint(state, {
    checkpoint: SCORING_CHECKPOINTS.COMMAND_PHASE,
    scoringPlayerId: "p1",
    primaryDefinitions: [definition("primary-command", "primary", SCORING_TIMINGS.COMMAND_PHASE)]
  });
  assert.equal(result.primary.length, 1);
  assert.equal(typeof result.primary[0].result.eligible, "boolean");
  assert.equal(result.awardsVictoryPoints, false);
  assert.equal(state.history.length, 0);
  assert.equal(state.victoryPoints, undefined);
});

test("requires the opposing player to be active at the opponent-turn checkpoint", () => {
  assert.throws(() => evaluateScoringCheckpoint(createGameState(), {
    checkpoint: SCORING_CHECKPOINTS.END_OF_OPPONENT_TURN, scoringPlayerId: "p1", activePlayerId: "p1"
  }), /opponent to be the active player/);
  const result = evaluateScoringCheckpoint(createGameState(), {
    checkpoint: SCORING_CHECKPOINTS.END_OF_OPPONENT_TURN, scoringPlayerId: "p1", activePlayerId: "p2"
  });
  assert.equal(result.checkpoint, SCORING_CHECKPOINTS.END_OF_OPPONENT_TURN);
});

test("rejects unsupported checkpoints and malformed primary input", () => {
  assert.throws(() => evaluateScoringCheckpoint(createGameState(), { checkpoint: "after-movement", scoringPlayerId: "p1" }), /Unsupported scoring checkpoint/);
  assert.throws(() => evaluateScoringCheckpoint(createGameState(), { checkpoint: SCORING_CHECKPOINTS.END_OF_TURN, scoringPlayerId: "p1", primaryDefinitions: {} }), /must be an array/);
});


test("active secondary cards can expose separate own-turn and opponent-turn scoring windows", () => {
  const definitionWithWindows = {
    id: "assassination-sample",
    name: "Assassination",
    category: "secondary",
    timing: SCORING_TIMINGS.END_OF_TURN,
    conditions: [],
    rulesVerified: true,
    scoringWindows: [
      { id: "own-turn", timing: SCORING_TIMINGS.END_OF_TURN, modes: ["fixed"], tiers: [{ vp: 3, summary: "sample tier" }] },
      { id: "opponent-turn", timing: SCORING_TIMINGS.END_OF_OPPONENT_TURN, modes: ["fixed"], tiers: [{ vp: 3, summary: "sample tier" }] }
    ]
  };
  const state = drawSecondaryMission(createGameState({ players: [{ id: "p1" }, { id: "p2" }] }), {
    definition: definitionWithWindows,
    playerId: "p1",
    round: 1,
    turn: 1
  });

  const ownTurn = evaluateScoringCheckpoint(state, {
    checkpoint: SCORING_CHECKPOINTS.END_OF_TURN,
    scoringPlayerId: "p1",
    activePlayerId: "p1"
  });
  assert.equal(ownTurn.secondary.length, 1);
  assert.equal(ownTurn.secondary[0].result.manualReviewRequired, true);
  assert.equal(ownTurn.secondary[0].result.rulesVerified, true);
  assert.equal(ownTurn.secondary[0].result.scoringWindow.id, "own-turn");
  assert.equal(ownTurn.awardsVictoryPoints, false);

  const opponentTurn = evaluateScoringCheckpoint(state, {
    checkpoint: SCORING_CHECKPOINTS.END_OF_OPPONENT_TURN,
    scoringPlayerId: "p1",
    activePlayerId: "p2"
  });
  assert.equal(opponentTurn.secondary.length, 1);
  assert.equal(opponentTurn.secondary[0].result.scoringWindow.id, "opponent-turn");
  assert.equal(opponentTurn.secondary[0].result.scoringWindows[0].timing, SCORING_CHECKPOINTS.END_OF_OPPONENT_TURN);
  assert.equal(opponentTurn.awardsVictoryPoints, false);
});


test("secondary scoring references only the tiers for the battle-wide Fixed or Tactical mode", () => {
  const definitionWithBothModes = {
    id: "assassination-mode-test",
    name: "Assassination",
    category: "secondary",
    timing: SCORING_TIMINGS.END_OF_TURN,
    availableModes: ["fixed", "tactical"],
    conditions: [],
    rulesVerified: true,
    scoringWindows: [
      { id: "fixed-turn", timing: SCORING_TIMINGS.END_OF_TURN, modes: ["fixed"], tiers: [{ vp: 3, summary: "Fixed tier" }] },
      { id: "tactical-turn", timing: SCORING_TIMINGS.END_OF_TURN, modes: ["tactical"], tiers: [{ vp: 5, summary: "Tactical tier" }] },
      { id: "tactical-opponent", timing: SCORING_TIMINGS.END_OF_OPPONENT_TURN, modes: ["tactical"], tiers: [{ vp: 5, summary: "Tactical opponent tier" }] }
    ]
  };

  for (const mode of ["fixed", "tactical"]) {
    let state = createGameState({
      phase: "command", turn: 1, activePlayer: "p1",
      battle: { round: 1, activePlayerId: "p1" },
      players: [{ id: "p1" }, { id: "p2" }]
    });
    state = setSecondaryMissionMode(state, { mode });
    state = drawSecondaryMission(state, {
      definition: definitionWithBothModes, playerId: "p1", round: 1, turn: 1
    });
    const result = evaluateScoringCheckpoint(state, {
      checkpoint: SCORING_CHECKPOINTS.END_OF_TURN,
      scoringPlayerId: "p1",
      activePlayerId: "p1"
    });
    assert.equal(result.secondary.length, 1);
    assert.equal(result.secondary[0].result.scoringWindows.length, 1);
    assert.equal(result.secondary[0].result.scoringWindow.id, mode === "fixed" ? "fixed-turn" : "tactical-turn");
    assert.deepEqual(result.secondary[0].result.scoringWindows[0].modes, [mode]);
  }
});
