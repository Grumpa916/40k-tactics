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
  "Land Raider":Object.freeze({
    characteristics:Object.freeze({Move:'10"',Toughness:'12',Save:'2+',Wounds:'16',Leadership:'6+','Objective Control':'5'}),
    weapons:Object.freeze([ranged("Godhammer Lascannon","48\"","2","3+","12","-3","D3+3",""),
      ranged("Twin Heavy Bolter","36\"","3","3+","5","-1","2","Twin-linked, Sustained Hits 1, Rapid Fire 2"),
      ranged("Hunter-killer Missile","48\"","1","2+","14","-3","D3+3","One Shot"),
      ranged("Multi-melta","18\"","2","3+","10","-3","D3+2","Melta 3"),
      ranged("Storm Bolter","24\"","2","3+","5","-1","1","Rapid Fire 2"),
      melee("Armoured Tracks","6","4+","8","0","1","")]),
    abilities:Object.freeze([ability("Power of the Machine Spirit","The unit may re-roll one hit roll and one wound roll for its ranged attacks. Confirm manually."),
      ability("Assault Ramp","When ending a normal move, embarked infantry can assault disembark. Capacity 14 infantry, no JUMP PACK; GRAVIS/TERMINATOR occupy two spaces."),
      ability("Damaged 6 and Deadly Demise D6","Apply at the correct wounds threshold and resolve demise on tabletop; do not automate.")])
  }),
  "Land Raider Crusader":Object.freeze({
    characteristics:Object.freeze({Move:'12"',Toughness:'12',Save:'2+',Wounds:'16',Leadership:'6+','Objective Control':'5'}),
    weapons:Object.freeze([ranged("Hurricane Bolter","24\"","6","3+","5","-1","1","Twin-linked, Rapid Fire 6"),
      ranged("Twin Assault Cannon","24\"","6","3+","6","-2","1","Sustained Hits 1, Twin-linked"),
      ranged("Hunter-killer Missile","48\"","1","2+","14","-3","D3+3","One Shot"),
      ranged("Multi-melta","18\"","2","3+","10","-3","D3+3","Melta 3"),
      ranged("Storm Bolter","24\"","2","3+","5","-1","1","Rapid Fire 2"),
      melee("Armoured Tracks","6","4+","8","0","1","")]),
    abilities:Object.freeze([ability("Fury of the Machine Spirit","Ranged attacks against an enemy unit within 12 inches have Lethal Hits; confirm range."),
      ability("Assault Ramp","When ending a normal move, embarked infantry can assault disembark. Capacity 16 infantry, no JUMP PACK; GRAVIS/TERMINATOR occupy two spaces."),
      ability("Damaged 6 and Deadly Demise D6","Apply at the correct wounds threshold and resolve demise on tabletop; do not automate.")])
  }),
  "Land Raider Redeemer":Object.freeze({
    characteristics:Object.freeze({Move:'12"',Toughness:'12',Save:'2+',Wounds:'16',Leadership:'6+','Objective Control':'5'}),
    weapons:Object.freeze([ranged("Flamestorm Cannon","12\"","4","N/A","6","-2","2","Torrent, Blast 2"),
      ranged("Twin Assault Cannon","24\"","6","3+","6","-2","1","Sustained Hits 1, Twin-linked"),
      ranged("Hunter-killer Missile","48\"","1","2+","14","-3","D3+3","One Shot"),
      ranged("Multi-melta","18\"","2","3+","10","-3","D3+2","Melta 3"),
      ranged("Storm Bolter","24\"","2","3+","5","-1","1","Rapid Fire 2"),
      melee("Armoured Tracks","6","4+","8","0","1","")]),
    abilities:Object.freeze([ability("Wrath of the Machine Spirit","Ranged attacks against units within 12 inches gain Devastating Wounds only if targets are non-MONSTER/VEHICLE."),
      ability("Assault Ramp","When ending a normal move, embarked infantry can assault disembark. Capacity 14 infantry, no JUMP PACK; GRAVIS/TERMINATOR occupy two spaces."),
      ability("Damaged 6 and Deadly Demise D6","Apply at the correct wounds threshold and resolve demise on tabletop; do not automate.")])
  }),
  "Drop Pod":Object.freeze({characteristics:Object.freeze({"Move":"-","Toughness":"7","Save":"3+","Wounds":"8","Leadership":"6+","Objective Control":"-"}),
    weapons:Object.freeze([]),
    abilities:Object.freeze([ability("Drop Pod Assault","Must start in Strategic Reserves. May ingress first Movement phase; all passengers disembark beyond 8 inches from enemies. Confirm manually."),
      ability("Deployment Complete","Once deployed, passengers cannot embark again."),
      ability("Transport Capacity","12 ADEPTUS ASTARTES INFANTRY, excludes GRAVIS/JUMP PACK/TERMINATOR."),
      ability("Deep Strike and Deadly Demise 1","No combat weapons. Resolve deployment and demise manually.")])}),
  "Impulsor":Object.freeze({characteristics:Object.freeze({"Move":"12\"","Toughness":"9","Save":"3+","Wounds":"11","Leadership":"6+","Objective Control":"2"}),
    weapons:Object.freeze([ranged("Bellicatus Missile Array - Frag","48\"","4","3+","4","-1","1","Blast 1"),
      ranged("Bellicatus Missile Array - Icarus","48\"","3","3+","6","-1","2","Anti-Fly 2+"),
      ranged("Bellicatus Missile Array - Krak","48\"","1","3+","10","-2","D3+3",""),
      ranged("Fragstorm Grenade Launchers","18\"","6","3+","4","-1","1","Blast 2"),
      ranged("Ironhail Heavy Stubber","36\"","3","3+","4","-1","1","Rapid Fire 3"),
      ranged("Ironhail Skytalon Array","36\"","6","3+","4","-1","1","Rapid Fire 6"),
      ranged("Storm Bolters","24\"","4","3+","5","-1","1","Rapid Fire 4"),
      melee("Armoured Hull","3","4+","6","0","1","")]),
    abilities:Object.freeze([ability("Rapid Disembarkation","After this unit advances in your Movement phase, embarked units may make a shock disembark move."),
      ability("Orbital Comms Array","If equipped grants Scouts 6 inches and costs an additional 10 points."),
      ability("Shield Dome","If equipped grants 5+ invulnerable save, not an extra attack."),
      ability("Transport Capacity","7 ADEPTUS ASTARTES INFANTRY; no TERMINATOR/JUMP PACK; GRAVIS take two. Firing Deck 7, Deadly Demise D3.")])}),
  "Rhino":Object.freeze({characteristics:Object.freeze({"Move":"12\"","Toughness":"9","Save":"3+","Wounds":"10","Leadership":"6+","Objective Control":"2"}),
    weapons:Object.freeze([ranged("Hunter-killer Missile","48\"","1","2+","14","-3","D3+3","One Shot"),
      ranged("Storm Bolter","24\"","2","3+","5","-1","1","Rapid Fire 2"),
      melee("Armoured Tracks","3","4+","6","0","1","")]),
    abilities:Object.freeze([ability("Veiling Smoke","Once per phase per unit, can use Smokescreen at -1 CP even if used elsewhere; track CP and timing manually."),
      ability("Transport Capacity","12 ADEPTUS ASTARTES INFANTRY; no GRAVIS/JUMP PACK/TERMINATOR. Firing Deck 2, Deadly Demise D3.")])}),
  "Land Speeder":Object.freeze({characteristics:Object.freeze({"Move":"14\"","Toughness":"8","Save":"3+","Wounds":"9","Leadership":"6+","Objective Control":"3"}),
    weapons:Object.freeze([ranged("Multi-melta","18\"","2","3+","10","-3","D3+2","Melta 3"),
      ranged("Onslaught Gatling Cannon","24\"","8","3+","5","-1","1","Devastating Wounds: non-MONSTER/VEHICLE"),
      ranged("Pyrecannon","12\"","4","N/A","6","-1","1","Blast 2, Torrent"),
      ranged("Stormfury Missile Launcher","48\"","1","3+","10","-3","D3+3",""),
      melee("Armoured Impact","3","4+","6","0","1","")]),
    abilities:Object.freeze([ability("Purgation Run","After shooting, may make a normal move up to D6 inches but then cannot charge that turn. Resolve manually."),
      ability("Deep Strike","Apply current deployment rules manually.")])}),
  "Storm Speeder Hailstrike":Object.freeze({characteristics:Object.freeze({"Move":"14\"","Toughness":"9","Save":"3+","Wounds":"11","Leadership":"6+","Objective Control":"3"}),
    weapons:Object.freeze([ranged("Fragstorm Grenade Launchers","18\"","6","3+","4","-1","1","Blast 2, Ignores Cover"),
      ranged("Ironhail Heavy Stubber Array","36\"","6","3+","4","-1","1","Rapid Fire 6, Ignores Cover"),
      ranged("Onslaught Gatling Cannon","24\"","8","3+","5","-1","1","Devastating Wounds: non-MONSTER/VEHICLE, Ignores Cover"),
      melee("Armoured Impact","3","4+","6","0","1","")]),
    abilities:Object.freeze([ability("Hailstrike","After shooting select one enemy HIT. Friendly ADEPTUS ASTARTES ranged attacks against that enemy gain Ignores Cover. Confirm hit and target manually."),
      ability("Deep Strike and Deadly Demise D3","Resolve manually.")])}),
  "Storm Speeder Hammerstrike":Object.freeze({characteristics:Object.freeze({"Move":"14\"","Toughness":"9","Save":"3+","Wounds":"11","Leadership":"6+","Objective Control":"3"}),
    weapons:Object.freeze([ranged("Hammerstrike Missile Launcher","36\"","2","3+","10","-3","D3+2",""),
      ranged("Krakstorm Grenade Launchers","18\"","2","3+","9","-1","2",""),
      ranged("Melta Destroyer","18\"","3","3+","10","-3","D3+2","Melta 3"),
      melee("Armoured Impact","3","4+","6","0","1","")]),
    abilities:Object.freeze([ability("Hammerstrike","Ranged attacks targeting an enemy within a terrain area have Sustained Hits 1; check target area manually."),
      ability("Deep Strike and Deadly Demise D3","Resolve manually.")])}),
  "Storm Speeder Thunderstrike":Object.freeze({characteristics:Object.freeze({"Move":"14\"","Toughness":"9","Save":"3+","Wounds":"11","Leadership":"6+","Objective Control":"3"}),
    weapons:Object.freeze([ranged("Stormfury Missile Launcher","48\"","2","3+","10","-3","D3+3",""),
      ranged("Thunderstrike Icarus Rocket Pod","24\"","6","3+","6","-1","2","Anti-Fly 2+"),
      ranged("Thunderstrike Las-talon","36\"","2","3+","10","-3","D3+3",""),
      melee("Armoured Impact","3","4+","6","0","1","")]),
    abilities:Object.freeze([ability("Thunderstrike","Ranged attacks by this unit against MONSTER/VEHICLE targets have +1 to wound."),
      ability("Shattered Defences","After shooting, select enemy MONSTER/VEHICLE hit; friendly ADEPTUS ASTARTES ranged attacks against that enemy get +1 AP. Confirm manually."),
      ability("Deep Strike and Deadly Demise D3","Resolve manually.")])}),
  "Astraeus":Object.freeze({characteristics:Object.freeze({"Move":"10\"","Toughness":"12","Save":"2+","Wounds":"24","Leadership":"6+","Objective Control":"8"}),
    weapons:Object.freeze([ranged("Astareus Las-ripper","36\"","2","3+","12","-3","D3+3",""),
      ranged("Ironhail Heavy Stubber","36\"","3","3+","4","-1","1","Rapid Fire 3"),
      ranged("Plasma Eradicator - Standard","36\"","3","3+","7","-2","2","Blast 2"),
      ranged("Plasma Eradicator - Supercharge","36\"","3","3+","8","-3","3","Blast 2, Hazardous"),
      ranged("Storm Bolter","24\"","2","3+","5","-1","1","Rapid Fire 2"),
      ranged("Twin Heavy Bolter","36\"","3","3+","5","-1","2","Twin-linked, Sustained Hits 1, Rapid Fire 2"),
      ranged("Twin Lascannon","48\"","1","3+","12","-3","D3+3","Twin-linked"),
      ranged("Twin Macro-accelerator Cannon","72\"","12","3+","10","-1","3","Twin-linked, Sustained Hits 1"),
      melee("Armoured Hull","6","4+","8","0","1","")]),
    abilities:Object.freeze([ability("Suppression Fire","After shooting, an enemy HIT by the Twin Macro-accelerator Cannon is suppressed: its attacks take -1 to hit until your next turn."),
      ability("Ranged-only 5+ invulnerable","5+ invulnerable applies only against ranged attacks."),
      ability("Damaged 8 and Deadly Demise D6+2","Resolve manually.")])}),
  "Thunderhawk Gunship":Object.freeze({characteristics:Object.freeze({"Move":"14\"","Toughness":"12","Save":"2+","Wounds":"30","Leadership":"6+","Objective Control":"0"}),
    weapons:Object.freeze([ranged("Hellstrike Missile Battery","72\"","4","3+","8","-2","3","Anti-Fly 4+"),
      ranged("Lascannon","48\"","1","3+","12","-3","D3+3",""),
      ranged("Thunderhawk Heavy Cannon","48\"","10","3+","10","-2","3","Blast 2"),
      ranged("Turbo-laser Destructor","96\"","3","3+","20","-4","D6+6","Blast 2"),
      ranged("Twin Heavy Bolter","36\"","3","3+","5","-1","2","Rapid Fire 2, Twin-linked, Sustained Hits 1"),
      melee("Armoured Hull","6","4+","8","0","1","")]),
    abilities:Object.freeze([ability("Aerial Assault","After normal move, passengers may assault disembark only if EVERY embarked model has Deep Strike."),
      ability("Thunderhawk Cluster Bombs","If not swapped for extra Hellstrike, after flying over enemy on normal/advance, roll six D6: each 3+ inflicts one mortal wound. Resolve manually."),
      ability("Transport Capacity","30 ADEPTUS ASTARTES INFANTRY or MOUNTED spaces. Jump Pack/Gravis/Terminator take 2; Mounted take 4."),
      ability("Hover, Damaged 10, Deadly Demise D6+2","Resolve manually.")])}),
  "Techmarine":Object.freeze({characteristics:Object.freeze({"Move":"6\"","Toughness":"5","Save":"2+","Wounds":"4","Leadership":"6+","Objective Control":"1"}),
    weapons:Object.freeze([ranged("Forge Bolter","24\"","3","2+","5","-1","2","Sustained Hits 1"),
      ranged("Grav-pistol","12\"","2","2+","2","-1","3","Anti-Vehicle 2+, Close-Quarters"),
      melee("Omnissian Power Axe and Servo-arm","5","3+","6","-2","2","")]),
    abilities:Object.freeze([ability("Techmarine","Lone Operative while within 3 inches of friendly ADEPTUS ASTARTES VEHICLE."),
      ability("Blessings of the Omnissiah","Movement phase start/end of move, friendly VEHICLE within 3 inches heals D3 and ignores hit/wound modifiers until next Movement phase. Track actual healing manually."),
      ability("Leader","May join Assault Intercessor, Desolation or Intercessor Squad; special chapters may have more.")])}),
  "Repulsor":Object.freeze({
    characteristics:Object.freeze({"Move":"10\"","Toughness":"12","Save":"3+","Wounds":"16","Leadership":"6+","Objective Control":"5"}),
    weapons:Object.freeze([ranged("Defensive Array","24\"","18","3+","5","-1","1",""),
      ranged("Heavy Onslaught Gatling Cannon","24\"","12","3+","6","-1","1","Devastating Wounds: non-MONSTER/VEHICLE, Sustained Hits 2: non-MONSTER/VEHICLE"),
      ranged("Hunter-slayer Missile","48\"","1","2+","14","-3","D3+3","Indirect Fire, One Shot"),
      ranged("Las-talon","36\"","2","3+","10","-3","D3+3",""),
      ranged("Twin Heavy Bolter","36\"","3","3+","5","-1","2","Rapid Fire 2, Sustained Hits 1, Twin-linked"),
      ranged("Twin Lascannon","48\"","1","3+","12","-3","D3+3","Twin-linked"),
      melee("Armoured Hull","6","4+","8","0","1","")]),
    abilities:Object.freeze([ability("Combat Embarkation","Opponent Charge phase: one unengaged eligible infantry target unit entirely within 3 inches may embark; enemy can then select new charge targets. Resolve manually."),
      ability("Transport Capacity","14 ADEPTUS ASTARTES INFANTRY spaces; no JUMP PACK; GRAVIS/TERMINATOR count double."),
      ability("Damaged 6 and Deadly Demise D6","Resolve damaged threshold and demise manually.")])
  }),
  "Repulsor Executioner":Object.freeze({
    characteristics:Object.freeze({"Move":"10\"","Toughness":"12","Save":"3+","Wounds":"16","Leadership":"6+","Objective Control":"5"}),
    weapons:Object.freeze([ranged("Defensive Array","24\"","18","3+","5","-1","1",""),
      ranged("Heavy Laser Destroyer","72\"","2","3+","16","-4","D6+4","Devastating Wounds, Heavy"),
      ranged("Heavy Onslaught Gatling Cannon","24\"","12","3+","6","-1","1","Sustained Hits 2: non-MONSTER/VEHICLE, Devastating Wounds: non-MONSTER/VEHICLE"),
      ranged("Macro Plasma Incinerator - Standard","36\"","D3+3","3+","9","-3","2","Blast 1"),
      ranged("Macro Plasma Incinerator - Supercharge","36\"","D3+3","3+","10","-4","3","Hazardous, Blast 1"),
      ranged("Twin Heavy Bolter","36\"","3","3+","5","-1","2","Sustained Hits 1, Rapid Fire 2, Twin-linked"),
      melee("Armoured Hull","6","4+","8","0","1","")]),
    abilities:Object.freeze([ability("Executioner","Ranged attacks targeting units NOT below half-strength gain +1 to hit rolls. Confirm target strength manually."),
      ability("Transport Capacity","7 ADEPTUS ASTARTES INFANTRY spaces; no JUMP PACK; GRAVIS/TERMINATOR count double."),
      ability("Damaged 6 and Deadly Demise D6","Resolve damaged threshold and demise manually.")])
  }),
  'Gladiator Lancer':Object.freeze({
    characteristics:Object.freeze({Move:'10"',Toughness:'10',Save:'3+',Wounds:'12',Leadership:'6+','Objective Control':'3'}),
    weapons:Object.freeze([
      ranged('Defensive Array','24"','6','3+','5','-1','1','Rapid Fire 6'),
      ranged('Laser Destroyer','72"','2','3+','14','-3','D6+3','Heavy'),
      melee('Armoured Hull','3','4+','6','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Aquilon Optics','Against MONSTER or VEHICLE units, this unit may re-roll one hit roll, one wound roll and one damage roll for its ranged attacks. Confirm targets and actual re-rolls manually.'),
      ability('Damaged 4','Apply the current damaged-vehicle core rule when four or fewer wounds remain.'),
      ability('Deadly Demise D3','Resolve Deadly Demise D3 on the tabletop.')
    ])
  }),
  'Gladiator Reaper':Object.freeze({
    characteristics:Object.freeze({Move:'10"',Toughness:'10',Save:'3+',Wounds:'12',Leadership:'6+','Objective Control':'3'}),
    weapons:Object.freeze([
      ranged('Defensive Array','24"','12','3+','5','-1','1','Rapid Fire 12'),
      ranged('Twin Heavy Onslaught Gatling Cannon','24"','12','3+','6','-1','1','Twin-linked, Sustained Hits 2: non-MONSTER/VEHICLE, Devastating Wounds: non-MONSTER/VEHICLE'),
      melee('Armoured Hull','3','4+','6','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Reaping Tally','The unit\'s ranged attacks targeting units other than MONSTER or VEHICLE have +1 AP. Check target keywords manually.'),
      ability('Damaged 4','Apply current core damaged-vehicle rule at four or fewer wounds.'),
      ability('Deadly Demise D3','Resolve Deadly Demise D3 manually.')
    ])
  }),
  'Gladiator Valiant':Object.freeze({
    characteristics:Object.freeze({Move:'10"',Toughness:'10',Save:'3+',Wounds:'12',Leadership:'6+','Objective Control':'3'}),
    weapons:Object.freeze([
      ranged('Defensive Array','24"','6','3+','5','-1','1','Rapid Fire 6'),
      ranged('Multi-melta','18"','2','3+','10','-3','D3+2','Melta 3'),
      ranged('Twin Las-talon','36"','2','3+','10','-3','D3+3','Twin-linked'),
      melee('Armoured Hull','3','4+','6','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Priority Target Acquisition','Ranged attacks targeting a unit within 12 inches have +1 Strength. No older closest-MONSTER/VEHICLE hit bonus. Confirm exact distance manually.'),
      ability('Damaged 4','Apply current core damaged-vehicle rule at four or fewer wounds.'),
      ability('Deadly Demise D3','Resolve Deadly Demise D3 manually.')
    ])
  }),
  'Invictor Tactical Warsuit':Object.freeze({
    characteristics:Object.freeze({Move:'10"',Toughness:'9',Save:'3+',Wounds:'12',Leadership:'6+','Objective Control':'4'}),
    weapons:Object.freeze([
      ranged('Fragstorm Grenade Launcher','18"','3','3+','4','-1','1','Blast 1'),
      ranged('Heavy Bolter','36"','3','3+','5','-1','2','Sustained Hits 1, Rapid Fire 2'),
      ranged('Incendium Cannon','12"','4','N/A','6','-1','2','Torrent, Blast 2'),
      ranged('Ironhail Heavy Stubbers','36"','6','3+','4','-1','1','Rapid Fire 6'),
      ranged('Twin Ironhail Autocannon','48"','4','3+','9','-1','3','Twin-linked'),
      melee('Invictor Fist','5','3+','12','-2','3','')
    ]),
    abilities:Object.freeze([
      ability('Scouts 8"','Use Scouts 8 inches during deployment where permitted; not an unrestricted extra normal move.'),
      ability('Forward Assault Warsuit','Mark one enemy at the start of the first battle round. This unit can reroll wound rolls of 1 against its mark and select another when the mark is destroyed; track target manually.'),
      ability('Damaged 4 and Deadly Demise D3','Apply damaged-vehicle core rules and resolve demise manually.')
    ])
  }),
  'Firestrike Servo-turrets':Object.freeze({
    characteristics:Object.freeze({Move:'5"',Toughness:'6',Save:'2+',Wounds:'6',Leadership:'6+','Objective Control':'2'}),
    weapons:Object.freeze([
      ranged('Twin Firestrike Autocannon','48"','4','2+','9','-1','3','Rapid Fire 2, Twin-linked'),
      ranged('Twin Firestrike Las-talon','36"','2','2+','10','-3','D3+3','Twin-linked'),
      melee('Hovering Bulk','3','3+','5','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Sentinel Protocols','Once per phase, this unit can use Fire Overwatch despite another use; its snap shooting hits on unmodified 4+ until that stratagem resolves. Confirm target, visibility and timing manually.')
    ])
  }),
  'Invader ATVs':Object.freeze({
    characteristics:Object.freeze({Move:'10"',Toughness:'6',Save:'3+',Wounds:'8',Leadership:'6+','Objective Control':'2'}),
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Multi-melta','18"','2','3+','10','-3','D3+2','Melta 3'),
      ranged('Onslaught Gatling Cannon','24"','8','3+','5','-1','1','Devastating Wounds: non-Monster/Vehicle'),
      ranged('Twin Bolt Rifle','24"','2','2+','5','-1','1','Twin-linked, Assault, Rapid Fire 2'),
      melee('Armoured Impact','4','3+','5','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Aggressive Reconnaissance','In your Shooting phase, this unit gets +1 to wound rolls against a target not within 6 inches of any other enemy unit. Confirm isolation manually.')
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
