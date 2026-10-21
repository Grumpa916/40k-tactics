import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { createChargeScreen } from '../../src/ui/charge-screen.js';
import { createFightScreen } from '../../src/ui/fight-screen.js';
import { getChargeViewModel } from '../../src/application/charge-workflow.js';
import { getFightAdvisorContext } from '../../src/application/fight-advisor-context.js';
import { getFightOpportunityRecommendations } from '../../src/rules/tactical-fight-opportunities.js';
import { fakeDom } from '../helpers/combat-dom.js';

const blade = { id:'blade', name:'Blade', type:'melee', characteristics:{ attacks:4, weaponSkill:3, strength:5, ap:-1, damage:2 } };
const claws = { ...blade, id:'claws', name:'Claws', characteristics:{ ...blade.characteristics, attacks:2, damage:1 } };
const gameData = { weapons:[blade, claws] };
function state(phase = 'charge', activePlayer = 'p1') {
  const unit = (id, ownerId, x, y) => ({ id, name:id, ownerId, status:'deployed', wounds:20, maxWounds:20, position:{x,y}, profile:{ weaponIds:['blade','claws'], characteristics:{ weaponSkill:3, toughness:5, save:3 } } });
  return createGameState({ phase, turn:1, activePlayer, battle:{ id:'b', status:'active', round:1, firstPlayerId:'p1', activePlayerId:activePlayer }, players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}], units:[unit('fighter','p1',20,20),unit('enemy','p2',25,20),unit('enemy2','p2',26,21)] });
}
function setup(phase = 'charge', initial = state(phase)) {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const session = createGameSession(initial), root = fakeDom();
  const screen = (phase === 'charge' ? createChargeScreen : createFightScreen)(root, { session, perspectivePlayerId:'p1', gameData });
  return { session, root, screen };
}
const click = (x, attr, value = null) => x.root.click('['+attr+']', value);
function measured(x, target, distance) {
  const button = x.root.querySelectorAll('[data-charge-distance-value]').find(n => n.getAttribute('data-charge-distance') === target && n.getAttribute('data-charge-distance-value') === String(distance));
  assert.ok(button); button.events.click({ target:button });
}
function engage(initial, targets = ['enemy','enemy2']) {
  initial.history.push({ type:'charge.outcome_recorded', payload:{ unitId:'fighter', playerId:'p1', outcome:'successful', targetIds:targets, measuredDistances:Object.fromEntries(targets.map(id => [id,5])), turn:1, round:1 } });
  return initial;
}

test('Charge map selects multiple declared targets and records fresh preset distances once', () => {
  const x = setup();
  try {
    click(x,'data-map-unit-id','fighter');
    click(x,'data-map-unit-id','enemy');
    click(x,'data-map-unit-id','enemy2');
    measured(x,'enemy',5);
    assert.equal(x.root.node('[data-charge-success]').disabled,true);
    measured(x,'enemy2',6);
    assert.equal(x.root.node('[data-charge-success]').disabled,false);
    click(x,'data-charge-success');
    const outcome = x.session.getState().history.find(e => e.type === 'charge.outcome_recorded');
    assert.deepEqual(outcome.payload.targetIds,['enemy','enemy2']);
    assert.deepEqual(outcome.payload.measuredDistances,{enemy:5,enemy2:6});
    assert.equal(getChargeViewModel(x.session.getState()).candidates.length,0);
    assert.match(x.root.innerHTML,/Charge history · 1/);
    click(x,'data-charge-complete');
    assert.equal(x.session.getState().phase,'fight');
  } finally { x.screen.destroy(); }
});

test('Charge target removal clears its measurement; failed opponent charge uses active army', () => {
  const x = setup('charge',state('charge','p2'));
  try {
    click(x,'data-map-unit-id','enemy'); click(x,'data-map-unit-id','fighter'); measured(x,'fighter',5);
    click(x,'data-map-unit-id','fighter'); click(x,'data-map-unit-id','fighter');
    assert.equal(x.root.node('[data-charge-failed]').disabled,true);
    measured(x,'fighter',6); click(x,'data-charge-failed');
    const event = x.session.getState().history.find(e => e.type === 'charge.outcome_recorded');
    assert.equal(event.payload.playerId,'p2'); assert.equal(event.payload.outcome,'failed');
    assert.deepEqual(event.payload.measuredDistances,{fighter:6});
  } finally { x.screen.destroy(); }
});

