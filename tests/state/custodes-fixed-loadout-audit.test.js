import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { getAdeptusCustodesWargearRuleSet } from '../../src/data/adeptus-custodes-wargear-rules.js';
import { getTyranidWargearRuleSet } from '../../src/data/tyranid-wargear-rules.js';
import { hydrateReviewedFixedCustodesLoadout, hydrateReviewedFixedCustodesRoster, isReviewedFixedCustodesLoadout } from '../../src/rules/custodes-fixed-wargear.js';
import { assessUnitLoadoutReadiness, loadoutReadinessLabel, assessRosterLoadoutReadiness } from '../../src/rules/roster-loadout-readiness.js';
import { validateWargearLoadout } from '../../src/rules/wargear-loadout-validation.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';
import { createArmyRoster } from '../../src/state/army-roster-library.js';
import { createGameState } from '../../src/state/game-state.js';
import { applyArmyRosterToBattle } from '../../src/engine/army-roster-transitions.js';
import { getDatasheetWeaponOptions } from '../../src/rules/saved-roster-combat-profile.js';
import { renderRosterRows } from '../../src/ui/army-roster-rows.js';

const candidates=findArmyUnitCandidates({faction:'Adeptus Custodes'});
const raw=(id,count=1,extra={})=>{
  const candidate=candidates.find(c=>c.id==='adeptus-custodes:'+id);
  assert.ok(candidate,id);
  return {id,name:candidate.name,modelCount:count,datasheetId:candidate.id,
    datasheet:structuredClone(candidate.datasheet),points:candidate.defaultPoints??0,...extra};
};
const named=(unit)=>unit.equippedWargear.map(x=>[x.name,x.quantity]);
const profiles=(unit)=>unit.equippedWeapons.map(x=>[x.name,x.quantity]);
const setup=()=>createGameState({phase:'setup',players:[{id:'p1'},{id:'p2'}],battle:{id:'gear-test',status:'setup',round:0}});

test('all 36 current and Legends Custodes datasheets have explicit reviewed wargear coverage',()=>{
  assert.equal(candidates.length,36);
  for(const candidate of candidates){
    const rules=getAdeptusCustodesWargearRuleSet(candidate.id);
    assert.ok(rules,'Missing rules: '+candidate.id);
    assert.equal(getTyranidWargearRuleSet(candidate.id),rules);
    const legalProfiles=new Set(candidate.datasheet.weapons.map(w=>w.name));
    const items=[...(rules.fixed??[]),...(rules.optional??[]),...(rules.slots??[]).flatMap(s=>s.choices??[])];
    for(const selection of items)for(const name of selection.profiles??[selection.name])
      assert.ok(legalProfiles.has(name),candidate.name+' has unknown weapon profile '+name);
    const id=candidate.id.split(':')[1];
    if(!rules.slots?.length&&!rules.optional?.length&&!rules.constraints?.length)
      assert.equal(isReviewedFixedCustodesLoadout(raw(id,candidate.defaultModelCount)),true,candidate.name);
  }
});

test('Galatus Warblade auto-populates one named weapon with ranged and melee profiles',()=>{
  const saved=raw('contemptor-galatus-dreadnought');
  const result=hydrateReviewedFixedCustodesLoadout(saved);
  assert.equal(saved.equippedWargear,undefined,'source unchanged');
  assert.deepEqual(named(result),[['Warblade',1]]);
  assert.deepEqual(profiles(result),[['Warblade (ranged)',1],['Warblade',1]]);
  assert.equal(result.loadoutValidation.status,'rules-reviewed-valid');
  assert.equal(assessUnitLoadoutReadiness(saved).status,'complete');
  assert.equal(loadoutReadinessLabel(saved),'Loadout ready');
  assert.match(renderRosterRows([result],result.id,'Adeptus Custodes'),/1× Warblade/);
});

test('fixed-only Custodes auto-populate exact model/weapon quantities',()=>{
  const cases=[
    ['trajann-valoris',1,[["Eagle's Scream",1],["Watcher's Axe",1]]],
    ['aquilon-terminators-with-solarite-power-gauntlets',3,[['Adrathic Combi-destructor',3],['Solarite Power Gauntlet',3]]],
    ['venatari-with-kinetic-destroyers',3,[['Kinetic Destroyer',3],['Tarsus Buckler',3]]],
    ['prosecutor-squad',4,[['Boltgun',4],['Gun Stock',4]]],
    ['prosecutor-squad',10,[['Boltgun',10],['Gun Stock',10]]],
    ['witchseeker-squad',5,[['Flamer',5],['Gun Stock',5]]],
    ['vigilator-squad',9,[['Executioner Greatblade',9]]],
    ['ares-gunship',1,[['Arachnus Heavy Blaze Cannon',2],['Arachnus Magna-blaze Cannon',1],['Armoured Hull',1]]],
    ['orion-assault-dropship',1,[['Arachnus Heavy Blaze Cannon',2],['Spiculus Heavy Bolt Launcher',2],['Twin Lastrum Bolt Cannon',2],['Armoured Hull',1]]],
    ['aleya',1,[['Somnus',1]]],
    ['valerian',1,[['Gnosis',1]]],
    ['custodian-guard-sodality-with-adrasite-spears',3,[['Adrasite Spear',3]]],
    ['custodian-guard-sodality-with-pyrithite-spears',3,[['Pyrithite Spear',3]]],
    ['sagittarum-custodians-sodality',3,[['Adrastus Bolt Caliver',3],['Misericordia',3]]],
    ['blade-champion',1,[['Vaultswords',1]]],
    ['venatari-with-verutum-lances',3,[['Verutum Lance',3]]]
  ];
  for(const [id,count,expected] of cases){
    const unit=hydrateReviewedFixedCustodesLoadout(raw(id,count));
    assert.deepEqual(named(unit),expected,id);
    assert.equal(validateWargearLoadout(unit).status,'rules-reviewed-valid',id);
    assert.equal(assessUnitLoadoutReadiness(unit).blocking,false,id);
    assert.ok(unit.equippedWeapons.length,id);
    assert.equal(hydrateReviewedFixedCustodesLoadout(unit),unit,'already ready');
  }
  assert.deepEqual(profiles(hydrateReviewedFixedCustodesLoadout(raw('valerian'))),
    [['Gnosis (ranged)',1],['Gnosis',1]]);
});

