import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import { buildCompleteTerrainPlacementOverlay } from "../../src/ui/terrain-placement-guide-model.js";
import { orientEventCompanionEdge } from "../../src/ui/event-companion-display-orientation.js";

function page18Overlay() {
  const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === 18);
  assert.ok(layout, "Page 18 layout exists");
  return buildCompleteTerrainPlacementOverlay(layout);
}

function officialGuides(overlay) {
  return overlay.guides.filter((guide) => !guide.mirrored);
}

function guideByValueAndSource(overlay, value, x, y) {
  return officialGuides(overlay).find((guide) => (
    guide.value === value &&
    Number(guide.sourceAnchor?.[0]) === Number(x) &&
    Number(guide.sourceAnchor?.[1]) === Number(y)
  ));
}

test("Page 18 user-verified official guide directions match the Event Companion", () => {
  const overlay = page18Overlay();
  const official = officialGuides(overlay);
  const seventeen = official.filter((guide) => guide.value === '17"');
  const ten = official.find((guide) => guide.value === '10"');
  const nine = official.find((guide) => guide.value === '9"');

  assert.equal(seventeen.length, 2, "Page 18 has two official 17-inch guides");
  seventeen.forEach((guide) => assert.equal(orientEventCompanionEdge(guide.edge), "right"));
  assert.equal(orientEventCompanionEdge(ten?.edge), "left");
  assert.equal(orientEventCompanionEdge(nine?.edge), "bottom");
});

test("Page 18 source anchor and battlefield edge rotate together", () => {
  const overlay = page18Overlay();

  const twentyFourQuarter = guideByValueAndSource(overlay, '24.25"', 35.89, 26.98);
  const twentySix = guideByValueAndSource(overlay, '26"', 34.01, 39.07);
  const fiveLeft = guideByValueAndSource(overlay, '5"', 33.98, 39.07);
  const fiveSevenFive = guideByValueAndSource(overlay, '5"', 55.08, 6.96);
  const fiveSevenSeven = guideByValueAndSource(overlay, '7"', 55.11, 6.96);
  const nineteen = guideByValueAndSource(overlay, '19"', 41.09, 4.00);
  const nineteenFour = guideByValueAndSource(overlay, '4"', 41.05, 4.00);

  assert.equal(orientEventCompanionEdge(twentyFourQuarter?.edge), "bottom", '24.25" points down');
  assert.equal(orientEventCompanionEdge(twentySix?.edge), "bottom", '26" points down');
  assert.equal(orientEventCompanionEdge(fiveLeft?.edge), "left", '5" points left');
  assert.equal(orientEventCompanionEdge(fiveSevenFive?.edge), "bottom", '5" in the 5/7 pair reverses down');
  assert.equal(orientEventCompanionEdge(fiveSevenSeven?.edge), "right", '7" in the 5/7 pair reverses right');
  assert.equal(orientEventCompanionEdge(nineteen?.edge), "bottom", '19" in the 19/4 pair reverses down');
  assert.equal(orientEventCompanionEdge(nineteenFour?.edge), "right", '4" in the 19/4 pair reverses right');
});

test("Page 18 9-inch official guide stays on the small lower-middle terrain object", () => {
  const overlay = page18Overlay();
  const nine = officialGuides(overlay).find((guide) => guide.value === '9"');

  assert.ok(nine, "9-inch guide exists");
  assert.equal(nine.terrain, "T3");
  assert.deepEqual(nine.anchor, [8.8, 21.8]);
});

test("Page 18 mirror copies reuse values and reverse arrows under 180-degree rotation", () => {
  const overlay = page18Overlay();
  const official = officialGuides(overlay);
  const mirrored = overlay.guides.filter((guide) => guide.mirrored);
  const opposite = { left: "right", right: "left", top: "bottom", bottom: "top" };

  assert.ok(mirrored.length > 0, "Page 18 adds mirror copies for blank top-half counterparts");

  for (const copy of mirrored) {
    const source = official.find((guide) => (
      guide.terrain === copy.mirroredFromTerrain &&
      guide.value === copy.value &&
      guide.anchor?.[0] === copy.mirroredFromAnchor?.[0] &&
      guide.anchor?.[1] === copy.mirroredFromAnchor?.[1]
    ));
    assert.ok(source, `${copy.value} mirror has an approved source guide`);
    assert.equal(copy.value, source.value, "mirroring never changes the measurement value");
    assert.equal(copy.edge, opposite[source.edge], `${copy.value} mirror reverses the internal battlefield edge`);
    assert.equal(
      orientEventCompanionEdge(copy.edge),
      opposite[orientEventCompanionEdge(source.edge)],
      `${copy.value} mirror arrow points to the opposite displayed battlefield edge`
    );
  }
});
