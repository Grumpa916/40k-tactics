import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { getTyranidWargearRuleSet } from '../../src/data/tyranid-wargear-rules.js';
import { TYRANID_REVIEWED_ADDITIONAL_WARGEAR } from '../../src/data/tyranid-reviewed-additional-wargear.js';
import { TYRANID_COMPLEX_LOADOUT_REVIEW } from '../../src/data/tyranid-fixed-wargear-coverage.js';
import { auditArmyCatalogCompleteness } from '../../src/rules/army-catalog-completeness-audit.js';
import { buildManualWargearLoadout, validateWargearLoadout, matchWargearSelection } from '../../src/rules/wargear-loadout-validation.js';
import { assessUnitLoadoutReadiness } from '../../src/rules/roster-loadout-readiness.js';
import { getDatasheetWeaponOptions } from '../../src/rules/saved-roster-combat-profile.js';
import { getWargearSlots } from '../../src/rules/army-wargear-choices.js';

const catalog = findArmyUnitCandidates({faction:'Tyranids'});
const candidate = id => {
  const u=catalog.find(item=>item.id===id);
  assert.ok(u,'Missing candidate: '+id);
  return {id:'roster-'+id,datasheetId:id,datasheet:u.datasheet,modelCount:u.datasheet?.defaultModelCount??1,
    name:u.name};
};
const fixedSelections = (rule,models) => (rule.fixed??[]).map(item=>({
  name:item.name, quantity:(item.count??0)+(item.perModel??0)*models
}));
const liveState=(u,equipped=null)=>({
  phase:'shooting',turn:1,battle:{status:'active',round:1,activePlayerId:'p1'},activePlayer:'p1',history:[],
  armyRosters:{p1:{faction:'Tyranids',units:[{...u,...(equipped??{})}]}},
  units:[{id:'battle-'+u.datasheetId,ownerId:'p1',name:u.name,status:'deployed',currentStrength:u.modelCount,
    metadata:{rosterUnitId:u.id,modelCount:u.modelCount},position:{x:12,y:12}}]
});

test('57 Tyranid catalog entries have 56 rulesets; only mixed-profile Hyperadapted Raveners remains unresolved',()=>{
  const audit=auditArmyCatalogCompleteness('Tyranids');
  assert.equal(catalog.length,57);
  assert.equal(audit.counts.withStructuredLoadoutRules,56);
  assert.equal(audit.counts.withSelectableLoadoutRules,12);
  assert.equal(audit.counts.withFixedOnlyLoadoutRules,42);
  assert.equal(audit.counts.withNoEquipmentRule,2);
  assert.deepEqual(TYRANID_COMPLEX_LOADOUT_REVIEW,['tyranids:hyperadapted-raveners']);
  assert.deepEqual(audit.loadoutCoverageGaps.map(x=>x.datasheetId),['tyranids:hyperadapted-raveners']);
});

test('all nine 11th-edition reviewed units expose exactly the source-equipment profiles',()=>{
  assert.equal(Object.keys(TYRANID_REVIEWED_ADDITIONAL_WARGEAR).length,9);
  for(const [id,rule] of Object.entries(TYRANID_REVIEWED_ADDITIONAL_WARGEAR)){
    const u=candidate(id);
    const actual=new Set(u.datasheet.weapons.map(x=>x.name));
    const referenced=new Set([
      ...(rule.fixed??[]).flatMap(item=>item.profiles),
      ...(rule.slots??[]).flatMap(slot=>slot.choices.flatMap(choice=>choice.profiles))
    ]);
    assert.deepEqual(referenced,actual,id);
    assert.equal(rule.officialWargearCertification,'pending');
    assert.ok(rule.sourceUrl.startsWith('https://www.wahapedia.ru/wh40k11ed/'));
  }
});

