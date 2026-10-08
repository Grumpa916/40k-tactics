import test from "node:test";
import assert from "node:assert/strict";
import { getSpatialContext } from "./spatial-context.js";

test("derives coarse unit proximity without exposing exact coordinates", () => {
  const state = {
    units: [
      { id: "my-unit", ownerId: "p1", status: "deployed", position: { x: 10, y: 10 } },
      { id: "near-enemy", ownerId: "p2", status: "deployed", position: { x: 16, y: 10 } },
      { id: "far-enemy", ownerId: "p2", status: "deployed", position: { x: 42, y: 10 } }
    ]
  };

  const result = getSpatialContext(state, { playerId: "p1" });

  assert.deepEqual(result.unitProximity, [
    { unitId: "my-unit", otherUnitId: "near-enemy", distance: 6, band: "close" },
    { unitId: "my-unit", otherUnitId: "far-enemy", distance: 33, band: "far" }
  ]);
  assert.deepEqual(result.units, [{ unitId: "my-unit", positionKnown: true }]);
  assert.equal(JSON.stringify(result).includes('"x":10'), false);
});

test("uses model centroid when unit position is not available", () => {
  const state = {
    units: [
      {
        id: "my-unit",
        ownerId: "p1",
        status: "deployed",
        models: [
          { id: "m1", position: { x: 10, y: 10 } },
          { id: "m2", position: { x: 16, y: 10 } }
        ]
      },
      { id: "enemy", ownerId: "p2", status: "deployed", position: { x: 22, y: 10 } }
    ]
  };

  const result = getSpatialContext(state, { playerId: "p1" });
  assert.deepEqual(result.unitProximity, [
    { unitId: "my-unit", otherUnitId: "enemy", distance: 9, band: "near" }
  ]);
});

test("does not infer missing objective positions or include destroyed units as threats", () => {
  const state = {
    units: [
      { id: "my-unit", ownerId: "p1", status: "deployed", position: { x: 10, y: 10 } },
      { id: "destroyed", ownerId: "p2", status: "destroyed", position: { x: 11, y: 10 } }
    ],
    objectives: [{ id: "objective-1" }]
  };

  const result = getSpatialContext(state, { playerId: "p1" });
  assert.deepEqual(result.objectiveProximity, []);
  assert.deepEqual(result.unitProximity, []);
});
