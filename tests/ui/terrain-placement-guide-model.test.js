import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import { getEventCompanionPlacementOverlay } from "../../src/data/event-companion-placement-guides.js";
import { getEventCompanionPlacementGuideCorrections } from "../../src/data/event-companion-placement-guide-corrections.js";
import {
  buildCanonicalTerrainPlacementOverlay,
  buildCompleteTerrainPlacementOverlay,
  terrainGuideEndpoint
} from "../../src/ui/terrain-placement-guide-model.js";
import {
  outwardPerpendicularEdges,
  terrainGuideEntersPolygonInterior,
  terrainGuideViolatesMeasuredTerrain
} from "../../src/ui/terrain-placement-path-safety.js";

const INCH_VALUE = /^\d+(?:\.\d+)?"$/;
const VERIFIED_SOURCE_PAGES = [15, 16, 17, 18, 19];

function guideKey(guide) {
  return [
    String(guide?.terrain ?? ""),
    Number(guide?.anchor?.[0]),
    Number(guide?.anchor?.[1]),
    String(guide?.edge ?? ""),
    String(guide?.value ?? "")
  ].join("|");
}

function sourceIdentity(guide) {
  return [
    String(guide?.value ?? ""),
    Number(guide?.sourceAnchor?.[0]),
    Number(guide?.sourceAnchor?.[1])
  ].join("|");
}

function expectedSourceGuides(page) {
  const canonical = getEventCompanionPlacementOverlay(page);
  const result = new Map();
  for (const guide of canonical?.guides ?? []) result.set(guideKey(guide), guide);
  for (const guide of getEventCompanionPlacementGuideCorrections(page)) result.set(guideKey(guide), guide);
  return [...result.values()];
}

test("measured-terrain validation rejects a guide that follows its own boundary", () => {
  const square = [[2, 2], [4, 2], [4, 4], [2, 4]];
  assert.equal(terrainGuideViolatesMeasuredTerrain([4, 2], "left", square), true);
  assert.equal(terrainGuideViolatesMeasuredTerrain([2, 2], "left", square), false);
});

test("measured-terrain validation rejects a guide that enters its own interior", () => {
  const square = [[2, 2], [4, 2], [4, 4], [2, 4]];
  assert.equal(terrainGuideEntersPolygonInterior([4, 3], "left", square), true);
  assert.equal(terrainGuideViolatesMeasuredTerrain([4, 3], "left", square), true);
});

test("unrelated terrain is not a blocker for an Event Companion source line", () => {
  const measuredTerrain = [[2, 2], [4, 2], [4, 4], [2, 4]];
  const unrelatedTerrain = [[0.5, 1.5], [1.5, 1.5], [1.5, 2.5], [0.5, 2.5]];
  const anchor = [2, 2];

  assert.equal(
    terrainGuideViolatesMeasuredTerrain(anchor, "left", measuredTerrain),
    false,
    "the guide leaves the terrain it measures immediately"
  );
  assert.equal(
    terrainGuideViolatesMeasuredTerrain(anchor, "left", unrelatedTerrain),
    true,
    "the same geometric line crosses the unrelated terrain, which is intentionally not used to reject the source guide"
  );
});

test("outward perpendicular routing chooses edges that leave the measured terrain cleanly", () => {
  const square = [[2, 2], [4, 2], [4, 4], [2, 4]];
  assert.deepEqual(outwardPerpendicularEdges([4, 2], square), ["right", "bottom"]);
  assert.deepEqual(outwardPerpendicularEdges([2, 2], square), ["left", "bottom"]);
});

