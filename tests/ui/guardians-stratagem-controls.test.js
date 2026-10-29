import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { renderTargetDefenseReminders, renderRulesReminderDialog, createRulesReminderController, renderUnitRulesReminders } from '../../src/ui/rules-reminder-panel.js';
import { renderGuardiansStratagemOpportunities } from '../../src/ui/guardians-stratagem-controls.js';
import { recordGuardiansStratagemUse } from '../../src/engine/guardians-stratagem-transitions.js';
import { createGameSession } from '../../src/application/game-session.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { createShootingScreen } from '../../src/ui/shooting-screen.js';
import { fakeDom } from '../helpers/combat-dom.js';
import { renderCustodesKatahPhasePanel } from '../../src/ui/custodes-katah-panel.js';

const base={playerId:'p1',unitId:'sentinel',stratagemId:'in-auramite-clad',enemyUnitId:'marine',timingConfirmed:true,unitLimitConfirmed:true};
function form(patch={}) {
  const attrs={'data-guardians-player':'p1','data-guardians-id':'in-auramite-clad'};
  const fields={'[name="unitId"]':{value:'sentinel'},'[name="enemyUnitId"]':{value:'marine'},
    '[name="timingConfirmed"]':{checked:true},'[name="unitLimitConfirmed"]':{checked:true},...patch};
  return {hasAttribute:name=>name==='data-guardians-stratagem-form',getAttribute:name=>attrs[name],querySelector:s=>fields[s]??null};
}
function game(state){clearCommandHandlers();registerCoreCommandHandlers();return createGameSession(state);}

test('incoming target panel offers Auramite with the attacker selected and precise defensive modifiers',()=>{
  const state=custodesReminderState();
  const weapon={characteristics:{ap:-2,strength:8,damage:3}};
  const html=renderTargetDefenseReminders(state,{targetUnitId:'sentinel',attackerId:'marine',weapon});
  assert.match(html,/In Auramite Clad · 1 CP/);assert.match(html,/value="marine" selected/);
  assert.match(html,/name="unitLimitConfirmed" required/);
  assert.doesNotMatch(renderTargetDefenseReminders(state,{targetUnitId:'wardens',attackerId:'marine',weapon}),/data-guardians-stratagem-form/);
  assert.match(renderTargetDefenseReminders(state,{targetUnitId:'telemon',weapon}),/Damage 3 → 2/);
  assert.match(renderTargetDefenseReminders(state,{targetUnitId:'wardens',weapon}),/AP -2 → -1/);
});

test('low CP and Battle-shock remain visible with a disabled use control, and rules are escaped',()=>{
  const state=custodesReminderState();state.commandPoints.p1=0;
  state.units.find(u=>u.id==='sentinel').name='<Sentinel & Guard>';
  let html=renderGuardiansStratagemOpportunities(state,{playerId:'p1',unitId:'sentinel',stratagemId:'in-auramite-clad'});
  assert.match(html,/Needs 1 CP/);assert.match(html,/type="submit" disabled/);assert.match(html,/&lt;Sentinel &amp; Guard&gt;/);assert.doesNotMatch(html,/<Sentinel/);
  state.commandPoints.p1=3;state.units.find(u=>u.id==='sentinel').battleShocked=true;
  html=renderGuardiansStratagemOpportunities(state,{playerId:'p1',unitId:'sentinel',stratagemId:'in-auramite-clad'});
  assert.match(html,/Battle-shocked units cannot/);
});

test('the Rules drawer groups stratagems, preserves end-phase wording and conditional Shield of Honour',()=>{
  const state=custodesReminderState({phase:'fight'});
  state.history.push({type:'custodes.katah_expended',payload:{playerId:'p1',unitId:'sentinel',cycleRound:0,round:1,turn:1}});
  const html=renderRulesReminderDialog(state,{playerId:'p1'});
  assert.match(html,/This phase has ended/);assert.match(html,/Start of Fight, before phase actions/);
  assert.equal((html.match(/<strong>Shield of Honour · 1 CP/g)??[]).length,1);
  assert.match(html,/enemy model/);
});

