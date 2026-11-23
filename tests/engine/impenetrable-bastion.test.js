import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { getImpenetrableBastionOpportunities } from '../../src/rules/custodes-detachment-stratagem-opportunities.js';
import { recordCustodesDetachmentStratagemUse } from '../../src/engine/custodes-detachment-stratagem-transitions.js';
import { recordObjectiveControl } from '../../src/engine/state-transitions.js';
import { getObjectiveControlForPlayer } from '../../src/rules/objective-control-state.js';
import { renderCustodesDetachmentStratagemControls } from '../../src/ui/custodes-detachment-stratagem-controls.js';
import { renderStratagemOpportunityReminders } from '../../src/ui/rules-reminder-panel.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';

function battle() {
  const state=custodesReminderState({phase:'movement',activePlayer:'p1'});
  state.armyRosters.p1.detachments=["Emperor's Chosen",'Lions of the Emperor','Might of the Moritoi'];
  state.victoryPoints={p1:0,p2:0};
  state.objectives=[{id:'home',name:'My Home',position:{x:20,y:20},
    control:{controlState:'controlled',controllerId:'p1',contestingPlayerIds:[]}},
    {id:'center',name:'Center 1',position:{x:30,y:22},
      control:{controlState:'controlled',controllerId:'p1',contestingPlayerIds:[]}}];
  return state;
}
const action={playerId:'p1',unitId:'allarus',stratagemId:'impenetrable-bastion',objectiveId:'home',
  timingConfirmed:true,unitLimitConfirmed:true,objectiveRangeConfirmed:true};

test('Movement offers the secured objective action only for eligible Custodes formations and own controlled markers',()=>{
  const state=battle();
  const options=getImpenetrableBastionOpportunities(state,{playerId:'p1'});
  assert.ok(options.some(option=>option.unitId==='allarus'&&option.objectiveId==='home'&&option.available));
  assert.ok(options.some(option=>option.unitId==='wardens'&&option.objectiveId==='home'&&option.available));
  assert.ok(!options.some(option=>option.unitId==='telemon'||option.unitId==='galatus'||option.unitId==='prosecutors'));
  assert.deepEqual(getImpenetrableBastionOpportunities({...state,activePlayer:'p2',battle:{...state.battle,activePlayerId:'p2'}},{playerId:'p1'}),[]);
  assert.match(renderCustodesDetachmentStratagemControls(state,{playerId:'p1',stratagemId:'impenetrable-bastion'}),/name="objectiveId"/);
  assert.match(renderStratagemOpportunityReminders(state,{perspectivePlayerId:'p1',selectedUnitId:'allarus',livePanel:true}),/Spend 1 CP · secure objective/);
});

test('spending CP secures the selected objective without awarding VP, persists after moving, and records an auditable use',()=>{
  const start=battle();
  const after=recordCustodesDetachmentStratagemUse(start,action);
  assert.equal(start.commandPoints.p1,3);
  assert.equal(after.commandPoints.p1,2);
  assert.equal(after.objectives[0].securedByPlayerId,'p1');
  assert.equal(after.objectives[0].securedByUnitId,'allarus');
  assert.equal(after.objectives[1].securedByPlayerId,undefined);
  assert.equal(after.victoryPoints.p1,start.victoryPoints.p1);
  assert.ok(after.history.some(event=>event.type==='custodes.detachment_stratagem_used' &&
    event.payload.stratagemId==='impenetrable-bastion'&&event.payload.objectiveId==='home'));
  after.units.find(unit=>unit.id==='allarus').position={x:42,y:35};
  assert.equal(getObjectiveControlForPlayer(after,{playerId:'p1',objectiveId:'home'}),'controlled');
  assert.match(renderBattlefieldMap(after,{mode:'live',perspectivePlayerId:'p1'}),/is-secured[^"]*" data-map-objective-id="home"/);
  assert.throws(()=>recordCustodesDetachmentStratagemUse(after,action),/unavailable|Already used|This Stratagem/);
});

test('a newly confirmed opposing controller clears secured status; correcting own control preserves it',()=>{
  const secured=recordCustodesDetachmentStratagemUse(battle(),action);
  const reaffirmed=recordObjectiveControl(secured,{objectiveId:'home',controllerId:'p1'});
  assert.equal(reaffirmed.objectives[0].securedByPlayerId,'p1');
  const taken=recordObjectiveControl(reaffirmed,{objectiveId:'home',controllerId:'p2'});
  assert.equal(taken.objectives[0].securedByPlayerId,null);
  assert.equal(getObjectiveControlForPlayer(taken,{playerId:'p1',objectiveId:'home'}),'enemy-controlled');
  assert.doesNotMatch(renderBattlefieldMap(taken,{mode:'live',perspectivePlayerId:'p1'}),/is-secured[^"]*" data-map-objective-id="home"/);
});

test('invalid eligibility and unconfirmed tabletop range never spend CP or alter objectives',()=>{
  for (const patch of [{objectiveRangeConfirmed:false},{timingConfirmed:false},{objectiveId:'absent'},{unitId:'telemon'},{unitId:'prosecutors'}]) {
    const state=battle(),before=JSON.stringify(state);
    assert.throws(()=>recordCustodesDetachmentStratagemUse(state,{...action,...patch}));
    assert.equal(JSON.stringify(state),before);
  }
  const low=battle();low.commandPoints.p1=0;
  assert.throws(()=>recordCustodesDetachmentStratagemUse(low,action),/Needs 1 CP/);
});
