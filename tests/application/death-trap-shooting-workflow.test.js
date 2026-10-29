import test from "node:test";
import assert from "node:assert/strict";
import { activateShootingUnit } from "../../src/application/shooting-workflow.js";

test("Booby Trap terrain selection survives the session shooting activation wrapper", () => {
  let dispatched = null;
  const session = {
    dispatch(command, context) {
      dispatched = { command, context };
      return command;
    }
  };

  activateShootingUnit(session, {
    unitId: "runner",
    actionType: "mission_action",
    actionId: "primary-death-trap",
    missionInstanceId: "primary:p1:primary-death-trap",
    terrainAreaId: "T5",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  });

  assert.equal(dispatched.command.payload.terrainAreaId, "T5");
  assert.equal(dispatched.command.payload.missionInstanceId, "primary:p1:primary-death-trap");
});

test("legacy shooting activation payload does not gain a terrainAreaId null field", () => {
  let command = null;
  const session = { dispatch(next) { command = next; return next; } };

  activateShootingUnit(session, { unitId: "runner", actionType: "shoot" });

  assert.equal(Object.prototype.hasOwnProperty.call(command.payload, "terrainAreaId"), false);
});
