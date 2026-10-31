import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFullGameVerificationState,
  FULL_GAME_VERIFICATION_BATTLE_ID
} from '../../src/application/full-game-verification-preset.js';
import { getBattlePrimaryMissionDefinitions } from '../../src/data/primary-mission-catalog.js';
import { createLocalBattleStore } from '../../src/persistence/local-battle-store.js';

function rosterTotal(roster) {
  return (roster?.units ?? []).reduce((sum, unit) => sum + (Number.isFinite(Number(unit.points)) ? Number(unit.points) : 0), 0);
}

test('full-game verification preset preloads two real rosters and repeatable mission setup', () => {
  const state = createFullGameVerificationState();
  assert.equal(state.battle.id, FULL_GAME_VERIFICATION_BATTLE_ID);
  assert.equal(state.battle.status, 'setup');
  assert.equal(state.phase, 'setup');
  assert.equal(state.battleSetup.battleSize, 'strike_force');

  const mine = state.armyRosters.p1;
  const opponent = state.armyRosters.p2;
  assert.equal(mine.faction, 'Adeptus Custodes');
  assert.equal(mine.detachment, 'Guardians of the Throne');
  assert.equal(opponent.faction, 'Tyranids');
  assert.equal(opponent.detachment, 'Vanguard Onslaught');
  assert.ok(mine.units.length >= 9);
  assert.ok(opponent.units.length >= 10);
  assert.ok(mine.units.every(unit => unit.datasheetId && unit.points != null));
  assert.ok(opponent.units.every(unit => unit.datasheetId && unit.points != null));
  assert.ok(rosterTotal(mine) <= 2000);
  assert.ok(rosterTotal(opponent) <= 2000);

  const trajann = mine.units.find(unit => unit.id === 'trajann');
  const wardens = mine.units.find(unit => unit.id === 'wardens');
  const prime = opponent.units.find(unit => unit.id === 'tyranid-prime');
  const hormagaunts = opponent.units.find(unit => unit.id === 'hormagaunts');
  assert.equal(trajann.attachedToBodyguardId, 'wardens');
  assert.deepEqual(wardens.attachedLeaderIds, ['trajann']);
  assert.equal(prime.attachedToBodyguardId, 'hormagaunts');
  assert.deepEqual(hormagaunts.attachedLeaderIds, ['tyranid-prime']);

  assert.deepEqual(state.battlefieldMap.missionSetup, {
    myDisposition: 'Purge the Foe', opponentDisposition: 'Reconnaissance', layout: 'A'
  });
  const missions = getBattlePrimaryMissionDefinitions('Purge the Foe', 'Reconnaissance');
  assert.equal(missions.myMission.name, 'Consecrate');
  assert.equal(missions.opponentMission.name, 'Triangulation');
  assert.equal(state.scoring.secondaryMissionModeByPlayer.p1, 'tactical');
  assert.equal(state.scoring.secondaryMissionModeByPlayer.p2, 'tactical');
  assert.equal(state.preGameSetup.attackerPlayerId, 'p1');
  assert.equal(state.preGameSetup.defenderPlayerId, 'p2');
  assert.equal(state.preGameSetup.firstPlayerId, null);
  assert.ok(state.objectives.length >= 5);

  assert.equal(state.units.length, mine.units.length + opponent.units.length);
  assert.ok(state.units.every(unit => unit.status === 'reserves'));
  for (const unit of state.units) {
    assert.ok(state.battlefieldMap.deploymentPlan[unit.id], `missing deployment plan position for ${unit.id}`);
  }
});

test('verification mode can use a separate IndexedDB recovery database name', async () => {
  let openedName = null;
  const request = {};
  const database = {
    open(name) {
      openedName = name;
      queueMicrotask(() => {
        request.error = new Error('expected test failure');
        request.onerror?.();
      });
      return request;
    }
  };
  const store = createLocalBattleStore(database, { databaseName: '40k-tactics-verification-recovery' });
  await assert.rejects(store.load(), /expected test failure/);
  assert.equal(openedName, '40k-tactics-verification-recovery');
});
