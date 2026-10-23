const REVIEWED_AT = '2026-10-23';
const CODEX_REFERENCE = 'https://orpheax.github.io/custobuilder/datasheets.html';
const OFFICIAL_PREVIEW = 'https://www.warhammer-community.com/en-gb/articles/2xxurx9j/first-look-adeptus-custodes-datasheets/';
const MFM = 'https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/';

const freeze = (value) => Object.freeze(value);
const W = (name, range, attacks, skill, strength, ap, damage, abilities = '', equipment = 'Default') => freeze({
  name, range, attacks, skill, strength, ap, damage, ...(abilities ? { abilities } : {}), equipment
});
const A = (name, description) => freeze({ name, description });
const P = (models, points, condition = '') => freeze({ models, points, ...(condition ? { condition } : {}) });
const C = (Move, Toughness, Save, Wounds, Leadership, OC, invulnerable = null) => freeze({
  Move, Toughness, Save, Wounds, Leadership, 'Objective Control': OC,
  ...(invulnerable ? { 'Invulnerable save': invulnerable } : {})
});
function source(sourceUrl = CODEX_REFERENCE, { legends = false, official = 'partial' } = {}) {
  return freeze({
    status: legends ? 'source-reviewed-legends' : 'source-reviewed',
    sourceName: legends ? 'Current 11th-edition Adeptus Custodes Legends reference' : 'October 2026 Codex: Adeptus Custodes profile reference',
    sourceUrl,
    additionalSources: freeze([OFFICIAL_PREVIEW, MFM]),
    pointsSourceName: 'Games Workshop Munitorum Field Manual (updated 14/10/2026)',
    pointsSourceUrl: MFM,
    reviewedAt: REVIEWED_AT,
    officialRulesCrossCheck: official,
    ...(legends ? { legends: true } : {})
  });
}
function unit({ characteristics, keywords, weapons = [], abilities = [], defaultModelCount = 1, defaultPoints, pointsOptions, sourceUrl, legends = false, official = 'partial' }) {
  return freeze({
    characteristics,
    keywords: freeze(keywords),
    weapons: freeze(weapons),
    abilities: freeze(abilities),
    defaultModelCount,
    defaultPoints,
    pointsOptions: freeze(pointsOptions ?? [P(defaultModelCount, defaultPoints)]),
    dataSource: source(sourceUrl, { legends, official })
  });
}

const custodesCore = [
  A('Aegis of the Emperor', 'This unit has Feel No Pain 5+ against mortal wounds.'),
  A("Martial Ka'tah", 'At the start of your Command phase this unit becomes readied; it can expend that readiness on one of the six faction ka’tah abilities at the listed timing.')
];
const aquila = A('Aquila Commander', 'At the start of each battle round, this army rule provides the Custodes player an additional Command Point when an eligible commander is present.');
const daughters = A('Daughters of the Abyss', 'ANATHEMA PSYKANA models are highly resistant to psychic attacks and project a short protective anti-psychic aura to nearby ADEPTUS CUSTODES units.');

