import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { OFFICIAL_RULES_SOURCE_INDEX } from '../../src/data/official-rules-source-index.js';
import { getTyranidWargearRuleSet } from '../../src/data/tyranid-wargear-rules.js';
import {
  TYRANID_JUNE_2026_OFFICIAL_SOURCE,
  TYRANID_CURRENT_FACTION_PACK,
  TYRANID_OFFICIAL_FIELD_CHECKS,
  TYRANID_OFFICIAL_EQUIPMENT_OVERRIDES,
  tyranidCurrentRulesCertificationSummary
} from '../../src/data/tyranid-official-field-certification.js';
import { assessUnitLoadoutReadiness } from '../../src/rules/roster-loadout-readiness.js';
import { buildManualWargearLoadout } from '../../src/rules/wargear-loadout-validation.js';
import { getDatasheetWeaponOptions } from '../../src/rules/saved-roster-combat-profile.js';

const catalog=findArmyUnitCandidates({ faction: 'Tyranids' });
const unit=id=>{const candidate=catalog.find(x=>x.id===id);assert.ok(candidate,id);return candidate;};
const rosterUnit=id=>{
 const c=unit(id);
 return { id:'roster-'+id,datasheetId:id,datasheet:c.datasheet,name:c.name,modelCount:c.datasheet.defaultModelCount??1 };
};

test('GW source index never misrepresents June direct checks as October 11e certification',()=>{
 const pack=OFFICIAL_RULES_SOURCE_INDEX.publications.tyranids;
 assert.equal(pack.version,'1.3');
 assert.equal(pack.currentOctoberPackContentCompared,false);
 assert.equal(pack.currentOctoberMfmPointsFullyCompared,false);
 assert.equal(pack.fullyCurrentCodexCertified,false);
 assert.equal(TYRANID_CURRENT_FACTION_PACK.publicationDate,'2026-10-14');
 assert.equal(TYRANID_JUNE_2026_OFFICIAL_SOURCE.legalFrom,'2026-06-20');
 assert.match(TYRANID_JUNE_2026_OFFICIAL_SOURCE.url,/assets\.warhammer-community\.com\/.*tyranids.*\.pdf/);
 const summary=tyranidCurrentRulesCertificationSummary(catalog);
 assert.equal(summary.total,57);
 assert.equal(summary.juneFieldsChecked,6);
 assert.equal(summary.fullCurrentCodexAndFactionPackCertified,0);
 assert.equal(summary.octoberPointsFullyCertified,0);
 assert.equal(summary.missingCurrentCodexComparison.length,57);
 assert.equal(Object.keys(TYRANID_OFFICIAL_FIELD_CHECKS).length,6);
});

test('11e GW June Red Terror has no invented Mobile keyword, keeps official attack profiles',()=>{
 const d=unit('tyranids:the-red-terror').datasheet;
 assert.equal(d.keywords.includes('Mobile'),false);
 assert.equal(d.keywords.includes('Vanguard Invader'),true);
 assert.deepEqual(d.weapons.map(x=>[x.name,x.attacks,x.strength,x.damage]),[
  ['Gaping maw',1,5,'D3+2'],['Scything talons',12,7,2]
 ]);
 assert.match(d.weapons[0].abilities,/Extra Attacks/);
});

test('11e GW June Harridan Damaged rule is present for combat reference and reminder',()=>{
 const d=unit('tyranids:harridan').datasheet;
 assert.equal(d.weapons[0].name,'Dire bio-cannon');
 const damaged=d.abilities.find(item=>item.name==='Damaged: 1-10 Wounds Remaining');
 assert.ok(damaged);
 assert.match(damaged.description,/subtract 1 from the Hit roll/);
 assert.equal(d.weapons[0].strength,10);
});

test('11e official Legends Barbed Hierodule has two Bio-cannons without manual selection',()=>{
 const id='tyranids:barbed-hierodule';
 const data=rosterUnit(id), rule=getTyranidWargearRuleSet(id);
 assert.equal(rule,TYRANID_OFFICIAL_EQUIPMENT_OVERRIDES[id]);
 assert.equal(rule.fixed.find(x=>x.name==='Bio-cannon').count,2);
 assert.equal(assessUnitLoadoutReadiness(data).status,'complete');
 const built=buildManualWargearLoadout(data,rule.fixed.map(x=>({name:x.name,quantity:x.count})));
 assert.equal(built.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(built.equippedWeapons.find(x=>x.name==='Bio-cannon')?.quantity,2);
 const state={
  phase:'shooting',turn:1,battle:{round:1,activePlayerId:'p1',status:'active'},activePlayer:'p1',
  armyRosters:{p1:{faction:'Tyranids',units:[{...data,...built}]}},
  units:[{id:'bio-1',name:data.name,ownerId:'p1',status:'deployed',position:{x:15,y:12},metadata:{rosterUnitId:data.id}}]
 };
 const options=getDatasheetWeaponOptions(state,state.units[0],{type:'ranged'});
 const cannon=options.find(w=>w.name==='Bio-cannon');
 assert.equal(cannon?.characteristics?.attacks,'2D6+6');
});

test('June source-matched Tyranid Prime, Raveners and Hierophant remain unchanged',()=>{
 const prime=unit('tyranids:tyranid-prime-with-lash-whip').datasheet;
 assert.equal(prime.weapons.find(x=>x.name==='Lash whip').attacks,8);
 assert.match(prime.weapons.find(x=>x.name==='Lash whip').abilities,/Extra Attacks/);
 const raveners=unit('tyranids:raveners').datasheet;
 assert.equal(raveners.defaultModelCount,5);
 assert.equal(raveners.weapons[0].attacks,3);
 assert.equal(raveners.weapons[0].damage,2);
 const hiero=getTyranidWargearRuleSet('tyranids:hierophant');
 assert.equal(hiero.fixed.find(x=>x.name==='Dire bio-cannon').count,2);
});
