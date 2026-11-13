import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { renderCustodesKatahCommandPanel, renderCustodesKatahPhasePanel, bindCustodesKatahActions } from '../../src/ui/custodes-katah-panel.js';
import { getCustodesKatahState } from '../../src/rules/custodes-tactical-advisor.js';
import { recordCustodesKatahUse, recordCustodesKatahReadied } from '../../src/engine/custodes-katah-transitions.js';

function state(phase='command') {
  const current=custodesReminderState({phase,activePlayer:'p1'});
  current.battle.firstPlayerId='p1';
  return current;
}

test('Command shows a single Conservai reminder and one automatic readiness count, not per-unit READIED rows', () => {
  const current=state();
  const before=JSON.stringify(current);
  const html=renderCustodesKatahCommandPanel(current,{playerId:'p1'});
  assert.match(html,/Martial Ka’tah · Command Phase/);
  assert.match(html,/<strong>\d+\/\d+ ready<\/strong>/);
  assert.match(html,/Automatic at the start of your Command phase/);
  assert.match(html,/Conservai/);
  assert.match(html,/engaged or Battle-shocked/);
  assert.equal((html.match(/custodes-katah-panel__option is-current/g)??[]).length,1);
  assert.doesNotMatch(html,/custodes-katah-panel__units/);
  assert.doesNotMatch(html,/Calistus|Salvus|Dacatarai|Kaptaris|Rendax/);
  assert.match(html,/Movement, Shooting and Fight Ka’tahs appear when applicable/);
  assert.equal(JSON.stringify(current),before,'read-only summary must never change history or readiness');
});

test('Command calls out only unusual SPENT or RE-READIED states and escapes unit names',()=>{
  const current=state();
  const ready=getCustodesKatahState(current,{playerId:'p1',unitId:'allarus'});
  assert.equal(ready.readied,true);
  current.units.find(unit=>unit.id==='allarus').name='<Guard & 1>';
  const spent={
    ...current,
    history:[...current.history,{
      type:'custodes.katah_expended',
      payload:{playerId:'p1',unitId:'allarus',katahName:'Salvus',cycleRound:ready.cycleRound}
    }]
  };
  const spentHtml=renderCustodesKatahCommandPanel(spent,{playerId:'p1'});
  assert.match(spentHtml,/SPENT · Salvus/);
  assert.match(spentHtml,/&lt;Guard &amp; 1&gt;/);
  assert.doesNotMatch(spentHtml,/<Guard & 1>/);
  assert.equal((spentHtml.match(/class="custodes-katah-panel__units"/g)??[]).length,1);
  const rereadied={
    ...spent,
    history:[...spent.history,{
      type:'custodes.katah_readied',
      payload:{playerId:'p1',unitId:'allarus',cycleRound:ready.cycleRound,source:'Superhuman Focus'}
    }]
  };
  const html=renderCustodesKatahCommandPanel(rereadied,{playerId:'p1'});
  assert.match(html,/RE-READIED · Superhuman Focus/);
  assert.match(html,/<li role="status">/);
  assert.doesNotMatch(html,/SPENT · Salvus/);
});

