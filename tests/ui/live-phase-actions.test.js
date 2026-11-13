import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { getLivePhaseReminderEntries } from '../../src/ui/live-phase-reminder-filter.js';
import { renderRulesReminderDialog, renderUnitRulesReminders, renderStratagemOpportunityReminders } from '../../src/ui/rules-reminder-panel.js';
import { renderCustodesKatahPhasePanel } from '../../src/ui/custodes-katah-panel.js';
import { renderCombatWorkspace } from '../../src/ui/combat-workspace.js';

test('live phase context shows offense in own Shooting, defenses when enemy attacks, without modifying Rules drawer',()=>{
  const own=custodesReminderState({phase:'shooting',activePlayer:'p1'});
  const attack=renderUnitRulesReminders(own,{perspectivePlayerId:'p1',selectedUnitId:'wardens',livePanel:true,includeStratagems:false});
  assert.doesNotMatch(attack,/Living Fortress/);
  const full=renderRulesReminderDialog(own,{playerId:'p1',unitId:'wardens'});
  assert.match(full,/Living Fortress/);
  assert.match(full,/Opponent Combat Doctrine/);

  const enemy=custodesReminderState({phase:'shooting',activePlayer:'p2'});
  const defense=renderUnitRulesReminders(enemy,{perspectivePlayerId:'p1',selectedUnitId:'wardens',livePanel:true,includeStratagems:false});
  assert.match(defense,/Living Fortress/);
  assert.doesNotMatch(defense,/Captain-General aura/);
  const unfocused=renderUnitRulesReminders(enemy,{perspectivePlayerId:'p1',livePanel:true,includeStratagems:false});
  assert.doesNotMatch(unfocused,/Living Fortress|Guardian Eternal|Equipped weapon reminders/);
  assert.match(renderRulesReminderDialog(enemy,{playerId:'p1'}),/Guardian Eternal/);
});

test('live Moment Shackle choice follows turn, full Rules button retains both uses',()=>{
  const state=custodesReminderState({phase:'shooting',activePlayer:'p1'});
  const source=[{ruleId:'moment-shackle',effect:'Both choices',choices:[
    {id:'attacks',label:'+3 Axe attacks',effect:'Add three attacks'},
    {id:'save',label:'3+ invulnerable save',effect:'Improve save'}
  ]}];
  const own=getLivePhaseReminderEntries(state,{playerId:'p1',entries:source})[0];
  assert.deepEqual(own.choices.map(x=>x.id),['attacks']);
  state.activePlayer='p2';state.battle.activePlayerId='p2';
  const defense=getLivePhaseReminderEntries(state,{playerId:'p1',entries:source})[0];
  assert.deepEqual(defense.choices.map(x=>x.id),['save']);
  const dialog=renderRulesReminderDialog(state,{playerId:'p1',unitId:'trajann'});
  assert.match(dialog,/Mark used · \+3 Axe attacks/);
  assert.match(dialog,/Mark used · 3\+ invulnerable save/);
});

test('live sidebar hides blocked and untriggered Guardians Stratagems; Rules button keeps review',()=>{
  const state=custodesReminderState({phase:'shooting',activePlayer:'p1'});
  assert.doesNotMatch(renderStratagemOpportunityReminders(state,{perspectivePlayerId:'p1',selectedUnitId:'sentinel',livePanel:true}),/Prime Target/);
  assert.match(renderRulesReminderDialog(state,{playerId:'p1'}),/Prime Target/);
  state.commandPoints.p1=0;
  assert.doesNotMatch(renderStratagemOpportunityReminders(state,{perspectivePlayerId:'p1',livePanel:true}),/Needs 1 CP|Prime Target/);
  assert.match(renderRulesReminderDialog(state,{playerId:'p1'}),/Needs 1 CP/);
  const html=renderCombatWorkspace({state,phase:'shooting',perspectivePlayerId:'p1',selectedUnitId:'sentinel',
    controls:'<p>Live Shooting</p>',mapView:{render:()=>'<div>map</div>'}});
  assert.doesNotMatch(html,/Prime Target/);
});

