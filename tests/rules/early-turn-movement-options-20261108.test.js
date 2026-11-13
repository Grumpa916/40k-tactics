import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getMovementWhatIfPlans, projectNormalMoveForPlanning } from '../../src/rules/early-turn-movement-options.js';
import { getLiveUnitPosition } from '../../src/rules/spatial-context.js';
import { renderEarlyTurnPlanPanel } from '../../src/ui/early-turn-plan-panel.js';
import { renderCombatWorkspace } from '../../src/ui/combat-workspace.js';

function fixture(phase='command'){
  const datasheet={
    characteristics:{Toughness:'5',Save:'3+',Wounds:'10',Move:'6',OC:'2'},
    weapons:[
      {name:'Boltstorm',range:'24"',attacks:4,skill:'3+',strength:5,ap:-1,damage:2},
      {name:'Blade',range:'Melee',attacks:4,skill:'3+',strength:6,ap:-2,damage:2}
    ]
  };
  return {
    phase,turn:1,activePlayer:'p1',
    battle:{id:'what-if-battle',round:1,status:'active',activePlayerId:'p1'},
    history:[],players:[{id:'p1',name:'Me'},{id:'p2',name:'Other'}],
    objectives:[{id:'c1',name:'Center 1',position:{x:30,y:30}}],
    battlefieldMap:{actualDeployment:{a:{position:{x:4,y:22}},b:{position:{x:33,y:22}}}},
    units:[
      {id:'a',ownerId:'p1',name:'Allarus',status:'deployed',wounds:10,modelCount:1,
        position:{x:4,y:22},characteristics:{movement:6,toughness:5,save:3,weaponSkill:3,ballisticSkill:3,objectiveControl:2},
        metadata:{rosterUnitId:'a'}},
      {id:'b',ownerId:'p2',name:'Enemy holder',status:'deployed',wounds:10,modelCount:1,
        position:{x:33,y:22},characteristics:{movement:6,toughness:5,save:3,weaponSkill:3,ballisticSkill:3,objectiveControl:2},
        metadata:{rosterUnitId:'b'}}
    ],
    armyRosters:{
      p1:{faction:'Test',units:[{id:'a',modelCount:1,datasheet:structuredClone(datasheet),
        equippedWeapons:[{name:'Boltstorm',quantity:1},{name:'Blade',quantity:1}]}]},
      p2:{faction:'Test',units:[{id:'b',modelCount:1,datasheet:structuredClone(datasheet),
        equippedWeapons:[{name:'Boltstorm',quantity:1},{name:'Blade',quantity:1}]}]}
    }
  };
}

test('what-if Normal Move reveals a Shooting opportunity hidden at current out-of-range position',()=>{
  const s=fixture(),before=structuredClone(s);
  const plan=getMovementWhatIfPlans(s,{unitId:'a',playerId:'p1'});
  assert.equal(plan.available,true,plan.reason);
  assert.ok(plan.options.length>=2);
  const hold=plan.options.find(o=>o.kind==='hold');
  const enemy=plan.options.find(o=>o.kind==='enemy');
  assert.ok(hold);
  assert.ok(enemy);
  assert.equal(hold.travel,0);
  assert.equal(hold.attack,null,'target starts beyond the maximum approximate Shooting range');
  assert.ok(enemy.travel>0 && enemy.travel<=6);
  assert.ok(enemy.attack,'postmove sample should bring ranged target into known saved profile range');
  assert.equal(enemy.attack.targetId,'b');
  assert.ok(enemy.attack.fullAttack,'combined forecast remains attached to sampled position');
  assert.ok(enemy.position.x>hold.position.x);
  assert.equal(enemy.position.y,hold.position.y);
  assert.match(plan.assumptions,/Does not check terrain/);
  assert.deepEqual(s,before,'hypothetical plan must not move live positions or mutate recorded history');
});

test('projection updates deployment-precedence coordinates, but only on the copied board',()=>{
  const s=fixture(),before=structuredClone(s);
  const projection=projectNormalMoveForPlanning(s,{unitId:'a',destination:{x:10,y:22}});
  assert.equal(projection.available,true,projection.reason);
  assert.equal(projection.travel,6);
  assert.deepEqual(getLiveUnitPosition(projection.state,projection.state.units[0]),{x:10,y:22});
  assert.deepEqual(getLiveUnitPosition(s,s.units[0]),{x:4,y:22});
  assert.deepEqual(s,before);
  assert.notEqual(projection.state.battlefieldMap.actualDeployment,s.battlefieldMap.actualDeployment);
  assert.notEqual(projection.state.units,s.units);
  assert.equal(projection.state.history,s.history,'no new history entries');
  assert.equal(projection.state.units[1],s.units[1],'enemy record is unchanged');
});

test('projection enforces known Normal Move distance and legal board bounds without guessing',()=>{
  const s=fixture();
  for(const position of [{x:11,y:22},{x:-1,y:22},{x:61,y:22},{x:4,y:45}]){
    const p=projectNormalMoveForPlanning(s,{unitId:'a',destination:position});
    assert.equal(p.available,false,JSON.stringify(position));
  }
  s.units[0].characteristics.movement=null;
  s.armyRosters.p1.units[0].datasheet.characteristics.Move=null;
  assert.equal(getMovementWhatIfPlans(s,{unitId:'a',playerId:'p1'}).available,false);
});

