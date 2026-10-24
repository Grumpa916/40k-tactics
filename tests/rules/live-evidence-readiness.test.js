import test from 'node:test';
import assert from 'node:assert/strict';
import { PRIMARY_MISSION_MATRIX } from '../../src/data/primary-mission-catalog.js';
import { missionConditionEvidence } from '../../src/rules/checkpoint-mission-evidence.js';
import { getCombatDataReadiness } from '../../src/rules/combat-data-readiness.js';
import { recordObjectiveControl } from '../../src/engine/state-transitions.js';
test('catalog evidence survives editing display text and legacy summaries remain compatible', () => {
  const item=PRIMARY_MISSION_MATRIX['Purge the Foe']['Purge the Foe'].scoring[1].items[0];
  const state={turn:2,phase:'movement',battle:{round:1},objectives:[{id:'central',control:{controlState:'controlled',controllerId:'p1'}}]};
  assert.equal(missionConditionEvidence(state,'p1',{...item,summary:'Reworded reminder'}).count,1);
  assert.equal(missionConditionEvidence(state,'p1',item.summary).count,1);
  assert.equal(missionConditionEvidence(state,'p1',{summary:'Wholly within enemy territory.'}).count,null);
});
test('objective confirmation records its turn and phase; older control is shown as carried forward', () => {
  const state={phase:'command',turn:2,battle:{round:1},players:[{id:'p1'}],history:[],objectives:[{id:'central'}]};
  const next=recordObjectiveControl(state,{objectiveId:'central',controllerId:'p1'});
  assert.deepEqual(next.objectives[0].controlRecordedAt,{round:1,turn:2,phase:'command'});
  const item={condition:{type:'count-objectives'},summary:'Display'};
  assert.match(missionConditionEvidence(next,'p1',item).detail,/1 this turn/);
  assert.match(missionConditionEvidence({...next,turn:3},'p1',item).detail,/1 carried forward/);
});
test('readiness identifies incomplete combat data without blocking real result entry', () => {
  const report=getCombatDataReadiness({units:[{id:'u',ownerId:'p1',name:'Missing profile',status:'deployed'}]});
  assert.equal(report.ready,false);assert.match(report.issues[0].detail,/toughness.*save.*wounds/);
  assert.equal(getCombatDataReadiness({units:[{id:'u',status:'destroyed'}]}).ready,true);
});
