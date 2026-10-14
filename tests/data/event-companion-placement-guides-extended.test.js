import test from "node:test";
import assert from "node:assert/strict";

import { getEventCompanionPlacementOverlay } from "../../src/data/event-companion-placement-guides.js";
import { getEventCompanionExtendedSourceGuides } from "../../src/data/event-companion-placement-source-guides-extended.js";

function expectedEndpoint(guide) {
  const [x, y] = guide.anchor;
  if (guide.edge === "left") return [0, y];
  if (guide.edge === "right") return [60, y];
  if (guide.edge === "top") return [x, 44];
  return [x, 0];
}

test("extended Event Companion source patterns remain scoped to pages 15 through 53", () => {
  assert.deepEqual(getEventCompanionExtendedSourceGuides(14), []);
  assert.deepEqual(getEventCompanionExtendedSourceGuides(54), []);
});

for (let page = 15; page <= 53; page += 1) {
  test(`page ${page} has valid official terrain-placement source guides`, () => {
    const guides = getEventCompanionExtendedSourceGuides(page);
    assert.ok(guides.length > 0, `page ${page} should have official source guides`);
    assert.ok(guides.every((guide) => typeof guide.value === "string" && guide.value.endsWith('"')), `page ${page} source values should be inch labels`);
    assert.ok(guides.every((guide) => ["left", "right", "top", "bottom"].includes(guide.edge)), `page ${page} source guides should use battlefield edges`);
    assert.ok(guides.every((guide) => Array.isArray(guide.sourceAnchor) && guide.sourceAnchor.length === 2), `page ${page} source guides should have source anchors`);
  });

  test(`page ${page} renders terrain-corner to battlefield-edge guides`, () => {
    const overlay = getEventCompanionPlacementOverlay(page);
    assert.ok(overlay, `page ${page} should render an overlay`);
    assert.equal(overlay.lines.length, overlay.guides.length, `page ${page} line count should match guide count`);
    assert.equal(overlay.measurements.length, overlay.guides.length, `page ${page} measurement count should match guide count`);
    assert.ok(overlay.guides.length > 0, `page ${page} should render at least one guide`);

    for (let index = 0; index < overlay.guides.length; index += 1) {
      const guide = overlay.guides[index];
      const line = overlay.lines[index];
      assert.ok(["left", "right", "top", "bottom"].includes(guide.edge), `page ${page} guide ${index} should use a battlefield edge`);
      assert.ok(Array.isArray(guide.anchor) && guide.anchor.length === 2, `page ${page} guide ${index} should resolve a terrain corner`);
      assert.ok(guide.anchor[0] >= 0 && guide.anchor[0] <= 60, `page ${page} guide ${index} x anchor should stay on the board`);
      assert.ok(guide.anchor[1] >= 0 && guide.anchor[1] <= 44, `page ${page} guide ${index} y anchor should stay on the board`);
      assert.deepEqual(line, [...guide.anchor, ...expectedEndpoint(guide)], `page ${page} guide ${index} line should terminate at its battlefield edge`);
    }
  });
}

test("final Sabotage pages retain their extra official references", () => {
  assert.ok(getEventCompanionExtendedSourceGuides(51).some((guide) => guide.value === '20"'));
  assert.ok(getEventCompanionExtendedSourceGuides(52).some((guide) => guide.value === '19"'));
  assert.ok(getEventCompanionExtendedSourceGuides(52).some((guide) => guide.value === '17"'));
  assert.ok(getEventCompanionExtendedSourceGuides(53).some((guide) => guide.value === '19"'));
});
