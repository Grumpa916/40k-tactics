// Current 11e Deathwatch Codex combinations, reviewed from the Warmind card
// supplied 2026-11-25. The June GW pack confirms the replacement structure;
// October weapon values and point surcharges remain cross-checked, not certified.
const sourceUrl='https://warmind.online/d/deathwatch/codex-terminator-squad';
const choice=(name,profiles)=>Object.freeze({name,profiles:Object.freeze(profiles)});
const melee={
  'Power Fist':['Power Fist'],
  'Power Weapon':['Power Weapon'],
  'Chainfist':['Chainfist - Standard','Chainfist - Hunter']
};
const heavy={
  'Assault Cannon':['Assault Cannon'],
  'Heavy Flamer':['Heavy Flamer'],
  'Plasma Cannon':['Plasma Cannon - Standard','Plasma Cannon - Supercharge'],
  'Cyclone Missile Launcher and Storm Bolter':['Cyclone Missile Launcher - Frag','Cyclone Missile Launcher - Krak','Storm Bolter']
};
const regular=[
  choice('Storm Bolter and Power Fist',['Storm Bolter','Power Fist']),
  choice('Storm Bolter and Power Weapon',['Storm Bolter','Power Weapon']),
  choice('Storm Bolter and Chainfist',['Storm Bolter',...melee.Chainfist]),
  choice('Twin Lightning Claws',['Twin Lightning Claws']),
  choice('Thunder Hammer and Storm Shield',['Thunder Hammer'])
];
const heavyChoices=Object.entries(heavy).flatMap(([gun,profiles])=>
  Object.entries(melee).map(([blade,meleeProfiles])=>
    choice(gun+' and '+blade,[...profiles,...meleeProfiles])));
const heavyNames=heavyChoices.map(item=>item.name);
export const DEATHWATCH_TERMINATOR_WARGEAR_RULES=Object.freeze({
  'deathwatch:deathwatch-terminator-squad':Object.freeze({
    reviewedAt:'2026-11-25',
    sourceName:'Warmind current 11e Deathwatch Codex card, user screenshots',
    sourceUrl,
    slots:Object.freeze([Object.freeze({
      id:'model-loadout',perModel:1,choices:Object.freeze([...regular,...heavyChoices])
    })]),
    constraints:Object.freeze([Object.freeze({
      type:'max-combined-per-models',selections:Object.freeze(heavyNames),models:5,maxEach:3
    })]),
    manualWargearNotes:Object.freeze([
      'One Sergeant per squad. Up to three heavy-weapon Terminators per five models.',
      'Thunder Hammer and Storm Shield gives that model 4 Wounds; mixed casualties need model-level tracking.',
      'Cyclone Missile Launcher and Storm Bolter costs +10 points; Thunder Hammer and Storm Shield costs +5 points. Confirm later-copy unit pricing.'
    ])
  })
});
export const getDeathwatchTerminatorWargearRuleSet=id=>DEATHWATCH_TERMINATOR_WARGEAR_RULES[id]??null;
export const getDeathwatchTerminatorWargearSelections=id=>{
  const rules=getDeathwatchTerminatorWargearRuleSet(id);
  return rules?.slots.flatMap(slot=>slot.choices)??[];
};
