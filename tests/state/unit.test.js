import test from "node:test";
import assert from "node:assert/strict";
import { createUnit, UNIT_STATUS } from "../../src/state/unit.js";

test("creates a unit with stable default state", () => {
  assert.deepEqual(
    createUnit({ id: "u1", ownerId: "p1", name: "Test Unit" }),
    { id: "u1", ownerId: "p1", name: "Test Unit", status: UNIT_STATUS.RESERVES, wounds: null, position: null, metadata: {} }
  );
});
