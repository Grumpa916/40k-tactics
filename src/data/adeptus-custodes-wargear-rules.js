const REVIEWED_AT='2026-10-23';
const SOURCE='https://orpheax.github.io/custobuilder/datasheets.html';
const selection=(name,profiles=[name])=>Object.freeze({name,profiles:Object.freeze(profiles)});
const fixed=(name,{perModel=0,count=0,profiles=[name]}={})=>Object.freeze({...selection(name,profiles),perModel,count});
const slot=(id,{count=0,perModel=0,choices=[]}={})=>Object.freeze({id,count,perModel,choices:Object.freeze(choices.map(choice=>typeof choice==='string'?selection(choice):selection(choice.name,choice.profiles)))});
const optional=(name,{perModel=1,allOrNone=false,profiles=[name]}={})=>Object.freeze({...selection(name,profiles),perModel,allOrNone});
const rule=(body)=>Object.freeze({reviewedAt:REVIEWED_AT,sourceName:'October 2026 Adeptus Custodes codex/app-derived wargear options',sourceUrl:SOURCE,...body});
const pair=(name,ranged,melee)=>({name,profiles:[ranged,melee]});
const combos=(combinations,message='Selected wargear does not match a legal reviewed equipment combination.')=>Object.freeze({type:'allowed-combinations',combinations:Object.freeze(combinations.map(item=>Object.freeze(item))),message});

