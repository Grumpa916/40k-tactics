import test from 'node:test';
import assert from 'node:assert/strict';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';

test('imports matched Warhammer App unit lines with catalog datasheets and preserves source text',()=>{
 const source=`TYRANIDS\nInvasion Fleet\nBattle Size: Strike Force 2,000 points\n10x Termagants · 60 pts\n1x Neurotyrant (115 points)\nHive Tyrant — 195 points\nWargear: Heavy venom cannon`;
 const {roster,unrecognized}=importWarhammerAppRoster({text:source,faction:'Tyranids',name:'Game list',pointsLimit:2000,id:'imported',createdAt:'now'});
 assert.equal(roster.units.length,3);assert.equal(unrecognized.length,0);assert.match(roster.notes,/Heavy venom cannon/);
 assert.equal(roster.units[0].name,'Termagants');assert.equal(roster.units[0].modelCount,10);assert.equal(roster.units[0].points,60);assert.ok(roster.units[0].datasheet?.characteristics);
 assert.equal(roster.units[1].modelCount,1);assert.equal(roster.units[1].points,115);assert.equal(roster.units[2].points,195);
});
test('reports unmatched point lines and refuses unsupported faction or empty match',()=>{
 const parsed=importWarhammerAppRoster({text:'Tyranids\n10x Termagants 60 pts\nUnlisted Unit 42 points',faction:'Tyranids',name:'List',id:'r'});
 assert.equal(parsed.roster.units.length,1);assert.deepEqual(parsed.unrecognized,['Unlisted Unit 42 points']);
 assert.throws(()=>importWarhammerAppRoster({text:'Some army 100 points',faction:'Space Wolves',id:'r'}),/no unit names/i);
 assert.throws(()=>importWarhammerAppRoster({text:'Termagants 60 points',faction:'Space Marines',id:'r'}),/No unit names matched/);
});
test('keeps unpriced roster units marked unknown instead of estimating a cost',()=>{
 const parsed=importWarhammerAppRoster({text:'Neurotyrant',faction:'Tyranids',name:'Known cost',id:'r'});
 assert.equal(parsed.roster.units[0].points,120); // The exact catalog cost matches the catalog's default model count.
 const unknown=importWarhammerAppRoster({text:'Captain',faction:'Space Marines',name:'Unknown cost',id:'r2'});
 assert.equal(unknown.roster.units[0].points,null);
});