test("pages 12-14 retain their explicit approved source overlays", () => {
  for (const page of [12, 13, 14]) {
    const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === page);
    const canonical = getEventCompanionPlacementOverlay(page);
    assert.ok(layout, `page ${page} layout exists`);
    assert.ok(canonical, `page ${page} canonical overlay exists`);

    const overlay = buildCompleteTerrainPlacementOverlay(layout);
    assert.equal(overlay.guides.length, canonical.guides.length, `page ${page} source guide count remains locked`);
    assert.deepEqual(
      overlay.guides.map((guide) => guide.value),
      canonical.guides.map((guide) => guide.value),
      `page ${page} source values remain locked`
    );
  }
});

for (const page of VERIFIED_SOURCE_PAGES) {
  test(`page ${page} preserves its source-defined terrain placement guides`, () => {
    const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === page);
    const canonical = getEventCompanionPlacementOverlay(page);
    assert.ok(layout, `page ${page} layout exists`);
    assert.ok(canonical, `page ${page} verified source overlay exists`);

    const expected = expectedSourceGuides(page);
    const overlay = buildCompleteTerrainPlacementOverlay(layout);

    if (page === 18) {
      const official = overlay.guides.filter((guide) => !guide.mirrored);
      const mirrored = overlay.guides.filter((guide) => guide.mirrored);
      assert.equal(official.length, expected.length, "Page 18 retains all official/corrected source guides");
      assert.ok(mirrored.length > 0, "Page 18 may additionally reuse approved values on blank mirror counterparts");
      assert.equal(overlay.lines.length, overlay.guides.length, "one rendered line per official or mirrored guide");
      assert.equal(overlay.measurements.length, overlay.guides.length, "one displayed value per official or mirrored guide");

      const renderedOfficial = official
        .filter((guide) => guide.value !== '13"')
        .map(sourceIdentity)
        .sort();
      const canonicalOfficial = canonical.guides.map(sourceIdentity).sort();
      assert.deepEqual(
        renderedOfficial,
        canonicalOfficial,
        "Page 18 preserves every official printed value and PDF source anchor while rotating its V2 terrain attachment and battlefield edge together"
      );
    } else if (page === 19) {
      const official = overlay.guides.filter((guide) => !guide.mirrored);
      const mirrored = overlay.guides.filter((guide) => guide.mirrored);
      assert.equal(official.length, expected.length, "Page 19 retains all 20 approved canonical source guides");
      assert.equal(mirrored.length, expected.length, "Page 19 mirrors each approved source guide once onto its clear counterpart");
      assert.equal(overlay.lines.length, overlay.guides.length, "one rendered line per canonical or mirrored Page 19 guide");
      assert.equal(overlay.measurements.length, overlay.guides.length, "one displayed value per canonical or mirrored Page 19 guide");
      assert.deepEqual(
        official.map(sourceIdentity).sort(),
        canonical.guides.map(sourceIdentity).sort(),
        "Page 19 mirroring does not alter any PDF-transcribed value or source anchor in the canonical layer"
      );
    } else {
      assert.equal(overlay.guides.length, expected.length, "no synthetic guides are added");
      assert.equal(overlay.lines.length, expected.length, "one rendered line per source-defined guide");
      assert.equal(overlay.measurements.length, expected.length, "one displayed value per source-defined guide");
      assert.deepEqual(
        overlay.guides.map(guideKey).sort(),
        expected.map(guideKey).sort(),
        "every rendered guide maps to a specific source value, terrain point, and edge"
      );
    }

    overlay.guides.forEach((guide, index) => {
      assert.match(guide.value, INCH_VALUE);
      assert.ok(["left", "right", "top", "bottom"].includes(guide.edge));
      assert.deepEqual(
        overlay.lines[index],
        [guide.anchor[0], guide.anchor[1], ...terrainGuideEndpoint(guide.anchor, guide.edge)]
      );

      const measuredTerrainVertices = (layout.terrainGeometry?.[guide.terrain]?.points ?? [])
        .map((point) => [Number(point.x), Number(point.y)]);
      assert.ok(
        measuredTerrainVertices.some((vertex) => vertex[0] === guide.anchor[0] && vertex[1] === guide.anchor[1]),
        `${guide.terrain} ${guide.value} snaps to a reproducible terrain corner`
      );
      assert.equal(
        terrainGuideViolatesMeasuredTerrain(guide.anchor, guide.edge, measuredTerrainVertices),
        false,
        `${guide.terrain} ${guide.value} ${guide.edge} leaves its measured terrain immediately without following its boundary or entering its interior`
      );
    });

    const calloutGuideCount = overlay.callouts.reduce(
      (total, callout) => total + (Array.isArray(callout.lines) ? callout.lines.length : 0),
      0
    );
    assert.equal(calloutGuideCount, overlay.guides.length, "boxed callouts cover guides without inventing extra values");
    overlay.callouts.forEach((callout) => {
      assert.ok(callout.lines.length >= 1 && callout.lines.length <= 2, "a placement point shows only its actual one or two measurements");
      callout.values.forEach((value) => assert.match(value, INCH_VALUE));
    });
  });
}

