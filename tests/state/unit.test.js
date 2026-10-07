import test from "node:test";
import assert from "node:assert/strict";
import { createUnit, UNIT_STATUS } from "../../src/state/unit.js";

test("creates a unit with stable default state", () => {
  assert.deepEqual(
    createUnit({ id: "u1", ownerId: "p1", name: "Test Unit" }),
    {
      id: "u1",
      ownerId: "p1",
      name: "Test Unit",
      status: UNIT_STATUS.RESERVES,
      wounds: null,
      position: null,
      models: [],
      profile: null,
      metadata: {}
    }
  );
});

test("stores model positions and the unit profile", () => {
  const profile = { characteristics: { movement: "6" } };
  const models = [{ id: "m1", position: { x: 1, y: 2 } }];
  const unit = createUnit({ id: "u1", ownerId: "p1", name: "Test Unit", profile, models });
  assert.equal(unit.profile, profile);
  assert.deepEqual(unit.models, models);
});
