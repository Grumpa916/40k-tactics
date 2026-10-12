import test from "node:test";
import assert from "node:assert/strict";
import { findArmyUnitCandidates } from "../../src/data/army-unit-catalog.js";
import { getEligibleBodyguards } from "../../src/state/leader-bodyguard-attachments.js";

const candidates = () => findArmyUnitCandidates({ faction: "Tyranids" });
const unit = (name) => candidates().find((candidate) => candidate.name === name);

test("Tyranid compatibility metadata records source provenance separately from official GW verification", () => {
  const hiveTyrant = unit("Hive Tyrant");
  assert.equal(hiveTyrant.verificationStatus, "source-reviewed");
  assert.equal(hiveTyrant.datasheet.leader.compatibilityReview.status, "source-reviewed");
  assert.equal(hiveTyrant.datasheet.leader.compatibilityReview.officialRulesCrossCheck, "pending");
  assert.equal(hiveTyrant.datasheet.leader.compatibilityReview.reviewedAt, "2026-10-12");
  assert.ok(hiveTyrant.datasheet.leader.compatibilityReview.sources.some((source) => source.includes("40k.app")));
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
      "Tyranid Warriors with Ranged Bio-weapons", "Gargoyles", "Hyperadapted Raveners", "Raveners", "Tervigon"
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
  assert.deepEqual(idsFor("Winged Tyranid Prime"), ["Tyranid Warriors with Ranged Bio-weapons"]);
  const wingedPrime = unit("Winged Tyranid Prime");
  assert.ok(wingedPrime.datasheet.leader.compatibilityReview.sources.includes(
    "https://www.40k.app/factions/tyranids/units/tyranid-warriors-with-ranged-bio-weapons"
  ));
  assert.equal(unit("Gargoyles").verificationStatus, "source-reviewed");
  assert.ok(unit("Gargoyles").datasheet.weapons.some((weapon) => weapon.name === "Fleshborer"));
  assert.equal(unit("Spore Mines").verificationStatus, "source-reviewed");
  assert.ok(unit("Spore Mines").datasheet.abilities.some((ability) => ability.name === "Floating Death"));
  assert.deepEqual(idsFor("Hyperadapted Raveners"), ["Raveners"]);
  assert.equal(unit("Tervigon").verificationStatus, "source-reviewed");
  assert.equal(unit("Tervigon").datasheet.characteristics.Wounds, 16);
  assert.equal(unit("Tervigon").datasheet.leader, undefined);
  assert.equal(unit("Tervigon").datasheet.bodyguard, undefined);
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
