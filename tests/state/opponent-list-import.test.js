import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';
import { summarizeRosterPoints } from '../../src/state/army-roster-points-summary.js';
import { auditArmyCatalogCompleteness } from '../../src/rules/army-catalog-completeness-audit.js';
import { summarizeWargearAudit } from '../../src/rules/wargear-loadout-validation.js';
import { assessRosterLoadoutReadiness } from '../../src/rules/roster-loadout-readiness.js';
import { assessRosterRulesData, revalidateRosterRulesData } from '../../src/rules/roster-rules-data-validation.js';
import { validateArmyRoster } from '../../src/rules/army-roster-validation.js';
import { importedRosterValidationPasses, isUserEnteredUnit, unitContentSignature, withResolvedUnitContent } from '../../src/rules/imported-roster-report.js';
import { renderRosterRows } from '../../src/ui/army-roster-rows.js';
import { renderUnitDetails } from '../../src/ui/army-unit-details.js';
import { renderRosterUnitEditor } from '../../src/ui/roster-unit-adjust.js';
import { unitDisplayLabels } from '../../src/ui/map-unit-labels.js';
import { getCombatDataReadiness } from '../../src/rules/combat-data-readiness.js';

function walk(dir, found = []) {
 for (const name of readdirSync(dir)) {
  const path = join(dir, name);
  if (statSync(path).isDirectory()) walk(path, found);
  else if (name.endsWith('.js')) found.push(path);
 }
 return found;
}

const terminators = (factionLine) => `${factionLine}
  • 5x Terminator
     ◦ 5x Storm bolter
     ◦ 5x Power fist`;

test('mixed, all-unmatched and uncatalogued lists keep manual units with or without points', () => {
 const mixed = importWarhammerAppRoster({
  text: 'Tyranids\nCHARACTERS\n10x Termagants (60 Points)\n  • 10x Fleshborer\nNeurotyrant\nOTHER DATASHEETS\nCustom Gargoyle Brood',
  faction: 'Tyranids', name: 'Mixed', id: 'mixed'
 });
 assert.equal(mixed.roster.units.filter(unit => unit.datasheetId).length >= 1, true);
 const custom = mixed.roster.units.find(unit => unit.name === 'Custom Gargoyle Brood');
 assert.equal(custom.dataSource.origin, 'import-unmatched');
 assert.equal(custom.points, null);
 assert.equal(custom.modelCount, 1);
 assert.match(custom.notes, /Custom Gargoyle Brood/);
 assert.equal(summarizeRosterPoints(mixed.roster).unitsWithoutPoints >= 1, true);

 const necrons = importWarhammerAppRoster({
  text: `Awakened Dynasty (2,000 Points)
Necrons
Awakened Dynasty (2 Detachment Points)
Strike Force (2,000 Points)
Take and Hold
ERRORS
  • You must select one CHARACTER model to be your WARLORD.
CHARACTERS
Imotekh the Stormlord (100 Points)
  • Warlord
  • 1x Staff of the Destroyer
BATTLELINE
10x Necron Warriors
  • 10x Gauss flayer
OTHER DATASHEETS
Lokhust Destroyers (90 Points)
Canoptek Scarabs`,
  faction: 'Necrons', name: 'Awakened', pointsLimit: 2000, id: 'necrons'
 });
 assert.match(necrons.warnings.join('\n'), /no reviewed catalog/i);
 assert.equal(necrons.roster.units.length, 4);
 assert.deepEqual(necrons.roster.units.map(unit => unit.name), [
  'Imotekh the Stormlord', 'Necron Warriors', 'Lokhust Destroyers', 'Canoptek Scarabs'
 ]);
 assert.equal(necrons.roster.units.every(isUserEnteredUnit), true);
 assert.equal(necrons.roster.units[0].points, 100);
 assert.equal(necrons.roster.units[0].isWarlord, true);
 assert.match(necrons.roster.units[0].notes, /Staff of the Destroyer/);
 assert.equal(necrons.roster.units[1].modelCount, 10);
 assert.equal(necrons.roster.units[1].points, null);
 assert.equal(necrons.roster.units[2].points, 90);
 assert.equal(necrons.roster.units[2].modelCount, 1);
 assert.equal(necrons.roster.units[3].points, null);
 assert.equal(necrons.totalPoints, 190);
 assert.equal(necrons.roster.units.some(unit => /Strike Force|Take and Hold|WARLORD|Awakened Dynasty|ERRORS/i.test(unit.name)), false);
 assert.equal(necrons.roster.detachment, 'Awakened Dynasty');

 const rows = renderRosterRows(necrons.roster.units, necrons.roster.units[3].id, 'Necrons');
 assert.match(rows, /User-entered/);
 assert.match(rows, /costs unknown/);
 const details = renderUnitDetails(necrons.roster.units[3], { current: necrons.roster, editable: true });
 assert.match(details, /User-entered · unverified/);
 assert.match(details, /not catalog data/);
});

