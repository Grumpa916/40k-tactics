import test from "node:test";
import assert from "node:assert/strict";
import {
  OBJECTIVE_CONTROL_STATES,
  createObjectiveState,
  getObjectiveControl,
  getObjectiveControlForPlayer
} from "./objective-control-state.js";

test("creates an uncontrolled objective by default", () => {
  const objective = createObjectiveState({ id: "obj-1" });
  assert.equal(objective.controlState, OBJECTIVE_CONTROL_STATES.UNCONTROLLED);
  assert.equal(objective.controllerId, null);
});

test("records authoritative controller without using spatial context", () => {
  const objective = createObjectiveState({
    id: "obj-1",
    controllerId: "p1"
  });
  assert.equal(objective.controlState, OBJECTIVE_CONTROL_STATES.CONTROLLED);

  const state = { objectives: [{ id: "obj-1", control: objective }] };
  assert.equal(getObjectiveControl(state, "obj-1").controllerId, "p1");
  assert.equal(getObjectiveControlForPlayer(state, {
    playerId: "p1",
    objectiveId: "obj-1"
  }), "controlled");
  assert.equal(getObjectiveControlForPlayer(state, {
    playerId: "p2",
    objectiveId: "obj-1"
  }), "enemy-controlled");
});

test("supports authoritative contested state", () => {
  const objective = createObjectiveState({
    id: "obj-1",
    contestingPlayerIds: ["p1", "p2"]
  });
  assert.equal(objective.controlState, OBJECTIVE_CONTROL_STATES.CONTESTED);
  assert.equal(getObjectiveControlForPlayer(
    { objectives: [{ id: "obj-1", control: objective }] },
    { playerId: "p1", objectiveId: "obj-1" }
  ), "contested");
});

test("rejects invalid controlled and contested states", () => {
  assert.throws(() => createObjectiveState({
    id: "obj-1",
    controlState: OBJECTIVE_CONTROL_STATES.CONTROLLED
  }), /requires a controller/);

  assert.throws(() => createObjectiveState({
    id: "obj-1",
    controlState: OBJECTIVE_CONTROL_STATES.CONTESTED,
    contestingPlayerIds: ["p1"]
  }), /at least two/);
});
