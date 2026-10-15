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

function isOfficialPage22FifteenSourceLine(guide) {
  return guide.value === '15"'
    && guide.sourceAnchor?.[0] === 45.10
    && (guide.sourceAnchor?.[1] === 11.93 || guide.sourceAnchor?.[1] === 22.00);
}

test("Page 22 source transcription contains the 18 terrain-placement guides", () => {
  assert.equal(PAGE_22_SOURCE_GUIDES.length, 18);
  assert.equal(PAGE_22_SOURCE_GUIDES.filter((guide) => guide.value === '15"').length, 2);
  assert.equal(PAGE_22_SOURCE_GUIDES.filter((guide) => guide.value === '8"').length, 1);
  assert.equal(PAGE_22_SOURCE_GUIDES.some((guide) => guide.value === '18"'), false);
});

test("Page 22 canonical guides snap to reproducible terrain corners and preserve source-authoritative paths", () => {
  const layout = layoutForPage(22);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);

  assert.ok(layout, "Page 22 layout geometry exists");
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

    // Both official 15-inch Page 22 source lines visibly run from the lower
    // central terrain footprint toward the battlefield edge. On the approximate
    // V2 footprint those source-authoritative paths overlap the terrain boundary,
    // so preserve them exactly rather than reversing or rerouting them.
    if (isOfficialPage22FifteenSourceLine(guide)) continue;

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

test("Page 22 restores the two official 15-inch terrain guides and keeps the 8-inch guide on the circled footprints", () => {
  const layout = layoutForPage(22);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);

  const leftFifteen = findBySource(overlay, '15"', [45.10, 11.93]);
  assert.deepEqual(
    { terrain: leftFifteen?.terrain, anchor: leftFifteen?.anchor, edge: leftFifteen?.edge },
    { terrain: "T4", anchor: [14.9, 12], edge: "left" }
  );

  const rightFifteen = findBySource(overlay, '15"', [45.10, 22.00]);
  assert.deepEqual(
    { terrain: rightFifteen?.terrain, anchor: rightFifteen?.anchor, edge: rightFifteen?.edge },
    { terrain: "T4", anchor: [14.9, 22.1], edge: "left" }
  );

  const eight = findBySource(overlay, '8"', [41.18, 35.89]);
  assert.deepEqual(
    { terrain: eight?.terrain, anchor: eight?.anchor, edge: eight?.edge },
    { terrain: "T3", anchor: [16.8, 35.9], edge: "top" }
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

  for (const value of ['27"', '26"', '23"', '20"', '19"', '15"', '12"', '8"', '7"', '6"', '4"', '3"']) {
    assert.ok(values.includes(value), `${value} remains present in the Page 22 canonical source layer`);
  }
  assert.equal(values.filter((value) => value === '15"').length, 2, "both official 15-inch terrain guides remain present");
  assert.equal(values.includes('18"'), false, "deployment-zone depth dimensions remain excluded");
});

test("Page 22 mirror augmentation reuses every approved canonical value on the eight clear rotational counterparts", () => {
  const layout = layoutForPage(22);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);
  const policy = getEventCompanionTerrainMirrorPolicy(22);
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

  const sevenMirror = mirrored.find((guide) => guide.value === '7"' && guide.terrain === "T14");
  assert.deepEqual(
    { anchor: sevenMirror?.anchor, edge: sevenMirror?.edge },
    { anchor: [53.1, 17.6], edge: "right" }
  );
});