test('attached unmatched bodyguards stay in the group and audits ignore user-entered units', () => {
 const before = auditArmyCatalogCompleteness('Tyranids');
 const parsed = importWarhammerAppRoster({
  text: `Example (100 Points)
ATTACHED UNITS
Attached unit 1
Lictor (60 Points)
  • Attached as: Leader (Character)
  • 1x Lictor claws and talons
Uncataloged bodyguard (40 Points)
  • Attached as: Bodyguard (Battleline)
  • 10x Unknown claws`,
  faction: 'Tyranids', name: 'Attached', id: 'attached'
 });
 const bodyguard = parsed.roster.units.find(unit => unit.name === 'Uncataloged bodyguard');
 const leader = parsed.roster.units.find(unit => unit.name === 'Lictor');
 assert.equal(leader.attachedToBodyguardId, bodyguard.id);
 assert.deepEqual(bodyguard.attachedLeaderIds, [leader.id]);
 assert.equal(auditArmyCatalogCompleteness('Tyranids').counts.units, before.counts.units);
 assert.equal(auditArmyCatalogCompleteness('Necrons').counts.units, 0);
 const wargear = summarizeWargearAudit(parsed.roster);
 assert.equal(wargear.excludedUserEntered, 1);
 assert.equal(wargear.units.some(unit => unit.name === 'Uncataloged bodyguard'), false);
 const readiness = assessRosterLoadoutReadiness(parsed.roster);
 const manual = readiness.units.find(unit => unit.name === 'Uncataloged bodyguard');
 assert.equal(manual.status, 'user-entered');
 assert.equal(manual.blocking, false);
 assert.equal(readiness.units.filter(unit => unit.blocking && isUserEnteredUnit(parsed.roster.units.find(item => item.id === unit.unitId))).length, 0);
 const reviewed = revalidateRosterRulesData(parsed.roster);
 assert.equal(reviewed.issues.some(issue => /Uncataloged bodyguard/.test(issue)), false);
 const copies = importWarhammerAppRoster({
  text: 'Necrons\nOTHER DATASHEETS\n' + Array.from({ length: 4 }, () => 'Tomb Blades (75 Points)').join('\n'),
  faction: 'Necrons', name: 'Copies', id: 'copies'
 });
 assert.equal(validateArmyRoster(copies.roster).issues.some(issue => /at most/.test(issue)), false);
});

