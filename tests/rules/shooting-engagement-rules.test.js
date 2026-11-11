import test from 'node:test';
import assert from 'node:assert/strict';
import { weaponAbilityCharacteristics } from '../../src/rules/weapon-ability-characteristics.js';
import { getShootingEngagementContext } from '../../src/rules/shooting-engagement-rules.js';
import { getAttackDamageForecast } from '../../src/rules/attack-damage-forecast.js';
import { getShootingTargetPriorities } from '../../src/rules/tactical-shooting-targets.js';
import { getShootingTargetOptions } from '../../src/application/shooting-workflow.js';

const gun = (abilities = {}) => ({
  id: 'lascannon', name: 'Ballistus Lascannon', type: 'ranged',
  characteristics: { range: 48, attacks: 2, skill: 3, strength: 12, ap: -3, damage: 4, ...abilities }
});
const unit = (id, ownerId, keywords, x, wounds = 12) => ({
  id, ownerId, name: id, status: 'deployed', keywords, position: { x, y: 0 },
  wounds, startingWounds: wounds, modelCount: 1, startingStrength: 1, currentStrength: 1,
  characteristics: { toughness: 10, save: 2, invulnerableSave: 5, ballisticSkill: 3, weaponSkill: 3 }
});
function battle() {
  return {
    phase: 'shooting', turn: 2, activePlayer: 'p2',
    battle: { round: 2, status: 'active', activePlayerId: 'p2', firstPlayerId: 'p1' },
    history: [],
    armyRosters: {}, objectives: [], players: [{ id: 'p1' }, { id: 'p2' }],
    units: [
      unit('ballistus', 'p2', ['Vehicle'], 0),
      unit('galatus', 'p1', ['Adeptus Custodes', 'Vehicle', 'Walker'], 15, 10),
      unit('terminators', 'p2', ['Infantry'], 15),
      unit('telemon', 'p1', ['Vehicle'], 22, 14)
    ]
  };
}
function engage(state) {
  state.history.push({
    type: 'charge.outcome_recorded',
    payload: { unitId: 'terminators', targetIds: ['galatus'], outcome: 'successful', turn: 1, round: 2 }
  });
}
const incoming = state => getAttackDamageForecast(state, {
  attackerId: 'ballistus', targetId: 'galatus', weapon: gun()
});

test('11e: outside Ballistus can shoot an engaged Galatus at -1 Hit in forecasts and target ranking', () => {
  const state = battle();
  const unengaged = incoming(state);
  engage(state);
  const engaged = incoming(state);
  assert.ok(unengaged?.expectedDamage > engaged?.expectedDamage, 'engagement lowers incoming damage');
  assert.ok(engaged?.appliedRules.some(rule => /Engagement shooting.*-1 to Hit/.test(rule)));
  const rules = getShootingEngagementContext(state, {
    attackerId: 'ballistus', targetId: 'galatus', weapon: gun()
  });
  assert.equal(rules.eligible, true);
  assert.equal(rules.hitModifier, 1);
  const ranked = getShootingTargetPriorities(state, {
    playerId: 'p2', attackerId: 'ballistus', weapon: gun()
  }).priorities.find(option => option.targetUnitId === 'galatus');
  assert.ok(ranked, 'engaged Vehicle is retained for shooting advice');
  assert.equal(ranked.engagement.hitModifier, 1);
  assert.ok(Math.abs(ranked.expectedDamage - engaged.expectedDamage) < 1e-9);

  state.history.push({
    type: 'shooting.unit_activated',
    payload: { unitId: 'ballistus', playerId: 'p2', actionType: 'shoot', round: 2, turn: 2 }
  });
  assert.ok(getShootingTargetOptions(state, { attackerId: 'ballistus', weapon: gun() })
    .some(target => target.unitId === 'galatus'));
});

test('11e: Blast cannot target an engaged Vehicle and is absent from the iPad target picker', () => {
  const state = battle();
  engage(state);
  const blast = gun({ blast: 2 });
  const rules = getShootingEngagementContext(state, {
    attackerId: 'ballistus', targetId: 'galatus', weapon: blast
  });
  assert.equal(rules.eligible, false);
  assert.match(rules.reason, /Blast/i);
  assert.equal(getAttackDamageForecast(state, { attackerId: 'ballistus', targetId: 'galatus', weapon: blast }), null);
  assert.ok(!getShootingTargetPriorities(state, {
    playerId: 'p2', attackerId: 'ballistus', weapon: blast
  }).priorities.some(option => option.targetUnitId === 'galatus'));

  state.history.push({
    type: 'shooting.unit_activated',
    payload: { unitId: 'ballistus', playerId: 'p2', actionType: 'shoot', round: 2, turn: 2 }
  });
  assert.ok(!getShootingTargetOptions(state, { attackerId: 'ballistus', weapon: blast })
    .some(target => target.unitId === 'galatus'));
  assert.ok(getShootingTargetOptions(state, { attackerId: 'ballistus', weapon: blast })
    .some(target => target.unitId === 'telemon'), 'Blast can target an unengaged Vehicle');
});