test('a submitted stratagem form spends once, displays attacker-specific protection and supports immediate undo',()=>{
  const session=game(custodesReminderState()),events=new Map();
  const root={querySelector(){return null;},querySelectorAll(){return [];},addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n)};
  const controller=createRulesReminderController(root,{session,perspectivePlayerId:'p1'});
  events.get('submit')({target:form(),preventDefault(){}});
  assert.equal(session.getState().commandPoints.p1,2);
  let html=renderTargetDefenseReminders(session.getState(),{targetUnitId:'sentinel',attackerId:'marine'});
  assert.match(html,/In Auramite Clad active/);
  events.get('submit')({target:form(),preventDefault(){}});assert.equal(session.getState().commandPoints.p1,2);
  events.get('click')({target:{closest:s=>s==='[data-undo-rule-use]'?{}:null}});
  assert.equal(session.getState().commandPoints.p1,3);
  html=renderTargetDefenseReminders(session.getState(),{targetUnitId:'sentinel',attackerId:'marine'});assert.doesNotMatch(html,/In Auramite Clad active/);
  controller.destroy();assert.equal(events.size,0);
});

test('actual opponent Shooting target changes keep the correct defensive opportunity next to damage controls',async()=>{
  const session=game(custodesReminderState()),root=fakeDom();
  const screen=createShootingScreen(root,{session,perspectivePlayerId:'p1',gameData:{weapons:[{id:'bolter',name:'Bolter',type:'ranged',characteristics:{attacks:2,range:24,skill:3,strength:8,ap:-2,damage:3}}]}});
  root.change('[data-shooting-unit-picker]','marine');root.click('[data-choice-shoot]');root.change('[data-target]','sentinel');
  await new Promise(resolve=>setTimeout(()=>setTimeout(resolve,0),0));
  assert.match(root.innerHTML,/data-guardians-stratagem-form/);assert.match(root.innerHTML,/value="marine" selected/);
  root.change('[data-target]','wardens');await new Promise(resolve=>setTimeout(()=>setTimeout(resolve,0),0));
  assert.doesNotMatch(root.innerHTML,/data-guardians-id="in-auramite-clad"/);screen.destroy();
});

test('Unlimited Endurance remains visible in relevant later phases but clears on the next turn',()=>{
  const state=custodesReminderState({phase:'movement',activePlayer:'p1'});
  state.history.push({type:'unit.advanced',payload:{unitId:'sentinel',round:1,turn:1,phase:'movement'}});
  const next=recordGuardiansStratagemUse(state,{...base,stratagemId:'unlimited-endurance',enemyUnitId:null});
  next.phase='shooting';assert.match(renderUnitRulesReminders(next,{perspectivePlayerId:'p1',selectedUnitId:'sentinel'}),/Ranged attacks have Assault/);
  next.phase='charge';assert.match(renderUnitRulesReminders(next,{perspectivePlayerId:'p1',selectedUnitId:'sentinel'}),/Advance does not prevent declaring a charge/);
  next.turn=2;assert.doesNotMatch(renderUnitRulesReminders(next,{perspectivePlayerId:'p1',selectedUnitId:'sentinel'}),/Active until the end of this turn/);
});

test('end-phase re-readiness does not offer a Ka’tah action in the phase that just ended',()=>{
  const state=custodesReminderState({phase:'fight',activePlayer:'p1'});state.battle.firstPlayerId='p1';
  state.history.push({type:'custodes.katah_expended',payload:{playerId:'p1',unitId:'sentinel',katahName:'Rendax',cycleRound:1,round:1,turn:1,phase:'fight'}});
  const next=recordGuardiansStratagemUse(state,{...base,stratagemId:'superhuman-focus',enemyUnitId:null});
  assert.equal(renderCustodesKatahPhasePanel(next,{phase:'fight',unitId:'sentinel'}),'');
  assert.doesNotMatch(renderUnitRulesReminders(next,{perspectivePlayerId:'p1',selectedUnitId:'sentinel'}),/data-record-katah-reminder/);
});
