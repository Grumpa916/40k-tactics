import test from 'node:test';
import assert from 'node:assert/strict';
import { SPACE_MARINES_STRATAGEM_CATALOG,SPACE_MARINES_STRATAGEMS_BY_DETACHMENT } from '../../src/data/space-marines-stratagems.js';
import {SPACE_MARINES_DETACHMENTS} from '../../src/data/space-marines-rules.js';
import {SPACE_MARINES_OCTOBER_GW_ERRATA} from '../../src/data/space-marines-october-official-errata.js';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import { renderSpaceMarineDoctrinePanel } from '../../src/ui/space-marine-doctrines-panel.js';
import { renderSpaceMarineStratagemOpportunities } from '../../src/ui/space-marine-stratagem-controls.js';
import {
  recordSpaceMarineDoctrineUse,getSpaceMarineDoctrineUses,getSpaceMarineDoctrineRemaining,
  getActiveSpaceMarineUnitDoctrines,getActiveSpaceMarineDoctrine
} from '../../src/rules/space-marine-doctrines.js';
import {getDatasheetWeaponOptions,getProbabilisticUnitProfile} from '../../src/rules/saved-roster-combat-profile.js';
import {getSelectedUnitActiveStatuses} from '../../src/rules/unit-active-statuses.js';

const candidates=findArmyUnitCandidates({faction:'Space Marines'});
const unit=(name='Captain',id='u1')=>{
 const c=candidates.find(x=>x.name===name&&!x.legends);
 assert.ok(c,name);
 return {
  saved:{id:'r-'+id,name:c.name,datasheetId:c.id,datasheet:c.datasheet,modelCount:c.defaultModelCount,
   loadoutValidation:{status:'rules-reviewed-valid'},unitUpgrades:[]},
  live:{id,name:c.name,ownerId:'p1',status:'deployed',currentStrength:c.defaultModelCount,
   metadata:{rosterUnitId:'r-'+id,modelCount:c.defaultModelCount},position:{x:20,y:20}}
 };
};
const state=(detachment='Gladius Task Force',character='Captain')=>{
 const u=unit(character);
 return {phase:'command',turn:1,activePlayer:'p1',
  battle:{status:'active',round:1,activePlayerId:'p1'},
  players:[{id:'p1',name:'Marines'},{id:'p2',name:'Opponent'}],
  commandPoints:{p1:5,p2:5},history:[],units:[u.live],
  armyRosters:{p1:{faction:'Space Marines',detachments:[detachment],units:[u.saved]},
   p2:{faction:'Tyranids',detachments:['Invasion Fleet'],units:[]}}};
};

test('52 11th-edition Stratagem references cover all 16 current Space Marine detachments',()=>{
 assert.equal(SPACE_MARINES_STRATAGEM_CATALOG.length,52);
 assert.equal(Object.keys(SPACE_MARINES_STRATAGEMS_BY_DETACHMENT).length,16);
 assert.equal(new Set(SPACE_MARINES_STRATAGEM_CATALOG.map(x=>x.id)).size,52);
 for(const detachment of SPACE_MARINES_DETACHMENTS.filter(x=>x.category==='current-codex')){
  assert.ok((detachment.stratagems??[]).length>=3,detachment.name);
  assert.equal(detachment.stratagemCatalogStatus,'independently-reviewed-current-11e');
 }
 for(const def of SPACE_MARINES_STRATAGEM_CATALOG){
  assert.ok([1,2].includes(def.cpCost),def.id);
  assert.ok(def.phases.length>0 && ['own','opponent','either'].includes(def.turn),def.id);
  assert.ok(def.requiresManualTabletopConfirmation);
 }
});

test('Army-wide Doctrine records a Command event, displays active badges, and does not consume other choices',()=>{
 let s=state();
 s=recordSpaceMarineDoctrineUse(s,{playerId:'p1',doctrine:'devastator'});
 assert.equal(getSpaceMarineDoctrineUses(s,'p1').devastator,1);
 assert.equal(getActiveSpaceMarineDoctrine(s,'p1'),'devastator');
 assert.deepEqual(getActiveSpaceMarineUnitDoctrines(s,'u1'),['devastator']);
 const options=getDatasheetWeaponOptions(s,s.units[0],{type:'ranged'});
 assert.ok(options.length>0);
 assert.ok(options.every(x=>x.characteristics.assault===true));
 assert.match(getSelectedUnitActiveStatuses(s,'u1').map(x=>x.label).join(' '),/Devastator Doctrine/);
 assert.throws(()=>recordSpaceMarineDoctrineUse(s,{playerId:'p1',doctrine:'assault'}),/already chosen/);
 assert.equal(getSpaceMarineDoctrineRemaining(s,'p1').find(x=>x.id==='devastator').available,true,
  'Gladius permits an extra doctrine use.');
 const opponent={...s,activePlayer:'p2',battle:{...s.battle,activePlayerId:'p2'},turn:2,phase:'shooting'};
 assert.deepEqual(getActiveSpaceMarineUnitDoctrines(opponent,'u1'),['devastator']);
 const next={...s,turn:3,phase:'command'};
 assert.equal(getActiveSpaceMarineDoctrine(next,'p1'),null);
});

