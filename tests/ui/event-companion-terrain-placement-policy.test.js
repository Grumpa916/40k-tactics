import test from "node:test";
import assert from "node:assert/strict";

import {
  getEventCompanionTerrainPlacementPolicy,
  transformEventCompanionPlacement,
  transformEventCompanionSourceGuide
} from "../../src/rules/event-companion-terrain-placement-policy.js";

test("ordinary pages default to identity source placement", () => {
  const policy = getEventCompanionTerrainPlacementPolicy(17);
  assert.equal(policy.sourceTransform, "identity");
  assert.equal(policy.alignSourceToGeometry, false);
  assert.deepEqual(policy.sourceEdgeOverrides, {});

  assert.deepEqual(
    transformEventCompanionPlacement([12, 9], "left", "identity"),
    { point: [12, 9], edge: "left" }
  );
});

test("a 180-degree source transform always rotates point and battlefield edge together", () => {
  assert.deepEqual(
    transformEventCompanionPlacement([12, 9], "left", "rotate180"),
    { point: [48, 35], edge: "right" }
  );
  assert.deepEqual(
    transformEventCompanionPlacement([12, 9], "top", "rotate180"),
    { point: [48, 35], edge: "bottom" }
  );
});

test("an x-axis source flip reverses left/right while preserving top/bottom", () => {
  assert.deepEqual(
    transformEventCompanionPlacement([44.98, 28.09], "right", "flipX"),
    { point: [15.02, 28.09], edge: "left" }
  );
  assert.deepEqual(
    transformEventCompanionPlacement([45.03, 27.98], "top", "flipX"),
    { point: [14.97, 27.98], edge: "top" }
  );
});

test("Page 18 canonical source policy preserves original PDF-frame edge metadata before rotation", () => {
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

test("Page 19 19-inch source guide rotates outward instead of through its measured terrain", () => {
  const transformed = transformEventCompanionSourceGuide(19, {
    value: '19"',
    edge: "right",
    sourceAnchor: [40.91, 37]
  });

  assert.deepEqual(transformed, {
    point: [19.09, 7],
    edge: "right"
  });
});

test("Page 20 uses a one-axis source flip for the lower bridge dimensions", () => {
  const fifteen = transformEventCompanionSourceGuide(20, {
    value: '15"',
    edge: "right",
    sourceAnchor: [44.98, 28.09]
  });
  const sixteen = transformEventCompanionSourceGuide(20, {
    value: '16"',
    edge: "top",
    sourceAnchor: [45.03, 27.98]
  });

  assert.deepEqual(fifteen, { point: [15.02, 28.09], edge: "left" });
  assert.deepEqual(sixteen, { point: [14.97, 27.98], edge: "top" });
});
