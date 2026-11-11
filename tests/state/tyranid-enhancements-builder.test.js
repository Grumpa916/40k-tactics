import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { TYRANID_ENHANCEMENTS, TYRANID_ENHANCEMENTS_BY_DETACHMENT } from '../../src/data/tyranid-enhancements.js';
import {
  getEligibleTyranidEnhancements, isEligibleTyranidEnhancementBearer,
  getTyranidEnhancementCost, setTyranidEnhancement,validateTyranidRosterEnhancements
} from '../../src/rules/tyranid-enhancements.js';
import { getUnitUpgradeCost,validateRosterUnitUpgrades } from '../../src/rules/custodes-unit-upgrades.js';
import { renderUnitUpgradeEditor } from '../../src/ui/army-unit-upgrade-editor.js';
import { assessSavedUnitCost } from '../../src/rules/roster-rules-data-validation.js';

const candidates=findArmyUnitCandidates({faction:'Tyranids'});
let nextId=0;
function unit(id,points){
 const candidate=candidates.find(x=>x.id==='tyranids:'+id);
 assert.ok(candidate,id);
 return {id:'unit-'+ ++nextId,datasheetId:candidate.id,name:candidate.name,
   modelCount:candidate.defaultModelCount,points:points??candidate.defaultPoints,
   datasheet:candidate.datasheet,pointsOptions:candidate.pointsOptions,
   equippedWargear:[],unitUpgrades:[]};
}
const roster=(detachments,units,pointsLimit=2000)=>({
 faction:'Tyranids',pointsLimit,detachments,detachment:detachments[0]??null,units
});

test('Tyranid enhancements index all 10 detachments and 30 enhancements + 4 Upgrades',()=>{
 assert.equal(TYRANID_ENHANCEMENTS.length,34);
 assert.equal(Object.keys(TYRANID_ENHANCEMENTS_BY_DETACHMENT).length,10);
 assert.equal(TYRANID_ENHANCEMENTS.filter(item=>item.upgrade).length,4);
 assert.equal(new Set(TYRANID_ENHANCEMENTS.map(item=>item.name)).size,34);
 for(const enhancement of TYRANID_ENHANCEMENTS){
   assert.ok(enhancement.points>=10&&enhancement.points<=30);
   assert.equal(enhancement.verificationStatus,'current-secondary-reference-official-october-mfm-pending');
 }
 assert.equal(TYRANID_ENHANCEMENTS.find(x=>x.name==='Synaptoprescience').points,30);
 assert.equal(TYRANID_ENHANCEMENTS.find(x=>x.name==='Hunting Grounds').points,30);
});

test('Norn upgrades are selected from Talons of the Norn Queen and included once in saved cost',()=>{
 const a=unit('norn-assimilator'),b=unit('norn-emissary');
 const r=roster(['Talons of the Norn Queen'],[a,b]);
 const eligibleA=getEligibleTyranidEnhancements(a,r).map(x=>x.name);
 assert.deepEqual(eligibleA,['Synaptoprescience']);
 const eligibleB=getEligibleTyranidEnhancements(b,r).map(x=>x.name);
 assert.deepEqual(eligibleB,['Destabilising Predation']);
 const upgraded=setTyranidEnhancement(r,a.id,'Synaptoprescience');
 const again=setTyranidEnhancement(upgraded,b.id,'Destabilising Predation');
 assert.equal(again.units[0].basePoints,250);
 assert.equal(again.units[0].points,280);
 assert.equal(again.units[1].points,270);
 assert.deepEqual(validateRosterUnitUpgrades(again),[]);
 assert.equal(getTyranidEnhancementCost(again.units[0]),30);
 assert.equal(getUnitUpgradeCost(again.units[0]),30);
 const assessed=assessSavedUnitCost(candidates.find(x=>x.id===a.datasheetId),again.units[0],again);
 assert.equal(assessed.status,'matched',assessed.reason);
});

