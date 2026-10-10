import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateScoringCheckpoint,
  SCORING_CHECKPOINTS
} from "../../src/engine/scoring-check-coordinator.js";

const base = {
  state: { scoring: {}, players: [] },
  primaryDefinitions: []
};

test("Command-phase review requires the scoring player to be active", () => {
  assert.throws(() => evaluateScoringCheckpoint(base.state, {
    checkpoint: SCORING_CHECKPOINTS.COMMAND_PHASE,
    scoringPlayerId: "player-1",
    activePlayerId: "player-2"
  }), /requires the scoring player to be the active player/);
});

test("end-of-turn review requires the scoring player to be active", () => {
  assert.throws(() => evaluateScoringCheckpoint(base.state, {
    checkpoint: SCORING_CHECKPOINTS.END_OF_TURN,
    scoringPlayerId: "player-1",
    activePlayerId: "player-2"
  }), /requires the scoring player to be the active player/);
});

test("aligned Command-phase and end-of-turn reviews remain advisory only", () => {
  for (const checkpoint of [
    SCORING_CHECKPOINTS.COMMAND_PHASE,
    SCORING_CHECKPOINTS.END_OF_TURN
  ]) {
    const review = evaluateScoringCheckpoint(base.state, {
      checkpoint,
      scoringPlayerId: "player-1",
      activePlayerId: "player-1"
    });
    assert.equal(review.scoringPlayerId, "player-1");
    assert.equal(review.activePlayerId, "player-1");
    assert.equal(review.requiresPlayerConfirmation, true);
    assert.equal(review.awardsVictoryPoints, false);
  }
});

test("end-of-opponent-turn review requires the opponent to be active", () => {
  assert.throws(() => evaluateScoringCheckpoint(base.state, {
    checkpoint: SCORING_CHECKPOINTS.END_OF_OPPONENT_TURN,
    scoringPlayerId: "player-1",
    activePlayerId: "player-1"
  }), /requires the opponent to be the active player/);
  assert.throws(() => evaluateScoringCheckpoint(base.state, {
    checkpoint: SCORING_CHECKPOINTS.END_OF_OPPONENT_TURN,
    scoringPlayerId: "player-1"
  }), /requires the opponent to be the active player/);
});

test("end-of-opponent-turn review permits the scoring player while opponent is active", () => {
  const review = evaluateScoringCheckpoint(base.state, {
    checkpoint: SCORING_CHECKPOINTS.END_OF_OPPONENT_TURN,
    scoringPlayerId: "player-1",
    activePlayerId: "player-2"
  });
  assert.equal(review.scoringPlayerId, "player-1");
  assert.equal(review.activePlayerId, "player-2");
  assert.equal(review.awardsVictoryPoints, false);
});

test("end-of-battle review can be checked for either player regardless of active player", () => {
  const review = evaluateScoringCheckpoint(base.state, {
    checkpoint: SCORING_CHECKPOINTS.END_OF_BATTLE,
    scoringPlayerId: "player-1",
    activePlayerId: "player-2"
  });
  assert.equal(review.checkpoint, SCORING_CHECKPOINTS.END_OF_BATTLE);
  assert.equal(review.awardsVictoryPoints, false);
});