test('Fight sidebar prioritizes Kaptaris at opponent phase start, Rendax when our unit fights later',()=>{
  const state=custodesReminderState({phase:'fight',activePlayer:'p2'});
  state.battle.firstPlayerId='p1';
  const start=renderCustodesKatahPhasePanel(state,{phase:'fight',playerId:'p1',unitId:'sentinel'});
  assert.match(start,/Use Kaptaris/);
  assert.match(start,/Use Dacatarai/);
  assert.doesNotMatch(start,/Use Rendax/);
  const filtered=getLivePhaseReminderEntries(state,{playerId:'p1',selectedUnitId:'sentinel',
    entries:[{ruleId:'katah-fight-window',katahChoices:[{id:'Dacatarai'},{id:'Kaptaris'},{id:'Rendax'}],
      katahEffectLines:[{name:'Dacatarai',effect:'Hit reroll'},{name:'Kaptaris',effect:'Defense'},{name:'Rendax',effect:'Lethal'}]}]});
  assert.deepEqual(filtered[0].katahChoices.map(x=>x.id),['Dacatarai','Kaptaris']);
  state.history.push({type:'fight.unit_activated',payload:{unitId:'marine',turn:1,round:1}});
  const late=renderCustodesKatahPhasePanel(state,{phase:'fight',playerId:'p1',unitId:'sentinel'});
  assert.match(late,/Use Rendax/);
  assert.doesNotMatch(late,/Use Dacatarai|Use Kaptaris/);
  assert.equal(renderCustodesKatahPhasePanel({...state,phase:'shooting'},{phase:'shooting',playerId:'p1',unitId:'sentinel'}),'');
});

test("Custodes live reminders match selected unit eligibility",()=>{
  const state=custodesReminderState({phase:"shooting",activePlayer:"p2"});
  const roster=state.armyRosters.p1;roster.detachments=["Emperor's Chosen","Lions of the Emperor","Might of the Moritoi"];delete roster.detachment;
  const sisters=renderUnitRulesReminders(state,{perspectivePlayerId:"p1",selectedUnitId:"prosecutors",livePanel:true});
  assert.doesNotMatch(sisters,/Magna Imperator|Honoured Interred|Vigil Unending/);
  const dreadnought=renderUnitRulesReminders(state,{perspectivePlayerId:"p1",selectedUnitId:"galatus",livePanel:true});
  assert.match(dreadnought,/Honoured Interred/);
  assert.match(dreadnought,/nearby friendly Adeptus Custodes units/);
});


test('live Fight sidebar displays the Ka’tah choices only once and retains the full Rules reference',()=>{
  const state=custodesReminderState({phase:'fight',activePlayer:'p1'});
  state.battle.firstPlayerId='p1';
  const compact=renderCustodesKatahPhasePanel(state,{phase:'fight',unitId:'sentinel',playerId:'p1'});
  const sidebar=renderCombatWorkspace({state,phase:'fight',perspectivePlayerId:'p1',selectedUnitId:'sentinel',
    controls:compact,mapView:{render:()=>'<div>map</div>'}});
  assert.match(sidebar,/is-fight-compact/);
  assert.equal((sidebar.match(/data-custodes-katah-use="Dacatarai"/g)??[]).length,1);
  assert.equal((sidebar.match(/data-custodes-katah-use="Kaptaris"/g)??[]).length,1);
  assert.equal((sidebar.match(/data-custodes-katah-use="Rendax"/g)??[]).length,1);
  assert.doesNotMatch(sidebar,/data-record-katah-reminder/,
    'no duplicate Ka’tah buttons in the lower Fight rules reminders');
  const modal=renderRulesReminderDialog(state,{playerId:'p1',unitId:'sentinel'});
  assert.match(modal,/data-record-katah-reminder/,
    'full Rules reference retains its separate official choices');
});
