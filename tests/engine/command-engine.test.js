import test from "node:test";
import assert from "node:assert/strict";
import {
  registerCommandHandler,
  executeCommand,
  clearCommandHandlers
} from "../../src/engine/command-engine.js";

test.afterEach(() => clearCommandHandlers());

test("routes a command to its registered handler", () => {
  registerCommandHandler("TEST_COMMAND", (state, command) => ({
    ...state,
    handled: command.payload
  }));
  const result = executeCommand(
    { phase: "setup" },
    { type: "TEST_COMMAND", payload: { value: 42 } }
  );
  assert.deepEqual(result, {
    phase: "setup",
    handled: { value: 42 }
  });
});

test("rejects unknown commands", () => {
  assert.throws(
    () => executeCommand({}, { type: "UNKNOWN" }),
    /No command handler registered/
  );
});
