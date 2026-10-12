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
  assert.ok(unit.sourceUrl.includes("warhammer-community.com"));
  assert.equal(unit.officialRulesCrossCheck, "verified");
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
  assert.equal(unit.defaultPoints, 120);
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
  assert.deepEqual(unit.pointsOptions.map((option) => option.points), [80, 170]);
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
  assert.equal(oldOneEye.defaultPoints, 130);
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
  assert.equal(zoanthropes.defaultPoints, 90);
  assert.deepEqual(zoanthropes.pointsOptions.map((option) => option.points), [90, 190]);
  assert.ok(zoanthropes.datasheet.weapons.some((weapon) => weapon.name === "Warp Blast (focused witchfire)"));
});

test("Termagants expose 10- and 20-model point options and their Leader pairing", () => {
  const unit = candidate("Termagants");
  assert.equal(unit.defaultModelCount, 10);
  assert.equal(unit.defaultPoints, 55);
  assert.deepEqual(unit.pointsOptions.map((option) => option.points), [55, 110]);
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
  assert.equal(tervigon.defaultPoints, 150);
  assert.equal(tervigon.datasheet.characteristics.Wounds, 16);
  assert.ok(tervigon.datasheet.abilities.some((ability) => ability.name === "Spawn Termagants"));

  const tyrannofex = candidate("Tyrannofex");
  assert.equal(tyrannofex.defaultPoints, 170);
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
  assert.equal(barbgaunts.defaultPoints, 50);
  assert.deepEqual(barbgaunts.pointsOptions.map((option) => option.points), [50, 100]);
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
  assert.equal(pyrovores.defaultPoints, 40);
  assert.deepEqual(pyrovores.pointsOptions.slice(0, 3).map((option) => option.points), [40, 70, 100]);
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
  assert.equal(parasite.defaultPoints, 65);
  assert.ok(parasite.datasheet.abilities.some((ability) => ability.name === "Parasitic Infection"));

  const exocrine = candidate("Exocrine");
  assert.equal(exocrine.defaultPoints, 135);
  assert.equal(exocrine.datasheet.characteristics.Wounds, 14);
  assert.ok(exocrine.datasheet.abilities.some((ability) => ability.name === "Symbiotic Targeting"));

  const haruspex = candidate("Haruspex");
  assert.equal(haruspex.defaultPoints, 125);
  assert.ok(haruspex.datasheet.weapons.some((weapon) => weapon.name === "Shovelling claws"));

  const maleceptor = candidate("Maleceptor");
  assert.equal(maleceptor.defaultPoints, 180);
  assert.equal(maleceptor.datasheet.characteristics["Invulnerable save"], "4+");

  const psychophage = candidate("Psychophage");
  assert.equal(psychophage.defaultPoints, 110);
  assert.equal(psychophage.datasheet.characteristics["Feel No Pain"], "5+");
});


test("The Red Terror and Mucolid Spores expose source-reviewed profiles", () => {
  const redTerror = candidate("The Red Terror");
  assert.equal(redTerror.defaultPoints, 120);
  assert.equal(redTerror.datasheet.characteristics.Wounds, 9);
  assert.ok(redTerror.datasheet.abilities.some((ability) => ability.name === "Swallow Whole"));

  const mucolidSpores = candidate("Mucolid Spores");
  assert.equal(mucolidSpores.defaultPoints, 30);
  assert.deepEqual(mucolidSpores.pointsOptions.map((option) => option.points), [30, 60]);
  assert.ok(mucolidSpores.datasheet.abilities.some((ability) => ability.name === "Floating Death"));
});

