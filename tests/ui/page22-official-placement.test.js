import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import { PAGE_22_SOURCE_GUIDES } from "../../src/data/event-companion-placement-guides-supplemental.js";
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

test("Page 22 source transcription contains only the 16 terrain-placement guides", () => {
  assert.equal(PAGE_22_SOURCE_GUIDES.length, 16);
  assert.equal(PAGE_22_SOURCE_GUIDES.some((guide) => guide.value === '15"'), false);
  assert.equal(PAGE_22_SOURCE_GUIDES.some((guide) => guide.value === '18"'), false);
});

test("Page 22 canonical guides snap to reproducible terrain corners and leave measured terrain cleanly", () => {
  const layout = layoutForPage(22);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);

  assert.ok(layout, "Page 22 layout geometry exists");
  assert.equal(overlay.guides.length, 16);
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

test("Page 22 uses the PDF source x-axis flip without per-guide edge repairs", () => {
  const layout = layoutForPage(22);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);

  const seven = findBySource(overlay, '7"', [53.15, 26.40]);
  assert.deepEqual(
    { terrain: seven?.terrain, anchor: seven?.anchor, edge: seven?.edge },
    { terrain: "T1", anchor: [6.9, 26.4], edge: "left" }
  );

  const twentySix = findBySource(overlay, '26"', [33.99, 17.88]);
  assert.deepEqual(
    { terrain: twentySix?.terrain, anchor: twentySix?.anchor, edge: twentySix?.edge },
    { terrain: "T7", anchor: [25.9, 17.8], edge: "left" }
  );

  const twentySeven = findBySource(overlay, '27"', [33.01, 31.97]);
  assert.deepEqual(
    { terrain: twentySeven?.terrain, anchor: twentySeven?.anchor, edge: twentySeven?.edge },
    { terrain: "T7", anchor: [26.9, 31.9], edge: "left" }
  );

  const twentyThree = findBySource(overlay, '23"', [36.96, 40.06]);
  assert.deepEqual(
    { terrain: twentyThree?.terrain, anchor: twentyThree?.anchor, edge: twentyThree?.edge },
    { terrain: "T8", anchor: [23, 40], edge: "left" }
  );
});

test("Page 22 preserves the source edge-pair measurements at shared terrain corners", () => {
  const layout = layoutForPage(22);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);

  const t2Corner = overlay.guides.filter((guide) => guide.terrain === "T2" && guide.anchor[0] === 18.8 && guide.anchor[1] === 2.9);
  assert.deepEqual(
    t2Corner.map((guide) => [guide.value, guide.edge]).sort(),
    [['19"', "left"], ['3"', "bottom"]].sort()
  );

  const t7Corner = overlay.guides.filter((guide) => guide.terrain === "T7" && guide.anchor[0] === 26.9 && guide.anchor[1] === 31.9);
  assert.deepEqual(
    t7Corner.map((guide) => [guide.value, guide.edge]).sort(),
    [['27"', "left"], ['12"', "top"]].sort()
  );

  const t8Corner = overlay.guides.filter((guide) => guide.terrain === "T8" && guide.anchor[0] === 23 && guide.anchor[1] === 40);
  assert.deepEqual(
    t8Corner.map((guide) => [guide.value, guide.edge]).sort(),
    [['23"', "left"], ['4"', "top"]].sort()
  );
});

test("Page 22 retains its distinctive official terrain-placement values", () => {
  const layout = layoutForPage(22);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);
  const values = overlay.guides.map((guide) => guide.value);

  for (const value of ['27"', '26"', '23"', '20"', '19"', '12"', '8"', '7"', '6"', '4"', '3"']) {
    assert.ok(values.includes(value), `${value} remains present in the Page 22 canonical source layer`);
  }
  assert.equal(values.includes('15"'), false, "central deployment-zone dimensions remain excluded");
  assert.equal(values.includes('18"'), false, "deployment-zone depth dimensions remain excluded");
});

test("Page 22 mirror augmentation remains disabled during canonical visual review", () => {
  const layout = layoutForPage(22);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);
  const policy = getEventCompanionTerrainMirrorPolicy(22);

  assert.equal(policy.enabled, false);
  assert.deepEqual(complete.guides, canonical.guides);
  assert.equal(complete.guides.some((guide) => guide.mirrored), false);
});