export const ADEPTUS_CUSTODES_WARGEAR_RULES=Object.freeze({
 'adeptus-custodes:blade-champion':rule({fixed:Object.freeze([fixed('Vaultswords',{count:1,profiles:['Vaultswords – Behemor','Vaultswords – Hurricanis','Vaultswords – Victus']})])}),
 'adeptus-custodes:shield-captain':rule({
  optional:Object.freeze([
   optional('Guardian Spear',{profiles:['Guardian Spear (ranged)','Guardian Spear']}),
   optional('Castellan Axe',{profiles:['Castellan Axe (ranged)','Castellan Axe']}),
   optional('Pyrithite Spear',{profiles:['Pyrithite Spear (ranged)','Pyrithite Spear']}),
   optional('Eternity-pattern Paragon Blade'),
   optional('Praesidium Shield',{profiles:[]})
  ]),
  constraints:Object.freeze([combos([
   {'Guardian Spear':1},
   {'Castellan Axe':1},
   {'Pyrithite Spear':1,'Praesidium Shield':1},
   {'Eternity-pattern Paragon Blade':1,'Praesidium Shield':1}
  ],'Shield-Captain wargear must match one legal weapon/shield loadout.')])
 }),
 'adeptus-custodes:shield-captain-in-allarus-terminator-armour':rule({
  fixed:Object.freeze([fixed('Balistus Grenade Launcher',{count:1})]),
  slots:Object.freeze([slot('main-weapon',{count:1,choices:[pair('Guardian Spear','Guardian Spear (ranged)','Guardian Spear'),pair('Castellan Axe','Castellan Axe (ranged)','Castellan Axe')]})])
 }),
 'adeptus-custodes:shield-captain-on-dawneagle-jetbike':rule({
  fixed:Object.freeze([fixed('Interceptor Lance',{count:1})]),
  slots:Object.freeze([slot('ranged-weapon',{count:1,choices:['Salvo Launcher','Hurricane Bolter']})])
 }),
 'adeptus-custodes:custodian-guard-sodality':rule({
  fixed:Object.freeze([fixed('Guardian Spear',{perModel:1,profiles:['Guardian Spear (ranged)','Guardian Spear']})]),
  optional:Object.freeze([optional('Vexilla',{profiles:[]})]),constraints:Object.freeze([Object.freeze({type:'max',selection:'Vexilla',max:1})])
 }),
 'adeptus-custodes:sentinel-guard-sodality':rule({
  fixed:Object.freeze([fixed('Sentinel Blade',{perModel:1,profiles:['Sentinel Blade (ranged)','Sentinel Blade']})]),
  optional:Object.freeze([optional('Vexilla',{profiles:[]})]),constraints:Object.freeze([Object.freeze({type:'max',selection:'Vexilla',max:1})])
 }),
 'adeptus-custodes:custodian-wardens':rule({
  slots:Object.freeze([slot('unit-weapon',{perModel:1,choices:[pair('Guardian Spear','Guardian Spear (ranged)','Guardian Spear'),pair('Castellan Axe','Castellan Axe (ranged)','Castellan Axe')]})]),
  optional:Object.freeze([optional('Vexilla',{profiles:[]})]),constraints:Object.freeze([
   Object.freeze({type:'same-baseline',selections:Object.freeze(['Guardian Spear','Castellan Axe'])}),Object.freeze({type:'max',selection:'Vexilla',max:1})
  ])
 }),
 'adeptus-custodes:allarus-custodians':rule({
  fixed:Object.freeze([fixed('Balistus Grenade Launcher',{perModel:1})]),
  slots:Object.freeze([slot('main-weapon',{perModel:1,choices:[pair('Guardian Spear','Guardian Spear (ranged)','Guardian Spear'),pair('Castellan Axe','Castellan Axe (ranged)','Castellan Axe')]})]),
  optional:Object.freeze([optional('Vexilla',{profiles:[]})]),constraints:Object.freeze([Object.freeze({type:'max',selection:'Vexilla',max:1})])
 }),
 'adeptus-custodes:aquilon-terminators-with-solarite-power-talons':rule({
  fixed:Object.freeze([fixed('Solarite Power Talon',{perModel:1})]),
  slots:Object.freeze([slot('ranged-weapon',{perModel:1,choices:['Lastrum Storm Bolter','Infernus Firepike']})])
 }),
 'adeptus-custodes:vertus-praetors':rule({
  fixed:Object.freeze([fixed('Interceptor Lance',{perModel:1})]),
  slots:Object.freeze([slot('ranged-weapon',{perModel:1,choices:['Salvo Launcher','Hurricane Bolter']})])
 }),
 'adeptus-custodes:gyrfalcon-jetbike-sodality':rule({
  fixed:Object.freeze([fixed('Solarite Power Lance',{perModel:1})]),
  slots:Object.freeze([slot('ranged-weapon',{perModel:1,choices:['Lastrum Bolt Cannon','Adrathic Devastator','Arachnus Volley Cannon','Twin Corvae Las-pulser']})])
 }),
 'adeptus-custodes:contemptor-achillus-dreadnought':rule({
  fixed:Object.freeze([fixed('Dreadspear',{count:1,profiles:['Dreadspear (ranged)','Dreadspear']})]),
  optional:Object.freeze([
   optional('Lastrum Storm Bolter',{perModel:2}),
   optional('Adrathic Combi-destructor',{perModel:2}),
   optional('Twin Infernus Incinerator',{perModel:2})
  ]),
  constraints:Object.freeze([combos([
   {'Lastrum Storm Bolter':2},
   {'Adrathic Combi-destructor':2},
   {'Twin Infernus Incinerator':2}
  ],'Achillus arm weapons must be two matching reviewed weapons.')])
 }),
 'adeptus-custodes:telemon-heavy-dreadnought':rule({
  fixed:Object.freeze([fixed('Spiculus Bolt Launcher',{count:1})]),
  optional:Object.freeze([
   optional('Dual Caestus Fists'),
   optional('Caestus Fist'),
   optional('Twin Neutronium Cascade Projectors',{perModel:2}),
   optional('Adrathic Desolator'),
   optional('Arachnus Storm Cannon'),
   optional('Iliastus Accelerator Culverin')
  ]),
  constraints:Object.freeze([combos([
   {'Dual Caestus Fists':1,'Twin Neutronium Cascade Projectors':2},
   {'Caestus Fist':1,'Twin Neutronium Cascade Projectors':1,'Adrathic Desolator':1},
   {'Caestus Fist':1,'Twin Neutronium Cascade Projectors':1,'Arachnus Storm Cannon':1},
   {'Caestus Fist':1,'Twin Neutronium Cascade Projectors':1,'Iliastus Accelerator Culverin':1}
  ],'Telemon arm weapons must match one legal reviewed paired loadout.')])
 }),
 'adeptus-custodes:pallas-grav-attack':rule({fixed:Object.freeze([fixed('Armoured Hull',{count:1})]),slots:Object.freeze([slot('main-gun',{count:1,choices:['Twin Arachnus Blaze Cannon','Twin Iliastus Accelerator Fusil']})])}),
 'adeptus-custodes:caladius-grav-tank':rule({
  fixed:Object.freeze([fixed('Armoured Hull',{count:1}),fixed('Iliastus Accelerator Cannon',{count:1})]),
  slots:Object.freeze([slot('secondary-gun',{count:1,choices:['Twin Lastrum Bolt Cannon','Twin Neutronium Cascade Projectors']})])
 }),
 'adeptus-custodes:caladius-annihilator-grav-tank':rule({
  fixed:Object.freeze([fixed('Armoured Hull',{count:1}),fixed('Arachnus Blaze Carronade',{count:1})]),
  slots:Object.freeze([slot('secondary-gun',{count:1,choices:['Twin Lastrum Bolt Cannon','Twin Neutronium Cascade Projectors']})])
 }),
 'adeptus-custodes:coronus-grav-carrier':rule({
  fixed:Object.freeze([fixed('Armoured Hull',{count:1}),fixed('Twin Arachnus Blaze Cannon',{count:1})]),
  slots:Object.freeze([slot('secondary-gun',{count:1,choices:['Twin Lastrum Bolt Cannon','Twin Neutronium Cascade Projectors']})])
 }),
 'adeptus-custodes:knight-centura':rule({
  optional:Object.freeze([
   optional('Executioner Greatblade'),optional('Master-crafted Boltgun'),optional('Master-crafted Flamer'),optional('Gun Stock')
  ]),
  constraints:Object.freeze([combos([
   {'Executioner Greatblade':1},
   {'Master-crafted Boltgun':1,'Gun Stock':1},
   {'Master-crafted Flamer':1,'Gun Stock':1}
  ],'Knight-Centura wargear must match one legal reviewed weapon loadout.')])
 }),
 'adeptus-custodes:anathema-psykana-rhino':rule({
  fixed:Object.freeze([fixed('Armoured Tracks',{count:1}),fixed('Storm Bolter',{count:1})]),
  optional:Object.freeze([optional('Hunter-killer Missile',{perModel:1})]),constraints:Object.freeze([Object.freeze({type:'max',selection:'Hunter-killer Missile',max:1})])
 }),
 'adeptus-custodes:venerable-land-raider':rule({
  fixed:Object.freeze([fixed('Armoured Tracks',{count:1}),fixed('Godhammer Lascannon',{count:2}),fixed('Twin Heavy Bolter',{count:1})]),
  optional:Object.freeze([optional('Hunter-killer Missile'),optional('Storm Bolter')]),constraints:Object.freeze([
   Object.freeze({type:'max',selection:'Hunter-killer Missile',max:1}),Object.freeze({type:'max',selection:'Storm Bolter',max:1})
  ])
 }),
 'adeptus-custodes:venerable-contemptor-dreadnought':rule({
  fixed:Object.freeze([fixed('Combi-bolter',{count:1}),fixed('Contemptor Fist',{count:1})]),
  slots:Object.freeze([slot('main-gun',{count:1,choices:['Multi-melta','Kheres-pattern Assault Cannon']})])
 })
});

export function getAdeptusCustodesWargearRuleSet(datasheetId){return ADEPTUS_CUSTODES_WARGEAR_RULES[datasheetId]??null;}
export function getAdeptusCustodesWargearSelections(datasheetId){
 const rules=getAdeptusCustodesWargearRuleSet(datasheetId);if(!rules)return[];
 const values=[...(rules.fixed??[]),...(rules.optional??[]),...(rules.slots??[]).flatMap(item=>item.choices??[])];
 const seen=new Set();return values.filter(item=>{const key=item.name.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;});
}
