export const ADEPTUS_CUSTODES_RULE_SOURCES = Object.freeze({
  officialDownloads: 'https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/',
  officialArmyRulesPreview: 'https://www.warhammer-community.com/en-gb/articles/vygelghy/new-army-rules-from-codex-adeptus-custodes/',
  officialDetachmentsPreview: 'https://www.warhammer-community.com/en-gb/articles/joz5iubm/your-first-look-at-13-new-adeptus-custodes-detachments/',
  currentReference: 'https://orpheax.github.io/custobuilder/detachments.html'
});

const E=(name,points,description,eligibility='')=>Object.freeze({name,points,description,...(eligibility?{eligibility}:{})});
const S=(name,cpCost,timing,description)=>Object.freeze({name,cpCost,timing,description});
const D=(body)=>Object.freeze({...body,
  enhancements:Object.freeze(body.enhancements??[]),
  stratagems:Object.freeze(body.stratagems??[])
});

export const ADEPTUS_CUSTODES_KATAH = Object.freeze([
  Object.freeze({ name:'Conservai', timing:'Command phase', effect:'Until end of turn, the selected readied unit can start actions while engaged or Battle-shocked, and starting an action does not prevent it from shooting.' }),
  Object.freeze({ name:'Calistus', timing:'Movement phase when selected to move', effect:'The selected readied unit can move through models while making a Normal, Advance or Fall Back move.' }),
  Object.freeze({ name:'Salvus', timing:'Shooting phase when selected to shoot', effect:'The selected readied unit ignores modifiers to Ballistic Skill and its Hit and Wound rolls.' }),
  Object.freeze({ name:'Dacatarai', timing:'Start of Fight phase', effect:'Melee attacks by the selected readied unit against non-Monster/Vehicle targets can re-roll Hit rolls of 1.' }),
  Object.freeze({ name:'Kaptaris', timing:'Start of Fight phase', effect:'Melee attacks targeting the selected readied unit are -1 to Hit.' }),
  Object.freeze({ name:'Rendax', timing:'Fight phase when selected to fight', effect:'Melee attacks by the selected readied unit gain Lethal Hits against Monster/Vehicle targets.' })
]);

export const ADEPTUS_CUSTODES_ARMY_RULES = Object.freeze([
  Object.freeze({ name:"Martial Ka'tah", description:'At the start of your Command phase, eligible Custodes units become readied. A readied unit can expend that state when one ka’tah trigger occurs; it then stops being readied.', katah:ADEPTUS_CUSTODES_KATAH }),
  Object.freeze({ name:'Aegis of the Emperor', description:'Friendly Adeptus Custodes units with this ability have Feel No Pain 5+ against mortal wounds.' }),
  Object.freeze({ name:'Aquila Commander', description:'At the start of each battle round, an eligible commander can provide one additional Command Point for the army.' }),
  Object.freeze({ name:'Daughters of the Abyss', description:'Anathema Psykana units have Feel No Pain 3+ against Psychic attacks. Their Psychic Null aura gives nearby Adeptus Custodes units Feel No Pain 5+ against Psychic attacks.' })
]);

