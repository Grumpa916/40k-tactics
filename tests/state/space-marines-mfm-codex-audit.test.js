import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { SPACE_MARINES_MFM_PRICE_OPTIONS, SPACE_MARINES_MFM_PRICE_SOURCES } from '../../src/data/space-marines-mfm-price-options.js';
import { SPACE_MARINES_CODEX_CHARACTERISTIC_CORRECTIONS } from '../../src/data/space-marines-codex-characteristics.js';
import { getBuilderModelCounts, resolveBuilderUnitCost } from '../../src/rules/army-builder-cost.js';
import { renderWargearEditor } from '../../src/ui/army-wargear-editor.js';
import { getRulesDataRevisionForFaction } from '../../src/data/rules-data-revisions.js';
import { assessRosterRulesData } from '../../src/rules/roster-rules-data-validation.js';

function unit(name,id,modelCount){
 const candidate=findArmyUnitCandidates({faction:'Space Marines'}).find(item=>item.name===name);
 assert.ok(candidate,'missing catalog: '+name);
 return {...candidate,id:id??name,datasheetId:candidate.id,modelCount:modelCount??candidate.defaultModelCount};
}
function cost(u,roster){return resolveBuilderUnitCost(u,roster).points;}

test('October MFM cross-check includes sourced size and copy-tier selections',()=>{
 assert.ok(Object.keys(SPACE_MARINES_MFM_PRICE_OPTIONS).length>=25);
 assert.equal(SPACE_MARINES_MFM_PRICE_SOURCES.applicableMfmPublicationDate,'2026-10-14');
 assert.equal(SPACE_MARINES_MFM_PRICE_SOURCES.officialPdfCurrentContentsIndependentlyChecked,false);
 for(const [name,options] of Object.entries(SPACE_MARINES_MFM_PRICE_OPTIONS)){
   assert.ok(options.length>0,name);
   const c=unit(name);
   assert.deepEqual(c.pointsOptions,options,name);
   assert.equal(c.officialRulesCrossCheck,'pending');
   assert.equal(c.selectableWargearCoverage,'not-fully-reviewed');
   assert.match(c.pointsSourceUrl,/warpnexus/);
   assert.ok(options.some(x=>x.models===c.defaultModelCount && x.points===c.defaultPoints));
 }
});

test('Army Builder exposes correct infantry alternative model counts',()=>{
 assert.deepEqual(getBuilderModelCounts(unit('Intercessor Squad')),[5,10]);
 assert.deepEqual(getBuilderModelCounts(unit('Hellblaster Squad')),[5,10]);
 assert.deepEqual(getBuilderModelCounts(unit('Bladeguard Veteran Squad')),[3,6]);
 assert.deepEqual(getBuilderModelCounts(unit('Aggressor Squad')),[3,6]);
 assert.deepEqual(getBuilderModelCounts(unit('Eradicator Squad with Heavy Bolters')),[3,6]);
 assert.deepEqual(getBuilderModelCounts(unit('Terminator Squad')),[5,10]);
 const intercessors=unit('Intercessor Squad','a',10);
 assert.equal(cost(intercessors,{units:[intercessors]}),170);
 const terminators=unit('Terminator Squad','b',10);
 assert.equal(cost(terminators,{units:[terminators]}),380);
});

test('October MFM additional-copy prices resolve for multi-size infantry and dreadnoughts',()=>{
 const first=unit('Aggressor Squad','a',3),second=unit('Aggressor Squad','b',6),third=unit('Aggressor Squad','c',6);
 const roster={units:[first,second,third]};
 assert.deepEqual([cost(first,roster),cost(second,roster),cost(third,roster)],[90,180,190]);
 const e1=unit('Eradicator Squad with Melta Rifles','e1',3);
 const e2=unit('Eradicator Squad with Melta Rifles','e2',6);
 const e3=unit('Eradicator Squad with Melta Rifles','e3',6);
 const erads={units:[e1,e2,e3]};
 assert.deepEqual([cost(e1,erads),cost(e2,erads),cost(e3,erads)],[100,200,220]);
 const l1=unit('Land Raider','l1'),l2=unit('Land Raider','l2');
 assert.deepEqual([cost(l1,{units:[l1,l2]}),cost(l2,{units:[l1,l2]})],[245,265]);
 const d1=unit('Redemptor Dreadnought','d1'),d2=unit('Redemptor Dreadnought','d2'),d3=unit('Redemptor Dreadnought','d3');
 assert.deepEqual([cost(d1,{units:[d1,d2,d3]}),cost(d2,{units:[d1,d2,d3]}),cost(d3,{units:[d1,d2,d3]})],[170,170,190]);
});

test('stale default points from prior Space Marine App export are corrected without mutating saved lists',()=>{
 const repulsor=unit('Repulsor Executioner','re');
 assert.equal(repulsor.defaultPoints,260);
 assert.equal(cost(repulsor,{units:[repulsor]}),260);
 const oldSaved={...repulsor,points:270};
 assert.equal(oldSaved.points,270,'catalog update must not mutate a saved roster');
});

test('official GW Codex characteristics correct 15 Tacticus, Terminator and Phobos records',()=>{
 assert.equal(Object.keys(SPACE_MARINES_CODEX_CHARACTERISTIC_CORRECTIONS).length,15);
 for(const name of ['Intercessor Squad','Assault Intercessor Squad','Hellblaster Squad','Infernus Squad']){
   assert.equal(unit(name).datasheet.characteristics.Toughness,'5',name);
 }
 for(const name of ['Terminator Squad','Terminator Assault Squad']){
   assert.equal(unit(name).datasheet.characteristics.Toughness,'6',name);
 }
 for(const name of ['Incursor Squad','Infiltrator Squad','Reiver Squad','Eliminator Squad']){
   const stats=unit(name).datasheet.characteristics;
   assert.equal(stats.Move,'8"',name);
   assert.equal(stats.Toughness,'4',name);
 }
 assert.equal(unit('Aggressor Squad').datasheet.characteristics.Toughness,'6');
});

test('Space Marines wargear remains flagged as unverified instead of displaying misleading choices',()=>{
 const unresolved=unit('Hellblaster Squad');
 const html=renderWargearEditor(unresolved);
 assert.match(html,/Space Marines wargear review pending/);
 assert.match(html,/possible weapon profiles, not a confirmed equipped loadout/);
 assert.doesNotMatch(html,/data-wargear-choice=/);
 const reviewed=renderWargearEditor(unit('Aggressor Squad'));
 assert.match(reviewed,/Reviewed 11th-edition loadout subset/);
 assert.match(reviewed,/data-wargear-baseline/);
 assert.match(reviewed,/Flamestorm Gauntlets/);
 const rev=getRulesDataRevisionForFaction('Space Marines');
 assert.equal(rev.catalog.revision,'2026-11-03.3');
 assert.equal(rev.officialRevisionCheck.status,'pending-current-official-profile-and-points-comparison');
 assert.equal(rev.points.revisionLabel,'export points; official MFM cross-check pending');
 const past={...rev,revisionId:'space-marines-11e-faction-pack-2026-06-catalog-2026-10-23',catalog:{...rev.catalog,revision:'2026-10-23.1'}};
 const assessment=assessRosterRulesData({faction:'Space Marines',rulesDataRevision:past,units:[]});
 assert.equal(assessment.status,'review-required');
});