test('Brethren can repeat their own Doctrine only; normal armies cannot exceed single use',()=>{
 let s=state('Assault Brethren');
 s=recordSpaceMarineDoctrineUse(s,{playerId:'p1',doctrine:'assault'});
 assert.ok(getSpaceMarineDoctrineRemaining(s,'p1').find(x=>x.id==='assault').available);
 s={...s,turn:3,phase:'command'};
 s=recordSpaceMarineDoctrineUse(s,{playerId:'p1',doctrine:'assault'});
 assert.equal(getSpaceMarineDoctrineUses(s,'p1').assault,2);
 assert.equal(getSpaceMarineDoctrineRemaining(s,'p1').find(x=>x.id==='assault').available,false);
 assert.throws(()=>recordSpaceMarineDoctrineUse({...s,turn:5}, {playerId:'p1',doctrine:'assault'}),/use limit/);
 let normal=state('Ironstorm Spearhead');
 normal=recordSpaceMarineDoctrineUse(normal,{playerId:'p1',doctrine:'tactical'});
 assert.equal(getSpaceMarineDoctrineRemaining(normal,'p1').find(x=>x.id==='tactical').available,false);
});

test('Unit-only Captain Strategic Acumen does not consume army uses; unsupported selections fail',()=>{
 let s=state();
 s=recordSpaceMarineDoctrineUse(s,{playerId:'p1',doctrine:'assault',scope:'unit',unitId:'u1',source:'captain'});
 assert.deepEqual(getActiveSpaceMarineUnitDoctrines(s,'u1'),['assault']);
 assert.equal(getSpaceMarineDoctrineUses(s,'p1').assault,0);
 assert.throws(()=>recordSpaceMarineDoctrineUse(s,{playerId:'p1',doctrine:'tactical',scope:'unit',unitId:'u1',source:'captain'}),/already recorded/);
 const other=state('Ironstorm Spearhead','Intercessor Squad');
 assert.throws(()=>recordSpaceMarineDoctrineUse(other,{playerId:'p1',doctrine:'tactical',scope:'unit',unitId:'u1',source:'captain'}),/Strategic Acumen/);
});

test('Army doctrine panel supplies 44px buttons and shows doctrine statuses for selected unit',()=>{
 let s=state();
 const html=renderSpaceMarineDoctrinePanel(s,{playerId:'p1',unitId:'u1'});
 assert.match(html,/Assault Doctrine/);
 assert.match(html,/Activate for Army/);
 assert.match(html,/Captain: apply to selected unit/);
 assert.match(html,/min-height:44px/);
 s=recordSpaceMarineDoctrineUse(s,{playerId:'p1',doctrine:'devastator'});
 assert.match(renderSpaceMarineDoctrinePanel(s,{playerId:'p1',unitId:'u1'}),/Selected unit active:/);
});

test('Marine Stratagem opportunity UI requires tabletop confirmation and selects a real unit',()=>{
 const s=state('Gladius Task Force');
 s.phase='shooting';
 const html=renderSpaceMarineStratagemOpportunities(s,{playerId:'p1',unitId:'u1',livePanel:true});
 assert.match(html,/Storm of Devastation/);
 assert.match(html,/data-marine-trigger-confirmed/);
 assert.match(html,/data-marine-stratagem-use/);
 assert.match(html,/min-height:44px/);
 assert.doesNotMatch(html,/Deathwatch Support/);
});

test('Five GW October printed updates are recorded without claiming full paid Codex certification',()=>{
 assert.equal(SPACE_MARINES_OCTOBER_GW_ERRATA.updates.length,5);
 assert.equal(SPACE_MARINES_OCTOBER_GW_ERRATA.completePrintedCodexVerified,false);
 assert.equal(SPACE_MARINES_OCTOBER_GW_ERRATA.officialPdfPageImagesChecked,true);
 const name=n=>candidates.find(c=>c.name===n&&!c.legends)?.datasheet;
 assert.ok(name('Kayvaan Shrike').keywords.includes('Epic Hero') || name('Kayvaan Shrike').keywords.includes('EPIC HERO'));
 assert.ok(name('Librarian in Terminator Armour').keywords.some(x=>x.toLowerCase()==='character'));
 assert.doesNotMatch(name('Captain Titus').abilities.find(x=>x.name==='Righteous Fury').description,/once per battle/i);
 assert.match(name('Iron Father Feirros').abilities.find(x=>x.name==='Iron Father').description,/this model/i);
 assert.match(name('Techmarine').abilities.find(x=>x.name==='Techmarine').description,/this model/i);
});