export const ADEPTUS_CUSTODES_DETACHMENTS = Object.freeze([
  D({
    name:'Guardians of the Throne',detachmentPoints:3,forceDisposition:'Priority Assets and Purge the Foe',
    ruleName:'Martial Mastery',rule:'When a friendly Adeptus Custodes unit fights, choose Sustained Hits 1 or Lethal Hits for its melee attacks.',
    enhancements:[
      E('Bane of Abominations',20,'Attacks that target an enemy Character, Monster or Vehicle unit have +1 to wound.','Adeptus Custodes Character'),
      E("Emperor's Light",15,"The bearer gains Emperor's Light [Extra Attacks]: Melee, A3, WS2+, S5, AP-2, D2.",'Adeptus Custodes Character'),
      E("Castellan's Mark",25,'After deployment, redeploy up to three friendly Adeptus Custodes units; those units can be placed into Strategic Reserves.','Adeptus Custodes Character'),
      E("Eagle's Eye",30,'The bearer gains +1 Wound. Once per battle for the army, it can gain a 3+ invulnerable save when attacks are allocated.','Adeptus Custodes Character')
    ],
    stratagems:[
      S('Superhuman Focus',1,'Any phase','One friendly Adeptus Custodes unit that is not readied becomes readied; the same unit can only be affected once per battle round.'),
      S('Unlimited Endurance',1,'Your Movement phase','After an Advance move, the unit gains Assault on ranged attacks and that Advance does not prevent it from charging.'),
      S('Shield of Honour',1,'Start of Fight phase','For an engaged Infantry/Mounted Custodes unit, an enemy model that does not allocate all attacks to it is -1 to Hit and -1 to Wound.'),
      S('Prime Target',1,'Your Shooting phase','The selected unit can re-roll one Hit roll, one Wound roll and one Damage roll for its ranged attacks.'),
      S('In Auramite Clad',1,'Opponent Shooting or Fight phase','Attacks targeting the selected unit, excluding Custodian Wardens, worsen AP by 1 until the attacking unit has finished.'),
      S('Swift as the Eagle',1,'Opponent Movement phase','When an enemy ends a move within 8 inches of an unengaged Trusted Sentinel, that unit can make a normal move up to D3+3 inches.')
    ]
  }),
  D({
    name:'Shadowkeepers',detachmentPoints:1,forceDisposition:'Purge the Foe',uniqueShieldHost:true,uniqueTag:'Shield Host',favouredKatah:'Kaptaris',
    ruleName:'Wardens of the Dark Cells',rule:'A non-Monster/Vehicle Adeptus Custodes unit on an objective is -1 to Wound in melee when the attack Strength is greater than its Toughness.',
    favouredKatahEffect:'When Kaptaris is used, select an engaged enemy unit; it takes a Battle-shock roll with -1. The same enemy can only be selected once per phase.',
    enhancements:[
      E('Genalchemic Warding',30,'The bearer has Feel No Pain 5+.','Adeptus Custodes Character'),
      E('Unstoppable Destroyer',25,'The bearer can pile in and consolidate up to 4 inches and can use any permitted consolidation mode regardless of Before Moving restrictions.','Adeptus Custodes Infantry Character')
    ],
    stratagems:[
      S('Grim Responsibility',1,'Fight phase','An Adeptus Custodes Infantry unit selected to fight gains Lethal Hits against Character and Monster targets in melee.'),
      S('No Escape',2,'Opponent Movement phase','After an enemy Falls Back, an unengaged Custodes Infantry unit within 6 inches can declare a charge against eligible units that fell back.'),
      S('Indomitable Guardians',1,'Opponent Fight phase','After an enemy fights, an eligible Custodes unit on an objective gains Fights First and must be your next unit selected to fight.')
    ]
  }),
  D({
    name:'Solar Watch',detachmentPoints:1,forceDisposition:'Reconnaissance',uniqueShieldHost:true,uniqueTag:'Shield Host',favouredKatah:'Calistus',
    ruleName:'Talon Sortie',rule:'A friendly Adeptus Custodes unit that Falls Back can remain eligible to charge.',
    favouredKatahEffect:'When Calistus is used, the selected unit gains +2 inches Move.',
    enhancements:[
      E('Sally Forth',30,'At the start of your Charge phase, one nearby Custodes Infantry unit that Advanced can still declare a charge.','Adeptus Custodes Shield-Captain'),
      E('Auric Eagle',15,'The upgraded non-Terminator Infantry/Mounted unit gains +1 to Advance rolls and Charge rolls.','Adeptus Custodes Infantry or Mounted unit upgrade')
    ],
    stratagems:[
      S('Inexorable',1,'Your Movement phase','Until end of turn, the unit ignores modifiers to Move, Advance rolls and Charge rolls.'),
      S("At Spear's Length",1,'Your Movement phase','A Fall Back move does not prevent the unit from being eligible to shoot.'),
      S('Gravimetric Grenade',1,'Start of opponent Charge phase','An unengaged unit selects a visible enemy within 12 inches; that enemy is -1 to its Charge rolls this phase.')
    ]
  }),
  D({
    name:'Aquilan Shield',detachmentPoints:1,forceDisposition:'Take and Hold',uniqueShieldHost:true,uniqueTag:'Shield Host',favouredKatah:'Salvus',
    ruleName:'Gilded Guardians',rule:'A non-Monster/Vehicle Adeptus Custodes unit on an objective is -1 to Wound against ranged attacks whose Strength is greater than its Toughness.',
    favouredKatahEffect:'When Salvus is used, the selected unit increases the range of its ranged attacks by 6 inches.',
    enhancements:[
      E("Pareldor's Caducatrix",30,'Once per battle for the army, at the start of a phase, the bearer regains D3+3 lost wounds.','Adeptus Custodes Character'),
      E('Not a Shell Wasted',10,"The bearer's unit has +1 Attack on its ranged weapons.",'Adeptus Custodes Infantry Character')
    ],
    stratagems:[
      S('Manoeuvre and Fire',1,'Your Movement phase','A Fall Back move does not prevent the unit from shooting or charging.'),
      S('Tip of the Talon',1,'Your Shooting phase','Ranged attacks targeting an enemy within 9 inches gain +1 Strength.'),
      S('Rapid Reactions',1,'Opponent Movement phase','After an enemy Falls Back, the Infantry unit that was engaged with it can shoot that enemy unit.')
    ]
  }),
  D({
    name:'Dread Host',detachmentPoints:1,forceDisposition:'Purge the Foe',uniqueShieldHost:true,uniqueTag:'Shield Host',favouredKatah:'Dacatarai',
    ruleName:"Instruments of the Emperor's Wrath",rule:'Friendly Adeptus Custodes units can re-roll Charge rolls.',
    favouredKatahEffect:'When Dacatarai is used, enemy units engaged with the selected unit subtract 2 inches from pile-in and consolidation moves.',
    enhancements:[
      E('Auric Exemplar',15,'The bearer’s melee attacks have Cleave 1.','Adeptus Custodes Character'),
      E('Flawless Bladework',15,'The bearer’s melee attacks have Sustained Hits 1.','Adeptus Custodes Character')
    ],
    stratagems:[
      S('Lightning Wrath',1,'Fight phase','The selected unit can pile in up to D3+3 inches.'),
      S('Golden Light of the Moiraides',2,'Your Movement phase','After an ingress move, attacks targeting the unit are -1 to Hit and it cannot be targeted by snap shooting until your next turn.'),
      S('Preternatural Rapidity',1,'Your Movement phase','After an Advance move, that Advance does not prevent the unit from declaring a charge.')
    ]
  }),
  D({
    name:'Emissaries Imperatus',detachmentPoints:1,forceDisposition:'Priority Assets',uniqueShieldHost:true,uniqueTag:'Shield Host',favouredKatah:'Conservai',
    ruleName:'Heralds of the Throne',rule:'Friendly Adeptus Custodes units have Fights First.',
    favouredKatahEffect:'When Conservai is used, Advance and Fall Back moves do not prevent the selected unit from starting an action.',
    enhancements:[
      E('Auriferous Orb',20,'The bearer gains Auriferous Orb: 12 inches, A3, BS2+, S1, AP0, D1, Anti-non-Monster/Vehicle 2+, Blinding Light, Devastating Wounds.','Adeptus Custodes Character'),
      E('Edge of the Blade',15,"If the bearer's unit charged this turn, it can re-roll Hit rolls of 1 and Wound rolls of 1.",'Adeptus Custodes Character')
    ],
    stratagems:[
      S('Bearers of His Light',1,'Fight phase','The unit’s melee attacks can ignore modifiers to Hit rolls and Wound rolls.'),
      S('Slayers of Nightmares',1,'Fight phase','Melee attacks targeting a unit with greater Toughness gain +1 to Wound.'),
      S('Selfless Service',1,'End of opponent Charge phase','An unengaged Custodes unit within 6 inches of an enemy can declare a restricted charge against targets within 6 inches.')
    ]
  }),
  D({
    name:"Emperor's Chosen",detachmentPoints:1,forceDisposition:'Priority Assets',uniqueShieldHost:true,uniqueTag:'Shield Host',favouredKatah:'Rendax',
    ruleName:'Magna Imperator',rule:'When a friendly Adeptus Custodes unit is selected to attack, its attacks can re-roll one Hit roll and one Wound roll.',
    favouredKatahEffect:'When Rendax is used, select an engaged enemy Monster/Vehicle and roll a D6 to inflict mortal wounds: 1-2 = 1, 3-5 = D3, 6 = 3.',
    enhancements:[
      E('Radiant Mantle',40,'Attacks that target the bearer’s unit are -1 to Hit.','Adeptus Custodes Infantry Character'),
      E('From the Hall of Armouries',15,'The bearer’s melee attacks have Devastating Wounds.','Adeptus Custodes Character')
    ],
    stratagems:[
      S('Superhuman Focus',1,'End of any phase','One friendly Adeptus Custodes unit that is not readied becomes readied; each unit can only be affected once per battle round.'),
      S('In Auramite Clad',1,'Opponent Shooting or Fight phase','Attacks targeting the selected unit, excluding Custodian Wardens, worsen AP by 1 until that enemy has finished its attacks.'),
      S('Impenetrable Bastion',1,'End of your Movement phase','A non-Monster/Vehicle unit controlling an objective can secure that objective.')
    ]
  }),
  D({
    name:'Auric Champions',detachmentPoints:1,forceDisposition:'Purge the Foe',
    ruleName:'Assemblage of Might',rule:'In your Command phase choose one enemy unit as the dreadful foe until your next Command phase; Adeptus Custodes Character attacks against it gain +1 to Wound.',
    enhancements:[
      E('Shroud of the Hidden Blade',20,'The bearer has Stealth and Lone Operative.','Adeptus Custodes Character'),
      E('Inspirational Exemplar',10,'Once per battle round for the army, a nearby friendly Battle-shocked unit is no longer Battle-shocked.','Adeptus Custodes Infantry Character'),
      E('Superior Creation',30,'When the bearer is destroyed, on a 2+ return it unengaged with 3 wounds remaining.','Adeptus Custodes Infantry Character')
    ],
    stratagems:[
      S('Gilded Champion',1,'Any phase','After a Character uses a once-per-battle, per-unit datasheet ability, that model can use it one additional time later in the battle; once per model.'),
      S('Duty Unto Death',1,'Fight phase','When a model in a unit that has not fought is destroyed, roll D6 (+1 for a Character); on 3+ it remains until the unit has fought.')
    ]
  }),
  D({
    name:'Honoured Companions',detachmentPoints:1,forceDisposition:'Take and Hold',
    ruleName:"Companion's Watch",rule:'A Trusted Sentinel unit within range of an objective can re-roll Wound rolls of 1.',
    enhancements:[
      E('Arae-Shrike',20,'Enemy units making an ingress move cannot be set up within 12 inches of the bearer’s unit.','Adeptus Custodes Infantry Character'),
      E('Celeritous Sentries',15,'Once per phase, this Trusted Sentinel unit can be targeted by Heroic Intervention for 1 CP less without blocking another use.','Trusted Sentinel unit upgrade')
    ],
    stratagems:[
      S("Emperor's Domain",1,'Fight phase','The selected Trusted Sentinel can use the objective consolidation mode regardless of its Before Moving restrictions.'),
      S('Avenge the Fallen',1,'Fight phase','A Trusted Sentinel below starting strength gains +2 Attacks on melee weapons for non-Character models.'),
      S('Swift as the Eagle',1,'Opponent Movement phase','After an enemy ends a move within 8 inches of an unengaged Trusted Sentinel, it can make a normal move up to D3+3 inches.')
    ]
  }),
  D({
    name:'Lions of the Emperor',detachmentPoints:1,forceDisposition:'Disruption',
    ruleName:'On Gilded Wings',rule:'At the end of the opponent Fight phase, an unengaged Adeptus Custodes Terminator unit can be placed into Strategic Reserves.',
    enhancements:[
      E('Lightning Descent',20,'In your first Movement phase, this unit can make an ingress move.','Shield-Captain in Allarus Terminator Armour'),
      E('Leonine Ferocity',20,'Once per phase for the army, Rapid Ingress can target this unit for 1 CP less without blocking another use.','Shield-Captain in Allarus Terminator Armour')
    ],
    stratagems:[
      S('Vigil Unending',2,'Opponent Shooting or Fight phase','Attacks targeting the selected Terminator unit have -1 Damage until the attacking unit has finished.'),
      S('Unleash the Lions',1,'Your Command phase','A Terminator unit with two or more models splits into separate one-model units.'),
      S('Fury of the Emperor',1,'Your Charge phase','A Terminator unit that made an ingress move this turn gains +2 to Charge rolls.')
    ]
  }),
  D({
    name:'Might of the Moritoi',detachmentPoints:1,forceDisposition:'Take and Hold',
    ruleName:'Moritoi Ancients',rule:'A Custodes Dreadnought at starting strength gains +2 OC; below starting strength it can re-roll Hit rolls of 1; below half-strength it can also re-roll Wound rolls of 1.',
    enhancements:[
      E('Memento Moritoi',30,'One per army. The upgraded Dreadnought’s melee attacks gain +1 Attack, +1 Strength and +1 Damage.','Adeptus Custodes Dreadnought unit upgrade'),
      E('Augury Uplink',30,'One per army. The upgraded Dreadnought has Feel No Pain 5+.','Adeptus Custodes Dreadnought unit upgrade')
    ],
    stratagems:[
      S('Honoured Interred',1,'Shooting or Fight phase','The selected unit gains an aura allowing nearby friendly Dreadnoughts to re-roll Hit rolls of 1.'),
      S('Unceasing Onslaught',1,'Your Movement phase','After an Advance move, ranged attacks gain Assault and the Advance does not prevent declaring a charge.'),
      S('Unstoppable Momentum',1,'Movement or Charge phase','The selected Dreadnought gains Mobile.')
    ]
  }),
  D({
    name:'Grav-Assault Force',detachmentPoints:1,forceDisposition:'Reconnaissance',
    ruleName:'Flare Shields',rule:'Friendly Grav-Assault units have a 4+ invulnerable save against ranged attacks.',
    enhancements:[
      E('Combat Deployment',20,'When a unit disembarks from this transport it can re-roll Charge rolls and cannot be targeted by snap shooting.','Grav-Assault Transport unit upgrade'),
      E('Anti-Gravitic Mobility',15,'A Fall Back move does not prevent the upgraded unit from being eligible to shoot.','Grav-Assault unit upgrade')
    ],
    stratagems:[
      S('Victory Before Death',1,'Any phase','When a Grav-Assault unit on an objective is destroyed, that objective can become secured if the rule conditions are met.'),
      S('Advanced Stabilisers',1,'Your Shooting phase','The selected unit’s ranged attacks gain Assault.'),
      S('Inevitable Annihilation',1,'Your Shooting phase','The selected unit can ignore modifiers to Ballistic Skill and Hit rolls.')
    ]
  }),
  D({
    name:'Null Maiden Vigil',detachmentPoints:1,forceDisposition:'Disruption',
    ruleName:'Silent Sisterhood',rule:'An Anathema Psykana Character can be your Warlord; Prosecutor Squads gain Battleline; nearby Psyker or below-starting-strength enemies suffer a -1 Battle-shock modifier from Creeping Dread.',
    enhancements:[
      E('Oblivion Knight',15,'The bearer gains +1 to Hit, or +1 to Hit and Wound against Psyker or Battle-shocked targets.','Anathema Psykana Character'),
      E("Huntress' Eye",10,'In the Movement phase, one visible enemy within 12 inches takes a Battle-shock roll with -1.','Anathema Psykana Character')
    ],
    stratagems:[
      S('Anathema Blademastery',1,'Fight phase','A Vigilator Squad gains either Sustained Hits 1 or Lethal Hits for its attacks.'),
      S('Psy-Chaff Volley',1,'Your Shooting phase','After a Prosecutor Squad shoots, one enemy unit it hit becomes prosecuted, improving AP against it by 1.'),
      S('Purgation Sweep',1,'Your Shooting phase','A Witchseeker Squad’s Torrent attacks gain +1 Attack, or +2 Attacks against Psyker/Battle-shocked targets.')
    ]
  })
]);

export const ADEPTUS_CUSTODES_RULES_DATA = Object.freeze({
  name:'Codex: Adeptus Custodes',
  version:'October 2026',
  legalFrom:'2026-10',
  publicationType:'Codex',
  sourceUrl:ADEPTUS_CUSTODES_RULE_SOURCES.officialDownloads,
  detachmentPointBudget:3,
  uniqueDetachmentRules:Object.freeze([{tag:'Shield Host',max:1}]),
  armyRules:ADEPTUS_CUSTODES_ARMY_RULES,
  detachments:ADEPTUS_CUSTODES_DETACHMENTS
});
