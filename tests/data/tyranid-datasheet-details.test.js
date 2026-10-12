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
  const unit = candidate("Gargoyles");
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


test("Winged Hive Tyrant profile exposes its sourced default equipment, wargear options, and points", () => {
  const unit = candidate("Winged Hive Tyrant");
  assert.equal(unit.verificationStatus, "source-reviewed");
  assert.equal(unit.defaultPoints, 185);
  assert.equal(unit.datasheet.characteristics.Move, '12"');
  assert.ok(unit.datasheet.weapons.some((weapon) => weapon.name === "Tyrant talons" && weapon.equipment === "Default"));
  assert.ok(unit.datasheet.weapons.some((weapon) => weapon.name === "Heavy venom cannon" && weapon.equipment === "Wargear option"));
  assert.equal(unit.officialRulesCrossCheck, "pending");
});

test("Lictor and Deathleaper profiles contain source-reviewed melee data and abilities", () => {
  const lictor = candidate("Lictor");
  assert.equal(lictor.defaultPoints, 60);
  assert.equal(lictor.datasheet.characteristics.Toughness, 6);
  assert.ok(lictor.datasheet.abilities.some((ability) => ability.name === "Lone Operative"));

  const deathleaper = candidate("Deathleaper");
  assert.equal(deathleaper.defaultPoints, 80);
  assert.equal(deathleaper.datasheet.characteristics.Wounds, 7);
  assert.ok(deathleaper.datasheet.abilities.some((ability) => ability.name === "Fear of the Unseen"));
});

test("Tervigon and Tyrannofex profiles expose source-reviewed monster characteristics and options", () => {
  const tervigon = candidate("Tervigon");
  assert.equal(tervigon.defaultPoints, 160);
  assert.equal(tervigon.datasheet.characteristics.Wounds, 16);
  assert.ok(tervigon.datasheet.abilities.some((ability) => ability.name === "Spawn Termagants"));

  const tyrannofex = candidate("Tyrannofex");
  assert.equal(tyrannofex.defaultPoints, 180);
  assert.equal(tyrannofex.datasheet.characteristics.Toughness, 12);
  assert.ok(tyrannofex.pointsOptions.some((option) => option.condition?.includes("Acid Spray")));
  assert.ok(tyrannofex.datasheet.weapons.some((weapon) => weapon.name === "Rupture cannon"));
});

test("Tyranid Warriors with Ranged Bio-weapons expose sourced profiles and unit-size costs", () => {
  const unit = candidate("Tyranid Warriors with Ranged Bio-weapons");
  assert.equal(unit.verificationStatus, "source-reviewed");
  assert.equal(unit.defaultModelCount, 3);
  assert.equal(unit.defaultPoints, 60);
  assert.deepEqual(unit.pointsOptions.map((option) => option.points), [60, 120]);
  assert.ok(unit.datasheet.weapons.some((weapon) => weapon.name === "Venom cannon"));
  assert.ok(unit.datasheet.abilities.some((ability) => ability.name === "Adaptable Predators"));
  assert.equal(unit.officialRulesCrossCheck, "pending");
});


test("Barbgaunts and Biovores expose sourced profiles and unit-size point options", () => {
  const barbgaunts = candidate("Barbgaunts");
  assert.equal(barbgaunts.defaultModelCount, 5);
  assert.equal(barbgaunts.defaultPoints, 55);
  assert.deepEqual(barbgaunts.pointsOptions.map((option) => option.points), [55, 110]);
  assert.ok(barbgaunts.datasheet.abilities.some((ability) => ability.name === "Disruption Bombardment"));

  const biovores = candidate("Biovores");
  assert.equal(biovores.defaultPoints, 60);
  assert.deepEqual(biovores.pointsOptions.map((option) => option.points), [60, 100, 140]);
  assert.ok(biovores.datasheet.abilities.some((ability) => ability.name === "Seed Spore Mines"));
});

test("Hive Guard and Neurolictor expose sourced weapon profiles and abilities", () => {
  const hiveGuard = candidate("Hive Guard");
  assert.equal(hiveGuard.defaultPoints, 80);
  assert.deepEqual(hiveGuard.pointsOptions.slice(0, 2).map((option) => option.points), [80, 160]);
  assert.ok(hiveGuard.datasheet.weapons.some((weapon) => weapon.name === "Impaler cannon"));
  assert.ok(hiveGuard.datasheet.abilities.some((ability) => ability.name === "Defensive Stance"));

  const neurolictor = candidate("Neurolictor");
  assert.equal(neurolictor.defaultPoints, 80);
  assert.equal(neurolictor.datasheet.characteristics.Wounds, 7);
  assert.ok(neurolictor.datasheet.abilities.some((ability) => ability.name === "Psychological Saboteur"));
});

