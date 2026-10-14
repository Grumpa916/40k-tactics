import test from "node:test";
import assert from "node:assert/strict";

import {
  getEventCompanionPlacementOverlay,
  PAGE_12_GUIDES,
  PAGE_12_COMPLETE_GUIDES,
  PAGE_13_SOURCE_GUIDES,
  PAGE_14_SOURCE_GUIDES
} from "../../src/data/event-companion-placement-guides.js";

test("page 12 terrain placement transcription keeps the 18 official terrain dimensions", () => {
  assert.equal(PAGE_12_GUIDES.length, 18);
  assert.deepEqual(PAGE_12_GUIDES.map((guide) => guide.value), [
    '9"', '5"', '10"', '4"', '5"', '6"', '28"', '17"', '16"',
    '22"', '15"', '10"', '5"', '16"', '5"', '10"', '5"', '21"'
  ]);
  assert.doesNotMatch(PAGE_12_GUIDES.map((guide) => guide.value).join(" "), /14"|19"/);
});

test("page 12 display mirrors the 18 official terrain dimensions without creating new values", () => {
  assert.equal(PAGE_12_COMPLETE_GUIDES.length, 36);
  const originals = PAGE_12_COMPLETE_GUIDES.filter((guide) => !guide.mirrored);
  const mirrors = PAGE_12_COMPLETE_GUIDES.filter((guide) => guide.mirrored);
  assert.equal(originals.length, 18);
  assert.equal(mirrors.length, 18);
  assert.deepEqual(mirrors.map((guide) => guide.value), PAGE_12_GUIDES.map((guide) => guide.value));
  assert.ok(mirrors.every((guide) => ["left", "right", "top", "bottom"].includes(guide.edge)));
  assert.ok(mirrors.every((guide) => Array.isArray(guide.anchor) && guide.anchor.length === 2));
  assert.ok(mirrors.every((guide) => guide.anchor[0] >= 0 && guide.anchor[0] <= 60 && guide.anchor[1] >= 0 && guide.anchor[1] <= 44));
});

test("page 12 guides use stored official values and V2 anchor relationships without derived distances", () => {
  const overlay = getEventCompanionPlacementOverlay(12);
  assert.ok(overlay);
  assert.equal(overlay.lines.length, 36);
  assert.equal(overlay.measurements.length, 36);
  assert.ok(overlay.anchors.length > 0);
  assert.ok(overlay.guides.every((guide) => ["left", "right", "top", "bottom"].includes(guide.edge)));
  assert.ok(overlay.guides.every((guide) => Array.isArray(guide.anchor) && guide.anchor.length === 2));
  assert.ok(overlay.guides.every((guide) => typeof guide.value === "string" && guide.value.endsWith('"')));
});

test("pages 13 and 14 preserve their official source values and render only edge-to-corner guides", () => {
  assert.deepEqual(PAGE_13_SOURCE_GUIDES.map((guide) => guide.value), [
    '4"', '4"', '5"', '5"', '9"', '22"', '7"', '16"', '4"', '26"',
    '5"', '18"', '21"', '15"', '10"', '11"', '5"', '15"', '18"', '20"', '9"'
  ]);
  assert.deepEqual(PAGE_14_SOURCE_GUIDES.map((guide) => guide.value), [
    '19"', '4"', '27"', '15"', '24"', '8"', '7"', '5"', '8"', '28"',
    '2"', '2"', '7"', '17"', '16"', '15"', '5"', '12"'
  ]);

  const page13SecondNine = PAGE_13_SOURCE_GUIDES.find((guide) =>
    guide.value === '9"' && guide.edge === "right" && guide.sourceAnchor[0] > 50);
  assert.ok(page13SecondNine, "page 13 retains the lower official 9-inch reference");

  for (const page of [13, 14]) {
    const overlay = getEventCompanionPlacementOverlay(page);
    assert.ok(overlay);
    assert.ok(overlay.guides.length > 0);
    assert.equal(overlay.lines.length, overlay.guides.length);
    assert.equal(overlay.measurements.length, overlay.guides.length);
    assert.ok(overlay.guides.every((guide) => ["left", "right", "top", "bottom"].includes(guide.edge)));
    assert.ok(overlay.guides.every((guide) => Array.isArray(guide.anchor) && guide.anchor.length === 2));
    assert.ok(overlay.guides.every((guide) => guide.anchor[0] >= 0 && guide.anchor[0] <= 60 && guide.anchor[1] >= 0 && guide.anchor[1] <= 44));
    assert.ok(overlay.guides.every((guide) => typeof guide.value === "string" && guide.value.endsWith('"')));

    for (let index = 0; index < overlay.guides.length; index += 1) {
      const guide = overlay.guides[index];
      const line = overlay.lines[index];
      const [x, y] = guide.anchor;
      const endpoint = guide.edge === "left" ? [0, y]
        : guide.edge === "right" ? [60, y]
          : guide.edge === "top" ? [x, 44]
            : [x, 0];
      assert.deepEqual(line, [x, y, ...endpoint]);
    }
  }
});

test("pages outside the converted terrain-placement range remain untouched", () => {
  assert.equal(getEventCompanionPlacementOverlay(11), null);
  assert.equal(getEventCompanionPlacementOverlay(54), null);
});
