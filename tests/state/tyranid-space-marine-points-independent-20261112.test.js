import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {
  TYRANID_FIRST_COPY_POINT_BENCHMARK, SPACE_MARINE_FIRST_COPY_POINT_BENCHMARK,
  PRICE_RECONCILIATION_SOURCES
} from '../../src/data/mfm-points-independent-reconciliation-20261112.js';
import {auditIndependentFirstCopyPoints} from '../../src/rules/mfm-points-independent-audit.js';
import {resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {TYRANID_ENHANCEMENTS} from '../../src/data/tyranid-enhancements.js';
import {SPACE_MARINES_CURRENT_ENHANCEMENTS} from '../../src/data/space-marines-enhancements.js';

const catalog=faction=>findArmyUnitCandidates({faction});
const unit=(faction,name,models,id='test-1',selections=[])=>{
  const source=catalog(faction).find(x=>x.name.toLowerCase()===name.toLowerCase());
  assert.ok(source,'Missing local '+faction+': '+name);
  return {id,datasheetId:source.id,name:source.name,modelCount:models,
    pointsOptions:source.pointsOptions,equippedWargear:selections};
};
const choose=(faction,name,models,ordinal=1,selections=[])=>{
 const roster={faction,units:Array.from({length:ordinal},(_,i)=>
   unit(faction,name,models,'row-'+i,i===ordinal-1?selections:[]))};
 return resolveBuilderUnitCost(roster.units.at(-1),roster,
   roster.units.at(-1).equippedWargear).points;
};

test('Official October 2026 GW MFM publication is indexed but zero 14-Oct row claims are made from old cached v1.0 pages',()=>{
 assert.equal(PRICE_RECONCILIATION_SOURCES.officialMfmPublicationDate,'2026-10-14');
 assert.equal(PRICE_RECONCILIATION_SOURCES.independentSnapshotDate,'2026-11-08');
 assert.equal(PRICE_RECONCILIATION_SOURCES.directOctoberMfmRetrieved,false);
 assert.equal(PRICE_RECONCILIATION_SOURCES.directlyCertifiedUnitRows,0);
 assert.match(PRICE_RECONCILIATION_SOURCES.status,/primary-GW-October-pending/);
});

test('All 57 Tyranid first-copy and 87 current Space Marine default-size prices match the independent 8-Nov reference',()=>{
 assert.equal(TYRANID_FIRST_COPY_POINT_BENCHMARK.length,57);
 assert.equal(SPACE_MARINE_FIRST_COPY_POINT_BENCHMARK.length,87);
 for(const faction of ['Tyranids','Space Marines']){
   const result=auditIndependentFirstCopyPoints(faction);
   assert.equal(result.benchmarks,faction==='Tyranids'?57:87);
   assert.equal(result.rows,result.benchmarks);
   assert.equal(result.matched,result.benchmarks,
      faction+' mismatches: '+JSON.stringify(result.mismatches));
   assert.deepEqual(result.missingCatalog,[]);
   assert.equal(result.GWPrimaryRowsChecked,0);
   assert.equal(result.officialPointsFullyCertified,false);
 }
});

test('Tyranid independent published size tiers remain exact for additional models',()=>{
 const rows=[
  ['Barbgaunts',10,100],['Biovores',2,100],['Biovores',3,140],
  ['Gargoyles',20,150],['Hormagaunts',20,120],['Termagants',20,110],
  ['Neurogaunts',22,90],['Genestealers',10,140],['Hive Guard',6,160],
  ['Pyrovores',2,70],['Pyrovores',3,100],['Tyrant Guard',6,170],
  ['Venomthropes',6,110],['Von Ryan’s Leapers',6,105],['Zoanthropes',6,190],
  ['Tyranid Warriors with Melee Bio-weapons',6,150],
  ['Tyranid Warriors with Ranged Bio-weapons',6,120],
  ['Spore Mines',6,110],['Mucolid Spores',2,60],['Carnifexes',2,180],
  ['Ripper Swarms',2,40],['Ripper Swarms',3,50]
 ];
 for(const [name,models,expected] of rows)
  assert.equal(choose('Tyranids',name,models),expected,name+' x'+models);
});

test('Space Marine independent published squad size tiers remain exact for first copy',()=>{
 const rows=[
  ['Aggressor Squad',6,180],['Assault Intercessor Squad',10,170],
  ['Heavy Intercessor Squad',10,230],['Intercessor Squad',10,170],
  ['Assault Intercessors with Jump Packs',10,190],
  ['Bladeguard Veteran Squad',6,180],
  ['Eradicator Squad with Heavy Bolters',6,215],['Eradicator Squad with Melta Rifles',6,200],
  ['Hellblaster Squad',10,230],['Inceptor Squad',6,260],
  ['Incursor Squad',10,170],['Infernus Squad',10,190],
  ['Infiltrator Squad',10,150],['Reiver Squad',10,165],
  ['Scout Squad',10,120],['Sternguard Veteran Squad',10,210],
  ['Terminator Assault Squad',10,340],['Terminator Squad',10,380],
  ['Vanguard Veteran Squad with Jump Packs',10,220],
  ['Invader ATVs',2,130],['Outrider Squad',6,160],
  ['Firestrike Servo-turrets',2,160],['Victrix Honour Guard',6,250]
 ];
 for(const [name,models,expected] of rows)
  assert.equal(choose('Space Marines',name,models),expected,name+' x'+models);
});

test('Explicit higher-copy and weapon premium rules are distinct from independent default-size snapshots',()=>{
 const rows=[
  ['Tyranids','Exocrine',1,1,135],['Tyranids','Exocrine',1,3,145],
  ['Tyranids','Neurolictor',1,1,80],['Tyranids','Neurolictor',1,3,90],
  ['Tyranids','Screamer-Killer',1,1,125],['Tyranids','Screamer-Killer',1,2,135],
  ['Tyranids','Norn Emissary',1,1,250],['Tyranids','Norn Emissary',1,2,270],
  ['Tyranids','Raveners',5,1,125],['Tyranids','Raveners',5,3,135],
  ['Tyranids','Pyrovores',3,1,100],['Tyranids','Pyrovores',3,3,110],
  ['Space Marines','Aggressor Squad',3,1,90],['Space Marines','Aggressor Squad',3,3,100],
  ['Space Marines','Terminator Squad',5,1,190],['Space Marines','Terminator Squad',5,3,230],
  ['Space Marines','Victrix Honour Guard',3,1,120],['Space Marines','Victrix Honour Guard',3,3,150],
  ['Space Marines','Repulsor Executioner',1,1,260],['Space Marines','Repulsor Executioner',1,3,280]
 ];
 for(const [faction,name,models,ordinal,expected] of rows){
  assert.equal(choose(faction,name,models,ordinal),expected,
   faction+' '+name+' '+models+' models, copy '+ordinal);
 }
 const tf=(gun,ordinal=1)=>choose('Tyranids','Tyrannofex',1,ordinal,[{name:gun,quantity:1}]);
 assert.deepEqual([tf('Fleshborer hive'),tf('Acid spray'),tf('Rupture cannon')],[170,180,190]);
 assert.deepEqual([tf('Fleshborer hive',3),tf('Acid spray',3),tf('Rupture cannon',3)],[180,190,200]);
 assert.equal(choose('Space Marines','Redemptor Dreadnought',1,1,
  [{name:'Macro Plasma Incinerator',quantity:1}]),180);
 assert.equal(choose('Space Marines','Repulsor Executioner',1,1,
  [{name:'Heavy Laser Destroyer',quantity:1}]),270);
});

test('33 Marine and 34 Tyranid enhancement rows remain separate from unit base cost and pending direct MFM certification',()=>{
 assert.equal(TYRANID_ENHANCEMENTS.length,34);
 assert.equal(SPACE_MARINES_CURRENT_ENHANCEMENTS.length,33);
 assert.ok(TYRANID_ENHANCEMENTS.every(x=>x.verificationStatus.includes('official-october-mfm-pending')));
 assert.ok(SPACE_MARINES_CURRENT_ENHANCEMENTS.every(x=>x.verificationStatus.includes('official-mfm-pending')));
});
