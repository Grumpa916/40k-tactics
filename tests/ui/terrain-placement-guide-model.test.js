import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import { EVENT_COMPANION_PAGE_MEASUREMENT_VALUES } from "../../src/data/event-companion-page-measurement-values.js";
import { getEventCompanionExtendedSourceGuides } from "../../src/data/event-companion-placement-source-guides-extended.js";
import {
  buildCompleteTerrainPlacementGuides,
  buildCompleteTerrainPlacementOverlay,
  terrainGuideCrossesOwnTerrain,
  terrainGuideEndpoint
} from "../../src/ui/terrain-placement-guide-model.js";

function isHorizontal(edge) {
  return edge === "left" || edge === "right";
}

function isVertical(edge) {
  return edge === "top" || edge === "bottom";
}

const INCH_VALUE = /^\d+(?:\.\d+)?"$/;

for (const layout of (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).filter((item) => Number(item.page) >= 14 && Number(item.page) <= 53)) {
  test(`page ${layout.page} gives every terrain shape two complete placement points`, () => {
    const terrainEntries = Object.entries(layout.terrainGeometry ?? {}).filter(([, shape]) => (shape?.points ?? []).length >= 2);
    const points = buildCompleteTerrainPlacementGuides(layout);
    const overlay = buildCompleteTerrainPlacementOverlay(layout);

    assert.equal(points.length, terrainEntries.length * 2);
    assert.equal(overlay.anchors.length, terrainEntries.length * 2);
    assert.equal(overlay.guides.length, terrainEntries.length * 4);
    assert.equal(overlay.lines.length, terrainEntries.length * 4);
    assert.equal(overlay.measurements.length, terrainEntries.length * 4);
    assert.equal(overlay.callouts.length, Number(layout.page) >= 15 ? terrainEntries.length * 2 : 0);

    for (const [terrain, shape] of terrainEntries) {
      const terrainPoints = points.filter((point) => point.terrain === terrain);
      assert.equal(terrainPoints.length, 2, `${terrain} has points A and B`);
      assert.deepEqual(terrainPoints.map((point) => point.point).sort(), ["A", "B"]);

      const sourceVertices = (shape.points ?? []).map((point) => [Number(point.x), Number(point.y)]);
      for (const point of terrainPoints) {
        assert.ok(sourceVertices.some((vertex) => vertex[0] === point.anchor[0] && vertex[1] === point.anchor[1]), `${terrain} ${point.point} uses a reproducible terrain vertex`);
        assert.equal(point.edges.length, 2);
        assert.ok(point.edges.some(isHorizontal), `${terrain} ${point.point} has a horizontal edge measurement`);
        assert.ok(point.edges.some(isVertical), `${terrain} ${point.point} has a vertical edge measurement`);

        if (Number(layout.page) >= 15) {
          for (const edge of point.edges) {
            assert.equal(
              terrainGuideCrossesOwnTerrain(layout, { terrain, anchor: point.anchor, edge }),
              false,
              `${terrain} ${point.point} ${edge} guide does not pass through its own terrain footprint`
            );
          }

          const callout = overlay.callouts.find((item) => item.terrain === terrain && item.point === point.point);
          assert.ok(callout, `${terrain} ${point.point} has one paired callout`);
          assert.match(callout.horizontalValue, INCH_VALUE);
          assert.match(callout.verticalValue, INCH_VALUE);
          assert.ok(/[←→]/.test(callout.horizontalText), `${terrain} ${point.point} callout identifies the horizontal edge`);
          assert.ok(/[↑↓]/.test(callout.verticalText), `${terrain} ${point.point} callout identifies the vertical edge`);
          assert.ok(Number.isFinite(callout.x) && callout.x >= 0 && callout.x <= 60);
          assert.ok(Number.isFinite(callout.y) && callout.y >= 0 && callout.y <= 44);
          assert.equal(callout.anchorX, point.anchor[0]);
          assert.equal(callout.anchorY, point.anchor[1]);
          assert.ok(
            callout.x !== point.anchor[0] || callout.y !== point.anchor[1],
            `${terrain} ${point.point} callout is not placed directly on its measured corner`
          );
        }
      }
    }

    overlay.guides.forEach((guide, index) => {
      const [x, y] = guide.anchor;
      assert.deepEqual(overlay.lines[index], [x, y, ...terrainGuideEndpoint(guide.anchor, guide.edge)]);
      assert.match(guide.value, INCH_VALUE);
      if (Number(layout.page) >= 15) {
        assert.equal(
          terrainGuideCrossesOwnTerrain(layout, guide),
          false,
          `page ${layout.page} ${guide.terrain} ${guide.point} ${guide.edge} guide is obstacle-safe`
        );
        assert.ok(
          (EVENT_COMPANION_PAGE_MEASUREMENT_VALUES[Number(layout.page)] ?? []).includes(guide.value),
          `page ${layout.page} uses only values printed in the Event Companion`
        );

        const edgeValues = getEventCompanionExtendedSourceGuides(layout.page)
          .filter((sourceGuide) => sourceGuide.edge === guide.edge)
          .map((sourceGuide) => sourceGuide.value);
        if (edgeValues.length) {
          assert.ok(
            edgeValues.includes(guide.value),
            `page ${layout.page} ${guide.edge} guide uses a value printed for that battlefield edge`
          );
        }
      }
    });
  });
}
