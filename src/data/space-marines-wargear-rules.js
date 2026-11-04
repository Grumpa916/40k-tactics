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
const trooperSlot=(id,choices)=>Object.freeze({id,perModel:1,count:-1,choices:Object.freeze(choices.map(c=>typeof c==="string"?pick(c):pick(c.name,c.profiles)))});
const sergeantFixed=(name,profiles=[name])=>Object.freeze({...pick(name,profiles),count:1});
const addition=(name,perModels,profiles=[name])=>Object.freeze({...pick(name,profiles),perModels,maxEach:1});
const reviewed=body=>Object.freeze({...source,...body});
export const SPACE_MARINES_WARGEAR_RULES=Object.freeze({
  "space-marines:marneus-calgar":reviewed({
    sourceName:"Current 11e Calgar weapon profiles cross-checked with existing Terminator catalog",
    sourceUrl:"https://praetorium.gg/factions/ultramarines/rules/mfm-1-6/datasheets/marneus-calgar-984d-c25",
    fixed:Object.freeze([
      Object.freeze({...pick("Gauntlets of Ultramar",[
        "Gauntlets of Ultramar","Gauntlets of Ultramar - Overhead Smash"]),count:1})
    ]),
    manualWargearNotes:Object.freeze([
      "All three profile rows are attacks from the same equipped Gauntlets, not three separately equipped weapons.",
      "October-era Calgar has multiple doctrine and deployment abilities. Confirm their timing and target conditions on the current Warhammer app."
    ])
  }),
  "space-marines:cato-sicarius":reviewed({
    sourceName:"Current 11e Sicarius profile vs official GW June 2026 Faction Pack",
    sourceUrl:"https://wh-rules.ru/factions/space-marines/datasheets/cato-sicarius",
    fixed:Object.freeze([
      Object.freeze({...pick("Artisan Plasma Pistol"),count:1}),
      Object.freeze({...pick("Talassarian Tempest Blade",[
        "Talassarian Tempest Blade - Strike",
        "Talassarian Tempest Blade - Sweep",
        "Talassarian Tempest Blade - Coup de Grace"
      ]),count:1})
    ]),
    manualWargearNotes:Object.freeze([
      "Choose one Talassarian Tempest Blade attack profile before resolving its melee attacks.",
      "When the army has Marneus Calgar, Sicarius uses Support instead of Leader. Check the actual attachment on the tabletop."
    ])
  }),
  "space-marines:victrix-honour-guard":reviewed({
    sourceName:"GW June 2026 Faction Pack and current 11e Victrix model compositions",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Victrix-Honour-Guard",
    slots:Object.freeze([slot("model-role",[
      {name:"Victrix Honour Guard",profiles:["Master-crafted Bolt Carbine","Master-crafted Power Weapon"]},
      {name:"Chapter Ancient",profiles:["Master-crafted Bolt Carbine","Master-crafted Power Weapon"]},
      {name:"Chapter Champion",profiles:["Blades of Honour"]}
    ])]),
    constraints:Object.freeze([
      Object.freeze({type:"max",selection:"Chapter Ancient",max:1}),
      Object.freeze({type:"max",selection:"Chapter Champion",max:1})
    ]),
    manualWargearNotes:Object.freeze([
      "Choose three or six total models. At most one Chapter Ancient and one Chapter Champion can replace regular Guard.",
      "A Chapter Ancient has the Banner of Macragge; its special bonus, objective effect and one-use timing must be tracked manually.",
      "Victrix with a Chapter Ancient adds 15 army points in the reviewed 11e points table. No roster is changed automatically."
    ])
  }),
  "space-marines:wardens-of-ultramar":reviewed({
    sourceName:"GW June 2026 faction pack six-character composition; current 11e Warden profile comparison",
    sourceUrl:"https://wh-rules.ru/factions/space-marines/datasheets/wardens-of-ultramar",
    fixed:Object.freeze([
      Object.freeze({...pick("Bolt Rifle",["Bolt Rifle - Focused Fire","Bolt Rifle - Saturation"]),count:1}),
      Object.freeze({...pick("Ceramite Fists"),count:1}),
      Object.freeze({...pick("Heavy Bolt Pistol"),count:1}),
      Object.freeze({...pick("Master-crafted Power Weapon"),count:1}),
      Object.freeze({...pick("Archeotech Laspistol"),count:3}),
      Object.freeze({...pick("Power Weapon"),count:2}),
      Object.freeze({...pick("Astropathic Blast"),count:1}),
      Object.freeze({...pick("Force Stave"),count:1}),
      Object.freeze({...pick("Ultramarian Combat Weapons"),count:1})
    ]),
    manualWargearNotes:Object.freeze([
      "Six named Wardens have different Toughness, Save, Wounds, OC and invulnerable saves. Use individual model stats and record allocated casualties on the tabletop.",
      "Dainal Kornelius has Psychic attacks; Veteran Sergeant Metaurus has a Storm Shield, while Gaius Silva has a Refractor Field.",
      "Wardens use Support with the eligible infantry named on their current datasheet; the live game must not infer a joined unit from this fixed weapon list."
    ])
  }),
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
  "space-marines:bladeguard-veteran-squad":reviewed({
    sourceName:"Current 11e Bladeguard Veteran Squad datasheet; official October Codex direct text not yet checked",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Bladeguard-Veteran-Squad",
    fixed:Object.freeze([
      fixed("Master-crafted Power Sword"),
      nonSergeantFixed("Heavy Bolt Pistol")
    ]),
    slots:Object.freeze([sergeantSlot("bladeguard-sergeant-pistol",[
      "Heavy Bolt Pistol","Neo-volkite Pistol",
      {name:"Plasma Pistol",profiles:["Plasma Pistol - Standard","Plasma Pistol - Supercharge"]}
    ])]),
    manualWargearNotes:Object.freeze([
      "Only the Bladeguard Veteran Sergeant can exchange their Heavy Bolt Pistol for a Neo-volkite or Plasma Pistol.",
      "The unit's 4+ invulnerable save is printed on the datasheet; its once-per-turn melee offence/defence choice must be resolved on the tabletop."
    ])
  }),
  "space-marines:hellblaster-squad":reviewed({
    sourceName:"Current 11e Hellblaster Squad datasheet; October Codex direct check outstanding",
    sourceUrl:"https://wh-rules.ru/factions/space-marines/datasheets/hellblaster-squad",
    fixed:Object.freeze([
      nonSergeantFixed("Bolt Pistol"),
      fixed("Plasma Incinerator",1,["Plasma Incinerator - Standard","Plasma Incinerator - Supercharge"]),
      fixed("Ceramite Fists")
    ]),
    slots:Object.freeze([sergeantSlot("hellblaster-sergeant-pistol",[
      "Bolt Pistol",
      {name:"Plasma Pistol",profiles:["Plasma Pistol - Standard","Plasma Pistol - Supercharge"]}
    ])]),
    manualWargearNotes:Object.freeze([
      "Only the Hellblaster Sergeant may replace a Bolt Pistol with a Plasma Pistol.",
      "Plasma Standard and Supercharge are alternate firing profiles of a single equipped gun. Hazardous rolls and Rites of Thermal Appeasement remain player-confirmed."
    ])
  }),
  "space-marines:terminator-squad":reviewed({
    sourceName:"Current 11e Terminator Squad datasheet; October Codex direct check outstanding",
    sourceUrl:"https://wh-rules.ru/factions/space-marines/datasheets/terminator-squad",
    fixed:Object.freeze([sergeantFixed("Storm Bolter")]),
    slots:Object.freeze([
      sergeantSlot("terminator-sergeant-melee",[
        "Power Fist",
        {name:"Chainfist",profiles:["Chainfist - Standard","Chainfist - Hunter"]},
        "Power Weapon"
      ]),
      trooperSlot("terminator-trooper-melee",[
        "Power Fist",
        {name:"Chainfist",profiles:["Chainfist - Standard","Chainfist - Hunter"]}
      ]),
      trooperSlot("terminator-trooper-ranged",[
        "Storm Bolter","Assault Cannon","Heavy Flamer",
        {name:"Cyclone Missile Launcher and Storm Bolter",profiles:[
          "Storm Bolter","Cyclone Missile Launcher - Frag","Cyclone Missile Launcher - Krak"
        ]}
      ])
    ]),
    constraints:Object.freeze([Object.freeze({
      type:"max-combined-per-models",
      selections:Object.freeze(["Assault Cannon","Heavy Flamer","Cyclone Missile Launcher and Storm Bolter"]),
      models:5,maxEach:1
    })]),
    pointsAdjustment:Object.freeze({
      selection:"Cyclone Missile Launcher and Storm Bolter",
      perModel:10,maxPerModels:5,
      sourceUrl:"https://wh-rules.ru/factions/space-marines/datasheets/terminator-squad"
    }),
    manualWargearNotes:Object.freeze([
      "Only non-Sergeant Terminators can carry the heavy weapons; at most one per five squad models across all three heavy-weapon types.",
      "A Cyclone Missile Launcher keeps its model's Storm Bolter. Frag and Krak are alternative missile firing profiles.",
      "Chainfist Hunter attacks require a Monster or Vehicle target. Keep the Teleport Homer placement and Rapid Ingress timing manual."
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
