import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createArmyRoster } from '../../src/state/army-roster-library.js';
import { applyArmyRosterToBattle } from '../../src/engine/army-roster-transitions.js';

function setupState() {
  return createGameState({
    phase: 'setup',
    battle: { id: 'loadout-gate-test', status: 'setup', round: 0 },
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }]
  });
}

function legalTermagants() {
  return {
    id: 'gants',
    name: 'Termagants',
    datasheetId: 'tyranids:termagants',
    modelCount: 10,
    equippedWargear: [
      { name: 'Chitinous claws and teeth', quantity: 10 },
      { name: 'Fleshborer', quantity: 10 }
    ],
    equippedWeapons: [
      { name: 'Chitinous claws and teeth', quantity: 10 },
      { name: 'Fleshborer', quantity: 10 }
    ],
    loadoutValidation: { status: 'rules-reviewed-valid' }
  };
}

test('shared battle assignment boundary rejects reviewed units that still need loadout confirmation', () => {
  const roster = createArmyRoster({
    id: 'draft', name: 'Draft Tyranids', faction: 'Tyranids',
    units: [{
      id: 'gants', name: 'Termagants', datasheetId: 'tyranids:termagants', modelCount: 10,
      loadoutValidation: { status: 'manual-selection-required' }
    }]
  });
  assert.throws(
    () => applyArmyRosterToBattle(setupState(), { roster, playerId: 'p1' }),
    /Resolve required combat loadouts.*Termagants/i
  );
});

test('shared battle assignment boundary rejects unresolved imported equipment', () => {
  const unit = legalTermagants();
  unit.unmatchedWargear = [{ sourceName: 'Mystery bio-weapon', quantity: 1 }];
  unit.loadoutValidation = {
    status: 'unverified',
    errors: ['No combat profile matched imported wargear: 1x Mystery bio-weapon.']
  };
  const roster = createArmyRoster({ id: 'imported', name: 'Imported Tyranids', faction: 'Tyranids', units: [unit] });
  assert.throws(
    () => applyArmyRosterToBattle(setupState(), { roster, playerId: 'p1' }),
    /Mystery bio-weapon/i
  );
});

test('shared battle assignment boundary accepts legal reviewed loadouts', () => {
  const roster = createArmyRoster({
    id: 'ready', name: 'Ready Tyranids', faction: 'Tyranids', units: [legalTermagants()]
  });
  const state = applyArmyRosterToBattle(setupState(), { roster, playerId: 'p1', snapshotId: 'ready-snapshot' });
  assert.equal(state.armyRosters.p1.id, 'ready-snapshot');
  assert.equal(state.units.filter((unit) => unit.ownerId === 'p1').length, 1);
});

test('units without reviewed selectable loadout rules remain assignable', () => {
  const roster = createArmyRoster({
    id: 'coverage-pending', name: 'Coverage Pending', faction: 'Orks',
    units: [{ id: 'boyz', name: 'Boyz', datasheetId: 'orks:boyz', modelCount: 10 }]
  });
  const state = applyArmyRosterToBattle(setupState(), { roster, playerId: 'p2', snapshotId: 'coverage-snapshot' });
  assert.equal(state.armyRosters.p2.id, 'coverage-snapshot');
});
