import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import { PAGE_21_SOURCE_GUIDES } from "../../src/data/event-companion-placement-guides-supplemental.js";
import { buildCanonicalTerrainPlacementOverlay } from "../../src/ui/terrain-placement-guide-model.js";
import { terrainGuideViolatesMeasuredTerrain } from "../../src/ui/terrain-placement-path-safety.js";

function layoutForPage(page) {
  return EVENT_COMPANION_MAP_CATALOG.layouts.find((layout) => Number(layout.page) === Number(page));
}

function findBySource(overlay, value, sourceAnchor) {
  return overlay.guides.find((guide) => (
    guide.value === value
    && guide.sourceAnchor?.[0] === sourceAnchor[0]
    && guide.sourceAnchor?.[1] === sourceAnchor[1]
  ));
}

test("Page 21 source transcription contains 18 terrain-placement guides and excludes deployment depths", () => {
  assert.equal(PAGE_21_SOURCE_GUIDES.length, 18);
  assert.equal(PAGE_21_SOURCE_GUIDES.some((guide) => guide.value === '15"'), false);
});

test("Page 21 canonical guides snap to reproducible terrain corners and leave their measured terrain cleanly", () => {
  const layout = layoutForPage(21);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);

  assert.ok(layout, "Page 21 layout geometry exists");
  assert.equal(overlay.guides.length, 18);
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
      `${guide.terrain} ${guide.value} ${guide.edge} preserves the official outward source path`
    );
  }
});

test("Page 21 x-axis source flip maps representative official anchors onto the intended V2 terrain", () => {
  const layout = layoutForPage(21);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);

  const three = findBySource(overlay, '3"', [45.44, 3.08]);
  assert.deepEqual(
    { terrain: three?.terrain, anchor: three?.anchor, edge: three?.edge },
    { terrain: "T1", anchor: [14.6, 3], edge: "bottom" }
  );

  const seven = findBySource(overlay, '7"', [51.13, 6.97]);
  const nine = findBySource(overlay, '9"', [51.13, 6.97]);
  assert.deepEqual(
    { terrain: seven?.terrain, anchor: seven?.anchor, edge: seven?.edge },
    { terrain: "T1", anchor: [8.7, 6.9], edge: "bottom" }
  );
  assert.deepEqual(
    { terrain: nine?.terrain, anchor: nine?.anchor, edge: nine?.edge },
    { terrain: "T1", anchor: [8.7, 6.9], edge: "left" }
  );

  const five = findBySource(overlay, '5"', [54.99, 38.98]);
  assert.deepEqual(
    { terrain: five?.terrain, anchor: five?.anchor, edge: five?.edge },
    { terrain: "T2", anchor: [4.8, 39], edge: "left" }
  );

  const twentyFour = findBySource(overlay, '24"', [35.96, 4.01]);
  assert.deepEqual(
    { terrain: twentyFour?.terrain, anchor: twentyFour?.anchor, edge: twentyFour?.edge },
    { terrain: "T15", anchor: [24, 4], edge: "left" }
  );
});

test("Page 21 retains the distinctive official terrain-placement values", () => {
  const layout = layoutForPage(21);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);
  const values = overlay.guides.map((guide) => guide.value);

  for (const value of ['25"', '24"', '22"', '19"', '18"', '17"', '16"', '9"', '8"', '7"', '5"', '4"', '3"']) {
    assert.ok(values.includes(value), `${value} remains present in the Page 21 canonical source layer`);
  }
  assert.equal(values.includes('15"'), false, "deployment-zone dimensions remain excluded");
});