test('content signatures dedupe identical units and keep faction and wargear apart', () => {
 const same = importWarhammerAppRoster({
  text: `Space Marines
Detachment: Gladius Task Force
CHARACTERS
${terminators('Terminator Squad (190 Points)')}
${terminators('Terminator Squad (190 Points)')}`,
  faction: 'Space Marines', name: 'Twins', id: 'twins'
 });
 const [first, second] = same.roster.units;
 assert.equal(first.contentSignature, second.contentSignature);
 assert.equal(second.datasheet, null);
 assert.equal(second.contentOwnerId, first.id);
 assert.equal(second.instanceLabel, 'Terminator Squad 2');
 assert.equal(second.name, 'Terminator Squad');
 assert.ok(first.datasheet);
 assert.equal(withResolvedUnitContent(second, same.roster.units).datasheet, first.datasheet);
 assert.equal(JSON.stringify(same.roster).split(JSON.stringify(first.datasheet)).length - 1, 1);
 const labels = unitDisplayLabels(same.roster.units.map(unit => ({ ...unit, ownerId: 'opponent' })));
 assert.equal(labels.get(first.id), 'Terminator Squad 1');
 assert.equal(labels.get(second.id), 'Terminator Squad 2');

 const gear = importWarhammerAppRoster({
  text: `Space Marines
CHARACTERS
${terminators('Terminator Squad (190 Points)')}
Terminator Squad (190 Points)
  • 5x Terminator
     ◦ 5x Storm bolter
     ◦ 5x Thunder hammer`,
  faction: 'Space Marines', name: 'Gear', id: 'gear'
 });
 assert.notEqual(gear.roster.units[0].contentSignature, gear.roster.units[1].contentSignature);
 assert.equal(gear.roster.units[1].contentOwnerId, undefined);
 assert.ok(gear.roster.units[1].datasheet);

 const allied = importWarhammerAppRoster({
  text: `Space Marines
CHARACTERS
${terminators('Terminator Squad (190 Points)')}
ALLIED UNITS
Faction: Deathwatch
${terminators('Terminator Squad (190 Points)')}`,
  faction: 'Space Marines', name: 'Allies', id: 'allies'
 });
 assert.equal(allied.roster.units[0].factionTag, 'Space Marines');
 assert.equal(allied.roster.units[1].factionTag, 'Deathwatch');
 assert.equal(allied.roster.units[0].datasheetId, allied.roster.units[1].datasheetId);
 assert.notEqual(allied.roster.units[0].contentSignature, allied.roster.units[1].contentSignature);
 assert.ok(allied.roster.units[0].datasheet);
 assert.ok(allied.roster.units[1].datasheet);

 const manual = importWarhammerAppRoster({
  text: `Necrons
CHARACTERS
Immortals (140 Points)
  • 10x Gauss blaster
Immortals (140 Points)
  • 10x Gauss blaster
Immortals (115 Points)
  • 5x Tesla carbine`,
  faction: 'Necrons', name: 'Manual twins', id: 'manual-twins'
 });
 assert.equal(manual.roster.units[0].contentSignature, manual.roster.units[1].contentSignature);
 assert.equal(manual.roster.units[1].contentOwnerId, manual.roster.units[0].id);
 assert.equal(manual.roster.units[1].instanceLabel, 'Immortals 2');
 assert.notEqual(manual.roster.units[0].contentSignature, manual.roster.units[2].contentSignature);

 const base = {
  datasheetId: 'space-marines:terminator-squad', factionTag: 'Space Marines', modelCount: 5,
  dataSource: { status: 'verified' },
  equippedWargear: [{ name: 'Storm bolter', quantity: 5 }, { name: 'Power fist', quantity: 5 }],
  unmatchedWargear: []
 };
 assert.equal(unitContentSignature(base), unitContentSignature({
  ...base, equippedWargear: [{ name: 'Power fist', quantity: 5 }, { name: 'Storm bolter', quantity: 5 }]
 }));
 assert.notEqual(unitContentSignature(base), unitContentSignature({ ...base, modelCount: 10 }));
 assert.notEqual(unitContentSignature(base), unitContentSignature({ ...base, factionTag: 'Deathwatch' }));
});

