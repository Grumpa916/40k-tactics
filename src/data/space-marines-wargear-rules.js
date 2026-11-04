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
  "space-marines:sternguard-veteran-squad":reviewed({
    sourceName:"Current 11e Sternguard Veteran Squad datasheet cross-check; official October Codex pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Sternguard-Veteran-Squad",
    fixed:Object.freeze([
      fixed("Bolt Pistol"),
      nonSergeantFixed("Ceramite Fists"),
      sergeantFixed("Artificer Firearm",[
        "Artificer Firearm - Infernus","Artificer Firearm - Purgatus","Artificer Firearm - Damnatus"
      ])
    ]),
    slots:Object.freeze([
      sergeantSlot("sternguard-sergeant-melee",["Chainsword","Power Fist","Power Weapon"]),
      trooperSlot("sternguard-veteran-ranged",[
        {name:"Artificer Firearm",profiles:[
          "Artificer Firearm - Infernus","Artificer Firearm - Purgatus","Artificer Firearm - Damnatus"
        ]},
        "Heavy Bolter","Pyrecannon"
      ])
    ]),
    constraints:Object.freeze([Object.freeze({
      type:"max-combined-per-models",
      selections:Object.freeze(["Heavy Bolter","Pyrecannon"]),models:5,maxEach:1
    })]),
    manualWargearNotes:Object.freeze([
      "Only the Sergeant can exchange their Chainsword for a Power Fist or Power Weapon.",
      "At most one regular Veteran per five squad models can replace an Artificer Firearm with a Heavy Bolter or Pyrecannon. The Sergeant retains the Artificer Firearm.",
      "Artificer Firearm Infernus, Purgatus and Damnatus are alternate modes of the same weapon, not three separately equipped guns.",
      "Veteran Marksmen rerolls ranged hit rolls of 1; resolve actual rerolls on the tabletop."
    ])
  }),
  "space-marines:inceptor-squad":reviewed({
    sourceName:"Current 11e Inceptor Squad comparison; October Codex direct verification pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Inceptor-Squad",
    fixed:Object.freeze([fixed("Ceramite Fists")]),
    slots:Object.freeze([slot("inceptor-ranged",[
      "Assault Bolters",
      {name:"Plasma Exterminators",profiles:[
        "Plasma Exterminators - Standard","Plasma Exterminators - Supercharge"
      ]}
    ])]),
    manualWargearNotes:Object.freeze([
      "Each Inceptor can replace its Assault Bolters with Plasma Exterminators. Select equipment per model.",
      "Standard and Supercharge are alternate Plasma Exterminator attacks, not separate equipped weapons.",
      "Meteoric Descent and Parabolic Jetleap movement windows are manual. Hazardous attacks require tabletop confirmation.",
      "Independent October-era references disagree on Inceptor points. Existing prices are preserved pending direct current GW Munitorum Field Manual comparison."
    ])
  }),
  "space-marines:eliminator-squad":reviewed({
    sourceName:"Current 11e Eliminator Squad comparison; October Codex direct verification pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Eliminator-Squad",
    fixed:Object.freeze([fixed("Bolt Pistol"),fixed("Ceramite Fists")]),
    slots:Object.freeze([
      sergeantSlot("eliminator-sergeant-ranged",[
        "Bolt Sniper Rifle","Instigator Bolt Carbine","Las Fusil"
      ]),
      trooperSlot("eliminator-trooper-ranged",[
        "Bolt Sniper Rifle","Las Fusil"
      ])
    ]),
    manualWargearNotes:Object.freeze([
      "Only the Eliminator Sergeant may replace its Bolt Sniper Rifle with an Instigator Bolt Carbine. Regular Eliminators may replace theirs with Las Fusils.",
      "Instigator Precision and non-Monster/Vehicle Lethal Hits target conditions require player confirmation.",
      "Chameleoline Cloaks and Special-issue Optics and Ammunition choices are reminders; do not automatically adjust range or attacks."
    ])
  }),
  "space-marines:incursor-squad":reviewed({
    sourceName:"Current 11e Incursor Squad datasheet transcription; full current official Codex comparison pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Incursor-Squad",
    fixed:Object.freeze([
      fixed("Bolt Pistol"),fixed("Occulus Bolt Carbine"),fixed("Paired Combat Blades")
    ]),
    manualWargearNotes:Object.freeze([
      "All models have fixed equipment. The Haywire Mine is a once-per-battle unit ability, not an optional mine purchased for one model.",
      "Divinator-class Auspexes can scan one visible enemy within 18 inches when an Astartes unit is selected to shoot; confirm the once-per-phase window.",
      "Scouts 6 inches applies during deployment. Neither Haywire Mine nor its effect is automatically resolved."
    ])
  }),
  "space-marines:infiltrator-squad":reviewed({
    sourceName:"Current 11e Infiltrator Squad datasheet transcription; full current official Codex comparison pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Infiltrator-Squad",
    fixed:Object.freeze([
      fixed("Bolt Pistol"),fixed("Marksman Bolt Carbine"),fixed("Ceramite Fists")
    ]),
    optional:Object.freeze([
      Object.freeze({...pick("Helix Gauntlet"),maxTotal:1})
    ]),
    manualWargearNotes:Object.freeze([
      "At most one Helix Gauntlet per unit regardless of squad size. The current 11th-edition datasheet does not offer the older Infiltrator Comms Array.",
      "The Helix Gauntlet can restore D3 wounds in the Command phase; apply the heal manually.",
      "Omni-scramblers now mark one visible enemy within 18 inches as detected (+3-inch detection range); do not apply the old reserve-exclusion ability."
    ])
  }),
  "space-marines:reiver-squad":reviewed({
    sourceName:"Current 11e Reiver Squad datasheet transcription; full current official Codex comparison pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Reiver-Squad",
    fixed:Object.freeze([
      fixed("Bolt Carbine"),fixed("Special-issue Bolt Pistol"),fixed("Monomolecular Combat Knife")
    ]),
    optional:Object.freeze([
      Object.freeze({...pick("Grav-chutes"),maxTotal:1}),
      Object.freeze({...pick("Grapnel Launchers"),maxTotal:1})
    ]),
    manualWargearNotes:Object.freeze([
      "All models keep their fixed Bolt Carbines, Special-issue Bolt Pistols and Monomolecular Combat Knives; no 10th-edition knife/carbine replacement is offered.",
      "A squad can take one Grav-chutes selection and one Grapnel Launchers selection. They are unit-wide abilities, not extra weapons for every model.",
      "Grav-chutes grant Deep Strike. Grapnel Launchers affect movement; Terror Troops modifies nearby enemy OC and Fearsome Assault requires a Battle-shock roll. Resolve them manually."
    ])
  }),
  "space-marines:drop-pod":reviewed({
    reviewedAt:"2026-11-04",sourceName:"Current 11e independent datasheet cross-check; official Codex/Forge World text verification pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Drop-Pod",
    noEquipment:true,
    fixed:Object.freeze([]),,
    manualWargearNotes:Object.freeze(["This 11e Drop Pod has NO ranged or melee weapons and no selectable wargear. No manual weapon confirmation is required.","Must start in Strategic Reserves; may ingress in your first Movement phase. On setup all passengers must disembark beyond 8 inches from enemies; cannot embark again afterward.","Transport 12 ADEPTUS ASTARTES INFANTRY, excludes GRAVIS, JUMP PACK and TERMINATOR. Deadly Demise 1 and first-three vs fourth-plus copy prices are manual."])
  }),
  "space-marines:impulsor":reviewed({
    reviewedAt:"2026-11-04",sourceName:"Current 11e independent datasheet cross-check; official Codex/Forge World text verification pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Impulsor",
    fixed:Object.freeze([fixed("Armoured Hull")]),
    slots:Object.freeze([slot("impulsor-side-guns",["Storm Bolters","Fragstorm Grenade Launchers"])]),
    optional:Object.freeze([Object.freeze({...pick("Bellicatus Missile Array",["Bellicatus Missile Array - Frag","Bellicatus Missile Array - Icarus","Bellicatus Missile Array - Krak"]),maxTotal:1}),Object.freeze({...pick("Orbital Comms Array",[]),maxTotal:1}),Object.freeze({...pick("Ironhail Skytalon Array",["Ironhail Skytalon Array"]),maxTotal:1}),Object.freeze({...pick("Shield Dome",[]),maxTotal:1}),Object.freeze({...pick("Ironhail Heavy Stubber",["Ironhail Heavy Stubber"]),maxTotal:1})]),,
    constraints:Object.freeze([{"type":"max-combined-per-models","selections":["Bellicatus Missile Array","Orbital Comms Array","Ironhail Skytalon Array","Shield Dome"],"models":1,"maxEach":1}]),
    manualWargearNotes:Object.freeze(["Select at most ONE Bellicatus Missile Array, Orbital Comms Array, Ironhail Skytalon Array or Shield Dome; no selection is also legal. Orbital Comms adds 10 points and grants Scouts 6 inches; Shield Dome grants 5+ invulnerable and is not an attack.","Storm Bolters can be replaced with Fragstorm Grenade Launchers; Ironhail Heavy Stubber is a separate optional addition. Bellicatus Frag/Icarus/Krak modes represent one array, not three equipped weapons.","Rapid Disembarkation permits shock disembark after an advance. Firing Deck 7; capacity 7 ADEPTUS ASTARTES INFANTRY excluding TERMINATOR/JUMP PACK, GRAVIS counts double. No automatic map/CP/scoring changes."])
  }),
  "space-marines:rhino":reviewed({
    reviewedAt:"2026-11-04",sourceName:"Current 11e independent datasheet cross-check; official Codex/Forge World text verification pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Rhino",
    fixed:Object.freeze([fixed("Armoured Tracks"),fixed("Storm Bolter")]),
    optional:Object.freeze([Object.freeze({...pick("Hunter-killer Missile",["Hunter-killer Missile"]),maxTotal:1})]),,
    manualWargearNotes:Object.freeze(["Hunter-killer Missile is optional (one maximum) and One Shot; fixed Storm Bolter and Armoured Tracks remain equipped.","Veiling Smoke: once per phase, this unit can use Smokescreen at -1 CP without blocking other uses; trigger manually.","Firing Deck 2 and transport 12 ADEPTUS ASTARTES INFANTRY excluding GRAVIS, JUMP PACK and TERMINATOR; Deadly Demise D3."])
  }),
  "space-marines:land-speeder":reviewed({
    reviewedAt:"2026-11-04",sourceName:"Current 11e independent datasheet cross-check; official Codex/Forge World text verification pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Land-Speeder",
    fixed:Object.freeze([fixed("Armoured Impact"),fixed("Multi-melta"),fixed("Stormfury Missile Launcher")]),
    slots:Object.freeze([slot("land-speeder-main",["Onslaught Gatling Cannon","Pyrecannon"])]),,
    manualWargearNotes:Object.freeze(["Only 11e swap is Onslaught Gatling Cannon OR Pyrecannon. Multi-melta, Stormfury Missile Launcher and Armoured Impact remain fixed; do not use older 10e Typhoon/Tornado options.","Purgation Run: after shooting, the Speeder may make a normal move up to D6 inches but then cannot charge this turn. Resolve manually; Deep Strike applies at deployment."])
  }),
  "space-marines:storm-speeder-hailstrike":reviewed({
    reviewedAt:"2026-11-04",sourceName:"Current 11e independent datasheet cross-check; official Codex/Forge World text verification pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Storm-Speeder-Hailstrike",
    fixed:Object.freeze([fixed("Armoured Impact"),fixed("Fragstorm Grenade Launchers"),fixed("Ironhail Heavy Stubber Array"),fixed("Onslaught Gatling Cannon")]),,
    manualWargearNotes:Object.freeze(["Four fixed 11e weapons, no optional swaps. Hailstrike: after shooting, select an enemy hit by this unit; friendly ADEPTUS ASTARTES ranged attacks targeting it gain Ignores Cover.","All three ranged weapons already have Ignores Cover; only Onslaught Gatling Cannon has conditional Devastating Wounds against non-MONSTER/VEHICLE. Deep Strike, Deadly Demise D3 manual."])
  }),
  "space-marines:storm-speeder-hammerstrike":reviewed({
    reviewedAt:"2026-11-04",sourceName:"Current 11e independent datasheet cross-check; official Codex/Forge World text verification pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Storm-Speeder-Hammerstrike",
    fixed:Object.freeze([fixed("Armoured Impact"),fixed("Hammerstrike Missile Launcher"),fixed("Krakstorm Grenade Launchers"),fixed("Melta Destroyer")]),,
    manualWargearNotes:Object.freeze(["Four fixed 11e weapons, no optional swaps. Hammerstrike: this unit's ranged attacks against an enemy unit within a terrain area gain Sustained Hits 1.","Melta Destroyer is a three-shot S10 AP-3 D3+2 Melta 3 weapon, not a single-shot Multi-melta. Deep Strike and Deadly Demise D3 manual."])
  }),
  "space-marines:storm-speeder-thunderstrike":reviewed({
    reviewedAt:"2026-11-04",sourceName:"Current 11e independent datasheet cross-check; official Codex/Forge World text verification pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Storm-Speeder-Thunderstrike",
    fixed:Object.freeze([fixed("Armoured Impact"),fixed("Stormfury Missile Launcher"),fixed("Thunderstrike Icarus Rocket Pod"),fixed("Thunderstrike Las-talon")]),,
    manualWargearNotes:Object.freeze(["Four fixed weapons. Thunderstrike: this unit's ranged attacks targeting MONSTER/VEHICLE get +1 to wound.","Shattered Defences: after shooting, select an enemy MONSTER/VEHICLE hit; friendly ADEPTUS ASTARTES ranged attacks targeting that unit gain +1 AP. Track selected target manually."])
  }),
  "space-marines:astraeus":reviewed({
    reviewedAt:"2026-11-04",sourceName:"Current 11e independent datasheet cross-check; official Codex/Forge World text verification pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Astraeus",
    fixed:Object.freeze([fixed("Armoured Hull"),fixed("Ironhail Heavy Stubber"),fixed("Storm Bolter"),fixed("Twin Macro-accelerator Cannon")]),
    slots:Object.freeze([Object.freeze({id:"astraeus-paired-main",count:2,choices:Object.freeze([{"name":"Astareus Las-ripper","profiles":["Astareus Las-ripper"]},{"name":"Plasma Eradicator","profiles":["Plasma Eradicator - Standard","Plasma Eradicator - Supercharge"]}])}),slot("astraeus-twin-gun",["Twin Heavy Bolter","Twin Lascannon"])]),
    optional:Object.freeze([Object.freeze({...pick("Additional Ironhail Heavy Stubber",["Ironhail Heavy Stubber"]),maxTotal:1})]),,
    constraints:Object.freeze([{"type":"same-baseline","selections":["Astareus Las-ripper","Plasma Eradicator"]}]),
    manualWargearNotes:Object.freeze(["Two Astareus Las-rippers must BOTH be exchanged for two Plasma Eradicators; a mixed pair is illegal. Plasma Standard/Supercharge are attack modes of each Plasma Eradicator.","Twin Heavy Bolter can be replaced by Twin Lascannon. Independent source lists one default Ironhail Heavy Stubber and an option to add one; the additional gun is shown separately to preserve both attacks, pending direct official Forge World comparison.","Suppression Fire: after firing Twin Macro-accelerator Cannon, select one enemy HIT by that weapon; suppressed enemy attacks get -1 to hit until next turn. 5+ invulnerable applies to ranged attacks only. Damaged 8, Deadly Demise D6+2 manual."])
  }),
  "space-marines:thunderhawk-gunship":reviewed({
    reviewedAt:"2026-11-04",sourceName:"Current 11e independent datasheet cross-check; official Codex/Forge World text verification pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Thunderhawk-Gunship",
    fixed:Object.freeze([fixed("Armoured Hull"),fixed("Hellstrike Missile Battery"),fixed("Lascannon",2),fixed("Twin Heavy Bolter",4)]),
    slots:Object.freeze([slot("thunderhawk-main",["Thunderhawk Heavy Cannon","Turbo-laser Destructor"])]),
    optional:Object.freeze([Object.freeze({...pick("Additional Hellstrike Missile Battery (replaces Cluster Bombs)",["Hellstrike Missile Battery"]),maxTotal:1})]),,
    manualWargearNotes:Object.freeze(["Main Thunderhawk Heavy Cannon can be exchanged for Turbo-laser Destructor. Two Lascannons, four Twin Heavy Bolters and one Hellstrike Missile Battery stay equipped.","Independent 11e reference repeats the main-gun swap and ambiguously describes replacing Thunderhawk Cluster Bombs with an additional Hellstrike Missile Battery. Present this as explicit optional replacement, NOT a free second missile battery; direct GW Forge World confirmation remains necessary.","Aerial Assault disembark after normal move requires every embarked model to have Deep Strike. Cluster Bombs are not available if replaced; otherwise crossing an enemy on a normal/advance may deal mortal wounds after rolling six D6 (3+). Transport 30 infantry or mounted; JUMP PACK/GRAVIS/TERMINATOR take 2, MOUNTED 4. Damaged 10, Deadly Demise D6+2 manual."])
  }),
  "space-marines:techmarine":reviewed({
    reviewedAt:"2026-11-04",sourceName:"Current 11e independent datasheet cross-check; official Codex/Forge World text verification pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Techmarine",
    fixed:Object.freeze([fixed("Forge Bolter"),fixed("Grav-pistol"),fixed("Omnissian Power Axe and Servo-arm")]),,
    manualWargearNotes:Object.freeze(["Fixed 11e wargear; no equipment swaps. Grav-pistol Anti-Vehicle 2+ and CLOSE-QUARTERS; axe and servo-arm form ONE combined melee weapon profile.","While within 3 inches of friendly ADEPTUS ASTARTES VEHICLE, the Techmarine has Lone Operative. Blessings of the Omnissiah at start/end of its Movement can heal D3 wounds on a friendly VEHICLE within 3 inches and grant hit/wound modifier immunity until next Movement. Apply manually.","Leader may join Assault Intercessors, Desolation Squad or Intercessor Squad (other chapter-specific options separately); no automatic vehicle attachment."])
  }),
  "space-marines:repulsor":reviewed({
    reviewedAt:"2026-11-04",
    sourceName:"11e Space Marines Repulsor datasheet transcription review; official GW Codex/MFM direct verification pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Repulsor",
    fixed:Object.freeze([fixed("Armoured Hull"),fixed("Defensive Array"),fixed("Hunter-slayer Missile")]),
    slots:Object.freeze([
      slot("repulsor-primary-gun",["Heavy Onslaught Gatling Cannon","Las-talon"]),
      slot("repulsor-secondary-gun",["Twin Heavy Bolter","Twin Lascannon"])
    ]),
    manualWargearNotes:Object.freeze([
      "The 11e Repulsor always carries Armoured Hull, Defensive Array and one Hunter-slayer Missile. Pick Heavy Onslaught Gatling Cannon OR Las-talon and independently Twin Heavy Bolter OR Twin Lascannon.",
      "Hunter-slayer Missile is One Shot with Indirect Fire. Track its once-per-battle use manually.",
      "Combat Embarkation triggers in the OPPONENT Charge phase when a friendly unengaged infantry charge target is wholly within 3 inches and eligible to embark. The enemy may select new charge targets. Do not auto-move on the live map.",
      "Capacity 14 ADEPTUS ASTARTES INFANTRY, excludes JUMP PACK, GRAVIS/TERMINATOR count double. Damaged 6 and Deadly Demise D6 remain manual."
    ])
  }),
  "space-marines:repulsor-executioner":reviewed({
    reviewedAt:"2026-11-04",
    sourceName:"11e Space Marines Repulsor Executioner datasheet transcription review; official GW Codex/MFM direct verification pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Repulsor-Executioner",
    fixed:Object.freeze([fixed("Armoured Hull"),fixed("Defensive Array"),fixed("Heavy Onslaught Gatling Cannon"),fixed("Twin Heavy Bolter")]),
    slots:Object.freeze([
      slot("executioner-main-gun",[
        "Heavy Laser Destroyer",
        {name:"Macro Plasma Incinerator",profiles:["Macro Plasma Incinerator - Standard","Macro Plasma Incinerator - Supercharge"]}
      ])
    ]),
    pointsAdjustment:Object.freeze({
      selection:"Heavy Laser Destroyer",perModel:10,
      sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Repulsor-Executioner"
    }),
    manualWargearNotes:Object.freeze([
      "The 11e Executioner keeps Armoured Hull, Defensive Array, Heavy Onslaught Gatling Cannon and Twin Heavy Bolter. Choose exactly one Heavy Laser Destroyer OR Macro Plasma Incinerator.",
      "The HEAVY LASER DESTROYER, not the plasma, costs +10 points above the 260 first/second or 280 third+ base. Retain any old saved roster's points until the player reviews and saves.",
      "Macro Plasma Incinerator Standard and Supercharge are alternative profiles of the same gun. Supercharge is Hazardous.",
      "Executioner grants +1 to hit rolls for ranged attacks targeting a unit NOT below half-strength. Check the target's actual models/wounds manually.",
      "Capacity 7 ADEPTUS ASTARTES INFANTRY, no JUMP PACK, GRAVIS/TERMINATOR occupy two spaces. Damaged 6 and Deadly Demise D6 are manual."
    ])
  }),
  "space-marines:land-raider":reviewed({
    reviewedAt:"2026-11-04",
    sourceName:"11e Space Marines Land-Raider datasheet cross-check; direct official October Codex/MFM pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Land-Raider",
    fixed:Object.freeze([fixed("Armoured Tracks"),fixed("Godhammer Lascannon",2),fixed("Twin Heavy Bolter")]),
    optional:Object.freeze(["Hunter-killer Missile","Multi-melta","Storm Bolter"].map(name=>Object.freeze({...pick(name),maxTotal:1}))),
    manualWargearNotes:Object.freeze(["Two Godhammer Lascannons and Twin Heavy Bolter remain mandatory; Hunter-killer Missile, Multi-melta and Storm Bolter are separately optional.","Power of the Machine Spirit: re-roll one ranged hit and one ranged wound roll; do not auto-record rerolls.","Assault Ramp: after this model finishes a normal move, embarked infantry can assault disembark. Transport capacity 14, no JUMP PACK models, GRAVIS/TERMINATOR models count double.","Hunter-killer Missile is One Shot; Damaged 6 and Deadly Demise D6 remain manually resolved."])
  }),
  "space-marines:land-raider-crusader":reviewed({
    reviewedAt:"2026-11-04",
    sourceName:"11e Space Marines Land-Raider-Crusader datasheet cross-check; direct official October Codex/MFM pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Land-Raider-Crusader",
    fixed:Object.freeze([fixed("Armoured Tracks"),fixed("Hurricane Bolter",2),fixed("Twin Assault Cannon")]),
    optional:Object.freeze(["Hunter-killer Missile","Multi-melta","Storm Bolter"].map(name=>Object.freeze({...pick(name),maxTotal:1}))),
    manualWargearNotes:Object.freeze(["Two Hurricane Bolters and Twin Assault Cannon are fixed, with optional Hunter-killer Missile, Multi-melta and Storm Bolter.","Fury of the Machine Spirit grants ranged Lethal Hits only against a target within 12 inches.","Assault Ramp and transport 16 infantry, excluding JUMP PACK, double space for GRAVIS/TERMINATOR. Cross-check anomalous Crusader Multi-melta D3+3 against printed Codex before certification.","Hunter-killer Missile is One Shot; Damaged 6 and Deadly Demise D6 remain manually resolved."])
  }),
  "space-marines:land-raider-redeemer":reviewed({
    reviewedAt:"2026-11-04",
    sourceName:"11e Space Marines Land-Raider-Redeemer datasheet cross-check; direct official October Codex/MFM pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/Land-Raider-Redeemer",
    fixed:Object.freeze([fixed("Armoured Tracks"),fixed("Flamestorm Cannon",2),fixed("Twin Assault Cannon")]),
    optional:Object.freeze(["Hunter-killer Missile","Multi-melta","Storm Bolter"].map(name=>Object.freeze({...pick(name),maxTotal:1}))),
    manualWargearNotes:Object.freeze(["Two Flamestorm Cannons and Twin Assault Cannon are fixed; Hunter-killer Missile, Multi-melta and Storm Bolter are each independently optional.","Wrath of the Machine Spirit grants ranged Devastating Wounds against non-MONSTER/VEHICLE units only if they are within 12 inches.","Assault Ramp and capacity 14 infantry, excluding JUMP PACK, double space for GRAVIS/TERMINATOR.","Hunter-killer Missile is One Shot; Damaged 6 and Deadly Demise D6 remain manually resolved."])
  }),
  "space-marines:gladiator-lancer":reviewed({
    reviewedAt:"2026-11-04",
    sourceName:"Current 11e Space Marines Gladiator Lancer datasheet cross-check; official Codex/MFM direct certification pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Gladiator-Lancer",
    fixed:Object.freeze([fixed("Defensive Array"),fixed("Laser Destroyer"),fixed("Armoured Hull")]),
    manualWargearNotes:Object.freeze([
      "The 11e Lancer has exactly one Defensive Array, one Laser Destroyer and one Armoured Hull. No optional Ironhail Heavy Stubber, Icarus Rocket Pod, Multi-melta or old Storm Bolter swap in this Space Marines datasheet.",
      "Aquilon Optics: against MONSTER or VEHICLE targets, this unit may re-roll one Hit roll, one Wound roll and one Damage roll. It does not grant generic re-rolls against all targets.",
      "Apply Damaged 4 and Deadly Demise D3 manually; do not restore older 10e hit-roll damage threshold wording."
    ])
  }),
  "space-marines:gladiator-reaper":reviewed({
    reviewedAt:"2026-11-04",
    sourceName:"Current 11e Space Marines Gladiator Reaper datasheet cross-check; official Codex/MFM direct certification pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Gladiator-Reaper",
    fixed:Object.freeze([fixed("Defensive Array"),fixed("Twin Heavy Onslaught Gatling Cannon"),fixed("Armoured Hull")]),
    manualWargearNotes:Object.freeze([
      "The 11e Reaper has exactly one Defensive Array (12 shots and Rapid Fire 12), Twin Heavy Onslaught Gatling Cannon and Armoured Hull; no extra optional secondary guns.",
      "The Twin Heavy Onslaught Gatling Cannon gains Sustained Hits 2 and Devastating Wounds against non-MONSTER/VEHICLE units. Those conditions are not active against MONSTERS or VEHICLES.",
      "Reaping Tally: ranged attacks targeting units other than MONSTERS or VEHICLES have +1 AP. Confirm the target keyword manually before estimating attacks.",
      "Damaged 4 and Deadly Demise D3 remain manual."
    ])
  }),
  "space-marines:gladiator-valiant":reviewed({
    reviewedAt:"2026-11-04",
    sourceName:"Current 11e Space Marines Gladiator Valiant datasheet cross-check; official Codex/MFM direct certification pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Gladiator-Valiant",
    fixed:Object.freeze([fixed("Defensive Array"),fixed("Multi-melta",2),fixed("Twin Las-talon"),fixed("Armoured Hull")]),
    manualWargearNotes:Object.freeze([
      "The current 11e Valiant has one Defensive Array, TWO Multi-meltas, one Twin Las-talon and one Armoured Hull. There are no optional Icarus or Ironhail additions in the current standard Space Marines sheet.",
      "Priority Target Acquisition gives the unit's ranged attacks +1 Strength against targets within 12 inches. It is not the older rule granting +1 to hit the closest MONSTER or VEHICLE.",
      "Both Multi-meltas have Melta 3 and Damage D3+2; Twin Las-talon has Twin-linked and Damage D3+3. Confirm the appropriate half-range Melta bonus on the tabletop.",
      "Damaged 4 and Deadly Demise D3 remain manual."
    ])
  }),
  "space-marines:invictor-tactical-warsuit":reviewed({
    sourceName:"Current 11e Invictor Tactical Warsuit datasheet cross-check; official October Codex comparison pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Invictor-Tactical-Warsuit",
    fixed:Object.freeze([
      fixed("Fragstorm Grenade Launcher"),fixed("Heavy Bolter"),
      fixed("Invictor Fist"),fixed("Ironhail Heavy Stubbers")
    ]),
    slots:Object.freeze([slot("invictor-primary-gun",["Incendium Cannon","Twin Ironhail Autocannon"])]),
    manualWargearNotes:Object.freeze([
      "The only 11e weapon swap is Incendium Cannon OR Twin Ironhail Autocannon. Fragstorm Grenade Launcher, Heavy Bolter, Ironhail Heavy Stubbers and Invictor Fist stay equipped.",
      "Scouts 8 inches is a deployment ability, not an extra movement option in every phase. Damaged 4 and Deadly Demise D3 resolve manually.",
      "At the start of the first battle round, Forward Assault Warsuit marks one enemy. Attacks at that mark can re-roll wound rolls of 1, and it can re-mark when the target is destroyed. Confirm target/timing manually."
    ])
  }),
  "space-marines:firestrike-servo-turrets":reviewed({
    sourceName:"Current 11e Firestrike Servo-turrets 11th Warhammer App transcription; full direct October Codex comparison pending",
    sourceUrl:"https://www.40k.app/995/factions/space-marines/units/firestrike-servo-turrets",
    fixed:Object.freeze([fixed("Hovering Bulk")]),
    slots:Object.freeze([slot("firestrike-main-gun",["Twin Firestrike Las-talon","Twin Firestrike Autocannon"])]),
    manualWargearNotes:Object.freeze([
      "For each one or two Servo-turrets, select one Twin Firestrike Las-talon OR Twin Firestrike Autocannon; every model retains Hovering Bulk melee.",
      "Firestrike Sentinel Protocols is once per phase and lets this unit use Fire Overwatch even if used elsewhere, with snap shooting hitting on unmodified 4+. Resolve the stratagem window and eligibility manually.",
      "Do not use the old 10e 3-inch Move, 75/150 point totals, D6+1 las-talon or old Fire Overwatch rule."
    ])
  }),
  "space-marines:invader-atvs":reviewed({
    sourceName:"Current 11e Invader ATVs datasheet cross-check; direct official Codex/MFM certification pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Invader-ATVs",
    fixed:Object.freeze([fixed("Armoured Impact"),fixed("Bolt Pistol"),fixed("Twin Bolt Rifle")]),
    slots:Object.freeze([slot("invader-main-gun",["Onslaught Gatling Cannon","Multi-melta"])]),
    pointsAdjustment:Object.freeze({
      selection:"Multi-melta",perModel:5,
      sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Invader-ATVs"
    }),
    manualWargearNotes:Object.freeze([
      "One or two ATVs in the unit. Every model has Armoured Impact, Bolt Pistol and Twin Bolt Rifle. Its Onslaught Gatling Cannon may independently be replaced with a Multi-melta (+5 points each).",
      "Aggressive Reconnaissance adds +1 to wound rolls for this unit's ranged attacks only when the enemy target is not within 6 inches of ANY other enemy unit. Check actual opponent positions manually.",
      "Twin Bolt Rifle is Ballistic Skill 2+ in the current 11e profile; the anti-vehicle Multi-melta uses Strength 10, AP -3, Damage D3+2 and Melta 3."
    ])
  }),
  "space-marines:ballistus-dreadnought":reviewed({
    sourceName:"Current 11e Ballistus Dreadnought datasheet cross-check; direct official Codex/MFM certification pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Ballistus-Dreadnought",
    fixed:Object.freeze([
      fixed("Ballistus Lascannon"),
      fixed("Ballistus Missile Launcher",1,["Ballistus Missile Launcher - Frag","Ballistus Missile Launcher - Krak"]),
      fixed("Storm Bolters"),fixed("Armoured Feet")
    ]),
    manualWargearNotes:Object.freeze([
      "Ballistus has four mandatory weapons and no selectable equipment swaps in the current 11e datasheet.",
      "Ballistus Missile Launcher Frag and Krak are alternative profiles of ONE launcher; do not allocate both as independently equipped guns.",
      "Ballistus Strike grants Sustained Hits 1 only to ranged attacks against a target within 24 inches. Confirm range when evaluating attacks; this is not a permanent weapon characteristic.",
      "Damaged 4 and Deadly Demise D3 are separate core rules; resolve actual table results manually."
    ])
  }),
  "space-marines:brutalis-dreadnought":reviewed({
    sourceName:"Current 11e Brutalis Dreadnought datasheet cross-check; full official October Codex comparison pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html",
    fixed:Object.freeze([fixed("Twin Icarus Ironhail Heavy Stubber")]),
    slots:Object.freeze([
      slot("brutalis-primary-loadout",[
        {name:"Bolt Rifles and Brutalis Fists",profiles:["Bolt Rifles","Brutalis Fists"]},
        {name:"Brutalis Talons",profiles:["Brutalis Talons"]}
      ]),
      slot("brutalis-ranged",["Twin Heavy Bolter","Twin Multi-melta"])
    ]),
    manualWargearNotes:Object.freeze([
      "The Bolt Rifles and Brutalis Fists are a linked pair: taking Brutalis Talons replaces BOTH together, not merely the fists. Talons are a single melee profile in current 11e.",
      "Twin Heavy Bolter can be swapped for Twin Multi-melta independently of the linked melee loadout.",
      "Brutalis Charge no longer automatically rolls mortal wounds: once per phase this unit may use Crushing Impact even if used elsewhere, at -1 CP, without blocking other uses. Confirm available CP, eligibility and stratagem timing manually.",
      "Damaged 4 and Deadly Demise D3 are manually resolved; no old 10e Brutalis Charge mortal wounds are automatically inferred."
    ])
  }),
  "space-marines:redemptor-dreadnought":reviewed({
    sourceName:"Current 11e Redemptor Dreadnought datasheet cross-check; direct official October Codex verification pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Redemptor-Dreadnought",
    fixed:Object.freeze([fixed("Redemptor Fist")]),
    slots:Object.freeze([
      slot("redemptor-launchers",["Fragstorm Grenade Launchers","Storm Bolters"]),
      slot("redemptor-secondary-gun",["Heavy Flamer","Onslaught Gatling Cannon"]),
      slot("redemptor-main-gun",[
        "Heavy Onslaught Gatling Cannon",
        {name:"Macro Plasma Incinerator",profiles:["Macro Plasma Incinerator - Standard","Macro Plasma Incinerator - Supercharge"]}
      ])
    ]),
    optional:Object.freeze([Object.freeze({...pick("Icarus Rocket Pod"),maxTotal:1})]),
    pointsAdjustment:Object.freeze({
      selection:"Macro Plasma Incinerator",perModel:10,
      sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Redemptor-Dreadnought"
    }),
    manualWargearNotes:Object.freeze([
      "Select one launcher (Fragstorm Grenade Launchers OR Storm Bolters), one secondary gun (Heavy Flamer OR Onslaught Gatling Cannon), and one main gun (Heavy Onslaught Gatling Cannon OR Macro Plasma Incinerator). Redemptor Fist stays equipped.",
      "An Icarus Rocket Pod may be added once; its attacks only exist if selected. It does not replace another weapon.",
      "Macro Plasma Incinerator adds 10 points to the selected copy's 170 or 190 base price. Standard and Supercharge are alternative firing modes of ONE gun, not two guns.",
      "Duty Eternal: attacks targeting this unit have -1 to wound rolls only when Strength is GREATER than Toughness; this replaces the older 10e -1 Damage effect.",
      "Damaged 4 and Deadly Demise D3 require tabletop handling; no automatic game-state mutation."
    ])
  }),
  "space-marines:assault-intercessor-squad":reviewed({
    sourceName:"Current 11e Assault Intercessor Squad datasheet cross-check",
    sourceUrl:"https://www.40k.app/995/factions/space-marines/units/assault-intercessor-squad",
    fixed:Object.freeze([nonSergeantFixed("Heavy Bolt Pistol"),nonSergeantFixed("Chainsword")]),
    slots:Object.freeze([
      sergeantSlot("assault-intercessor-sergeant-pistol",[
        "Heavy Bolt Pistol","Hand Flamer",
        {name:"Plasma Pistol",profiles:["Plasma Pistol - Standard","Plasma Pistol - Supercharge"]}
      ]),
      sergeantSlot("assault-intercessor-sergeant-melee",["Chainsword","Power Fist","Power Weapon","Thunder Hammer"])
    ]),
    manualWargearNotes:Object.freeze([
      "Only the Sergeant may swap their Heavy Bolt Pistol for a Hand Flamer or Plasma Pistol, or their Chainsword for a Power Fist, Power Weapon or Thunder Hammer.",
      "Plasma Standard and Supercharge are one equipped pistol's alternative attack modes, not two pistols.",
      "Targeted Intercession adds +1 Strength and +1 AP to this unit's melee attacks only if it made a charge move this turn. Confirm charge and combat manually."
    ])
  }),
  "space-marines:heavy-intercessor-squad":reviewed({
    sourceName:"Current 11e Heavy Intercessor Squad equipment and profiles cross-check",
    sourceUrl:"https://www.40k.app/995/factions/space-marines/units/heavy-intercessor-squad",
    fixed:Object.freeze([fixed("Bolt Pistol"),fixed("Ceramite Fists"),sergeantFixed("Heavy Bolt Rifle")]),
    slots:Object.freeze([trooperSlot("heavy-intercessor-ranged",["Heavy Bolt Rifle","Heavy Bolter"])]),
    constraints:Object.freeze([
      Object.freeze({type:"max-per-models",selection:"Heavy Bolter",models:5,maxEach:1})
    ]),
    manualWargearNotes:Object.freeze([
      "Only ordinary Heavy Intercessors can replace a Heavy Bolt Rifle with a Heavy Bolter. At most one per five squad models. The Sergeant always keeps their Heavy Bolt Rifle.",
      "Unyielding in the Face of the Foe: +1 to armour save rolls while this unit controls an objective. Confirm control manually at the appropriate time."
    ])
  }),
  "space-marines:infernus-squad":reviewed({
    sourceName:"Current 11e Infernus Squad fixed equipment and profiles cross-check",
    sourceUrl:"https://www.40k.app/995/factions/space-marines/units/infernus-squad",
    fixed:Object.freeze([fixed("Bolt Pistol"),fixed("Ceramite Fists"),fixed("Pyreblaster")]),
    manualWargearNotes:Object.freeze([
      "Each model has exactly one Bolt Pistol, Pyreblaster and Ceramite Fists. No 11th-edition selectable weapon changes are on this datasheet.",
      "Pyreblaster now has Blast 1 and Torrent, with three attacks; do not restore the old 10th-edition D6 profile.",
      "Driven from Cover triggers after this unit shoots and hits an enemy unit; friendly Astartes ranged attacks targeting it Ignore Cover. Confirm the chosen enemy and hits manually."
    ])
  }),
  "space-marines:desolation-squad":reviewed({
    sourceName:"Current 11e Desolation Squad fixed-size rocket loadout cross-check",
    sourceUrl:"https://www.40k.app/995/factions/space-marines/units/desolation-squad",
    fixed:Object.freeze([fixed("Bolt Pistol"),fixed("Ceramite Fists"),fixed("Castellan Launcher")]),
    slots:Object.freeze([
      sergeantSlot("desolation-sergeant-rocket",["Superfrag Rocket Launcher","Superkrak Rocket Launcher","Vengor Launcher"]),
      trooperSlot("desolation-marine-rocket",["Superfrag Rocket Launcher","Superkrak Rocket Launcher"])
    ]),
    pointsAdjustment:Object.freeze({selection:"Vengor Launcher",perModel:5,sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html"}),
    manualWargearNotes:Object.freeze([
      "Exactly five models. The Sergeant can take a Vengor Launcher in place of either rocket launcher; ordinary Desolation Marines can choose Superfrag or Superkrak only.",
      "Each model retains one Castellan Launcher. A Vengor Launcher adds 5 points to this unit's cost; third+ copies have their own 10-point increase.",
      "Targeter Optics grants Ignores Cover against visible units. Indirect Fire for Vengor remains subject to the tabletop visibility rules."
    ])
  }),
  "space-marines:company-heroes":reviewed({
    sourceName:"Current 11e Company Heroes four-role fixed equipment cross-check",
    sourceUrl:"https://www.40k.app/995/factions/space-marines/units/company-heroes",
    fixed:Object.freeze([
      Object.freeze({...pick("Master-crafted Bolt Pistol"),count:4}),
      Object.freeze({...pick("Master-crafted Bolt Rifle"),count:2}),
      Object.freeze({...pick("Master-crafted Heavy Bolter"),count:1}),
      Object.freeze({...pick("Combat Knife"),count:3}),
      Object.freeze({...pick("Master-crafted Power Weapon"),count:1})
    ]),
    manualWargearNotes:Object.freeze([
      "Exactly four distinct models: Ancient, Company Champion, Company Veteran with Bolt Rifle, and Company Veteran with Heavy Bolter.",
      "The Ancient and bolt-rifle Veteran each have Bolt Pistol, Bolt Rifle and Combat Knife; the Champion has Bolt Pistol and Master-crafted Power Weapon; the heavy-bolter Veteran has Bolt Pistol, Heavy Bolter and Combat Knife.",
      "Current 11e Company Heroes have no selectable wargear options. The Ancient/Champion carry model-specific keywords; do not infer which model suffers wounds from aggregate unit health.",
      "Command Squad applies -1 to wound rolls for attacks targeting this unit. Raise the Banner secures an objective at the end of Movement if controlled; confirm manually. Do not restore older 10e Captain-required text."
    ])
  }),
  "space-marines:assault-intercessors-with-jump-packs":reviewed({
    sourceName:"Current 11e Jump Pack Assault Intercessors datasheet cross-check; October Codex official full-text comparison pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html",
    fixed:Object.freeze([nonSergeantFixed("Chainsword")]),
    slots:Object.freeze([
      sergeantSlot("jump-assault-sergeant-melee",["Chainsword","Power Fist","Power Weapon"]),
      sergeantSlot("jump-assault-sergeant-pistol",[
        "Heavy Bolt Pistol","Hand Flamer",
        {name:"Sergeant Plasma Pistol",profiles:["Plasma Pistol - Standard","Plasma Pistol - Supercharge"]}
      ]),
      trooperSlot("jump-assault-trooper-pistol",[
        "Heavy Bolt Pistol",
        {name:"Plasma Pistol",profiles:["Plasma Pistol - Standard","Plasma Pistol - Supercharge"]}
      ])
    ]),
    constraints:Object.freeze([
      Object.freeze({type:"max-per-models",selection:"Plasma Pistol",models:5,maxEach:1})
    ]),
    manualWargearNotes:Object.freeze([
      "The Sergeant alone may take a Hand Flamer or Sergeant Plasma Pistol in place of their Heavy Bolt Pistol, and a Power Fist or Power Weapon instead of the Chainsword.",
      "For every five models, at most one ordinary Jump Pack Intercessor may replace its Heavy Bolt Pistol with a Plasma Pistol. Sergeant Plasma Pistol is deliberately named separately in the picker to enforce independent limits.",
      "Standard and Supercharge are alternate attack modes of one equipped plasma pistol; never count either mode as a second gun.",
      "Hammer of Wrath triggers after a charge move; count engaged models and resolve each 4+ mortal wound roll on the tabletop. Deep Strike and Doctrine timing remain manual."
    ])
  }),
  "space-marines:vanguard-veteran-squad-with-jump-packs":reviewed({
    sourceName:"Current 11e Vanguard Veterans with Jump Packs datasheet cross-check; October Codex official full-text comparison pending",
    sourceUrl:"https://wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html",
    fixed:Object.freeze([nonSergeantFixed("Master-crafted Power Weapon")]),
    slots:Object.freeze([
      sergeantSlot("jump-vanguard-sergeant-melee",["Relic Blade","Power Fist","Thunder Hammer"]),
      sergeantSlot("jump-vanguard-sergeant-pistol",[
        "Heavy Bolt Pistol",
        {name:"Sergeant Plasma Pistol",profiles:["Plasma Pistol - Standard","Plasma Pistol - Supercharge"]},
        {name:"Combat Shield",profiles:[]}
      ]),
      trooperSlot("jump-vanguard-trooper-pistol",[
        "Heavy Bolt Pistol",
        {name:"Plasma Pistol",profiles:["Plasma Pistol - Standard","Plasma Pistol - Supercharge"]},
        {name:"Combat Shield",profiles:[]}
      ])
    ]),
    constraints:Object.freeze([
      Object.freeze({type:"max-per-models",selection:"Plasma Pistol",models:5,maxEach:2})
    ]),
    modelSpecificWargear:Object.freeze([
      Object.freeze({selection:"Combat Shield",effect:"Each equipped model has a 5+ invulnerable save. Do not apply a unit-wide invulnerable save automatically.",automaticVitalsApplied:false})
    ]),
    manualWargearNotes:Object.freeze([
      "Only the Sergeant can exchange the Relic Blade for a Power Fist or Thunder Hammer; all regular Veterans keep their Master-crafted Power Weapons.",
      "The Sergeant has an independent Plasma Pistol option; up to two ordinary Veterans for every five squad models may replace their Heavy Bolt Pistols with Plasma Pistols.",
      "Any model may instead replace its Heavy Bolt Pistol with a Combat Shield, which grants a 5+ invulnerable save only to that model. Track mixed allocations manually.",
      "Older 10th-edition Storm Shields, Grav-pistols, Hand Flamers and Inferno Pistols are not options on this reviewed 11e datasheet.",
      "Vanguard Assault adds one melee Attack only in a turn this unit made a charge move; confirm the charge before adjusting combat expectations."
    ])
  }),
  "space-marines:scout-squad":reviewed({
    sourceName:"Scout Squad 11e datasheet cross-check; October Codex direct comparison pending",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Scout-Squad",
    fixed:Object.freeze([fixed("Bolt Pistol"),nonSergeantFixed("Combat Knife")]),
    slots:Object.freeze([
      sergeantSlot("scout-sergeant-ranged",["Boltgun","Shotgun"]),
      sergeantSlot("scout-sergeant-melee",["Combat Knife","Chainsword"]),
      trooperSlot("scout-ranged",[
        "Boltgun","Shotgun","Sniper Rifle","Heavy Bolter",
        {name:"Missile Launcher",profiles:["Missile Launcher - Frag","Missile Launcher - Krak"]}
      ])
    ]),
    constraints:Object.freeze([
      Object.freeze({type:"max-per-models",selection:"Sniper Rifle",models:5,maxEach:1}),
      Object.freeze({type:"max-combined-per-models",selections:Object.freeze(["Heavy Bolter","Missile Launcher"]),models:5,maxEach:1})
    ]),
    manualWargearNotes:Object.freeze([
      "The Sergeant alone may swap their Boltgun for a Shotgun and their Combat Knife for a Chainsword.",
      "Ordinary Scouts may take Shotguns; at most one Sniper Rifle and one Heavy Bolter OR Missile Launcher for every five unit models. Heavy weapons cannot go on the Sergeant.",
      "Frag and Krak are alternative firing modes of one Missile Launcher, not two equipped weapons.",
      "Scouts 6 inches, Infiltrators and Flexible Asset action eligibility after an advance or fall-back require tabletop confirmation."
    ])
  }),
  "space-marines:outrider-squad":reviewed({
    sourceName:"Outrider Squad 11e equipment/profile cross-check; 3-model points discrepancy pending official MFM",
    sourceUrl:"https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Outrider-Squad",
    fixed:Object.freeze([fixed("Twin Bolt Rifle"),nonSergeantFixed("Chainsword")]),
    slots:Object.freeze([
      sergeantSlot("outrider-sergeant-melee",["Chainsword","Power Weapon","Thunder Hammer"]),
      slot("outrider-pistol",[
        "Heavy Bolt Pistol",
        {name:"Plasma Pistol",profiles:["Plasma Pistol - Standard","Plasma Pistol - Supercharge"]}
      ])
    ]),
    constraints:Object.freeze([
      Object.freeze({type:"max-per-models",selection:"Plasma Pistol",models:3,maxEach:1})
    ]),
    manualWargearNotes:Object.freeze([
      "Only the Outrider Sergeant can swap a Chainsword for a Power Weapon or Thunder Hammer.",
      "One model per three may replace its Heavy Bolt Pistol with a Plasma Pistol (1 at 3 models; 2 at 6); all models keep a Twin Bolt Rifle.",
      "Plasma Standard and Supercharge are modes of one pistol. Full-throttle Assault only applies after a charge and requires manual confirmation.",
      "Independent October references disagree between 80 and 85 points for three models; preserve imported 80 pending direct official MFM verification."
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
