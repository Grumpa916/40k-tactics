import test from "node:test";
import assert from "node:assert/strict";

import {
  getEventCompanionPlacementOverlay,
  PAGE_15_SOURCE_GUIDES,
  PAGE_16_SOURCE_GUIDES,
  PAGE_17_SOURCE_GUIDES,
  PAGE_18_SOURCE_GUIDES,
  PAGE_19_SOURCE_GUIDES
} from "../../src/data/event-companion-placement-guides.js";

function expectedEndpoint(guide) {
  const [x, y] = guide.anchor;
  if (guide.edge === "left") return [0, y];
  if (guide.edge === "right") return [60, y];
  if (guide.edge === "top") return [x, 44];
  return [x, 0];
}

const VERIFIED_PAGES = new Map([
  [15, PAGE_15_SOURCE_GUIDES.length],
  [16, PAGE_16_SOURCE_GUIDES.length],
  [17, PAGE_17_SOURCE_GUIDES.length],
  [18, PAGE_18_SOURCE_GUIDES.length],
  [19, PAGE_19_SOURCE_GUIDES.length]
]);

for (const [page, expectedCount] of VERIFIED_PAGES) {
  test(`page ${page} exposes only its PDF-backed terrain placement guides`, () => {
    const overlay = getEventCompanionPlacementOverlay(page);
    assert.ok(overlay, `page ${page} should render a canonical overlay`);
    assert.equal(overlay.guides.length, expectedCount);
    assert.equal(overlay.lines.length, expectedCount);
    assert.equal(overlay.measurements.length, expectedCount);

    for (let index = 0; index < overlay.guides.length; index += 1) {
      const guide = overlay.guides[index];
      const line = overlay.lines[index];
      assert.ok(["left", "right", "top", "bottom"].includes(guide.edge));
      assert.ok(Array.isArray(guide.anchor) && guide.anchor.length === 2);
      assert.ok(guide.anchor[0] >= 0 && guide.anchor[0] <= 60);
      assert.ok(guide.anchor[1] >= 0 && guide.anchor[1] <= 44);
      assert.deepEqual(line, [...guide.anchor, ...expectedEndpoint(guide)]);
    }
  });
}

test("unverified pages do not expose inferred terrain placement overlays", () => {
  for (let page = 20; page <= 53; page += 1) {
    assert.equal(getEventCompanionPlacementOverlay(page), null, `page ${page} remains source-unverified`);
  }
});
