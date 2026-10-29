import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { fakeDom } from '../helpers/combat-dom.js';
import { createGameSession } from '../../src/application/game-session.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { createShootingScreen } from '../../src/ui/shooting-screen.js';
import { createFightTabletopScreen } from '../../src/ui/fight-tabletop-screen.js';
import { renderTargetDefenseReminders, renderRulesReminderDialog, renderUnitRulesReminders, createRulesReminderController } from '../../src/ui/rules-reminder-panel.js';
import { setUnitBattleNote, recordRulesReminderUse } from '../../src/engine/rules-reminder-transitions.js';

test('an opponent shooter selecting Wardens displays their incoming AP reminder after native select dismissal',async()=>{
  clearCommandHandlers();registerCoreCommandHandlers();
  const session=createGameSession(custodesReminderState()),root=fakeDom();
  const gameData={weapons:[{id:'bolter',name:'Bolter',type:'ranged',characteristics:{range:24,attacks:2,skill:3,strength:8,ap:-2,damage:2}}]};
  const screen=createShootingScreen(root,{session,gameData,perspectivePlayerId:'p1'});
  root.change('[data-shooting-unit-picker]','marine');root.click('[data-choice-shoot]');root.change('[data-target]','wardens');
  await new Promise(resolve=>setTimeout(()=>setTimeout(resolve,0),0));
  assert.match(root.innerHTML,/Target defenses · wardens/);assert.match(root.innerHTML,/AP −2 becomes AP −1/);
  root.change('[data-target]','telemon');await new Promise(resolve=>setTimeout(()=>setTimeout(resolve,0),0));assert.match(root.innerHTML,/Target defenses · telemon/);assert.match(root.innerHTML,/Reduce incoming ranged Damage by 1/);
  assert.doesNotMatch(root.innerHTML,/Target defenses · wardens/);
  screen.destroy();
});

test('personal notes are escaped and appear beside the selected target and in the editor',()=>{
  const state=setUnitBattleNote(custodesReminderState(),{playerId:'p1',unitId:'wardens',note:'<img src=x onerror=alert(1)> & remember'});
  const target=renderTargetDefenseReminders(state,{targetUnitId:'wardens'});
  assert.match(target,/&lt;img/);assert.doesNotMatch(target,/<img/);
  assert.match(renderRulesReminderDialog(state,{playerId:'p1',unitId:'wardens'}),/Save unit notes/);
  assert.match(renderUnitRulesReminders(state,{perspectivePlayerId:'p1',selectedUnitId:'wardens'}),/My notes/);
});

test('limited resources show used state without carrying the expired buff into later phases',()=>{
  let state=recordRulesReminderUse(custodesReminderState(),{playerId:'p1',unitId:'trajann',ruleId:'moment-shackle',choice:'save'});
  state.phase='fight';state.history.push({type:'turn.phase_changed',payload:{phase:'fight'}});
  const html=renderRulesReminderDialog(state,{playerId:'p1',unitId:'trajann'});
  assert.match(html,/This limited ability has already been used/);
  assert.doesNotMatch(renderTargetDefenseReminders(state,{targetUnitId:'wardens',allocationTargetId:'trajann'}),/Moment Shackle active/);
});

test('changing note units preserves separate unsaved drafts and controller teardown removes listeners',()=>{
  const state=custodesReminderState(),events=new Map();let html='',field=null;
  const host={get innerHTML(){return html;},set innerHTML(value){html=value;field=value?{value:value.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/)?.[1]??''}:null;}};
  const root={querySelector(selector){return selector==='[data-rules-reminder-host]'?host:selector==='[data-unit-rules-note]'?field:null;},querySelectorAll(){return [];},addEventListener(name,fn){events.set(name,fn);},removeEventListener(name){events.delete(name);}};
  const controller=createRulesReminderController(root,{session:{getState:()=>state},perspectivePlayerId:'p1'});
  events.get('click')({target:{closest:s=>s==='[data-toggle-rules-reminders]'?{}:null},preventDefault(){}});
  field.value='draft for Wardens';events.get('change')({target:{hasAttribute:()=>true,value:'sentinel'}});
  assert.equal(field.value,'');field.value='draft for Sentinels';
  events.get('change')({target:{hasAttribute:()=>true,value:'wardens'}});
  assert.equal(field.value,'draft for Wardens');controller.destroy();assert.equal(events.size,0);
});

test('opponent Fight target selection also displays the Warden defensive reminder',()=>{
  clearCommandHandlers();registerCoreCommandHandlers();
  const state=custodesReminderState({phase:'fight'});state.units.find(unit=>unit.id==='marine').profile.weaponIds=['sword'];
  state.history.push({type:'charge.outcome_recorded',payload:{unitId:'marine',targetIds:['wardens'],outcome:'successful',round:1,turn:1}});
  const session=createGameSession(state),root=fakeDom();
  const screen=createFightTabletopScreen(root,{session,perspectivePlayerId:'p1',gameData:{weapons:[{id:'sword',name:'Sword',type:'melee',characteristics:{attacks:2,skill:3,strength:8,ap:-2,damage:2}}]}});
  root.click('[data-fight-select]','marine');root.change('[data-fight-target]','wardens');
  assert.match(root.innerHTML,/Target defenses · wardens/);assert.match(root.innerHTML,/AP −2 becomes AP −1/);screen.destroy();
});

test('a tracked reminder use and its CP transaction can be undone together',()=>{
  clearCommandHandlers();registerCoreCommandHandlers();const session=createGameSession(custodesReminderState({phase:'command'}));
  session.dispatch({type:'rules.record_reminder_use',payload:{playerId:'p1',unitId:'trajann',ruleId:'aquila-commander'}});
  assert.equal(session.getState().commandPoints.p1,4);assert.equal(session.getLastCorrection().label,'rule reminder use');
  assert.equal(session.undoLastAction(),true);assert.equal(session.getState().commandPoints.p1,3);assert.equal(session.getState().history.length,0);
});
