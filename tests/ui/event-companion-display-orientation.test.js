import test from "node:test";
import assert from "node:assert/strict";

import {
  EVENT_COMPANION_DISPLAY_WIDTH,
  EVENT_COMPANION_DISPLAY_HEIGHT,
  orientEventCompanionPoint,
  orientEventCompanionLine,
  orientEventCompanionEdge,
  eventCompanionDisplayPercent
} from "../../src/ui/event-companion-display-orientation.js";

test("Event Companion display uses a 44 by 60 portrait board with blue at the bottom", () => {
  assert.equal(EVENT_COMPANION_DISPLAY_WIDTH, 44);
  assert.equal(EVENT_COMPANION_DISPLAY_HEIGHT, 60);

  assert.deepEqual(orientEventCompanionPoint({ x: 0, y: 0 }), { x: 44, y: 0 });
  assert.deepEqual(orientEventCompanionPoint({ x: 60, y: 44 }), { x: 0, y: 60 });
  assert.deepEqual(orientEventCompanionPoint({ x: 30, y: 22 }), { x: 22, y: 30 });
});

test("orientation rotates canonical edges back to the Event Companion page sides", () => {
  assert.equal(orientEventCompanionEdge("left"), "bottom");
  assert.equal(orientEventCompanionEdge("right"), "top");
  assert.equal(orientEventCompanionEdge("top"), "left");
  assert.equal(orientEventCompanionEdge("bottom"), "right");
});

test("orientation transforms complete placement lines and percent positions", () => {
  assert.deepEqual(orientEventCompanionLine([0, 10, 20, 10]), [34, 0, 34, 20]);
  assert.deepEqual(eventCompanionDisplayPercent({ x: 0, y: 0 }), { left: 100, top: 100 });
  assert.deepEqual(eventCompanionDisplayPercent({ x: 60, y: 44 }), { left: 0, top: 0 });
});
