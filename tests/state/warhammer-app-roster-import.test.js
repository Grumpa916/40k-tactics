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

test('real App v2.8.1 export imports 16 entries, 2000 points and both attached pairs', async()=>{
 const {readFile}=await import('node:fs/promises');
 const text=await readFile(new URL('../fixtures/warhammer-app-triple-norn.txt',import.meta.url),'utf8');
 const result=importWarhammerAppRoster({text,faction:'Tyranids',name:'triple norn 11th',pointsLimit:2000,id:'real'});
 const {roster}=result;
 assert.equal(roster.units.length,16);
 assert.equal(result.totalPoints,2000);assert.equal(result.declaredPoints,2000);
 assert.deepEqual(result.unrecognized,[]);assert.deepEqual(result.warnings,[]);
 assert.equal(roster.detachment,'Crusher Stampede and Talons of the Norn Queen');
 assert.deepEqual(roster.units.filter(u=>u.name==='Hormagaunts').map(u=>u.modelCount),[20,20,20]);
 assert.equal(roster.units.reduce((n,u)=>n+u.modelCount,0),73);
 const primes=roster.units.filter(u=>u.name==='Tyranid Prime with Lash Whip');
 assert.equal(primes.length,2);
 assert.notEqual(primes[0].attachedToBodyguardId,primes[1].attachedToBodyguardId);
 for(const prime of primes){assert.deepEqual(roster.units.find(u=>u.id===prime.attachedToBodyguardId).attachedLeaderIds,[prime.id]);assert.match(prime.notes,/1x Lash whip/);}
 assert.equal(roster.units.filter(u=>u.name==='Lictor').length,2);
 assert.equal(roster.units.filter(u=>u.name==='Norn Emissary').length,1);
 assert.equal(roster.units.find(u=>u.name==='Hive Tyrant').isWarlord,true);
 assert.match(roster.units.find(u=>u.name==='Norn Emissary').notes,/Psychic Tendril/);
 assert.equal(roster.notes.endsWith(text),true);
});
test('weapon lines cannot create units and an incomplete group or points mismatch is flagged',()=>{
 const {roster,warnings,unrecognized}=importWarhammerAppRoster({text:'Example (100 Points)\nATTACHED UNITS\nAttached unit 1\nLictor (60 Points)\n  • Attached as: Leader (Character)\n  • 1x Lictor claws and talons\nUncataloged bodyguard (40 Points)\n  • Attached as: Bodyguard (Battleline)',faction:'Tyranids',name:'Example',id:'r'});
 assert.equal(roster.units.length,1);assert.equal(roster.units[0].attachedToBodyguardId,undefined);
 assert.deepEqual(unrecognized,['Uncataloged bodyguard (40 Points)']);
 assert.ok(warnings.some(w=>w.includes('pairing')));assert.ok(warnings.some(w=>w.includes('100')));
});
