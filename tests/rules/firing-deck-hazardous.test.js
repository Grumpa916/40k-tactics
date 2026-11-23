import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { getShootingWeaponOptions } from '../../src/application/shooting-workflow.js';
import { renderShootingWeaponChoices } from '../../src/ui/shooting-weapon-picker.js';
import { recordShootingActivation } from '../../src/engine/shooting-transitions.js';
import { resolveUnitAttack } from '../../src/engine/combat-transitions.js';
import { resolveFiringDeckHazardous } from '../../src/engine/firing-deck-transitions.js';
import { getFiringDeckCapacity } from '../../src/rules/firing-deck.js';

const plasma = {
  name: 'Plasma Pistol - Supercharge', range: '12"', attacks: '1', skill: '3+', strength: 8, ap: -3, damage: 2,
  abilities: 'Hazardous, Pistol'
};
const rifle = {
  name: 'Bolt Rifle', range: '24"', attacks: '2', skill: '3+', strength: 4, ap: -1, damage: 1, abilities: 'Rapid Fire 1'
};

function battle() {
  return createGameState({
    phase: 'shooting', turn: 1, activePlayer: 'p1',
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    battle: { id: 'b', status: 'active', round: 1, activePlayerId: 'p1' },
    armyRosters: { p1: { faction: 'Space Marines', units: [
      { id: 'r-impulsor', name: 'Impulsor', modelCount: 1, datasheetId: 'space-marines:impulsor', datasheet: {
        weapons: [{ name: 'Storm Bolter', range: '24"', attacks: '2', skill: '3+', strength: 4, ap: 0, damage: 1, abilities: 'Rapid Fire 2' }]
      } },
      { id: 'r-squad', name: 'Intercessor Squad', modelCount: 5, datasheet: { weapons: [plasma, rifle] } },
      { id: 'r-extra', name: 'Second Squad', modelCount: 5, datasheet: { weapons: [plasma] } }
    ] } },
    units: [
      { id: 'impulsor', name: 'Impulsor', ownerId: 'p1', status: 'deployed', wounds: 11, position: { x: 10, y: 10 }, metadata: { rosterUnitId: 'r-impulsor', datasheetId: 'space-marines:impulsor' } },
      { id: 'a-squad', name: 'Intercessor Squad', ownerId: 'p1', status: 'embarked', transportId: 'impulsor', wounds: 10, metadata: { rosterUnitId: 'r-squad' } },
      { id: 'z-extra', name: 'Second Squad', ownerId: 'p1', status: 'embarked', transportId: 'impulsor', wounds: 10, metadata: { rosterUnitId: 'r-extra' } },
      { id: 'enemy', name: 'Enemy', ownerId: 'p2', status: 'deployed', wounds: 8, position: { x: 20, y: 10 } }
    ]
  });
}

test('Impulsor Firing Deck 7 offers the embarked unit weapons and leaves the transport off the Hazardous test', () => {
  const state = battle();
  assert.equal(getFiringDeckCapacity(state, state.units[0]), 7);
  const activated = recordShootingActivation(state, { unitId: 'impulsor', actionType: 'shoot' });
  const weapons = getShootingWeaponOptions(activated, { attackerId: 'impulsor' });
  const hazardous = weapons.find(weapon => weapon.firingDeck && /Plasma Pistol/.test(weapon.name));
  const safe = weapons.find(weapon => weapon.firingDeck && weapon.name.includes('Bolt Rifle'));
  assert.ok(hazardous);
  assert.match(hazardous.name, /Intercessor Squad/);
  assert.equal(hazardous.sourceUnitId, 'a-squad');
  assert.equal(hazardous.hazardousBearerId, 'a-squad');
  assert.equal(safe.hazardousBearerId, null);
  assert.equal(weapons.some(weapon => weapon.sourceUnitId === 'z-extra'), false);
  const picker = renderShootingWeaponChoices(weapons, hazardous.id);
  assert.match(picker, /taken by Intercessor Squad/);
  assert.match(picker, /transport does not take this test/);

  const shot = resolveUnitAttack(activated, {
    attackerId: 'impulsor', targetId: 'enemy', weapon: hazardous, actualDamage: 2
  });
  const attack = shot.history.at(-1).payload;
  assert.equal(attack.attackerId, 'impulsor');
  assert.equal(attack.sourceAttackerId, 'a-squad');
  assert.equal(attack.firingDeck, true);
  assert.equal(attack.hazardousBearerId, 'a-squad');
  assert.equal(shot.units.find(unit => unit.id === 'impulsor').wounds, 11);

  const resolved = resolveFiringDeckHazardous(shot, { transportId: 'impulsor', bearerId: 'a-squad', mortalWounds: 3 });
  assert.equal(resolved.units.find(unit => unit.id === 'a-squad').wounds, 7);
  assert.equal(resolved.units.find(unit => unit.id === 'impulsor').wounds, 11);
  assert.equal(resolved.history.at(-1).type, 'firing_deck.hazardous_resolved');
  assert.equal(resolved.history.at(-1).payload.bearerId, 'a-squad');
  assert.throws(
    () => resolveFiringDeckHazardous(shot, { transportId: 'impulsor', bearerId: 'impulsor', mortalWounds: 3 }),
    /transport does not take the Hazardous test/
  );
});
