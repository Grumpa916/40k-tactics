import test from "node:test";
import assert from "node:assert/strict";

import {
  getEventCompanionPlacementOverlay,
  PAGE_12_GUIDES
} from "../../src/data/event-companion-placement-guides.js";

test("page 12 terrain placement transcription keeps the 18 official terrain dimensions", () => {
  assert.equal(PAGE_12_GUIDES.length, 18);
  assert.deepEqual(PAGE_12_GUIDES.map((guide) => guide.value), [
    '9"', '5"', '10"', '4"', '5"', '6"', '28"', '17"', '16"',
    '22"', '15"', '10"', '5"', '16"', '5"', '10"', '5"', '21"'
  ]);
  assert.doesNotMatch(PAGE_12_GUIDES.map((guide) => guide.value).join(" "), /14"|19"/);
});

test("page 12 guides use stored official values and V2 anchor relationships without derived distances", () => {
  const overlay = getEventCompanionPlacementOverlay(12);
  assert.ok(overlay);
  assert.equal(overlay.lines.length, 18);
  assert.equal(overlay.measurements.length, 18);
  assert.ok(overlay.anchors.length > 0);
  assert.ok(overlay.guides.every((guide) => ["left", "right", "top", "bottom"].includes(guide.edge)));
  assert.ok(overlay.guides.every((guide) => Array.isArray(guide.anchor) && guide.anchor.length === 2));
  assert.ok(overlay.guides.every((guide) => typeof guide.value === "string" && guide.value.endsWith('"')));
  assert.equal(getEventCompanionPlacementOverlay(13), null);
});
