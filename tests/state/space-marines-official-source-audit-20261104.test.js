import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {getRulesDataRevisionForFaction} from '../../src/data/rules-data-revisions.js';
import {SPACE_MARINES_MFM_PRICE_SOURCES} from '../../src/data/space-marines-mfm-price-options.js';
import {
 SPACE_MARINES_OFFICIAL_SOURCE_STATUS,
 SPACE_MARINES_PER_UNIT_SOURCE_STATUS,
 SPACE_MARINES_OCT02_INDEPENDENT_FIRST_COPY,
 SPACE_MARINES_OCT02_INDEPENDENT_EXTRA_COPY
} from '../../src/data/space-marines-official-source-audit.js';

const find=name=>{
 const u=findArmyUnitCandidates({faction:'Space Marines'}).find(c=>c.name===name&&!c.legends);
 assert.ok(u,'current 11e unit missing: '+name);
 return u;
};
function priceAt(name,models,ordinal=1){
 const u=find(name);
 const peers=Array.from({length:ordinal},(_,i)=>({...u,id:'audit-'+i,datasheetId:u.id,modelCount:models}));
 const chosen=peers[ordinal-1];
 return resolveBuilderUnitCost(chosen,{units:peers}).points;
}
test('GW primary-source status remains explicitly partial until current live MFM and printed Codex are directly compared',()=>{
 const s=SPACE_MARINES_OFFICIAL_SOURCE_STATUS;
 assert.equal(s.currentUnitTypes,87);
 assert.equal(s.independentEleventhEditionLoadoutTypes,87);
 assert.equal(s.currentMfmGwPublishedDate,'2026-10-14');
 assert.equal(s.currentMfmDirectRowsVerified,false);
 assert.equal(s.codexOctober2026FullTextVerified,false);
 assert.equal(s.gwFactionErrataOctober14DirectTextVerified,false);
 assert.equal(s.certification,'pending-current-primary-source-verification');
 assert.equal(s.staleMfmSearchIndexMustNeverOverrideLiveCosts,true);
 assert.match(s.mfmDirectAccessResult,/403/);
 assert.match(s.codexAccessResult,/not been supplied/);
 assert.match(s.gwDownloadsUrl,/warhammer-community\.com/);
 assert.match(s.currentMfmUrl,/mfm\.warhammer-community\.com/);
 const catalog=findArmyUnitCandidates({faction:'Space Marines'}).filter(u=>!u.legends);
 assert.equal(catalog.length,87);
 assert.equal(SPACE_MARINES_PER_UNIT_SOURCE_STATUS.length,87);
 assert.deepEqual(SPACE_MARINES_PER_UNIT_SOURCE_STATUS.map(u=>u.datasheetId).sort(),catalog.map(u=>u.id).sort());
 assert.ok(SPACE_MARINES_PER_UNIT_SOURCE_STATUS.every(u=>
  u.independent11eWargearReviewed &&
  u.currentOfficialCodexFullTextVerified===false &&
  u.currentOfficialMfmPriceVerified===false &&
  u.currentOfficialErrataCompared===false));
 assert.equal(SPACE_MARINES_MFM_PRICE_SOURCES.officialPdfCurrentContentsIndependentlyChecked,false);
 assert.equal(getRulesDataRevisionForFaction('Space Marines').officialRevisionCheck.status,'pending-current-official-profile-and-points-comparison');
});
test('all 48 published Oct-2 first-copy price-change rows match app pricing, without mislabeling them official direct MFM',()=>{
 assert.equal(SPACE_MARINES_OCT02_INDEPENDENT_FIRST_COPY.length,48);
 for(const [name,models,expected] of SPACE_MARINES_OCT02_INDEPENDENT_FIRST_COPY)
  assert.equal(priceAt(name,models,1),expected,`${name} (${models} models, first copy) — independent Oct 2 source`);
});
test('all 23 Oct-2 independent additional-copy price-change rows match correct ordinal tiers',()=>{
 assert.equal(SPACE_MARINES_OCT02_INDEPENDENT_EXTRA_COPY.length,23);
 for(const [name,models,ordinal,expected] of SPACE_MARINES_OCT02_INDEPENDENT_EXTRA_COPY){
  assert.equal(priceAt(name,models,ordinal),expected,`${name} (${models} models, copy ${ordinal}) — independent Oct 2 source`);
  if(ordinal===3){
   const first=priceAt(name,models,1),second=priceAt(name,models,2);
   assert.equal(first,second,`${name}: extra-copy tier must not start on copy 2`);
  }
 }
});
test('current GW September public balance article supports scoped Phobos speed and toughness, no assumptions about unpictured weapons',()=>{
 for(const name of ['Captain in Phobos Armour','Librarian in Phobos Armour',
 'Lieutenant in Phobos Armour','Lieutenant with Combi-Weapon','Incursor Squad','Infiltrator Squad','Reiver Squad','Eliminator Squad']){
  const stats=find(name).datasheet?.characteristics;
  assert.ok(stats,'missing profile '+name);
  assert.equal(stats.Move,'8"',name+' Phobos Move');
  assert.equal(stats.Toughness,'4',name+' Phobos Toughness');
 }
 const g=find('Roboute Guilliman');
 assert.ok(g.datasheet.abilities.some(a=>a.name==='Codex Adept'&&a.description.includes('doctrines')),
  'GW September Codex preview explicitly confirms all three doctrines always active for Guilliman');
 assert.ok(g.datasheet.abilities.some(a=>a.name==='Author of the Codex'),
  'GW September preview confirms granting a nearby unit an additional Combat Doctrine');
});
test('October 14 independent errata transcription conditions Lone Operative on the Techmarine or Iron Father model, not its whole attached unit',()=>{
 const t=find('Techmarine'),f=find('Iron Father Feirros');
 const tech=t.datasheet.abilities.find(a=>a.name==='Techmarine')?.description??'';
 const father=f.datasheet.abilities.find(a=>a.name==='Iron Father')?.description??'';
 assert.match(tech,/Lone Operative while within 3 inches of friendly ADEPTUS ASTARTES VEHICLE/);
 assert.match(father,/Lone Operative only within 3 inches of friendly Astartes Vehicle/);
});
test('Cato Sicarius currently matches independently transcribed Oct-14 sword amendments without claiming direct GW certification',()=>{
 const c=find('Cato Sicarius');
 const blade=c.datasheet.weapons;
 const strike=blade.find(w=>w.name==='Talassarian Tempest Blade - Strike');
 const sweep=blade.find(w=>w.name==='Talassarian Tempest Blade - Sweep');
 const coup=blade.find(w=>w.name==='Talassarian Tempest Blade - Coup de Grace');
 assert.ok(strike);assert.ok(sweep);assert.ok(coup);
 assert.equal(strike.attacks,'5');
 assert.equal(coup.attacks,'7');
 assert.equal(coup.strength,'6');
 assert.match(sweep.abilities,/Sustained Hits 1: Infantry/i);
 assert.equal(c.officialRulesCrossCheck,'pending','source comparison remains secondary-only');
});
test('source discrepancy gates: dated official GW release beats 4-month-old MFM web index, while October codex weapon conflict stays unresolved',()=>{
 const s=SPACE_MARINES_OFFICIAL_SOURCE_STATUS;
 assert.equal(s.staleMfmSearchIndexMustNeverOverrideLiveCosts,true);
 // The 4-month-old indexed GW page shows outdated costs for these units.
 // Do not overwrite Oct 2+ app prices with stale index: Ancient in Terminator
 // Armour 65 vs 75 in current catalog, or Roboute Guilliman 340 vs 415.
 assert.equal(priceAt('Ancient in Terminator Armour',1),75);
 assert.equal(priceAt('Roboute Guilliman',1),415);
 // Third-party Oct-14 data version 981 reports updates not yet reflected in
 // a separate 11e transcription. Do not silently promote either one to GW authority.
 const phobos=find('Captain in Phobos Armour').datasheet.weapons.find(w=>w.name==='Instigator Bolt Carbine');
 assert.ok(phobos);
 assert.equal(phobos.attacks,'1');
 assert.equal(phobos.strength,'4');
});
