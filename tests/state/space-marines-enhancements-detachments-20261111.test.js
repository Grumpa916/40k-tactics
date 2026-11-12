import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { SPACE_MARINES_CURRENT_11E_DETACHMENTS,
  SPACE_MARINES_CURRENT_DETACHMENT_INDEX,
  SPACE_MARINES_EXPLICIT_LEGENDS_DETACHMENTS } from '../../src/data/space-marines-current-detachments.js';
import { SPACE_MARINES_DETACHMENTS } from '../../src/data/space-marines-rules.js';
import { SPACE_MARINES_CURRENT_ENHANCEMENTS } from '../../src/data/space-marines-enhancements.js';
import { renderUnitUpgradeEditor } from '../../src/ui/army-unit-upgrade-editor.js';
import { detachmentOptions,renderDetachmentChecklist } from '../../src/ui/army-builder-options.js';
import { assessRosterDetachmentSelection } from '../../src/rules/roster-detachment-selection.js';
import { getUnitUpgradeCost,validateRosterUnitUpgrades } from '../../src/rules/custodes-unit-upgrades.js';
import { getEligibleSpaceMarineEnhancements,
  getSpaceMarineEnhancementDefinition,setSpaceMarineEnhancement,
  validateSpaceMarineEnhancements } from '../../src/rules/space-marines-enhancements.js';
import { assessSavedUnitCost } from '../../src/rules/roster-rules-data-validation.js';

const candidates=findArmyUnitCandidates({faction:'Space Marines'});
let serial=0;
const unit=(name)=>{
 const source=candidates.find(x=>x.name===name&&!x.legends);
 assert.ok(source,'missing '+name);
 return {id:'r-'+(++serial),datasheetId:source.id,name,modelCount:source.defaultModelCount,
    datasheet:source.datasheet,pointsOptions:source.pointsOptions,points:source.defaultPoints,
    equippedWargear:[],unitUpgrades:[]};
};
const army=(detachments,units=[],pointsLimit=2000)=>({
 faction:'Space Marines',pointsLimit,detachments,detachment:detachments[0]??null,units
});
const enh=(detachment,name)=>SPACE_MARINES_CURRENT_ENHANCEMENTS.find(x=>x.detachment===detachment&&x.name===name);

test('16 current Space Marine detachments are separated from 11 historically Legends choices',()=>{
 assert.equal(SPACE_MARINES_CURRENT_11E_DETACHMENTS.length,16);
 assert.equal(SPACE_MARINES_CURRENT_DETACHMENT_INDEX.currentCount,16);
 assert.equal(SPACE_MARINES_EXPLICIT_LEGENDS_DETACHMENTS.length,11);
 assert.equal(new Set(SPACE_MARINES_CURRENT_11E_DETACHMENTS.map(x=>x.name)).size,16);
 assert.equal(SPACE_MARINES_DETACHMENTS.length,35);
 assert.equal(SPACE_MARINES_DETACHMENTS.filter(x=>x.category==='current-codex').length,16);
 const gladius=SPACE_MARINES_DETACHMENTS.find(x=>x.name==='Gladius Task Force');
 const iron=SPACE_MARINES_DETACHMENTS.find(x=>x.name==='Ironstorm Spearhead');
 const storm=SPACE_MARINES_DETACHMENTS.find(x=>x.name==='Stormlance Task Force');
 assert.equal(gladius.detachmentPoints,3);
 assert.deepEqual(gladius.forceDispositionOptions,['Priority Assets','Take and Hold']);
 assert.equal(iron.detachmentPoints,1);
 assert.equal(storm.detachmentPoints,1);
 assert.equal(storm.forceDisposition,'Reconnaissance');
 assert.ok(SPACE_MARINES_DETACHMENTS.find(x=>x.name==='Armoured Speartip').legends);
 assert.equal(SPACE_MARINES_DETACHMENTS.find(x=>x.name==='Blade of Ultramar').category,'chapter-supplement-unverified');
 assert.equal(SPACE_MARINES_CURRENT_DETACHMENT_INDEX.officialCurrentMfmDetachmentPointsDirectlyVerified,false);
});

