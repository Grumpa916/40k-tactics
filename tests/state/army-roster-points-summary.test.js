import test from "node:test";
import assert from "node:assert/strict";
import { summarizeRosterPoints } from "../../src/state/army-roster-points-summary.js";

test("summarizes a complete roster below its points limit", () => {
  assert.deepEqual(summarizeRosterPoints({
    pointsLimit: 2000,
    units: [{ points: 500 }, { points: 725 }, { points: 300 }]
  }), {
    totalPoints: 1525,
    unitsWithoutPoints: 0,
    allUnitCostsSet: true,
    pointsLimit: 2000,
    limitSet: true,
    remainingPoints: 475,
    overLimit: false
  });
});

test("flags a complete roster above its points limit", () => {
  const summary = summarizeRosterPoints({
    pointsLimit: 1000,
    units: [{ points: 650 }, { points: 500 }]
  });
  assert.equal(summary.totalPoints, 1150);
  assert.equal(summary.remainingPoints, -150);
  assert.equal(summary.overLimit, true);
  assert.equal(summary.allUnitCostsSet, true);
});

test("marks totals provisional when one or more unit costs are unset", () => {
  const summary = summarizeRosterPoints({
    pointsLimit: 1000,
    units: [{ points: 400 }, { points: null }, { name: "Manual unit" }, { points: -1 }]
  });
  assert.equal(summary.totalPoints, 400);
  assert.equal(summary.unitsWithoutPoints, 3);
  assert.equal(summary.allUnitCostsSet, false);
  assert.equal(summary.remainingPoints, 600);
  assert.equal(summary.overLimit, false);
});

test("still warns when the known subtotal already exceeds the limit and some costs are unset", () => {
  const summary = summarizeRosterPoints({
    pointsLimit: 1000,
    units: [{ points: 700 }, { points: 450 }, { points: null }]
  });
  assert.equal(summary.totalPoints, 1150);
  assert.equal(summary.unitsWithoutPoints, 1);
  assert.equal(summary.overLimit, true);
  assert.equal(summary.remainingPoints, -150);
});

test("distinguishes an unset points limit from a zero-point limit", () => {
  const unset = summarizeRosterPoints({ pointsLimit: null, units: [{ points: 0 }] });
  assert.equal(unset.limitSet, false);
  assert.equal(unset.remainingPoints, null);
  assert.equal(unset.overLimit, false);

  const zero = summarizeRosterPoints({ pointsLimit: 0, units: [{ points: 0 }] });
  assert.equal(zero.limitSet, true);
  assert.equal(zero.remainingPoints, 0);
  assert.equal(zero.overLimit, false);
});

test("rejects invalid roster input", () => {
  assert.throws(() => summarizeRosterPoints(null), /units array/);
  assert.throws(() => summarizeRosterPoints({ units: {} }), /units array/);
});
