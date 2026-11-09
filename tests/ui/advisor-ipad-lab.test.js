import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAdvisorIpadState, applyAdvisorIpadAction, ADVISOR_IPAD_SCENARIOS } from '../../src/testing/advisor-ipad-scenarios.js';
import { inspectAdvisorIpadScenario } from '../../src/testing/advisor-ipad-checks.js';

const inspect=(state,id,distance=7)=>inspectAdvisorIpadScenario(state,{
  scenarioId:id,measuredDistance:distance
});

test('all nine test presets are standalone, report green production Advisor calculations and never require account state',()=>{
  assert.equal(ADVISOR_IPAD_SCENARIOS.length,9);
  for(const scenario of ADVISOR_IPAD_SCENARIOS){
    if(scenario.id==='shooting')continue;
    const state=createAdvisorIpadState(scenario.id);
    const before=structuredClone(state);
    const result=inspect(state,scenario.id);
    assert.equal(result.total>0,true,scenario.id);
    assert.equal(result.passed,result.total,scenario.id+' checks: '+
      result.checks.filter(c=>!c.passes).map(c=>c.label).join(', '));
    assert.deepEqual(state,before,scenario.id+' read-only Advisor');
    assert.equal(state.battle.status,'active');
    assert.equal(state.battle.id,'advisor-ipad-sandbox');
    assert.equal(state.scoring.turnSnapshots.length,0);
  }
});

test('Shooting practice requires two taps, then actual total of five and remaining estimate without double counting',()=>{
  const initial=createAdvisorIpadState('shooting');
  const pending=inspect(initial,'shooting');
  assert.ok(pending.passed<pending.total,'before recording all shots checklist should be pending');
  const afterThree=applyAdvisorIpadAction(initial,'shoot-3');
  assert.equal(afterThree.units[1].wounds,7);
  assert.equal(afterThree.history.length,1);
  const afterTwo=applyAdvisorIpadAction(afterThree,'shoot-2');
  assert.equal(afterTwo.units[1].wounds,5);
  assert.equal(afterTwo.history.length,2);
  const result=inspect(afterTwo,'shooting');
  assert.equal(result.passed,result.total,result.checks.filter(c=>!c.passes).map(c=>c.label).join(', '));
  assert.match(result.html,/5\.0 actual damage/);
  assert.deepEqual(initial.units[1].position,{x:21,y:22});
  assert.equal(initial.units[1].wounds,10,'original fixture never mutated');
});

test('Measured Charge practice uses the selected distance, then success or failure changes live continuation',()=>{
  const base=createAdvisorIpadState('measured');
  const change=inspect(base,'measured',9);
  assert.equal(change.passed,change.total,'measured probability should update with picker');
  assert.match(change.html,/9″ measured/);
  const won=applyAdvisorIpadAction(base,'charge-success',{distance:9});
  won.phase='fight';
  const win=inspect(won,'success',9);
  assert.equal(win.passed,win.total,'success should read recorded 9-inch charge');
  const lost=applyAdvisorIpadAction(base,'charge-failed',{distance:9});
  lost.phase='fight';
  const failed=inspect(lost,'failed',9);
  assert.equal(failed.passed,failed.total,'failed result must withhold a second attack');
  assert.equal(failed.execution.remainingForecast,null);
  assert.equal(base.phase,'charge');
  assert.equal(base.history.filter(e=>e.type==='charge.outcome_recorded').length,0);
  assert.throws(()=>applyAdvisorIpadAction(won,'charge-success',{distance:7}),/Switch to Charge/);
});

test('Fight practice updates actual wounds then finish prevents duplicate Fight forecast',()=>{
  const before=createAdvisorIpadState('success');
  const after=applyAdvisorIpadAction(before,'fight-3');
  assert.equal(after.units[1].wounds,2);
  const resultBeforeFinish=inspect(after,'fight');
  assert.ok(resultBeforeFinish.passed<resultBeforeFinish.total,'finished flag must not be guessed');
  const finished=applyAdvisorIpadAction(after,'finish-fight');
  const result=inspect(finished,'fight');
  assert.equal(result.passed,result.total);
  assert.equal(result.execution.remainingForecast,null);
  assert.deepEqual(before.history.length,3);
});

test('touch marker correction recalculates only the sandbox board and respects approximate field bounds',()=>{
  const before=createAdvisorIpadState('movement'),original=structuredClone(before);
  const moved=applyAdvisorIpadAction(before,'move-marker',{position:{x:10,y:21}});
  assert.deepEqual(moved.units[0].position,{x:10,y:21});
  assert.deepEqual(moved.battlefieldMap.actualDeployment.a.position,{x:10,y:21});
  assert.equal(moved.history.length,0);
  assert.deepEqual(before,original);
  assert.throws(()=>applyAdvisorIpadAction(before,'move-marker',{position:{x:-1,y:12}}),/battlefield/);
  assert.throws(()=>applyAdvisorIpadAction(before,'move-marker',{position:{x:61,y:12}}),/battlefield/);
});

test('opponent turn blocks simulated combat and offensive panel is hidden',()=>{
  const state=createAdvisorIpadState('opponent');
  const result=inspect(state,'opponent');
  assert.equal(result.passed,result.total);
  assert.equal(result.execution.available,false);
  assert.equal(result.html,'');
  assert.throws(()=>applyAdvisorIpadAction(state,'shoot-3'),/Opponent-turn/);
});

test('iPad lab uses a separate static page with no production session, cloud, local storage or automatic saves',()=>{
  const page=readFileSync(new URL('../../advisor-ipad-test.html',import.meta.url),'utf8');
  const script=readFileSync(new URL('../../src/testing/advisor-ipad-lab.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../../src/testing/advisor-ipad-test.css',import.meta.url),'utf8');
  const build=readFileSync(new URL('../../scripts/build.mjs',import.meta.url),'utf8');
  assert.match(page,/viewport-fit=cover/);
  assert.match(page,/advisor-ipad-lab.js/);
  assert.match(page,/noindex, nofollow/);
  assert.match(build,/'advisor-ipad-test.html'/);
  assert.match(script,/inspectAdvisorIpadScenario/);
  assert.match(script,/pointerdown/);
  assert.match(script,/pointermove/);
  assert.match(script,/pointerup/);
  assert.match(script,/clipboard.writeText/);
  assert.match(script,/Manual iPad\/Safari acceptance/);
  assert.match(css,/touch-action:none/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/grid-template-columns/);
  assert.match(css,/safe-area-inset-bottom/);
  assert.doesNotMatch(script,/createGameSession|startLiveApp|connectCloud|localStorage|indexedDB|supabase|fetch\(|sendBeacon|session\.dispatch/);
});

test('invalid scenario and combat actions are safely rejected rather than changing game',()=>{
  assert.throws(()=>createAdvisorIpadState('nonexistent'),/Unknown/);
  const planning=createAdvisorIpadState('planning');
  assert.throws(()=>applyAdvisorIpadAction(planning,'shoot-3'),/Switch to Shooting/);
  assert.throws(()=>applyAdvisorIpadAction(planning,'charge-success'),/Switch to Charge/);
  assert.throws(()=>applyAdvisorIpadAction(planning,'invented'),/Unknown test action/);
});
