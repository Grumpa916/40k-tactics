import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { createChargeScreen } from '../../src/ui/charge-screen.js';
import { createFightScreen } from '../../src/ui/fight-screen.js';
import { getChargeViewModel } from '../../src/application/charge-workflow.js';
import { getFightAttackOptions } from '../../src/application/fight-workflow.js';
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

test('Charge outcomes stay in the fixed footer and a recorded result can be undone', () => {
  const x=setup();
  try {
    click(x,'data-select-phase-unit','fighter');
    const html=x.root.innerHTML;
    const fixedStart=html.indexOf('class="combat-workspace__top-controls"');
    const scrollStart=html.indexOf('class="combat-workspace__scroll"');
    const footerStart=html.indexOf('<footer>',scrollStart);
    assert.ok(fixedStart>=0&&scrollStart>fixedStart&&footerStart>scrollStart);
    assert.doesNotMatch(html.slice(fixedStart,footerStart),/data-charge-success|data-charge-failed|data-charge-decline/);
    const footer=html.slice(footerStart,html.indexOf('</footer>',footerStart));
    assert.match(footer,/data-charge-success[\s\S]*data-charge-failed[\s\S]*data-charge-decline/);
    assert.equal(x.root.node('[data-charge-success]').disabled,true);
    click(x,'data-map-unit-id','enemy');
    measured(x,'enemy',6);
    assert.equal(x.root.node('[data-charge-success]').disabled,false);
    click(x,'data-charge-success');
    assert.equal(x.session.getState().history.filter(event=>event.type==='charge.outcome_recorded').length,1);
    assert.match(x.root.innerHTML,/data-live-undo aria-label="Undo charge result"/);
    assert.equal(x.session.undoLastAction(),true);
    assert.equal(getChargeViewModel(x.session.getState()).candidates.length,1);
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

test('Fight panel omits routine copy while retaining active combat controls', () => {
  const x=setup('fight',engage(state('fight'),['enemy']));
  try {
    click(x,'data-map-unit-id','fighter');
    const html=x.root.innerHTML;
    assert.doesNotMatch(html,/Other deployed formations: tap their map marker/);
    assert.doesNotMatch(html,/Choose weapon and target\. The first recorded attack/);
    assert.doesNotMatch(html,/Confirm Fight legality from the tabletop now/);
    assert.match(html,/Melee weapon/);
    assert.equal(x.root.querySelectorAll('[data-fight-weapon-choice]').length,2);
    assert.ok(x.root.querySelector('[data-fight-target]'));
    assert.ok(x.root.querySelector('[data-fight-attack]'));
    assert.ok(x.root.querySelector('[data-fight-complete]'));
  } finally { x.screen.destroy(); }
});

test('Fight weapon choices are visible once and require only one tap without changing combat state', () => {
  const x = setup('fight',engage(state('fight'),['enemy']));
  try {
    click(x,'data-map-unit-id','fighter');
    const html = x.root.innerHTML;
    assert.equal((html.match(/data-fight-weapon-choice="blade"/g) ?? []).length,1);
    assert.equal((html.match(/data-fight-weapon-choice="claws"/g) ?? []).length,1);
    assert.doesNotMatch(html,/<select data-fight-weapon/,'no native iPad popover duplicated over weapon choices');
    assert.equal(x.root.node('[data-fight-weapon-choice]','blade').getAttribute('aria-pressed'),'false');
    const before=JSON.stringify(x.session.getState());
    click(x,'data-fight-weapon-choice','blade');
    assert.equal(x.root.node('[data-fight-weapon-choice]','blade').getAttribute('aria-pressed'),'true');
    assert.equal(x.root.node('[data-fight-weapon-choice]','claws').getAttribute('aria-pressed'),'false');
    click(x,'data-fight-weapon-choice','claws');
    assert.equal(x.root.node('[data-fight-weapon-choice]','claws').getAttribute('aria-pressed'),'true');
    assert.equal(JSON.stringify(x.session.getState()),before,'previews never activate, spend CP or resolve attacks');
  } finally { x.screen.destroy(); }
});

test('Fight map preview does not activate; first attack and second weapon share one activation', () => {
  const x = setup('fight',engage(state('fight')));
  try {
    click(x,'data-map-unit-id','fighter');
    assert.equal(x.root.querySelector('[data-fight-begin]'),null);
    x.root.click('[data-fight-weapon-choice]','blade');
    click(x,'data-map-unit-id','enemy');
    assert.match(x.root.innerHTML,/value="enemy" selected/);
    assert.match(x.root.innerHTML,/expected retaliation/);
    assert.match(x.root.innerHTML,/data-view-key="fight-advisor-details"/);
    assert.match(x.root.innerHTML,/<summary>More analysis · survival, destruction &amp; rules<\/summary>/);
    assert.match(x.root.innerHTML,/class="fight-advisory__recommendation"/);
    assert.doesNotMatch(x.root.innerHTML,/<h2>Fight Advisor<\/h2>/, 'avoid duplicate panel headings in tabletop mode');
    click(x,'data-map-unit-id','enemy2');
    assert.match(x.root.innerHTML,/value="enemy2" selected/);
    assert.equal(x.session.getState().history.filter(e => e.type === 'fight.unit_activated').length,0);
    click(x,'data-fight-damage-plus'); click(x,'data-fight-attack');
    assert.equal(x.session.getState().units.find(u => u.id === 'enemy2').wounds,19);
    assert.equal(x.root.node('[data-fight-target]').disabled,false);
    const receiptMarkup = x.root.innerHTML.split('<footer>')[1];
    assert.match(receiptMarkup,/live-action-receipt--compact/);
    assert.match(receiptMarkup,/data-live-undo aria-label="Undo attack" title="Undo attack">Undo<\/button>/);
    assert.ok(receiptMarkup.indexOf('data-live-undo') < receiptMarkup.indexOf('data-fight-finish-entry'));
    x.root.click('[data-fight-weapon-choice]','claws'); click(x,'data-map-unit-id','enemy');
    click(x,'data-fight-damage-plus'); click(x,'data-fight-attack');
    const history=x.session.getState().history;
    assert.equal(history.filter(e => e.type === 'fight.unit_activated').length,1);
    assert.equal(history.find(e => e.type === 'fight.unit_activated').payload.tabletopConfirmed,true);
    const attacks=history.filter(e => e.type === 'combat.attack_resolved');
    assert.deepEqual(attacks.map(e => e.payload.weaponId),['blade','claws']);
    assert.deepEqual(attacks.map(e => e.payload.actualDamage),[1,1]);
    assert.equal(x.session.getState().units.find(u => u.id === 'enemy').wounds,19);
  } finally { x.screen.destroy(); }
});

test('Fight map allows tabletop-confirmed activation while Fights First remains advisory', () => {
  const x = setup('fight',engage(state('fight'),['enemy']));
  try {
    click(x,'data-map-unit-id','enemy');
    assert.match(x.root.innerHTML,/Fights First still pending/);
    x.root.click('[data-fight-weapon-choice]','blade'); click(x,'data-map-unit-id','fighter');
    click(x,'data-fight-damage-plus'); click(x,'data-fight-attack');
    const activation=x.session.getState().history.find(e => e.type === 'fight.unit_activated' && e.payload.unitId === 'enemy');
    assert.equal(activation.payload.tabletopConfirmed,true);
    assert.equal(activation.payload.fightsFirst,false);
    assert.equal(x.session.getState().units.find(u => u.id === 'fighter').wounds,19);
    assert.ok(x.session.getState().history.every(e => e.type !== 'combat.activation_finished' || e.payload.unitId !== 'fighter'));
  } finally { x.screen.destroy(); }
});

test('Do not fight excludes attack entry, wrong-phase rejection is visible and leaves state unchanged', () => {
  const x = setup('fight',state('fight'));
  try {
    click(x,'data-map-unit-id','fighter'); click(x,'data-fight-skip');
    assert.equal(getFightAttackOptions(x.session.getState(), { attackerId:'fighter', includeCandidates:true }).attackers.some(unit => unit.unitId === 'fighter'),false,
      'skipped formations must not re-enter the tabletop-confirmed Fight picker');
    click(x,'data-map-unit-id','fighter');
    assert.match(x.root.innerHTML,/finished its Fight activation/);
    assert.equal(x.root.querySelector('[data-fight-attack]'),null);
  } finally { x.screen.destroy(); }
  const initial=state('command'), y=setup('fight',initial);
  try {
    click(y,'data-map-unit-id','fighter'); y.root.click('[data-fight-weapon-choice]','blade'); click(y,'data-map-unit-id','enemy'); click(y,'data-fight-attack');
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

test('finishing Fight activation persists across remount and rejects further attacks', () => {
  const x = setup('fight',engage(state('fight'),['enemy']));
  try {
    click(x,'data-map-unit-id','fighter'); x.root.click('[data-fight-weapon-choice]','blade');
    click(x,'data-map-unit-id','enemy'); click(x,'data-fight-damage-plus'); click(x,'data-fight-attack');
    const [scrollContent, footerContent] = x.root.innerHTML.split('<footer>');
    assert.doesNotMatch(scrollContent, /data-fight-finish-entry/, 'Finish unit must not be buried inside the scrollable controls');
    assert.match(footerContent, /data-fight-finish-entry>Finish unit<\/button>/, 'Finish unit stays in the fixed footer');
    assert.equal(x.root.querySelector('[data-fight-complete]'), null, 'do not offer phase completion while recording a unit');
    click(x,'data-fight-finish-entry');
    assert.ok(x.session.getState().history.some(e => e.type === 'combat.activation_finished'));
    assert.ok(x.root.querySelector('[data-fight-complete]'), 'End Fight returns after the activation is finished');
    x.screen.destroy();
    const reloaded=setup('fight',JSON.parse(JSON.stringify(x.session.getState())));
    try {
      click(reloaded,'data-map-unit-id','fighter');
      assert.match(reloaded.root.innerHTML,/finished its Fight activation/);
      assert.equal(reloaded.root.querySelector('[data-fight-attack]'),null);
      assert.throws(() => reloaded.session.dispatch({type:'combat.resolve_attack',payload:{attackerId:'fighter',targetId:'enemy',weapon:blade,actualDamage:1}}), /finished its activation/);
    } finally { reloaded.screen.destroy(); }
  } finally { x.screen.destroy(); }
});

test('End Fight reviews remaining inferred combats and closes open activations before advancing', () => {
  const x=setup('fight',engage(state('fight'),['enemy']));
  try {
    click(x,'data-map-unit-id','fighter'); x.root.click('[data-fight-weapon-choice]','blade'); click(x,'data-map-unit-id','enemy'); click(x,'data-fight-attack');
    x.screen.requestPhaseEnd();
    assert.match(x.root.innerHTML,/remaining inferred combats/);
    assert.equal(x.root.querySelector('[data-fight-complete]'),null,'confirmation replaces, not duplicates, End Fight');
    click(x,'data-fight-cancel-end');
    assert.equal(x.session.getState().phase,'fight');
    click(x,'data-fight-finish-entry');
    click(x,'data-fight-complete'); click(x,'data-fight-confirm-end');
    const result=x.session.getState();
    assert.equal(result.phase,'end_turn');
    assert.ok(result.history.some(e=>e.type==='fight.unit_activated'&&e.payload.unitId==='enemy'&&e.payload.actionType==='not_fight'));
    assert.ok(result.history.some(e=>e.type==='combat.activation_finished'&&e.payload.unitId==='fighter'));
  } finally { x.screen.destroy(); }
});

test('Fight map keeps unit coordinates and selected fighter without zoom controls', () => {
  const initial=engage(state('fight'),['enemy']), positions=JSON.stringify(initial.units.map(u=>u.position));
  const x=setup('fight',initial);
  try {
    click(x,'data-map-unit-id','fighter');
    assert.equal(x.root.querySelector('[data-map-zoom]'),null);
    x.root.click('[data-fight-weapon-choice]','blade');
    assert.equal(JSON.stringify(x.session.getState().units.map(u=>u.position)),positions);
    assert.match(x.root.innerHTML,/<h1>fighter<\/h1>/);
  } finally { x.screen.destroy(); }
});


test('opponent Charge screen shows incoming threat, not the opponent offensive ranking', () => {
  const x = setup('charge', state('charge', 'p2'));
  try {
    click(x, 'data-map-unit-id', 'enemy');
    assert.match(x.root.innerHTML, /data-incoming-charge-advisor/);
    assert.match(x.root.innerHTML, /Incoming charge · Defensive review/);
    assert.match(x.root.innerHTML, /estimated charge chance|incoming Fight damage|confirm measured distance/);
    assert.doesNotMatch(x.root.innerHTML, /Charge Priorities|Strategic value:/);
    click(x, 'data-map-unit-id', 'fighter');
    measured(x, 'fighter', 6);
    assert.equal(x.root.node('[data-charge-success]').disabled, false);
  } finally { x.screen.destroy(); }
});
