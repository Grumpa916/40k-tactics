import test from 'node:test';
import assert from 'node:assert/strict';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';
import { matchWargearSelection, validateWargearLoadout } from '../../src/rules/wargear-loadout-validation.js';
import { getTyranidDatasheetDetails } from '../../src/data/tyranid-datasheet-details.js';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';

function unit(datasheetId, modelCount, entries) {
  return {
    datasheetId, modelCount,
    equippedWargear: entries.map(([name, quantity]) => ({ name, quantity }))
  };
}

test('Termagant unit-wide baseline choice and one-per-ten specials are validated', () => {
  const valid = unit('tyranids:termagants', 10, [
    ['Chitinous claws and teeth', 10], ['Fleshborer', 9], ['Spike rifle', 1]
  ]);
  assert.equal(validateWargearLoadout(valid).status, 'rules-reviewed-valid');

  const mixed = unit('tyranids:termagants', 10, [
    ['Chitinous claws and teeth', 10], ['Fleshborer', 7], ['Spike rifle', 1],
    ['Termagant devourer', 1], ['Termagant spinefists', 1]
  ]);
  const result = validateWargearLoadout(mixed);
  assert.equal(result.status, 'rules-invalid');
  assert.ok(result.errors.some((error) => /unit-wide choice/i.test(error)));
});

test('Carnifex replacement slots reject more selected replacements than legal slots', () => {
  const invalid = unit('tyranids:carnifexes', 2, [
    ['Chitinous claws and teeth', 2], ['Carnifex extra scything talons', 1],
    ['Carnifex scything talons', 2], ['Carnifex crushing claws', 1],
    ['Deathspitters with slimer maggots', 1], ['Devourers with brainleech worms', 1],
    ['Heavy venom cannon', 1], ['Bio-plasma', 1], ['Spine banks', 1]
  ]);
  const result = validateWargearLoadout(invalid);
  assert.equal(result.status, 'rules-invalid');
  assert.ok(result.errors.some((error) => /slot weapons total|replacement slots/i.test(error)));
});

test('reviewed rules validate common Hive Tyrant, Tyrannofex and ranged Warrior loadouts', () => {
  assert.equal(validateWargearLoadout(unit('tyranids:hive-tyrant', 1, [
    ['Monstrous bonesword and lash whip', 1], ['Monstrous scything talons', 1]
  ])).status, 'rules-reviewed-valid');
  assert.equal(validateWargearLoadout(unit('tyranids:tyrannofex', 1, [
    ['Powerful limbs', 1], ['Rupture cannon', 1], ['Stinger salvoes', 1]
  ])).status, 'rules-reviewed-valid');
  assert.equal(validateWargearLoadout(unit('tyranids:tyranid-warriors-with-ranged-bio-weapons', 3, [
    ['Devourer', 3], ['Tyranid Warrior claws and talons', 3]
  ])).status, 'rules-reviewed-valid');
});

test('Sky-slasher Spinemaws are optional per model, not default all-or-none equipment', () => {
  for (let spinemaws = 0; spinemaws <= 3; spinemaws += 1) {
    const entries = [['Claws and teeth', 3]];
    if (spinemaws) entries.push(['Spinemaws', spinemaws]);
    assert.equal(validateWargearLoadout(unit('tyranids:sky-slasher-swarms', 3, entries)).status, 'rules-reviewed-valid');
  }
  const tooMany = validateWargearLoadout(unit('tyranids:sky-slasher-swarms', 3, [
    ['Claws and teeth', 3], ['Spinemaws', 4]
  ]));
  assert.equal(tooMany.status, 'rules-invalid');
  assert.ok(tooMany.errors.some((error) => /Spinemaws.*maximum 3/i.test(error)));

  const skySlashers = findArmyUnitCandidates({ faction: 'Tyranids' }).find((candidate) => candidate.id === 'tyranids:sky-slasher-swarms');
  assert.equal(skySlashers.datasheet.weapons.find((weapon) => weapon.name === 'Spinemaws').equipment, 'Wargear option');
  assert.equal(skySlashers.datasheet.weapons.find((weapon) => weapon.name === 'Claws and teeth').equipment, 'Default');
});