test('Tyranid enhancements are character-limited except Upgrade and Epic Heroes never qualify',()=>{
 const neuro=unit('neurotyrant'),lict=unit('lictor'),swarmlord=unit('the-swarmlord');
 const base=roster(['Invasion Fleet','Ambush Predators'],[neuro,lict,swarmlord]);
 assert.ok(isEligibleTyranidEnhancementBearer(neuro,'Alien Cunning',base));
 assert.equal(isEligibleTyranidEnhancementBearer(lict,'Alien Cunning',base),false);
 assert.equal(isEligibleTyranidEnhancementBearer(swarmlord,'Alien Cunning',base),false);
 assert.ok(isEligibleTyranidEnhancementBearer(lict,'Encircling Horrors',base));
 assert.equal(isEligibleTyranidEnhancementBearer(neuro,'Encircling Horrors',base),false);
 const updated=setTyranidEnhancement(base,lict.id,'Encircling Horrors');
 assert.equal(updated.units[1].points,lict.points+20);
 assert.throws(()=>setTyranidEnhancement(base,lict.id,'Alien Cunning'),/ineligible bearer/);
});

test('up to three copies of the same Upgrade count as one enhancement for army cap',()=>{
 const units=Array.from({length:4},()=>unit('von-ryan-s-leapers'));
 let r=roster(['Ambush Predators'],units,1000);
 for(let i=0;i<3;i++)r=setTyranidEnhancement(r,units[i].id,'Cryptophotaic Camouflage');
 assert.equal(validateRosterUnitUpgrades(r).length,0);
 assert.equal(r.units.filter(x=>x.unitUpgrades.length).length,3);
 assert.throws(()=>setTyranidEnhancement(r,units[3].id,'Cryptophotaic Camouflage'),/maximum 3 per army/);
});

test('ordinary enhancements are unique and count toward the Incursion/Strike Force limit',()=>{
 const units=Array.from({length:4},()=>unit('neurotyrant'));
 let r=roster(['Invasion Fleet'],units,1000);
 r=setTyranidEnhancement(r,units[0].id,'Alien Cunning');
 r=setTyranidEnhancement(r,units[1].id,'Adaptive Biology');
 assert.throws(()=>setTyranidEnhancement(r,units[2].id,'Perfectly Adapted'),/exceeds 2/);
 assert.throws(()=>setTyranidEnhancement(r,units[3].id,'Alien Cunning'),/maximum 1 per army/);
});

test('Subterranean Assault explicitly designates up to two character Trygons',()=>{
 const units=[unit('trygon'),unit('trygon'),unit('trygon')];
 const r=roster(['Subterranean Assault'],units);
 assert.equal(isEligibleTyranidEnhancementBearer(units[0],'Trygon Prime',r),false);
 const designated=setTyranidEnhancement(r,units[0].id,'Trygon Prime',{subterraneanCharacter:true});
 assert.equal(designated.units[0].subterraneanCharacter,true);
 assert.equal(designated.units[0].points,units[0].points+20);
 const two=setTyranidEnhancement(designated,units[1].id,'',{subterraneanCharacter:true});
 assert.equal(validateTyranidRosterEnhancements(two).length,0);
 assert.throws(()=>setTyranidEnhancement(two,units[2].id,'',{subterraneanCharacter:true}),/at most two/);
});

test('enhancements forbidden if required detachment is removed or attached unit already upgraded',()=>{
 const n=unit('neurotyrant'),b=unit('von-ryan-s-leapers');
 let r=roster(['Invasion Fleet','Ambush Predators'],[n,b]);
 r=setTyranidEnhancement(r,n.id,'Adaptive Biology');
 r=setTyranidEnhancement(r,b.id,'Cryptophotaic Camouflage');
 const noDetachment={...r,detachments:['Invasion Fleet'],detachment:'Invasion Fleet'};
 assert.match(validateRosterUnitUpgrades(noDetachment).join(' '),/Ambush Predators/);
 const attached={...r,units:r.units.map((u,i)=>i===0?{...u,attachedToBodyguardId:b.id}:u)};
 assert.match(validateRosterUnitUpgrades(attached).join(' '),/attached unit cannot have two/);
});

test('Tyranid Army Builder renders enhancements and source transparency on an iPad-friendly control',()=>{
 const n=unit('norn-emissary');
 const r=roster(['Talons of the Norn Queen'],[n]);
 const html=renderUnitUpgradeEditor(n,r);
 assert.match(html,/data-unit-upgrade=/);
 assert.match(html,/Destabilising Predation/);
 assert.match(html,/\+20 pts/);
 assert.match(html,/min-height:44px/);
 assert.doesNotMatch(html,/Synaptoprescience/);
 const t=unit('trygon'),u=roster(['Subterranean Assault'],[t]);
 const trygonHtml=renderUnitUpgradeEditor(t,u);
 assert.match(trygonHtml,/data-tyranid-trygon-character/);
});
