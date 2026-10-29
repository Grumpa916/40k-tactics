import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("both shooting activation application wrappers forward terrainAreaId into the command payload", () => {
  const source = readFileSync(new URL("../../src/application/shooting-workflow.js", import.meta.url), "utf8");
  const terrainMentions = source.match(/terrainAreaId/g) ?? [];
  assert.ok(terrainMentions.length >= 4, "terrainAreaId should appear in both wrapper parameters and both command payloads");
  assert.match(source, /recordShootingActivation[\s\S]*?terrainAreaId = null[\s\S]*?createCommand\(COMMAND_TYPES\.RECORD_SHOOTING_ACTIVATION,[\s\S]*?terrainAreaId/);
  assert.match(source, /activateShootingUnit[\s\S]*?terrainAreaId = null[\s\S]*?createCommand\(COMMAND_TYPES\.RECORD_SHOOTING_ACTIVATION,[\s\S]*?terrainAreaId/);
});