test('diagonal position rounding never drops a reachable Normal Move sample',()=>{
  const s=fixture();
  s.objectives=[{id:'diagonal',name:'Diagonal objective',position:{x:37,y:43}}];
  const plan=getMovementWhatIfPlans(s,{unitId:'a',playerId:'p1'});
  assert.equal(plan.available,true,plan.reason);
  const candidate=plan.options.find(option=>option.kind==='objective');
  assert.ok(candidate,'diagonal candidate must survive rounding-to-tenths');
  assert.ok(candidate.travel<=6,'sampled diagonal distance must not exceed known Move');
  assert.ok(candidate.travel>5.7);
  assert.deepEqual(s.units[0].position,{x:4,y:22});
});

test('attached formation stays together and cannot use a faster bodyguard move',()=>{
  const s=fixture();
  const leader={id:'leader',ownerId:'p1',name:'Attached Leader',status:'deployed',
    position:{x:3,y:21},wounds:7,modelCount:1,
    characteristics:{movement:4,toughness:5,save:3,weaponSkill:3},
    metadata:{rosterUnitId:'leader'}};
  s.units.push(leader);
  s.armyRosters.p1.units[0].attachedLeaderIds=['leader'];
  s.armyRosters.p1.units.push({id:'leader',attachedToBodyguardId:'a',modelCount:1,
    datasheet:{characteristics:{Move:'4',Wounds:'7',Toughness:'5',Save:'3+'},
      weapons:[{name:'Blade',range:'Melee',attacks:4,skill:'3+',strength:6,ap:-2,damage:2}]},
    equippedWeapons:[{name:'Blade',quantity:1}]});
  s.battlefieldMap.actualDeployment.leader={position:{x:3,y:21}};
  const before=structuredClone(s);
  const p=projectNormalMoveForPlanning(s,{unitId:'leader',destination:{x:8,y:22}});
  assert.equal(p.available,true,p.reason);
  assert.equal(p.maxNormalMove,4);
  assert.deepEqual(getLiveUnitPosition(p.state,p.state.units.find(u=>u.id==='leader')),{x:7,y:21});
  assert.equal(projectNormalMoveForPlanning(s,{unitId:'a',destination:{x:9,y:22}}).available,false,
    'bodyguard cannot exceed attached Leader Move');
  const options=getMovementWhatIfPlans(s,{unitId:'leader',playerId:'p1'});
  assert.equal(options.available,true,options.reason);
  assert.equal(options.maxNormalMove,4);
  assert.ok(options.options.every(o=>o.travel<=4));
  assert.deepEqual(s,before);
});

test('no hypothetical second Normal Move after a movement activation is recorded',()=>{
  const s=fixture('movement');
  s.history.push({type:'unit.normal_move_resolved',payload:{
    unitId:'a',round:1,turn:1,moves:[{modelId:'a',position:{x:9,y:22}}]
  }});
  const result=getMovementWhatIfPlans(s,{unitId:'a',playerId:'p1'});
  assert.equal(result.available,false);
  assert.match(result.reason,/already recorded/);
});

test('own current Command and Movement only: never offer enemy or historical what-if movement',()=>{
  for(const phase of ['shooting','charge','fight']){
    assert.equal(getMovementWhatIfPlans(fixture(phase),{unitId:'a',playerId:'p1'}).available,false);
  }
  assert.equal(getMovementWhatIfPlans(fixture(),{unitId:'b',playerId:'p1'}).available,false);
  assert.equal(getMovementWhatIfPlans(fixture(),{unitId:'a',playerId:'p2'}).available,false);
  const s=fixture();
  s.activePlayer='p2';s.battle.activePlayerId='p2';
  assert.equal(getMovementWhatIfPlans(s,{unitId:'a',playerId:'p1'}).available,false);
});

test('Command and Movement panel has one-tap disclosure for what-if positions, no action buttons or VP award',()=>{
  for(const phase of ['command','movement']){
    const s=fixture(phase);
    const html=renderEarlyTurnPlanPanel(s,{selectedUnitId:'a',playerId:'p1'});
    assert.match(html,/data-view-key="early-turn-movement-what-if"/);
    assert.match(html,/Movement what-if/);
    assert.match(html,/Hold current position/);
    assert.match(html,/Stage toward enemy/);
    assert.match(html,/Straight-line, current marker positions only/);
    assert.match(html,/data-view-key="early-turn-advisor-limitations"/);
    const [mainContent, limitationsContent] = html.split('<details class="early-turn-plan__limitations"');
    assert.ok(limitationsContent, 'assumptions should have a separate, collapsed section');
    assert.doesNotMatch(mainContent,/Straight-line, current marker positions only|Baseline from current approximate map markers only/);
    assert.match(limitationsContent,/Straight-line, current marker positions only/);
    assert.match(limitationsContent,/Baseline from current approximate map markers only/);
    assert.match(limitationsContent,/^ data-view-key="early-turn-advisor-limitations"><summary>Estimate limitations<\/summary>/);
    assert.doesNotMatch(html,/data-move-save|data-shoot-unit|data-charge-success|data-record-attack|data-award-vp/);
    const workspace=renderCombatWorkspace({state:s,phase,perspectivePlayerId:'p1',
      selectedUnitId:'a',controls:'Recording controls',mapView:{render:()=>'<div class="map">map</div>'}});
    assert.match(workspace,/Movement what-if/);
    assert.match(workspace,/Recording controls/);
  }
  const s=fixture();
  const source=fs.readFileSync(new URL('../../src/rules/early-turn-movement-options.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/session\.dispatch|COMMAND_TYPES|dispatchBatch|RESOLVE_NORMAL_MOVE/);
  assert.equal(s.history.length,0);
});