test('11e: engaged infantry cannot fire standard guns, but Close-Quarters can fire at its engaged target', () => {
  const state = battle();
  engage(state);
  const rifle = gun();
  const closeQuarters = gun({ closeQuarters: true });
  const unavailable = getShootingEngagementContext(state, {
    attackerId: 'terminators', targetId: 'galatus', weapon: rifle
  });
  assert.equal(unavailable.eligible, false);
  assert.equal(getShootingEngagementContext(state, {
    attackerId: 'terminators', targetId: 'telemon', weapon: closeQuarters
  }).eligible, false);
  const legal = getShootingEngagementContext(state, {
    attackerId: 'terminators', targetId: 'galatus', weapon: closeQuarters
  });
  assert.equal(legal.eligible, true);
  assert.equal(legal.hitModifier, 0);
  assert.ok(getAttackDamageForecast(state, {
    attackerId: 'terminators', targetId: 'galatus', weapon: closeQuarters
  })?.appliedRules.some(rule => /Close-Quarters/.test(rule)));
});

test('11e: engaged Vehicle can shoot outward at -1, into its own melee with -1 or CQ at no penalty', () => {
  const state = battle();
  engage(state);
  const ordinary = getShootingEngagementContext(state, {
    attackerId: 'galatus', targetId: 'terminators', weapon: gun()
  });
  assert.equal(ordinary.eligible, true);
  assert.equal(ordinary.hitModifier, 1);
  const intoDistance = getShootingEngagementContext(state, {
    attackerId: 'galatus', targetId: 'ballistus', weapon: gun()
  });
  assert.equal(intoDistance.eligible, true);
  assert.equal(intoDistance.hitModifier, 1);
  const cq = getShootingEngagementContext(state, {
    attackerId: 'galatus', targetId: 'terminators', weapon: gun({ closeQuarters: true })
  });
  assert.equal(cq.eligible, true);
  assert.equal(cq.hitModifier, 0);
  assert.equal(getShootingEngagementContext(state, {
    attackerId: 'galatus', targetId: 'terminators', weapon: gun({ blast: 1 })
  }).eligible, false);
  assert.equal(getShootingEngagementContext(state, {
    attackerId: 'galatus', targetId: 'ballistus', weapon: gun({ blast: 1 })
  }).eligible, true, 'engaged Vehicle may fire Blast at an unengaged outside target');
});

test('11e: an outside unit cannot shoot engaged infantry even if it is a Vehicle', () => {
  const state = battle();
  state.units.push(unit('screen', 'p1', ['Infantry'], 15));
  state.history.push({
    type: 'charge.outcome_recorded',
    payload: { unitId: 'terminators', targetIds: ['screen'], outcome: 'successful' }
  });
  assert.equal(getShootingEngagementContext(state, {
    attackerId: 'ballistus', targetId: 'screen', weapon: gun()
  }).eligible, false);
});

test('11e: Advance blocks close-quarters shooting, and Fall Back clears known engagement', () => {
  const state = battle();
  engage(state);
  state.history.push({
    type: 'unit.advanced', payload: { unitId: 'galatus', round: 2, turn: 2 }
  });
  assert.equal(getShootingEngagementContext(state, {
    attackerId: 'galatus', targetId: 'terminators', weapon: gun()
  }).eligible, false);
  state.history.push({
    type: 'unit.fell_back', payload: { unitId: 'terminators', round: 2, turn: 2 }
  });
  const after = getShootingEngagementContext(state, {
    attackerId: 'ballistus', targetId: 'galatus', weapon: gun()
  });
  assert.equal(after.targetEngaged, false);
  assert.equal(after.hitModifier, 0);
});

test('reviewed weapon keywords recognize Close-Quarters and legacy Pistol without confusing Blast', () => {
  assert.equal(weaponAbilityCharacteristics('Close-Quarters').closeQuarters, true);
  assert.equal(weaponAbilityCharacteristics('Pistol, Rapid Fire 1').closeQuarters, true);
  assert.equal(weaponAbilityCharacteristics('Blast 2').blast, 2);
  assert.equal(weaponAbilityCharacteristics('Blast 2').closeQuarters, undefined);
});
