import test from 'node:test';
import assert from 'node:assert/strict';
import { ARMY_UNIT_CATALOG } from '../../src/data/army-unit-catalog.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';
import { assessAlliedDetachments, ALLIED_DETACHMENT_RULES } from '../../src/rules/allied-detachments.js';
import { isUserEnteredUnit } from '../../src/rules/imported-roster-report.js';

test('the catalog includes the reviewed Deathwatch Terminator datasheet but keeps allied limits unconfirmed', () => {
  assert.equal(ARMY_UNIT_CATALOG.some(unit => unit.id === 'deathwatch:deathwatch-terminator-squad'), true);
  assert.equal(ARMY_UNIT_CATALOG.some(unit => /deathwatch/i.test(unit.faction ?? '')), true);
  assert.equal(ALLIED_DETACHMENT_RULES.deathwatch.pointsCap, null);
  assert.equal(ALLIED_DETACHMENT_RULES.deathwatch.detachmentCost, null);
  assert.equal(ALLIED_DETACHMENT_RULES.deathwatch.warlordAllowed, false);
});

test('explicit Deathwatch Terminators alias maps to the reviewed allied datasheet and cannot be Warlord', () => {
  const parsed = importWarhammerAppRoster({
    text: `Space Marines
CHARACTERS
Captain in Gravis Armour (90 Points)
ALLIED UNITS
Faction: Deathwatch
Deathwatch Terminators (210 Points)
  • Warlord
  • 5x Storm bolter`,
    faction: 'Space Marines', name: 'Allies', id: 'dw'
  });
  const captain = parsed.roster.units.find(unit => unit.name === 'Captain in Gravis Armour');
  const terminators = parsed.roster.units.find(unit => unit.datasheetId === 'deathwatch:deathwatch-terminator-squad');
  assert.ok(captain.datasheetId);
  assert.equal(captain.alliedFaction, undefined);
  assert.equal(isUserEnteredUnit(terminators), false);
  assert.equal(terminators.datasheetId, 'deathwatch:deathwatch-terminator-squad');
  assert.equal(terminators.alliedFaction, 'Deathwatch');
  assert.equal(terminators.dataSource.status, 'current-datasheet-cross-check');
  assert.equal(parsed.roster.alliedDetachments[0].faction, 'Deathwatch');
  assert.match(parsed.warnings.join('\n'), /cannot be the army Warlord/);
  assert.match(parsed.warnings.join('\n'), /not confirmed from a rules source/);
});

test('a chapter Faction Deathwatch line does not turn a matched Space Marine into an ally', () => {
  const parsed = importWarhammerAppRoster({
    text: 'Space Marines\nCHARACTERS\nFaction: Deathwatch\nCaptain in Gravis Armour (90 Points)',
    faction: 'Space Marines', name: 'Chapter', id: 'chapter'
  });
  assert.equal(parsed.roster.units[0].factionTag, 'Deathwatch');
  assert.equal(parsed.roster.units[0].alliedFaction, undefined);
  assert.equal(parsed.roster.alliedDetachments, null);
});

test('points cap uses the supplied fixture value and is not enforced while unconfirmed', () => {
  const roster = { units: [
    { id: 'a', alliedFaction: 'Deathwatch', points: 600, isWarlord: false }
  ] };
  assert.equal(assessAlliedDetachments(roster).issues.some(issue => issue.code === 'allied-points-cap'), false);
  const capped = assessAlliedDetachments(roster, {
    deathwatch: { ...ALLIED_DETACHMENT_RULES.deathwatch, pointsCap: 500, detachmentCost: 1, confirmation: 'fixture' }
  });
  assert.ok(capped.issues.some(issue => issue.code === 'allied-points-cap'));
});