export const ADEPTUS_CUSTODES_DATASHEET_DETAILS = freeze({
  'adeptus-custodes:trajann-valoris': unit({
    characteristics: C('8"',7,'2+',10,'5+',2,'4+'), keywords:['Infantry','Character','Epic Hero','Imperium','Adeptus Custodes'],
    weapons:[W("Eagle's Scream",'24"',2,'2+',6,-2,2,'Assault, Rapid Fire 2'),W("Watcher's Axe",'Melee',6,'2+',12,-3,4,'Cleave 1')],
    abilities:[A('Deep Strike','This unit can enter using the Deep Strike ingress rules.'),A('Feel No Pain 5+','This model has Feel No Pain 5+.'),A('Leader','Can lead the reviewed eligible Custodes infantry and terminator units.'),...custodesCore,aquila,A('Captain-General (Aura)','Nearby non-Monster/Vehicle Custodes units can re-roll Hit rolls of 1 and Wound rolls of 1.'),A('Moment Shackle','Once per battle for the army, at the start of a phase choose either +3 Attacks for Watcher’s Axe or a 3+ invulnerable save for the phase.'),A('Supreme Commander','If included, Trajann must be your Warlord.')],
    defaultPoints:265, official:'verified'
  }),
  'adeptus-custodes:blade-champion': unit({
    characteristics:C('8"',7,'2+',7,'5+',2,'4+'), keywords:['Infantry','Character','Imperium','Adeptus Custodes'],
    weapons:[W('Vaultswords – Behemor','Melee',5,'2+',10,-3,3,'Devastating Wounds'),W('Vaultswords – Hurricanis','Melee',10,'2+',6,-2,1,'Cleave 1, Sustained Hits 1'),W('Vaultswords – Victus','Melee',8,'2+',8,-3,2,'Precision')],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),A('Leader','Can lead Custodian Guard Sodality, Sentinel Guard Sodality or Custodian Wardens.'),...custodesCore,A('Swift Onslaught','This unit can re-roll Advance rolls and Charge rolls.'),A('Sword of the Throne','At the start of the battle choose an enemy mark; this model is +1 to Wound that mark and selects another mark when it is destroyed.')],
    defaultPoints:175, pointsOptions:[P(1,175,'1st–2nd Blade Champion'),P(1,195,'3rd+ Blade Champion')]
  }),
  'adeptus-custodes:shield-captain': unit({
    characteristics:C('8"',7,'2+',8,'5+',2,'4+'), keywords:['Infantry','Character','Imperium','Shield-Captain','Adeptus Custodes'],
    weapons:[W('Castellan Axe (ranged)','24"',2,'2+',5,-1,2,'Assault, Rapid Fire 2','Wargear option'),W('Guardian Spear (ranged)','24"',2,'2+',5,-1,2,'Assault, Rapid Fire 2','Wargear option'),W('Pyrithite Spear (ranged)','12"',1,'2+',10,-3,'D3+2','Assault, Melta 2'),W('Castellan Axe','Melee',5,'2+',10,-2,4,'','Wargear option'),W('Eternity-pattern Paragon Blade','Melee',6,'2+',10,-3,3,'Precision','Wargear option'),W('Guardian Spear','Melee',8,'2+',8,-2,2,'Cleave 1','Wargear option'),W('Pyrithite Spear','Melee',8,'2+',8,-2,2,'Cleave 1')],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),A('Leader','Can lead Guard, Sentinel Guard, Wardens and their reviewed Legends equivalents.'),...custodesCore,aquila,A("Master of Ka'tahs",'Once per battle round for this unit, if it is not readied it can become readied again.'),A('Vengeful Surge','Once per battle, after this unit loses a wound to enemy shooting, it can make a surge move up to D6+2 inches.'),A('Praesidium Shield','Attacks allocated to this model have their Damage reduced by 1.')],
    defaultPoints:205, pointsOptions:[P(1,180,'Base model without Praesidium Shield'),P(1,205,'Base model with Praesidium Shield (+25)'),P(1,200,'2nd+ base model before wargear surcharge'),P(1,225,'2nd+ model with Praesidium Shield')]
  }),
  'adeptus-custodes:shield-captain-in-allarus-terminator-armour': unit({
    characteristics:C('7"',8,'2+',9,'5+',2,'4+'), keywords:['Infantry','Character','Imperium','Shield-Captain','Terminator','Adeptus Custodes'],
    weapons:[W('Balistus Grenade Launcher','18"',3,'2+',5,-1,1,'Assault, Blast 1'),W('Castellan Axe (ranged)','24"',2,'2+',5,-1,2,'Assault, Rapid Fire 2','Wargear option'),W('Guardian Spear (ranged)','24"',2,'2+',5,-1,2,'Assault, Rapid Fire 2'),W('Castellan Axe','Melee',5,'2+',10,-2,4,'','Wargear option'),W('Guardian Spear','Melee',8,'2+',8,-2,2,'Cleave 1')],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),A('Leader','Can lead Allarus Custodians and both Aquilon Terminator variants.'),...custodesCore,aquila,A("Master of Ka'tahs",'Once per battle round for this unit, if it is not readied it can become readied again.'),A('Archeotech Teleport-shunter','Once per battle, an unengaged unit that has not moved can return to Strategic Reserves and must make an ingress move that phase.')],
    defaultPoints:185, pointsOptions:[P(1,185,'1st Shield-Captain in Allarus Armour'),P(1,205,'2nd+ Shield-Captain in Allarus Armour')]
  }),
  'adeptus-custodes:shield-captain-on-dawneagle-jetbike': unit({
    characteristics:C('12"',8,'2+',10,'5+',2,'4+'), keywords:['Mounted','Character','Fly','Imperium','Shield-Captain','Adeptus Custodes'],
    weapons:[W('Hurricane Bolter','18"',3,'2+',5,-1,2,'Rapid Fire 3, Twin-linked','Wargear option'),W('Salvo Launcher','24"',2,'2+',10,-2,'D3+2'),W('Interceptor Lance','Melee',8,'2+',8,-2,2,'Lance')],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),A('Leader','Can lead Vertus Praetors or Gyrfalcon Jetbike Sodality.'),...custodesCore,aquila,A("Master of Ka'tahs",'Once per battle round for this unit, if it is not readied it can become readied again.'),A('Sweeping Advance','Once per battle after a Fight phase in which it was eligible to fight, this unit can make a normal move if unengaged or a Fall Back move if engaged.')],
    defaultPoints:205, pointsOptions:[P(1,205,'1st Shield-Captain on Dawneagle Jetbike'),P(1,225,'2nd+ Shield-Captain on Dawneagle Jetbike')]
  }),
  'adeptus-custodes:custodian-guard-sodality': unit({
    characteristics:C('8"',7,'2+',5,'5+',3,'4+'), keywords:['Infantry','Battleline','Imperium','Trusted Sentinel','Adeptus Custodes'],
    weapons:[W('Guardian Spear (ranged)','24"',2,'2+',5,-1,2,'Assault, Rapid Fire 2'),W('Guardian Spear','Melee',6,'2+',8,-2,2)],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),...custodesCore,A('Impenetrable Defence','Attacks made by this unit gain Sustained Hits 1 against non-Monster/Vehicle targets when this unit or its target is within range of an objective.'),A('Vexilla','If equipped, the unit gains +1 OC and can ignore Leadership modifiers.')],
    defaultModelCount:3, defaultPoints:240, pointsOptions:[P(3,240,'1st–3rd unit'),P(3,270,'4th+ unit')], official:'verified'
  }),
  'adeptus-custodes:sentinel-guard-sodality': unit({
    characteristics:C('8"',7,'2+',5,'5+',3,'4+'), keywords:['Infantry','Battleline','Imperium','Trusted Sentinel','Adeptus Custodes'],
    weapons:[W('Sentinel Blade (ranged)','12"',4,'2+',5,-1,2,'Assault, Close-Quarters'),W('Sentinel Blade','Melee',5,'2+',6,-2,2)],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),...custodesCore,A('Stand Vigil','Attacks made by this unit gain Lethal Hits against non-Monster/Vehicle targets when this unit or its target is within range of an objective.'),A('Praesidium Shield','Attacks targeting this unit with Strength greater than its Toughness are -1 to Wound.'),A('Vexilla','If equipped, the unit gains +1 OC and can ignore Leadership modifiers.')],
    defaultModelCount:3,defaultPoints:240,pointsOptions:[P(3,240,'1st–3rd unit'),P(3,270,'4th+ unit')]
  }),
  'adeptus-custodes:custodian-wardens': unit({
    characteristics:C('8"',7,'2+',6,'5+',2,'4+'), keywords:['Infantry','Imperium','Trusted Sentinel','Adeptus Custodes'],
    weapons:[W('Castellan Axe (ranged)','24"',2,'2+',5,-1,2,'Assault, Rapid Fire 2','Wargear option'),W('Guardian Spear (ranged)','24"',2,'2+',5,-1,2,'Assault, Rapid Fire 2'),W('Castellan Axe','Melee',3,'2+',10,-2,4,'','Wargear option'),W('Guardian Spear','Melee',6,'2+',8,-2,2)],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),...custodesCore,A('Living Fortress','Attacks targeting this unit have their AP worsened by 1.'),A('Vexilla','If equipped, the unit gains +1 OC and can ignore Leadership modifiers.')],
    defaultModelCount:2,defaultPoints:200,pointsOptions:[P(2,200,'1st unit'),P(3,295,'1st unit'),P(2,230,'2nd+ unit'),P(3,325,'2nd+ unit')]
  }),
  'adeptus-custodes:allarus-custodians': unit({
    characteristics:C('7"',8,'2+',6,'5+',2,'4+'), keywords:['Infantry','Imperium','Terminator','Adeptus Custodes'],
    weapons:[W('Balistus Grenade Launcher','18"',3,'2+',5,-1,1,'Assault, Blast 1'),W('Castellan Axe (ranged)','24"',2,'2+',5,-1,2,'Assault, Rapid Fire 2','Wargear option'),W('Guardian Spear (ranged)','24"',2,'2+',5,-1,2,'Assault, Rapid Fire 2'),W('Castellan Axe','Melee',3,'2+',10,-2,4,'','Wargear option'),W('Guardian Spear','Melee',6,'2+',8,-2,2)],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),...custodesCore,A('Slayer of Tyrants','Melee attacks against a target with Toughness greater than this unit gain +1 to Wound.'),A('Vexilla','If equipped, the unit gains +1 OC and can ignore Leadership modifiers.')],
    defaultModelCount:2,defaultPoints:180,pointsOptions:[P(2,180),P(3,270)]
  }),
  'adeptus-custodes:aquilon-terminators-with-solarite-power-gauntlets': unit({
    characteristics:C('7"',8,'2+',6,'5+',2,'4+'), keywords:['Infantry','Imperium','Terminator','Adeptus Custodes'],
    weapons:[W('Adrathic Combi-destructor','12"',2,'2+',5,-2,3),W('Solarite Power Gauntlet','Melee',5,'2+',10,-2,3)],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),...custodesCore,A('Dread Foe','Melee attacks against non-Monster/Vehicle targets improve AP by 1.')],
    defaultModelCount:3,defaultPoints:285,pointsOptions:[P(3,285,'1st–2nd unit'),P(3,315,'3rd+ unit')]
  }),
  'adeptus-custodes:aquilon-terminators-with-solarite-power-talons': unit({
    characteristics:C('7"',8,'2+',6,'5+',2,'4+'), keywords:['Infantry','Imperium','Terminator','Adeptus Custodes'],
    weapons:[W('Infernus Firepike','12"',3,'—',5,-1,1,'Blast 2, Torrent','Wargear option'),W('Lastrum Storm Bolter','24"',3,'2+',5,-1,1,'Rapid Fire 3'),W('Solarite Power Talon','Melee',6,'2+',6,-2,1,'Sustained Hits 2')],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),...custodesCore,A('Reap a Terrible Tally','Attacks against Infantry can re-roll Hit rolls of 1 and Wound rolls of 1.')],
    defaultModelCount:3,defaultPoints:275,pointsOptions:[P(3,275,'1st–2nd unit'),P(3,305,'3rd+ unit')]
  }),
  'adeptus-custodes:venatari-with-kinetic-destroyers': unit({
    characteristics:C('12"',7,'2+',5,'5+',2,'4+'), keywords:['Infantry','Explosives','Fly','Imperium','Jump Pack','Adeptus Custodes'],
    weapons:[W('Kinetic Destroyer','18"',4,'2+',6,-2,1,'Assault, Close-Quarters, Sustained Hits 1'),W('Tarsus Buckler','Melee',5,'2+',6,-2,1,'Sustained Hits 1')],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),...custodesCore,A('Take Wing','At the end of the opponent Fight phase, if unengaged, this unit can return to Strategic Reserves.'),A('Neutronium Cascade Mine','Once per battle, at the start of a phase, a nearby enemy unit can suffer mortal wounds; the effect is stronger against Monsters/Vehicles.'),A('Strike from the Skies','If this unit made an ingress move this turn, its ranged attacks can re-roll Hit rolls.')],
    defaultModelCount:3,defaultPoints:255,pointsOptions:[P(3,255,'1st–2nd unit'),P(3,280,'3rd+ unit')]
  }),
  'adeptus-custodes:venatari-with-verutum-lances': unit({
    characteristics:C('12"',7,'2+',5,'5+',2,'4+'), keywords:['Infantry','Explosives','Fly','Imperium','Jump Pack','Adeptus Custodes'],
    weapons:[W('Verutum Lance (ranged)','18"',1,'2+',10,-2,3,'Assault'),W('Verutum Lance','Melee',5,'2+',7,-2,2,'Lance, Precision')],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),...custodesCore,A('Take Wing','At the end of the opponent Fight phase, if unengaged, this unit can return to Strategic Reserves.'),A('Neutronium Cascade Mine','Once per battle, at the start of a phase, a nearby enemy unit can suffer mortal wounds; the effect is stronger against Monsters/Vehicles.'),A('Swift Ruin','Once per phase for the army, this unit can receive Rapid Ingress for 1CP less without preventing another use.')],
    defaultModelCount:3,defaultPoints:270,pointsOptions:[P(3,270,'1st–2nd unit'),P(3,300,'3rd+ unit')]
  }),
  'adeptus-custodes:vertus-praetors': unit({
    characteristics:C('12"',8,'2+',7,'5+',2,'4+'), keywords:['Mounted','Fly','Imperium','Adeptus Custodes'],
    weapons:[W('Hurricane Bolter','18"',3,'2+',5,-1,2,'Rapid Fire 3, Twin-linked','Wargear option'),W('Salvo Launcher','24"',2,'2+',10,-2,'D3+2'),W('Interceptor Lance','Melee',6,'2+',8,-2,2,'Lance')],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),...custodesCore,A('Quicksilver Execution','If this unit charged this turn, its melee attacks gain Sustained Hits 1.')],
    defaultModelCount:2,defaultPoints:220,pointsOptions:[P(2,220,'1st unit'),P(3,330,'1st unit'),P(2,240,'2nd–3rd unit'),P(3,350,'2nd–3rd unit')]
  }),
  'adeptus-custodes:gyrfalcon-jetbike-sodality': unit({
    characteristics:C('12"',8,'2+',9,'5+',2,'4+'), keywords:['Mounted','Fly','Imperium','Adeptus Custodes'],
    weapons:[W('Adrathic Devastator','18"',3,'2+',8,-2,3,'','Wargear option'),W('Arachnus Volley Cannon','24"',8,'2+',5,-1,1,'Devastating Wounds, Sustained Hits 1','Wargear option'),W('Lastrum Bolt Cannon','36"',3,'2+',6,-2,2,'Sustained Hits 1'),W('Twin Corvae Las-pulser','18"',1,'2+',10,-3,'D3+2','Twin-linked','Wargear option'),W('Solarite Power Lance','Melee',5,'2+',8,-2,3,'Lance')],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),...custodesCore,A('Death Blow','If this unit charged this turn, its melee attacks improve AP by 1.')],
    defaultModelCount:2,defaultPoints:260,pointsOptions:[P(2,260,'1st unit'),P(2,280,'2nd+ unit')]
  }),
  'adeptus-custodes:contemptor-galatus-dreadnought': unit({
    characteristics:C('9"',10,'2+',12,'5+',3,'4+'), keywords:['Vehicle','Dreadnought','Imperium','Walker','Adeptus Custodes'],
    weapons:[W('Warblade (ranged)','12"',4,'—',6,-1,2,'Blast 2, Torrent, Twin-linked'),W('Warblade','Melee',8,'2+',10,-2,3,'Cleave 1, Sustained Hits 1 vs non-Monster/Vehicle')],
    abilities:[A('Damaged 4','At 4 or fewer wounds remaining, this model is damaged.'),A('Deadly Demise D3','On destruction, its Deadly Demise can inflict D3 mortal wounds.'),...custodesCore,A('Unyielding Ancient','Attacks targeting this unit with Strength greater than its Toughness are -1 to Wound.')],
    defaultPoints:220,pointsOptions:[P(1,220,'1st–2nd unit'),P(1,250,'3rd+ unit')]
  }),
  'adeptus-custodes:contemptor-achillus-dreadnought': unit({
    characteristics:C('9"',10,'2+',12,'5+',3,'5+'), keywords:['Vehicle','Dreadnought','Imperium','Walker','Adeptus Custodes'],
    weapons:[W('Adrathic Combi-destructor','12"',2,'2+',5,-2,3,'','Wargear option'),W('Dreadspear (ranged)','18"',2,'2+',10,-3,'D3+2'),W('Lastrum Storm Bolter','24"',3,'2+',5,-1,1,'Rapid Fire 3'),W('Twin Infernus Incinerator','12"',3,'—',6,-1,1,'Blast 2, Torrent, Twin-linked','Wargear option'),W('Dreadspear','Melee',5,'2+',12,-3,'D3+3','Lance')],
    abilities:[A('Damaged 4','At 4 or fewer wounds remaining, this model is damaged.'),A('Deadly Demise D3','On destruction, its Deadly Demise can inflict D3 mortal wounds.'),...custodesCore,A('Unyielding Ancient','Attacks targeting this unit with Strength greater than its Toughness are -1 to Wound.')],
    defaultPoints:230,pointsOptions:[P(1,230,'1st–2nd unit'),P(1,260,'3rd+ unit')]
  }),
  'adeptus-custodes:telemon-heavy-dreadnought': unit({
    characteristics:C('10"',11,'2+',14,'5+',4,'4+'), keywords:['Vehicle','Dreadnought','Imperium','Walker','Adeptus Custodes'],
    weapons:[W('Adrathic Desolator','24"',4,'2+',10,-2,4,'','Wargear option'),W('Arachnus Storm Cannon','24"',12,'2+',6,-1,1,'Devastating Wounds, Sustained Hits 1','Wargear option'),W('Iliastus Accelerator Culverin','48"',3,'2+',10,-1,3,'Rapid Fire 3','Wargear option'),W('Spiculus Bolt Launcher','36"',6,'2+',5,-1,1,'Blast 2'),W('Twin Neutronium Cascade Projectors','12"',3,'—',7,-2,1,'Blast 1, Torrent, Twin-linked'),W('Caestus Fist','Melee',5,'2+',14,-3,4,'','Wargear option'),W('Dual Caestus Fists','Melee',7,'2+',14,-3,4,'Twin-linked')],
    abilities:[A('Damaged 5','At 5 or fewer wounds remaining, this model is damaged.'),A('Deadly Demise D3','On destruction, its Deadly Demise can inflict D3 mortal wounds.'),...custodesCore,A('Guardian Eternal','Ranged attacks targeting this unit have their Damage reduced by 1.')],
    defaultPoints:280,pointsOptions:[P(1,280,'1st unit'),P(1,310,'2nd+ unit')],official:'verified'
  }),
  'adeptus-custodes:pallas-grav-attack': unit({
    characteristics:C('12"',9,'2+',10,'5+',2,'5+'), keywords:['Vehicle','Fly','Frame','Grav-Assault','Imperium','Adeptus Custodes'],
    weapons:[W('Twin Arachnus Blaze Cannon','24"',2,'2+',10,-3,'D3+2','Twin-linked'),W('Twin Iliastus Accelerator Fusil','48"',2,'2+',10,-1,3,'Rapid Fire 2, Twin-linked','Wargear option'),W('Armoured Hull','Melee',3,'4+',6,0,1)],
    abilities:[A('Deadly Demise 1','On destruction, its Deadly Demise can inflict 1 mortal wound.'),A('Deep Strike','This unit can enter using Deep Strike.'),A('Aegis of the Emperor','This unit has Feel No Pain 5+ against mortal wounds.'),A('Mobile Hunter','After this unit shoots it can make a normal move up to D6 inches, but cannot charge that turn.')],
    defaultPoints:135
  }),
  'adeptus-custodes:caladius-grav-tank': unit({
    characteristics:C('10"',11,'2+',14,'5+',4,'5+'), keywords:['Vehicle','Caladius','Fly','Frame','Grav-Assault','Imperium','Adeptus Custodes'],
    weapons:[W('Iliastus Accelerator Cannon','48"',4,'2+',10,-1,3,'Rapid Fire 4, Sustained Hits 1 vs non-Monster/Vehicle'),W('Twin Lastrum Bolt Cannon','36"',3,'2+',6,-2,2,'Sustained Hits 1, Twin-linked'),W('Twin Neutronium Cascade Projectors','12"',3,'—',7,-2,1,'Blast 1, Torrent, Twin-linked','Wargear option'),W('Armoured Hull','Melee',4,'4+',6,0,1)],
    abilities:[A('Damaged 5','At 5 or fewer wounds remaining, this model is damaged.'),A('Deadly Demise D3','On destruction, its Deadly Demise can inflict D3 mortal wounds.'),A('Deep Strike','This unit can enter using Deep Strike.'),A('Aegis of the Emperor','This unit has Feel No Pain 5+ against mortal wounds.'),A('Destructor Optics','Ranged attacks against non-Monster/Vehicle targets improve AP by 1.')],
    defaultPoints:230,pointsOptions:[P(1,230,'1st–2nd unit'),P(1,260,'3rd+ unit')]
  }),
  'adeptus-custodes:caladius-annihilator-grav-tank': unit({
    characteristics:C('10"',11,'2+',14,'5+',4,'5+'), keywords:['Vehicle','Caladius','Fly','Frame','Grav-Assault','Imperium','Adeptus Custodes'],
    weapons:[W('Arachnus Blaze Carronade','48"',4,'2+',12,-3,'D6+2','Lethal Hits vs Monster/Vehicle'),W('Twin Lastrum Bolt Cannon','36"',3,'2+',6,-2,2,'Sustained Hits 1, Twin-linked'),W('Twin Neutronium Cascade Projectors','12"',3,'—',7,-2,1,'Blast 1, Torrent, Twin-linked','Wargear option'),W('Armoured Hull','Melee',4,'4+',6,0,1)],
    abilities:[A('Damaged 5','At 5 or fewer wounds remaining, this model is damaged.'),A('Deadly Demise D3','On destruction, its Deadly Demise can inflict D3 mortal wounds.'),A('Deep Strike','This unit can enter using Deep Strike.'),A('Aegis of the Emperor','This unit has Feel No Pain 5+ against mortal wounds.'),A('Advanced Firepower','Ranged attacks against Monsters/Vehicles can re-roll one Hit, one Wound and one Damage roll.')],
    defaultPoints:250,pointsOptions:[P(1,250,'1st–2nd unit'),P(1,280,'3rd+ unit')]
  }),
  'adeptus-custodes:coronus-grav-carrier': unit({
    characteristics:C('12"',12,'2+',16,'5+',5,'5+'), keywords:['Vehicle','Fly','Frame','Grav-Assault','Imperium','Transport','Adeptus Custodes'],
    weapons:[W('Twin Arachnus Blaze Cannon','24"',2,'2+',10,-3,'D3+2','Twin-linked'),W('Twin Lastrum Bolt Cannon','36"',3,'2+',6,-2,2,'Sustained Hits 1, Twin-linked'),W('Twin Neutronium Cascade Projectors','12"',3,'—',7,-2,1,'Blast 1, Torrent, Twin-linked','Wargear option'),W('Armoured Hull','Melee',6,'4+',8,0,1)],
    abilities:[A('Damaged 6','At 6 or fewer wounds remaining, this model is damaged.'),A('Deadly Demise D6','On destruction, its Deadly Demise can inflict D6 mortal wounds.'),A('Deep Strike','This unit can enter using Deep Strike.'),A('Aegis of the Emperor','This unit has Feel No Pain 5+ against mortal wounds.'),A('Repulsor Suspensor Technology','Once per phase after losing a wound to enemy shooting, if unengaged, this unit can make a normal move up to D6 inches.'),A('Assault Vehicle','After this transport Advances, embarked units can make the codex shock disembark move.'),A('Transport','Transport capacity: 8 Adeptus Custodes Infantry models; Jump Pack models cannot embark.')],
    defaultPoints:225,pointsOptions:[P(1,225,'1st–2nd unit'),P(1,245,'3rd+ unit')]
  }),
  'adeptus-custodes:knight-centura': unit({
    characteristics:C('7"',3,'3+',4,'6+',1,'5+'), keywords:['Infantry','Anathema Psykana','Character','Imperium'],
    weapons:[W('Master-crafted Boltgun','24"',2,'2+',5,-1,2,'Anti-Psyker 4+, Assault, Rapid Fire 1','Wargear option'),W('Master-crafted Flamer','12"',4,'—',4,-1,1,'Anti-Psyker 4+, Assault, Blast 2, Torrent','Wargear option'),W('Executioner Greatblade','Melee',4,'2+',5,-2,2,'Anti-Psyker 5+, Cleave 1, Devastating Wounds vs Psyker'),W('Gun Stock','Melee',3,'2+',3,0,1,'','Wargear option')],
    abilities:[A('Scouts 7"','This unit can make its Scouts move before the first battle round.'),A('Support','Can be attached as a support model to Prosecutor, Vigilator or Witchseeker Squad.'),daughters,A("Seeker's Instincts",'This supported unit gains +2 inches Move and can re-roll Advance and Charge rolls.'),A('Corner the Quarry','Non-Monster/Vehicle enemies engaged with this unit that Fall Back must use Desperate Escape; Battle-shocked enemies receive an additional penalty.')],
    defaultPoints:55
  }),
  'adeptus-custodes:prosecutor-squad': unit({
    characteristics:C('7"',3,'3+',1,'6+',2), keywords:['Infantry','Anathema Psykana','Imperium'],
    weapons:[W('Boltgun','24"',1,'3+',5,-1,1,'Anti-Psyker 4+, Assault, Rapid Fire 1'),W('Gun Stock','Melee',2,'3+',3,0,1)],
    abilities:[daughters,A('Purity of Execution','In the Shooting phase this unit can detect a visible enemy within 18 inches, increasing that target’s detection range.')],
    defaultModelCount:4,defaultPoints:45,pointsOptions:[P(4,45),P(5,50),P(9,80),P(10,90)]
  }),
  'adeptus-custodes:witchseeker-squad': unit({
    characteristics:C('7"',3,'3+',1,'6+',1), keywords:['Infantry','Anathema Psykana','Imperium'],
    weapons:[W('Flamer','12"',3,'—',4,-1,1,'Anti-Psyker 4+, Assault, Blast 1, Torrent'),W('Gun Stock','Melee',2,'3+',3,0,1)],
    abilities:[A('Scouts 7"','This unit can make its Scouts move before the first battle round.'),daughters,A('Sanctified Flames','After this unit shoots, one enemy hit by those attacks takes a Battle-shock roll, with an additional penalty if it is a Psyker.')],
    defaultModelCount:4,defaultPoints:55,pointsOptions:[P(4,55),P(5,60),P(9,100),P(10,110)]
  }),
  'adeptus-custodes:vigilator-squad': unit({
    characteristics:C('7"',3,'3+',1,'6+',1), keywords:['Infantry','Anathema Psykana','Imperium'],
    weapons:[W('Executioner Greatblade','Melee',3,'3+',5,-2,2,'Anti-Psyker 5+, Devastating Wounds vs Psyker')],
    abilities:[daughters,A('Deft Parry','Melee attacks targeting this unit are -1 to Hit.')],
    defaultModelCount:4,defaultPoints:50,pointsOptions:[P(4,50),P(5,55),P(9,90),P(10,100)]
  }),
  'adeptus-custodes:anathema-psykana-rhino': unit({
    characteristics:C('12"',9,'3+',10,'6+',2), keywords:['Vehicle','Anathema Psykana','Dedicated Transport','Frame','Imperium','Smoke','Transport'],
    weapons:[W('Hunter-killer Missile','48"',1,'2+',14,-3,'D3+3','One Shot','Wargear option'),W('Storm Bolter','24"',2,'3+',5,-1,1,'Rapid Fire 2'),W('Armoured Tracks','Melee',3,'4+',6,0,1)],
    abilities:[A('Deadly Demise D3','On destruction, its Deadly Demise can inflict D3 mortal wounds.'),A('Firing Deck 2','Up to two embarked models can contribute eligible ranged weapons through Firing Deck.'),daughters,A('Assault Vehicle','After this transport Advances, embarked units can make a shock disembark move.'),A('Transport','Transport capacity: 12 Anathema Psykana Infantry models.')],
    defaultPoints:70,pointsOptions:[P(1,70,'1st–3rd unit'),P(1,80,'4th+ unit')]
  }),
  'adeptus-custodes:ares-gunship': unit({
    characteristics:C('—',12,'2+',22,'6+',0,'5+'), keywords:['Vehicle','Aircraft','Fly','Imperium','Adeptus Custodes'],
    weapons:[W('Arachnus Heavy Blaze Cannon','36"',4,'2+',12,-3,'D3+3'),W('Arachnus Magna-blaze Cannon','48"',3,'2+',18,-3,'D6+6'),W('Armoured Hull','Melee',9,'4+',9,0,1)],
    abilities:[A('Damaged 7','At 7 or fewer wounds remaining, this model is damaged.'),A('Deadly Demise D6','On destruction, its Deadly Demise can inflict D6 mortal wounds.'),A('Aegis of the Emperor','This unit has Feel No Pain 5+ against mortal wounds.'),A('Infernus Firebombs','Once its bombing target is designated, the target loses Cover against Custodes ranged attacks and can suffer mortal wounds based on its model count.')],
    defaultPoints:580,pointsOptions:[P(1,580,'1st unit'),P(1,610,'2nd+ unit')]
  }),
  'adeptus-custodes:orion-assault-dropship': unit({
    characteristics:C('14"',12,'2+',22,'6+',0,'5+'), keywords:['Vehicle','Fly','Imperium','Transport','Adeptus Custodes'],
    weapons:[W('Arachnus Heavy Blaze Cannon','36"',4,'2+',12,-3,'D3+3'),W('Spiculus Heavy Bolt Launcher','36"',8,'2+',7,-1,2,'Blast 2'),W('Twin Lastrum Bolt Cannon','36"',3,'2+',6,-2,2,'Sustained Hits 1, Twin-linked'),W('Armoured Hull','Melee',9,'4+',9,0,1)],
    abilities:[A('Damaged 7','At 7 or fewer wounds remaining, this model is damaged.'),A('Deadly Demise D6','On destruction, its Deadly Demise can inflict D6 mortal wounds.'),A('Hover','This aircraft can use Hover.'),A('Aegis of the Emperor','This unit has Feel No Pain 5+ against mortal wounds.'),A('Assault Dropship','A Custodes unit making a tactical disembark from this transport can Advance and remain eligible to Charge.'),A('Transport','Carries 12 Custodes Infantry, or 1 Dreadnought; with one Dreadnought aboard it can also carry 6 Custodes Infantry.')],
    defaultPoints:690,pointsOptions:[P(1,690,'1st unit'),P(1,740,'2nd+ unit')]
  }),

  // Current Legends entries are retained as explicitly tagged, source-reviewed options.
  'adeptus-custodes:aleya': unit({
    characteristics:C('7"',3,'3+',4,'6+',1,'5+'),keywords:['Infantry','Anathema Psykana','Character','Epic Hero','Imperium','Legends'],
    weapons:[W('Somnus','Melee',4,'2+',6,-3,3,'Anti-Psyker 5+, Devastating Wounds')],
    abilities:[A('Feel No Pain 5+','This model has Feel No Pain 5+.'),A('Leader','Can lead Prosecutor, Vigilator or Witchseeker Squad.'),A('Scouts 6"','This unit can make a Scouts move.'),daughters,A('Tactical Perception','This unit has Fights First.'),A('Tenacious Spirit','When the unit is below starting strength its attacks improve to Hit; below half-strength they also improve to Wound.')],
    defaultPoints:55,legends:true,sourceUrl:'https://wahapedia.ru/wh40k11ed/factions/adeptus-custodes/Aleya'
  }),
  'adeptus-custodes:valerian': unit({
    characteristics:C('8"',7,'2+',8,'5+',2,'4+'),keywords:['Infantry','Character','Epic Hero','Imperium','Legends','Adeptus Custodes'],
    weapons:[W('Gnosis (ranged)','24"',3,'2+',6,-1,2,'Assault, Rapid Fire 2'),W('Gnosis','Melee',7,'2+',8,-3,3)],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),A('Feel No Pain 6+','This model has Feel No Pain 6+.'),A('Leader','Can lead current Guard, Sentinel Guard, Wardens and reviewed Legends Guard variants.'),...custodesCore,aquila,A('Golden Laurels','Attacks targeting this unit have their AP worsened by 1.'),A("Hero of Lion's Gate",'Once per battle after a Hit, Wound or Save roll for Valerian, change that result to an unmodified 6.')],
    defaultPoints:130,legends:true,sourceUrl:'https://wahapedia.ru/wh40k11ed/factions/adeptus-custodes/Valerian'
  }),
  'adeptus-custodes:custodian-guard-sodality-with-adrasite-spears': unit({
    characteristics:C('8"',7,'2+',5,'5+',3,'4+'),keywords:['Infantry','Imperium','Trusted Sentinel','Legends','Adeptus Custodes'],
    weapons:[W('Adrasite Spear (ranged)','18"',2,'2+',8,-2,3),W('Adrasite Spear','Melee',6,'2+',8,-2,2)],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),...custodesCore,A('Stand Vigil','Attacks can re-roll Wound rolls of 1, or all Wound rolls while this unit is within range of an objective.')],
    defaultModelCount:3,defaultPoints:200,legends:true,sourceUrl:'https://wahapedia.ru/wh40k11ed/factions/adeptus-custodes/Custodian-Guard-Sodality-with-Adrasite-Spears'
  }),
  'adeptus-custodes:custodian-guard-sodality-with-pyrithite-spears': unit({
    characteristics:C('8"',7,'2+',5,'5+',3,'4+'),keywords:['Infantry','Imperium','Trusted Sentinel','Legends','Adeptus Custodes'],
    weapons:[W('Pyrithite Spear (ranged)','12"',1,'2+',10,-3,'D3+2','Melta 2'),W('Pyrithite Spear','Melee',6,'2+',8,-2,2)],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),...custodesCore,A('No Foe Shall Stand','Once per battle, this unit can give its ranged attacks Lethal Hits and Ignores Cover.')],
    defaultModelCount:3,defaultPoints:215,legends:true,sourceUrl:'https://wahapedia.ru/wh40k11ed/factions/adeptus-custodes/Custodian-Guard-Sodality-with-Pyrithite-Spears'
  }),
  'adeptus-custodes:sagittarum-custodians-sodality': unit({
    characteristics:C('8"',7,'2+',5,'5+',3,'4+'),keywords:['Infantry','Imperium','Trusted Sentinel','Legends','Adeptus Custodes'],
    weapons:[W('Adrastus Bolt Caliver','36"',3,'2+',7,-2,2,'Sustained Hits 1'),W('Misericordia','Melee',4,'2+',6,-2,1)],
    abilities:[A('Deep Strike','This unit can enter using Deep Strike.'),...custodesCore,A('Disintegration Beams','Once per battle this unit can give its ranged attacks Devastating Wounds for a Shooting phase.'),A('Saturation Volleys','After shooting, a non-Monster/Vehicle unit hit can be suppressed, imposing -1 to Hit until the start of your next turn.')],
    defaultModelCount:3,defaultPoints:185,legends:true,sourceUrl:'https://wahapedia.ru/wh40k11ed/factions/adeptus-custodes/Sagittarum-Custodians-Sodality'
  }),
  'adeptus-custodes:venerable-land-raider': unit({
    characteristics:C('10"',12,'2+',16,'7+',1),keywords:['Vehicle','Frame','Imperium','Smoke','Transport','Legends','Adeptus Custodes'],
    weapons:[W('Godhammer Lascannon','48"',2,'2+',12,-3,'D3+3'),W('Hunter-killer Missile','48"',1,'2+',14,-3,'D3+3','One Shot','Wargear option'),W('Storm Bolter','24"',2,'2+',5,-1,1,'Rapid Fire 2','Wargear option'),W('Twin Heavy Bolter','36"',3,'2+',5,-1,2,'Rapid Fire 2, Sustained Hits 1, Twin-linked'),W('Armoured Tracks','Melee',6,'4+',8,0,1)],
    abilities:[A('Damaged 5','At 5 or fewer wounds remaining, this model is damaged.'),A('Deadly Demise D6','On destruction, its Deadly Demise can inflict D6 mortal wounds.'),A('Aegis of the Emperor','This unit has Feel No Pain 5+ against mortal wounds.'),A('Assault Ramp','After this transport makes a Normal Move, embarked units can use the Assault Disembark move.'),A('Transport','Carries 6 Adeptus Custodes Infantry models.')],
    defaultPoints:230,legends:true,sourceUrl:'https://wahapedia.ru/wh40k11ed/factions/adeptus-custodes/Venerable-Land-Raider'
  }),
  'adeptus-custodes:venerable-contemptor-dreadnought': unit({
    characteristics:C('9"',10,'2+',12,'5+',3,'4+'),keywords:['Vehicle','Imperium','Walker','Legends','Adeptus Custodes'],
    weapons:[W('Combi-bolter','24"',2,'2+',5,-1,1,'Rapid Fire 2'),W('Kheres-pattern Assault Cannon','24"',6,'2+',7,-2,2,'Sustained Hits 1','Wargear option'),W('Multi-melta','18"',2,'2+',10,-3,'D3+2','Melta 3'),W('Contemptor Fist','Melee',5,'2+',12,-3,'D3+3')],
    abilities:[A('Damaged 4','At 4 or fewer wounds remaining, this model is damaged.'),A('Deadly Demise D3','On destruction, its Deadly Demise can inflict D3 mortal wounds.'),...custodesCore,A('Unyielding Ancient','Once per battle when destroyed, on a 2+ this model can return near where it fell with 3 wounds remaining.')],
    defaultPoints:220,legends:true,sourceUrl:'https://wahapedia.ru/wh40k11ed/factions/adeptus-custodes/Venerable-Contemptor-Dreadnought'
  })
});

export function getAdeptusCustodesDatasheetDetails(id) {
  return ADEPTUS_CUSTODES_DATASHEET_DETAILS[id] ?? null;
}
