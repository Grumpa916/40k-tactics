import test from "node:test";
import assert from "node:assert/strict";

import {
  getEventCompanionTerrainMirrorPolicy,
  transformEventCompanionMirrorGuide
} from "../../src/rules/event-companion-terrain-mirror-policy.js";

test("mirroring is disabled by default until a canonical page receives an approved mirror pass", () => {
  const policy = getEventCompanionTerrainMirrorPolicy(22);
  assert.equal(policy.enabled, false);
  assert.deepEqual(policy.terrainMap, {});
  assert.equal(policy.targetInternalHalf, null);

  assert.deepEqual(
    transformEventCompanionMirrorGuide(22, { anchor: [8, 7], edge: "left" }),
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

test("Page 19 mirror augmentation declares all eight rotational terrain pairs", () => {
  const policy = getEventCompanionTerrainMirrorPolicy(19);
  assert.equal(policy.enabled, true);
  assert.equal(policy.transform, "rotate180");
  assert.equal(policy.targetInternalHalf, null);

  const expectedPairs = {
    T1: "T6",
    T2: "T7",
    T3: "T13",
    T4: "T11",
    T5: "T14",
    T6: "T1",
    T7: "T2",
    T8: "T15",
    T9: "T12",
    T10: "T16",
    T11: "T4",
    T12: "T9",
    T13: "T3",
    T14: "T5",
    T15: "T8",
    T16: "T10"
  };
  assert.deepEqual(policy.terrainMap, expectedPairs);

  assert.deepEqual(
    transformEventCompanionMirrorGuide(19, { anchor: [4.8, 19.9], edge: "left" }),
    { point: [55.2, 24.1], edge: "right" }
  );
});

test("Page 20 mirror augmentation declares all eight rotational terrain pairs", () => {
  const policy = getEventCompanionTerrainMirrorPolicy(20);
  assert.equal(policy.enabled, true);
  assert.equal(policy.transform, "rotate180");
  assert.equal(policy.targetInternalHalf, null);

  const expectedPairs = {
    T1: "T12",
    T2: "T11",
    T3: "T7",
    T4: "T15",
    T5: "T13",
    T6: "T16",
    T7: "T3",
    T8: "T9",
    T9: "T8",
    T10: "T14",
    T11: "T2",
    T12: "T1",
    T13: "T5",
    T14: "T10",
    T15: "T4",
    T16: "T6"
  };
  assert.deepEqual(policy.terrainMap, expectedPairs);

  assert.deepEqual(
    transformEventCompanionMirrorGuide(20, { anchor: [24.2, 17], edge: "bottom" }),
    { point: [35.8, 27], edge: "top" }
  );
});

test("Page 21 mirror augmentation declares all eight rotational terrain pairs", () => {
  const policy = getEventCompanionTerrainMirrorPolicy(21);
  assert.equal(policy.enabled, true);
  assert.equal(policy.transform, "rotate180");
  assert.equal(policy.targetInternalHalf, null);

  const expectedPairs = {
    T1: "T6",
    T2: "T7",
    T3: "T12",
    T4: "T11",
    T5: "T15",
    T6: "T1",
    T7: "T2",
    T8: "T13",
    T9: "T14",
    T10: "T16",
    T11: "T4",
    T12: "T3",
    T13: "T8",
    T14: "T9",
    T15: "T5",
    T16: "T10"
  };
  assert.deepEqual(policy.terrainMap, expectedPairs);

  assert.deepEqual(
    transformEventCompanionMirrorGuide(21, { anchor: [14.6, 3], edge: "bottom" }),
    { point: [45.4, 41], edge: "top" }
  );
});
