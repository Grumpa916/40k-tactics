import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { nextFightSelection, recordFightActivation } from '../../src/engine/fight-transitions.js';
import { getFightAttackOptions } from '../../src/application/fight-workflow.js';

function fightState() {
  const unit = (id, ownerId) => ({
    id,
    name: id,
    ownerId,
    status: 'deployed',
    wounds: 10,
    maxWounds: 10,
    profile: { characteristics: { weaponSkill: 3, toughness: 5, save: 3 } }
  });
  const state = createGameState({
    phase: 'fight',
    turn: 1,
    activePlayer: 'p1',
    battle: { id: 'b', status: 'active', round: 1, firstPlayerId: 'p1', activePlayerId: 'p1' },
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    units: [unit('charger', 'p1'), unit('enemy', 'p2'), unit('other', 'p1')]
  });
  state.history.push({
    type: 'charge.outcome_recorded',
    payload: {
      unitId: 'charger',
      playerId: 'p1',
      outcome: 'successful',
      targetIds: ['enemy'],
      measuredDistances: { enemy: 5 },
      round: 1,
      turn: 1
    }
  });
  return state;
}

test('strict Fight activation still preserves inferred eligibility and Fights First order', () => {
  const state = fightState();
  assert.throws(
    () => recordFightActivation(state, { unitId: 'enemy', actionType: 'fight' }),
    /Fights First candidates must be activated before normal Fight candidates/
  );
  assert.throws(
    () => recordFightActivation(state, { unitId: 'other', actionType: 'fight' }),
    /not an available Fight candidate/
  );
});

test('tabletop confirmation can record an unseen fighter only on that player\'s turn', () => {
  const state = fightState();
  assert.throws(
    () => recordFightActivation(state, { unitId: 'enemy', actionType: 'fight', tabletopConfirmed: true }),
    /Fights First candidates must be activated before normal Fight candidates/
  );
  const chargerFirst = recordFightActivation(state, { unitId: 'charger', actionType: 'fight', tabletopConfirmed: true });
  assert.equal(chargerFirst.history.at(-1).payload.fightsFirst, true);
  assert.throws(
    () => recordFightActivation(chargerFirst, { unitId: 'other', actionType: 'fight', tabletopConfirmed: true }),
    /other player chooses the next unit/
  );
  const enemyNext = recordFightActivation(chargerFirst, { unitId: 'enemy', actionType: 'fight' });
  const other = recordFightActivation(enemyNext, { unitId: 'other', actionType: 'fight', tabletopConfirmed: true });
  assert.equal(other.history.at(-1).payload.unitId, 'other');
  assert.equal(other.history.at(-1).payload.tabletopConfirmed, true);
});

test('Fight options expose inferred priority and additional tabletop-confirmed formations', () => {
  const options = getFightAttackOptions(fightState(), {
    perspectivePlayerId: 'p1',
    includeCandidates: true
  });
  const byId = new Map(options.attackers.map(item => [item.unitId, item]));

  assert.equal(options.fighterSelectionPolicy, 'tabletop-confirmed');
  assert.equal(byId.get('charger').eligibilitySource, 'fights-first');
  assert.equal(byId.get('charger').fightsFirst, true);
  assert.equal(byId.get('enemy').eligibilitySource, 'inferred');
  assert.equal(byId.get('other').eligibilitySource, 'tabletop-confirmed');
});

test('tabletop confirmation does not permit duplicate Fight activations', () => {
  const once = recordFightActivation(fightState(), {
    unitId: 'charger',
    actionType: 'fight',
    tabletopConfirmed: true
  });
  assert.throws(
    () => recordFightActivation(once, {
      unitId: 'charger',
      actionType: 'fight',
      tabletopConfirmed: true
    }),
    /only once per turn/
  );
});

test('normal Fight selections alternate and start with the non-active player', () => {
  const unit = (id, ownerId) => ({ id, name: id, ownerId, status: 'deployed' });
  const state = createGameState({
    phase: 'fight', turn: 1, activePlayer: 'p1',
    battle: { id: 'b', status: 'active', round: 1, firstPlayerId: 'p1', activePlayerId: 'p1' },
    players: [{ id: 'p1' }, { id: 'p2' }],
    units: [unit('p1a', 'p1'), unit('p1b', 'p1'), unit('p2a', 'p2'), unit('p2b', 'p2')]
  });
  assert.equal(nextFightSelection(state).playerId, 'p2');
  assert.throws(
    () => recordFightActivation(state, { unitId: 'p1a', actionType: 'fight' }),
    /other player chooses the next unit/
  );
  const first = recordFightActivation(state, { unitId: 'p2a', actionType: 'fight' });
  assert.equal(nextFightSelection(first).playerId, 'p1');
  assert.throws(
    () => recordFightActivation(first, { unitId: 'p2b', actionType: 'fight' }),
    /other player chooses the next unit/
  );
  const second = recordFightActivation(first, { unitId: 'p1a', actionType: 'fight' });
  assert.equal(nextFightSelection(second).playerId, 'p2');
  const third = recordFightActivation(second, { unitId: 'p2b', actionType: 'fight' });
  assert.equal(nextFightSelection(third).playerId, 'p1');
});
