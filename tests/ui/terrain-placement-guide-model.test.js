import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import { getEventCompanionPlacementOverlay } from "../../src/data/event-companion-placement-guides.js";
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
const COMPLETE_VERIFIED_PAGES = [15, 16, 17, 18];

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

for (const page of COMPLETE_VERIFIED_PAGES) {
  test(`page ${page} provides two placement points and four guides for every terrain shape`, () => {
    const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === page);
    const canonical = getEventCompanionPlacementOverlay(page);
    assert.ok(layout, `page ${page} layout exists`);
    assert.ok(canonical, `page ${page} verified source overlay exists`);

    const terrainNames = Object.keys(layout.terrainGeometry ?? {});
    const terrainCount = terrainNames.length;
    const overlay = buildCompleteTerrainPlacementOverlay(layout);
    const verifiedValues = new Set((canonical.guides ?? []).map((guide) => guide.value));

    assert.equal(overlay.guides.length, terrainCount * 4, "four guides per terrain shape");
    assert.equal(overlay.lines.length, terrainCount * 4, "four rendered lines per terrain shape");
    assert.equal(overlay.measurements.length, terrainCount * 4, "four source-value labels per terrain shape");
    assert.equal(overlay.anchors.length, terrainCount * 2, "two reproducible points per terrain shape");
    assert.equal(overlay.callouts.length, terrainCount * 2, "two paired callouts per terrain shape");

    for (const terrain of terrainNames) {
      assert.equal(overlay.guides.filter((guide) => guide.terrain === terrain).length, 4, `${terrain} has four guides`);
      assert.equal(overlay.anchors.filter((anchor) => anchor.terrain === terrain).length, 2, `${terrain} has two anchors`);
      assert.equal(overlay.callouts.filter((callout) => callout.terrain === terrain).length, 2, `${terrain} has two paired callouts`);
    }

    overlay.guides.forEach((guide, index) => {
      assert.match(guide.value, INCH_VALUE);
      assert.ok(verifiedValues.has(guide.value), `${guide.value} is copied from the page's PDF-backed terrain values`);
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

    overlay.callouts.forEach((callout) => {
      assert.match(callout.horizontalValue, INCH_VALUE);
      assert.match(callout.verticalValue, INCH_VALUE);
      assert.ok(callout.horizontalText.includes(callout.horizontalValue));
      assert.ok(callout.verticalText.includes(callout.verticalValue));
    });
  });
}

test("pages beyond the verified range do not masquerade as canonical terrain guides", () => {
  for (const layout of (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).filter((item) => Number(item.page) >= 19 && Number(item.page) <= 53)) {
    const overlay = buildCompleteTerrainPlacementOverlay(layout);
    assert.equal(overlay.guides.length, 0, `page ${layout.page} remains unverified`);
    assert.equal(overlay.lines.length, 0, `page ${layout.page} has no synthetic official lines`);
    assert.equal(overlay.measurements.length, 0, `page ${layout.page} has no inferred official values`);
    assert.equal(overlay.callouts.length, 0, `page ${layout.page} has no placement callouts yet`);
  }
});
