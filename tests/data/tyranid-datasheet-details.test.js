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
  assert.deepEqual([...unit.datasheet.leader.allowedBodyguardDatasheetIds].sort(), [
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


test("Broodlord profile includes its Genestealer attachment and points", () => {
  const unit = candidate("Broodlord");
  assert.equal(unit.defaultPoints, 80);
  assert.equal(unit.datasheet.characteristics.Toughness, 5);
  assert.ok(unit.datasheet.abilities.some((ability) => ability.name === "Vicious Insight"));
  assert.deepEqual(unit.datasheet.leader.allowedBodyguardDatasheetIds, ["tyranids:genestealers"]);
});

test("Old One Eye and Carnifexes have sourced profiles and point options", () => {
  const oldOneEye = candidate("Old One Eye");
  assert.equal(oldOneEye.defaultPoints, 140);
  assert.ok(oldOneEye.datasheet.abilities.some((ability) => ability.name === "Alpha Leader"));
  assert.deepEqual(oldOneEye.datasheet.leader.allowedBodyguardDatasheetIds, ["tyranids:carnifexes"]);

  const carnifexes = candidate("Carnifexes");
  assert.equal(carnifexes.defaultPoints, 90);
  assert.deepEqual(carnifexes.pointsOptions.map((option) => option.points), [90, 180]);
  assert.ok(carnifexes.datasheet.weapons.some((weapon) => weapon.equipment === "Wargear option"));
});


test("The Swarmlord profile includes its current points and Tyrant Guard pairing", () => {
  const unit = candidate("The Swarmlord");
  assert.equal(unit.defaultPoints, 210);
  assert.equal(unit.datasheet.characteristics.Toughness, 10);
  assert.ok(unit.datasheet.abilities.some((ability) => ability.name === "Hive Commander"));
  assert.deepEqual(unit.datasheet.leader.allowedBodyguardDatasheetIds, ["tyranids:tyrant-guard"]);
});

test("Neurogaunts and Zoanthropes expose sourced model-count point options", () => {
  const neurogaunts = candidate("Neurogaunts");
  assert.equal(neurogaunts.defaultModelCount, 11);
  assert.equal(neurogaunts.defaultPoints, 45);
  assert.deepEqual(neurogaunts.pointsOptions.map((option) => option.points), [45, 90]);
  assert.ok(neurogaunts.datasheet.abilities.some((ability) => ability.name === "Neurocytes"));

  const zoanthropes = candidate("Zoanthropes");
  assert.equal(zoanthropes.defaultModelCount, 3);
  assert.equal(zoanthropes.defaultPoints, 100);
  assert.deepEqual(zoanthropes.pointsOptions.map((option) => option.points), [100, 200]);
  assert.ok(zoanthropes.datasheet.weapons.some((weapon) => weapon.name === "Warp Blast (focused witchfire)"));
});

test("Termagants expose 10- and 20-model point options and their Leader pairing", () => {
  const unit = candidate("Termagants");
  assert.equal(unit.defaultModelCount, 10);
  assert.equal(unit.defaultPoints, 60);
  assert.deepEqual(unit.pointsOptions.map((option) => option.points), [60, 110]);
  assert.ok(unit.datasheet.weapons.some((weapon) => weapon.name === "Strangleweb"));
  assert.deepEqual(unit.datasheet.bodyguard.compatibilityReview.status, "source-reviewed");
});
