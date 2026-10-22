import test from 'node:test';
import assert from 'node:assert/strict';
import { isCommonAbilityName, orderAbilitiesForDisplay, renderUnitDetails } from '../../src/ui/army-unit-details.js';

const ability=(name)=>({name,description:`${name} text`});

const hiveTyrant={
 id:'hive-tyrant',name:'Hive Tyrant',defaultPoints:195,pointsOptions:[],
 datasheet:{
  characteristics:{Move:'8"',Toughness:10,Save:'2+',Wounds:10,Leadership:'7+','Objective Control':3},
  weapons:[],keywords:['Character','Monster','Synapse'],
  abilities:[
   ability('Leader'),
   ability('Deadly Demise D3'),
   ability('Shadow in the Warp'),
   ability('Synapse'),
   ability('Will of the Hive Mind'),
   ability('Onslaught (Aura, Psychic)')
  ]
 }
};

test('special unit abilities render before common abilities under one Abilities heading',()=>{
 const ordered=orderAbilitiesForDisplay(hiveTyrant.datasheet.abilities).map(a=>a.name);
 assert.deepEqual(ordered,[
  'Will of the Hive Mind',
  'Onslaught (Aura, Psychic)',
  'Leader',
  'Deadly Demise D3',
  'Shadow in the Warp',
  'Synapse'
 ]);
 const html=renderUnitDetails(hiveTyrant);
 assert.equal((html.match(/<h4>Abilities<\/h4>/g)??[]).length,1);
 assert.doesNotMatch(html,/Special abilities|Core \/ army abilities/);
 assert.ok(html.indexOf('Will of the Hive Mind') < html.indexOf('Leader'));
 assert.ok(html.indexOf('Onslaught \(Aura, Psychic\)') < html.indexOf('Synapse'));
});

test('common ability classifier recognizes core and repeated faction abilities',()=>{
 for(const name of ['Leader','Deadly Demise 1','Deadly Demise D6','Shadow in the Warp','Synapse','Deep Strike','Scouts 8 inches','Infiltrators','Lone Operative','Stealth','Fights First','Feel No Pain 5+']) {
  assert.equal(isCommonAbilityName(name),true,name);
 }
 for(const name of ['Will of the Hive Mind','Onslaught (Aura, Psychic)','Guardian Organism','Alpha Warrior','Blistering Assault','Hypnotic Gaze']) {
  assert.equal(isCommonAbilityName(name),false,name);
 }
});

test('source order is preserved inside special and common buckets',()=>{
 const ordered=orderAbilitiesForDisplay([
  ability('Synapse'),ability('Special B'),ability('Leader'),ability('Special A'),ability('Deep Strike')
 ]).map(a=>a.name);
 assert.deepEqual(ordered,['Special B','Special A','Synapse','Leader','Deep Strike']);
});
