import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "./game-state.js";
import { createPlayer, PLAYER_ROLES } from "../state/player.js";
import {
  captureTurnStartSnapshot,
  recordMissionScoringEvent
} from "./scoring-transitions.js";

function state() {
  return createGameState({
    players: [
      createPlayer({ id: "p1", name: "Player 1", role: PLAYER_ROLES.PLAYER_ONE }),
      createPlayer({ id: "p2", name: "Player 2", role: PLAYER_ROLES.PLAYER_TWO })
    ],
    units: [{ id: "u1", ownerId: "p1", name: "Unit 1", status: "deployed", wounds: 5 }],
    objectives: [{ id: "obj-1" }]
  });
}

test("captures a turn-start snapshot and records it in history", () => {
  const next = captureTurnStartSnapshot(state(), { turn: 1, round: 1, playerId: "p1" });
  assert.equal(next.scoring.turnSnapshots.length, 1);
  assert.equal(next.scoring.turnSnapshots[0].turn, 1);
  assert.equal(next.history.at(-1).type, "scoring.turn_snapshot_captured");
});

test("replaces a duplicate snapshot for the same turn", () => {
  const first = captureTurnStartSnapshot(state(), { turn: 1, round: 1, playerId: "p1" });
  const second = captureTurnStartSnapshot(first, { turn: 1, round: 1, playerId: "p1" });
  assert.equal(second.scoring.turnSnapshots.length, 1);
});

test("records a generic mission scoring event without awarding points", () => {
  const next = recordMissionScoringEvent(state(), {
    eventType: "surveil.completed",
    objectiveId: "obj-1",
    details: { completed: true }
  });
  assert.equal(next.history.at(-1).type, "mission.scoring_event");
  assert.equal(next.history.at(-1).payload.eventType, "surveil.completed");
});