test('a catalog unit on the first line is kept, and an unpriced allied line stays a unit', () => {
 const opened = importWarhammerAppRoster({
  text: 'Hive Tyrant (210 Points)\n10x Termagants (60 Points)',
  faction: 'Tyranids', name: 'Starts with a unit', id: 'first-unit'
 });
 assert.deepEqual(opened.roster.units.map(unit => unit.name), ['Hive Tyrant', 'Termagants']);
 assert.equal(opened.roster.units[0].datasheetId, 'tyranids:hive-tyrant');
 assert.equal(opened.totalPoints, 270);
 const titled = importWarhammerAppRoster({
  text: 'Example (2,000 Points)\nCHARACTERS\nHive Tyrant (195 Points)',
  faction: 'Tyranids', name: 'Titled', id: 'titled'
 });
 assert.deepEqual(titled.roster.units.map(unit => unit.name), ['Hive Tyrant']);
 assert.equal(titled.declaredPoints, 2000);

 const allied = importWarhammerAppRoster({
  text: `Space Marines
ALLIED UNITS
Inquisitor
Callidus Assassin (100 Points)
  • 1x Neural shredder
Faction: Deathwatch
Deathwatch Terminator Squad (210 Points)`,
  faction: 'Space Marines', name: 'Allies', id: 'unpriced-ally'
 });
 assert.deepEqual(allied.roster.units.map(unit => unit.name), ['Inquisitor', 'Callidus Assassin', 'Deathwatch Terminator Squad']);
 assert.equal(allied.roster.units[0].dataSource.origin, 'import-unmatched');
 assert.equal(allied.roster.units[0].points, null);
 assert.equal(allied.roster.units[0].factionTag, 'Space Marines');
 assert.equal(allied.roster.units[1].factionTag, 'Space Marines');
 assert.equal(allied.roster.units[2].factionTag, 'Deathwatch');
});

test('import report records mismatches once, and only import or manual refresh validates', () => {
 const start = importedRosterValidationPasses();
 const parsed = importWarhammerAppRoster({
  text: `Tyranids
CHARACTERS
10x Termagants (60 Points)
Hive Tyrant (1 Points)
  • 1x Not a real gun
Unlisted Beast (40 Points)`,
  faction: 'Tyranids', name: 'Report', id: 'report'
 });
 assert.equal(importedRosterValidationPasses(), start + 1);
 const report = parsed.roster.importReport;
 assert.equal(report.source, 'import');
 assert.equal(parsed.importReport, report);
 const kinds = report.entries.map(entry => entry.kind);
 assert.ok(kinds.includes('unmatched-unit'));
 assert.ok(kinds.includes('unmatched-wargear'));
 assert.ok(kinds.includes('points-mismatch'));
 assert.equal(report.summary.unmatched >= 1, true);
 assert.equal(report.summary.pointsMismatches >= 1, true);
 const saved = structuredClone(report);
 renderRosterRows(parsed.roster.units, parsed.roster.units[0].id, 'Tyranids');
 renderUnitDetails(parsed.roster.units.at(-1), { current: parsed.roster, editable: true });
 renderRosterUnitEditor({ units: [], armyRosters: {} }, { id: 'tap', name: 'Tap' });
 assessRosterRulesData(parsed.roster);
 assessRosterLoadoutReadiness(parsed.roster);
 getCombatDataReadiness({ units: [{ id: 'tap', ownerId: 'p', status: 'deployed', name: 'Tap' }], armyRosters: { p: parsed.roster }, history: [] });
 assert.deepEqual(parsed.roster.importReport, saved);
 assert.equal(importedRosterValidationPasses(), start + 1);

 parsed.roster.units.find(unit => unit.datasheet).datasheet = {
  ...parsed.roster.units.find(unit => unit.datasheet).datasheet,
  characteristics: { Move: '1"' }
 };
 const refreshed = revalidateRosterRulesData(parsed.roster, { updatedAt: '2026-11-23T00:00:00.000Z' });
 assert.equal(importedRosterValidationPasses(), start + 2);
 assert.equal(refreshed.roster.importReport.source, 'refresh');
 assert.ok(refreshed.roster.importReport.entries.some(entry => entry.kind === 'stale-datasheet'));

 const callers = walk(new URL('../../src', import.meta.url).pathname).filter(path =>
  readFileSync(path, 'utf8').includes('buildImportedRosterReport'));
 assert.deepEqual(callers.map(path => path.split('/src/')[1]).sort(), [
  'rules/imported-roster-report.js',
  'rules/roster-rules-data-validation.js',
  'state/warhammer-app-roster-import.js'
 ]);
});