test('current Space Marine detachment chooser puts current Codex first and cannot newly select an explicit Legend',()=>{
 const options=detachmentOptions('Space Marines');
 assert.ok(options.indexOf('Gladius Task Force')<options.indexOf('Armoured Speartip'));
 assert.match(options, /value="Armoured Speartip" disabled/);
 const saved=renderDetachmentChecklist('Space Marines',['Armoured Speartip']);
 assert.match(saved,/value="Armoured Speartip" checked/);
 assert.match(saved,/Legends \(not current matched play\)/);
 assert.match(renderDetachmentChecklist('Space Marines',['Gladius Task Force']),/Codex Discipline/);
 assert.match(renderDetachmentChecklist('Space Marines',['Terminator Storm Force']),/Death Blow/);
});

test('brethren detachments share the Doctrines unique tag and cannot both be selected',()=>{
 const a=assessRosterDetachmentSelection('Space Marines',['Assault Brethren','Devastator Brethren']);
 assert.equal(a.status,'invalid');
 assert.match(a.issues.join(' '),/Doctrines detachment/);
 const b=assessRosterDetachmentSelection('Space Marines',['Gladius Task Force']);
 assert.equal(b.status,'valid');
});

test('33 current enhancement records cover 16 detachments and never claim direct GW MFM certification',()=>{
 assert.equal(SPACE_MARINES_CURRENT_ENHANCEMENTS.length,33);
 const unique=new Set(SPACE_MARINES_CURRENT_ENHANCEMENTS.map(e=>e.id));
 assert.equal(unique.size,33);
 for(const e of SPACE_MARINES_CURRENT_ENHANCEMENTS){
   assert.ok(SPACE_MARINES_CURRENT_11E_DETACHMENTS.some(d=>d.name===e.detachment),e.detachment);
   assert.ok(Number.isFinite(e.points)&&e.points>=10,e.name);
   assert.match(e.verificationStatus,/official-mfm-pending/);
 }
 assert.notEqual(enh('Phobos Shadow Force','Venator Omni-auspex').id,
                 enh('Phobos Shock Force','Venator Omni-auspex').id);
});

test('standard enhancements require eligible non-Epic Hero Characters; unit Upgrades can go on valid Dreadnoughts',()=>{
 const captain=unit('Captain'),calgar=unit('Marneus Calgar'),dread=unit('Ballistus Dreadnought'),ancient=unit('Ancient');
 const gladius=army(['Gladius Task Force'],[captain,calgar,ancient]);
 assert.ok(getEligibleSpaceMarineEnhancements(captain,gladius).some(x=>x.name==='Laurels of Triumph'));
 assert.equal(getEligibleSpaceMarineEnhancements(calgar,gladius).length,0);
 assert.ok(getEligibleSpaceMarineEnhancements(ancient,gladius).some(x=>x.name==='Standard of the Emperor Ascendant'));
 assert.equal(getEligibleSpaceMarineEnhancements(dread,gladius).length,0);
 const ironclad=army(['Ironclad Champions'],[dread]);
 const choices=getEligibleSpaceMarineEnhancements(dread,ironclad);
 assert.deepEqual(choices.map(x=>x.name),['Artificer Sarcophagus','Venerable Champion (Aura)']);
});

