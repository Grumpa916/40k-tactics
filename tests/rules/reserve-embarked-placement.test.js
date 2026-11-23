import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { assessReserveEmbarkedPlacement } from '../../src/rules/reserve-embarked-placement.js';
import { renderDeployBeginView } from '../../src/ui/deploy-begin-view.js';

function state({ passengerStatus = 'reserves', passengerFormation = 'reserve', transportStatus = 'deployed', transportFormation = 'field', keywords = ['Infantry', 'Adeptus Astartes', 'Tacticus'], transportDatasheet = 'space-marines:impulsor' } = {}) {
  return createGameState({
    phase: 'deployment',
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    battle: { id: 'b', status: 'deployment', round: 0 },
    battleSetup: { battleSize: 'strike_force' },
    armyRosters: { p1: { faction: 'Space Marines', units: [
      { id: 'r-squad', name: 'Intercessors', modelCount: 5, datasheetId: 'space-marines:intercessor-squad' },
      { id: 'r-bus', name: 'Impulsor', modelCount: 1, datasheetId: transportDatasheet }
    ] } },
    preparation: { mode: 'combined', formations: {
      squad: passengerFormation === 'embarked' ? { kind: 'embarked', transportId: 'impulsor' } : { kind: passengerFormation },
      impulsor: { kind: transportFormation }
    } },
    units: [
      { id: 'squad', name: 'Intercessors', ownerId: 'p1', status: passengerStatus, keywords, transportId: passengerFormation === 'embarked' ? 'impulsor' : null, metadata: { rosterUnitId: 'r-squad' } },
      { id: 'impulsor', name: 'Impulsor', ownerId: 'p1', status: transportStatus, keywords: ['Transport', 'Dedicated Transport'], metadata: { rosterUnitId: 'r-bus', datasheetId: transportDatasheet } }
    ]
  });
}

const sentence = 'Confirm that unit Intercessors is embarked in vehicle Impulsor and in reserves.';

test('embarked only does not ask for the reserves confirmation', () => {
  const placed = state({
    passengerStatus: 'embarked', passengerFormation: 'embarked', transportStatus: 'deployed', transportFormation: 'field'
  });
  const check = assessReserveEmbarkedPlacement(placed, placed.units[0]);
  assert.equal(check.embarked, true);
  assert.equal(check.reserves, false);
  assert.equal(check.confirmation, null);
});

test('reserves only does not ask for the embarked confirmation', () => {
  const placed = state();
  const check = assessReserveEmbarkedPlacement(placed, placed.units[0]);
  assert.equal(check.embarked, false);
  assert.equal(check.reserves, true);
  assert.equal(check.confirmation, null);
});

test('a unit embarked in a transport that is in reserves asks for confirmation by name', () => {
  const placed = state({
    passengerStatus: 'embarked', passengerFormation: 'embarked', transportStatus: 'reserves', transportFormation: 'reserve'
  });
  const check = assessReserveEmbarkedPlacement(placed, placed.units[0]);
  assert.equal(check.embarked, true);
  assert.equal(check.reserves, true);
  assert.equal(check.confirmation, sentence);
  assert.match(renderDeployBeginView(placed), new RegExp(sentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('a placement that fails both the embarked check and the reserves check uses the same confirmation', () => {
  const placed = state({
    passengerStatus: 'embarked', passengerFormation: 'embarked', transportStatus: 'deployed', transportFormation: 'field',
    keywords: ['Infantry', 'Adeptus Astartes', 'Terminator']
  });
  const check = assessReserveEmbarkedPlacement(placed, placed.units[0]);
  assert.equal(check.embarked, false);
  assert.equal(check.reserves, false);
  assert.equal(check.confirmation, sentence);
});
