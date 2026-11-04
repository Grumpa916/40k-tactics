import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates, getArmyUnitCandidateLabel } from '../../src/data/army-unit-catalog.js';
import { SPACE_MARINES_COVERAGE_SOURCE } from '../../src/data/space-marines-catalog-coverage.js';
import { filterCatalog, renderCatalogResults, renderArmyBuilder } from '../../src/ui/army-builder-view.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';
import { createGameState } from '../../src/state/game-state.js';
import { applyArmyRosterToBattle } from '../../src/engine/army-roster-transitions.js';
import { getCatalogRoleGroup } from '../../src/ui/army-builder-catalog-order.js';

const currentNames=[
  'Adrax Agatone','Aethon Shaan','Caanok Var','Captain Titus','Cato Sicarius',
  'Chief Librarian Tigurius','Darnath Lysander','Iron Father Feirros','Kaius Konorius',
  'Kayvaan Shrike',"Kor'sarro Khan",'Marneus Calgar','Roboute Guilliman',
  'Suboden Khan','Tor Garadon','Vulkan He’stan','Wardens of Ultramar',
  'Ancient','Ancient in Terminator Armour','Apothecary','Apothecary Biologis',
  'Bladeguard Ancient','Captain','Captain in Gravis Armour','Captain in Phobos Armour',
  'Captain in Terminator Armour','Captain on Bike','Captain with Jump Pack','Chaplain',
  'Chaplain in Terminator Armour','Chaplain on Bike','Chaplain with Jump Pack','Judiciar',
  'Librarian','Librarian in Phobos Armour','Librarian in Terminator Armour','Lieutenant',
  'Lieutenant in Phobos Armour','Lieutenant with Combi-Weapon','Techmarine',
  'Assault Intercessor Squad','Heavy Intercessor Squad','Intercessor Squad',
  'Aggressor Squad','Assault Intercessors with Jump Packs','Bladeguard Veteran Squad',
  'Company Heroes','Desolation Squad','Eliminator Squad',
  'Eradicator Squad with Melta Rifles','Eradicator Squad with Heavy Bolters',
  'Hellblaster Squad','Inceptor Squad','Incursor Squad','Infernus Squad',
  'Infiltrator Squad','Reiver Squad','Scout Squad','Sternguard Veteran Squad',
  'Terminator Assault Squad','Terminator Squad',
  'Vanguard Veteran Squad with Jump Packs','Victrix Honour Guard',
  'Outrider Squad','Invader ATVs','Astraeus','Ballistus Dreadnought',
  'Brutalis Dreadnought','Firestrike Servo-turrets','Gladiator Lancer',
  'Gladiator Reaper','Gladiator Valiant','Invictor Tactical Warsuit',
  'Land Raider','Land Raider Crusader','Land Raider Redeemer','Land Speeder',
  'Redemptor Dreadnought','Repulsor','Repulsor Executioner',
  'Storm Speeder Hailstrike','Storm Speeder Hammerstrike',
  'Storm Speeder Thunderstrike','Thunderhawk Gunship','Drop Pod','Impulsor','Rhino'
];

const current=()=>findArmyUnitCandidates({faction:'Space Marines'}).filter(unit=>!unit.legends);
const roster={id:'marine-roster',name:'Ultramarines',faction:'Space Marines',
  pointsLimit:2000,units:[]};

test('all 87 current 11e Space Marines names are discoverable without Legends, with no duplicates',()=>{
 const units=current();
 assert.equal(currentNames.length,87);
 assert.equal(units.length,87);
 assert.deepEqual(new Set(units.map(unit=>unit.name)),new Set(currentNames));
 assert.equal(new Set(units.map(unit=>unit.id)).size,87);
 assert.equal(SPACE_MARINES_COVERAGE_SOURCE.expectedDatasheetNames,176);
 assert.equal(SPACE_MARINES_COVERAGE_SOURCE.officialRulesVerified,false);
 for(const unit of units)assert.ok(unit.defaultPoints!=null,unit.name+' needs a referenced points figure');
});

