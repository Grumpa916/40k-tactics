import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getEarlyTurnPlan } from '../../src/rules/early-turn-plan.js';
import { renderEarlyTurnPlanPanel } from '../../src/ui/early-turn-plan-panel.js';
import { renderCombatWorkspace } from '../../src/ui/combat-workspace.js';

function fixture(phase='command'){
  const own={id:'a',ownerId:'p1',name:'Allarus',status:'deployed',
    wounds:10,modelCount:1,position:{x:18,y:22},
    characteristics:{toughness:5,save:3,weaponSkill:3,ballisticSkill:3,objectiveControl:2},
    metadata:{rosterUnitId:'a'}};
  const foe={id:'b',ownerId:'p2',name:'Enemy holder',status:'deployed',
    wounds:10,modelCount:1,position:{x:25,y:22},
    characteristics:{toughness:5,save:3,weaponSkill:3,ballisticSkill:3,objectiveControl:2},
    metadata:{rosterUnitId:'b'}};
  const datasheet={
    characteristics:{Toughness:'5',Save:'3+',Wounds:'10',Move:'6',OC:'2'},
    weapons:[
      {name:'Boltstorm',range:'24"',attacks:4,skill:'3+',strength:5,ap:-1,damage:2},
      {name:'Blade',range:'Melee',attacks:4,skill:'3+',strength:6,ap:-2,damage:2}
    ]
  };
  return {
    phase,turn:1,activePlayer:'p1',
    battle:{id:'b1',round:1,status:'active',activePlayerId:'p1'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    history:[],objectives:[],
    units:[own,foe],
    armyRosters:{
      p1:{faction:'Test',units:[{id:'a',name:'Allarus',modelCount:1,datasheet:structuredClone(datasheet),
        equippedWeapons:[{name:'Boltstorm',quantity:1},{name:'Blade',quantity:1}]}]},
      p2:{faction:'Test',units:[{id:'b',name:'Enemy holder',modelCount:1,datasheet:structuredClone(datasheet),
        equippedWeapons:[{name:'Boltstorm',quantity:1},{name:'Blade',quantity:1}]}]}
    }
  };
}

test('Command phase can compare shooting-only and conditional Full Attack from current markers with no state mutation',()=>{
  const state=fixture('command'),before=structuredClone(state);
  const plan=getEarlyTurnPlan(state,{unitId:'a',playerId:'p1'});
  assert.equal(plan.available,true,plan.reason);
  assert.equal(plan.unitId,'a');
  assert.ok(plan.attack,'saved ranged weapon and in-range deployed target');
  assert.equal(plan.attack.targetId,'b');
  assert.equal(plan.attack.weaponName,'Boltstorm');
  assert.ok(Number.isFinite(plan.attack.expectedShootingDamage));
  assert.ok(plan.attack.shootingKillProbability>=0 && plan.attack.shootingKillProbability<=1);
  assert.equal(plan.attack.fullAttack.available,true,plan.attack.fullAttack.reason);
  assert.ok(plan.attack.fullAttack.expectedDamage>=plan.attack.expectedShootingDamage - 0.0001,
    'combined conditional expectation cannot be below the baseline shooting branch');
  assert.match(plan.assumptions,/no future move/);
  assert.deepEqual(state,before);
  const html=renderEarlyTurnPlanPanel(state,{selectedUnitId:'a',playerId:'p1'});
  assert.match(html,/A · Full Attack/);
  assert.match(html,/B · Shoot only/);
  assert.match(html,/C · Mission positioning/);
  assert.match(html,/current approximate map markers/);
  assert.doesNotMatch(html,/data-move-save|data-shoot-unit|data-charge-success|data-record-attack/,
    'planning surfaces never commit actions');
});

test('Movement uses the same read-only planner without altering phase or history',()=>{
  const s=fixture('movement'), before=structuredClone(s);
  const plan=getEarlyTurnPlan(s,{unitId:'a',playerId:'p1'});
  assert.equal(plan.available,true);
  assert.equal(plan.attack?.targetId,'b');
  assert.deepEqual(s,before);
  const html=renderCombatWorkspace({
    state:s,phase:'movement',perspectivePlayerId:'p1',selectedUnitId:'a',
    controls:'<span data-phase-action>Movement controls</span>',mapView:{render:()=>'<div class="battlefield-map">map</div>'}
  });
  assert.match(html,/data-early-turn-plan/);
  assert.match(html,/Movement controls/);
  assert.ok(html.indexOf('data-early-turn-plan')<html.indexOf('data-phase-action'), 'planner precedes real phase controls, not the panel ARIA label');
  assert.match(html,/battlefield-map/);
});

test('ineligible phase, enemy turn, missing unit or wrong owner cannot create a turn plan',()=>{
  for(const phase of ['shooting','charge','fight','end_turn']){
    assert.equal(getEarlyTurnPlan(fixture(phase),{unitId:'a',playerId:'p1'}).available,false,phase);
  }
  const s=fixture();
  assert.equal(getEarlyTurnPlan(s,{unitId:'b',playerId:'p1'}).available,false);
  assert.equal(getEarlyTurnPlan(s,{unitId:'missing',playerId:'p1'}).available,false);
  assert.equal(getEarlyTurnPlan(s,{unitId:'a',playerId:'p2'}).available,false);
  assert.equal(renderEarlyTurnPlanPanel(s,{selectedUnitId:null,playerId:'p1'}),'');
  assert.equal(renderEarlyTurnPlanPanel({...s,phase:'shooting'},{selectedUnitId:'a',playerId:'p1'}),'');
  assert.equal(renderEarlyTurnPlanPanel({...s,activePlayer:'p2'},{selectedUnitId:'a',playerId:'p1'}),'');
});

test('out-of-range or unplaced target does not generate a fictional legal attack',()=>{
  const s=fixture();
  s.units[1].position={x:60,y:44};
  const far=getEarlyTurnPlan(s,{unitId:'a',playerId:'p1'});
  assert.equal(far.available,true);
  assert.equal(far.attack,null);
  const html=renderEarlyTurnPlanPanel(s,{selectedUnitId:'a',playerId:'p1'});
  assert.match(html,/No currently comparable ranged target/);
  assert.match(html,/Moving may create an opportunity/);
  s.units[1].position=null;
  assert.equal(getEarlyTurnPlan(s,{unitId:'a',playerId:'p1'}).attack,null);
});

test('prior movement Advance may withhold combined attack but preserve independent shooting forecast',()=>{
  const s=fixture('movement');
  s.history.push({type:'unit.advanced',payload:{unitId:'a',turn:1,round:1}});
  const plan=getEarlyTurnPlan(s,{unitId:'a',playerId:'p1'});
  assert.ok(plan.attack);
  assert.equal(plan.attack.fullAttack.available,false);
  assert.match(plan.attack.fullAttack.reason,/Advanced/);
  const html=renderEarlyTurnPlanPanel(s,{selectedUnitId:'a',playerId:'p1'});
  assert.match(html,/Combined estimate unknown/);
  assert.doesNotMatch(html,/Expected fight-back: 0\.0/);
});

test('incomplete imported loadout never blocks early-turn Command or Movement navigation',()=>{
  const s=fixture('command');
  s.armyRosters.p1.units[0].datasheet=null;
  s.armyRosters.p1.units[0].equippedWeapons=[];
  const before=structuredClone(s);
  const plan=getEarlyTurnPlan(s,{unitId:'a',playerId:'p1'});
  assert.equal(plan.available,true);
  assert.equal(plan.attack,null);
  assert.deepEqual(s,before);
  const html=renderCombatWorkspace({state:s,phase:'command',perspectivePlayerId:'p1',
    selectedUnitId:'a',controls:'Score your mission',mapView:{render:()=>'<div>map</div>'}});
  assert.match(html,/Score your mission/);
  assert.match(html,/Mission positioning/);
});

test('reuses shared sidebar only for live Command and Movement, not historical views',()=>{
  const s=fixture('command');
  const html=renderCombatWorkspace({state:s,phase:'command',perspectivePlayerId:'p1',
    selectedUnitId:'a',controls:'Command controls',mapView:{render:()=>'<div>map</div>'}});
  assert.match(html,/data-early-turn-plan/);
  const history=renderCombatWorkspace({state:s,phase:'movement',perspectivePlayerId:'p1',
    selectedUnitId:'a',controls:'Historic movement',mapView:{render:()=>'<div>map</div>'}});
  assert.doesNotMatch(history,/data-early-turn-plan/);
  const src=fs.readFileSync(new URL('../../src/rules/early-turn-plan.js',import.meta.url),'utf8');
  assert.doesNotMatch(src,/session\.dispatch|COMMAND_TYPES|RECORD_|ADJUST_LIVE_MAP_POSITION/);
  assert.match(src,/projectedShooting = \{\.\.\.state,phase:'shooting'/);
  assert.match(src,/getFullAttackAdvice\(projectedShooting/);
});
