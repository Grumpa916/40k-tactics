import test from "node:test";
import assert from "node:assert/strict";
import { activateShootingUnit } from "../../src/application/shooting-workflow.js";

test("Surveil target selection survives the session shooting activation wrapper", () => {
  let dispatched = null;
  const session = {
    dispatch(command, context) {
      dispatched = { command, context };
      return command;
    }
  };

  activateShootingUnit(session, {
    unitId: "scout",
    actionType: "mission_action",
    actionId: "primary-surveil-the-foe",
    missionInstanceId: "primary:p1:primary-surveil-the-foe",
    targetUnitId: "enemy-open",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  });

  assert.equal(dispatched.command.payload.targetUnitId, "enemy-open");
  assert.equal(dispatched.command.payload.missionInstanceId, "primary:p1:primary-surveil-the-foe");
});

test("legacy shooting activation payload does not gain a targetUnitId null field", () => {
  let command = null;
  const session = { dispatch(next) { command = next; return next; } };

  activateShootingUnit(session, { unitId: "scout", actionType: "shoot" });

  assert.equal(Object.prototype.hasOwnProperty.call(command.payload, "targetUnitId"), false);
});
