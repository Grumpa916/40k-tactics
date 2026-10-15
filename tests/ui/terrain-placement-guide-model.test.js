import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import { getEventCompanionPlacementOverlay } from "../../src/data/event-companion-placement-guides.js";
import { getEventCompanionPlacementGuideCorrections } from "../../src/data/event-companion-placement-guide-corrections.js";
import {
  buildCompleteTerrainPlacementOverlay,
  terrainGuideEndpoint
} from "../../src/ui/terrain-placement-guide-model.js";
import {
  outwardPerpendicularEdges,
  terrainGuideCrossesPolygonInterior,
  terrainGuideEntersPolygonInterior
} from "../../src/ui/terrain-placement-path-safety.js";

const INCH_VALUE = /^\d+(?:\.\d+)?"$/;
const VERIFIED_SOURCE_PAGES = [15, 16, 17, 18];

function guideKey(guide) {
  return [
    String(guide?.terrain ?? ""),
    Number(guide?.anchor?.[0]),
    Number(guide?.anchor?.[1]),
    String(guide?.edge ?? ""),
    String(guide?.value ?? "")
  ].join("|");
}

function sourceSignature(guide) {
  return [
    String(guide?.value ?? ""),
    String(guide?.edge ?? ""),
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

test("terrain path safety rejects a generated guide that rides along the terrain boundary", () => {
  const square = [[2, 2], [4, 2], [4, 4], [2, 4]];
  assert.equal(terrainGuideCrossesPolygonInterior([4, 2], "left", square), true);
  assert.equal(terrainGuideCrossesPolygonInterior([2, 2], "left", square), false);
});

test("source-guide interior validation allows boundary contact but rejects actual terrain penetration", () => {
  const square = [[2, 2], [4, 2], [4, 4], [2, 4]];
  assert.equal(terrainGuideEntersPolygonInterior([4, 2], "left", square), false);
  assert.equal(terrainGuideEntersPolygonInterior([4, 3], "left", square), true);
});

test("outward perpendicular routing chooses edges that leave the terrain cleanly", () => {
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
  test(`page ${page} renders exactly its source-defined terrain placement guides`, () => {
    const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === page);
    const canonical = getEventCompanionPlacementOverlay(page);
    assert.ok(layout, `page ${page} layout exists`);
    assert.ok(canonical, `page ${page} verified source overlay exists`);

    const expected = expectedSourceGuides(page);
    const overlay = buildCompleteTerrainPlacementOverlay(layout);

    assert.equal(overlay.guides.length, expected.length, "no synthetic guides are added");
    assert.equal(overlay.lines.length, expected.length, "one rendered line per source-defined guide");
    assert.equal(overlay.measurements.length, expected.length, "one displayed value per source-defined guide");

    if (page === 18) {
      const renderedOfficial = overlay.guides
        .filter((guide) => guide.value !== '13"')
        .map(sourceSignature)
        .sort();
      const canonicalOfficial = canonical.guides.map(sourceSignature).sort();
      assert.deepEqual(
        renderedOfficial,
        canonicalOfficial,
        "Page 18 preserves every official printed value, edge, and PDF source anchor while remapping only its V2 terrain attachment"
      );
    } else {
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

      const sourceVertices = (layout.terrainGeometry?.[guide.terrain]?.points ?? [])
        .map((point) => [Number(point.x), Number(point.y)]);
      assert.ok(
        sourceVertices.some((vertex) => vertex[0] === guide.anchor[0] && vertex[1] === guide.anchor[1]),
        `${guide.terrain} ${guide.value} snaps to a reproducible terrain corner`
      );
      assert.equal(
        terrainGuideEntersPolygonInterior(guide.anchor, guide.edge, sourceVertices),
        false,
        `${guide.terrain} ${guide.value} ${guide.edge} does not enter its own terrain interior`
      );
    });

    const calloutGuideCount = overlay.callouts.reduce(
      (total, callout) => total + (Array.isArray(callout.lines) ? callout.lines.length : 0),
      0
    );
    assert.equal(calloutGuideCount, overlay.guides.length, "boxed callouts cover source guides without inventing extra values");
    overlay.callouts.forEach((callout) => {
      assert.ok(callout.lines.length >= 1 && callout.lines.length <= 2, "a source point shows only its actual one or two measurements");
      callout.values.forEach((value) => assert.match(value, INCH_VALUE));
    });
  });
}

test("page 18 remaps official PDF source anchors to the intended V2 terrain corners without changing values or edge directions", () => {
  const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === 18);
  const overlay = buildCompleteTerrainPlacementOverlay(layout);

  const findBySource = (value, edge, sourceAnchor) => overlay.guides.find((guide) => (
    guide.value === value
    && guide.edge === edge
    && guide.sourceAnchor?.[0] === sourceAnchor[0]
    && guide.sourceAnchor?.[1] === sourceAnchor[1]
  ));

  assert.deepEqual(
    { terrain: findBySource('24.25"', "right", [35.89, 26.98])?.terrain, anchor: findBySource('24.25"', "right", [35.89, 26.98])?.anchor },
    { terrain: "T4", anchor: [24.2, 17] }
  );
  assert.deepEqual(
    { terrain: findBySource('5"', "right", [55.08, 18.51])?.terrain, anchor: findBySource('5"', "right", [55.08, 18.51])?.anchor },
    { terrain: "T9", anchor: [4.8, 25.4] }
  );
  assert.deepEqual(
    { terrain: findBySource('7"', "bottom", [55.11, 6.96])?.terrain, anchor: findBySource('7"', "bottom", [55.11, 6.96])?.anchor },
    { terrain: "T9", anchor: [4.8, 37] }
  );
  assert.deepEqual(
    { terrain: findBySource('26"', "right", [34.01, 39.07])?.terrain, anchor: findBySource('26"', "right", [34.01, 39.07])?.anchor },
    { terrain: "T6", anchor: [25.9, 5] }
  );
});

test("page 18 keeps the official 26-inch value unique and includes the missing 13-inch source guide", () => {
  const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === 18);
  const overlay = buildCompleteTerrainPlacementOverlay(layout);
  const values = overlay.guides.map((guide) => guide.value);

  assert.equal(values.filter((value) => value === '26"').length, 1, "26 inches appears only at its official Page 18 source location");
  assert.equal(values.filter((value) => value === '13"').length, 1, "the official Page 18 13-inch terrain guide is present");
  assert.equal(values.length, 17, "Page 18 displays the 17 verified terrain-placement dimensions, excluding deployment-zone dimensions");
});

test("pages beyond the verified range do not masquerade as canonical terrain guides", () => {
  for (const layout of (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).filter((item) => Number(item.page) >= 19 && Number(item.page) <= 53)) {
    const overlay = buildCompleteTerrainPlacementOverlay(layout);
    assert.equal(overlay.guides.length, 0, `page ${layout.page} remains unverified`);
    assert.equal(overlay.lines.length, 0, `page ${layout.page} has no synthetic official lines`);
    assert.equal(overlay.measurements.length, 0, `page ${layout.page} has no inferred official values`);
    assert.equal(overlay.callouts.length, 0, `page ${layout.page} has no placement callouts yet`);
  }
});
