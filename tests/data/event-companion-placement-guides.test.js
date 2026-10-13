import test from "node:test";
import assert from "node:assert/strict";

import {
  getEventCompanionPlacementOverlay,
  PAGE_12_GUIDES,
  PAGE_12_COMPLETE_GUIDES
} from "../../src/data/event-companion-placement-guides.js";

import { EVENT_COMPANION_SOURCE_PLACEMENT_GUIDES } from "../../src/data/event-companion-placement-source-guides.js";
import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";

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

test("page 12 guides keep the approved hand-verified V2 anchor relationships", () => {
  const overlay = getEventCompanionPlacementOverlay(12);
  assert.ok(overlay);
  assert.equal(overlay.lines.length, 36);
  assert.equal(overlay.measurements.length, 36);
  assert.ok(overlay.anchors.length > 0);
  assert.ok(overlay.guides.every((guide) => ["left", "right", "top", "bottom"].includes(guide.edge)));
  assert.ok(overlay.guides.every((guide) => Array.isArray(guide.anchor) && guide.anchor.length === 2));
  assert.ok(overlay.guides.every((guide) => typeof guide.value === "string" && guide.value.endsWith('"')));
});

test("all remaining Event Companion pages have source terrain placement transcriptions", () => {
  for (let page = 9; page <= 53; page += 1) {
    if (page === 12) continue;
    const sourceGuides = EVENT_COMPANION_SOURCE_PLACEMENT_GUIDES[String(page)];
    assert.ok(Array.isArray(sourceGuides) && sourceGuides.length > 0, `page ${page} should have source guides`);
    assert.ok(sourceGuides.every((guide) => typeof guide.value === "string" && guide.value.endsWith('"')), `page ${page} values should be official inch labels`);
    assert.ok(sourceGuides.every((guide) => ["left", "right", "top", "bottom"].includes(guide.edge)), `page ${page} edges should be valid`);
  }
});

test("every Event Companion map renders its full official terrain-placement transcription onto V2 terrain vertices", () => {
  for (let page = 9; page <= 53; page += 1) {
    const geometry = EVENT_COMPANION_MAP_CATALOG.layouts.find((layout) => Number(layout.page) === page);
    assert.ok(geometry?.verified, `page ${page} should have verified V2 geometry`);

    const overlay = getEventCompanionPlacementOverlay(page, geometry);
    assert.ok(overlay, `page ${page} should render placement references`);
    assert.equal(overlay.lines.length, overlay.measurements.length, `page ${page} should pair every guide line and label`);

    const vertices = new Set(Object.values(geometry.terrainGeometry ?? {}).flatMap((shape) =>
      (shape.points ?? []).map((point) => `${Number(point.x)},${Number(point.y)}`)));
    assert.ok(overlay.guides.every((guide) => vertices.has(`${Number(guide.anchor[0])},${Number(guide.anchor[1])}`)), `page ${page} guides should terminate on V2 terrain vertices`);

    const officialValues = new Set((EVENT_COMPANION_SOURCE_PLACEMENT_GUIDES[String(page)] ?? PAGE_12_GUIDES).map((guide) => guide.value));
    assert.ok(overlay.guides.every((guide) => officialValues.has(guide.value)), `page ${page} should reuse only official printed values`);

    if (page !== 12) {
      const sourceCount = EVENT_COMPANION_SOURCE_PLACEMENT_GUIDES[String(page)].length;
      const originalCount = overlay.guides.filter((guide) => !guide.mirrored).length;
      assert.equal(originalCount, sourceCount, `page ${page} should preserve every official terrain-placement guide`);
    }
  }
});
