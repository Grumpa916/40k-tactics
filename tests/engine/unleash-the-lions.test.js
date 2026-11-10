import test from 'node:test';
import assert from 'node:assert/strict';
import { ADEPTUS_CUSTODES_DATASHEET_DETAILS } from '../../src/data/adeptus-custodes-datasheet-details.js';
import { recordCustodesDetachmentStratagemUse } from '../../src/engine/custodes-detachment-stratagem-transitions.js';
import { getUnleashTheLionsOpportunities } from '../../src/rules/custodes-detachment-stratagem-opportunities.js';
import { getLiveUnitVitals } from '../../src/rules/live-unit-vitals.js';
import { getCombatFormationMembers, getCombatFormationRoot } from '../../src/rules/battle-unit-reference.js';
import { getDatasheetWeaponOptions } from '../../src/rules/saved-roster-combat-profile.js';
import { renderCustodesDetachmentStratagemControls } from '../../src/ui/custodes-detachment-stratagem-controls.js';
import { renderPhaseArmyRoster } from '../../src/ui/phase-army-roster.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';
import { expandLiveSquadModels } from '../../src/engine/battlefield-map-transitions.js';

function battle({sheet='allarus-custodians',detachment='Lions of the Emperor',status='deployed',phase='command',weapons=null}={}) {
  const datasheetId='adeptus-custodes:'+sheet;
  const equippedWeapons=weapons??[
    {name:sheet==='allarus-custodians'?'Balistus Grenade Launcher':'Adrathic Combi-destructor',quantity:3},
    {name:sheet==='allarus-custodians'?'Guardian Spear':'Solarite Power Gauntlet',quantity:3}
  ];
  return {
    phase,activePlayer:'p1',turn:1,battle:{id:'b',status:'active',round:1,activePlayerId:'p1'},
    players:[{id:'p1'},{id:'p2'}],history:[],commandPoints:{p1:2,p2:2},
    armyRosters:{p1:{faction:'Adeptus Custodes',detachment,units:[{
      id:'r1',name:'Allarus Custodians',datasheetId,modelCount:3,points:270,
      datasheet:ADEPTUS_CUSTODES_DATASHEET_DETAILS[datasheetId],
      equippedWeapons,equippedWargear:equippedWeapons.map(item=>({...item})),
      loadoutValidation:{status:'source-reviewed'}
    }]}},
    units:[{id:'p1:u1',ownerId:'p1',name:'Allarus Custodians',status,
      position:{x:20,y:20},metadata:{rosterUnitId:'r1',datasheetId,modelCount:3},
      wounds:18,startingWounds:18}]
  };
}
const command={playerId:'p1',unitId:'p1:u1',stratagemId:'unleash-the-lions',
  timingConfirmed:true,unitLimitConfirmed:true,woundsByModel:[6,4,6]};

