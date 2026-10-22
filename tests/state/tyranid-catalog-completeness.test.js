import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';

const catalog = () => findArmyUnitCandidates({ faction: 'Tyranids' });

function pointsOptionMatches(candidate, rosterUnit) {
  return (candidate.pointsOptions ?? []).some((option) =>
    Number(option.models) === Number(rosterUnit.modelCount) && Number(option.points) === Number(rosterUnit.points)
  );
}

test('all Tyranid catalog entries have reviewed datasheet and points metadata', () => {
  const missing = catalog().filter((candidate) =>
    candidate.verificationStatus !== 'source-reviewed' ||
    !candidate.datasheet ||
    !candidate.datasheet.characteristics ||
    !Array.isArray(candidate.datasheet.weapons) ||
    !Array.isArray(candidate.datasheet.abilities) ||
    !Array.isArray(candidate.pointsOptions) ||
    candidate.pointsOptions.length === 0
  ).map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    status: candidate.verificationStatus,
    hasDatasheet: Boolean(candidate.datasheet),
    hasCharacteristics: Boolean(candidate.datasheet?.characteristics),
    hasWeapons: Array.isArray(candidate.datasheet?.weapons),
    hasAbilities: Array.isArray(candidate.datasheet?.abilities),
    pointsOptions: candidate.pointsOptions?.length ?? 0
  }));
  assert.deepEqual(missing, []);
  assert.equal(catalog().length, 57);
});

test('large current Warhammer App roster has complete Tyranid catalog coverage', async () => {
  const text = await readFile(new URL('../fixtures/warhammer-app-large-validation-roster.txt', import.meta.url), 'utf8');
  const result = importWarhammerAppRoster({
    text,
    faction: 'Tyranids',
    name: 'Tyranid completeness audit',
    pointsLimit: 3000,
    id: 'tyranid-completeness-audit'
  });
  const candidates = new Map(catalog().map((candidate) => [candidate.name, candidate]));

  const missingProfiles = result.roster.units.filter((unit) => !candidates.get(unit.name)?.datasheet)
    .map((unit) => unit.name);
  assert.deepEqual(missingProfiles, []);

  const stalePoints = result.roster.units.filter((unit) => {
    const candidate = candidates.get(unit.name);
    return candidate && !pointsOptionMatches(candidate, unit);
  }).map((unit) => ({ name: unit.name, models: unit.modelCount, importedPoints: unit.points, knownOptions: candidates.get(unit.name)?.pointsOptions ?? [] }));
  assert.deepEqual(stalePoints, []);

  const unverifiedLoadouts = result.roster.units.filter((unit) => unit.loadoutValidation?.status === 'unverified')
    .map((unit) => ({ name: unit.name, errors: unit.loadoutValidation?.errors ?? [] }));
  assert.deepEqual(unverifiedLoadouts, []);
});

test('Tyranid entries outside the large fixture keep their reviewed current costs and Legends flags', () => {
  const candidates = new Map(catalog().map((candidate) => [candidate.name, candidate]));
  const expected = [
    ['Deathleaper', 1, 80, false],
    ['Malanthrope', 1, 75, true],
    ['Barbed Hierodule', 1, 340, true],
    ['Dimachaeron', 1, 200, true],
    ['Scythed Hierodule', 1, 330, true],
    ['Sky-slasher Swarms', 3, 60, true]
  ];
  for (const [name, models, points, legends] of expected) {
    const candidate = candidates.get(name);
    assert.ok(candidate, `${name} must remain in the Tyranid catalog`);
    assert.ok(candidate.pointsOptions.some((option) => option.models === models && option.points === points), `${name} cost must remain reviewed`);
    assert.equal(Boolean(candidate.datasheet?.legends), legends, `${name} Legends status must remain correct`);
  }
});
