const REVIEWED_AT='2026-10-23';
const SOURCE='https://orpheax.github.io/custobuilder/datasheets.html';
const selection=(name,profiles=[name])=>Object.freeze({name,profiles:Object.freeze(profiles)});
const fixed=(name,{perModel=0,count=0,profiles=[name]}={})=>Object.freeze({...selection(name,profiles),perModel,count});
const slot=(id,{count=0,perModel=0,choices=[]}={})=>Object.freeze({id,count,perModel,choices:Object.freeze(choices.map(choice=>typeof choice==='string'?selection(choice):selection(choice.name,choice.profiles)))});
const optional=(name,{perModel=1,allOrNone=false,profiles=[name]}={})=>Object.freeze({...selection(name,profiles),perModel,allOrNone});
const rule=(body)=>Object.freeze({reviewedAt:REVIEWED_AT,sourceName:'October 2026 Adeptus Custodes codex/app-derived wargear options',sourceUrl:SOURCE,...body});
const pair=(name,ranged,melee)=>({name,profiles:[ranged,melee]});

export const ADEPTUS_CUSTODES_WARGEAR_RULES=Object.freeze({
 'adeptus-custodes:blade-champion':rule({fixed:Object.freeze([fixed('Vaultswords',{count:1,profiles:['Vaultswords – Behemor','Vaultswords – Hurricanis','Vaultswords – Victus']})])}),
 'adeptus-custodes:shield-captain':rule({slots:Object.freeze([slot('weapon-loadout',{count:1,choices:[
  {name:'Pyrithite Spear & Praesidium Shield',profiles:['Pyrithite Spear (ranged)','Pyrithite Spear']},
  {name:'Eternity-pattern Paragon Blade & Praesidium Shield',profiles:['Eternity-pattern Paragon Blade']},
  pair('Castellan Axe','Castellan Axe (ranged)','Castellan Axe'),
  pair('Guardian Spear','Guardian Spear (ranged)','Guardian Spear')
 ]})])}),
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
  slots:Object.freeze([slot('paired-arm-weapons',{count:1,choices:[
   {name:'2 Lastrum Storm Bolter',profiles:['Lastrum Storm Bolter','Lastrum Storm Bolter']},
   {name:'2 Adrathic Combi-destructor',profiles:['Adrathic Combi-destructor','Adrathic Combi-destructor']},
   {name:'2 Twin Infernus Incinerator',profiles:['Twin Infernus Incinerator','Twin Infernus Incinerator']}
  ]})])
 }),
 'adeptus-custodes:telemon-heavy-dreadnought':rule({
  fixed:Object.freeze([fixed('Spiculus Bolt Launcher',{count:1})]),
  slots:Object.freeze([slot('arm-loadout',{count:1,choices:[
   {name:'Dual Caestus Fists & 2 Twin Neutronium Cascade Projectors',profiles:['Dual Caestus Fists','Twin Neutronium Cascade Projectors','Twin Neutronium Cascade Projectors']},
   {name:'Adrathic Desolator & Caestus Fist',profiles:['Adrathic Desolator','Caestus Fist','Twin Neutronium Cascade Projectors']},
   {name:'Arachnus Storm Cannon & Caestus Fist',profiles:['Arachnus Storm Cannon','Caestus Fist','Twin Neutronium Cascade Projectors']},
   {name:'Iliastus Accelerator Culverin & Caestus Fist',profiles:['Iliastus Accelerator Culverin','Caestus Fist','Twin Neutronium Cascade Projectors']}
  ]})])
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
 'adeptus-custodes:knight-centura':rule({slots:Object.freeze([slot('weapon-loadout',{count:1,choices:[
  'Executioner Greatblade',
  {name:'Master-crafted Boltgun & Gun Stock',profiles:['Master-crafted Boltgun','Gun Stock']},
  {name:'Master-crafted Flamer & Gun Stock',profiles:['Master-crafted Flamer','Gun Stock']}
 ]})])}),
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