test('the selected unit exposes timed buttons; SPENT persists across own and opponent Fight phases; re-ready restores options',()=>{
  const movement=state('movement');
  const ready=getCustodesKatahState(movement,{playerId:'p1',unitId:'allarus'});
  assert.equal(ready.readied,true);
  const initial=renderCustodesKatahPhasePanel(movement,{phase:'movement',unitId:'allarus',playerId:'p1'});
  assert.match(initial,/Use Calistus/);
  assert.doesNotMatch(initial,/Use Salvus|Use Kaptaris|Use Rendax/);

  const expended=recordCustodesKatahUse(movement,{playerId:'p1',unitId:'allarus',katahName:'Calistus'});
  assert.equal(getCustodesKatahState(expended,{playerId:'p1',unitId:'allarus'}).readied,false);
  const shooting={...expended,phase:'shooting'};
  const spentShooting=renderCustodesKatahPhasePanel(shooting,{phase:'shooting',unitId:'allarus',playerId:'p1'});
  assert.match(spentShooting,/SPENT.*Calistus used this readiness cycle/);
  assert.doesNotMatch(spentShooting,/Use Salvus/);
  const enemyFight={...expended,phase:'fight',activePlayer:'p2',
    battle:{...expended.battle,activePlayerId:'p2'}};
  const spentEnemyFight=renderCustodesKatahPhasePanel(enemyFight,{phase:'fight',unitId:'allarus',playerId:'p1'});
  assert.match(spentEnemyFight,/SPENT.*Calistus used this readiness cycle/);
  assert.doesNotMatch(spentEnemyFight,/Use Kaptaris|Use Rendax/);

  const restored=recordCustodesKatahReadied(shooting,{playerId:'p1',unitId:'allarus',source:'Superhuman Focus'});
  assert.equal(getCustodesKatahState(restored,{playerId:'p1',unitId:'allarus'}).readied,true);
  const available=renderCustodesKatahPhasePanel(restored,{phase:'shooting',unitId:'allarus',playerId:'p1'});
  assert.match(available,/RE-READIED/);
  assert.match(available,/Available again via Superhuman Focus/);
  assert.match(available,/Use Salvus/);
  const overview=renderCustodesKatahPhasePanel(restored,{phase:'shooting',playerId:'p1'});
  assert.match(overview,/RE-READIED/);
  assert.match(overview,/allarus/);
});

test('opponent-turn Fight opening offers Kaptaris and legal offensive Dacatarai without early Rendax',()=>{
  const own=state('fight');
  const opponent={...own,activePlayer:'p2',battle:{...own.battle,activePlayerId:'p2'}};
  const html=renderCustodesKatahPhasePanel(opponent,{phase:'fight',unitId:'allarus',playerId:'p1'});
  assert.match(html,/Use Kaptaris/);
  assert.match(html,/Use Dacatarai/,'offensive Ka’tah remains legal in the opponent Fight phase');
  assert.doesNotMatch(html,/Use Rendax/,'Rendax is only offered when selected to fight');
});


test('Command offers Use Conservai only for the selected eligible, readied formation',()=>{
  const initial=state();
  const readOnly=JSON.stringify(initial);
  const unselected=renderCustodesKatahCommandPanel(initial,{playerId:'p1'});
  assert.match(unselected,/Select a Custodes unit on the map/);
  assert.doesNotMatch(unselected,/data-custodes-katah-use/);
  const selected=renderCustodesKatahCommandPanel(initial,{playerId:'p1',unitId:'allarus'});
  assert.match(selected,/Selected: <strong>allarus<\/strong>/);
  assert.match(selected,/data-custodes-katah-use="Conservai"/);
  assert.match(selected,/data-custodes-katah-unit="allarus"/);
  assert.match(selected,/data-custodes-katah-player="p1"/);
  assert.match(selected,/>Use Conservai<\/button>/);
  assert.equal((selected.match(/data-custodes-katah-use=/g)??[]).length,1);
  const enemy=renderCustodesKatahCommandPanel(initial,{playerId:'p1',unitId:'marine'});
  assert.doesNotMatch(enemy,/data-custodes-katah-use=/);
  const notKatah=renderCustodesKatahCommandPanel(initial,{playerId:'p1',unitId:'prosecutors'});
  assert.doesNotMatch(notKatah,/data-custodes-katah-use=/);
  const attached=renderCustodesKatahCommandPanel(initial,{playerId:'p1',unitId:'trajann'});
  assert.match(attached,/data-custodes-katah-unit="wardens"/,'attached Leader acts through the bodyguard formation');
  assert.equal(JSON.stringify(initial),readOnly,'panel must not automatically expend readiness');
});

