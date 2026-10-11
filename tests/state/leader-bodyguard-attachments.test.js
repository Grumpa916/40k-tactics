import test from "node:test";
import assert from "node:assert/strict";
import { attachLeaderToBodyguard, detachLeaderFromBodyguard, getEligibleBodyguards } from "../../src/state/leader-bodyguard-attachments.js";

function fixture() {
  return { id: "roster", name: "Test", updatedAt: null, units: [
    { id: "leader", name: "Captain", datasheetId: "captain", dataSource: { status: "accepted" }, datasheet: { leader: { isLeader: true, allowedBodyguardDatasheetIds: ["intercessors"] } } },
    { id: "bodyguard", name: "Intercessors", datasheetId: "intercessors", datasheet: { bodyguard: { canReceiveLeader: true } } },
    { id: "bodyguard-2", name: "Intercessors 2", datasheetId: "intercessors", datasheet: { bodyguard: { canReceiveLeader: true } } },
    { id: "other", name: "Terminators", datasheetId: "terminators", datasheet: {} }
  ] };
}

test("only source-verified compatible Bodyguards are eligible", () => {
  const roster = fixture();
  assert.deepEqual(getEligibleBodyguards(roster, "leader").map((unit) => unit.id), ["bodyguard", "bodyguard-2"]);
  roster.units[0].dataSource.status = "name-only-unverified";
  assert.deepEqual(getEligibleBodyguards(roster, "leader"), []);
});

test("attach and detach preserve a two-way relationship", () => {
  const attached = attachLeaderToBodyguard(fixture(), "leader", "bodyguard", { updatedAt: "now" });
  assert.equal(attached.units.find((unit) => unit.id === "leader").attachedToBodyguardId, "bodyguard");
  assert.deepEqual(attached.units.find((unit) => unit.id === "bodyguard").attachedLeaderIds, ["leader"]);
  const detached = detachLeaderFromBodyguard(attached, "leader");
  assert.equal(detached.units.find((unit) => unit.id === "leader").attachedToBodyguardId, undefined);
  assert.equal(detached.units.find((unit) => unit.id === "bodyguard").attachedLeaderIds, undefined);
});

test("reassignment is rejected without corrupting either relationship", () => {
  const attached = attachLeaderToBodyguard(fixture(), "leader", "bodyguard");
  assert.throws(
    () => attachLeaderToBodyguard(attached, "leader", "bodyguard-2"),
    /already attached.*detach it before reassignment/
  );
  assert.equal(attached.units.find((unit) => unit.id === "leader").attachedToBodyguardId, "bodyguard");
  assert.deepEqual(attached.units.find((unit) => unit.id === "bodyguard").attachedLeaderIds, ["leader"]);
  assert.equal(attached.units.find((unit) => unit.id === "bodyguard-2").attachedLeaderIds, undefined);
  const detached = detachLeaderFromBodyguard(attached, "leader");
  assert.equal(detached.units.find((unit) => unit.id === "leader").attachedToBodyguardId, undefined);
  assert.equal(detached.units.find((unit) => unit.id === "bodyguard").attachedLeaderIds, undefined);
  assert.equal(detached.units.find((unit) => unit.id === "bodyguard-2").attachedLeaderIds, undefined);
});

test("Bodyguard capacity is enforced", () => {
  const roster = fixture();
  const bodyguard = roster.units.find((unit) => unit.id === "bodyguard");
  bodyguard.attachedLeaderIds = ["another-leader"];
  bodyguard.datasheet.bodyguard.maxAttachedLeaders = 1;
  assert.deepEqual(getEligibleBodyguards(roster, "leader").map((unit) => unit.id), ["bodyguard-2"]);
  assert.throws(() => attachLeaderToBodyguard(roster, "leader", "bodyguard"), /not verified as legal/);
});

test("unknown or incompatible pairings are rejected rather than guessed", () => {
  assert.throws(() => attachLeaderToBodyguard(fixture(), "leader", "other"), /not verified as legal/);
  const roster = fixture();
  roster.units[0].dataSource.status = "name-only-unverified";
  assert.throws(() => attachLeaderToBodyguard(roster, "leader", "bodyguard"), /not verified as legal/);
});

test("missing roster units and self-attachment are rejected", () => {
  assert.throws(() => getEligibleBodyguards(fixture(), "missing"), /Leader unit not found/);
  assert.throws(() => attachLeaderToBodyguard(fixture(), "leader", "leader"), /cannot join itself/);
});
