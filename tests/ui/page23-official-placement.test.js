import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import { PAGE_23_SOURCE_GUIDES } from "../../src/data/event-companion-placement-guides-supplemental.js";
import { getEventCompanionTerrainMirrorPolicy } from "../../src/rules/event-companion-terrain-mirror-policy.js";
import {
  buildCanonicalTerrainPlacementOverlay,
  buildCompleteTerrainPlacementOverlay
} from "../../src/ui/terrain-placement-guide-model.js";
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

test("Page 23 source transcription contains all 18 terrain-placement guides and excludes deployment depths", () => {
  assert.equal(PAGE_23_SOURCE_GUIDES.length, 18);
  assert.equal(PAGE_23_SOURCE_GUIDES.some((guide) => guide.value === '12"'), false);
  assert.equal(PAGE_23_SOURCE_GUIDES.filter((guide) => guide.value === '15"').length, 2);
  assert.equal(PAGE_23_SOURCE_GUIDES.filter((guide) => guide.value === '14"').length, 2);
  assert.equal(PAGE_23_SOURCE_GUIDES.filter((guide) => guide.value === '7"').length, 3);
  assert.equal(PAGE_23_SOURCE_GUIDES.filter((guide) => guide.value === '3"').length, 3);
});

test("Page 23 canonical guides snap every official source line to a reproducible V2 terrain corner", () => {
  const layout = layoutForPage(23);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);

  assert.ok(layout, "Page 23 layout geometry exists");
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
      `${guide.terrain} ${guide.value} ${guide.edge} leaves the measured terrain cleanly`
    );
  }
});

test("Page 23 uses the same PDF x-axis flip as Pages 20-22 without per-guide edge repairs", () => {
  const layout = layoutForPage(23);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);

  // The source point lies at the near-shared V2 corner between the two upper
  // right footprints. Nearest-corner snapping resolves it to T3 [47.9,37.0],
  // preserving the official source location and top-edge direction unchanged.
  const upperRightSeven = findBySource(overlay, '7"', [12.14, 37.05]);
  assert.deepEqual(
    { terrain: upperRightSeven?.terrain, anchor: upperRightSeven?.anchor, edge: upperRightSeven?.edge },
    { terrain: "T3", anchor: [47.9, 37], edge: "top" }
  );

  const upperFourteen = findBySource(overlay, '14"', [4.03, 30.03]);
  assert.deepEqual(
    { terrain: upperFourteen?.terrain, anchor: upperFourteen?.anchor, edge: upperFourteen?.edge },
    { terrain: "T2", anchor: [56.1, 30.1], edge: "top" }
  );

  const sixteen = findBySource(overlay, '16"', [44.05, 41.04]);
  assert.deepEqual(
    { terrain: sixteen?.terrain, anchor: sixteen?.anchor, edge: sixteen?.edge },
    { terrain: "T1", anchor: [15.8, 41], edge: "left" }
  );

  const lowerFourteen = findBySource(overlay, '14"', [46.08, 33.02]);
  assert.deepEqual(
    { terrain: lowerFourteen?.terrain, anchor: lowerFourteen?.anchor, edge: lowerFourteen?.edge },
    { terrain: "T11", anchor: [13.9, 33], edge: "left" }
  );
});

test("Page 23 preserves the official paired measurements that share terrain placement corners", () => {
  const layout = layoutForPage(23);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);

  const t12Corner = overlay.guides.filter((guide) => guide.terrain === "T12" && guide.anchor[0] === 6.7 && guide.anchor[1] === 31);
  assert.deepEqual(
    t12Corner.map((guide) => [guide.value, guide.edge]).sort(),
    [['13"', "top"], ['7"', "left"]].sort()
  );

  const t16Corner = overlay.guides.filter((guide) => guide.terrain === "T16" && guide.anchor[0] === 35 && guide.anchor[1] === 15.1);
  assert.deepEqual(
    t16Corner.map((guide) => [guide.value, guide.edge]).sort(),
    [['15"', "bottom"], ['25"', "right"]].sort()
  );
});

test("Page 23 retains the distinctive official terrain-placement values", () => {
  const layout = layoutForPage(23);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);
  const values = overlay.guides.map((guide) => guide.value);

  for (const value of ['25"', '16"', '15"', '14"', '13"', '11"', '7"', '5"', '4"', '3"']) {
    assert.ok(values.includes(value), `${value} remains present in the Page 23 canonical source layer`);
  }
  assert.equal(values.includes('12"'), false, "the two printed 12-inch deployment-zone depths remain excluded");
});

test("Page 23 mirror augmentation reuses every approved canonical value on the eight clear rotational counterparts", () => {
  const layout = layoutForPage(23);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);
  const policy = getEventCompanionTerrainMirrorPolicy(23);
  const mirrored = complete.guides.filter((guide) => guide.mirrored);
  const official = complete.guides.filter((guide) => !guide.mirrored);

  assert.equal(policy.enabled, true);
  assert.equal(policy.transform, "rotate180");
  assert.equal(canonical.guides.length, 18);
  assert.equal(official.length, 18);
  assert.equal(mirrored.length, 18);
  assert.equal(complete.guides.length, 36);
  assert.deepEqual(
    official.map((guide) => [guide.value, guide.terrain, guide.anchor, guide.edge]),
    canonical.guides.map((guide) => [guide.value, guide.terrain, guide.anchor, guide.edge]),
    "mirror augmentation leaves the accepted canonical layer unchanged"
  );
  assert.equal(new Set(complete.guides.map((guide) => guide.terrain)).size, 16);
  assert.equal(complete.guides.some((guide) => guide.value === '12"'), false, "deployment-zone depths remain excluded from both layers");

  const sixteenMirror = mirrored.find((guide) => guide.value === '16"' && guide.terrain === "T5");
  assert.deepEqual(
    { anchor: sixteenMirror?.anchor, edge: sixteenMirror?.edge },
    { anchor: [44, 2.9], edge: "right" }
  );
});