test('Command split creates separate model units, CP spend, roster equipment, map markers and wounds',()=>{
  const start=battle();
  const next=recordCustodesDetachmentStratagemUse(start,command);
  assert.equal(next.commandPoints.p1,1);
  assert.equal(start.units.length,1);
  assert.equal(next.units.length,3);
  assert.deepEqual(next.units.map(unit=>unit.wounds),[6,4,6]);
  assert.ok(next.units.every(unit=>unit.startingStrength===1&&unit.currentStrength===1));
  assert.equal(new Set(next.units.map(unit=>unit.id)).size,3);
  assert.equal(next.armyRosters.p1.units.reduce((sum,unit)=>sum+unit.points,0),270);
  assert.equal(next.armyRosters.p1.units[1].equippedWeapons[0].quantity,1);
  assert.equal(getLiveUnitVitals(next,next.units[1]).startingWounds,6);
  assert.equal(getDatasheetWeaponOptions(next,next.units[1],{type:'melee'}).find(item=>item.name==='Guardian Spear')?.activeQuantity,1);
  const rail=renderPhaseArmyRoster(next,'p1');
  assert.match(rail,/Allarus Custodians 1/);
  assert.match(rail,/Allarus Custodians 2/);
  assert.match(rail,/Allarus Custodians 3/);
  const board=renderBattlefieldMap(next,{mode:'live',perspectivePlayerId:'p1'});
  assert.equal((board.match(/data-map-unit-id="p1:u1(?::lions:[^"]*)?"/g)??[]).length,3);
  assert.equal(next.history.at(-1).type,'custodes.terminators_split');
  assert.deepEqual(next.history.at(-1).payload.unitIds,next.units.map(unit=>unit.id));
  assert.equal(getUnleashTheLionsOpportunities(next,{playerId:'p1'}).some(item=>item.available),false);
});

test('only deployed Allarus and Aquilon in Lions detachment and own Command phase can split',()=>{
  assert.equal(getUnleashTheLionsOpportunities(battle(),{playerId:'p1'})[0].available,true);
  assert.equal(getUnleashTheLionsOpportunities(battle({sheet:'aquilon-terminators-with-solarite-power-gauntlets'}),{playerId:'p1'})[0].available,true);
  assert.deepEqual(getUnleashTheLionsOpportunities(battle({detachment:'Guardians of the Throne'}),{playerId:'p1'}),[]);
  assert.deepEqual(getUnleashTheLionsOpportunities(battle({status:'reserves'}),{playerId:'p1'}),[]);
  assert.deepEqual(getUnleashTheLionsOpportunities(battle({phase:'movement'}),{playerId:'p1'}),[]);
});

test('invalid wound allocation and mixed equipment never spend CP or duplicate units',()=>{
  const start=battle({weapons:[{name:'Guardian Spear',quantity:2},{name:'Castellan Axe',quantity:1}]});
  assert.throws(()=>recordCustodesDetachmentStratagemUse(start,command),/Mixed or uncertain wargear/);
  assert.throws(()=>recordCustodesDetachmentStratagemUse(battle(),{...command,woundsByModel:[6,7,6]}),/current wounds/);
  assert.equal(start.commandPoints.p1,2);
  assert.equal(start.units.length,1);
});

test('Command phase shows the split form and wound allocation field',()=>{
  const html=renderCustodesDetachmentStratagemControls(battle(),{playerId:'p1',stratagemId:'unleash-the-lions'});
  assert.match(html,/Remaining wounds per model/);
  assert.match(html,/data-custodes-detachment-stratagem-form/);
  assert.match(html,/Spend 1 CP/);
});

function withTrajannAttached(state=battle()) {
  const sheet='adeptus-custodes:trajann-valoris';
  const bodyguard=state.armyRosters.p1.units[0];
  bodyguard.attachedLeaderIds=['r-trajann'];
  state.armyRosters.p1.units.push({
    id:'r-trajann',name:'Trajann Valoris',datasheetId:sheet,modelCount:1,
    attachedToBodyguardId:bodyguard.id,points:265,isWarlord:true,
    datasheet:ADEPTUS_CUSTODES_DATASHEET_DETAILS[sheet],
    equippedWeapons:[{name:'Eagle’s Scream',quantity:1},{name:'Watcher’s Axe',quantity:1}],
    equippedWargear:[],loadoutValidation:{status:'source-reviewed'}
  });
  state.units.push({
    id:'p1:trajann',ownerId:'p1',name:'Trajann Valoris',status:'deployed',
    position:{x:20,y:20},metadata:{rosterUnitId:'r-trajann',datasheetId:sheet,modelCount:1},
    wounds:9,startingWounds:10
  });
  return state;
}

test('attached Trajann plus three Allarus becomes four separate model-accurate units',()=>{
  const start=withTrajannAttached();
  const before=JSON.stringify(start);
  const entry=getUnleashTheLionsOpportunities(start,{playerId:'p1'})[0];
  assert.equal(entry.available,true);
  assert.equal(entry.modelCount,4);
  const form=renderCustodesDetachmentStratagemControls(start,{playerId:'p1',stratagemId:'unleash-the-lions'});
  assert.match(form,/6, 6, 6, 10/);
  assert.match(form,/Trajann Valoris/);
  const next=recordCustodesDetachmentStratagemUse(start,{
    ...command,woundsByModel:[6,4,6,9]
  });
  assert.equal(JSON.stringify(start),before,'never change the original state');
  assert.equal(next.commandPoints.p1,1);
  assert.equal(next.units.length,4);
  assert.equal(new Set(next.units.map(unit=>unit.id)).size,4);
  assert.deepEqual(next.units.map(unit=>unit.wounds),[6,4,6,9]);
  assert.ok(next.units.every(unit=>unit.startingStrength===1&&unit.currentStrength===1));
  assert.deepEqual(next.units.map(unit=>unit.startingWounds),[6,6,6,10]);
  const trajann=next.units.find(unit=>unit.id==='p1:trajann');
  assert.equal(trajann.metadata.datasheetId,'adeptus-custodes:trajann-valoris');
  assert.notDeepEqual(trajann.position,next.units[0].position);
  assert.equal(getCombatFormationRoot(next,trajann).id,trajann.id);
  assert.equal(getCombatFormationMembers(next,next.units[0]).length,1);
  assert.equal(getCombatFormationMembers(next,trajann).length,1);
  assert.equal(next.armyRosters.p1.units.length,4);
  assert.equal(next.armyRosters.p1.units.reduce((sum,unit)=>sum+unit.points,0),535);
  assert.equal(next.armyRosters.p1.units[3].attachedToBodyguardId,null);
  assert.equal(next.armyRosters.p1.units[3].isWarlord,true);
  assert.equal(next.armyRosters.p1.units[3].equippedWeapons[1].name,'Watcher’s Axe');
  assert.ok(next.armyRosters.p1.units.slice(0,3).every(unit=>unit.attachedLeaderIds.length===0));
  const roster=renderPhaseArmyRoster(next,'p1');
  assert.match(roster,/Trajann Valoris/);
  assert.doesNotMatch(roster,/Attached unit/);
  const map=renderBattlefieldMap(next,{mode:'live',perspectivePlayerId:'p1'});
  assert.equal((map.match(/data-map-unit-id="p1:u1(?::lions:[^"]*)?"/g)??[]).length,3);
  assert.match(map,/data-map-unit-id="p1:trajann"/);
  assert.deepEqual(next.history.at(-1).payload.unitIds,next.units.map(unit=>unit.id));
  assert.deepEqual(next.history.at(-1).payload.leaderUnitIds,['p1:trajann']);
  assert.equal(next.history.at(-1).payload.originalModels,4);
});

test('attached Leader wound maximum is independent, with no CP spent for invalid input',()=>{
  const start=withTrajannAttached();
  assert.throws(()=>recordCustodesDetachmentStratagemUse(start,{
    ...command,woundsByModel:[6,6,6,11]
  }),/current wounds/);
  assert.throws(()=>recordCustodesDetachmentStratagemUse(start,{
    ...command,woundsByModel:[6,6,6]
  }),/current wounds/);
  assert.equal(start.commandPoints.p1,2);
  assert.equal(start.units.length,2);
  assert.deepEqual(start.armyRosters.p1.units[0].attachedLeaderIds,['r-trajann']);
  assert.equal(start.armyRosters.p1.units[1].attachedToBodyguardId,'r1');
});

test('two surviving models including the attached Leader are sufficient to split',()=>{
  const start=withTrajannAttached(battle({weapons:[
    {name:'Balistus Grenade Launcher',quantity:1},{name:'Guardian Spear',quantity:1}
  ]}));
  start.units[0].currentStrength=1;
  start.units[0].metadata.currentModelCount=1;
  start.armyRosters.p1.units[0].modelCount=1;
  const opportunity=getUnleashTheLionsOpportunities(start,{playerId:'p1'})[0];
  assert.equal(opportunity.modelCount,2);
  assert.equal(opportunity.available,true);
  const next=recordCustodesDetachmentStratagemUse(start,{...command,woundsByModel:[5,9]});
  assert.equal(next.units.length,2);
  assert.equal(next.commandPoints.p1,1);
  assert.deepEqual(next.units.map(unit=>unit.wounds),[5,9]);
});

test('Trajann plus prepositioned three Allarus split into four preserved tabletop positions with a chosen Vexilla bearer',()=>{
  const initial=withTrajannAttached();
  initial.armyRosters.p1.units[0].equippedWargear=[
    {name:'Guardian Spear',quantity:3},
    {name:'Balistus Grenade Launcher',quantity:3},
    {name:'Vexilla',quantity:1}
  ];
  const form=renderCustodesDetachmentStratagemControls(initial,{playerId:'p1',stratagemId:'unleash-the-lions'});
  assert.match(form,/Which Terminator has the Vexilla/);
  assert.match(form,/name="vexillaModelIndex"/);
  const expanded=expandLiveSquadModels(initial,{unitId:'p1:u1',playerId:'p1'});
  const positions=expanded.units[0].models.map(m=>({...m.position}));
  const withLeaderPosition={...expanded,units:expanded.units.map(u=>
    u.id==='p1:trajann'?{...u,position:{x:23.5,y:22.5}}:u)};
  assert.throws(()=>recordCustodesDetachmentStratagemUse(withLeaderPosition,{
    ...command,woundsByModel:[6,4,6,9]
  }),/Choose which surviving Terminator model carries the Vexilla/);
  const start=JSON.stringify(withLeaderPosition);
  const next=recordCustodesDetachmentStratagemUse(withLeaderPosition,{
    ...command,woundsByModel:[6,4,6,9],vexillaModelIndex:2
  });
  assert.equal(JSON.stringify(withLeaderPosition),start,'input battle remains unchanged');
  assert.equal(next.units.length,4);
  assert.equal(next.commandPoints.p1,1);
  assert.deepEqual(next.units.slice(0,3).map(u=>u.position),positions);
  assert.deepEqual(next.units[3].position,{x:23.5,y:22.5});
  assert.deepEqual(next.units.slice(0,3).map(u=>u.models[0].position),positions);
  assert.deepEqual(next.units.map(u=>u.wounds),[6,4,6,9]);
  assert.deepEqual(next.armyRosters.p1.units.slice(0,3).map(u=>
    u.equippedWargear.some(item=>item.name==='Vexilla')),[false,true,false]);
  assert.deepEqual(next.units.slice(0,3).map(u=>u.liveWargear.activeSelections.vexilla ?? 0),[0,1,0]);
  assert.equal(next.armyRosters.p1.units.find(u=>u.isWarlord)?.name,'Trajann Valoris');
  assert.equal(getCombatFormationMembers(next,next.units[0]).length,1);
  assert.equal(next.history.at(-1).payload.vexillaModelIndex,2);
  const map=renderBattlefieldMap(next,{mode:'live',perspectivePlayerId:'p1'});
  for(const id of next.units.map(u=>u.id))assert.ok(map.includes('data-map-unit-id="'+id+'"'));
});


test('Allarus-only squad of two surviving models splits into two independent units with no Leader',()=>{
  // Battle began with three; one model was removed earlier, leaving two and a
  // single Vexilla carried by one survivor. Live model positions are known.
  const start=battle();
  const bodyguard=start.units[0];
  bodyguard.currentStrength=2;
  bodyguard.metadata.currentModelCount=2;
  bodyguard.wounds=11;
  bodyguard.models=[
    {id:'all-1',position:{x:18.2,y:20.1}},
    {id:'all-3',position:{x:20.7,y:19.5}}
  ];
  bodyguard.liveWargear={
    source:'tabletop-casualty-tracking',modelsRemaining:2,
    activeSelections:{
      'balistus grenade launcher':2,
      'guardian spear':2,
      vexilla:1
    }
  };
  start.armyRosters.p1.units[0].equippedWargear.push({name:'Vexilla',quantity:1});

  const candidate=getUnleashTheLionsOpportunities(start,{playerId:'p1'})[0];
  assert.equal(candidate.available,true);
  assert.equal(candidate.modelCount,2);
  const form=renderCustodesDetachmentStratagemControls(start,{playerId:'p1',stratagemId:'unleash-the-lions'});
  assert.match(form,/Allarus Custodians · 2 models/);
  assert.match(form,/Which Terminator has the Vexilla/);
  assert.doesNotMatch(form,/Enter Terminator models first, then/,'no Leader allocation requested');

  const previous=JSON.stringify(start);
  const result=recordCustodesDetachmentStratagemUse(start,{
    ...command,woundsByModel:[5,6],vexillaModelIndex:2
  });
  assert.equal(JSON.stringify(start),previous);
  assert.equal(result.commandPoints.p1,1);
  assert.equal(result.units.length,2);
  assert.equal(result.armyRosters.p1.units.length,2);
  assert.deepEqual(result.units.map(unit=>unit.wounds),[5,6]);
  assert.deepEqual(result.units.map(unit=>unit.startingWounds),[6,6]);
  assert.ok(result.units.every(unit=>unit.currentStrength===1&&unit.startingStrength===1));
  assert.ok(result.units.every(unit=>getCombatFormationMembers(result,unit).length===1));
  assert.deepEqual(result.units.map(unit=>unit.position),[
    {x:18.2,y:20.1},{x:20.7,y:19.5}
  ]);
  assert.deepEqual(result.units.map(unit=>unit.models[0].id),['all-1','all-3']);
  assert.deepEqual(result.armyRosters.p1.units.map(unit=>unit.equippedWargear
    .some(item=>item.name==='Vexilla')),[false,true]);
  assert.deepEqual(result.units.map(unit=>unit.liveWargear.activeSelections.vexilla??0),[0,1]);
  assert.ok(result.armyRosters.p1.units.every(unit=>unit.attachedLeaderIds.length===0));
  assert.equal(result.armyRosters.p1.units.reduce((total,unit)=>total+(unit.points??0),0),270);
  assert.deepEqual(result.history.at(-1).payload.unitIds,result.units.map(unit=>unit.id));
  assert.deepEqual(result.history.at(-1).payload.leaderUnitIds,[]);
  assert.equal(result.history.at(-1).payload.originalModels,2);
  const rail=renderPhaseArmyRoster(result,'p1');
  assert.match(rail,/Allarus Custodians 1/);
  assert.match(rail,/Allarus Custodians 2/);
  const map=renderBattlefieldMap(result,{mode:'live',perspectivePlayerId:'p1'});
  assert.equal((map.match(/data-map-unit-id="p1:u1(?::lions:[^"]*)?"/g)??[]).length,2);
  assert.equal(getUnleashTheLionsOpportunities(result,{playerId:'p1'}).some(entry=>entry.available),false);
});

test('original two-model Allarus-only squad splits without a casualty record or Leader',()=>{
  const start=battle({weapons:[
    {name:'Balistus Grenade Launcher',quantity:2},
    {name:'Guardian Spear',quantity:2}
  ]});
  start.units[0].metadata.modelCount=2;
  start.units[0].currentStrength=2;
  start.units[0].startingStrength=2;
  start.units[0].wounds=12;
  start.units[0].startingWounds=12;
  start.armyRosters.p1.units[0].modelCount=2;
  const opportunity=getUnleashTheLionsOpportunities(start,{playerId:'p1'})[0];
  assert.equal(opportunity.modelCount,2);
  assert.equal(opportunity.available,true);
  const result=recordCustodesDetachmentStratagemUse(start,{
    ...command,woundsByModel:[6,4]
  });
  assert.deepEqual(result.units.map(unit=>unit.wounds),[6,4]);
  assert.equal(result.units.length,2);
  assert.equal(result.commandPoints.p1,1);
  assert.ok(result.units.every(unit=>unit.metadata.splitOriginId==='p1:u1'));
});

test('single remaining Allarus without a Leader cannot use Unleash the Lions',()=>{
  const start=battle();
  start.units[0].currentStrength=1;
  start.units[0].metadata.currentModelCount=1;
  const [opportunity]=getUnleashTheLionsOpportunities(start,{playerId:'p1'});
  assert.equal(opportunity.available,false);
  assert.match(opportunity.blockedReason,/at least two surviving models/);
  assert.throws(()=>recordCustodesDetachmentStratagemUse(start,{
    ...command,woundsByModel:[6]
  }),/at least two surviving models/);
  assert.equal(start.commandPoints.p1,2);
});
