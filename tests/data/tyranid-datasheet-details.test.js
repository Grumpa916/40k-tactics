import test from "node:test";
import assert from "node:assert/strict";
import { findArmyUnitCandidates } from "../../src/data/army-unit-catalog.js";

const candidate = (name) => findArmyUnitCandidates({ faction: "Tyranids" }).find((unit) => unit.name === name);

test("Tyranid Prime with Lash Whip has source-reviewed details and fixed points cost", () => {
  const unit = candidate("Tyranid Prime with Lash Whip");
  assert.equal(unit.verificationStatus, "source-reviewed");
  assert.equal(unit.defaultModelCount, 1);
  assert.equal(unit.defaultPoints, 75);
  assert.equal(unit.datasheet.characteristics.Toughness, 5);
  assert.equal(unit.datasheet.weapons.length, 3);
  assert.ok(unit.datasheet.abilities.some((ability) => ability.name === "Alpha Warrior"));
  assert.ok(unit.sourceUrl.includes("40k.app/factions/tyranids/units/tyranid-prime-with-lash-whip"));
  assert.equal(unit.officialRulesCrossCheck, "pending");
});

test("Raveners expose the five-model baseline and army-count cost adjustment", () => {
  const unit = candidate("Raveners");
  assert.equal(unit.verificationStatus, "source-reviewed");
  assert.equal(unit.defaultModelCount, 5);
  assert.equal(unit.defaultPoints, 125);
  assert.deepEqual(unit.pointsOptions.map((option) => option.points), [125, 135]);
  assert.equal(unit.datasheet.weapons[0].abilities, "Twin-linked");
  assert.ok(unit.datasheet.abilities.some((ability) => ability.name === "Death From Below"));
});

test("units without a reviewed profile remain name-only and do not receive invented details", () => {
  const unit = candidate("Tervigon");
  assert.equal(unit.verificationStatus, "name-only-unverified");
  assert.equal(unit.defaultPoints, undefined);
  assert.equal(unit.datasheet, undefined);
});


test("Hive Tyrant profile includes reviewed baseline points and default weapon options", () => {
  const unit = candidate("Hive Tyrant");
  assert.equal(unit.verificationStatus, "source-reviewed");
  assert.equal(unit.defaultPoints, 195);
  assert.equal(unit.datasheet.characteristics.Toughness, 10);
  assert.ok(unit.datasheet.weapons.some((weapon) => weapon.equipment === "Wargear option" && weapon.name === "Heavy venom cannon"));
  assert.ok(unit.datasheet.abilities.some((ability) => ability.name === "Will of the Hive Mind"));
});

test("Neurotyrant profile includes verified attachment targets and sourced details", () => {
  const unit = candidate("Neurotyrant");
  assert.equal(unit.defaultPoints, 130);
  assert.equal(unit.datasheet.characteristics.Wounds, 9);
  assert.ok(unit.datasheet.weapons.some((weapon) => weapon.name === "Psychic scream"));
  assert.ok(unit.datasheet.abilities.some((ability) => ability.name === "Node Lash"));
  assert.deepEqual(unit.datasheet.leader.allowedBodyguardDatasheetIds.sort(), [
    "tyranids:neurogaunts", "tyranids:tyrant-guard", "tyranids:zoanthropes"
  ]);
});

test("Tyrant Guard profile lists model-count point options", () => {
  const unit = candidate("Tyrant Guard");
  assert.equal(unit.defaultModelCount, 3);
  assert.equal(unit.defaultPoints, 80);
  assert.deepEqual(unit.pointsOptions.map((option) => option.points), [80, 160]);
  assert.ok(unit.datasheet.weapons.some((weapon) => weapon.equipment === "Wargear option"));
});
