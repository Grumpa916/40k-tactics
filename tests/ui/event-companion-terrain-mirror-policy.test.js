import test from "node:test";
import assert from "node:assert/strict";

import {
  getEventCompanionTerrainMirrorPolicy,
  transformEventCompanionMirrorGuide
} from "../../src/rules/event-companion-terrain-mirror-policy.js";

test("mirroring is disabled by default until a canonical page receives an approved mirror pass", () => {
  const policy = getEventCompanionTerrainMirrorPolicy(19);
  assert.equal(policy.enabled, false);
  assert.deepEqual(policy.terrainMap, {});
  assert.equal(policy.targetInternalHalf, null);

  assert.deepEqual(
    transformEventCompanionMirrorGuide(19, { anchor: [8, 7], edge: "left" }),
    { point: null, edge: "left" }
  );
});

test("Page 18 mirror augmentation remains an explicit 180-degree app-only layer", () => {
  const policy = getEventCompanionTerrainMirrorPolicy(18);
  assert.equal(policy.enabled, true);
  assert.equal(policy.transform, "rotate180");
  assert.equal(policy.terrainMap?.T3, "T15");
  assert.equal(policy.targetInternalHalf, "right");

  assert.deepEqual(
    transformEventCompanionMirrorGuide(18, { anchor: [8.8, 21.8], edge: "left" }),
    { point: [51.2, 22.2], edge: "right" }
  );
});
