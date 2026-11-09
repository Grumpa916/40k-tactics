import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderSelectedUnitQuickAdjust } from '../../src/ui/selected-unit-quick-adjust.js';
import { renderCombatWorkspace } from '../../src/ui/combat-workspace.js';
import { getLiveUnitVitals } from '../../src/rules/live-unit-vitals.js';
import { recordUnitCasualty, undoUnitCasualty } from '../../src/engine/unit-casualty-transitions.js';
import { adjustUnitWounds } from '../../src/engine/unit-vitals-transitions.js';
import { setManualBattleShock } from '../../src/engine/manual-battle-shock-transitions.js';
import { getDatasheetWeaponOptions } from '../../src/rules/saved-roster-combat-profile.js';

function state({mixed=false, phase='shooting'}={}) {
  const equippedWargear=[
    {name:'Chitinous claws and teeth',quantity:10},
    {name:'Fleshborer',quantity:mixed?9:10},
    ...(mixed?[{name:'Spike rifle',quantity:1}]:[])
  ];
  return {
    phase,turn:1,activePlayer:'p1',
    battle:{id:'fixture',status:'active',round:1,activePlayerId:'p1'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    history:[],objectives:[],
    armyRosters:{p1:{units:[{
      id:'gants',name:'Termagants',datasheetId:'tyranids:termagants',modelCount:10,
      equippedWargear,equippedWeapons:equippedWargear.map(item=>({...item,selectionName:item.name})),
      datasheet:{characteristics:{Wounds:1,Toughness:3,Save:'5+'},weapons:[
        {name:'Fleshborer',range:'18"',attacks:1,skill:'4+',strength:5,ap:0,damage:1},
        {name:'Spike rifle',range:'24"',attacks:1,skill:'4+',strength:4,ap:0,damage:1},
        {name:'Chitinous claws and teeth',range:'Melee',attacks:1,skill:'4+',strength:3,ap:0,damage:1}
      ]}
    }]}},
    units:[{
      id:'p1:gants',ownerId:'p1',name:'Termagants',status:'deployed',
      startingWounds:10,wounds:10,currentStrength:10,
      metadata:{rosterUnitId:'gants',modelCount:10,datasheetId:'tyranids:termagants'}
    }]
  };
}

test('selected homogeneous formation offers 44px one-tap wounds, models and Battle-shock without Reposition',()=>{
  const s=state(),before=JSON.stringify(s);
  const html=renderSelectedUnitQuickAdjust(s,'p1:gants');
  assert.match(html,/data-selected-unit-quick-adjust/);
  assert.match(html,/SELECTED UNIT · QUICK ADJUST/);
  assert.match(html,/10 \/ 10/);
  assert.match(html,/data-adjust-unit-wounds="-1"/);
  assert.match(html,/data-adjust-unit-wounds="1"/);
  assert.match(html,/data-record-casualty data-unit-id="p1:gants"/);
  assert.match(html,/data-toggle-live-battle-shock/);
  assert.doesNotMatch(html,/data-live-map-reposition|>Reposition</,
    'map dragging is the only positioning control; avoid a duplicate button');
  assert.match(html,/data-global-state-message/);
  assert.match(html,/selected-unit-quick-adjust\.css/);
  assert.doesNotMatch(html,/data-casualty-editor/,'homogeneous equipment does not need a picker');
  assert.equal(JSON.stringify(s),before,'view must never change the game state');
});

test('a single casualty adjusts the actual tracked models and retained weapon quantity',()=>{
  const before=state();
  const after=recordUnitCasualty(before,{unitId:'p1:gants'});
  const html=renderSelectedUnitQuickAdjust(after,'p1:gants');
  assert.match(html,/9 \/ 10/);
  assert.match(html,/Undo last casualty/);
  const weapons=getDatasheetWeaponOptions(after,after.units[0],{type:'ranged'});
  assert.equal(weapons.find(weapon=>weapon.name==='Fleshborer')?.activeQuantity,9);
  const restored=undoUnitCasualty(after,{unitId:'p1:gants'});
  assert.equal(getLiveUnitVitals(restored,restored.units[0]).models,10);
});

test('a heterogeneous casualty asks which weapon was removed, never silently uses -1 model',()=>{
  const s=state({mixed:true});
  const html=renderSelectedUnitQuickAdjust(s,'p1:gants');
  assert.match(html,/−1 model · choose equipment/);
  assert.match(html,/data-casualty-slot-id="ranged-weapon"/);
  assert.match(html,/data-casualty-selection="Spike rifle"/);
  assert.doesNotMatch(html,/<button[^>]*data-record-casualty data-unit-id="p1:gants" aria-label=/);
  const after=recordUnitCasualty(s,{unitId:'p1:gants',slotSelections:{'ranged-weapon':'Spike rifle'}});
  assert.deepEqual(getDatasheetWeaponOptions(after,after.units[0],{type:'ranged'}).map(w=>w.name),['Fleshborer']);
});

test('wound and Battle-shock controls use existing phase-independent transitions',()=>{
  let s=state({phase:'fight'});
  s=adjustUnitWounds(s,{unitId:'p1:gants',amount:-1});
  assert.equal(getLiveUnitVitals(s,s.units[0]).wounds,9);
  assert.equal(s.history.at(-1).type,'unit.wounds_adjusted');
  s=setManualBattleShock(s,{unitId:'p1:gants',battleShocked:true});
  const html=renderSelectedUnitQuickAdjust(s,'p1:gants');
  assert.match(html,/Battle-shocked/);
  assert.match(html,/aria-pressed="true"/);
  assert.equal(s.units[0].battleShocked,true);
});

test('attached formation offers bodyguard corrections and separately expandable Leader corrections',()=>{
  const s={
    phase:'fight',turn:1,activePlayer:'p1',
    battle:{id:'b',status:'active',round:1,activePlayerId:'p1'},
    history:[],objectives:[],players:[{id:'p1'}],
    units:[
      {id:'wardens',ownerId:'p1',name:'Custodian Wardens',status:'deployed',wounds:12,startingWounds:12,startingStrength:3},
      {id:'trajann',ownerId:'p1',name:'Trajann Valoris',status:'deployed',wounds:10,startingWounds:10,startingStrength:1}
    ],
    armyRosters:{p1:{units:[
      {id:'wardens-roster',attachedLeaderIds:['trajann-roster']},
      {id:'trajann-roster',attachedToBodyguardId:'wardens-roster'}
    ]}}
  };
  s.units[0].metadata={rosterUnitId:'wardens-roster'};
  s.units[1].metadata={rosterUnitId:'trajann-roster'};
  const html=renderSelectedUnitQuickAdjust(s,'trajann');
  assert.match(html,/Custodian Wardens/);
  assert.match(html,/Attached models/);
  assert.match(html,/Trajann Valoris/);
  assert.match(html,/data-quick-unit-id="wardens"/);
  assert.match(html,/data-quick-unit-id="trajann"/);
});

test('shared combat phases move active state edits to the left roster and free the right panel',()=>{
  const base=state();
  for (const phase of ['command','movement','charge','fight']) {
    const current={...base,phase};
    const html=renderCombatWorkspace({state:current,phase,perspectivePlayerId:'p1',selectedUnitId:'p1:gants',
      controls:'Phase controls',mapView:{render:()=>'<div class="map">map</div>'}});
    const rail=html.split('class="combat-workspace__rail"')[1].split('class="combat-workspace__map"')[0];
    const right=html.split('class="combat-workspace__panel"')[1];
    assert.match(rail,/data-adjust-unit-wounds="-1" data-unit-id="p1:gants"/);
    assert.match(rail,/data-adjust-unit-wounds="1" data-unit-id="p1:gants"/);
    assert.match(rail,/data-toggle-live-battle-shock data-unit-id="p1:gants"/);
    assert.match(rail,/data-record-casualty/,'casualty tracking stays accessible');
    assert.match(rail,/class="roster-unit-editor"[^>]*open/);
    assert.doesNotMatch(right,/data-selected-unit-quick-adjust|data-adjust-unit-wounds|data-toggle-live-battle-shock/,
      phase+' should have no right-side quick adjust');
  }
  const historical={...base,phase:'movement'};
  const html=renderCombatWorkspace({state:historical,phase:'fight',perspectivePlayerId:'p1',
    selectedUnitId:'p1:gants',controls:'Historical view',mapView:{render:()=>'<div>map</div>'}});
  assert.doesNotMatch(html,/data-adjust-unit-wounds|data-toggle-live-battle-shock|data-selected-unit-quick-adjust/,
    'historical phase views cannot edit unit state');
  assert.equal(renderSelectedUnitQuickAdjust({...base,battle:{status:'deployment'}},'p1:gants'),'');
  assert.equal(renderSelectedUnitQuickAdjust(base,'missing'),'');
  assert.equal(renderSelectedUnitQuickAdjust(base,null),'');
});

test('Shooting uses the shared roster adjustment commands rather than the right panel',()=>{
  const source=fs.readFileSync(new URL('../../src/ui/shooting-screen.js',import.meta.url),'utf8');
  assert.match(source,/renderPhaseArmyRoster\(state, perspectivePlayerId,/);
  assert.match(source,/enableAdjust:state\.phase === 'shooting'/);
  assert.doesNotMatch(source,/renderSelectedUnitQuickAdjust\(state, activeUnitId\)/);
  const combat=fs.readFileSync(new URL('../../src/ui/combat-workspace.js',import.meta.url),'utf8');
  assert.doesNotMatch(combat,/renderSelectedUnitQuickAdjust/);
  const component=fs.readFileSync(new URL('../../src/ui/selected-unit-quick-adjust.js',import.meta.url),'utf8');
  assert.doesNotMatch(component,/data-live-map-reposition|>Reposition</,
    'state edits must not duplicate map positioning controls');
  assert.doesNotMatch(component,/session\.dispatch|activateShootingUnit|resolveShootingAttack/);
  const shell=fs.readFileSync(new URL('../../src/ui/battle-demo.js',import.meta.url),'utf8');
  assert.match(shell,/bindLiveCasualtyControls\(root, \{ session \}\)/,
    'roster buttons must use existing global correction controller');
});
