import test from "node:test";
import assert from "node:assert/strict";
import { resolveInitialUnitPoints } from "../../src/state/army-roster-unit-costs.js";

test("selects the published cost for a unique matching model count", () => {
  const termagants = {
    defaultModelCount: 10,
    defaultPoints: 55,
    pointsOptions: [{ models: 10, points: 55 }, { models: 20, points: 110 }]
  };
  assert.equal(resolveInitialUnitPoints(termagants, 10), 55);
  assert.equal(resolveInitialUnitPoints(termagants, 20), 110);
});

test("does not reuse the default cost for an unsupported model count", () => {
  const termagants = {
    defaultModelCount: 10,
    defaultPoints: 55,
    pointsOptions: [{ models: 10, points: 55 }, { models: 20, points: 110 }]
  };
  assert.equal(resolveInitialUnitPoints(termagants, 5), null);
});

test("uses the catalog default when several options share its model count", () => {
  const tyrannofex = {
    defaultModelCount: 1,
    defaultPoints: 170,
    pointsOptions: [
      { models: 1, points: 170, condition: "base cost" },
      { models: 1, points: 180, condition: "Acid Spray" },
      { models: 1, points: 190, condition: "Rupture Cannon" }
    ]
  };
  assert.equal(resolveInitialUnitPoints(tyrannofex, 1), 170);
});

test("leaves ambiguous non-default model counts unset", () => {
  const pyrovores = {
    defaultModelCount: 1,
    defaultPoints: 40,
    pointsOptions: [
      { models: 1, points: 40, condition: "first or second unit" },
      { models: 1, points: 50, condition: "third or later unit" },
      { models: 2, points: 70, condition: "first or second unit" },
      { models: 2, points: 80, condition: "third or later unit" }
    ]
  };
  assert.equal(resolveInitialUnitPoints(pyrovores, 1), 40);
  assert.equal(resolveInitialUnitPoints(pyrovores, 2), null);
});

test("rejects invalid candidates and model counts", () => {
  assert.throws(() => resolveInitialUnitPoints(null, 1), /candidate/);
  assert.equal(resolveInitialUnitPoints({ defaultModelCount: 1, defaultPoints: 50 }, 0), null);
  assert.equal(resolveInitialUnitPoints({ defaultModelCount: 1, defaultPoints: 50 }, 1.5), null);
});