test("Mawloc, Norn Assimilator, Norn Emissary, and Toxicrene expose sourced profiles", () => {
  const mawloc = candidate("Mawloc");
  assert.equal(mawloc.defaultPoints, 130);
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


test("Hormagaunts and Genestealers expose sourced infantry profiles and unit-size points", () => {
  const hormagaunts = candidate("Hormagaunts");
  assert.equal(hormagaunts.defaultPoints, 70);
  assert.deepEqual(hormagaunts.pointsOptions.slice(0, 2).map((option) => option.points), [70, 120]);
  assert.ok(hormagaunts.datasheet.abilities.some((ability) => ability.name === "Bounding Leap"));

  const genestealers = candidate("Genestealers");
  assert.equal(genestealers.defaultPoints, 75);
  assert.equal(genestealers.datasheet.characteristics["Invulnerable save"], "5+");
  assert.ok(genestealers.datasheet.abilities.some((ability) => ability.name === "Vanguard Predator"));
});

test("Gargoyles and melee Tyranid Warriors expose sourced profiles", () => {
  const gargoyles = candidate("Gargoyles");
  assert.equal(gargoyles.defaultModelCount, 10);
  assert.equal(gargoyles.defaultPoints, 75);
  assert.deepEqual(gargoyles.pointsOptions.map((option) => option.points), [75, 150]);
  assert.ok(gargoyles.datasheet.weapons.some((weapon) => weapon.name === "Fleshborer"));
  assert.ok(gargoyles.datasheet.abilities.some((ability) => ability.name === "Winged Swarm"));

  const warriors = candidate("Tyranid Warriors with Melee Bio-weapons");
  assert.equal(warriors.defaultPoints, 75);
  assert.deepEqual(warriors.pointsOptions.map((option) => option.points), [75, 150]);
  assert.ok(warriors.datasheet.weapons.some((weapon) => weapon.abilities === "Twin-linked"));
  assert.ok(warriors.datasheet.abilities.some((ability) => ability.name === "Adaptive Instincts"));
});

test("Venomthropes and Trygon expose sourced profiles", () => {
  const venomthropes = candidate("Venomthropes");
  assert.equal(venomthropes.defaultModelCount, 3);
  assert.deepEqual(venomthropes.pointsOptions.map((option) => option.points), [55, 110]);
  assert.ok(venomthropes.datasheet.abilities.some((ability) => ability.name === "Foul Spores"));

  const trygon = candidate("Trygon");
  assert.equal(trygon.defaultPoints, 135);
  assert.deepEqual(trygon.pointsOptions.map((option) => option.points), [135]);
  assert.equal(trygon.datasheet.characteristics.Wounds, 14);
  assert.ok(trygon.datasheet.abilities.some((ability) => ability.name === "Subterranean Tunnels"));
});

test("Winged Tyranid Prime profile includes source-reviewed equipment and abilities", () => {
  const prime = candidate("Winged Tyranid Prime");
  assert.equal(prime.defaultPoints, 65);
  assert.equal(prime.datasheet.characteristics.Wounds, 6);
  assert.ok(prime.datasheet.weapons.some((weapon) => weapon.name === "Prime talons"));
  assert.ok(prime.datasheet.abilities.some((ability) => ability.name === "Death Blow"));
});

test("Harpy, Hive Crone, Tyrannocyte, Hierophant, and Harridan expose sourced profiles", () => {
  const harpy = candidate("Harpy");
  assert.equal(harpy.defaultPoints, 185);
  assert.equal(harpy.datasheet.characteristics.Move, "—");
  assert.ok(harpy.datasheet.abilities.some((ability) => ability.name === "Spore Mine Cysts"));

  const hiveCrone = candidate("Hive Crone");
  assert.equal(hiveCrone.defaultPoints, 170);
  assert.ok(hiveCrone.datasheet.weapons.some((weapon) => weapon.name === "Tentaclids"));

  const tyrannocyte = candidate("Tyrannocyte");
  assert.equal(tyrannocyte.defaultPoints, 80);
  assert.ok(tyrannocyte.datasheet.abilities.some((ability) => ability.name === "Aerial Seeding"));

  const hierophant = candidate("Hierophant");
  assert.equal(hierophant.defaultPoints, 810);
  assert.equal(hierophant.datasheet.characteristics.Wounds, 30);

  const harridan = candidate("Harridan");
  assert.equal(harridan.defaultPoints, 610);
  assert.ok(harridan.datasheet.abilities.some((ability) => ability.name === "Frenzied Metabolism"));
});


test("Hyperadapted Raveners expose the Ravener Prime and Ravener profile and current unit-count costs", () => {
  const unit = candidate("Hyperadapted Raveners");
  assert.equal(unit.defaultModelCount, 5);
  assert.equal(unit.defaultPoints, 165);
  assert.deepEqual(unit.pointsOptions.map((option) => option.points), [165, 175]);
  assert.ok(unit.pointsOptions[1].condition.includes("3rd+"));
  assert.equal(unit.datasheet.modelProfiles.find((model) => model.name === "Ravener Prime").Wounds, 6);
  assert.equal(unit.datasheet.modelProfiles.find((model) => model.name === "Raveners").Wounds, 3);
  assert.ok(unit.datasheet.weapons.some((weapon) => weapon.name === "Venom bolt"));
  assert.ok(unit.datasheet.abilities.some((ability) => ability.name === "Alpha Invader"));
  assert.equal(unit.officialRulesCrossCheck, "pending");
});

test("Tyranid catalog contains no duplicate candidate names", () => {
  const names = findArmyUnitCandidates({ faction: "Tyranids" }).map((unit) => unit.name);
  assert.equal(new Set(names).size, names.length);
});


test("Screamer-Killer, Spore Mines, and Sporocyst now have complete source-reviewed profiles", () => {
  const screamerKiller = candidate("Screamer-Killer");
  assert.equal(screamerKiller.verificationStatus, "source-reviewed");
  assert.equal(screamerKiller.defaultPoints, 125);
  assert.equal(screamerKiller.datasheet.characteristics.Wounds, 10);
  assert.ok(screamerKiller.datasheet.weapons.some((weapon) => weapon.name === "Bio-plasmic scream"));
  assert.ok(screamerKiller.datasheet.abilities.some((ability) => ability.name === "Death Scream"));

  const sporeMines = candidate("Spore Mines");
  assert.equal(sporeMines.verificationStatus, "source-reviewed");
  assert.equal(sporeMines.defaultModelCount, 3);
  assert.deepEqual(sporeMines.pointsOptions.map((option) => option.points), [55, 110]);
  assert.equal(sporeMines.datasheet.characteristics["Objective Control"], 0);
  assert.ok(sporeMines.datasheet.abilities.some((ability) => ability.name === "Floating Death"));

  const sporocyst = candidate("Sporocyst");
  assert.equal(sporocyst.verificationStatus, "source-reviewed");
  assert.equal(sporocyst.defaultPoints, 145);
  assert.equal(sporocyst.datasheet.characteristics.Toughness, 10);
  assert.ok(sporocyst.datasheet.weapons.some((weapon) => weapon.name === "Sporocyst bio-weapons"));
  assert.ok(sporocyst.datasheet.abilities.some((ability) => ability.name === "Seed Mucolids"));
  for (const unit of [screamerKiller, sporeMines, sporocyst]) assert.equal(unit.officialRulesCrossCheck, "pending");
});


test("All five remaining Tyranid Legends units have complete, labeled profiles", () => {
  const profiles = [
    ["Malanthrope", 75, 10, "Grasping tail"],
    ["Barbed Hierodule", 340, 18, "Bio-cannon"],
    ["Dimachaeron", 200, 16, "Massive scything sickle-talons"],
    ["Scythed Hierodule", 330, 18, "Bio-acid spray"],
    ["Sky-slasher Swarms", 60, 4, "Spinemaws"]
  ];
  for (const [name, points, wounds, weaponName] of profiles) {
    const unit = candidate(name);
    assert.equal(unit.verificationStatus, "source-reviewed", name);
    assert.equal(unit.defaultPoints, points, name);
    assert.equal(unit.datasheet.characteristics.Wounds, wounds, name);
    assert.ok(unit.datasheet.weapons.some((weapon) => weapon.name === weaponName), name);
    assert.ok(unit.datasheet.keywords.includes("Legends"), name);
    assert.ok(unit.sourceName.includes("Legends"), name);
    assert.equal(unit.officialRulesCrossCheck, "verified", name);
    assert.ok(unit.sourceUrl.includes("warhammer-community.com"), name);
  }
  const requiredAbilities = {
    "Malanthrope": ["Leader", "Stealth", "Shadow in the Warp", "Synapse", "Enhanced Toxic Miasma", "Prey Adaptation"],
    "Barbed Hierodule": ["Deadly Demise D6", "Synapse", "Overgrown Barbs", "Damaged: 1-6 Wounds Remaining"],
    "Dimachaeron": ["Deadly Demise D6", "Synapse", "Digestion Spine", "Damaged: 1-5 Wounds Remaining"],
    "Scythed Hierodule": ["Deadly Demise D6", "Synapse", "Irresistible Force", "Damaged: 1-6 Wounds Remaining"],
    "Sky-slasher Swarms": ["Deep Strike", "Synapse", "Chitinous Horrors"]
  };
  for (const [name, abilities] of Object.entries(requiredAbilities)) {
    const unit = candidate(name);
    for (const ability of abilities) {
      assert.ok(unit.datasheet.abilities.some((entry) => entry.name === ability), `${name} missing ${ability}`);
    }
  }
});

test("Infiltrators and all Deadly Demise variants have actionable descriptions", () => {
  const infiltrators = candidate("Lictor").datasheet.abilities.find((ability) => ability.name === "Infiltrators");
  assert.match(infiltrators.description, /During deployment/);
  assert.match(infiltrators.description, /more than 8 inches horizontally/);

  for (const [unitName, abilityName, amount] of [
    ["Norn Assimilator", "Deadly Demise D6", "D6 mortal wounds"],
    ["Hierophant", "Deadly Demise 2D6", "2D6 mortal wounds"],
    ["Carnifexes", "Deadly Demise 1", "1 mortal wound"]
  ]) {
    const ability = candidate(unitName).datasheet.abilities.find((item) => item.name === abilityName);
    assert.ok(ability, unitName);
    assert.match(ability.description, /after any embarked units make emergency disembark moves/, unitName);
    assert.ok(ability.description.includes(amount), unitName);
  }
});

test("No Tyranid profile relies on generic core-rule placeholders", () => {
  for (const unit of findArmyUnitCandidates({ faction: "Tyranids" })) {
    for (const ability of unit.datasheet.abilities ?? []) {
      assert.doesNotMatch(
        ability.description,
        /consult (?:the )?current (?:Core Rules|rules)/i,
        `${unit.name}: ${ability.name}`
      );
    }
  }
});

test("Shared Tyranid core ability summaries match current 11th-edition core rules", () => {
  const shadow = candidate("Hive Tyrant").datasheet.abilities.find((ability) => ability.name === "Shadow in the Warp");
  assert.match(shadow.description, /Once per battle/);
  assert.match(shadow.description, /either player's Command phase/);
  assert.match(shadow.description, /subtract 1 from each such test/);

  const synapse = candidate("Hive Tyrant").datasheet.abilities.find((ability) => ability.name === "Synapse");
  assert.match(synapse.description, /6 inches/);
  assert.match(synapse.description, /3D6 instead of 2D6/);
  assert.match(synapse.description, /adds 1 to the Strength/);

  const deepStrike = candidate("Raveners").datasheet.abilities.find((ability) => ability.name === "Deep Strike");
  assert.match(deepStrike.description, /ingress move/);
  assert.match(deepStrike.description, /more than 8 inches horizontally/);

  const loneOperative = candidate("Lictor").datasheet.abilities.find((ability) => ability.name === "Lone Operative");
  assert.match(loneOperative.description, /cannot see it unless they are within 12 inches/);
  assert.match(loneOperative.description, /Indirect Fire weapons/);

  const stealth = candidate("Lictor").datasheet.abilities.find((ability) => ability.name === "Stealth");
  assert.match(stealth.description, /benefit of cover/);
  assert.doesNotMatch(stealth.description, /subtract 1 from Hit rolls/);

  const deadlyDemise = candidate("Haruspex").datasheet.abilities.find((ability) => ability.name === "Deadly Demise D3");
  assert.match(deadlyDemise.description, /On a 6/);
  assert.match(deadlyDemise.description, /D3 mortal wounds/);
});

test("The Red Terror matches the current 11th-edition listing while retaining unresolved source status", () => {
  const unit = candidate("The Red Terror");
  assert.deepEqual(unit.datasheet.characteristics, {
    Move: '10"',
    Toughness: 8,
    Save: "3+",
    Wounds: 9,
    Leadership: "8+",
    "Objective Control": 3
  });
  assert.deepEqual(unit.datasheet.keywords, [
    "Burrower", "Character", "Epic Hero", "Great Devourer", "Monster", "Mobile", "The Red Terror", "Vanguard Invader"
  ]);
  assert.ok(unit.datasheet.abilities.some((ability) => ability.name === "Serpentine Fiend"));
  assert.ok(unit.datasheet.keywords.includes("Mobile"));
  assert.equal(unit.sourceName, "Current 11th-edition The Red Terror datasheet listing");
  assert.equal(unit.officialRulesCrossCheck, "pending");
});

test("Imperial Armour profiles match current official Frame keywords and damaged rules", () => {
  for (const name of ["Barbed Hierodule", "Dimachaeron", "Scythed Hierodule", "Harridan", "Hierophant"]) {
    const unit = candidate(name);
    assert.ok(unit.datasheet.keywords.includes("Frame"), name);
    assert.equal(unit.officialRulesCrossCheck, "verified", name);
    assert.ok(unit.sourceUrl.includes("warhammer-community.com"), name);
  }
  const harridan = candidate("Harridan");
  assert.ok(harridan.datasheet.abilities.some((ability) => ability.name === "Hover"));
  const hierophant = candidate("Hierophant");
  const damaged = hierophant.datasheet.abilities.find((ability) => ability.name === "Damaged: 1-10 Wounds Remaining");
  assert.ok(damaged);
  assert.match(damaged.description, /subtract 6 from this model’s Objective Control characteristic/);
});

test("Carnifexes include all current 11th-edition weapon profiles", () => {
  const carnifexes = candidate("Carnifexes");
  const weapons = carnifexes.datasheet.weapons;
  const crushingClaws = weapons.find((weapon) => weapon.name === "Carnifex crushing claws");
  assert.ok(crushingClaws);
  assert.deepEqual(
    [crushingClaws.range, crushingClaws.attacks, crushingClaws.skill, crushingClaws.strength, crushingClaws.ap, crushingClaws.damage],
    ["Melee", 4, "4+", 12, -3, "D6+1"]
  );
  const spineBanks = weapons.find((weapon) => weapon.name === "Spine banks");
  assert.ok(spineBanks);
  assert.deepEqual(
    [spineBanks.range, spineBanks.attacks, spineBanks.skill, spineBanks.strength, spineBanks.ap, spineBanks.damage, spineBanks.abilities],
    ['6"', 5, "4+", 5, 0, 1, "Assault"]
  );
  const stranglethorn = weapons.find((weapon) => weapon.name === "Stranglethorn cannon");
  assert.ok(stranglethorn);
  assert.deepEqual(
    [stranglethorn.range, stranglethorn.attacks, stranglethorn.skill, stranglethorn.strength, stranglethorn.ap, stranglethorn.damage, stranglethorn.abilities],
    ['36"', "D6+1", "4+", 7, -1, 2, "Blast"]
  );
});

test("Tyranid ability descriptions preserve targeting and range restrictions", () => {
  const harpy = candidate("Harpy");
  const cysts = harpy.datasheet.abilities.find((ability) => ability.name === "Spore Mine Cysts");
  assert.ok(cysts);
  assert.match(cysts.description, /excluding Lone Operative units/);

  const mucolid = candidate("Mucolid Spores");
  const floatingDeath = mucolid.datasheet.abilities.find((ability) => ability.name === "Floating Death");
  assert.ok(floatingDeath);
  assert.match(floatingDeath.description, /select one of those enemy units/);

  const tervigon = candidate("Tervigon");
  const progenitor = tervigon.datasheet.abilities.find((ability) => ability.name === "Brood Progenitor");
  assert.match(progenitor.description, /within 6 inches of this model/);

  const norn = candidate("Norn Assimilator");
  const barbs = norn.datasheet.abilities.find((ability) => ability.name === "Harpoon Barbs");
  assert.match(barbs.description, /within Engagement Range of this model/);
});

test("Raveners use the current singular Burrower keyword and official ability casing", () => {
  const raveners = candidate("Raveners");
  assert.ok(raveners.datasheet.keywords.includes("Burrower"));
  assert.ok(!raveners.datasheet.keywords.includes("Burrowers"));
  assert.ok(raveners.datasheet.abilities.some((ability) => ability.name === "Death From Below"));

  const hyperadapted = candidate("Hyperadapted Raveners");
  assert.ok(hyperadapted.datasheet.keywords.includes("Burrower"));
  assert.ok(!hyperadapted.datasheet.keywords.includes("Burrowers"));
});

test("Hyperadapted Raveners include Hypersensory Array and Parasite infection timing", () => {
  const hyperadapted = candidate("Hyperadapted Raveners");
  const hypersensory = hyperadapted.datasheet.abilities.find((ability) => ability.name === "Hypersensory Array");
  assert.ok(hypersensory);
  assert.match(hypersensory.description, /Rapid Ingress or Heroic Intervention Stratagem/);
  assert.match(hypersensory.description, /costs 1 fewer CP/);

  const parasite = candidate("Parasite of Mortrex");
  const infection = parasite.datasheet.abilities.find((ability) => ability.name === "Parasitic Infection");
  assert.ok(infection);
  assert.match(infection.description, /after this model has finished making its attacks/);
  assert.match(infection.description, /you can add one new Ripper Swarms unit/);
});

test("Harpy includes both twin cannons and Tyrannocyte preserves all Aerial Seeding restrictions", () => {
  const harpy = candidate("Harpy");
  const heavyVenomCannon = harpy.datasheet.weapons.find((weapon) => weapon.name === "Twin heavy venom cannon");
  assert.ok(heavyVenomCannon);
  assert.equal(heavyVenomCannon.range, '36"');
  assert.equal(heavyVenomCannon.attacks, "D3");
  assert.equal(heavyVenomCannon.skill, "3+");
  assert.equal(heavyVenomCannon.strength, 9);
  assert.equal(heavyVenomCannon.ap, -2);
  assert.equal(heavyVenomCannon.damage, 3);
  assert.equal(heavyVenomCannon.abilities, "Blast, Twin-linked");

  const tyrannocyte = candidate("Tyrannocyte");
  const aerialSeeding = tyrannocyte.datasheet.abilities.find((ability) => ability.name === "Aerial Seeding");
  assert.ok(aerialSeeding);
  assert.match(aerialSeeding.description, /are counted towards any limits placed on the maximum number of Reserves units/);
  assert.match(aerialSeeding.description, /no units can embark within it/);
});

test("Psychophage retains Feel No Pain; Deathleaper and Toxicrene use current listed abilities", () => {
  const psychophage = candidate("Psychophage");
  assert.equal(psychophage.datasheet.characteristics["Feel No Pain"], "5+");
  assert.ok(psychophage.datasheet.abilities.some((ability) => ability.name === "Feel No Pain 5+"));
  assert.ok(psychophage.datasheet.abilities.some((ability) => ability.name === "Bio-stimulus"));
  assert.ok(psychophage.datasheet.abilities.some((ability) => ability.name === "Feeding Frenzy"));

  const deathleaper = candidate("Deathleaper");
  assert.ok(!deathleaper.datasheet.abilities.some((ability) => ability.name === "Hunter Organism"));
  assert.ok(deathleaper.datasheet.abilities.some((ability) => ability.name === "Fear of the Unseen"));

  const toxicrene = candidate("Toxicrene");
  const tendrils = toxicrene.datasheet.abilities.find((ability) => ability.name === "Grasping Tendrils");
  assert.ok(tendrils);
  assert.match(tendrils.description, /you can roll one D6: on a 3\+/);
});

test("Hive Tyrant includes Onslaught and Old One Eye has no unsupported Feel No Pain profile", () => {
  const hiveTyrant = candidate("Hive Tyrant");
  const onslaught = hiveTyrant.datasheet.abilities.find((ability) => ability.name === "Onslaught");
  assert.ok(onslaught);
  assert.match(onslaught.description, /Assault and Lethal Hits/);

  const oldOneEye = candidate("Old One Eye");
  assert.equal(oldOneEye.datasheet.characteristics["Feel No Pain"], undefined);
  assert.ok(!oldOneEye.datasheet.abilities.some((ability) => ability.name === "Feel No Pain 5+"));
  assert.ok(oldOneEye.datasheet.abilities.some((ability) => ability.name === "Alpha Leader"));
  assert.ok(oldOneEye.datasheet.abilities.some((ability) => ability.name === "Unstoppable Monster"));
});

test("Tyranid Prime with Lash Whip matches current official datasheet", () => {
  const unit = candidate("Tyranid Prime with Lash Whip");
  assert.deepEqual(unit.datasheet.characteristics, {
    Move: '10"',
    Toughness: 5,
    Save: "3+",
    Wounds: 6,
    Leadership: "7+",
    "Objective Control": 1
  });
  assert.equal(unit.datasheet.weapons.length, 3);
  assert.ok(unit.datasheet.abilities.some((ability) => ability.name === "Aggressive Leader-beast"));
  assert.equal(unit.officialRulesCrossCheck, "verified");
});

test("Raveners match current official datasheet and keywords", () => {
  const unit = candidate("Raveners");
  assert.deepEqual(unit.datasheet.characteristics, {
    Move: '10"',
    Toughness: 5,
    Save: "4+",
    Wounds: 3,
    Leadership: "8+",
    "Objective Control": 1
  });
  assert.deepEqual(unit.datasheet.keywords, [
    "Burrower", "Great Devourer", "Infantry", "Raveners", "Vanguard Invader"
  ]);
  assert.equal(unit.datasheet.weapons[0].abilities, "Twin-linked");
  assert.ok(unit.datasheet.abilities.some((ability) => ability.name === "Death from Below"));
  assert.equal(unit.officialRulesCrossCheck, "verified");
});

test("Tyranid roster points match official Munitorum Field Manual v1.5", () => {
  const expected = [
    ["Barbgaunts", 50, [50, 100]],
    ["Exocrine", 135, [135, 145]],
    ["Gargoyles", 75, [75, 150]],
    ["Maleceptor", 180, [180, 190]],
    ["Mawloc", 130, [130]],
    ["Neurotyrant", 120, [120]],
    ["Old One Eye", 130, [130]],
    ["Parasite of Mortrex", 65, [65]],
    ["Pyrovores", 40, [40, 50, 70, 80, 100, 110]],
    ["Termagants", 55, [55, 110]],
    ["Tervigon", 150, [150]],
    ["The Red Terror", 120, [120]],
    ["Trygon", 135, [135]],
    ["Tyrannofex", 170, [170, 180, 190, 200]],
    ["Tyrant Guard", 80, [80, 170]],
    ["Zoanthropes", 90, [90, 190]]
  ];
  for (const [name, points, expectedOptions] of expected) {
    const unit = candidate(name);
    assert.equal(unit.defaultPoints, points, name);
    assert.deepEqual([...new Set(unit.pointsOptions.map((option) => option.points))].sort((a, b) => a - b), expectedOptions, name);
    assert.equal(unit.pointsSourceName, "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", name);
    assert.ok(unit.pointsSourceUrl.includes("warhammer-community.com"), name);
  }
});

test("Every Tyranid profile records official MFM v1.5 points provenance", () => {
  for (const unit of findArmyUnitCandidates({ faction: "Tyranids" })) {
    assert.equal(unit.pointsSourceName, "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", unit.name);
    assert.ok(unit.pointsSourceUrl?.includes("warhammer-community.com"), unit.name);
  }
});

test("Every Tyranid catalog candidate has a profile record", async () => {
  const { getTyranidDatasheetDetails } = await import("../../src/data/tyranid-datasheet-details.js");
  const names = findArmyUnitCandidates({ faction: "Tyranids" }).map((unit) => unit.name);
  assert.equal(new Set(names).size, names.length);
  for (const unit of findArmyUnitCandidates({ faction: "Tyranids" })) {
    assert.ok(getTyranidDatasheetDetails(unit.id), `missing detail record: ${unit.name}`);
  }
});