test('Fight map preview does not activate; first attack and second weapon share one activation', () => {
  const x = setup('fight',engage(state('fight')));
  try {
    click(x,'data-map-unit-id','fighter');
    x.root.change('[data-fight-weapon]','blade');
    click(x,'data-map-unit-id','enemy');
    assert.match(x.root.innerHTML,/value="enemy" selected/);
    assert.match(x.root.innerHTML,/expected retaliation/);
    click(x,'data-map-unit-id','enemy2');
    assert.match(x.root.innerHTML,/value="enemy2" selected/);
    assert.equal(x.session.getState().history.filter(e => e.type === 'fight.unit_activated').length,0);
    click(x,'data-fight-damage-plus'); click(x,'data-fight-attack');
    assert.equal(x.session.getState().units.find(u => u.id === 'enemy2').wounds,19);
    assert.equal(x.root.node('[data-fight-target]').disabled,false);
    x.root.change('[data-fight-weapon]','claws'); click(x,'data-map-unit-id','enemy');
    click(x,'data-fight-damage-plus'); click(x,'data-fight-attack');
    const history=x.session.getState().history;
    assert.equal(history.filter(e => e.type === 'fight.unit_activated').length,1);
    const attacks=history.filter(e => e.type === 'combat.attack_resolved');
    assert.deepEqual(attacks.map(e => e.payload.weaponId),['blade','claws']);
    assert.deepEqual(attacks.map(e => e.payload.actualDamage),[1,1]);
    assert.equal(x.session.getState().units.find(u => u.id === 'enemy').wounds,19);
  } finally { x.screen.destroy(); }
});

test('Fight map cannot activate a normal fighter before Fights First; either side can record damage', () => {
  const x = setup('fight',engage(state('fight'),['enemy']));
  try {
    click(x,'data-map-unit-id','enemy');
    assert.match(x.root.innerHTML,/cannot begin a Fight activation yet/);
    assert.equal(x.session.getState().history.filter(e => e.type === 'fight.unit_activated').length,0);
    click(x,'data-map-unit-id','fighter'); click(x,'data-fight-begin'); click(x,'data-fight-finish-entry');
    click(x,'data-map-unit-id','enemy'); x.root.change('[data-fight-weapon]','blade'); click(x,'data-map-unit-id','fighter');
    click(x,'data-fight-damage-plus'); click(x,'data-fight-attack');
    assert.equal(x.session.getState().units.find(u => u.id === 'fighter').wounds,19);
  } finally { x.screen.destroy(); }
});

test('Do not fight excludes attack entry, wrong-phase rejection is visible and leaves state unchanged', () => {
  const x = setup('fight',state('fight'));
  try {
    click(x,'data-map-unit-id','fighter'); click(x,'data-fight-skip');
    click(x,'data-map-unit-id','fighter');
    assert.match(x.root.innerHTML,/cannot begin a Fight activation yet/);
    assert.equal(x.root.querySelector('[data-fight-attack]'),null);
  } finally { x.screen.destroy(); }
  const initial=state('command'), y=setup('fight',initial);
  try {
    click(y,'data-map-unit-id','fighter'); click(y,'data-fight-begin');
    assert.match(y.root.innerHTML,/Fight activations may only be recorded in the Fight phase/);
    assert.equal(y.session.getState(),initial);
  } finally { y.screen.destroy(); }
});

test('Fight advisor resolves enemy catalog weapons without mutating the live state', () => {
  const initial=engage(state('fight'),['enemy']);
  const before=JSON.stringify(initial), enriched=getFightAdvisorContext(initial,gameData);
  const advice=getFightOpportunityRecommendations(enriched,{playerId:'p1',options:[{unitId:'fighter',targetUnitId:'enemy',weapon:blade}]});
  assert.equal(JSON.stringify(initial),before);
  assert.ok(advice[0].retaliationExpectedDamage>0);
});
