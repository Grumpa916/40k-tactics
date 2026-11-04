/**
 * Source-scoped 11th edition combat-profile corrections for the 3 units
 * whose selectable loadouts were reviewed in this pass. Avoid changing
 * the generated community-reference projection in place.
 *
 * October 2026 Codex profiles cross-checked with current 11e datasheet
 * reference; official June 2026 Faction Pack corroborates mandatory
 * heavy-bolter Eradicator equipment but predates the October Codex.
 */
const ranged=(name,range,attacks,skill,strength,ap,damage,abilities)=>Object.freeze({name,range,attacks,skill,strength,ap,damage,abilities});
const melee=(name,attacks,skill,strength,ap,damage,abilities)=>ranged(name,'Melee',attacks,skill,strength,ap,damage,abilities);
const ability=(name,description)=>Object.freeze({name,description});
const changes=Object.freeze({
  'Incursor Squad':Object.freeze({
    characteristics:Object.freeze({Move:'8"',Toughness:'4',Save:'3+',Wounds:'2',Leadership:'6+','Objective Control':'1'}),
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Occulus Bolt Carbine','24"','2','3+','5','-1','1','Assault, Ignores Cover'),
      melee('Paired Combat Blades','3','3+','5','-1','1','Sustained Hits 1')
    ]),
    abilities:Object.freeze([
      ability('Scouts 6"','Use Scouts 6 inches during deployment, per the current deployment rules.'),
      ability('Divinator-class Auspexes','Once per phase in your Shooting phase when a friendly Astartes unit is selected to shoot, scan one visible enemy within 18 inches; ranged attacks targeting that unit can reroll Hit rolls of 1. Confirm timing and target manually.'),
      ability('Haywire Mine','Once per battle in your Shooting phase, choose a visible enemy within 6 inches and roll a D6; on 2+ it suffers D3 mortal wounds, or 2D3 if it is a Vehicle. Track use manually.')
    ])
  }),
  'Infiltrator Squad':Object.freeze({
    characteristics:Object.freeze({Move:'8"',Toughness:'4',Save:'3+',Wounds:'2',Leadership:'6+','Objective Control':'1'}),
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Marksman Bolt Carbine','24"','2','3+','5','-1','1','Precision, Rapid Fire 1'),
      melee('Ceramite Fists','3','3+','5','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Infiltrators','This unit can deploy using Infiltrators, subject to deployment restrictions.'),
      ability('Omni-scramblers','In your Shooting phase, select one visible enemy within 18 inches. The selected unit is detected and has +3 inches detection range. This is not the former 10e Reserves denial.'),
      ability('Helix Gauntlet','If equipped, heal D3 Wounds in your Command phase; adjust actual Wounds manually.')
    ])
  }),
  'Reiver Squad':Object.freeze({
    characteristics:Object.freeze({Move:'8"',Toughness:'4',Save:'3+',Wounds:'2',Leadership:'6+','Objective Control':'1'}),
    weapons:Object.freeze([
      ranged('Bolt Carbine','18"','3','3+','5','-1','1','Assault, Precision'),
      ranged('Special-issue Bolt Pistol','12"','1','3+','5','-2','1','Close-Quarters, Precision'),
      melee('Monomolecular Combat Knife','4','3+','5','-1','1','Precision')
    ]),
    abilities:Object.freeze([
      ability('Scouts 6"','Use Scouts 6 inches during deployment.'),
      ability('Terror Troops (Aura)','Enemy models within 3 inches of this unit have -1 to Objective Control. Confirm control manually.'),
      ability('Fearsome Assault','At the start of the Fight phase each engaged enemy unit must make a Battle-shock roll with -1 to the roll; toggle status manually.'),
      ability('Grav-chutes','If equipped, the unit has Deep Strike.'),
      ability('Grapnel Launchers','If equipped, the unit can move through models and ignore vertical movement distance.')
    ])
  }),
  'Ballistus Dreadnought':Object.freeze({
    characteristics:Object.freeze({Move:'8"',Toughness:'10',Save:'2+',Wounds:'12',Leadership:'6+','Objective Control':'4'}),
    weapons:Object.freeze([
      ranged('Ballistus Lascannon','48"','2','3+','12','-3','D3+3',''),
      ranged('Ballistus Missile Launcher - Frag','48"','D6+6','3+','5','-1','1','Blast 2'),
      ranged('Ballistus Missile Launcher - Krak','48"','2','3+','10','-2','D3+3',''),
      ranged('Storm Bolters','24"','4','3+','5','-1','1','Rapid Fire 4'),
      melee('Armoured Feet','5','3+','7','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Ballistus Strike','Ranged attacks gain Sustained Hits 1 only when targeting an enemy unit within 24 inches. Check live target distance manually.'),
      ability('Damaged 4','Apply the current damaged-vehicle core rule when 4 or fewer wounds remain; confirm manually.'),
      ability('Deadly Demise D3','Resolve Deadly Demise D3 on the tabletop; never auto-score.')
    ])
  }),
  'Brutalis Dreadnought':Object.freeze({
    characteristics:Object.freeze({Move:'10"',Toughness:'10',Save:'2+',Wounds:'12',Leadership:'6+','Objective Control':'4'}),
    weapons:Object.freeze([
      ranged('Bolt Rifles','24"','4','3+','5','-1','1','Twin-linked'),
      ranged('Twin Heavy Bolter','36"','3','3+','5','-1','2','Twin-linked, Sustained Hits 1, Rapid Fire 2'),
      ranged('Twin Icarus Ironhail Heavy Stubber','36"','3','3+','4','-1','1','Anti-Fly 3+, Rapid Fire 3, Twin-linked'),
      ranged('Twin Multi-melta','18"','2','3+','10','-3','D3+2','Melta 3, Twin-linked'),
      melee('Brutalis Fists','6','3+','12','-3','D3+3','Twin-linked'),
      melee('Brutalis Talons','8','3+','10','-2','2','Sustained Hits 1: non-Monster/Vehicle, Twin-linked, Cleave 2')
    ]),
    abilities:Object.freeze([
      ability('Brutalis Charge','Once per phase, per unit: this unit may be targeted by Crushing Impact even after another use; its use is -1 CP and does not prevent further uses. Confirm stratagem timing and CP manually.'),
      ability('Damaged 4','Apply the current damaged-vehicle rule at 4 or fewer wounds; no old 10e damage-to-hit assumption.'),
      ability('Deadly Demise D3','Resolve Deadly Demise D3 manually.')
    ])
  }),
  'Redemptor Dreadnought':Object.freeze({
    characteristics:Object.freeze({Move:'8"',Toughness:'10',Save:'2+',Wounds:'12',Leadership:'6+','Objective Control':'4'}),
    weapons:Object.freeze([
      ranged('Fragstorm Grenade Launchers','18"','6','3+','4','-1','1','Blast 2'),
      ranged('Heavy Flamer','12"','3','N/A','5','-1','1','Blast 2, Torrent'),
      ranged('Heavy Onslaught Gatling Cannon','24"','12','3+','6','-1','1','Devastating Wounds: non-Monster/Vehicle, Sustained Hits 2: non-Monster/Vehicle'),
      ranged('Icarus Rocket Pod','24"','3','3+','6','-1','2','Anti-Fly 2+'),
      ranged('Macro Plasma Incinerator - Standard','36"','D3+3','3+','9','-3','2','Blast 1'),
      ranged('Macro Plasma Incinerator - Supercharge','36"','D3+3','3+','10','-4','3','Blast 1, Hazardous'),
      ranged('Onslaught Gatling Cannon','24"','8','3+','5','-1','1','Devastating Wounds: non-Monster/Vehicle'),
      ranged('Storm Bolters','24"','4','3+','5','-1','1','Rapid Fire 4'),
      melee('Redemptor Fist','5','3+','12','-3','D3+3','')
    ]),
    abilities:Object.freeze([
      ability('Duty Eternal','Attacks targeting this unit with Strength GREATER than its Toughness have -1 to wound rolls; not universal -1 Damage. Confirm strength and modifiers manually.'),
      ability('Damaged 4','Apply damaged-vehicle core rule at 4 or fewer wounds; confirm manually.'),
      ability('Deadly Demise D3','Resolve Deadly Demise D3 manually.')
    ])
  }),
  'Assault Intercessor Squad':Object.freeze({
    characteristics:Object.freeze({Move:'6"',Toughness:'5',Save:'3+',Wounds:'2',Leadership:'6+','Objective Control':'2'}),
    weapons:Object.freeze([
      ranged('Heavy Bolt Pistol','18"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Hand Flamer','9"','3','N/A','4','0','1','Close-Quarters, Torrent'),
      ranged('Plasma Pistol - Standard','12"','1','3+','7','-2','1','Close-Quarters'),
      ranged('Plasma Pistol - Supercharge','12"','1','3+','8','-3','2','Close-Quarters, Hazardous'),
      melee('Chainsword','4','3+','5','-1','1',''),
      melee('Power Fist','3','3+','8','-2','2',''),
      melee('Power Weapon','4','3+','5','-2','1',''),
      melee('Thunder Hammer','3','4+','8','-2','3','Devastating Wounds')
    ]),
    abilities:Object.freeze([
      ability('Targeted Intercession','If this unit made a charge move this turn, its melee attacks have +1 Strength and +1 AP. Confirm charge history manually.')
    ])
  }),
  'Heavy Intercessor Squad':Object.freeze({
    characteristics:Object.freeze({Move:'5"',Toughness:'6',Save:'3+',Wounds:'3',Leadership:'6+','Objective Control':'2'}),
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Heavy Bolt Rifle','30"','2','3+','5','-1','2','Heavy, Rapid Fire 1'),
      ranged('Heavy Bolter','36"','3','3+','5','-1','2','Heavy, Rapid Fire 2, Sustained Hits 1'),
      melee('Ceramite Fists','3','3+','5','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Unyielding in the Face of the Foe','When this unit is controlling an objective, it gets +1 to armour save rolls; confirm objective control manually.')
    ])
  }),
  'Infernus Squad':Object.freeze({
    characteristics:Object.freeze({Move:'6"',Toughness:'5',Save:'3+',Wounds:'2',Leadership:'6+','Objective Control':'1'}),
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Pyreblaster','12"','3','N/A','5','-1','1','Blast 1, Torrent'),
      melee('Ceramite Fists','3','3+','5','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Driven from Cover','After this unit shoots, select one enemy unit hit by those attacks; friendly Astartes ranged attacks targeting that unit have Ignores Cover. Record manually.')
    ])
  }),
  'Desolation Squad':Object.freeze({
    characteristics:Object.freeze({Move:'6"',Toughness:'5',Save:'3+',Wounds:'2',Leadership:'6+','Objective Control':'1'}),
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Castellan Launcher','24"','2','3+','5','-1','1','Heavy'),
      ranged('Superfrag Rocket Launcher','48"','4','3+','5','-1','1','Blast 1, Heavy'),
      ranged('Superkrak Rocket Launcher','48"','1','3+','10','-2','D3+3','Heavy'),
      ranged('Vengor Launcher','48"','4','3+','7','-1','2','Blast 1, Heavy, Indirect Fire'),
      melee('Ceramite Fists','3','3+','5','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Targeter Optics','Ranged attacks targeting a visible enemy unit have Ignores Cover. Confirm visibility and Indirect Fire manually.')
    ])
  }),
  'Company Heroes':Object.freeze({
    characteristics:Object.freeze({Move:'6"',Toughness:'5',Save:'3+',Wounds:'4',Leadership:'6+','Objective Control':'2'}),
    weapons:Object.freeze([
      ranged('Master-crafted Bolt Pistol','12"','1','3+','5','-1','2','Close-Quarters'),
      ranged('Master-crafted Bolt Rifle','24"','2','3+','5','-1','2','Assault, Rapid Fire 1'),
      ranged('Master-crafted Heavy Bolter','36"','4','3+','6','-1','2','Assault, Heavy, Rapid Fire 2, Sustained Hits 1'),
      melee('Combat Knife','5','3+','5','-1','1',''),
      melee('Master-crafted Power Weapon','6','2+','6','-2','2','Precision')
    ]),
    abilities:Object.freeze([
      ability('Command Squad','Attacks targeting this unit have -1 to wound rolls. Resolve manually.'),
      ability('Raise the Banner','At end of your Movement phase, if this unit controls an objective, that objective is secured. Confirm manually.'),
      ability('Model-specific roles','Four fixed models: Ancient, Champion, Veteran with Bolt Rifle, Veteran with Heavy Bolter; Ancient is a Character and Champion has Champion keyword. Allocate losses individually on the tabletop.')
    ])
  }),
  'Assault Intercessors with Jump Packs':Object.freeze({
    characteristics:Object.freeze({Move:'12"',Toughness:'5',Save:'3+',Wounds:'2',Leadership:'6+','Objective Control':'1'}),
    weapons:Object.freeze([
      ranged('Hand Flamer','9"','3','N/A','4','0','1','Close-Quarters, Torrent'),
      ranged('Heavy Bolt Pistol','18"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Plasma Pistol - Standard','12"','1','3+','7','-2','1','Close-Quarters'),
      ranged('Plasma Pistol - Supercharge','12"','1','3+','8','-3','2','Close-Quarters, Hazardous'),
      melee('Chainsword','4','3+','5','-1','1',''),
      melee('Power Fist','3','3+','8','-2','2',''),
      melee('Power Weapon','4','3+','5','-2','1','')
    ]),
    abilities:Object.freeze([
      ability('Deep Strike','Use normal Deep Strike setup and timing restrictions.'),
      ability('Hammer of Wrath','After this unit ends a charge move, select one engaged enemy unit; for each model engaged with that enemy, roll one D6. Each 4+ inflicts one mortal wound. Record the result manually.')
    ])
  }),
  'Vanguard Veteran Squad with Jump Packs':Object.freeze({
    characteristics:Object.freeze({Move:'12"',Toughness:'5',Save:'3+',Wounds:'2',Leadership:'6+','Objective Control':'1'}),
    weapons:Object.freeze([
      ranged('Heavy Bolt Pistol','18"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Plasma Pistol - Standard','12"','1','3+','7','-2','1','Close-Quarters'),
      ranged('Plasma Pistol - Supercharge','12"','1','3+','8','-3','2','Close-Quarters, Hazardous'),
      melee('Master-crafted Power Weapon','3','3+','5','-2','2',''),
      melee('Relic Blade','3','3+','6','-2','2','Cleave 1, Lethal Hits: non-Monster/Vehicle'),
      melee('Power Fist','3','3+','8','-2','2',''),
      melee('Thunder Hammer','3','4+','8','-2','3','Devastating Wounds')
    ]),
    abilities:Object.freeze([
      ability('Deep Strike','Use normal Deep Strike setup and timing restrictions.'),
      ability('Vanguard Assault','If the unit made a charge move this turn, its melee attacks have +1 Attack; confirm charge history manually.'),
      ability('Combat Shield','Only a model equipped with a Combat Shield has a 5+ invulnerable save. Track which models are shielded when allocating damage.')
    ])
  }),
  'Scout Squad':Object.freeze({
    characteristics:Object.freeze({Move:'6"',Toughness:'4',Save:'4+',Wounds:'2',Leadership:'6+','Objective Control':'1'}),
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Boltgun','24"','1','3+','5','-1','1','Rapid Fire 1'),
      ranged('Shotgun','18"','2','3+','4','-1','1','Assault, Blast 1'),
      ranged('Sniper Rifle','36"','1','3+','5','-2','2','Heavy, Precision'),
      ranged('Heavy Bolter','36"','3','4+','5','-1','2','Heavy, Rapid Fire 2, Sustained Hits 1'),
      ranged('Missile Launcher - Frag','48"','4','4+','4','-1','1','Blast 1, Heavy'),
      ranged('Missile Launcher - Krak','48"','1','4+','10','-2','D3+3',''),
      melee('Combat Knife','3','3+','4','-1','1',''),
      melee('Chainsword','4','3+','4','-1','1','')
    ]),
    abilities:Object.freeze([
      ability('Infiltrators','Check Scout deployment placement and restriction manually.'),
      ability('Scouts 6"','Use the Scouts 6 inches deployment rule.'),
      ability('Flexible Asset','An advance or fall-back move does not prevent this unit from starting an action. Confirm scoring manually.')
    ])
  }),
  'Outrider Squad':Object.freeze({
    characteristics:Object.freeze({Move:'12"',Toughness:'6',Save:'3+',Wounds:'4',Leadership:'6+','Objective Control':'2'}),
    weapons:Object.freeze([
      ranged('Heavy Bolt Pistol','18"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Plasma Pistol - Standard','12"','1','3+','7','-2','1','Close-Quarters'),
      ranged('Plasma Pistol - Supercharge','12"','1','3+','8','-3','2','Close-Quarters, Hazardous'),
      ranged('Twin Bolt Rifle','24"','2','2+','5','-1','1','Twin-linked, Assault, Rapid Fire 2'),
      melee('Chainsword','4','3+','5','-1','1',''),
      melee('Power Weapon','3','3+','5','-2','1',''),
      melee('Thunder Hammer','3','4+','8','-2','3','Devastating Wounds')
    ]),
    abilities:Object.freeze([
      ability('Full-throttle Assault','After a successful charge, Thunder Hammer attacks have +1 to Hit and Sustained Hits 1; other melee weapons gain +1 Damage and Sustained Hits 1. Confirm charge history manually.')
    ])
  }),
  'Sternguard Veteran Squad':Object.freeze({
    characteristics:Object.freeze({'Toughness':'5'}),
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Artificer Firearm - Infernus','24"','2','3+','5','-1','1','Assault, Rapid Fire 2'),
      ranged('Artificer Firearm - Purgatus','24"','1','3+','7','-2','2','Assault, Rapid Fire 1'),
      ranged('Artificer Firearm - Damnatus','12"','1','3+','9','-3','D3+2','Assault, Melta 2'),
      ranged('Heavy Bolter','36"','3','3+','5','-1','2','Heavy, Rapid Fire 2, Sustained Hits 1'),
      ranged('Pyrecannon','12"','4','N/A','6','-1','1','Blast 2, Torrent'),
      melee('Ceramite Fists','4','3+','5','0','1',''),
      melee('Chainsword','6','3+','5','-1','1',''),
      melee('Power Fist','4','3+','8','-2','2',''),
      melee('Power Weapon','5','3+','5','-2','1','')
    ]),
    abilities:Object.freeze([
      ability('Veteran Marksmen','This unit’s ranged attacks can reroll Hit rolls of 1. Resolve rerolls on the tabletop.')
    ])
  }),
  'Inceptor Squad':Object.freeze({
    characteristics:Object.freeze({Move:'10"',Toughness:'6',Wounds:'3'}),
    weapons:Object.freeze([
      ranged('Assault Bolters','18"','3','3+','5','-1','2','Assault, Close-Quarters, Sustained Hits 2, Twin-linked'),
      ranged('Plasma Exterminators - Standard','18"','2','3+','7','-2','2','Assault, Close-Quarters, Twin-linked'),
      ranged('Plasma Exterminators - Supercharge','18"','2','3+','8','-3','3','Assault, Close-Quarters, Hazardous, Twin-linked'),
      melee('Ceramite Fists','3','3+','5','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Deep Strike','This unit can use the Deep Strike deployment rule.'),
      ability('Meteoric Descent','If this unit made an ingress move this turn, its ranged attacks have +1 to Hit. Confirm the movement history.'),
      ability('Parabolic Jetleap','At the end of the opponent Fight phase, if unengaged, this unit may enter Strategic Reserves. Track manually.')
    ])
  }),
  'Eliminator Squad':Object.freeze({
    characteristics:Object.freeze({Move:'8"',Toughness:'4'}),
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Bolt Sniper Rifle','36"','1','3+','6','-2','3','Heavy, Precision'),
      ranged('Instigator Bolt Carbine','24"','2','2+','5','-2','2','Lethal Hits: non-Monster/Vehicle, Rapid Fire 2, Precision'),
      ranged('Las Fusil','36"','1','3+','10','-3','D3+3','Heavy'),
      melee('Ceramite Fists','3','3+','5','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Infiltrators','Use the Infiltrators deployment rule.'),
      ability('Stealth','Use the Stealth defensive rule.'),
      ability('Chameleoline Cloaks','This unit has -3-inch detection range. Apply manually.'),
      ability('Special-issue Optics and Ammunition','When selected to shoot, choose Ignores Cover for its ranged attacks or increase one enemy unit’s detection range by 6 inches if within 24 inches; confirm manually.')
    ])
  }),
  'Bladeguard Veteran Squad':Object.freeze({
    characteristics:Object.freeze({'Toughness':'5','Invulnerable save':'4+'}),
    weapons:Object.freeze([
      ranged('Heavy Bolt Pistol','18"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Neo-volkite Pistol','12"','1','3+','5','0','2','Close-Quarters, Devastating Wounds'),
      ranged('Plasma Pistol - Standard','12"','1','3+','7','-2','1','Close-Quarters'),
      ranged('Plasma Pistol - Supercharge','12"','1','3+','8','-3','2','Close-Quarters, Hazardous'),
      melee('Master-crafted Power Sword','4','3+','5','-2','2','')
    ]),
    abilities:Object.freeze([
      ability('Bladeguard','Once per turn in a Fight phase, when selected to fight or targeted by an enemy, choose either +1 to this unit’s melee Hit rolls or -1 to attacks targeting it. Confirm the choice on the tabletop.')
    ])
  }),
  'Hellblaster Squad':Object.freeze({
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Plasma Incinerator - Standard','24"','2','3+','7','-2','2','Assault, Rapid Fire 1'),
      ranged('Plasma Incinerator - Supercharge','24"','2','3+','8','-3','2','Assault, Rapid Fire 1, Hazardous'),
      ranged('Plasma Pistol - Standard','12"','1','3+','7','-2','1','Close-Quarters'),
      ranged('Plasma Pistol - Supercharge','12"','1','3+','8','-3','2','Close-Quarters, Hazardous'),
      melee('Ceramite Fists','3','3+','5','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Rites of Thermal Appeasement','Plasma Incinerator and Plasma Pistol weapons of this unit have +1 to Hazardous rolls; track actual rolls manually.')
    ])
  }),
  'Terminator Squad':Object.freeze({
    characteristics:Object.freeze({'Toughness':'6','Invulnerable save':'4+'}),
    weapons:Object.freeze([
      ranged('Storm Bolter','24"','2','3+','5','-1','1','Rapid Fire 2'),
      ranged('Assault Cannon','24"','6','3+','6','-2','1','Sustained Hits 1'),
      ranged('Heavy Flamer','12"','3','N/A','5','-1','1','Blast 2, Torrent'),
      ranged('Cyclone Missile Launcher - Frag','36"','8','3+','4','-1','1','Blast 2'),
      ranged('Cyclone Missile Launcher - Krak','36"','2','3+','10','-2','D3+3',''),
      melee('Power Fist','3','3+','8','-2','2',''),
      melee('Chainfist - Standard','2','4+','8','-2','2',''),
      melee('Chainfist - Hunter','3','3+','12','-2','3','Hunter: Monster/Vehicle only'),
      melee('Power Weapon','5','3+','5','-2','1','')
    ]),
    abilities:Object.freeze([
      ability('Fury of the First','This unit’s attacks against enemy units within 9 inches gain +1 AP. Check distance manually.'),
      ability('Teleport Homer','Once per battle, a placed homer can give -1 CP to Rapid Ingress if the placement requirements are met; track use and position manually.')
    ])
  }),
  'Intercessor Squad':Object.freeze({
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Bolt Rifle - Focused Fire','24"','1','3+','6','-1','2','Heavy, Rapid Fire 1'),
      ranged('Bolt Rifle - Saturation','24"','2','3+','5','-1','1','Assault, Rapid Fire 1'),
      ranged('Grenade Launcher - Frag','24"','4','3+','4','-1','1','Blast 1'),
      ranged('Grenade Launcher - Krak','24"','1','3+','10','-2','3','Rapid Fire 1'),
      ranged('Hand Flamer','9"','3','N/A','4','0','1','Close-Quarters, Torrent'),
      ranged('Plasma Pistol - Standard','12"','1','3+','7','-2','1','Close-Quarters'),
      ranged('Plasma Pistol - Supercharge','12"','1','3+','8','-3','2','Close-Quarters, Hazardous'),
      melee('Knives and Fists','3','3+','5','0','1',''),
      melee('Chainsword','5','3+','5','-1','1',''),
      melee('Power Fist','3','3+','8','-2','2',''),
      melee('Power Weapon','4','3+','5','-2','1',''),
      melee('Thunder Hammer','3','4+','8','-2','3','Devastating Wounds')
    ]),
    abilities:Object.freeze([
      ability('Bolter Discipline','During the Shooting phase, ranged attacks gain +1 to Hit when the unit or target is within range of an objective marker.'),
      ability('Tactical Mainstay','Being engaged or Battle-shocked does not prevent this unit starting a tabletop action, and starting an action does not stop it shooting.')
    ])
  }),
  'Eradicator Squad with Melta Rifles':Object.freeze({
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Melta Rifle','18"','1','3+','10','-3','D3+2','Melta 2'),
      ranged('Melta Rifle - Hunter','18"','1','2+','12','-3','D3+2','Melta 2, Hunter: Monster/Vehicle only'),
      ranged('Multi-melta','18"','2','3+','10','-3','D3+2','Melta 3'),
      ranged('Multi-melta - Hunter','18"','2','2+','12','-3','D3+2','Melta 3, Hunter: Monster/Vehicle only'),
      melee('Ceramite Fists','3','3+','5','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Total Obliteration','This unit’s ranged attacks can re-roll their Damage rolls. Confirm any roll changes at the tabletop.')
    ])
  }),
  'Aggressor Squad':Object.freeze({
    weapons:Object.freeze([
      ranged('Flamestorm Gauntlets - Close Quarters','12"','3','N/A','4','-1','1','Close-Quarters, Torrent, Twin-linked'),
      ranged('Flamestorm Gauntlets - Ranged','12"','3','N/A','4','-1','1','Blast 2, Torrent, Twin-linked'),
      ranged('Auto Boltstorm Gauntlets','18"','3','3+','5','-1','1','Close-Quarters, Twin-linked'),
      ranged('Fragstorm Grenade Launcher','18"','3','3+','4','-1','1','Blast 1'),
      melee('Twin Power Fists','3','3+','8','-2','2','Twin-linked')
    ]),
    abilities:Object.freeze([ability('Close-quarters Firestorm','This unit’s attacks that target an enemy unit within 9" have +1 Strength.')])
  }),
  'Terminator Assault Squad':Object.freeze({
    weapons:Object.freeze([
      melee('Twin Lightning Claws','6','3+','5','-2','1','Twin-linked'),
      melee('Thunder Hammer','3','3+','8','-2','3','Devastating Wounds')
    ]),
    abilities:Object.freeze([
      ability('Teleport Homer','Once per battle, use the deployed Teleport Homer to reduce Rapid Ingress CP cost by 1; follow the placement and 8-inch enemy-exclusion conditions on the current datasheet.'),
      ability('Terminatus Assault','After this unit charges, Lightning Claws gain Sustained Hits 1 against non-Monster/Vehicle targets; Thunder Hammers gain Sustained Hits 1 against Monster/Vehicle targets.'),
      ability('Storm Shield','Only models equipped with a Storm Shield have +1 W. Track each affected model manually in mixed units.')
    ])
  }),
  'Eradicator Squad with Heavy Bolters':Object.freeze({
    weapons:Object.freeze([
      ranged('Bolt pistol','12"','1','3+','4','0','1','Close-Quarters'),
      ranged('Heavy Bolter','36"','3','3+','5','-1','2','Heavy, Sustained Hits 1'),
      melee('Close combat weapon','3','3+','4','0','1','')
    ]),
    abilities:Object.freeze([ability('Overlapping Detonations','In your Shooting phase, select a visible enemy non-Monster/Vehicle unit; this unit’s heavy bolters have Blast 1 when targeting it.')])
  })
});
export const SPACE_MARINES_REVIEWED_PROFILE_PATCHES=changes;
export function applyReviewedSpaceMarineWargearProfiles(name,datasheet) {
 if(!datasheet || !changes[name])return datasheet;
 const patch=changes[name];
 return Object.freeze({
   ...datasheet,
   ...(patch.characteristics ? {characteristics:Object.freeze({...datasheet.characteristics,...patch.characteristics})}:{}),
   weapons:patch.weapons,
   abilities:patch.abilities,
   sourceName:'November 2026 11e selected loadout/profile cross-check',
   sourceUrl:'https://www.wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html',
   officialOctoberCodexFullTextVerified:false,
   profileReviewedAt:'2026-11-03'
 });
}
