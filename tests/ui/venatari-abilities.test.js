import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { renderRulesReminderDialog, renderUnitRulesReminders, createRulesReminderController } from '../../src/ui/rules-reminder-panel.js';
import { recordVenatariAbilityUse } from '../../src/engine/venatari-ability-transitions.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { createMovementScreen } from '../../src/ui/movement-screen.js';
import { summarizeGameEvent } from '../../src/ui/battle-context-panels.js';
import { readVenatariAbilityForm } from '../../src/ui/venatari-ability-controls.js';

function game(state) {clearCommandHandlers();registerCoreCommandHandlers();return createGameSession(state);}
function dom() {
  const handlers={};
  return {handlers,innerHTML:'',replaceChildren(){},querySelector(){return null;},querySelectorAll(){return [];},
    addEventListener(name,fn){handlers[name]=fn;},removeEventListener(name){delete handlers[name];}};
}
const target = matches => ({closest:selector=>matches[selector]??null});
const attr = (name,value) => ({getAttribute:key=>key===name?value:null});
function form(values={}) {
  const attrs={'data-rule-id':'cascade-mine','data-rule-unit':'venatari','data-rule-player':'p1'};
  const inputs={'[name="targetId"]':{value:'marine'},'[name="actualWounds"]:checked':{value:'2'},
    '[name="rangeConfirmed"]':{checked:true},...values};
  return {hasAttribute:name=>name==='data-venatari-ability-form',getAttribute:name=>attrs[name],querySelector:selector=>inputs[selector]??null};
}

test('Venatari mine form uses touch choices and range confirmation without a generic mark-used bypass', () => {
  const state=custodesReminderState();
  state.units.find(unit=>unit.id==='marine').name='<Enemy & Guard>';
  const html=renderUnitRulesReminders(state,{perspectivePlayerId:'p1',selectedUnitId:'venatari'});
  assert.match(html,/data-venatari-ability-form data-rule-id="cascade-mine"/);
  assert.match(html,/&lt;Enemy &amp; Guard&gt;/);assert.doesNotMatch(html,/<Enemy/);
  assert.match(html,/name="actualWounds" value="0" checked/);
  assert.match(html,/name="actualWounds" value="6"/);
  assert.match(html,/name="rangeConfirmed" required/);
  assert.doesNotMatch(html,/data-record-rule-use[^>]*data-rule-id="cascade-mine"/);
  assert.doesNotMatch(html,/type="number"/);
});

test('submitted mine controls update wounds once and the drawer reviews the target/result', () => {
  const session=game(custodesReminderState()),root=dom();
  const controller=createRulesReminderController(root,{session,perspectivePlayerId:'p1'});
  const mineForm=form();let prevented=false;
  root.handlers.submit({target:mineForm,preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(session.getState().units.find(unit=>unit.id==='marine').wounds,10);
  const html=renderRulesReminderDialog(session.getState(),{playerId:'p1'});
  assert.match(html,/Marine attacker · 2 wounds lost recorded/);
  root.handlers.submit({target:mineForm,preventDefault(){}});
  assert.equal(session.getState().units.find(unit=>unit.id==='marine').wounds,10);
  const summary=summarizeGameEvent(session.getState().history.find(event=>event.type==='unit.mortal_wounds_recorded'),session.getState());
  assert.match(JSON.stringify(summary),/2 wounds lost/);
  controller.destroy();
});

test('native ability target selection does not rerender the form before its picker dismisses', () => {
  const session=game(custodesReminderState()),root=dom();let writes=0;
  const host={set innerHTML(value){writes++;}};
  root.querySelector=selector=>selector==='[data-rules-reminder-host]'?host:null;
  const controller=createRulesReminderController(root,{session,perspectivePlayerId:'p1'});
  root.handlers.change({target:{hasAttribute:()=>false,value:'marine'}});
  assert.equal(writes,0);assert.equal(session.getState().history.length,0);
  controller.destroy();
});

test('Take Wing and Swift Ruin controls state their phase confirmations and modified CP cost', () => {
  const fight=renderRulesReminderDialog(custodesReminderState({phase:'fight'}),{playerId:'p1'});
  assert.match(fight,/Take Wing · return to reserves/);
  assert.match(fight,/Opponent Fight phase has ended/);
  assert.match(fight,/name="unengagedConfirmed" required/);
  const state=custodesReminderState({phase:'movement'});state.battle.round=2;
  state.units.find(unit=>unit.id==='venatari').status='reserves';
  const html=renderRulesReminderDialog(state,{playerId:'p1'});
  assert.match(html,/Confirm Swift Ruin · place from tray/);
  assert.match(html,/Normally 0 CP/);assert.match(html,/name="cpSpent" value="0" checked/);
  assert.match(html,/name="ingressConfirmed" required/);
  const payload=readVenatariAbilityForm(form({'[name="cpSpent"]:checked':{value:'1'},'[name="phaseEndConfirmed"]':{checked:true}}));
  assert.equal(payload.cpSpent,1);assert.equal(payload.phaseEndConfirmed,true);assert.equal(payload.ingressConfirmed,false);
});

test('the opponent Movement screen selects a confirmed friendly Swift Ruin reserve and places it with one map tap', () => {
  const state=custodesReminderState({phase:'movement'});state.battle.round=2;
  const venatari=state.units.find(unit=>unit.id==='venatari');venatari.status='reserves';venatari.position=null;
  const declared=recordVenatariAbilityUse(state,{playerId:'p1',unitId:'venatari',ruleId:'swift-ruin',phaseEndConfirmed:true,ingressConfirmed:true});
  const session=game(declared),root=dom(),screen=createMovementScreen(root,{session,perspectivePlayerId:'p1',layoutMode:'tabletop'});
  try {
    assert.match(root.innerHTML,/Swift Ruin · place before leaving Movement/);
    root.handlers.click({target:target({'[data-map-reserve-select]':attr('data-map-reserve-select','venatari')})});
    assert.match(root.innerHTML,/data-map-reserve-select="venatari" aria-pressed="true"/);
    const board={getBoundingClientRect:()=>({left:0,top:0,width:600,height:440})};
    root.handlers.click({target:target({'[data-battlefield-map-board]':board}),clientX:120,clientY:330});
    const arrived=session.getState().units.find(unit=>unit.id==='venatari');
    assert.equal(arrived.status,'deployed');assert.deepEqual(arrived.position,{x:12,y:11});
    assert.match(root.innerHTML,/data-map-unit-id="venatari"/);
    assert.doesNotMatch(root.innerHTML,/Swift Ruin · place before leaving Movement/);
    assert.equal(session.getState().activePlayer,'p2');
  } finally {screen.destroy();}
});
