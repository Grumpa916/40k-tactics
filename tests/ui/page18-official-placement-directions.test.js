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

test("Page 18 user-verified official guide directions match the Event Companion", () => {
  const overlay = page18Overlay();
  const seventeen = overlay.guides.filter((guide) => guide.value === '17"');
  const ten = overlay.guides.find((guide) => guide.value === '10"');
  const nine = overlay.guides.find((guide) => guide.value === '9"');

  assert.equal(seventeen.length, 2, "Page 18 has two official 17-inch guides");
  seventeen.forEach((guide) => assert.equal(orientEventCompanionEdge(guide.edge), "right"));
  assert.equal(orientEventCompanionEdge(ten?.edge), "left");
  assert.equal(orientEventCompanionEdge(nine?.edge), "bottom");
});

test("Page 18 9-inch guide stays on the small lower-middle terrain object", () => {
  const overlay = page18Overlay();
  const nine = overlay.guides.find((guide) => guide.value === '9"');

  assert.ok(nine, "9-inch guide exists");
  assert.equal(nine.terrain, "T3");
  assert.deepEqual(nine.anchor, [8.8, 21.8]);
});
