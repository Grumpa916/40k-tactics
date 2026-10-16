import test from "node:test";
import assert from "node:assert/strict";

import {
  getEventCompanionTerrainPlacementPolicy,
  transformEventCompanionPlacement,
  transformEventCompanionSourceGuide
} from "../../src/rules/event-companion-terrain-placement-policy.js";

test("ordinary pages default to identity source placement", () => {
  const policy = getEventCompanionTerrainPlacementPolicy(54);
  assert.equal(policy.sourceTransform, "identity");
  assert.equal(policy.alignSourceToGeometry, false);
  assert.deepEqual(policy.sourceEdgeOverrides, {});
  assert.deepEqual(transformEventCompanionPlacement([12, 9], "left", "identity"), { point: [12, 9], edge: "left" });
});

test("a 180-degree source transform always rotates point and battlefield edge together", () => {
  assert.deepEqual(transformEventCompanionPlacement([12, 9], "left", "rotate180"), { point: [48, 35], edge: "right" });
  assert.deepEqual(transformEventCompanionPlacement([12, 9], "top", "rotate180"), { point: [48, 35], edge: "bottom" });
});

test("an x-axis source flip reverses left/right while preserving top/bottom", () => {
  assert.deepEqual(transformEventCompanionPlacement([44.98, 28.09], "right", "flipX"), { point: [15.02, 28.09], edge: "left" });
  assert.deepEqual(transformEventCompanionPlacement([45.03, 27.98], "top", "flipX"), { point: [14.97, 27.98], edge: "top" });
});

test("Page 18 canonical source policy preserves original PDF-frame edge metadata before rotation", () => {
  const transformed = transformEventCompanionSourceGuide(18, { value: '9"', edge: "left", sourceAnchor: [51.2, 22.25] });
  assert.deepEqual(transformed, { point: [8.8, 21.75], edge: "left" });
});

test("Page 19 19-inch source guide rotates outward instead of through its measured terrain", () => {
  const transformed = transformEventCompanionSourceGuide(19, { value: '19"', edge: "right", sourceAnchor: [40.91, 37] });
  assert.deepEqual(transformed, { point: [19.09, 7], edge: "right" });
});

test("Page 20 uses a one-axis source flip for the lower bridge dimensions", () => {
  const fifteen = transformEventCompanionSourceGuide(20, { value: '15"', edge: "right", sourceAnchor: [44.98, 28.09] });
  const sixteen = transformEventCompanionSourceGuide(20, { value: '16"', edge: "top", sourceAnchor: [45.03, 27.98] });
  assert.deepEqual(fifteen, { point: [15.02, 28.09], edge: "left" });
  assert.deepEqual(sixteen, { point: [14.97, 27.98], edge: "top" });
});

test("Page 21 uses the Page 20 x-axis source flip without per-guide overrides", () => {
  const policy = getEventCompanionTerrainPlacementPolicy(21);
  assert.equal(policy.sourceTransform, "flipX");
  assert.equal(policy.alignSourceToGeometry, true);
  assert.deepEqual(policy.sourceEdgeOverrides, {});
  assert.deepEqual(transformEventCompanionSourceGuide(21, { value: '3"', edge: "bottom", sourceAnchor: [45.44, 3.08] }), { point: [14.56, 3.08], edge: "bottom" });
  assert.deepEqual(transformEventCompanionSourceGuide(21, { value: '9"', edge: "right", sourceAnchor: [51.13, 6.97] }), { point: [8.87, 6.97], edge: "left" });
});

test("Page 27 canonical candidate keeps the audited flipX source frame", () => {
  const policy = getEventCompanionTerrainPlacementPolicy(27);
  assert.equal(policy.sourceTransform, "flipX");
  assert.equal(policy.alignSourceToGeometry, true);
  assert.deepEqual(policy.sourceEdgeOverrides, {});
  assert.deepEqual(transformEventCompanionSourceGuide(27, { value: '25"', edge: "left", sourceAnchor: [24.96, 40.07] }), { point: [35.04, 40.07], edge: "right" });
  assert.deepEqual(transformEventCompanionSourceGuide(27, { value: '22"', edge: "top", sourceAnchor: [54.14, 22.03] }), { point: [5.86, 22.03], edge: "top" });
});

