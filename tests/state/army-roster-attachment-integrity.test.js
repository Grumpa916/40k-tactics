import test from "node:test";
import assert from "node:assert/strict";
import { validateArmyRoster } from "../../src/rules/army-roster-validation.js";

const base = () => ({
  name: "Attachment integrity test",
  faction: "Space Marines",
  pointsLimit: 2000,
  units: [
    { id: "leader", name: "Test Captain", datasheetId: "space-marines:captain", points: 80, modelCount: 1 },
    { id: "bodyguard", name: "Test Intercessors", datasheetId: "space-marines:intercessor-squad", points: 100, modelCount: 5 }
  ]
});

test("a reciprocal saved leader attachment is not flagged", () => {
  const roster = base();
  roster.units[0].attachedToBodyguardId = "bodyguard";
  roster.units[1].attachedLeaderIds = ["leader"];
  assert.ok(!validateArmyRoster(roster).issues.some(issue => /does not reference|more than once/.test(issue)));
});

test("a one-sided leader attachment is reported rather than silently repaired", () => {
  const roster = base();
  roster.units[0].attachedToBodyguardId = "bodyguard";
  const result = validateArmyRoster(roster);
  assert.equal(result.status, "invalid");
  assert.ok(result.issues.some(issue => /Bodyguard does not reference this Leader/.test(issue)));
  assert.deepEqual(roster.units[1].attachedLeaderIds, undefined);
});

test("a stale bodyguard attachment pointing to another unit is reported", () => {
  const roster = base();
  roster.units[1].attachedLeaderIds = ["leader"];
  const result = validateArmyRoster(roster);
  assert.ok(result.issues.some(issue => /does not reference this Bodyguard/.test(issue)));
});

test("duplicate saved leader ids are rejected without altering the roster", () => {
  const roster = base();
  roster.units[0].attachedToBodyguardId = "bodyguard";
  roster.units[1].attachedLeaderIds = ["leader", "leader"];
  assert.ok(validateArmyRoster(roster).issues.some(issue => /same Leader is attached more than once/.test(issue)));
  assert.equal(roster.units[1].attachedLeaderIds.length, 2);
});
