import test from 'node:test';
import assert from 'node:assert/strict';
import { ADEPTUS_CUSTODES_DATASHEET_DETAILS } from '../../src/data/adeptus-custodes-datasheet-details.js';
import { recordCustodesDetachmentStratagemUse } from '../../src/engine/custodes-detachment-stratagem-transitions.js';
import { getUnleashTheLionsOpportunities } from '../../src/rules/custodes-detachment-stratagem-opportunities.js';
import { getLiveUnitVitals } from '../../src/rules/live-unit-vitals.js';
import { getDatasheetWeaponOptions } from '../../src/rules/saved-roster-combat-profile.js';
import { renderCustodesDetachmentStratagemControls } from '../../src/ui/custodes-detachment-stratagem-controls.js';
import { renderPhaseArmyRoster } from '../../src/ui/phase-army-roster.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';

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
