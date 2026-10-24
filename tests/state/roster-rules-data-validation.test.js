import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createArmyRoster } from '../../src/state/army-roster-library.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { createRulesDataRevisionStamp, getRulesDataRevisionForFaction } from '../../src/data/rules-data-revisions.js';
import { assessRosterRulesData, revalidateRosterRulesData } from '../../src/rules/roster-rules-data-validation.js';

function tyranidCandidate(id) {
  return findArmyUnitCandidates({ faction: 'Tyranids' }).find((candidate) => candidate.id === id);
}

function legacyHiveTyrant(points = 195) {
  const candidate = tyranidCandidate('tyranids:hive-tyrant');
  return createArmyRoster({
    id: 'legacy', name: 'Legacy Tyranids', faction: 'Tyranids', pointsLimit: 2000,
    units: [{
      id: 'ht', name: 'Hive Tyrant', modelCount: 1, points,
      pointsOptions: candidate.pointsOptions, datasheetId: candidate.id, datasheet: candidate.datasheet,
      dataSource: { status: candidate.verificationStatus }
    }]
  });
}

test('current Tyranid rules revision tracks faction pack, live points revision and local catalog revision separately', () => {
  const revision = getRulesDataRevisionForFaction('Tyranids');
  assert.equal(revision.edition, '11th');
  assert.equal(revision.factionRules.version, '1.3');
  assert.equal(revision.points.revision, '2026-10-14');
  assert.equal(revision.catalog.revision, '2026-10-24.1');
  assert.match(revision.revisionId, /mfm-2026-10-14/);
});

test('legacy tracked-faction roster loads normally but requires one explicit revalidation', () => {
  const roster = legacyHiveTyrant();
  assert.equal(roster.schemaVersion, 1);
  assert.equal(roster.rulesDataRevision, null);
  const assessment = assessRosterRulesData(roster);
  assert.equal(assessment.status, 'review-required');
  assert.match(assessment.reasons[0], /predates rules-data revision tracking/i);
});

test('revalidation refreshes a compatible legacy roster and records the current revision without changing schema version', () => {
  const result = revalidateRosterRulesData(legacyHiveTyrant(), { updatedAt: '2026-10-22T23:00:00.000Z' });
  assert.equal(result.status, 'current');
  assert.deepEqual(result.issues, []);
  assert.equal(result.roster.schemaVersion, 1);
  assert.equal(result.roster.rulesDataRevision.revisionId, getRulesDataRevisionForFaction('Tyranids').revisionId);
  assert.equal(result.roster.units[0].dataSource.rulesDataRevisionId, result.roster.rulesDataRevision.revisionId);
  assert.match(result.roster.units[0].dataSource.pointsSourceName, /14\/10\/2026/);
  assert.equal(assessRosterRulesData(result.roster).status, 'current');
});

test('revalidation refuses to stamp a roster whose saved points do not match current catalog options', () => {
  const result = revalidateRosterRulesData(legacyHiveTyrant(999));
  assert.equal(result.status, 'review-required');
  assert.ok(result.issues.some((issue) => /does not match a current catalog points option/i.test(issue)));
  assert.equal(result.roster.rulesDataRevision, null);
});

test('changed points or catalog revisions are surfaced instead of silently accepted', () => {
  const stamp = createRulesDataRevisionStamp('Tyranids');
  stamp.points.revision = '2026-09-30';
  stamp.catalog.revision = '2026-10-12';
  const roster = createArmyRoster({ ...legacyHiveTyrant(), rulesDataRevision: stamp });
  const assessment = assessRosterRulesData(roster);
  assert.equal(assessment.status, 'review-required');
  assert.ok(assessment.reasons.some((reason) => /Munitorum Field Manual revision changed/i.test(reason)));
  assert.ok(assessment.reasons.some((reason) => /Local reviewed catalog changed/i.test(reason)));
});

test('large current Warhammer App Tyranid import is stamped as current and can be revalidated cleanly', async () => {
  const text = await readFile(new URL('../fixtures/warhammer-app-large-validation-roster.txt', import.meta.url), 'utf8');
  const imported = importWarhammerAppRoster({ text, faction: 'Tyranids', name: 'Current fixture', pointsLimit: 3000, id: 'current' });
  assert.equal(assessRosterRulesData(imported.roster).status, 'current');
  assert.equal(imported.roster.rulesDataRevision.points.revision, '2026-10-14');
  const revalidated = revalidateRosterRulesData(imported.roster);
  assert.equal(revalidated.status, 'current');
  assert.deepEqual(revalidated.issues, []);
});

test('untracked factions remain usable without pretending they have versioned rules data', () => {
  const roster = createArmyRoster({ id: 'custom', name: 'Custom', faction: 'Other / custom', units: [] });
  assert.equal(assessRosterRulesData(roster).status, 'untracked');
});
