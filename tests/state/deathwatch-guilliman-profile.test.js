import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';
import { getBattleUnitDatasheet } from '../../src/rules/battle-unit-reference.js';
import { getDatasheetWeaponOptions } from '../../src/rules/saved-roster-combat-profile.js';
import { getRecordedCombatRules } from '../../src/rules/recorded-combat-rules.js';
import { applyRecordedCombatEffects } from '../../src/rules/contextual-datasheet-effects.js';
import { getActiveSpaceMarineUnitDoctrines } from '../../src/rules/space-marine-doctrines.js';
import { buildManualWargearLoadout } from '../../src/rules/wargear-loadout-validation.js';

const importList = extra => importWarhammerAppRoster({
  faction:'Space Marines',name:'Jared',id:'jared',
  text:'Space Marines\nALLIED UNITS\nFaction: Deathwatch\nDeathwatch Terminator Squad (190 Points)\n'+extra
}).roster;
const battle = roster => ({
  armyRosters:{jared:roster},history:[],phase:'shooting',turn:1,
  units:[{id:'dw',name:'Deathwatch Terminator Squad',ownerId:'jared',status:'deployed',
    position:{x:10,y:10},metadata:{rosterUnitId:roster.units[0].id}}]
});

test('Deathwatch ally imports a distinct current profile and only equipped weapons',()=>{
  const roster=importList('  • 5x Storm Bolter\n  • 5x Power Fist\n');
  const unit=roster.units[0],state=battle(roster);
  assert.equal(unit.datasheetId,'deathwatch:deathwatch-terminator-squad');
  assert.equal(unit.factionTag,'Deathwatch');
  assert.equal(getBattleUnitDatasheet(state,state.units[0]).characteristics.Toughness,'6');
  assert.deepEqual(getDatasheetWeaponOptions(state,state.units[0],{type:'ranged'}).map(w=>w.name),['Storm Bolter']);
  assert.deepEqual(getDatasheetWeaponOptions(state,state.units[0],{type:'melee'}).map(w=>w.name),['Power Fist']);
  assert.equal(getDatasheetWeaponOptions(state,state.units[0],{type:'ranged'})[0].characteristics.attacks,10);
  assert.equal(findArmyUnitCandidates({faction:'Space Marines',query:'Deathwatch Terminator'}).length,0);
});

test('unseen Deathwatch equipment stays unknown and alternate modes map only from their equipment',()=>{
  const unknown=importList(''),state=battle(unknown);
  assert.deepEqual(getDatasheetWeaponOptions(state,state.units[0],{type:'ranged'}),[]);
  assert.deepEqual(getDatasheetWeaponOptions(state,state.units[0],{type:'melee'}),[]);
  const roster=importList('  • 1x Cyclone Missile Launcher and Storm Bolter\n  • 1x Plasma Cannon\n  • 3x Storm Bolter\n  • 5x Power Fist\n');
  const guns=getDatasheetWeaponOptions(battle(roster),battle(roster).units[0],{type:'ranged'});
  assert.ok(guns.some(w=>w.name==='Cyclone Missile Launcher - Frag'));
  assert.ok(guns.some(w=>w.name==='Cyclone Missile Launcher - Krak'));
  assert.ok(guns.some(w=>w.name==='Plasma Cannon - Supercharge'));
  assert.equal(guns.some(w=>w.name==='Assault Cannon'),false);
});

test('Guilliman has Feel No Pain 5+, his own doctrines, and an exact 6-inch attack aura',()=>{
  const guilliman=findArmyUnitCandidates({faction:'Space Marines',query:'Roboute Guilliman'})[0];
  const intercessor=findArmyUnitCandidates({faction:'Space Marines',query:'Intercessor Squad'})
    .find(u=>u.name==='Intercessor Squad');
  assert.ok(guilliman?.datasheet&&intercessor?.datasheet);
  const roster={faction:'Space Marines',units:[
    {...guilliman,id:'g',datasheetId:guilliman.id},
    {...intercessor,id:'i',datasheetId:intercessor.id}
  ]};
  const g={id:'g',ownerId:'marines',status:'deployed',position:{x:10,y:10},metadata:{rosterUnitId:'g'}};
  const i={id:'i',ownerId:'marines',status:'deployed',position:{x:15,y:10},metadata:{rosterUnitId:'i'}};
  const state={armyRosters:{marines:roster},units:[g,i],history:[],phase:'shooting',turn:1};
  assert.equal(getRecordedCombatRules(state,g).feelNoPain,5);
  assert.deepEqual(getActiveSpaceMarineUnitDoctrines(state,g),['assault','devastator','tactical']);
  assert.ok(getRecordedCombatRules(state,i).effects.includes('marine-primarch-xiii-aura'));
  const profile=applyRecordedCombatEffects({
    attacker:{combatRules:getRecordedCombatRules(state,i)},
    target:{keywords:['infantry'],combatRules:{effects:[]}},
    profile:{ap:0,weaponType:'ranged',hitReroll:'none',woundReroll:'none',strength:5,toughness:5}
  });
  assert.equal(profile.hitReroll,'ones');
  assert.equal(profile.woundReroll,'ones');
  i.position={x:17,y:10};
  assert.equal(getRecordedCombatRules(state,i).effects.includes('marine-primarch-xiii-aura'),false);
});

test('Deathwatch builder offers legal model loadouts and limits heavy weapons',()=>{
  const candidate=findArmyUnitCandidates({faction:'Deathwatch',query:'Deathwatch Terminator Squad'})[0];
  assert.ok(candidate?.datasheet);
  const unit={...candidate,datasheetId:candidate.id,modelCount:5};
  const legal=buildManualWargearLoadout(unit,[
    {name:'Storm Bolter and Power Fist',quantity:4},
    {name:'Assault Cannon and Power Fist',quantity:1}
  ]);
  assert.equal(legal.loadoutValidation.status,'rules-reviewed-valid');
  const illegal=buildManualWargearLoadout(unit,[
    {name:'Storm Bolter and Power Fist',quantity:1},
    {name:'Assault Cannon and Power Fist',quantity:4}
  ]);
  assert.equal(illegal.loadoutValidation.status,'rules-invalid');
});