test('previously unresolved fixed-only units require no manual selection, preserving exact firing profile groupings',()=>{
  const ids=Object.keys(TYRANID_REVIEWED_ADDITIONAL_WARGEAR).filter(id=>id!=='tyranids:harpy');
  for(const id of ids){
    const u=candidate(id),rule=getTyranidWargearRuleSet(id);
    assert.equal(assessUnitLoadoutReadiness(u).status,'complete',id);
    const result=buildManualWargearLoadout(u,fixedSelections(rule,u.modelCount));
    assert.equal(result.loadoutValidation.status,'rules-reviewed-valid',id);
    assert.equal(result.equippedWargear.length,rule.fixed.length,id);
    const opts=getDatasheetWeaponOptions(liveState(u,result),liveState(u,result).units[0]);
    assert.equal(opts.length,u.datasheet.weapons.length,id);
  }
});

test('Norn weapons and Zoanthrope Warp Blast share one physical selection across alternate profiles',()=>{
  for(const [id, selection, profiles] of [
    ['tyranids:norn-emissary','Psychic Tendril',3],
    ['tyranids:norn-assimilator','Toxinjector Harpoon',2],
    ['tyranids:zoanthropes','Warp Blast',2],
    ['tyranids:toxicrene','Massive toxic lashes',2],
    ['tyranids:maleceptor','Massive scything talons',2],
    ['tyranids:old-one-eye',"Old One Eye's claws and talons",2]
  ]){
    const u=candidate(id),rule=getTyranidWargearRuleSet(id);
    const item=rule.fixed.find(x=>x.name===selection);
    assert.equal(item.profiles.length,profiles,id);
    const result=buildManualWargearLoadout(u,fixedSelections(rule,u.modelCount));
    assert.equal(result.equippedWargear.filter(x=>x.name===selection).length,1,id);
    for(const name of item.profiles) assert.ok(
      result.equippedWeapons.some(x=>x.name===name&&x.selectionName===selection),
      id+' missing '+name);
    const matched=matchWargearSelection({datasheetId:id,datasheet:u.datasheet,sourceName:selection});
    assert.deepEqual(matched.profileNames,[...item.profiles]);
  }
});

test('Hierophant and Harridan count two dire bio-cannons and scale their attack count',()=>{
  for(const id of ['tyranids:hierophant','tyranids:harridan']){
    const u=candidate(id),rule=getTyranidWargearRuleSet(id);
    const cannons=rule.fixed.find(x=>x.name==='Dire bio-cannon');
    assert.equal(cannons.count,2,id);
    const built=buildManualWargearLoadout(u,fixedSelections(rule,1));
    assert.equal(built.loadoutValidation.status,'rules-reviewed-valid');
    assert.equal(built.equippedWeapons.find(x=>x.name==='Dire bio-cannon')?.quantity,2);
    const live=liveState(u,built);
    const gun=getDatasheetWeaponOptions(live,live.units[0],{type:'ranged'}).find(x=>x.name==='Dire bio-cannon');
    assert.equal(gun?.characteristics?.attacks,'2D6+12',id);
  }
});

test('Harpy requires exactly one chosen cannon; cannot use twin heavy venom and stranglethorn together',()=>{
  const id='tyranids:harpy',u=candidate(id),rule=getTyranidWargearRuleSet(id);
  assert.equal(assessUnitLoadoutReadiness(u).status,'needs-confirmation');
  assert.equal(getWargearSlots(u).length,1);
  assert.deepEqual(rule.slots[0].choices.map(x=>x.name),['Twin stranglethorn cannon','Twin heavy venom cannon']);
  const fixed=fixedSelections(rule,1);
  for(const name of rule.slots[0].choices.map(x=>x.name)){
    const built=buildManualWargearLoadout(u,[...fixed,{name,quantity:1}]);
    assert.equal(built.loadoutValidation.status,'rules-reviewed-valid',name);
    const state=liveState(u,built);
    const weapons=getDatasheetWeaponOptions(state,state.units[0],{type:'ranged'}).map(x=>x.name);
    assert.ok(weapons.includes('Stinger salvoes'));
    assert.ok(weapons.includes(name));
    assert.equal(weapons.length,2);
  }
  const invalid=validateWargearLoadout({...u,equippedWargear:[
    ...fixed,{name:'Twin stranglethorn cannon',quantity:1},{name:'Twin heavy venom cannon',quantity:1}
  ]});
  assert.equal(invalid.status,'rules-invalid');
});