test('partially listed fixed weapons are completed but excess, unknown, unmatched equipment is not erased',()=>{
  const partial=raw('witchseeker-squad',5,{
    equippedWargear:[{name:'Flamer',quantity:5}],equippedWeapons:[{name:'Flamer',quantity:5}],
    loadoutValidation:{status:'rules-invalid'}
  });
  const filled=hydrateReviewedFixedCustodesLoadout(partial);
  assert.deepEqual(named(filled),[['Flamer',5],['Gun Stock',5]]);
  assert.equal(filled.loadoutValidation.status,'rules-reviewed-valid');
  const wrong=raw('prosecutor-squad',4,{equippedWargear:[{name:'Boltgun',quantity:5}]});
  assert.equal(hydrateReviewedFixedCustodesLoadout(wrong),wrong);
  assert.equal(assessUnitLoadoutReadiness(wrong).status,'invalid');
  const unknown=raw('contemptor-galatus-dreadnought',1,{equippedWargear:[{name:'Imaginary cannon',quantity:1}]});
  assert.equal(hydrateReviewedFixedCustodesLoadout(unknown),unknown);
  assert.equal(assessUnitLoadoutReadiness(unknown).status,'invalid');
  const bad=raw('contemptor-galatus-dreadnought',1,{
    unmatchedWargear:[{sourceName:'Unknown',quantity:1}],
    loadoutValidation:{status:'source-invalid',errors:['Unknown']}
  });
  assert.equal(hydrateReviewedFixedCustodesLoadout(bad),bad);
  assert.equal(assessUnitLoadoutReadiness(bad).blocking,true);
});

test('selectable Custodes weapons and optional Vexilla never receive a guessed loadout',()=>{
  for(const id of ['vertus-praetors','allarus-custodians','shield-captain',
    'contemptor-achillus-dreadnought','telemon-heavy-dreadnought',
    'custodian-wardens','custodian-guard-sodality','sentinel-guard-sodality',
    'caladius-annihilator-grav-tank','gyrfalcon-jetbike-sodality']){
    const unit=raw(id,1,{loadoutValidation:{status:'manual-selection-required'}});
    assert.equal(isReviewedFixedCustodesLoadout(unit),false,id);
    assert.equal(hydrateReviewedFixedCustodesLoadout(unit),unit,id);
    assert.equal(assessUnitLoadoutReadiness(unit).status,'needs-confirmation',id);
  }
  const orks={id:'boyz',datasheetId:'orks:boyz',modelCount:10};
  assert.equal(hydrateReviewedFixedCustodesLoadout(orks),orks);
  assert.equal(assessUnitLoadoutReadiness(orks).status,'not-assessed');
});

test('imported Galatus and subsequent battle snapshot preserve its exact equipped weapons',()=>{
  const text='Adeptus Custodes\nOTHER DATASHEETS\nContemptor-Galatus Dreadnought (220 Points)';
  const imported=importWarhammerAppRoster({text,faction:'Adeptus Custodes',name:'Fixed gear',id:'fixed-import'});
  assert.equal(imported.roster.units.length,1);
  const unit=imported.roster.units[0];
  assert.deepEqual(named(unit),[['Warblade',1]]);
  assert.equal(assessRosterLoadoutReadiness(imported.roster).battleReady,true);
  const before=JSON.stringify(imported.roster);
  const state=applyArmyRosterToBattle(setup(),{roster:imported.roster,playerId:'p1',snapshotId:'fixed-snapshot'});
  assert.equal(JSON.stringify(imported.roster),before);
  assert.deepEqual(profiles(state.armyRosters.p1.units[0]),[['Warblade (ranged)',1],['Warblade',1]]);
  const model=state.units.find(x=>x.ownerId==='p1');
  const ranged=getDatasheetWeaponOptions(state,model,{type:'ranged'});
  const melee=getDatasheetWeaponOptions(state,model,{type:'melee'});
  assert.deepEqual(ranged.map(x=>x.name),['Warblade (ranged)']);
  assert.deepEqual(melee.map(x=>x.name),['Warblade']);
  assert.equal(ranged[0].characteristics.attacks,4);
  assert.equal(melee[0].characteristics.attacks,8);
});

test('battle assignment upgrades older fixed-only rosters without mutating saved original',()=>{
  const roster=createArmyRoster({id:'older',name:'Legacy fixed',faction:'Adeptus Custodes',
    units:[raw('contemptor-galatus-dreadnought'),raw('trajann-valoris')]});
  const before=JSON.stringify(roster);
  const resolved=hydrateReviewedFixedCustodesRoster(roster);
  assert.equal(resolved.units.every(x=>x.loadoutValidation.status==='rules-reviewed-valid'),true);
  const state=applyArmyRosterToBattle(setup(),{roster,playerId:'p1',snapshotId:'old-snapshot'});
  assert.equal(JSON.stringify(roster),before);
  assert.deepEqual(named(state.armyRosters.p1.units[0]),[['Warblade',1]]);
  assert.deepEqual(named(state.armyRosters.p1.units[1]),[["Eagle's Scream",1],["Watcher's Axe",1]]);
});