test("page 18 rotates official PDF source anchors and battlefield edges together onto the intended V2 terrain corners", () => {
  const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === 18);
  const overlay = buildCompleteTerrainPlacementOverlay(layout);
  const official = overlay.guides.filter((guide) => !guide.mirrored);

  const findBySource = (value, sourceAnchor) => official.find((guide) => (
    guide.value === value
    && guide.sourceAnchor?.[0] === sourceAnchor[0]
    && guide.sourceAnchor?.[1] === sourceAnchor[1]
  ));

  const twentyFourQuarter = findBySource('24.25"', [35.89, 26.98]);
  const five = findBySource('5"', [55.08, 18.51]);
  const seven = findBySource('7"', [55.11, 6.96]);
  const twentySix = findBySource('26"', [34.01, 39.07]);

  assert.deepEqual(
    { terrain: twentyFourQuarter?.terrain, anchor: twentyFourQuarter?.anchor, edge: twentyFourQuarter?.edge },
    { terrain: "T4", anchor: [24.2, 17], edge: "left" }
  );
  assert.deepEqual(
    { terrain: five?.terrain, anchor: five?.anchor, edge: five?.edge },
    { terrain: "T9", anchor: [4.8, 25.4], edge: "left" }
  );
  assert.deepEqual(
    { terrain: seven?.terrain, anchor: seven?.anchor, edge: seven?.edge },
    { terrain: "T9", anchor: [4.8, 37], edge: "top" }
  );
  assert.deepEqual(
    { terrain: twentySix?.terrain, anchor: twentySix?.anchor, edge: twentySix?.edge },
    { terrain: "T6", anchor: [25.9, 5], edge: "left" }
  );
});

test("page 18 keeps the official values intact while mirror copies reuse them unchanged", () => {
  const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === 18);
  const overlay = buildCompleteTerrainPlacementOverlay(layout);
  const officialValues = overlay.guides.filter((guide) => !guide.mirrored).map((guide) => guide.value);
  const mirroredValues = overlay.guides.filter((guide) => guide.mirrored).map((guide) => guide.value);

  assert.equal(officialValues.filter((value) => value === '26"').length, 1, "the official 26-inch guide remains unique");
  assert.equal(officialValues.filter((value) => value === '13"').length, 1, "the official Page 18 13-inch guide remains present");
  assert.equal(officialValues.length, 17, "Page 18 retains the 17 verified terrain-placement dimensions");
  assert.ok(mirroredValues.length > 0, "mirror counterparts reuse approved values without changing the official source layer");
  mirroredValues.forEach((value) => assert.ok(officialValues.includes(value), `${value} mirror value already exists in the approved layer`));
});

test("page 19 canonical source layer contains 20 terrain measurements and excludes both 12-inch deployment-zone dimensions", () => {
  const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === 19);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);
  assert.equal(overlay.guides.length, 20);
  assert.equal(overlay.guides.filter((guide) => guide.value === '12"').length, 0);
  assert.equal(overlay.guides.some((guide) => guide.mirrored), false);
});

