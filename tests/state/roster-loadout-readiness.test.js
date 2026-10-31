import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessUnitLoadoutReadiness,
  assessRosterLoadoutReadiness,
  loadoutReadinessLabel
} from '../../src/rules/roster-loadout-readiness.js';

function legalTermagants(overrides = {}) {
  return {
    id: 'gants',
    name: 'Termagants',
    datasheetId: 'tyranids:termagants',
    modelCount: 10,
    equippedWargear: [
      { name: 'Chitinous claws and teeth', quantity: 10 },
      { name: 'Fleshborer', quantity: 10 }
    ],
    ...overrides
  };
}

test('reviewed units with no saved selection require confirmation', () => {
  const unit = {
    id: 'gants', name: 'Termagants', datasheetId: 'tyranids:termagants', modelCount: 10,
    loadoutValidation: { status: 'manual-selection-required', errors: ['Choose actual wargear.'] }
  };
  const result = assessUnitLoadoutReadiness(unit);
  assert.equal(result.status, 'needs-confirmation');
  assert.equal(result.blocking, true);
  assert.equal(loadoutReadinessLabel(unit), 'Loadout needs confirmation');
});

test('exact legal reviewed loadouts are accepted even when imported status is older', () => {
  const unit = legalTermagants({ loadoutValidation: { status: 'profile-matched' } });
  const result = assessUnitLoadoutReadiness(unit);
  assert.equal(result.status, 'complete');
  assert.equal(result.blocking, false);
  assert.equal(loadoutReadinessLabel(unit), 'Loadout ready');
});

test('illegal reviewed quantities block battle readiness', () => {
  const unit = legalTermagants({
    equippedWargear: [
      { name: 'Chitinous claws and teeth', quantity: 10 },
      { name: 'Fleshborer', quantity: 9 }
    ]
  });
  const result = assessUnitLoadoutReadiness(unit);
  assert.equal(result.status, 'invalid');
  assert.equal(result.blocking, true);
  assert.match(result.reason, /expected 10/i);
});

test('units without reviewed selectable loadout rules do not block battle use', () => {
  const unit = { id: 'boyz', name: 'Boyz', datasheetId: 'orks:boyz', modelCount: 10 };
  const result = assessUnitLoadoutReadiness(unit);
  assert.equal(result.status, 'not-assessed');
  assert.equal(result.blocking, false);
  assert.equal(loadoutReadinessLabel(unit), 'Loadout rules coverage pending');
});

test('roster assessment reports blockers and coverage separately', () => {
  const roster = {
    units: [
      legalTermagants(),
      { id: 'hive', name: 'Hive Tyrant', datasheetId: 'tyranids:hive-tyrant', modelCount: 1,
        loadoutValidation: { status: 'manual-selection-required' } },
      { id: 'boyz', name: 'Boyz', datasheetId: 'orks:boyz', modelCount: 10 }
    ]
  };
  const result = assessRosterLoadoutReadiness(roster);
  assert.equal(result.status, 'needs-attention');
  assert.equal(result.battleReady, false);
  assert.equal(result.totals.complete, 1);
  assert.equal(result.totals['needs-confirmation'], 1);
  assert.equal(result.totals['not-assessed'], 1);
  assert.equal(result.totals.blocking, 1);
});
