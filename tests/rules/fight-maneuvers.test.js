import test from 'node:test';
import assert from 'node:assert/strict';
import { createEvent } from '../../src/events/event.js';
import { appendHistoryEntry } from '../../src/state/history.js';
import { recordFightActivation } from '../../src/engine/fight-transitions.js';
import {
  COUNTEROFFENSIVE_RULE, consolidateOffer, fightManeuverNotes, heroicInterventionOffer,
  pileInOffer, recordConsolidate, recordHeroicIntervention, recordPileIn
} from '../../src/rules/fight-maneuvers.js';

const state = () => ({
  battle: { status: 'active', round: 1 }, activePlayer: 'p1', turn: 1, phase: 'fight',
  players: [{ id: 'p1' }, { id: 'p2' }], commandPoints: { p1: 2, p2: 2 },
  units: [
    { id: 'guard', name: 'Guard', ownerId: 'p1', status: 'deployed', unitUpgrades: ['Unstoppable Destroyer'] },
    { id: 'enemy', name: 'Enemy', ownerId: 'p2', status: 'deployed' }
  ],
  history: [], armyRosters: {}
});

test('Pile In is offered for a selected fighter that did not charge, with stored allowances only', () => {
  const fight = state();
  const offer = pileInOffer(fight, 'guard');
  assert.equal(offer.recorded, false);
  assert.deepEqual(offer.pileIn, ['Pile in up to 4″.']);
  assert.equal(pileInOffer({ ...fight, phase: 'movement' }, 'guard'), null);
  const recorded = recordPileIn(fight, { unitId: 'guard' });
  assert.equal(recorded.commandPoints.p1, 2);
  assert.equal(pileInOffer(recorded, 'guard').recorded, true);
  assert.equal(COUNTEROFFENSIVE_RULE, null);
});

test('Consolidate follows a fight selection and Heroic Intervention follows a successful charge', () => {
  const alone = state();
  alone.units = [alone.units[0]];
  let fight = recordFightActivation(alone, { unitId: 'guard', actionType: 'fight', tabletopConfirmed: true });
  assert.ok(consolidateOffer(fight, 'guard'));
  assert.equal(consolidateOffer(state(), 'guard'), null);
  fight = recordConsolidate(fight, { unitId: 'guard' });
  assert.equal(fight.history.at(-1).type, 'fight.consolidate_recorded');
  const charge = { ...state(), phase: 'charge', activePlayer: 'p2' };
  const moved = appendHistoryEntry(charge, createEvent('charge.outcome_recorded', {
    unitId: 'enemy', playerId: 'p2', outcome: 'successful', targetIds: ['guard'], round: 1, turn: 1
  }));
  const offer = heroicInterventionOffer(moved);
  assert.equal(offer.playerId, 'p1');
  assert.throws(() => recordHeroicIntervention(moved, { triggerKey: offer.triggerKey, unitId: 'guard', eligibleConfirmed: false }), /eligibility/);
  const used = recordHeroicIntervention(moved, { triggerKey: offer.triggerKey, unitId: 'guard', eligibleConfirmed: true });
  assert.equal(used.commandPoints.p1, 2);
  assert.equal(heroicInterventionOffer(used), null);
  assert.equal(heroicInterventionOffer(appendHistoryEntry(charge, createEvent('charge.outcome_recorded', {
    unitId: 'enemy', playerId: 'p2', outcome: 'failed', targetIds: ['guard'], round: 1, turn: 1
  }))), null);
  assert.deepEqual(fightManeuverNotes(state(), { id: 'plain', ownerId: 'p1', status: 'deployed' }).pileIn, []);
});