test('one imported equipment selection can map to multiple attack profiles', () => {
  const tervigon = getTyranidDatasheetDetails('tyranids:tervigon');
  const talons = matchWargearSelection({ datasheetId: 'tyranids:tervigon', datasheet: tervigon, sourceName: 'Massive scything talons' });
  assert.deepEqual(talons.profileNames, ['Massive scything talons (strike)', 'Massive scything talons (sweep)']);

  const oldOneEye = getTyranidDatasheetDetails('tyranids:old-one-eye');
  const claws = matchWargearSelection({ datasheetId: 'tyranids:old-one-eye', datasheet: oldOneEye, sourceName: 'Old One Eye’s claws and talons' });
  assert.equal(claws.match, 'profile-group');
  assert.equal(claws.profileNames.length, 2);

  const norn = getTyranidDatasheetDetails('tyranids:norn-emissary');
  const tendril = matchWargearSelection({ datasheetId: 'tyranids:norn-emissary', datasheet: norn, sourceName: 'Psychic Tendril' });
  assert.equal(tendril.profileNames.length, 3);

  const zoans = getTyranidDatasheetDetails('tyranids:zoanthropes');
  const blast = matchWargearSelection({ datasheetId: 'tyranids:zoanthropes', datasheet: zoans, sourceName: 'Warp Blast' });
  assert.equal(blast.profileNames.length, 2);
});

test('Warhammer App plural Genestealers weapon name maps to canonical profile', () => {
  const genestealers = getTyranidDatasheetDetails('tyranids:genestealers');
  const matched = matchWargearSelection({
    datasheetId: 'tyranids:genestealers',
    datasheet: genestealers,
    sourceName: 'Genestealers claws and talons'
  });
  assert.equal(matched.name, 'Genestealer claws and talons');
  assert.deepEqual(matched.profileNames, ['Genestealer claws and talons']);
  assert.equal(matched.match, 'singular-plural-profile');
});

test('large Warhammer App fixture produces a persistent wargear audit and reviewed valid loadouts', async () => {
  const { readFile } = await import('node:fs/promises');
  const text = await readFile(new URL('../fixtures/warhammer-app-large-validation-roster.txt', import.meta.url), 'utf8');
  const result = importWarhammerAppRoster({ text, faction: 'Tyranids', name: 'Audit army', pointsLimit: 3000, id: 'audit' });
  assert.equal(result.roster.units.length, 52);
  assert.equal(result.sourceErrors.length, 5);
  assert.equal(result.wargearAudit.totals.units, 52);
  assert.equal(result.wargearAudit.totals['source-invalid'], 2);
  assert.equal(result.wargearAudit.totals.unverified ?? 0, 0);

  const termagants = result.roster.units.find((item) => item.name === 'Termagants');
  assert.equal(termagants.loadoutValidation.status, 'source-invalid');
  assert.equal(termagants.loadoutValidation.reviewedRuleValidation.status, 'rules-invalid');

  const carnifexes = result.roster.units.find((item) => item.name === 'Carnifexes');
  assert.equal(carnifexes.loadoutValidation.status, 'source-invalid');
  assert.equal(carnifexes.loadoutValidation.reviewedRuleValidation.status, 'rules-invalid');

  const tervigon = result.roster.units.find((item) => item.name === 'Tervigon');
  assert.equal(tervigon.loadoutValidation.status, 'rules-reviewed-valid');
  assert.deepEqual(tervigon.equippedWeapons.filter((item) => item.selectionName === 'Massive scything talons').map((item) => item.name), [
    'Massive scything talons (strike)', 'Massive scything talons (sweep)'
  ]);

  for (const tfex of result.roster.units.filter((item) => item.name === 'Tyrannofex')) {
    assert.equal(tfex.loadoutValidation.status, 'rules-reviewed-valid');
    assert.equal(tfex.equippedWeapons.some((item) => item.name === 'Fleshborer hive'), false);
  }
  assert.equal(result.roster.units.find((item) => item.name === 'Hive Guard').loadoutValidation.status, 'rules-reviewed-valid');
  assert.equal(result.roster.units.find((item) => item.name === 'Tyrant Guard').loadoutValidation.status, 'rules-reviewed-valid');
  assert.equal(result.roster.units.find((item) => item.name === 'Tyranid Warriors with Ranged Bio-weapons').loadoutValidation.status, 'rules-reviewed-valid');
});
