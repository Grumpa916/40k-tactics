import test from "node:test";
import assert from "node:assert/strict";

import {
  getEventCompanionTerrainMirrorPolicy,
  transformEventCompanionMirrorGuide
} from "../../src/rules/event-companion-terrain-mirror-policy.js";

test("Page 26 confirmation-2 mirror policy declares every audited rotational terrain counterpart", () => {
  const policy = getEventCompanionTerrainMirrorPolicy(26);

  assert.equal(policy.enabled, true);
  assert.equal(policy.transform, "rotate180");
  assert.equal(policy.targetInternalHalf, null);
  assert.deepEqual(policy.terrainMap, {
    T1: "T8",
    T2: "T3",
    T3: "T2",
    T4: "T12",
    T5: "T13",
    T6: "T7",
    T7: "T6",
    T8: "T1",
    T9: "T14",
    T10: "T15",
    T11: "T16",
    T12: "T4",
    T13: "T5",
    T14: "T9",
    T15: "T10",
    T16: "T11"
  });
});

test("Page 26 mirror transform rotates source point and battlefield edge together", () => {
  assert.deepEqual(
    transformEventCompanionMirrorGuide(26, { anchor: [8, 7], edge: "left" }),
    { point: [52, 37], edge: "right" }
  );
});
