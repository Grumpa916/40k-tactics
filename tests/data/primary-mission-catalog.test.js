import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIMARY_FORCE_DISPOSITIONS,
  PRIMARY_MISSION_MATRIX,
  getPrimaryMissionDefinition,
  getBattlePrimaryMissionDefinitions,
  listPrimaryMissionDefinitions
} from '../../src/data/primary-mission-catalog.js';
import { getMissionActionOptions } from '../../src/rules/mission-action-state.js';

const EXPECTED = [
  'Battlefield Dominance','Immovable Object','Determined Acquisition','Purge and Secure','Inescapable Dominion',
  'Unstoppable Force','Meatgrinder','Punishment','Consecrate',"Destroyer's Wrath",
  'Death Trap','Delaying Action','Outmanoeuvre','Smoke and Mirrors','Locate and Deny',
  'Reconnaissance Sweep','Triangulation','Surveil the Foe','Gather Intel','Search and Scour',
  'Secure Asset','Vital Link','Extract Relic','Vanguard Operation','Sabotage'
];

test('primary mission catalog contains the complete directional 5 x 5 matrix', () => {
  assert.equal(PRIMARY_FORCE_DISPOSITIONS.length, 5);
  for (const own of PRIMARY_FORCE_DISPOSITIONS) {
    for (const opponent of PRIMARY_FORCE_DISPOSITIONS) {
      const mission = getPrimaryMissionDefinition(own, opponent);
      assert.ok(mission, `${own} vs ${opponent}`);
      assert.equal(mission.category, 'primary');
      assert.ok(mission.scoring.length > 0);
      assert.equal(mission.manualConfirmationRequired, true);
    }
  }
  const definitions = listPrimaryMissionDefinitions();
  assert.equal(definitions.length, 25);
  assert.deepEqual([...new Set(definitions.map(item => item.name))].sort(), EXPECTED.sort());
});

test('directional resolver gives each player the correct primary', () => {
  const resolved = getBattlePrimaryMissionDefinitions('Reconnaissance', 'Purge the Foe');
  assert.equal(resolved.myMission.name, 'Triangulation');
  assert.equal(resolved.opponentMission.name, 'Consecrate');
  assert.equal(PRIMARY_MISSION_MATRIX['Priority Assets']['Reconnaissance'].name, 'Vanguard Operation');
});

test('shooting mission actions include the resolved primary action when applicable', () => {
  const state = {
    phase: 'shooting',
    activePlayer: 'p1',
    battle: { status: 'active', round: 2, activePlayerId: 'p1' },
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    preGameSetup: { attackerPlayerId: 'p1', defenderPlayerId: 'p2' },
    objectives: [
      { id: 'attacker-home', layoutObjective: 'Attacker Home' },
      { id: 'defender-home', layoutObjective: 'Defender Home' }
    ],
    battlefieldMap: { missionSetup: { myDisposition: 'Reconnaissance', opponentDisposition: 'Purge the Foe' } },
    scoring: { secondaryMissions: [] },
    history: []
  };
  const actions = getMissionActionOptions(state, 'p1');
  assert.equal(actions[0].missionKind, 'primary');
  assert.equal(actions[0].definitionId, 'primary-triangulation');
  assert.match(actions[0].name, /Triangulation/);
  assert.match(actions[0].name, /Triangulate/);
  assert.deepEqual(actions[0].timings, ['end-of-turn']);
});

test('round-gated primary actions stay unavailable until their minimum round', () => {
  const state = {
    phase: 'shooting', activePlayer: 'p1',
    battle: { status: 'active', round: 1, activePlayerId: 'p1' },
    players: [{ id: 'p1' }, { id: 'p2' }],
    battlefieldMap: { missionSetup: { myDisposition: 'Reconnaissance', opponentDisposition: 'Purge the Foe' } },
    scoring: { secondaryMissions: [] }, history: []
  };
  assert.equal(getMissionActionOptions(state, 'p1').length, 0);
});