test("Pyrovores, Von Ryan's Leapers, and Ripper Swarms expose sourced model options", () => {
  const pyrovores = candidate("Pyrovores");
  assert.equal(pyrovores.defaultPoints, 45);
  assert.deepEqual(pyrovores.pointsOptions.slice(0, 3).map((option) => option.points), [45, 65, 95]);
  assert.ok(pyrovores.datasheet.weapons.some((weapon) => weapon.name === "Flamespurt"));

  const leapers = candidate("Von Ryan’s Leapers");
  assert.equal(leapers.defaultModelCount, 3);
  assert.deepEqual(leapers.pointsOptions.map((option) => option.points), [55, 105]);
  assert.ok(leapers.datasheet.abilities.some((ability) => ability.name === "Fights First"));

  const ripperSwarms = candidate("Ripper Swarms");
  assert.equal(ripperSwarms.defaultPoints, 30);
  assert.deepEqual(ripperSwarms.pointsOptions.map((option) => option.points), [30, 40, 50]);
  assert.equal(ripperSwarms.datasheet.characteristics["Objective Control"], 0);
});

test("Parasite of Mortrex and the three monster profiles expose sourced abilities and costs", () => {
  const parasite = candidate("Parasite of Mortrex");
  assert.equal(parasite.defaultPoints, 70);
  assert.ok(parasite.datasheet.abilities.some((ability) => ability.name === "Parasitic Infection"));

  const exocrine = candidate("Exocrine");
  assert.equal(exocrine.defaultPoints, 140);
  assert.equal(exocrine.datasheet.characteristics.Wounds, 14);
  assert.ok(exocrine.datasheet.abilities.some((ability) => ability.name === "Symbiotic Targeting"));

  const haruspex = candidate("Haruspex");
  assert.equal(haruspex.defaultPoints, 125);
  assert.ok(haruspex.datasheet.weapons.some((weapon) => weapon.name === "Shovelling claws"));

  const maleceptor = candidate("Maleceptor");
  assert.equal(maleceptor.defaultPoints, 190);
  assert.equal(maleceptor.datasheet.characteristics["Invulnerable save"], "4+");

  const psychophage = candidate("Psychophage");
  assert.equal(psychophage.defaultPoints, 110);
  assert.equal(psychophage.datasheet.characteristics["Feel No Pain"], "5+");
});


test("The Red Terror and Mucolid Spores expose source-reviewed profiles", () => {
  const redTerror = candidate("The Red Terror");
  assert.equal(redTerror.defaultPoints, 130);
  assert.equal(redTerror.datasheet.characteristics.Wounds, 9);
  assert.ok(redTerror.datasheet.abilities.some((ability) => ability.name === "Swallow Whole"));

  const mucolidSpores = candidate("Mucolid Spores");
  assert.equal(mucolidSpores.defaultPoints, 30);
  assert.deepEqual(mucolidSpores.pointsOptions.map((option) => option.points), [30, 60]);
  assert.ok(mucolidSpores.datasheet.abilities.some((ability) => ability.name === "Floating Death"));
});

test("Mawloc, Norn Assimilator, Norn Emissary, and Toxicrene expose sourced profiles", () => {
  const mawloc = candidate("Mawloc");
  assert.equal(mawloc.defaultPoints, 135);
  assert.equal(mawloc.datasheet.characteristics.Wounds, 14);
  assert.ok(mawloc.datasheet.abilities.some((ability) => ability.name === "Terror From The Deep"));

  const assimilator = candidate("Norn Assimilator");
  assert.equal(assimilator.defaultPoints, 250);
  assert.deepEqual(assimilator.pointsOptions.map((option) => option.points), [250, 270]);
  assert.ok(assimilator.datasheet.abilities.some((ability) => ability.name === "Harpoon Barbs"));

  const emissary = candidate("Norn Emissary");
  assert.equal(emissary.defaultPoints, 250);
  assert.equal(emissary.datasheet.characteristics["Invulnerable save"], "4+");
  assert.ok(emissary.datasheet.abilities.some((ability) => ability.name === "Unnatural Resilience"));

  const toxicrene = candidate("Toxicrene");
  assert.equal(toxicrene.defaultPoints, 120);
  assert.ok(toxicrene.datasheet.weapons.some((weapon) => weapon.name === "Massive toxic lashes (Ranged)"));
  assert.ok(toxicrene.datasheet.abilities.some((ability) => ability.name === "Hypertoxic Miasma"));
});

test("The Tyranid roster picker includes the remaining current faction candidates", () => {
  const names = new Set(findArmyUnitCandidates({ faction: "Tyranids" }).map((unit) => unit.name));
  for (const name of ["The Red Terror", "Mucolid Spores", "Spore Mines", "Venomthropes", "Harpy", "Hive Crone", "Harridan", "Hierophant", "Tyrannocyte", "Sporocyst", "Trygon", "Screamer-Killer", "Mawloc", "Norn Assimilator", "Norn Emissary", "Toxicrene"]) {
    assert.ok(names.has(name), `missing Tyranid candidate: ${name}`);
  }
});
