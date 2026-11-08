import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { renderCustodesKatahCommandPanel, renderCustodesKatahPhasePanel } from '../../src/ui/custodes-katah-panel.js';
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

test('opponent-turn Fight still offers defensive Kaptaris at opening for a readied unit',()=>{
  const own=state('fight');
  const opponent={...own,activePlayer:'p2',battle:{...own.battle,activePlayerId:'p2'}};
  const html=renderCustodesKatahPhasePanel(opponent,{phase:'fight',unitId:'allarus',playerId:'p1'});
  assert.match(html,/Use Kaptaris/);
  assert.doesNotMatch(html,/Use Dacatarai|Use Rendax/);
});
