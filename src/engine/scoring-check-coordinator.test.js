import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "./game-state.js";
import { createMissionDefinition, SCORING_TIMINGS } from "../rules/mission-definition.js";
import { SCORING_EVIDENCE } from "../rules/scoring-eligibility.js";
import { drawSecondaryMission, recordSecondaryMissionScored, setSecondaryMissionMode } from "../rules/secondary-mission-lifecycle.js";
import { evaluateScoringCheckpoint, SCORING_CHECKPOINTS } from "./scoring-check-coordinator.js";
import { SECONDARY_MISSION_CATALOG } from "../data/secondary-mission-catalog.js";

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


test("draft secondary windows are shown for manual review and never marked verified or auto-awarded", () => {
  let state = createGameState({
    phase: "command",
    activePlayer: "p1",
    players: [{ id: "p1" }, { id: "p2" }],
    battle: { round: 1, activePlayerId: "p1" }
  });
  state = setSecondaryMissionMode(state, { mode: "tactical" });
  const draftCard = SECONDARY_MISSION_CATALOG.find((card) => card.name === "A Grievous Blow");
  state = drawSecondaryMission(state, {
    definition: draftCard,
    playerId: "p1",
    round: 1,
    turn: 1
  });

  const result = evaluateScoringCheckpoint(state, {
    checkpoint: SCORING_CHECKPOINTS.END_OF_TURN,
    scoringPlayerId: "p1",
    activePlayerId: "p1"
  });
  assert.equal(result.secondary.length, 1);
  assert.equal(result.secondary[0].result.manualReviewRequired, true);
  assert.equal(result.secondary[0].result.rulesVerified, false);
  assert.equal(result.secondary[0].result.scoringWindow.source,
    "community-transcription-pending-official-card-check");
  assert.ok(result.secondary[0].result.referenceNotes.length > 0);
  assert.match(result.secondary[0].result.referenceNotes[0], /When drawn/);
  assert.equal(result.awardsVictoryPoints, false);
});


test("minimum-round metadata hides Defend Stronghold before round two", () => {
  let state = createGameState({
    phase: "command",
    activePlayer: "p1",
    players: [{ id: "p1" }, { id: "p2" }],
    battle: { round: 1, activePlayerId: "p1" }
  });
  state = setSecondaryMissionMode(state, { mode: "tactical" });
  const card = SECONDARY_MISSION_CATALOG.find((item) => item.name === "Defend Stronghold");
  state = drawSecondaryMission(state, { definition: card, playerId: "p1", round: 1, turn: 1 });

  const roundOne = evaluateScoringCheckpoint(state, {
    checkpoint: SCORING_CHECKPOINTS.END_OF_OPPONENT_TURN,
    scoringPlayerId: "p1",
    activePlayerId: "p2"
  });
  assert.equal(roundOne.secondary.length, 0);

  state = { ...state, battle: { ...state.battle, round: 2 } };
  const roundTwo = evaluateScoringCheckpoint(state, {
    checkpoint: SCORING_CHECKPOINTS.END_OF_OPPONENT_TURN,
    scoringPlayerId: "p1",
    activePlayerId: "p2"
  });
  assert.equal(roundTwo.secondary.length, 1);
  assert.equal(roundTwo.secondary[0].result.scoringWindow.minRound, 2);
  assert.equal(roundTwo.secondary[0].result.rulesVerified, false);
  assert.equal(roundTwo.awardsVictoryPoints, false);
});


test("every unverified secondary card stays manual-review-only at every declared scoring window", () => {
  const unverifiedCards = SECONDARY_MISSION_CATALOG.filter((card) => !card.rulesVerified);
  assert.equal(unverifiedCards.length, 16);

  for (const card of unverifiedCards) {
    assert.ok(card.scoringWindows.length > 0, card.name + " should retain its draft scoring windows");
    for (const window of card.scoringWindows) {
      const modes = window.modes?.length ? window.modes : card.availableModes;
      for (const mode of modes) {
        const round = Math.max(1, window.minRound ?? 1);
        const checkpoint = window.timing;
        const activePlayerId = checkpoint === SCORING_CHECKPOINTS.END_OF_OPPONENT_TURN ? "p2" : "p1";
        let state = createGameState({
          phase: "command",
          turn: 1,
          activePlayer: activePlayerId,
          players: [{ id: "p1" }, { id: "p2" }],
          battle: { round, activePlayerId }
        });
        state = setSecondaryMissionMode(state, { mode });
        state = drawSecondaryMission(state, {
          definition: card,
          playerId: "p1",
          round,
          turn: 1
        });

        const review = evaluateScoringCheckpoint(state, {
          checkpoint,
          scoringPlayerId: "p1",
          activePlayerId
        });
        const candidate = review.secondary.find((item) => item.definitionId === card.id);
        assert.ok(candidate, card.name + " should appear at " + checkpoint + " in " + mode + " mode");
        assert.equal(candidate.result.eligible, false, card.name + " must not infer eligibility");
        assert.equal(candidate.result.manualReviewRequired, true, card.name + " must require table-side review");
        assert.equal(candidate.result.rulesVerified, false, card.name + " must remain unverified");
        assert.equal(candidate.result.scoringWindow.source,
          "community-transcription-pending-official-card-check");
        assert.equal(review.awardsVictoryPoints, false);
      }
    }
  }
});