test('Legends remain available only by explicit request and cannot masquerade as verified current units',()=>{
 const all=findArmyUnitCandidates({faction:'Space Marines'});
 const legends=all.filter(unit=>unit.legends);
 assert.equal(all.length,176,'name-only reference coverage against Nov 2 list');
 assert.equal(legends.length,89);
 assert.equal(legends.filter(unit=>unit.legendaryProxy).length,5);
 assert.equal(legends.filter(unit=>!unit.legendaryProxy).length,84);
 assert.ok(legends.every(unit=>unit.legendaryProxy ? unit.verificationStatus==='legendary-proxy-reference-only' : unit.verificationStatus==='legends-name-only-unverified'));
 assert.ok(legends.every(unit=>unit.defaultPoints==null));
 assert.ok(legends.every(unit=>!unit.datasheet));
 assert.ok(getArmyUnitCandidateLabel(legends[0]).includes('Legends'));
 assert.equal(filterCatalog({current:roster}).length,87);
 assert.equal(filterCatalog({current:roster,includeLegends:true}).length,176);
});

test('Calgar appears in the visible Army Builder search and among Epic Heroes',()=>{
 const found=findArmyUnitCandidates({faction:'Space Marines',query:'calgar'});
 assert.equal(found.length,1);
 const calgar=found[0];
 assert.equal(calgar.id,'space-marines:marneus-calgar');
 assert.equal(calgar.defaultPoints,180);
 assert.ok(calgar.datasheet?.weapons?.length>0);
 assert.equal(getCatalogRoleGroup(calgar),'epic-hero');
 const matches=filterCatalog({current:roster,unitSearch:' calgar '});
 assert.equal(matches.length,1,'trim search whitespace for touch input');
 const html=renderCatalogResults({...roster,current:roster,unitSearch:'Calgar'});
 assert.match(html,/Marneus Calgar/);
 assert.match(html,/data-add-catalog-unit="space-marines:marneus-calgar"/);
 const editor=renderArmyBuilder({page:'editor',current:roster,records:[],players:[]});
 assert.match(editor,/data-unit-search/);
 assert.match(editor,/Search e.g. Calgar/);
 assert.match(editor,/data-catalog-include-legends/);
 assert.match(editor,/Marneus Calgar/);
 assert.doesNotMatch(editor,/Razorback/, 'Legends do not crowd normal roster browser');
});

test('missing current Epic Heroes and Victrix remain separate non-certified profile references',()=>{
 for(const name of ['Roboute Guilliman','Chief Librarian Tigurius','Cato Sicarius',
   'Captain Titus','Victrix Honour Guard','Wardens of Ultramar']){
  const candidate=current().find(x=>x.name===name);
  assert.ok(candidate,'must browse '+name);
  assert.equal(getCatalogRoleGroup(candidate),'epic-hero');
  assert.equal(candidate.officialRulesCrossCheck,'pending');
  assert.equal(candidate.datasheet,undefined,'never invent an unreviewed datasheet for '+name);
 }
 const victrix=current().find(x=>x.name==='Victrix Honour Guard');
 assert.equal(victrix.defaultModelCount,3);
 assert.equal(victrix.defaultPoints,120);
});

test('Calgar survives text roster import and battle assignment, not just catalog lookups',()=>{
 const text=`Space Marines
Detachment: Gladius Task Force
CHARACTERS
Marneus Calgar (180 pts)
OTHER DATASHEETS
Victrix Honour Guard (120 pts)
`;
 const imported=importWarhammerAppRoster({text,faction:'Space Marines',name:'Ultramarines',
  id:'ultramarines',pointsLimit:2000});
 assert.equal(imported.roster.units.length,2);
 assert.equal(imported.unrecognized.length,0);
 assert.equal(imported.roster.units[0].datasheetId,'space-marines:marneus-calgar');
 assert.equal(imported.roster.units[0].points,180);
 assert.equal(imported.roster.units[1].datasheetId,'space-marines:victrix-honour-guard');
 const game=createGameState({phase:'setup',battle:{id:'calgar-game',status:'setup',round:0},
  players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}]});
 const assigned=applyArmyRosterToBattle(game,{roster:imported.roster,playerId:'p2',
  snapshotId:'calgar-battle-snapshot',selectedAt:'2026-11-03T23:00:00Z'});
 assert.ok(assigned.units.some(unit=>unit.name==='Marneus Calgar'&&unit.ownerId==='p2'));
 assert.ok(assigned.units.some(unit=>unit.name==='Victrix Honour Guard'&&unit.ownerId==='p2'));
 assert.equal(assigned.armyRosters.p2.units.length,2);
 assert.equal(assigned.armyRosters.p2.units[0].points,180);
});