test('Use Conservai records only selected unit readiness and shows current-turn ACTIVE feedback',()=>{
  const initial=state();
  const previous=JSON.stringify(initial);
  const used=recordCustodesKatahUse(initial,{playerId:'p1',unitId:'allarus',katahName:'Conservai'});
  assert.equal(JSON.stringify(initial),previous,'the state transition is immutable');
  assert.equal(used.history.at(-1).type,'custodes.katah_expended');
  assert.equal(used.history.at(-1).payload.unitId,'allarus');
  assert.equal(used.history.at(-1).payload.katahName,'Conservai');
  assert.deepEqual(used.commandPoints,initial.commandPoints,'Conservai does not spend CP');
  assert.equal(getCustodesKatahState(used,{playerId:'p1',unitId:'allarus'}).readied,false);
  assert.equal(getCustodesKatahState(used,{playerId:'p1',unitId:'galatus'}).readied,true);
  const html=renderCustodesKatahCommandPanel(used,{playerId:'p1',unitId:'allarus'});
  assert.match(html,/Conservai ACTIVE/);
  assert.match(html,/Until end of this turn/);
  assert.match(html,/Ka’tah readiness spent/);
  assert.doesNotMatch(html,/data-custodes-katah-use/);
  assert.match(html,/SPENT · Conservai/,'exception list reflects the spent readiness');
  assert.match(renderCustodesKatahCommandPanel(used,{playerId:'p1',unitId:'galatus'}),/data-custodes-katah-use="Conservai"/);
  assert.throws(()=>recordCustodesKatahUse(used,{playerId:'p1',unitId:'allarus',katahName:'Conservai'}),/already expended/);
  const restored=recordCustodesKatahReadied(used,{playerId:'p1',unitId:'allarus',source:'Superhuman Focus'});
  assert.match(renderCustodesKatahCommandPanel(restored,{playerId:'p1',unitId:'allarus'}),/>Use Conservai<\/button>/);
});

test('Command Conservai button dispatches one existing Ka’tah use command',()=>{
  let onclick=null,received=null;
  const button={getAttribute:name=>({
    'data-custodes-katah-use':'Conservai',
    'data-custodes-katah-unit':'allarus',
    'data-custodes-katah-player':'p1'
  })[name],addEventListener:(event,listener)=>{if(event==='click')onclick=listener;}};
  const root={querySelectorAll:selector=>selector==='[data-custodes-katah-use]'?[button]:[]};
  bindCustodesKatahActions(root,{dispatch:command=>{received=command;}});
  assert.equal(typeof onclick,'function');
  onclick();
  assert.deepEqual(received,{type:'custodes.record_katah_use',payload:{playerId:'p1',unitId:'allarus',katahName:'Conservai'}});
});




test('Fight Ka’tahs use one concise list and one group of thumb-sized activation buttons',()=>{
  const current=state('fight');
  const before=JSON.stringify(current);
  const html=renderCustodesKatahPhasePanel(current,{phase:'fight',playerId:'p1',unitId:'allarus'});
  assert.match(html,/class="custodes-katah-phase is-fight-compact"/);
  assert.equal((html.match(/custodes-katah-phase__fight-list/g)??[]).length,1);
  assert.equal((html.match(/class="custodes-katah-phase__option"/g)??[]).length,0,
    'no more individual stacked Fight option cards');
  for(const name of ['Dacatarai','Kaptaris','Rendax']){
    assert.match(html,new RegExp('<strong>'+name+'</strong>'));
    assert.match(html,new RegExp('data-custodes-katah-use="'+name+'"'));
    assert.equal((html.match(new RegExp('data-custodes-katah-use="'+name+'"','g'))??[]).length,1);
  }
  assert.match(html,/re-roll Hit rolls of 1/);
  assert.match(html,/are -1 to Hit/);
  assert.match(html,/gain Lethal Hits/);
  assert.equal(JSON.stringify(current),before,'presentation must not change Ka’tah readiness');
  const opponent={...current,activePlayer:'p2',battle:{...current.battle,activePlayerId:'p2'}};
  const opponentHtml=renderCustodesKatahPhasePanel(opponent,{phase:'fight',playerId:'p1',unitId:'allarus'});
  assert.match(opponentHtml,/is-fight-compact/);
  assert.doesNotMatch(opponentHtml,/data-custodes-katah-use="Rendax"/);
});