test('enhancement costs persist on the correct unit and saved-price validation still uses base points',()=>{
 const captain=unit('Captain'),r=army(['Gladius Task Force'],[captain]);
 const def=enh('Gladius Task Force','Laurels of Triumph');
 const updated=setSpaceMarineEnhancement(r,captain.id,def.id);
 assert.equal(updated.units[0].basePoints,captain.points);
 assert.equal(updated.units[0].points,captain.points+20);
 assert.equal(updated.units[0].unitUpgrades[0].id,def.id);
 assert.equal(getUnitUpgradeCost(updated.units[0]),20);
 assert.deepEqual(validateRosterUnitUpgrades(updated),[]);
 const source=candidates.find(x=>x.id===captain.datasheetId);
 assert.equal(assessSavedUnitCost(source,updated.units[0],updated).status,'matched');
 const cleared=setSpaceMarineEnhancement(updated,captain.id,'');
 assert.equal(cleared.units[0].points,captain.points);
 assert.deepEqual(cleared.units[0].unitUpgrades,[]);
 assert.equal(captain.points,90,'original saved unit has not changed');
});

test('Incursion caps at two enhancements; ordinary enhancements are unique',()=>{
 const units=[unit('Captain'),unit('Captain'),unit('Lieutenant')];
 let r=army(['Gladius Task Force'],units,1000);
 r=setSpaceMarineEnhancement(r,units[0].id,enh('Gladius Task Force','Adept of the Codex').id);
 r=setSpaceMarineEnhancement(r,units[1].id,enh('Gladius Task Force','Laurels of Triumph').id);
 assert.throws(()=>setSpaceMarineEnhancement(r,units[2].id,enh('Gladius Task Force','Artificer Armour').id),/Enhancement limit/);
 assert.throws(()=>setSpaceMarineEnhancement(r,units[2].id,enh('Gladius Task Force','Adept of the Codex').id),/maximum 1 copy/);
});

test('Ironclad unit Upgrades allow three copies; fourth fails, and extra copies count once towards cap',()=>{
 const units=Array.from({length:4},()=>unit('Ballistus Dreadnought'));
 let r=army(['Ironclad Champions'],units,1000);
 const def=enh('Ironclad Champions','Artificer Sarcophagus');
 for(let i=0;i<3;i++)r=setSpaceMarineEnhancement(r,units[i].id,def.id);
 assert.equal(r.units.filter(u=>u.unitUpgrades.length).length,3);
 assert.deepEqual(validateSpaceMarineEnhancements(r),[]);
 assert.throws(()=>setSpaceMarineEnhancement(r,units[3].id,def.id),/maximum 3 copies/);
});

test('attached unit with two enhancements and detachment changes are rejected',()=>{
 const u1=unit('Captain'),u2=unit('Ancient');
 let r=army(['Gladius Task Force'],[u1,u2]);
 r=setSpaceMarineEnhancement(r,u1.id,enh('Gladius Task Force','Adept of the Codex').id);
 r=setSpaceMarineEnhancement(r,u2.id,enh('Gladius Task Force','Standard of the Emperor Ascendant').id);
 const grouped={...r,units:r.units.map((u,i)=>i===0?{...u,attachedToBodyguardId:u2.id}:u)};
 assert.match(validateSpaceMarineEnhancements(grouped).join(' '),/attached Space Marines unit/);
 const switched={...r,detachments:['Ironstorm Spearhead'],detachment:'Ironstorm Spearhead'};
 assert.match(validateSpaceMarineEnhancements(switched).join(' '),/requires Gladius Task Force/);
});

test('enhancement editor is touch-friendly, sources specific detachment costs and preserves shared names',()=>{
 const u=unit('Captain in Phobos Armour'),r=army(['Phobos Shock Force','Phobos Shadow Force'],[u]);
 const html=renderUnitUpgradeEditor(u,r);
 assert.match(html,/min-height:44px/);
 assert.match(html,/Seal of Shrouding/);
 assert.match(html,/Venator Omni-auspex/);
 assert.ok((html.match(/Venator Omni-auspex/g)??[]).length===2);
 assert.match(html,/official October MFM check pending/);
 const defs=SPACE_MARINES_CURRENT_ENHANCEMENTS.filter(x=>x.name==='Venator Omni-auspex');
 assert.equal(getSpaceMarineEnhancementDefinition({name:'Venator Omni-auspex'}),null,'unqualified duplicate must not silently select');
 assert.notEqual(defs[0].id,defs[1].id);
});
