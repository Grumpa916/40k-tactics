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

test("extended Event Companion source patterns cover pages 15 through 53 only", () => {
  assert.deepEqual(getEventCompanionExtendedSourceGuides(14), []);
  assert.deepEqual(getEventCompanionExtendedSourceGuides(54), []);
  for (let page = 15; page <= 53; page += 1) {
    const guides = getEventCompanionExtendedSourceGuides(page);
    assert.ok(guides.length > 0, `page ${page} should have official source guides`);
    assert.ok(guides.every((guide) => typeof guide.value === "string" && guide.value.endsWith('"')));
    assert.ok(guides.every((guide) => ["left", "right", "top", "bottom"].includes(guide.edge)));
    assert.ok(guides.every((guide) => Array.isArray(guide.sourceAnchor) && guide.sourceAnchor.length === 2));
  }
});

test("pages 15 through 53 render only terrain-corner to battlefield-edge guides", () => {
  for (let page = 15; page <= 53; page += 1) {
    const overlay = getEventCompanionPlacementOverlay(page);
    assert.ok(overlay, `page ${page} should render an overlay`);
    assert.equal(overlay.lines.length, overlay.guides.length);
    assert.equal(overlay.measurements.length, overlay.guides.length);
    assert.ok(overlay.guides.length > 0);

    for (let index = 0; index < overlay.guides.length; index += 1) {
      const guide = overlay.guides[index];
      const line = overlay.lines[index];
      assert.ok(["left", "right", "top", "bottom"].includes(guide.edge));
      assert.ok(Array.isArray(guide.anchor) && guide.anchor.length === 2);
      assert.ok(guide.anchor[0] >= 0 && guide.anchor[0] <= 60);
      assert.ok(guide.anchor[1] >= 0 && guide.anchor[1] <= 44);
      assert.deepEqual(line, [...guide.anchor, ...expectedEndpoint(guide)]);
    }
  }
});

test("final Sabotage pages retain their extra official references", () => {
  assert.ok(getEventCompanionExtendedSourceGuides(51).some((guide) => guide.value === '20"'));
  assert.ok(getEventCompanionExtendedSourceGuides(52).some((guide) => guide.value === '19"'));
  assert.ok(getEventCompanionExtendedSourceGuides(52).some((guide) => guide.value === '17"'));
  assert.ok(getEventCompanionExtendedSourceGuides(53).some((guide) => guide.value === '19"'));
});
