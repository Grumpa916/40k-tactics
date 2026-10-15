import test from "node:test";
import assert from "node:assert/strict";

import {
  getEventCompanionTerrainPlacementPolicy,
  transformEventCompanionMirrorGuide,
  transformEventCompanionPlacement,
  transformEventCompanionSourceGuide
} from "../../src/rules/event-companion-terrain-placement-policy.js";

test("ordinary pages default to identity source placement", () => {
  const policy = getEventCompanionTerrainPlacementPolicy(17);
  assert.equal(policy.sourceTransform, "identity");
  assert.equal(policy.alignSourceToGeometry, false);
  assert.equal(policy.mirrorCounterparts, null);

  assert.deepEqual(
    transformEventCompanionPlacement([12, 9], "left", "identity"),
    { point: [12, 9], edge: "left" }
  );
});

test("a 180-degree transform always rotates point and battlefield edge together", () => {
  assert.deepEqual(
    transformEventCompanionPlacement([12, 9], "left", "rotate180"),
    { point: [48, 35], edge: "right" }
  );
  assert.deepEqual(
    transformEventCompanionPlacement([12, 9], "top", "rotate180"),
    { point: [48, 35], edge: "bottom" }
  );
});

test("Page 18 source policy preserves original PDF-frame edge metadata before rotation", () => {
  const transformed = transformEventCompanionSourceGuide(18, {
    value: '9"',
    edge: "left",
    sourceAnchor: [51.2, 22.25]
  });

  assert.deepEqual(transformed, {
    point: [8.8, 21.75],
    edge: "left"
  });
});

test("Page 18 mirror policy uses the same 180-degree transform for counterpart arrows", () => {
  const policy = getEventCompanionTerrainPlacementPolicy(18);
  assert.equal(policy.mirrorCounterparts?.terrainMap?.T3, "T15");
  assert.equal(policy.mirrorCounterparts?.targetInternalHalf, "right");

  assert.deepEqual(
    transformEventCompanionMirrorGuide(18, { anchor: [8.8, 21.8], edge: "left" }),
    { point: [51.2, 22.2], edge: "right" }
  );
});
