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