test("page 19 rotates representative PDF source anchors and arrows together onto V2 terrain corners", () => {
  const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === 19);
  const overlay = buildCanonicalTerrainPlacementOverlay(layout);
  const findBySource = (value, sourceAnchor) => overlay.guides.find((guide) => (
    guide.value === value
    && guide.sourceAnchor?.[0] === sourceAnchor[0]
    && guide.sourceAnchor?.[1] === sourceAnchor[1]
  ));

  assert.deepEqual(
    ((guide) => ({ terrain: guide?.terrain, anchor: guide?.anchor, edge: guide?.edge }))(findBySource('5"', [55.00, 24.04])),
    { terrain: "T1", anchor: [4.8, 19.9], edge: "left" }
  );
  assert.deepEqual(
    ((guide) => ({ terrain: guide?.terrain, anchor: guide?.anchor, edge: guide?.edge }))(findBySource('13"', [55.00, 30.98])),
    { terrain: "T1", anchor: [4.8, 12.9], edge: "bottom" }
  );
  assert.deepEqual(
    ((guide) => ({ terrain: guide?.terrain, anchor: guide?.anchor, edge: guide?.edge }))(findBySource('24.25"', [24.14, 16.96])),
    { terrain: "T4", anchor: [35.8, 27], edge: "right" }
  );
  assert.deepEqual(
    ((guide) => ({ terrain: guide?.terrain, anchor: guide?.anchor, edge: guide?.edge }))(findBySource('7"', [7.02, 39.35])),
    { terrain: "T7", anchor: [53, 4.5], edge: "right" }
  );
});

test("page 19 mirror pass reuses every canonical value on the eight unmeasured rotational counterparts", () => {
  const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === 19);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);
  const mirrored = complete.guides.filter((guide) => guide.mirrored);
  const opposite = { left: "right", right: "left", top: "bottom", bottom: "top" };

  assert.equal(canonical.guides.length, 20);
  assert.equal(mirrored.length, 20);
  assert.equal(complete.guides.length, 40);
  assert.equal(complete.guides.filter((guide) => guide.value === '12"').length, 0, "deployment-zone depth remains excluded from both layers");

  const coveredTerrain = new Set(complete.guides.map((guide) => guide.terrain));
  for (let index = 1; index <= 16; index += 1) {
    assert.ok(coveredTerrain.has(`T${index}`), `T${index} receives at least one canonical or mirrored placement guide`);
  }

  for (const copy of mirrored) {
    const source = canonical.guides.find((guide) => (
      guide.terrain === copy.mirroredFromTerrain
      && guide.value === copy.value
      && guide.anchor[0] === copy.mirroredFromAnchor?.[0]
      && guide.anchor[1] === copy.mirroredFromAnchor?.[1]
    ));
    assert.ok(source, `${copy.terrain} ${copy.value} maps back to an approved canonical Page 19 guide`);
    assert.equal(copy.value, source.value, "mirror augmentation never changes the approved distance value");
    assert.equal(copy.edge, opposite[source.edge], "mirror arrow reverses with the 180-degree terrain counterpart");
  }
});

test("pages beyond the verified range do not masquerade as canonical terrain guides", () => {
  for (const layout of (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).filter((item) => Number(item.page) >= 24 && Number(item.page) <= 53)) {
    const overlay = buildCompleteTerrainPlacementOverlay(layout);
    assert.equal(overlay.guides.length, 0, `page ${layout.page} remains unverified`);
    assert.equal(overlay.lines.length, 0, `page ${layout.page} has no synthetic official lines`);
    assert.equal(overlay.measurements.length, 0, `page ${layout.page} has no inferred official values`);
    assert.equal(overlay.callouts.length, 0, `page ${layout.page} has no placement callouts yet`);
  }
});