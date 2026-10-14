import test from "node:test";
import assert from "node:assert/strict";

import {
  battlefieldEdgeEndpoint,
  nearestClearTerrainVertex,
  segmentCrossesTerrainInterior
} from "../../src/data/terrain-guide-geometry.js";

const SQUARE = {
  points: [
    { x: 2, y: 2 },
    { x: 4, y: 2 },
    { x: 4, y: 4 },
    { x: 2, y: 4 }
  ]
};

test("terrain guide crossing detection distinguishes inward and outward rays", () => {
  assert.equal(segmentCrossesTerrainInterior([2, 2], [0, 2], SQUARE), false);
  assert.equal(segmentCrossesTerrainInterior([4, 2], [0, 2], SQUARE), true);
  assert.equal(segmentCrossesTerrainInterior([4, 4], [60, 4], SQUARE), false);
  assert.equal(segmentCrossesTerrainInterior([4, 2], [4, 44], SQUARE), true);
});

test("nearest clear terrain vertex preserves the official edge while avoiding the footprint", () => {
  const leftAnchor = nearestClearTerrainVertex([4.05, 2.05], SQUARE, "left");
  assert.deepEqual(leftAnchor, [2, 2]);
  assert.equal(
    segmentCrossesTerrainInterior(leftAnchor, battlefieldEdgeEndpoint(leftAnchor, "left"), SQUARE),
    false
  );

  const topAnchor = nearestClearTerrainVertex([4.05, 2.05], SQUARE, "top");
  assert.deepEqual(topAnchor, [4, 4]);
  assert.equal(
    segmentCrossesTerrainInterior(topAnchor, battlefieldEdgeEndpoint(topAnchor, "top"), SQUARE),
    false
  );
});
