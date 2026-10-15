import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import { PAGE_20_SOURCE_GUIDES } from "../../src/data/event-companion-placement-guides-supplemental.js";
import { buildCanonicalTerrainPlacementOverlay } from "../../src/ui/terrain-placement-guide-model.js";
import { terrainGuideViolatesMeasuredTerrain } from "../../src/ui/terrain-placement-path-safety.js";

function layoutForPage(page) {
  return EVENT_COMPANION_MAP_CATALOG.layouts.find((layout) => Number(layout.page) === Number(page));
}

test("Page 20 source transcription contains 19 terrain-placement guides", () => {
  assert.equal(PAGE_20_SOURCE_GUIDES.length, 19);
  assert.equal(
    PAGE_20_SOURCE_GUIDES.some((guide) => guide.sourceAnchor?.[0] === 30.01 && guide.sourceAnchor?.[1] === 22),
    false,
    "the separate 9-inch deployment-zone curve dimension is not included as a terrain guide"
  );
});

test("Page 20 canonical guides snap to reproducible terrain corners and leave their own terrain cleanly", () => {
  const layout = layoutForPage(20);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);

  assert.ok(layout, "Page 20 layout geometry exists");
  assert.equal(overlay.guides.length, 19);
  assert.equal(overlay.guides.some((guide) => guide.mirrored), false);

  for (const guide of overlay.guides) {
    const polygon = (layout.terrainGeometry?.[guide.terrain]?.points ?? [])
      .map((point) => [Number(point.x), Number(point.y)]);
    assert.ok(polygon.length >= 3, `${guide.terrain} has terrain geometry`);
    assert.ok(
      polygon.some((vertex) => vertex[0] === guide.anchor[0] && vertex[1] === guide.anchor[1]),
      `${guide.value} is attached to a reproducible ${guide.terrain} corner`
    );
    assert.equal(
      terrainGuideViolatesMeasuredTerrain(guide.anchor, guide.edge, polygon),
      false,
      `${guide.terrain} ${guide.value} ${guide.edge} leaves the measured terrain without following its boundary or entering its interior`
    );
  }
});

test("Page 20 upper-right 22-inch guide leaves T14 toward the Event Companion right-hand edge", () => {
  const layout = layoutForPage(20);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);
  const guide = overlay.guides.find((item) => (
    item.value === '22"'
    && item.sourceAnchor?.[0] === 51.11
    && item.sourceAnchor?.[1] === 22
  ));

  assert.ok(guide, "the official upper-right 22-inch source guide is present");
  assert.equal(guide.terrain, "T14");
  assert.equal(guide.edge, "top", "internal top renders toward the right-hand battlefield edge in Event Companion orientation");
});

test("Page 20 retains the distinctive official terrain-placement values", () => {
  const layout = layoutForPage(20);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);
  const values = overlay.guides.map((guide) => guide.value);

  for (const value of ['24.25"', '25"', '22"', '20"', '17"', '16"', '15"', '13"', '10"', '9"', '7"', '5"']) {
    assert.ok(values.includes(value), `${value} remains present in the Page 20 canonical source layer`);
  }
});
