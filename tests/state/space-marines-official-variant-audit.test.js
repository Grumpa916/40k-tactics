import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates, getArmyUnitCandidateLabel } from '../../src/data/army-unit-catalog.js';
import { SPACE_MARINES_LEGENDARY_PROXY_REFERENCES } from '../../src/data/space-marines-catalog-coverage.js';
import { filterCatalog, renderCatalogResults } from '../../src/ui/army-builder-view.js';
import { renderUnitDetails } from '../../src/ui/army-unit-details.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';
import { createGameState } from '../../src/state/game-state.js';
import { applyArmyRosterToBattle } from '../../src/engine/army-roster-transitions.js';

const catalog = () => findArmyUnitCandidates({ faction:'Space Marines' });
const exportRoster = (lines, id='sm-variant') => importWarhammerAppRoster({
  text:'Space Marines\nDetachment: Gladius Task Force\nCHARACTERS\n'+lines,
  faction:'Space Marines',name:'Ultramarines',id,pointsLimit:2000
});

test('official 11th edition Calgar Antilochus identity resolves to existing, stable catalog ID',()=>{
  const calgar=catalog().find(item=>item.id==='space-marines:marneus-calgar');
  assert.ok(calgar);
  assert.equal(calgar.name,'Marneus Calgar');
  assert.equal(calgar.officialDatasheetName,'Marneus Calgar in Armour of Antilochus');
  assert.equal(calgar.verifiedArmourVariant,'Terminator – Armour of Antilochus');
  assert.equal(calgar.officialVariantIdentityChecked,true);
  assert.equal(calgar.completeOctoberCodexCrossCheck,false);
  assert.ok(calgar.datasheet.keywords.includes('Terminator'));
  assert.equal(findArmyUnitCandidates({faction:'Space Marines',query:'Antilochus'})[0].id,calgar.id);
  assert.equal(filterCatalog({current:{faction:'Space Marines',units:[]},unitSearch:'Antilochus'})[0].id,calgar.id);
  assert.match(renderCatalogResults({current:{faction:'Space Marines',units:[]},unitSearch:'Antilochus'}),/Armour of Antilochus/);
});

test('Warhammer App Calgar Armour of Antilochus export is not silently dropped',()=>{
  const out=exportRoster('Marneus Calgar in Armour of Antilochus (180 pts)');
  assert.equal(out.unrecognized.length,0);
  assert.equal(out.roster.units.length,1);
  const model=out.roster.units[0];
  assert.equal(model.name,'Marneus Calgar in Armour of Antilochus');
  assert.equal(model.datasheetId,'space-marines:marneus-calgar');
  assert.equal(model.points,180);
  assert.ok(model.datasheet?.weapons?.length>0);
  const game=createGameState({
    phase:'setup',battle:{id:'ant-battle',status:'setup',round:0},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}]
  });
  const next=applyArmyRosterToBattle(game,{roster:out.roster,playerId:'p2',
    snapshotId:'ant-snapshot',selectedAt:'2026-11-03T23:00:00Z'});
  assert.equal(next.units.find(unit=>unit.ownerId==='p2')?.name,'Marneus Calgar in Armour of Antilochus');
  assert.equal(next.armyRosters.p2.units[0].datasheetId,'space-marines:marneus-calgar');
});

test('legacy Calgar imports remain backwards-compatible; unverified Gravis variant is not falsely matched',()=>{
  const short=exportRoster('Marneus Calgar (180 pts)','calgar-legacy');
  assert.equal(short.roster.units[0].name,'Marneus Calgar');
  assert.equal(short.roster.units[0].datasheetId,'space-marines:marneus-calgar');
  const unfamiliar=exportRoster('Marneus Calgar in Gravis Armour (180 pts)\nCaptain (90 pts)','unknown-calgar');
  assert.equal(unfamiliar.unrecognized.length,1,'Gravis must not be silently mapped to Antilochus');
  assert.equal(unfamiliar.roster.units.length,1);
  assert.equal(unfamiliar.roster.units[0].name,'Captain');
});

test('five officially designated Legendary Proxies are not presented as Legends datasheets',()=>{
 const expected={
  'Pedro Kantor':'Captain','Uriel Ventris':'Captain',
  'Tactical Squad':'Intercessor Squad','Devastator Squad':'Desolation Squad',
  'Suppressor Squad':'Inceptor Squad'
 };
 assert.deepEqual(SPACE_MARINES_LEGENDARY_PROXY_REFERENCES,expected);
 const all=catalog();
 assert.equal(all.filter(unit=>unit.legends).length,89);
 assert.equal(all.filter(unit=>unit.legendaryProxy).length,5);
 for(const [name,proxy] of Object.entries(expected)){
  const unit=all.find(x=>x.name===name);
  assert.equal(unit.legendaryProxy,true);
  assert.equal(unit.proxyAs,proxy);
  assert.match(unit.sourceUrl,/warhammer-community.com/);
  assert.equal(unit.datasheet,undefined);
  assert.equal(unit.defaultPoints,undefined);
  assert.match(getArmyUnitCandidateLabel(unit),/Legendary Proxy/);
  assert.equal(filterCatalog({current:{faction:'Space Marines',units:[]},unitSearch:name}).length,0);
  assert.equal(filterCatalog({current:{faction:'Space Marines',units:[]},unitSearch:name,includeLegends:true}).length,1);
 }
});

test('official 11th edition Victrix and Wardens unit-size notes retain missing points and wargear warnings',()=>{
 const victrix=catalog().find(item=>item.name==='Victrix Honour Guard');
 assert.deepEqual([...victrix.officialComposition.permittedModels],[3,6]);
 assert.equal(victrix.officialComposition.optionalChapterAncientMaximum,1);
 assert.equal(victrix.officialComposition.optionalChapterChampionMaximum,1);
 assert.match(victrix.officialCompositionSourceUrl,/assets.warhammer-community.com/);
 assert.equal(victrix.completeOctoberCodexCrossCheck,false);
 const details=renderUnitDetails(victrix,{current:{faction:'Space Marines',units:[]}});
 assert.match(details,/3 or 6 models/);
 assert.match(details,/Only priced sizes shown below can currently be selected/);
 const calgar=catalog().find(x=>x.name==='Marneus Calgar');
 assert.match(renderUnitDetails(calgar,{current:{faction:'Space Marines',units:[]}}),/Official datasheet identity/);
 assert.match(renderUnitDetails(calgar,{current:{faction:'Space Marines',units:[]}}),/Full October Codex weapon\/points verification/);
 const wardens=catalog().find(item=>item.name==='Wardens of Ultramar');
 assert.deepEqual([...wardens.officialComposition.permittedModels],[6]);
 assert.equal(wardens.officialRulesCrossCheck,'pending');
 assert.equal(wardens.datasheet,undefined);
});
