import test from "node:test";
import assert from "node:assert/strict";

import {
  EVENT_COMPANION_TERRAIN_PLACEMENT_GUIDES,
  getEventCompanionTerrainPlacementLines
} from "./event-companion-terrain-placement-guides.js";

const WIDTH = 60;
const HEIGHT = 44;

function onBattlefieldEdge(x, y) {
  return x === 0 || x === WIDTH || y === 0 || y === HEIGHT;
}

test("page 12 placement guides are edge-to-placement segments only", () => {
  const lines = getEventCompanionTerrainPlacementLines(12);
  assert.equal(lines.length, 18);

  for (const line of lines) {
    assert.equal(line.length, 4);
    assert.ok(line.every(Number.isFinite));
    const [x1, y1, x2, y2] = line;
    assert.ok(x1 >= 0 && x1 <= WIDTH && x2 >= 0 && x2 <= WIDTH);
    assert.ok(y1 >= 0 && y1 <= HEIGHT && y2 >= 0 && y2 <= HEIGHT);
    assert.notEqual(onBattlefieldEdge(x1, y1), onBattlefieldEdge(x2, y2));
  }
});

test("placement guide reads return copies and unknown pages stay empty", () => {
  const first = getEventCompanionTerrainPlacementLines(12);
  first[0][0] = 123;
  assert.equal(EVENT_COMPANION_TERRAIN_PLACEMENT_GUIDES["12"][0][0], 60);
  assert.deepEqual(getEventCompanionTerrainPlacementLines(999), []);
});
