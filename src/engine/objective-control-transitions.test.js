import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "./game-state.js";
import { createPlayer } from "../state/player.js";
import { recordObjectiveControl } from "./state-transitions.js";
import { OBJECTIVE_CONTROL_STATES } from "../rules/objective-control-state.js";

function state() {
  return createGameState({
    players: [
      createPlayer({ id: "p1", name: "Player 1" }),
      createPlayer({ id: "p2", name: "Player 2" })
    ],
    objectives: [{ id: "obj-1", position: { x: 12, y: 12 } }]
  });
}

test("records authoritative objective control and emits history", () => {
  const next = recordObjectiveControl(state(), {
    objectiveId: "obj-1",
    controllerId: "p1"
  });

  assert.equal(next.objectives[0].control.controlState, OBJECTIVE_CONTROL_STATES.CONTROLLED);
  assert.equal(next.objectives[0].control.controllerId, "p1");
  assert.equal(next.history.at(-1).type, "objective.control_recorded");
});

test("records contested objective state without deriving it from position", () => {
  const next = recordObjectiveControl(state(), {
    objectiveId: "obj-1",
    contestingPlayerIds: ["p1", "p2"]
  });

  assert.equal(next.objectives[0].control.controlState, OBJECTIVE_CONTROL_STATES.CONTESTED);
  assert.deepEqual(next.objectives[0].control.contestingPlayerIds, ["p1", "p2"]);
});

test("rejects unknown objectives", () => {
  assert.throws(() => recordObjectiveControl(state(), {
    objectiveId: "missing",
    controllerId: "p1"
  }), /Objective not found/);
});
