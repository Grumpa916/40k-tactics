import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import {
  PAGE_15_SOURCE_GUIDES,
  PAGE_16_SOURCE_GUIDES,
  PAGE_17_SOURCE_GUIDES,
  PAGE_18_SOURCE_GUIDES
} from "../../src/data/event-companion-placement-guides.js";
import {
  buildCompleteTerrainPlacementOverlay,
  terrainGuideCrossesOwnTerrain,
  terrainGuideEndpoint
} from "../../src/ui/terrain-placement-guide-model.js";
import {
  outwardPerpendicularEdges,
  terrainGuideCrossesPolygonInterior
} from "../../src/ui/terrain-placement-path-safety.js";

const INCH_VALUE = /^\d+(?:\.\d+)?"$/;
const VERIFIED_COUNTS = new Map([
  [15, PAGE_15_SOURCE_GUIDES.length],
  [16, PAGE_16_SOURCE_GUIDES.length],
  [17, PAGE_17_SOURCE_GUIDES.length],
  [18, PAGE_18_SOURCE_GUIDES.length]
]);

test("terrain path safety rejects a guide that rides along the terrain boundary", () => {
  const square = [[2, 2], [4, 2], [4, 4], [2, 4]];
  assert.equal(terrainGuideCrossesPolygonInterior([4, 2], "left", square), true);
  assert.equal(terrainGuideCrossesPolygonInterior([2, 2], "left", square), false);
});

test("outward perpendicular routing chooses edges that leave the terrain cleanly", () => {
  const square = [[2, 2], [4, 2], [4, 4], [2, 4]];
  assert.deepEqual(outwardPerpendicularEdges([4, 2], square), ["right", "bottom"]);
  assert.deepEqual(outwardPerpendicularEdges([2, 2], square), ["left", "bottom"]);
});

for (const [page, expectedCount] of VERIFIED_COUNTS) {
  test(`page ${page} uses only the PDF-backed terrain placement guides`, () => {
    const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === page);
    assert.ok(layout, `page ${page} layout exists`);

    const overlay = buildCompleteTerrainPlacementOverlay(layout);
    assert.equal(overlay.guides.length, expectedCount);
    assert.equal(overlay.lines.length, expectedCount);
    assert.equal(overlay.measurements.length, expectedCount);
    assert.ok(overlay.anchors.length > 0);
    assert.equal(overlay.callouts.length, 0, "synthetic paired callouts are not used");

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
        terrainGuideCrossesOwnTerrain(layout, guide),
        false,
        `${guide.terrain} ${guide.value} ${guide.edge} does not pass through its own terrain footprint`
      );
    });
  });
}

test("pages beyond the verified range do not masquerade as canonical terrain guides", () => {
  for (const layout of (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).filter((item) => Number(item.page) >= 19 && Number(item.page) <= 53)) {
    const overlay = buildCompleteTerrainPlacementOverlay(layout);
    assert.equal(overlay.guides.length, 0, `page ${layout.page} remains unverified`);
    assert.equal(overlay.lines.length, 0, `page ${layout.page} has no synthetic official lines`);
    assert.equal(overlay.measurements.length, 0, `page ${layout.page} has no inferred official values`);
  }
});
