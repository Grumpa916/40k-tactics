import test from "node:test";
import assert from "node:assert/strict";
import { createCommand } from "../../src/commands/command.js";

test("creates an explicit command envelope", () => {
  assert.deepEqual(
    createCommand("MOVE_UNIT", { unitId: "u1", distance: 5 }, { source: "ui" }),
    {
      type: "MOVE_UNIT",
      payload: { unitId: "u1", distance: 5 },
      metadata: { source: "ui" }
    }
  );
});
