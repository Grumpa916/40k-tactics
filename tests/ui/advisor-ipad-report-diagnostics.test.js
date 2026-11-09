import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  summarizeAdvisorScenarioChecks, formatAdvisorScenarioVisitReport
} from '../../src/testing/advisor-ipad-report.js';
import {
  createAdvisorIpadState, applyAdvisorIpadAction, ADVISOR_IPAD_SCENARIOS
} from '../../src/testing/advisor-ipad-scenarios.js';
import { inspectAdvisorIpadScenario } from '../../src/testing/advisor-ipad-checks.js';

const inspect=(state,id)=>inspectAdvisorIpadScenario(state,{scenarioId:id,measuredDistance:7});

test('movement drag is accurately reported as a changed initial-condition check',()=>{
  const initial=createAdvisorIpadState('movement');
  const before=structuredClone(initial);
  const first=summarizeAdvisorScenarioChecks(inspect(initial,'movement'));
  assert.deepEqual(first.unmet,[]);
  assert.equal(first.passed,4);
  const after=applyAdvisorIpadAction(initial,'move-marker',{position:{x:10,y:22}});
  const current=summarizeAdvisorScenarioChecks(inspect(after,'movement'));
  assert.equal(current.passed,3);
  assert.deepEqual(current.unmet,['Initial hold is out of range']);
  assert.deepEqual(initial,before);
  const report=formatAdvisorScenarioVisitReport(ADVISOR_IPAD_SCENARIOS,
    new Map([['movement',current]]),
    new Map([['movement',first]]),
    new Map([['movement',['drag marker to 10,22']]]));
  assert.match(report,/Movement what-if: current 3\/4 · initial 4\/4/);
  assert.match(report,/Unmet now: Initial hold is out of range/);
  assert.match(report,/Interactions: drag marker to 10,22/);
  assert.match(report,/Command planning: not visited/);
});

test('finishing an otherwise successful charge legitimately replaces conditional Fight with a completed state',()=>{
  const initial=createAdvisorIpadState('success');
  const first=summarizeAdvisorScenarioChecks(inspect(initial,'success'));
  assert.equal(first.passed,4);
  const finished=applyAdvisorIpadAction(initial,'finish-fight');
  const now=summarizeAdvisorScenarioChecks(inspect(finished,'success'));
  assert.equal(now.passed,2);
  assert.deepEqual(now.unmet,[
    'Charge chance replaced with actual success',
    'Fight is still conditional on legality'
  ]);
  const report=formatAdvisorScenarioVisitReport(ADVISOR_IPAD_SCENARIOS,
    new Map([['success',now]]),new Map([['success',first]]));
  assert.match(report,/Successful charge: current 2\/4 · initial 4\/4/);
  assert.match(report,/Unmet now: Charge chance replaced with actual success; Fight is still conditional on legality/);
  const code=readFileSync(new URL('../../src/testing/advisor-ipad-lab.js',import.meta.url),'utf8');
  const start=code.indexOf("}else if(scenarioId==='success'){");
  const end=code.indexOf("}else if(scenarioId==='movement'){",start);
  const flow=code.slice(start,end);
  assert.match(flow,/add\('fight-3'/,'successful Charge should invite the next Fight action');
  assert.doesNotMatch(flow.split("}else if(scenarioId==='fight'){")[0],/add\('finish-fight'/,
    'do not expose early Finish before the required Fight damage entry');
  assert.match(flow,/if\(fought && !finished\) add\('finish-fight'/,
    'after recording damage, offer completion as the next action in the Fight scenario');
});

test('report formatter is resilient to missing scenarios, calculation errors, and untouched outcomes',()=>{
  const visits=new Map([
    ['planning',{passed:4,total:4,unmet:[]}],
    ['movement',{passed:0,total:1,unmet:['Advisor calculation failed'],error:'Broken test input'}]
  ]);
  const report=formatAdvisorScenarioVisitReport(ADVISOR_IPAD_SCENARIOS,visits,new Map());
  assert.match(report,/Command planning: current 4\/4/);
  assert.match(report,/Movement what-if: current 0\/1/);
  assert.match(report,/Unmet now: Advisor calculation failed/);
  assert.match(report,/Error: Broken test input/);
  assert.match(report,/Record shooting: not visited/);
  assert.deepEqual(summarizeAdvisorScenarioChecks(null),{
    passed:0,total:1,unmet:['Advisor inspection unavailable']
  });
});

test('diagnostics remain isolated from game state or clouds, with scenario-specific report details',()=>{
  const src=readFileSync(new URL('../../src/testing/advisor-ipad-lab.js',import.meta.url),'utf8');
  const report=readFileSync(new URL('../../src/testing/advisor-ipad-report.js',import.meta.url),'utf8');
  assert.match(src,/ensureInitialSnapshot/);
  assert.match(src,/recordInteraction/);
  assert.match(src,/formatAdvisorScenarioVisitReport/);
  assert.match(src,/Unmet now|formatAdvisorScenarioVisitReport/);
  assert.match(src,/preset/);
  assert.match(src,/initial preset vs latest interaction/);
  assert.doesNotMatch(src+report,/session\.dispatch|createGameSession|startLiveApp|localStorage|indexedDB|connectCloud|supabase|fetch\(/);
});
