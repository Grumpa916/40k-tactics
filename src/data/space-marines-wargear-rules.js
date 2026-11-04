/**
 * Limited 11th-edition selectable Space Marine equipment coverage.
 * These exact slot choices are cross-checked with 11e datasheet data, and
 * the Eradicator's mandatory weapons also appear in the official GW June
 * 2026 Faction Pack. That publication predates the October Codex:
 * do not interpret these rules as a full current Codex certificate.
 *
 * https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Aggressor-Squad
 * https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Terminator-Assault-Squad
 * https://assets.warhammer-community.com/eng_08-06_warhammer40000_faction_pack_space-marines-nd2ezs5yzn-wxe2nf2ckk.pdf
 */
const source={
  reviewedAt:"2026-11-03",
  sourceName:"11e current datasheet cross-check (October Codex full-text comparison pending)",
  sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html",
  verificationLevel:"current-11e-datasheet-cross-check"
};
const pick=(name,profiles=[name])=>Object.freeze({name,profiles:Object.freeze(profiles)});
const fixed=(name,perModel=1,profiles=[name])=>Object.freeze({...pick(name,profiles),perModel});
const slot=(id,choices)=>Object.freeze({id,perModel:1,choices:Object.freeze(choices.map(c=>typeof c==="string"?pick(c):pick(c.name,c.profiles)))});
const sergeantSlot=(id,choices)=>Object.freeze({id,count:1,choices:Object.freeze(choices.map(c=>typeof c==="string"?pick(c):pick(c.name,c.profiles)))});
const nonSergeantFixed=(name,profiles=[name])=>Object.freeze({...fixed(name,1,profiles),count:-1});
const addition=(name,perModels,profiles=[name])=>Object.freeze({...pick(name,profiles),perModels,maxEach:1});
const reviewed=body=>Object.freeze({...source,...body});
export const SPACE_MARINES_WARGEAR_RULES=Object.freeze({
  "space-marines:aggressor-squad": reviewed({
    fixed:Object.freeze([fixed("Twin Power Fists")]),
    slots:Object.freeze([slot("unit-ranged-loadout",[
      {name:"Flamestorm Gauntlets",profiles:["Flamestorm Gauntlets - Close Quarters","Flamestorm Gauntlets - Ranged"]},
      {name:"Auto Boltstorm Gauntlets and Fragstorm Grenade Launcher",profiles:["Auto Boltstorm Gauntlets","Fragstorm Grenade Launcher"]}
    ])]),
    constraints:Object.freeze([Object.freeze({
      type:"same-baseline",
      selections:Object.freeze(["Flamestorm Gauntlets","Auto Boltstorm Gauntlets and Fragstorm Grenade Launcher"])
    })])
  }),
  "space-marines:eradicator-squad-with-heavy-bolters":reviewed({
    sourceName:"GW Space Marines Faction Pack v1.0 p31 (June 2026); 11e October verification pending",
    sourceUrl:"https://assets.warhammer-community.com/eng_08-06_warhammer40000_faction_pack_space-marines-nd2ezs5yzn-wxe2nf2ckk.pdf",
    verificationLevel:"official-june-faction-pack-and-11e-cross-check",
    fixed:Object.freeze([
      fixed("Bolt pistol"),
      fixed("Heavy Bolter"),
      fixed("Close combat weapon")
    ])
  }),

  "space-marines:intercessor-squad":reviewed({
    sourceName:"GW August 2026 Codex preview plus current 11e Intercessor datasheet cross-check",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Intercessor-Squad",
    verificationLevel:"official-codex-preview-and-current-11e-reference",
    fixed:Object.freeze([
      fixed("Bolt Pistol"),
      nonSergeantFixed("Bolt Rifle",["Bolt Rifle - Focused Fire","Bolt Rifle - Saturation"]),
      nonSergeantFixed("Knives and Fists")
    ]),
    slots:Object.freeze([
      sergeantSlot("sergeant-melee",[
        "Knives and Fists","Chainsword","Power Fist","Power Weapon","Thunder Hammer"
      ]),
      sergeantSlot("sergeant-rifle",[
        {name:"Bolt Rifle",profiles:["Bolt Rifle - Focused Fire","Bolt Rifle - Saturation"]},
        "Chainsword","Hand Flamer",
        {name:"Plasma Pistol",profiles:["Plasma Pistol - Standard","Plasma Pistol - Supercharge"]},
        "Power Weapon"
      ])
    ]),
    optional:Object.freeze([
      addition("Grenade Launcher",5,["Grenade Launcher - Frag","Grenade Launcher - Krak"])
    ]),
    constraints:Object.freeze([
      Object.freeze({type:"max-per-models",selection:"Grenade Launcher",models:5,maxEach:1})
    ]),
    manualWargearNotes:Object.freeze([
      "Sergeant replacements affect the Sergeant only; the other 4 or 9 Intercessors keep their Bolt Rifles and Knives and Fists.",
      "Only one regular Intercessor (not the Sergeant) per five models may add a Grenade Launcher.",
      "Focused Fire and Saturation are alternative attacks from the same Bolt Rifle; choose one legal profile when firing."
    ])
  }),
  "space-marines:eradicator-squad-with-melta-rifles":reviewed({
    sourceName:"Current 11e Melta Eradicator datasheet transcription, October official Codex check pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Eradicator-Squad-with-Melta-Rifles",
    fixed:Object.freeze([fixed("Bolt Pistol"),fixed("Ceramite Fists")]),
    slots:Object.freeze([slot("rifle",[
      {name:"Melta Rifle",profiles:["Melta Rifle","Melta Rifle - Hunter"]},
      {name:"Multi-melta",profiles:["Multi-melta","Multi-melta - Hunter"]}
    ])]),
    constraints:Object.freeze([
      Object.freeze({type:"max-per-models",selection:"Multi-melta",models:3,maxEach:1})
    ]),
    manualWargearNotes:Object.freeze([
      "One non-Sergeant Eradicator per three models may replace its Melta Rifle with a Multi-melta.",
      "Hunter profiles target Monster or Vehicle models only; the normal/Hunter entries are modes of one weapon, not extra equipped weapons.",
      "Total Obliteration permits damage-roll re-rolls. Confirm application on the physical tabletop."
    ])
  }),
  "space-marines:terminator-assault-squad":reviewed({
    fixed:Object.freeze([]),
    slots:Object.freeze([slot("model-melee-loadout",[
      "Twin Lightning Claws",
      {name:"Thunder Hammer and Storm Shield",profiles:["Thunder Hammer"]}
    ])]),
    // The shield increases W for the equipped model, not every member.
    // This engine currently has no per-model wounds for mixed units, so
    // that effect must be applied on the physical tabletop.
    modelSpecificWargear:Object.freeze([Object.freeze({
      selection:"Thunder Hammer and Storm Shield",
      effect:"Each model with a storm shield has +1 W; track which models have shields on the tabletop.",
      automaticVitalsApplied:false
    })]),
    pointsAdjustment:Object.freeze({selection:"Thunder Hammer and Storm Shield",perModel:5,
      sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Terminator-Assault-Squad"})
  })
});
export const getSpaceMarinesWargearRuleSet=datasheetId=>SPACE_MARINES_WARGEAR_RULES[datasheetId]??null;
export function getSpaceMarinesWargearSelections(datasheetId){
  const rules=getSpaceMarinesWargearRuleSet(datasheetId);
  if(!rules)return[];
  return [...(rules.fixed??[]),...(rules.slots??[]).flatMap(s=>s.choices??[]),...(rules.optional??[])];
}
