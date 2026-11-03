import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { recordFightActivation } from '../../src/engine/fight-transitions.js';
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

test('tabletop confirmation can record a real Fight without inferred eligibility or ordering blocks', () => {
  const state = fightState();
  const enemyFirst = recordFightActivation(state, {
    unitId: 'enemy',
    actionType: 'fight',
    tabletopConfirmed: true
  });
  const enemyEvent = enemyFirst.history.at(-1);
  assert.equal(enemyEvent.type, 'fight.unit_activated');
  assert.equal(enemyEvent.payload.unitId, 'enemy');
  assert.equal(enemyEvent.payload.fightsFirst, false);
  assert.equal(enemyEvent.payload.tabletopConfirmed, true);

  const other = recordFightActivation(state, {
    unitId: 'other',
    actionType: 'fight',
    tabletopConfirmed: true
  });
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
    unitId: 'enemy',
    actionType: 'fight',
    tabletopConfirmed: true
  });
  assert.throws(
    () => recordFightActivation(once, {
      unitId: 'enemy',
      actionType: 'fight',
      tabletopConfirmed: true
    }),
    /only once per turn/
  );
});
