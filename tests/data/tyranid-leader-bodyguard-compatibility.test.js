import test from "node:test";
import assert from "node:assert/strict";
import { findArmyUnitCandidates } from "../../src/data/army-unit-catalog.js";
import { getEligibleBodyguards } from "../../src/state/leader-bodyguard-attachments.js";

const candidates = () => findArmyUnitCandidates({ faction: "Tyranids" });
const unit = (name) => candidates().find((candidate) => candidate.name === name);

test("Tyranid compatibility metadata records reviewed source provenance separately from full datasheet verification", () => {
  const hiveTyrant = unit("Hive Tyrant");
  assert.equal(hiveTyrant.verificationStatus, "name-only-unverified");
  assert.equal(hiveTyrant.datasheet.leader.compatibilityReview.status, "cross-checked");
  assert.equal(hiveTyrant.datasheet.leader.compatibilityReview.reviewedAt, "2026-10-12");
  assert.ok(hiveTyrant.datasheet.leader.compatibilityReview.sources.some((source) => source.includes("mfm.warhammer-community.com")));
});

test("Tyranid Leaders expose only source-reviewed Bodyguard pairings", () => {
  const roster = {
    id: "tyranid-test",
    name: "Tyranid test",
    units: candidates().filter((candidate) => [
      "Hive Tyrant", "Neurotyrant", "Broodlord", "The Swarmlord", "Old One Eye",
      "Tyranid Prime with Lash Whip", "Winged Tyranid Prime", "Tyrant Guard",
      "Neurogaunts", "Zoanthropes", "Genestealers", "Carnifexes", "Hormagaunts",
      "Termagants", "Tyranid Warriors with Melee Bio-weapons",
      "Tyranid Warriors with Ranged Bio-weapons", "Gargoyles", "Tervigon"
    ].includes(candidate.name)).map((candidate) => ({
      id: "roster-" + candidate.id,
      name: candidate.name,
      datasheetId: candidate.id,
      datasheet: candidate.datasheet ?? null,
      dataSource: { status: candidate.verificationStatus }
    }))
  };
  const idsFor = (leaderName) => {
    const leader = roster.units.find((candidate) => candidate.name === leaderName);
    return getEligibleBodyguards(roster, leader.id).map((candidate) => candidate.name).sort();
  };

  assert.deepEqual(idsFor("Hive Tyrant"), ["Tyrant Guard"]);
  assert.deepEqual(idsFor("Neurotyrant"), ["Neurogaunts", "Tyrant Guard", "Zoanthropes"]);
  assert.deepEqual(idsFor("Broodlord"), ["Genestealers"]);
  assert.deepEqual(idsFor("The Swarmlord"), ["Tyrant Guard"]);
  assert.deepEqual(idsFor("Old One Eye"), ["Carnifexes"]);
  assert.deepEqual(idsFor("Tyranid Prime with Lash Whip"), [
    "Hormagaunts", "Termagants", "Tyranid Warriors with Melee Bio-weapons",
    "Tyranid Warriors with Ranged Bio-weapons"
  ]);
  assert.deepEqual(idsFor("Winged Tyranid Prime"), [
    "Gargoyles", "Tyranid Warriors with Melee Bio-weapons",
    "Tyranid Warriors with Ranged Bio-weapons"
  ]);
  assert.equal(unit("Tervigon").datasheet, undefined);
});

test("unreviewed Tyranid candidates cannot be used as Bodyguards", () => {
  const leader = unit("Hive Tyrant");
  const bodyguard = unit("Tyrant Guard");
  const roster = {
    id: "tyranid-test",
    name: "Tyranid test",
    units: [
      { id: "leader", name: leader.name, datasheetId: leader.id, datasheet: leader.datasheet },
      { id: "bodyguard", name: bodyguard.name, datasheetId: bodyguard.id, datasheet: { bodyguard: { canReceiveLeader: true } } }
    ]
  };
  assert.deepEqual(getEligibleBodyguards(roster, "leader"), []);
});
