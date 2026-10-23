// Space Marines 11th-edition datasheet profiles for Army Builder display and combat reference.
// Source: OpenHammer API projection of BSData/wh40k-11e. Review against the current official
// datasheets before treating any profile as authoritative for tournament play.
// Missing entries intentionally remain absent rather than being guessed.
export const SPACE_MARINES_DATASHEET_DATA = Object.freeze({
  "Ancient": {
    "name": "Ancient",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "4",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Bolt Rifle",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Assault, Heavy"
      },
      {
        "name": "Power weapon",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "5",
        "ap": "-2",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Unbreakable Duty",
        "description": "While this model is within range of an objective marker and/or within 6\" of the centre of the battlefield, this model has the Feel No Pain 4+ ability."
      },
      {
        "name": "Support",
        "description": "This model can be attached to the following units: ASSAULT INTERCESSOR SQUAD, ASSAULT SQUAD, CRUSADER SQUAD, DEATHWATCH VETERANS, DECIMUS KILL TEAM, DESOLATION SQUAD, DEVASTATOR SQUAD, FORTIS KILL TEAM, HELLBLASTER SQUAD, INFERNUS SQUAD, INNER CIRCLE COMPANIONS, INTERCESSOR SQUAD, STERNGUARD VETERAN SQUAD, SWORD BRETHREN SQUAD, TACTICAL SQUAD, VANGUARD VETERAN SQUAD\n"
      }
    ],
    "keywords": [
      "Infantry",
      "Character",
      "Grenades",
      "Imperium",
      "Tacticus",
      "Faction: Adeptus Astartes",
      "Ancient",
      "Support"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Ancient in Terminator Armour": {
    "name": "Ancient in Terminator Armour",
    "characteristics": {
      "Move": "5\"",
      "Toughness": "5",
      "Save": "2+",
      "Wounds": "5",
      "Leadership": "6+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Storm bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2"
      },
      {
        "name": "Twin lightning claws",
        "range": "Melee",
        "attacks": "6",
        "skill": "2+",
        "strength": "5",
        "ap": "-2",
        "damage": "1",
        "abilities": "Twin-linked"
      },
      {
        "name": "Power weapon",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "5",
        "ap": "-2",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Power fist",
        "range": "Melee",
        "attacks": "4",
        "skill": "2+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Thunder Hammer",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": "Devastating Wounds"
      },
      {
        "name": "Chainfist",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": "Anti Vehicle 3+"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Keep the Banner High",
        "description": "While this model is leading a unit, each time a model in that unit makes an attack, add 1 to the Hit roll if that unit is below its Starting Strength, and add 1 to the Wound roll as well if that unit is Below Half-strength"
      },
      {
        "name": "Support",
        "description": "This model can be attached to the following units: DEATHWATCH TERMINATOR SQUAD, DEATHWING KNIGHTS, DEATHWING TERMINATOR SQUAD, RELIC TERMINATOR SQUAD, TERMINATOR ASSAULT SQUAD, TERMINATOR SQUAD"
      },
      {
        "name": "Terminator Storm Shield",
        "description": "The bearer has a Wounds characteristic of 6."
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Imperium",
      "Terminator",
      "Ancient",
      "Faction: Adeptus Astartes",
      "Support"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Apothecary": {
    "name": "Apothecary",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "4",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Absolvor bolt pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Pistol"
      },
      {
        "name": "Reductor Pistol",
        "range": "3\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "-4",
        "damage": "2",
        "abilities": "Pistol"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Narthecium",
        "description": "While this model is leading a unit, in your Command phase, you can return 1 destroyed model (excluding Character models) to that unit."
      },
      {
        "name": "Gene Seed Recovery",
        "description": "When this model’s Bodyguard unit is destroyed, roll one D6: on a 2+, you gain 1CP."
      },
      {
        "name": "Support",
        "description": "This model can be attached to the following units: ASSAULT INTERCESSOR SQUAD, ASSAULT SQUAD, BLADEGUARD VETERAN SQUAD, CRUSADER SQUAD, DEATHWATCH VETERANS, DECIMUS KILL TEAM, DESOLATION SQUAD, DEVASTATOR SQUAD, FORTIS KILL TEAM, HELLBLASTER SQUAD, INFERNUS SQUAD, INNER CIRCLE COMPANIONS, INTERCESSOR SQUAD, STERNGUARD VETERAN SQUAD, SWORD BRETHREN SQUAD, TACTICAL SQUAD, VANGUARD VETERAN SQUAD\n"
      }
    ],
    "keywords": [
      "Character",
      "Grenades",
      "Imperium",
      "Faction: Adeptus Astartes",
      "Tacticus",
      "Infantry",
      "Apothecary",
      "Support"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Apothecary Biologis": {
    "name": "Apothecary Biologis",
    "characteristics": {
      "Move": "5\"",
      "Toughness": "6",
      "Save": "3+",
      "Wounds": "5",
      "Leadership": "6+",
      "Objective Control": "3"
    },
    "weapons": [
      {
        "name": "Absolvor bolt pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Pistol"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Surgical Precision",
        "description": "While this model is leading a unit, weapons equipped by models in that unit have the [LETHAL HITS] ability."
      },
      {
        "name": "Vivispectrum",
        "description": "If this model’s unit destroys an enemy unit as the result of a melee attack, until the end of the battle, this model has an Objective Control characteristic of 9."
      },
      {
        "name": "Support",
        "description": "This model can be attached to the following units:\n\n- AGGRESSOR SQUAD\n- ERADICATOR SQUAD\n- HEAVY INTERCESSOR SQUAD\n- INDOMITOR KILL TEAM\n\n"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Imperium",
      "Gravis",
      "Faction: Adeptus Astartes",
      "Apothecary",
      "Biologis"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Bladeguard Ancient": {
    "name": "Bladeguard Ancient",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "4",
      "Leadership": "6+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Heavy Bolt Pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Deeds of Heroism",
        "description": "Once per battle, when this model is selected to fight, it can use this ability. If it does, until the end of the phase, add 1 to the Attacks characteristic of melee weapons equipped by models in this model’s unit"
      },
      {
        "name": "Support",
        "description": "This model can be attached to the following unit:\n\n- BLADEGUARD VETERAN SQUAD\n\nYou can attach this model to the above unit even if one Captain, Chapter Master or Lieutenant model has already been attached to it. If you do, and that Bodyguard unit is destroyed, the Leader units attached to it become separate units, with their original Starting Strengths."
      }
    ],
    "keywords": [
      "Infantry",
      "Character",
      "Grenades",
      "Imperium",
      "Bladeguard Ancient",
      "Faction: Adeptus Astartes",
      "Tacticus",
      "Ancient"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Captain": {
    "name": "Captain",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "5",
      "Leadership": "6+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Master-crafted bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "2+",
        "strength": "4",
        "ap": "-1",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Heavy Bolt Pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "➤ Plasma pistol - supercharge",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "2",
        "abilities": "Hazardous, Pistol"
      },
      {
        "name": "➤ Plasma pistol - standard",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Neo-volkite Pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "5",
        "ap": "0",
        "damage": "2",
        "abilities": "Devastating Wounds, Pistol"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "6",
        "skill": "2+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Power fist",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Master-crafted power weapon",
        "range": "Melee",
        "attacks": "6",
        "skill": "2+",
        "strength": "5",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Leader",
        "description": "This model can be attached to the following units: ASSAULT INTERCESSOR SQUAD, ASSAULT SQUAD, BLADEGUARD VETERAN SQUAD, COMMAND SQUAD, COMPANY HEROES, CRUSADER SQUAD, DEATHWATCH VETERANS, DECIMUS KILL TEAM, FORTIS KILL TEAM, HELLBLASTER SQUAD, INFERNUS SQUAD, INNER CIRCLE COMPANIONS, INTERCESSOR SQUAD, STERNGUARD VETERAN SQUAD, SWORD BRETHREN SQUAD, TACTICAL SQUAD, VANGUARD VETERAN SQUAD, VICTRIX HONOUR GUARD\n"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Captain",
      "Grenades",
      "Imperium",
      "Tacticus",
      "Faction: Adeptus Astartes",
      "Leader"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Captain in Gravis Armour": {
    "name": "Captain in Gravis Armour",
    "characteristics": {
      "Move": "5\"",
      "Toughness": "6",
      "Save": "3+",
      "Wounds": "6",
      "Leadership": "6+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Master-crafted Heavy Bolt Rifle",
        "range": "30\"",
        "attacks": "2",
        "skill": "2+",
        "strength": "5",
        "ap": "-1",
        "damage": "3",
        "abilities": "Assault, Heavy"
      },
      {
        "name": "Boltstorm gauntlet",
        "range": "12\"",
        "attacks": "3",
        "skill": "2+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Master-crafted power weapon",
        "range": "Melee",
        "attacks": "6",
        "skill": "2+",
        "strength": "5",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Power fist",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Relic Chainsword",
        "range": "Melee",
        "attacks": "3",
        "skill": "2+",
        "strength": "4",
        "ap": "-1",
        "damage": "2",
        "abilities": "Extra Attacks"
      },
      {
        "name": "Relic Blade",
        "range": "Melee",
        "attacks": "2",
        "skill": "2+",
        "strength": "5",
        "ap": "-2",
        "damage": "2",
        "abilities": "Extra Attacks"
      },
      {
        "name": "Relic Fist",
        "range": "Melee",
        "attacks": "1",
        "skill": "2+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": "Extra Attacks"
      }
    ],
    "abilities": [
      {
        "name": "Refuse to Yield",
        "description": "Each time an attack is allocated to this model, halve the Damage characteristic of that attack."
      },
      {
        "name": "Leader",
        "description": "This model can be attached to the following units:\n\n- AGGRESSOR SQUAD\n- ERADICATOR SQUAD\n- HEAVY INTERCESSOR SQUAD\n- INDOMITOR KILL TEAM"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Captain",
      "Grenades",
      "Imperium",
      "Faction: Adeptus Astartes",
      "Gravis",
      "Leader"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Captain in Phobos Armour": {
    "name": "Captain in Phobos Armour",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "5",
      "Leadership": "6+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Instigator Bolt Carbine",
        "range": "24\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "4",
        "ap": "-2",
        "damage": "2",
        "abilities": "Precision"
      },
      {
        "name": "Combat Knife",
        "range": "Melee",
        "attacks": "6",
        "skill": "2+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Master of Deceit",
        "description": "After both players have deployed their armies, if your army includes one or more models with this ability, you can select up to three friendly ADEPTUS ASTARTES INFANTRY units and redeploy all of those units. When doing so, any of those units can be placed into Strategic Reserves, regardless of how many units are already in Strategic Reserves."
      },
      {
        "name": "Leader",
        "description": "This model can be attached to the following units:\n\n- ELIMINATOR SQUAD\n- INCURSOR SQUAD\n- INFILTRATOR SQUAD\n- REIVER SQUAD\n- SCOUT SQUAD\n- SPECTRUS KILL TEAM"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Grenades",
      "Imperium",
      "Captain",
      "Phobos",
      "Faction: Adeptus Astartes",
      "Leader"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Captain in Terminator Armour": {
    "name": "Captain in Terminator Armour",
    "characteristics": {
      "Move": "5\"",
      "Toughness": "5",
      "Save": "2+",
      "Wounds": "6",
      "Leadership": "6+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Storm bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2"
      },
      {
        "name": "Combi-weapon",
        "range": "24\"",
        "attacks": "1",
        "skill": "4+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Anti-Infantry 4+, Devastating Wounds, Rapid Fire 1"
      },
      {
        "name": "Relic Weapon",
        "range": "Melee",
        "attacks": "6",
        "skill": "2+",
        "strength": "5",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Relic Fist",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Leader",
        "description": "This model can be attached to the following units: DEATHWATCH TERMINATOR SQUAD, DEATHWING KNIGHTS, DEATHWING TERMINATOR SQUAD, RELIC TERMINATOR SQUAD, TERMINATOR ASSAULT SQUAD, TERMINATOR SQUAD"
      },
      {
        "name": "Unstoppable Valour",
        "description": "You can re-roll Charge rolls made for this model’s unit."
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Captain",
      "Faction: Adeptus Astartes",
      "Imperium",
      "Terminator",
      "Leader"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Captain with Jump Pack": {
    "name": "Captain with Jump Pack",
    "characteristics": {
      "Move": "12\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "5",
      "Leadership": "6+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Heavy Bolt Pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Hand flamer",
        "range": "12\"",
        "attacks": "D6",
        "skill": "N/A",
        "strength": "3",
        "ap": "0",
        "damage": "1",
        "abilities": "Ignores Cover, Pistol, Torrent"
      },
      {
        "name": "➤ Plasma pistol - supercharge",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "2",
        "abilities": "Hazardous, Pistol"
      },
      {
        "name": "➤ Plasma pistol - standard",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Astartes Chainsword",
        "range": "Melee",
        "attacks": "7",
        "skill": "2+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Power fist",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Relic Weapon",
        "range": "Melee",
        "attacks": "6",
        "skill": "2+",
        "strength": "5",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Thunder Hammer",
        "range": "Melee",
        "attacks": "5",
        "skill": "3+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": "Devastating Wounds"
      }
    ],
    "abilities": [
      {
        "name": "Angel's Wrath",
        "description": "While this model is leading a unit, each time that unit ends a Charge move, until the end of the turn, add 1 to the Strength characteristic of melee  weapons equipped by models in that unit."
      },
      {
        "name": "Leader",
        "description": "This model can be attached to the following units: ASSAULT INTERCESSORS WITH JUMP PACKS, ASSAULT SQUAD WITH JUMP PACKS, SANGUINARY GUARD, TALONSTRIKE KILL TEAM, VANGUARD VETERAN SQUAD WITH JUMP PACKS"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Grenades",
      "Captain",
      "Imperium",
      "Faction: Adeptus Astartes",
      "Fly",
      "Jump Pack",
      "Tacticus",
      "Leader"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Chaplain": {
    "name": "Chaplain",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "4",
      "Leadership": "5+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Absolvor bolt pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Pistol"
      },
      {
        "name": "Crozius arcanum",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "6",
        "ap": "-1",
        "damage": "2",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Leader",
        "description": "This model can be attached to the following units: ASSAULT INTERCESSOR SQUAD, ASSAULT SQUAD, BLADEGUARD VETERAN SQUAD, CRUSADER SQUAD, DEATH COMPANY MARINES, DEATH COMPANY MARINES WITH BOLT RIFLES, DEATHWATCH VETERANS, DECIMUS KILL TEAM, FORTIS KILL TEAM, HELLBLASTER SQUAD, INFERNUS SQUAD, INNER CIRCLE COMPANIONS, INTERCESSOR SQUAD, STERNGUARD VETERAN SQUAD, SWORD BRETHREN SQUAD, TACTICAL SQUAD, VANGUARD VETERAN SQUAD"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Grenades",
      "Tacticus",
      "Imperium",
      "Faction: Adeptus Astartes",
      "Chaplain",
      "Leader"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Chaplain in Terminator Armour": {
    "name": "Chaplain in Terminator Armour",
    "characteristics": {
      "Move": "5\"",
      "Toughness": "5",
      "Save": "2+",
      "Wounds": "5",
      "Leadership": "5+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Storm bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2"
      },
      {
        "name": "Crozius arcanum",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "6",
        "ap": "-1",
        "damage": "2",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Recitation of Faith",
        "description": "While this model is leading a unit, models in that unit have the Feel No Pain 4+ ability against mortal wounds."
      },
      {
        "name": "Leader",
        "description": "This model can be attached to the following units: DEATHWATCH TERMINATOR SQUAD, DEATHWING KNIGHTS, DEATHWING TERMINATOR SQUAD, RELIC TERMINATOR SQUAD, TERMINATOR ASSAULT SQUAD, TERMINATOR SQUAD"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Terminator",
      "Chaplain",
      "Imperium",
      "Faction: Adeptus Astartes",
      "Leader"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Chaplain on Bike": {
    "name": "Chaplain on Bike",
    "characteristics": {
      "Move": "12\"",
      "Toughness": "5",
      "Save": "3+",
      "Wounds": "5",
      "Leadership": "5+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Absolvor bolt pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Pistol"
      },
      {
        "name": "Twin bolt rifle",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Twin-linked"
      },
      {
        "name": "Crozius arcanum",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "6",
        "ap": "-1",
        "damage": "2",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Catechism of Fire",
        "description": "Each time this model’s unit is selected to shoot, you can select one enemy unit within 12\" of and visible to this model. Until the end of the phase, ranged\nweapons equipped by models in this model’s unit have the [DEVASTATING WOUNDS] ability when targeting that enemy unit."
      },
      {
        "name": "Leader",
        "description": "This model can be attached to the following units: BIKE SQUAD, COMPANY VETERANS ON BIKES, OUTRIDER SQUAD, RAVENWING BLACK KNIGHTS"
      }
    ],
    "keywords": [
      "Character",
      "Mounted",
      "Imperium",
      "Grenades",
      "Chaplain",
      "Faction: Adeptus Astartes",
      "Leader"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Chaplain with Jump Pack": {
    "name": "Chaplain with Jump Pack",
    "characteristics": {
      "Move": "12\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "4",
      "Leadership": "5+",
      "Objective Control": "1",
      "Invulnerable save": "4+\n"
    },
    "weapons": [
      {
        "name": "Inferno Pistol",
        "range": "6\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-4",
        "damage": "D3",
        "abilities": "Melta 2, Pistol"
      },
      {
        "name": "Combi-weapon",
        "range": "24\"",
        "attacks": "1",
        "skill": "4+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Anti-Infantry 4+, Devastating Wounds, Rapid Fire 1"
      },
      {
        "name": "Hand flamer",
        "range": "12\"",
        "attacks": "D6",
        "skill": "N/A",
        "strength": "3",
        "ap": "0",
        "damage": "1",
        "abilities": "Ignores Cover, Pistol, Torrent"
      },
      {
        "name": "Grav-pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "2",
        "abilities": "Anti-vehicle 2+, Pistol"
      },
      {
        "name": "Storm bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2"
      },
      {
        "name": "➤ Plasma pistol - supercharge",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "2",
        "abilities": "Hazardous, Pistol"
      },
      {
        "name": "➤ Plasma pistol - standard",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Boltgun",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Absolvor bolt pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Pistol"
      },
      {
        "name": "Crozius arcanum",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "6",
        "ap": "-1",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Power fist",
        "range": "Melee",
        "attacks": "4",
        "skill": "2+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Exhortation of Rage",
        "description": "Each time this model’s unit is selected to fight, you can select one enemy unit within Engagement Range of this model’s unit and roll one D6: on a 4-5, that enemy unit suffers D3 mortal wounds; on a 6, that enemy unit suffers 3 mortal wounds."
      },
      {
        "name": "Leader",
        "description": "This model can be attached to the following units: ASSAULT INTERCESSORS WITH JUMP PACKS, ASSAULT SQUAD WITH JUMP PACKS, DEATH COMPANY MARINES WITH JUMP PACKS, TALONSTRIKE KILL TEAM, VANGUARD VETERAN SQUAD WITH JUMP PACKS"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Imperium",
      "Chaplain",
      "Faction: Adeptus Astartes",
      "Fly",
      "Jump Pack",
      "Leader"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Judiciar": {
    "name": "Judiciar",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "4",
      "Leadership": "5+",
      "Objective Control": "1",
      "Invulnerable save": "4+*"
    },
    "weapons": [
      {
        "name": "Absolvor bolt pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Pistol"
      },
      {
        "name": "Executioner Relic Blade",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "7",
        "ap": "-2",
        "damage": "2",
        "abilities": "Devastating Wounds, Precision"
      }
    ],
    "abilities": [
      {
        "name": "Tempormortis",
        "description": "While this model is leading a unit, that unit has the Fights First ability."
      },
      {
        "name": "Silent Fury",
        "description": "Each time this model destroys an enemy Character model, until the end of the battle, add 1 to the Attacks characteristic of its executioner relic blade."
      },
      {
        "name": "*Invulnerable Save",
        "description": "This model has a 4+ invulnerable save against melee attacks."
      },
      {
        "name": "Leader",
        "description": "This model can be attached to the following units: ASSAULT INTERCESSOR SQUAD, ASSAULT SQUAD, BLADEGUARD VETERAN SQUAD, CRUSADER SQUAD, DEATHWATCH VETERANS, DECIMUS KILL TEAM, FORTIS KILL TEAM, INFERNUS SQUAD, INNER CIRCLE COMPANIONS, INTERCESSOR SQUAD, STERNGUARD VETERAN SQUAD, SWORD BRETHREN SQUAD, TACTICAL SQUAD, VANGUARD VETERAN SQUAD"
      },
      {
        "name": "Support",
        "description": "This model can be attached to the following units: ASSAULT INTERCESSOR SQUAD, BLADEGUARD VETERAN SQUAD, INFERNUS SQUAD, INTERCESSOR SQUAD, STERNGUARD VETERAN SQUAD, VANGUARD VETERAN SQUAD"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Imperium",
      "Tacticus",
      "Judiciar",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Librarian": {
    "name": "Librarian",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "4",
      "Leadership": "6+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "➤ Smite - Witchfire",
        "range": "24\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "D3",
        "abilities": "Psychic"
      },
      {
        "name": "➤ Smite - Focused Witchfire",
        "range": "24\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "6",
        "ap": "-2",
        "damage": "D3",
        "abilities": "Devastating Wounds, Hazardous, Psychic"
      },
      {
        "name": "Force weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "6",
        "ap": "-1",
        "damage": "D3",
        "abilities": "Psychic"
      }
    ],
    "abilities": [
      {
        "name": "Mental Fortress [Psychic]",
        "description": "While this model is leading a unit, models in that unit have a 4+ invulnerable save."
      },
      {
        "name": "Leader",
        "description": "This model can be attached to the following units: ASSAULT INTERCESSOR SQUAD, ASSAULT SQUAD, DEATHWATCH VETERANS, DECIMUS KILL TEAM, DESOLATION SQUAD, DEVASTATOR SQUAD, FORTIS KILL TEAM, HELLBLASTER SQUAD, INFERNUS SQUAD, INNER CIRCLE COMPANIONS, INTERCESSOR SQUAD, STERNGUARD VETERAN SQUAD, TACTICAL SQUAD, VANGUARD VETERAN SQUAD"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Grenades",
      "Imperium",
      "Psyker",
      "Faction: Adeptus Astartes",
      "Tacticus",
      "Librarian",
      "Leader"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Librarian in Phobos Armour": {
    "name": "Librarian in Phobos Armour",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "4",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "➤ Smite - Witchfire",
        "range": "24\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "D3",
        "abilities": "Psychic"
      },
      {
        "name": "➤ Smite - Focused Witchfire",
        "range": "24\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "6",
        "ap": "-2",
        "damage": "D3",
        "abilities": "Devastating Wounds, Hazardous, Psychic"
      },
      {
        "name": "Force weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "6",
        "ap": "-1",
        "damage": "D3",
        "abilities": "Psychic"
      }
    ],
    "abilities": [
      {
        "name": "Shrouding [Psychic]",
        "description": "While this model is leading a unit, models in that unit have the Stealth ability and that unit cannot be targeted by ranged attacks unless the attacking\nmodel is within 12\"."
      },
      {
        "name": "Leader",
        "description": "This model can be attached to the following units:\n\n- ELIMINATOR SQUAD\n- INCURSOR SQUAD\n- INFILTRATOR SQUAD\n- REIVER SQUAD\n- SPECTRUS KILL TEAM"
      }
    ],
    "keywords": [
      "Character",
      "Grenades",
      "Imperium",
      "Psyker",
      "Faction: Adeptus Astartes",
      "Phobos",
      "Librarian",
      "Infantry",
      "Leader"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Librarian in Terminator Armour": {
    "name": "Librarian in Terminator Armour",
    "characteristics": {
      "Move": "5\"",
      "Toughness": "5",
      "Save": "2+",
      "Wounds": "5",
      "Leadership": "6+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "➤ Smite - Witchfire",
        "range": "24\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "D3",
        "abilities": "Psychic"
      },
      {
        "name": "➤ Smite - Focused Witchfire",
        "range": "24\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "6",
        "ap": "-2",
        "damage": "D3",
        "abilities": "Devastating Wounds, Hazardous, Psychic"
      },
      {
        "name": "Combi-weapon",
        "range": "24\"",
        "attacks": "1",
        "skill": "4+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Anti-Infantry 4+, Devastating Wounds, Rapid Fire 1"
      },
      {
        "name": "Storm bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2"
      },
      {
        "name": "Force weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "6",
        "ap": "-1",
        "damage": "D3",
        "abilities": "Psychic"
      }
    ],
    "abilities": [
      {
        "name": "Veil of Time [Psychic]",
        "description": "While this model is leading a unit, weapons equipped by models in that unit have the [SUSTAINED HITS 1] ability."
      },
      {
        "name": "Leader",
        "description": "This model can be attached to the following units: DEATHWATCH TERMINATOR SQUAD, DEATHWING KNIGHTS, DEATHWING TERMINATOR SQUAD, RELIC TERMINATOR SQUAD, TERMINATOR ASSAULT SQUAD, TERMINATOR SQUAD"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Imperium",
      "Psyker",
      "Terminator",
      "Librarian",
      "Faction: Adeptus Astartes",
      "Leader"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Lieutenant": {
    "name": "Lieutenant",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "4",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Neo-volkite Pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "5",
        "ap": "0",
        "damage": "2",
        "abilities": "Devastating Wounds, Pistol"
      },
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Heavy Bolt Pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "➤ Plasma pistol - supercharge",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "2",
        "abilities": "Hazardous, Pistol"
      },
      {
        "name": "➤ Plasma pistol - standard",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Master-crafted bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "2+",
        "strength": "4",
        "ap": "-1",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Master-crafted power weapon",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "5",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Power fist",
        "range": "Melee",
        "attacks": "4",
        "skill": "2+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Support",
        "description": "This model can be attached to the following units: ASSAULT INTERCESSOR SQUAD, ASSAULT SQUAD, BLADEGUARD VETERAN SQUAD, COMMAND SQUAD, COMPANY HEROES, CRUSADER SQUAD, DEATHWATCH VETERANS, DECIMUS KILL TEAM, FORTIS KILL TEAM, HELLBLASTER SQUAD, INFERNUS SQUAD, INNER CIRCLE COMPANIONS, INTERCESSOR SQUAD, STERNGUARD VETERAN SQUAD, SWORD BRETHREN SQUAD, TACTICAL SQUAD, VANGUARD VETERAN SQUAD\n"
      },
      {
        "name": "Storm Shield",
        "description": "The bearer has a 4+ invulnerable save"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Grenades",
      "Imperium",
      "Tacticus",
      "Faction: Adeptus Astartes",
      "Lieutenant",
      "Support"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Lieutenant in Phobos Armour": {
    "name": "Lieutenant in Phobos Armour",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "4",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Master-crafted Scoped Bolt Carbine",
        "range": "24\"",
        "attacks": "2",
        "skill": "2+",
        "strength": "4",
        "ap": "0",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Paired Combat Blades",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Sustained Hits 1"
      }
    ],
    "abilities": [
      {
        "name": "Strategic Dispersal",
        "description": "In your Shooting phase, after this model’s unit has shot, if it is not within Engagement Range of any enemy models, it can make a Normal move of up to  6\". If it does, until the end of the turn, that unit is not eligible to declare a charge.’"
      },
      {
        "name": "Support",
        "description": "This model can be attached to the following units:\n\n- INCURSOR SQUAD\n- INFILTRATOR SQUAD\n- REIVER SQUAD\n- SPECTRUS KILL TEAM\n\n"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Grenades",
      "Imperium",
      "Phobos",
      "Faction: Adeptus Astartes",
      "Lieutenant",
      "Support"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Lieutenant with Combi-Weapon": {
    "name": "Lieutenant with Combi-Weapon",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "4",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Combi-weapon",
        "range": "24\"",
        "attacks": "1",
        "skill": "4+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Anti-Infantry 4+, Devastating Wounds, Rapid Fire 1"
      },
      {
        "name": "Paired Combat Blades",
        "range": "Melee",
        "attacks": "5",
        "skill": "2+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Anti-Infantry 4+, Sustained Hits 1"
      }
    ],
    "abilities": [
      {
        "name": "Priority Objective Identified",
        "description": "At the start of the first battle round, if your army includes one or more models with this ability, you can select one objective marker on the battlefield. Until the end of the battle, while one or more models with this ability are on the battlefield, each time a friendly ADEPTUS ASTARTES model makes an attack that targets an enemy unit that is within range of that objective marker, re-roll a Wound roll of 1."
      },
      {
        "name": "Evade and Survive",
        "description": "Once per turn, when an enemy unit ends a Normal, Advance or Fall Back move within 8\" of this unit, if this unit is not within Engagement Range of one or more enemy units, it can make a Normal move"
      },
      {
        "name": "Lone Survivor",
        "description": "This model cannot be selected to be your **Warlord**."
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Grenades",
      "Imperium",
      "Lieutenant with Combi-weapon",
      "Faction: Adeptus Astartes",
      "Phobos",
      "Lieutenant"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Techmarine": {
    "name": "Techmarine",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "2+",
      "Wounds": "4",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Grav-pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "4",
        "ap": "-1",
        "damage": "2",
        "abilities": "Anti-vehicle 2+, Pistol"
      },
      {
        "name": "Forge Bolter",
        "range": "24\"",
        "attacks": "3",
        "skill": "2+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Omnissian power axe",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "6",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Servo-arm",
        "range": "Melee",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-2",
        "damage": "3",
        "abilities": "Extra Attacks"
      }
    ],
    "abilities": [
      {
        "name": "Techmarine",
        "description": "While this model is within 3\" of one or more friendly Adeptus Astartes Vehicle units, this model has the Lone Operative ability"
      },
      {
        "name": "Blessing of the Omnissiah",
        "description": "In your Command phase, you can select one friendly Adeptus Astartes Vehicle model within 3\" of this model. That model regains up to D3 lost wounds and, until the start of your next Command phase, each time that Vehicle model makes an attack, add 1 to the Hit roll. Each model can only be selected for this ability once per turn."
      },
      {
        "name": "Vengeance of the Omnissiah",
        "description": "If a friendly Adeptus Astartes Vehicle model is destroyed within 12\" of this model, until the end of the battle, this model’s Omnissian power axe has an\nAttacks characteristic of 7."
      },
      {
        "name": "Leader",
        "description": "This model can be attached to the following units: ASSAULT INTERCESSOR SQUAD, ASSAULT SQUAD, CRUSADER SQUAD, DECIMUS KILL TEAM, DESOLATION SQUAD, DEVASTATOR SQUAD, FORTIS KILL TEAM, INTERCESSOR SQUAD, SWORD BRETHREN SQUAD, TACTICAL SQUAD, VANGUARD VETERAN SQUAD"
      }
    ],
    "keywords": [
      "Character",
      "Infantry",
      "Grenades",
      "Imperium",
      "Tacticus",
      "Faction: Adeptus Astartes",
      "Techmarine",
      "Leader"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Assault Intercessor Squad": {
    "name": "Assault Intercessor Squad",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "2",
      "Leadership": "6+",
      "Objective Control": "2"
    },
    "weapons": [
      {
        "name": "Hand flamer",
        "range": "12\"",
        "attacks": "D6",
        "skill": "N/A",
        "strength": "3",
        "ap": "0",
        "damage": "1",
        "abilities": "Ignores Cover, Pistol, Torrent"
      },
      {
        "name": "➤ Plasma pistol - supercharge",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "2",
        "abilities": "Hazardous, Pistol"
      },
      {
        "name": "➤ Plasma pistol - standard",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Heavy Bolt Pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Astartes Chainsword",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Power weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "5",
        "ap": "-2",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Power fist",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Thunder Hammer",
        "range": "Melee",
        "attacks": "3",
        "skill": "4+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": "Devastating Wounds"
      }
    ],
    "abilities": [
      {
        "name": "Shock Assault",
        "description": "Each time a model in this unit targets an enemy unit with a melee attack, re-roll a Wound roll of 1. If that enemy unit is within range of an objective marker, you can re-roll the Wound roll instead."
      }
    ],
    "keywords": [
      "Infantry",
      "Battleline",
      "Grenades",
      "Faction: Adeptus Astartes",
      "Imperium",
      "Assault Intercessor Squad",
      "Tacticus"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Heavy Intercessor Squad": {
    "name": "Heavy Intercessor Squad",
    "characteristics": {
      "Move": "5\"",
      "Toughness": "6",
      "Save": "3+",
      "Wounds": "3",
      "Leadership": "6+",
      "Objective Control": "2"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Heavy Bolt Rifle",
        "range": "30\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Assault, Heavy"
      },
      {
        "name": "Heavy Bolter",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Assault, Heavy, Sustained Hits 1"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Unyielding in the Face of the Foe",
        "description": "While this unit is within range of an objective marker you control, each time an attack with a Damage characteristic of 1 is allocated to a model in \nthis unit, add 1 to any armour saving throw made against that attack."
      }
    ],
    "keywords": [
      "Infantry",
      "Battleline",
      "Grenades",
      "Imperium",
      "Gravis",
      "Faction: Adeptus Astartes",
      "Heavy Intercessor Squad"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Intercessor Squad": {
    "name": "Intercessor Squad",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "2",
      "Leadership": "6+",
      "Objective Control": "2"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Hand flamer",
        "range": "12\"",
        "attacks": "D6",
        "skill": "N/A",
        "strength": "3",
        "ap": "0",
        "damage": "1",
        "abilities": "Ignores Cover, Pistol, Torrent"
      },
      {
        "name": "➤ Plasma pistol - supercharge",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "2",
        "abilities": "Hazardous, Pistol"
      },
      {
        "name": "➤ Plasma pistol - standard",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Bolt Rifle",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Assault, Heavy"
      },
      {
        "name": "➤ Astartes grenade launcher - krak",
        "range": "24\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "9",
        "ap": "-2",
        "damage": "D3",
        "abilities": ""
      },
      {
        "name": "➤ Astartes grenade launcher - frag",
        "range": "24\"",
        "attacks": "D3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Blast"
      },
      {
        "name": "Power weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "5",
        "ap": "-2",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Astartes Chainsword",
        "range": "Melee",
        "attacks": "5",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Power fist",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Thunder Hammer",
        "range": "Melee",
        "attacks": "3",
        "skill": "4+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": "Devastating Wounds"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Objective Secured",
        "description": "If you control an objective marker at the end of your Command phase and this unit is within range of that objective marker, that objective marker remains under your control, even if you have no models within range of it, until your opponent controls it at the start or end of any turn."
      },
      {
        "name": "Hail of Bolts",
        "description": "In your Shooting phase, when this unit is selected to shoot, select up to one visible enemy unit. While making those attacks, this unit’s Bolt Rifle attacks that targeted that enemy unit have +2 A"
      }
    ],
    "keywords": [
      "Infantry",
      "Battleline",
      "Grenades",
      "Imperium",
      "Tacticus",
      "Intercessor Squad",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Aggressor Squad": {
    "name": "Aggressor Squad",
    "characteristics": {
      "Move": "5\"",
      "Toughness": "6",
      "Save": "3+",
      "Wounds": "3",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Fragstorm grenade launcher",
        "range": "18\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Blast"
      },
      {
        "name": "Auto Boltstorm Gauntlets",
        "range": "18\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Twin-linked"
      },
      {
        "name": "Flamestorm Gauntlets",
        "range": "12\"",
        "attacks": "D6+1",
        "skill": "N/A",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Ignores Cover, Torrent, Twin-linked"
      },
      {
        "name": "Twin power fist",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": "Twin-linked"
      }
    ],
    "abilities": [
      {
        "name": "Close-quarters Firepower",
        "description": "Each time a model in this unit makes a ranged attack that targets the closest eligible target, improve the Armour Penetration characteristic of that attack\nby 1."
      }
    ],
    "keywords": [
      "Infantry",
      "Imperium",
      "Gravis",
      "Aggressor Squad",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Assault Intercessors with Jump Packs": {
    "name": "Assault Intercessors with Jump Packs",
    "characteristics": {
      "Move": "12\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "2",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Hand flamer",
        "range": "12\"",
        "attacks": "D6",
        "skill": "N/A",
        "strength": "3",
        "ap": "0",
        "damage": "1",
        "abilities": "Ignores Cover, Pistol, Torrent"
      },
      {
        "name": "➤ Plasma pistol - supercharge",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "2",
        "abilities": "Hazardous, Pistol"
      },
      {
        "name": "➤ Plasma pistol - standard",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Heavy Bolt Pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Astartes Chainsword",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Power weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "5",
        "ap": "-2",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Power fist",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Hammer of Wrath",
        "description": "Each time this unit ends a Charge move, select one enemy unit within Engagement Range of it, then roll one D6 for each model in this unit that is within Engagement Range of that enemy unit: for each 4+, that enemy unit suffers 1 mortal wound."
      }
    ],
    "keywords": [
      "Infantry",
      "Grenades",
      "Imperium",
      "Fly",
      "Tacticus",
      "Jump Pack",
      "Faction: Adeptus Astartes",
      "Assault Intercessors with Jump Packs"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Bladeguard Veteran Squad": {
    "name": "Bladeguard Veteran Squad",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "3",
      "Leadership": "6+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Heavy Bolt Pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "➤ Plasma pistol - supercharge",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "2",
        "abilities": "Hazardous, Pistol"
      },
      {
        "name": "➤ Plasma pistol - standard",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Neo-volkite Pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "5",
        "ap": "0",
        "damage": "2",
        "abilities": "Devastating Wounds, Pistol"
      },
      {
        "name": "Master-crafted power weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "5",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Bladeguard",
        "description": "(Once per turn, per unit): In the Fight phase, when this unit is selected to fight or when an enemy unit targets this unit, you can select one of the following:\n\n\n▪ This unit’s melee attacks have +1 to hit rolls.\n▪ Or: Attacks that target this unit have ‑1 to hit rolls."
      }
    ],
    "keywords": [
      "Infantry",
      "Grenades",
      "Imperium",
      "Tacticus",
      "Bladeguard Veteran Squad",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Company Heroes": {
    "name": "Company Heroes",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "4",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Bolt Rifle",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Master-crafted Bolt Rifle",
        "range": "24\"",
        "attacks": "2",
        "skill": "2+",
        "strength": "4",
        "ap": "-1",
        "damage": "2",
        "abilities": "Devastating Wounds, Rapid Fire 1"
      },
      {
        "name": "Master-crafted Heavy Bolter",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "3",
        "abilities": "Heavy, Sustained Hits 2"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "5",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Master-crafted Power Weapon",
        "range": "Melee",
        "attacks": "6",
        "skill": "2+",
        "strength": "5",
        "ap": "-2",
        "damage": "2",
        "abilities": "Precision"
      }
    ],
    "abilities": [
      {
        "name": "Ancient Banner",
        "description": "While this unit contains an Ancient, add 1 to the Objective Control characteristic of models in this unit"
      },
      {
        "name": "Command Squad",
        "description": "While a Character model is leading this unit, each time an attack targets this unit, subtract 1 from the Wound roll."
      }
    ],
    "keywords": [
      "Infantry",
      "Grenades",
      "Imperium",
      "Tacticus",
      "Company Heroes",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Desolation Squad": {
    "name": "Desolation Squad",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "2",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Castellan Launcher",
        "range": "36\"",
        "attacks": "D3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Blast, Indirect Fire"
      },
      {
        "name": "Superfrag Rocket Launcher",
        "range": "48\"",
        "attacks": "D6+1",
        "skill": "4+",
        "strength": "5",
        "ap": "0",
        "damage": "1",
        "abilities": "Blast, Heavy"
      },
      {
        "name": "Superkrak Rocket Launcher",
        "range": "48\"",
        "attacks": "1",
        "skill": "4+",
        "strength": "10",
        "ap": "-2",
        "damage": "D6+1",
        "abilities": "Heavy"
      },
      {
        "name": "Vengor launcher",
        "range": "48\"",
        "attacks": "D6",
        "skill": "2+",
        "strength": "7",
        "ap": "-1",
        "damage": "2",
        "abilities": "Blast, Indirect Fire"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Targeter Optics",
        "description": "Each time this unit Remains Stationary, until the start of your next Movement phase, ranged weapons equipped by models in this unit have the  [IGNORES COVER] ability."
      }
    ],
    "keywords": [
      "Infantry",
      "Grenades",
      "Imperium",
      "Tacticus",
      "Desolation Squad",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Eliminator Squad": {
    "name": "Eliminator Squad",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "2",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Bolt Sniper Rifle",
        "range": "36\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "5",
        "ap": "-2",
        "damage": "3",
        "abilities": "Heavy, Precision"
      },
      {
        "name": "Las fusil",
        "range": "36\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "9",
        "ap": "-3",
        "damage": "D6",
        "abilities": "Heavy"
      },
      {
        "name": "Instigator Bolt Carbine",
        "range": "24\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "-2",
        "damage": "2",
        "abilities": "Precision"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Reposition Under Covering Fire",
        "description": "In your Shooting phase, after this unit has shot, if it contains an Eliminator Sergeant equipped with an instigator bolt carbine, this unit can make a\nNormal move. If it does so, until the end of the turn, this unit is not eligible to declare a charge."
      },
      {
        "name": "Mark the Target",
        "description": "Each time this unit Remains Stationary, until the start of your next Movement phase, ranged weapons equipped by models in this unit have the [DEVASTATING WOUNDS] ability."
      }
    ],
    "keywords": [
      "Infantry",
      "Imperium",
      "Grenades",
      "Phobos",
      "Faction: Adeptus Astartes",
      "Eliminator Squad"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Eradicator Squad with Melta Rifles": {
    "name": "Eradicator Squad with Melta Rifles",
    "characteristics": {
      "Move": "5\"",
      "Toughness": "6",
      "Save": "3+",
      "Wounds": "3",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Melta rifle",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "9",
        "ap": "-4",
        "damage": "D6",
        "abilities": "Heavy, Melta 2"
      },
      {
        "name": "Multi-melta",
        "range": "18\"",
        "attacks": "2",
        "skill": "4+",
        "strength": "9",
        "ap": "-4",
        "damage": "D6",
        "abilities": "Heavy, Melta 2"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Total Obliteration",
        "description": "Each time a ranged attack made by a model in this unit targets a Monster or Vehicle model, you can re-roll the Hit roll, you can re-roll the Wound roll and you can re-roll the Damage roll."
      }
    ],
    "keywords": [
      "Infantry",
      "Grenades",
      "Imperium",
      "Gravis",
      "Eradicator Squad",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Eradicator Squad with Heavy Bolters": {
    "name": "Eradicator Squad with Heavy Bolters",
    "characteristics": {
      "Move": "5\"",
      "Toughness": "6",
      "Save": "3+",
      "Wounds": "3",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Heavy Bolter",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Heavy, Sustained Hits 1"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Overlapping Detonations",
        "description": "In your Shooting phase, when this unit is selected to shoot you can select one non-**MONSTER/VEHICLE** enemy unit visible to it. While making attacks, this unit’s heavy bolters that targeted that selected unit have **[BLAST 1]**."
      }
    ],
    "keywords": [
      "Infantry",
      "Imperium",
      "Gravis",
      "Eradicator Squad",
      "Faction: Adeptus Astartes",
      "Eradicator Squad with Heavy Bolters"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Hellblaster Squad": {
    "name": "Hellblaster Squad",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "2",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "➤ Plasma Incinerator - Standard",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "1",
        "abilities": "Assault, Heavy"
      },
      {
        "name": "➤ Plasma Incinerator - Supercharge",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "2",
        "abilities": "Assault, Heavy, Hazardous"
      },
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "➤ Plasma pistol - supercharge",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "2",
        "abilities": "Hazardous, Pistol"
      },
      {
        "name": "➤ Plasma pistol - standard",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "For the Chapter!",
        "description": "Each time a model in this unit is destroyed, roll one D6: on a 3+, do not remove it from play. The destroyed model can shoot after the attacking model’s unit has finished making its attacks, and is then removed from play. When resolving these attacks, any Hazardous tests taken for that attack are automatically passed."
      }
    ],
    "keywords": [
      "Infantry",
      "Grenades",
      "Imperium",
      "Faction: Adeptus Astartes",
      "Hellblaster Squad",
      "Tacticus"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Inceptor Squad": {
    "name": "Inceptor Squad",
    "characteristics": {
      "Move": "10\"",
      "Toughness": "6",
      "Save": "3+",
      "Wounds": "3",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Assault Bolters",
        "range": "18\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Assault, Pistol, Sustained Hits 2, Twin-linked"
      },
      {
        "name": "➤ Plasma Exterminators - Standard",
        "range": "18\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "2",
        "abilities": "Assault, Pistol, Twin-linked"
      },
      {
        "name": "➤ Plasma Exterminators - Supercharge",
        "range": "18\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "3",
        "abilities": "Assault, Pistol, Hazardous, Twin-linked"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Meteoric Descent",
        "description": "In your Movement phase, when this unit is set up on the battlefield using the Deep Strike ability, it can perform a meteoric descent. If it does, this unit can be set up anywhere on the battlefield that is more than 6\" horizontally away from all enemy units, but until the end of the turn, it is not eligible to declare a charge."
      }
    ],
    "keywords": [
      "Infantry",
      "Fly",
      "Jump Pack",
      "Imperium",
      "Gravis",
      "Faction: Adeptus Astartes",
      "Inceptor Squad"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Incursor Squad": {
    "name": "Incursor Squad",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "2",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Occulus Bolt Carbine",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Assault, Ignores Cover"
      },
      {
        "name": "Paired Combat Blades",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Sustained Hits 1"
      }
    ],
    "abilities": [
      {
        "name": "Multi-spectrum Array",
        "description": "In your Shooting phase, after this unit has shot, select one enemy unit that was hit by one or more attacks made by this unit this phase. Until the end of the phase, each time a friendly Adeptus Astartes unit makes an attack that targets that enemy unit, add 1 to the Hit roll."
      },
      {
        "name": "Haywire Mine",
        "description": "Once per battle, at the start of any phase, you can select one enemy unit within 3\" of the bearer and roll one D6: on a 2+, that enemy unit suffers D3 mortal wounds, or 2D3 mortal wounds instead if it is a Vehicle unit."
      }
    ],
    "keywords": [
      "Infantry",
      "Grenades",
      "Imperium",
      "Smoke",
      "Phobos",
      "Incursor Squad",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Infernus Squad": {
    "name": "Infernus Squad",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "2",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Pyreblaster",
        "range": "12\"",
        "attacks": "D6",
        "skill": "N/A",
        "strength": "5",
        "ap": "-1",
        "damage": "1",
        "abilities": "Ignores Cover, Torrent"
      },
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Incendiary Terror",
        "description": "In your Shooting phase, after this unit has shot, you can select one enemy Infantry unit hit by one or more of those attacks made with a pyreblaster. That enemy unit must take a Battle-shock test, subtracting 1 from that test."
      }
    ],
    "keywords": [
      "Infantry",
      "Grenades",
      "Imperium",
      "Faction: Adeptus Astartes",
      "Tacticus",
      "Infernus Squad"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Infiltrator Squad": {
    "name": "Infiltrator Squad",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "2",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Marksman Bolt Carbine",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Heavy"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Omni-scramblers",
        "description": "Enemy units that are set up on the battlefield from Reserves cannot be set up within 12\" of this unit."
      },
      {
        "name": "Helix Gauntlet",
        "description": "Models in the bearer’s unit have the Feel No Pain 6+ ability."
      },
      {
        "name": "Infiltrator Comms Array",
        "description": "Each time you target the bearer’s unit with a Stratagem, roll one D6: on a 5+, you gain 1CP"
      }
    ],
    "keywords": [
      "Infantry",
      "Grenades",
      "Imperium",
      "Smoke",
      "Phobos",
      "Faction: Adeptus Astartes",
      "Infiltrator Squad"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Reiver Squad": {
    "name": "Reiver Squad",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "2",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Special Issue Bolt Pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Pistol, Precision"
      },
      {
        "name": "Bolt Carbine",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Precision"
      },
      {
        "name": "Combat Knife",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Precision"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Fearsome Assault",
        "description": "At the start of the Fight phase, each enemy unit within Engagement Range of one or more units with this ability must take a Battle-shock test subtracting 1 from that test"
      },
      {
        "name": "Terror Troops",
        "description": "While an enemy unit (excluding Monsters and Vehicles) is within 3\" of one or more units with this ability, subtract 1 from the Objective Control characteristic of models in that enemy unit."
      },
      {
        "name": "Grapnel Launchers",
        "description": "Each time the bearer’s unit makes a Normal, Advance, Fall Back or Charge move, ignore any vertical distance when determining the total distance the\nbearer can be moved during that move"
      },
      {
        "name": "Reiver Grav-chute",
        "description": "The bearer has the Deep Strike ability."
      }
    ],
    "keywords": [
      "Infantry",
      "Grenades",
      "Imperium",
      "Smoke",
      "Phobos",
      "Reiver Squad",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Scout Squad": {
    "name": "Scout Squad",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "4+",
      "Wounds": "2",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Boltgun",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Astartes Shotgun",
        "range": "18\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Assault"
      },
      {
        "name": "Heavy Bolter",
        "range": "36\"",
        "attacks": "3",
        "skill": "4+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Heavy, Sustained Hits 1"
      },
      {
        "name": "➤ Missile Launcher - Frag",
        "range": "48\"",
        "attacks": "D6",
        "skill": "4+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Blast, Heavy"
      },
      {
        "name": "➤ Missile Launcher - Krak",
        "range": "48\"",
        "attacks": "1",
        "skill": "4+",
        "strength": "9",
        "ap": "-2",
        "damage": "D6",
        "abilities": "Heavy"
      },
      {
        "name": "Scout Sniper Rifle",
        "range": "36\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "-2",
        "damage": "2",
        "abilities": "Heavy, Precision"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Astartes Chainsword",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Combat Knife",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Guerrilla Tactics",
        "description": "At the end of your opponent’s turn, if this unit is more than 6\" away from all enemy models, you can remove this unit from the battlefield and place it into\nStrategic Reserves."
      }
    ],
    "keywords": [
      "Infantry",
      "Grenades",
      "Imperium",
      "Smoke",
      "Scout Squad",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Sternguard Veteran Squad": {
    "name": "Sternguard Veteran Squad",
    "characteristics": {
      "Move": "6\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "2",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "Sternguard Bolt Pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Devastating Wounds, Pistol"
      },
      {
        "name": "Sternguard Bolt Rifle",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Assault, Devastating Wounds, Heavy, Rapid Fire 1"
      },
      {
        "name": "Combi-weapon",
        "range": "24\"",
        "attacks": "1",
        "skill": "4+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Anti-Infantry 4+, Devastating Wounds, Rapid Fire 1"
      },
      {
        "name": "Sternguard Heavy Bolter",
        "range": "36\"",
        "attacks": "3",
        "skill": "4+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Devastating Wounds, Heavy, Sustained Hits 1"
      },
      {
        "name": "Pyrecannon",
        "range": "12\"",
        "attacks": "D6+1",
        "skill": "N/A",
        "strength": "6",
        "ap": "-1",
        "damage": "1",
        "abilities": "Ignores Cover, Torrent"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Power weapon",
        "range": "Melee",
        "attacks": "5",
        "skill": "3+",
        "strength": "5",
        "ap": "-2",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Power fist",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      },
      {
        "name": "Astartes Chainsword",
        "range": "Melee",
        "attacks": "6",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Sternguard Focus",
        "description": "Each time a model in this unit makes an attack that targets your Oath of Moment Target, you can re-roll the wound roll"
      }
    ],
    "keywords": [
      "Infantry",
      "Grenades",
      "Imperium",
      "Tacticus",
      "Sternguard Veteran Squad",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Terminator Assault Squad": {
    "name": "Terminator Assault Squad",
    "characteristics": {
      "Move": "5\"",
      "Toughness": "5",
      "Save": "2+",
      "Wounds": "3",
      "Leadership": "6+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Thunder Hammer",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": "Devastating Wounds"
      },
      {
        "name": "Twin Lightning Claws",
        "range": "Melee",
        "attacks": "6",
        "skill": "3+",
        "strength": "5",
        "ap": "-2",
        "damage": "1",
        "abilities": "Twin-linked"
      }
    ],
    "abilities": [
      {
        "name": "Teleport Homer",
        "description": "At the start of the battle, you can set up one Teleport Homer token for this unit anywhere on the battlefield that is not in your opponent’s deployment zone. If you do, once per battle, you can target this unit with the Rapid Ingress Stratagem for 0CP, but when resolving that Stratagem, you must set this unit up within 3\" horizontally of that token and not within 8\" horizontally of any enemy models. That token is then removed."
      },
      {
        "name": "Terminatus Assault",
        "description": "At the start of the Fight phase, each enemy unit within Engagement Range of this unit must take a Battle-Shock test."
      },
      {
        "name": "Storm Shield",
        "description": "The bearer has a Wounds characteristic of 4."
      },
      {
        "name": "Storm Shield",
        "description": "The bearer has a Wounds characteristic of 4."
      }
    ],
    "keywords": [
      "Infantry",
      "Imperium",
      "Terminator Assault Squad",
      "Terminator",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Terminator Squad": {
    "name": "Terminator Squad",
    "characteristics": {
      "Move": "5\"",
      "Toughness": "5",
      "Save": "2+",
      "Wounds": "3",
      "Leadership": "6+",
      "Objective Control": "1",
      "Invulnerable save": "4+"
    },
    "weapons": [
      {
        "name": "Storm bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2"
      },
      {
        "name": "Heavy Flamer",
        "range": "12\"",
        "attacks": "D6",
        "skill": "N/A",
        "strength": "5",
        "ap": "-1",
        "damage": "1",
        "abilities": "Ignores Cover, Torrent"
      },
      {
        "name": "Assault Cannon",
        "range": "24\"",
        "attacks": "6",
        "skill": "3+",
        "strength": "6",
        "ap": "0",
        "damage": "1",
        "abilities": "Devastating Wounds"
      },
      {
        "name": "➤ Cyclone missile launcher - frag",
        "range": "36\"",
        "attacks": "2D6",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Blast"
      },
      {
        "name": "➤ Cyclone missile launcher - krak",
        "range": "36\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "9",
        "ap": "-2",
        "damage": "D6",
        "abilities": ""
      },
      {
        "name": "Power weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "5",
        "ap": "-2",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Chainfist",
        "range": "Melee",
        "attacks": "3",
        "skill": "4+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": "Anti-Vehicle 3+"
      },
      {
        "name": "Power fist",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "8",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Teleport Homer",
        "description": "At the start of the battle, you can set up one Teleport Homer token for this unit anywhere on the battlefield that is not in your opponent’s deployment zone. If you do, once per battle, you can target this unit with the Rapid Ingress Stratagem for 0CP, but when resolving that Stratagem, you must set this unit up within 3\" horizontally of that token and not within 8\" horizontally of any enemy models. That token is then removed."
      },
      {
        "name": "Fury of the First",
        "description": "Each time a model in this unit makes an attack that targets your Oath of Moment target, add 1 to the Hit roll."
      }
    ],
    "keywords": [
      "Infantry",
      "Imperium",
      "Terminator",
      "Terminator Squad",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Vanguard Veteran Squad with Jump Packs": {
    "name": "Vanguard Veteran Squad with Jump Packs",
    "characteristics": {
      "Move": "12\"",
      "Toughness": "4",
      "Save": "3+",
      "Wounds": "2",
      "Leadership": "6+",
      "Objective Control": "1"
    },
    "weapons": [
      {
        "name": "➤ Plasma pistol - supercharge",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "2",
        "abilities": "Hazardous, Pistol"
      },
      {
        "name": "➤ Plasma pistol - standard",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Inferno Pistol",
        "range": "6\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-4",
        "damage": "D3",
        "abilities": "Melta 2, Pistol"
      },
      {
        "name": "Hand flamer",
        "range": "12\"",
        "attacks": "D6",
        "skill": "N/A",
        "strength": "3",
        "ap": "0",
        "damage": "1",
        "abilities": "Ignores Cover, Pistol, Torrent"
      },
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Grav-pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "2",
        "abilities": "Anti-vehicle 2+, Pistol"
      },
      {
        "name": "Heavy Bolt Pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Vanguard Veteran Weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Master-crafted Power Weapon",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "5",
        "ap": "-2",
        "damage": "2",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Vanguard Assault",
        "description": "Each time this unit ends a Charge move, until the end of the turn, melee weapons equipped by models in this unit have the [LETHAL HITS] ability."
      },
      {
        "name": "Storm Shield",
        "description": "The bearer has a 4+ invulnerable save"
      },
      {
        "name": "Storm Shield",
        "description": "The bearer has a 4+ invulnerable save"
      }
    ],
    "keywords": [
      "Infantry",
      "Grenades",
      "Imperium",
      "Faction: Adeptus Astartes",
      "Vanguard Veteran Squad with Jump Packs",
      "Jump Pack",
      "Fly",
      "Vanguard Veteran Squad"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Outrider Squad": {
    "name": "Outrider Squad",
    "characteristics": {
      "Move": "12\"",
      "Toughness": "5",
      "Save": "3+",
      "Wounds": "4",
      "Leadership": "6+",
      "Objective Control": "2"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Twin bolt rifle",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Twin-linked"
      },
      {
        "name": "Onslaught gatling cannon",
        "range": "24\"",
        "attacks": "8",
        "skill": "3+",
        "strength": "5",
        "ap": "0",
        "damage": "1",
        "abilities": "Devastating Wounds"
      },
      {
        "name": "Multi-melta",
        "range": "18\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "9",
        "ap": "-4",
        "damage": "D6",
        "abilities": "Melta 2"
      },
      {
        "name": "Heavy Bolt Pistol",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Pistol"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "5",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Astartes Chainsword",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Thunderous Impact",
        "description": "Each time a model in this unit makes a melee attack, if this unit made a Charge move this turn, improve the Strength and Damage characteristics of that attack by 1"
      }
    ],
    "keywords": [
      "Mounted",
      "Grenades",
      "Imperium",
      "Outrider Squad",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Invader ATVs": {
    "name": "Invader ATVs",
    "characteristics": {
      "Move": "12\"",
      "Toughness": "5",
      "Save": "3+",
      "Wounds": "8",
      "Leadership": "6+",
      "Objective Control": "2"
    },
    "weapons": [
      {
        "name": "Bolt pistol",
        "range": "12\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Close-Quarters"
      },
      {
        "name": "Twin bolt rifle",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Twin-linked"
      },
      {
        "name": "Onslaught gatling cannon",
        "range": "24\"",
        "attacks": "8",
        "skill": "3+",
        "strength": "5",
        "ap": "0",
        "damage": "1",
        "abilities": "Devastating Wounds"
      },
      {
        "name": "Multi-melta",
        "range": "18\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "9",
        "ap": "-4",
        "damage": "D6",
        "abilities": "Melta 2"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "5",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Outrider Escort",
        "description": "Once per turn, in your opponent's Shooting phase, when another friendly Adeptus Astartes Mounted unit within 6\" of this model is selected as the target of an attack, one model from your army with this ability can use it. If it does, after that enemy unit has finished making its attacks, that model can shoot as if it were your Shooting phase , but when resolving those attacks it can only target that enemy unit [and only if it is an eligible target)."
      }
    ],
    "keywords": [
      "Mounted",
      "Grenades",
      "Imperium",
      "Invader ATV",
      "Faction: Adeptus Astartes",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Astraeus": {
    "name": "Astraeus",
    "characteristics": {
      "Move": "10\"",
      "Toughness": "12",
      "Save": "2+",
      "Wounds": "24",
      "Leadership": "6+",
      "Objective Control": "8",
      "Invulnerable save": "5+*"
    },
    "weapons": [
      {
        "name": "Ironhail Heavy Stubber",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 3"
      },
      {
        "name": "Twin macro-accelerator cannon",
        "range": "72\"",
        "attacks": "12",
        "skill": "3+",
        "strength": "9",
        "ap": "-1",
        "damage": "3",
        "abilities": "Sustained Hits 1, Twin-linked"
      },
      {
        "name": "Astraeus las-ripper",
        "range": "36\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "12",
        "ap": "-3",
        "damage": "D6+1",
        "abilities": ""
      },
      {
        "name": "➤ Plasma eradicator - standard",
        "range": "36\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "2",
        "abilities": "Blast"
      },
      {
        "name": "➤ Plasma eradicator - supercharge",
        "range": "36\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "3",
        "abilities": "Blast, Hazardous"
      }
    ],
    "abilities": [
      {
        "name": "Suppression Fire",
        "description": "In your Shooting phase, after this model has shot, select one enemy unit hit by one or more attacks made with its twin macro-accelerator cannon this phase. Until the start of your next turn, while this model is on the battlefield, that enemy unit is suppressed. While a unit is suppressed, each time a model in that unit makes an attack, subtract 1 from the Hit roll."
      },
      {
        "name": "*Invulnerable Save",
        "description": "This model has a 5+ invulnerable save against ranged attacks."
      }
    ],
    "keywords": [
      "Faction: Adeptus Astartes",
      "Vehicle",
      "Titanic",
      "Imperium",
      "Astraeus"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Ballistus Dreadnought": {
    "name": "Ballistus Dreadnought",
    "characteristics": {
      "Move": "8\"",
      "Toughness": "10",
      "Save": "2+",
      "Wounds": "12",
      "Leadership": "6+",
      "Objective Control": "4"
    },
    "weapons": [
      {
        "name": "Twin Storm Bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2, Twin-linked"
      },
      {
        "name": "Ballistus Lascannon",
        "range": "48\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "12",
        "ap": "-3",
        "damage": "D6+1",
        "abilities": ""
      },
      {
        "name": "➤ Ballistus Missile Launcher - Frag",
        "range": "48\"",
        "attacks": "2D6",
        "skill": "3+",
        "strength": "5",
        "ap": "0",
        "damage": "1",
        "abilities": "Blast"
      },
      {
        "name": "➤ Ballistus Missile Launcher - Krak",
        "range": "48\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "10",
        "ap": "-2",
        "damage": "D6",
        "abilities": ""
      },
      {
        "name": "Armoured Feet",
        "range": "Melee",
        "attacks": "5",
        "skill": "3+",
        "strength": "7",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Ballistus Strike",
        "description": "Each time this model makes a ranged attack that targets a unit that is not Below Half-strength, you can re-roll the Hit roll."
      }
    ],
    "keywords": [
      "Vehicle",
      "Walker",
      "Imperium",
      "Ballistus Dreadnought",
      "Faction: Adeptus Astartes",
      "Dreadnought"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Brutalis Dreadnought": {
    "name": "Brutalis Dreadnought",
    "characteristics": {
      "Move": "8\"",
      "Toughness": "10",
      "Save": "2+",
      "Wounds": "12",
      "Leadership": "6+",
      "Objective Control": "4"
    },
    "weapons": [
      {
        "name": "Twin Icarus ironhail heavy stubber",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Anti-FLY 4+, Rapid Fire 3, Twin-linked"
      },
      {
        "name": "Brutalis Bolt Rifles",
        "range": "24\"",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Twin-linked"
      },
      {
        "name": "Twin heavy bolter",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Sustained Hits 1, Twin-linked"
      },
      {
        "name": "Twin multi-melta",
        "range": "18\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "9",
        "ap": "-4",
        "damage": "D6",
        "abilities": "Melta 2, Twin-linked"
      },
      {
        "name": "Brutalis Fists",
        "range": "Melee",
        "attacks": "6",
        "skill": "3+",
        "strength": "12",
        "ap": "-2",
        "damage": "3",
        "abilities": "Twin-linked"
      },
      {
        "name": "➤ Brutalis Talons - Strike",
        "range": "Melee",
        "attacks": "6",
        "skill": "3+",
        "strength": "12",
        "ap": "-2",
        "damage": "3",
        "abilities": "Twin-linked"
      },
      {
        "name": "➤ Brutalis Talons - Sweep",
        "range": "Melee",
        "attacks": "10",
        "skill": "3+",
        "strength": "7",
        "ap": "-2",
        "damage": "1",
        "abilities": "Twin-linked"
      }
    ],
    "abilities": [
      {
        "name": "Brutalis Charge",
        "description": "Each time this model ends a Charge move, select one enemy unit within Engagement Range of it and roll one D6: on a 2-3, that enemy unit suffers D3 mortal wounds; on a 4-5, that enemy unit suffers 3 mortal wounds; on a 6, that enemy unit suffers D3+3 mortal wounds"
      }
    ],
    "keywords": [
      "Vehicle",
      "Walker",
      "Brutalis Dreadnought",
      "Imperium",
      "Faction: Adeptus Astartes",
      "Dreadnought"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Firestrike Servo-turrets": {
    "name": "Firestrike Servo-turrets",
    "characteristics": {
      "Move": "3\"",
      "Toughness": "6",
      "Save": "2+",
      "Wounds": "6",
      "Leadership": "6+",
      "Objective Control": "2"
    },
    "weapons": [
      {
        "name": "Twin Firestrike Las-talon",
        "range": "36\"",
        "attacks": "2",
        "skill": "2+",
        "strength": "10",
        "ap": "-3",
        "damage": "D6+1",
        "abilities": "Twin-linked"
      },
      {
        "name": "Twin Firestrike Autocannon",
        "range": "48\"",
        "attacks": "3",
        "skill": "2+",
        "strength": "9",
        "ap": "-1",
        "damage": "3",
        "abilities": "Twin-linked"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Sentinel Protocols",
        "description": "Each time you select this unit for the Fire Overwatch Stratagem, hits are scored on unmodified Hit rolls of 4+ when resolving that Stratagem."
      }
    ],
    "keywords": [
      "Artillery",
      "Vehicle",
      "Imperium",
      "Faction: Adeptus Astartes",
      "Firestrike Servo-turrets"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Gladiator Lancer": {
    "name": "Gladiator Lancer",
    "characteristics": {
      "Move": "10\"",
      "Toughness": "10",
      "Save": "3+",
      "Wounds": "12",
      "Leadership": "6+",
      "Objective Control": "3"
    },
    "weapons": [
      {
        "name": "Icarus Rocket Pod",
        "range": "24\"",
        "attacks": "D3",
        "skill": "3+",
        "strength": "8",
        "ap": "-1",
        "damage": "2",
        "abilities": "Anti-fly 2+"
      },
      {
        "name": "Ironhail Heavy Stubber",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 3"
      },
      {
        "name": "Lancer Laser Destroyer",
        "range": "72\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "14",
        "ap": "-4",
        "damage": "D6+3",
        "abilities": "Heavy"
      },
      {
        "name": "Fragstorm grenade launcher",
        "range": "18\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Blast"
      },
      {
        "name": "Storm bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2"
      },
      {
        "name": "Armoured Hull",
        "range": "Melee",
        "attacks": "3",
        "skill": "4+",
        "strength": "6",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Aqullon Optics",
        "description": "Each time this model is selected to shoot, you can re-roll one Hit roll, you can re-roll one Wound roll and you can re-roll one Damage roll when resolving its attacks"
      }
    ],
    "keywords": [
      "Vehicle",
      "Imperium",
      "Smoke",
      "Gladiator Lancer",
      "Faction: Adeptus Astartes",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Gladiator Reaper": {
    "name": "Gladiator Reaper",
    "characteristics": {
      "Move": "10\"",
      "Toughness": "10",
      "Save": "3+",
      "Wounds": "12",
      "Leadership": "6+",
      "Objective Control": "3"
    },
    "weapons": [
      {
        "name": "Icarus Rocket Pod",
        "range": "24\"",
        "attacks": "D3",
        "skill": "3+",
        "strength": "8",
        "ap": "-1",
        "damage": "2",
        "abilities": "Anti-fly 2+"
      },
      {
        "name": "Ironhail Heavy Stubber",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 3"
      },
      {
        "name": "Tempest Bolter",
        "range": "24\"",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "-1",
        "damage": "1",
        "abilities": "Rapid Fire 4"
      },
      {
        "name": "Twin Heavy Onslaught Gatling Cannon",
        "range": "24\"",
        "attacks": "12",
        "skill": "3+",
        "strength": "6",
        "ap": "0",
        "damage": "1",
        "abilities": "Devastating Wounds, Twin-linked"
      },
      {
        "name": "Armoured Hull",
        "range": "Melee",
        "attacks": "3",
        "skill": "4+",
        "strength": "6",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Rotating Death",
        "description": "This model’s twin heavy onslaught gatling cannon has the [SUSTAINED HITS 2] ability when targeting Infantry units."
      }
    ],
    "keywords": [
      "Smoke",
      "Imperium",
      "Vehicle",
      "Faction: Adeptus Astartes",
      "Gladiator Reaper",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Gladiator Valiant": {
    "name": "Gladiator Valiant",
    "characteristics": {
      "Move": "10\"",
      "Toughness": "10",
      "Save": "3+",
      "Wounds": "12",
      "Leadership": "6+",
      "Objective Control": "3"
    },
    "weapons": [
      {
        "name": "Icarus Rocket Pod",
        "range": "24\"",
        "attacks": "D3",
        "skill": "3+",
        "strength": "8",
        "ap": "-1",
        "damage": "2",
        "abilities": "Anti-fly 2+"
      },
      {
        "name": "Ironhail Heavy Stubber",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 3"
      },
      {
        "name": "Multi-melta",
        "range": "18\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "9",
        "ap": "-4",
        "damage": "D6",
        "abilities": "Melta 2"
      },
      {
        "name": "Twin Las-talon",
        "range": "36\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "10",
        "ap": "-3",
        "damage": "D6+1",
        "abilities": "Twin-linked"
      },
      {
        "name": "Armoured Hull",
        "range": "Melee",
        "attacks": "3",
        "skill": "4+",
        "strength": "6",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Ferocious Assault",
        "description": "Each time this model makes an attack with its twin las-talon that targets the closest eligible Monster or Vehicle unit, add 1 to the Hit roll"
      }
    ],
    "keywords": [
      "Vehicle",
      "Smoke",
      "Imperium",
      "Gladiator Valiant",
      "Faction: Adeptus Astartes",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Invictor Tactical Warsuit": {
    "name": "Invictor Tactical Warsuit",
    "characteristics": {
      "Move": "8\"",
      "Toughness": "8",
      "Save": "3+",
      "Wounds": "12",
      "Leadership": "6+",
      "Objective Control": "4"
    },
    "weapons": [
      {
        "name": "Fragstorm grenade launcher",
        "range": "18\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Blast"
      },
      {
        "name": "Heavy Bolter",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Sustained Hits 1"
      },
      {
        "name": "Twin Ironhail Heavy Stubber",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 3, Twin-linked"
      },
      {
        "name": "Incendium Cannon",
        "range": "12\"",
        "attacks": "D6+3",
        "skill": "N/A",
        "strength": "6",
        "ap": "-1",
        "damage": "1",
        "abilities": "Ignores Cover, Torrent"
      },
      {
        "name": "Twin Ironhail Autocannon",
        "range": "48\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "9",
        "ap": "-1",
        "damage": "3",
        "abilities": "Twin-linked"
      },
      {
        "name": "Invictor Fist",
        "range": "Melee",
        "attacks": "5",
        "skill": "3+",
        "strength": "14",
        "ap": "-2",
        "damage": "3",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Combat Support",
        "description": "Once per turn, in your opponent’s Shooting phase, when a friendly Adeptus Astartes Phobos Infantry unit within 6\" of this model is selected as the target of an attack, this model can use this ability. If it does, after that enemy model’s unit has finished making its attacks, this model can shoot as if it were your Shooting phase, but when resolving those attacks it can only target that enemy unit (and only if it is an eligible target)."
      }
    ],
    "keywords": [
      "Vehicle",
      "Walker",
      "Invictor Tactical Warsuit",
      "Faction: Adeptus Astartes",
      "Imperium",
      "Phobos"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Land Raider": {
    "name": "Land Raider",
    "characteristics": {
      "Move": "10\"",
      "Toughness": "12",
      "Save": "2+",
      "Wounds": "16",
      "Leadership": "6+",
      "Objective Control": "5"
    },
    "weapons": [
      {
        "name": "Hunter-killer missile",
        "range": "48\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "14",
        "ap": "-3",
        "damage": "D6",
        "abilities": "One Shot"
      },
      {
        "name": "Multi-melta",
        "range": "18\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "9",
        "ap": "-4",
        "damage": "D6",
        "abilities": "Melta 2"
      },
      {
        "name": "Storm bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2"
      },
      {
        "name": "Twin heavy bolter",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Sustained Hits 1, Twin-linked"
      },
      {
        "name": "Godhammer Lascannon",
        "range": "48\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "12",
        "ap": "-3",
        "damage": "D6+1",
        "abilities": ""
      },
      {
        "name": "Armoured Tracks",
        "range": "Melee",
        "attacks": "6",
        "skill": "4+",
        "strength": "8",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Assault Ramp",
        "description": "Each time a unit disembarks from this model after it has made a Normal move, that unit is still eligible to declare a charge this turn."
      },
      {
        "name": "Transport",
        "description": "This model has a transport capacity of 12 Adeptus Astartes Infantry models. Each Jump Pack, Wulfen, Gravis or Terminator model takes up the space of 2 models and each Centurion model takes up the space of 3 models."
      }
    ],
    "keywords": [
      "Vehicle",
      "Smoke",
      "Imperium",
      "Faction: Adeptus Astartes",
      "Land Raider",
      "Transport",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Land Raider Crusader": {
    "name": "Land Raider Crusader",
    "characteristics": {
      "Move": "12\"",
      "Toughness": "12",
      "Save": "2+",
      "Wounds": "16",
      "Leadership": "6+",
      "Objective Control": "5"
    },
    "weapons": [
      {
        "name": "Hunter-killer missile",
        "range": "48\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "14",
        "ap": "-3",
        "damage": "D6",
        "abilities": "One Shot"
      },
      {
        "name": "Hurricane Bolter",
        "range": "24\"",
        "attacks": "6",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 6, Twin-linked"
      },
      {
        "name": "Multi-melta",
        "range": "18\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "9",
        "ap": "-4",
        "damage": "D6",
        "abilities": "Melta 2"
      },
      {
        "name": "Storm bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2"
      },
      {
        "name": "Twin assault cannon",
        "range": "24\"",
        "attacks": "6",
        "skill": "3+",
        "strength": "6",
        "ap": "0",
        "damage": "1",
        "abilities": "Devastating wounds, Twin-linked"
      },
      {
        "name": "Armoured Tracks",
        "range": "Melee",
        "attacks": "6",
        "skill": "4+",
        "strength": "8",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Transport",
        "description": "This model has a transport capacity of 16 Adeptus Astartes Infantry models. Each Jump Pack, Wulfen, Gravis or Terminator model takes up the space of 2 models and each Centurion model takes up the space of 3 models."
      },
      {
        "name": "Assault Ramp",
        "description": "Each time a unit disembarks from this model after it has made a Normal move, that unit is still eligible to declare a charge this turn."
      }
    ],
    "keywords": [
      "Vehicle",
      "Land Raider Crusader",
      "Smoke",
      "Faction: Adeptus Astartes",
      "Imperium",
      "Transport",
      "Grenades",
      "Land Raider",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Land Raider Redeemer": {
    "name": "Land Raider Redeemer",
    "characteristics": {
      "Move": "12\"",
      "Toughness": "12",
      "Save": "2+",
      "Wounds": "16",
      "Leadership": "6+",
      "Objective Control": "5"
    },
    "weapons": [
      {
        "name": "Hunter-killer missile",
        "range": "48\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "14",
        "ap": "-3",
        "damage": "D6",
        "abilities": "One Shot"
      },
      {
        "name": "Multi-melta",
        "range": "18\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "9",
        "ap": "-4",
        "damage": "D6",
        "abilities": "Melta 2"
      },
      {
        "name": "Storm bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2"
      },
      {
        "name": "Twin assault cannon",
        "range": "24\"",
        "attacks": "6",
        "skill": "3+",
        "strength": "6",
        "ap": "0",
        "damage": "1",
        "abilities": "Devastating wounds, Twin-linked"
      },
      {
        "name": "Flamestorm Cannon",
        "range": "12\"",
        "attacks": "D6+3",
        "skill": "N/A",
        "strength": "6",
        "ap": "-2",
        "damage": "2",
        "abilities": "Ignores Cover, Torrent"
      },
      {
        "name": "Armoured Tracks",
        "range": "Melee",
        "attacks": "6",
        "skill": "4+",
        "strength": "8",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Transport",
        "description": "This model has a transport capacity of 14 Adeptus Astartes Infantry models. Each Jump Pack, Wulfen, Gravis or Terminator model takes up the space of 2 models and each Centurion model takes up the space of 3 models."
      },
      {
        "name": "Assault Ramp",
        "description": "Each time a unit disembarks from this model after it has made a Normal move, that unit is still eligible to declare a charge this turn."
      }
    ],
    "keywords": [
      "Vehicle",
      "Grenades",
      "Imperium",
      "Smoke",
      "Land Raider Redeemer",
      "Faction: Adeptus Astartes",
      "Transport",
      "Land Raider",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Land Speeder": {
    "name": "Land Speeder",
    "characteristics": {
      "Move": "14\"",
      "Toughness": "8",
      "Save": "3+",
      "Wounds": "9",
      "Leadership": "6+",
      "Objective Control": "3"
    },
    "weapons": [
      {
        "name": "Multi-melta",
        "range": "18\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "9",
        "ap": "-4",
        "damage": "D6",
        "abilities": "Melta 2"
      },
      {
        "name": "Stormfury Missile Launcher",
        "range": "48\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "12",
        "ap": "-3",
        "damage": "D6+1",
        "abilities": ""
      },
      {
        "name": "Heavy Flamer",
        "range": "12\"",
        "attacks": "D6",
        "skill": "N/A",
        "strength": "5",
        "ap": "-1",
        "damage": "1",
        "abilities": "Ignores Cover, Torrent"
      },
      {
        "name": "Onslaught gatling cannon",
        "range": "24\"",
        "attacks": "8",
        "skill": "3+",
        "strength": "5",
        "ap": "0",
        "damage": "1",
        "abilities": "Devastating Wounds"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Purgation Run",
        "description": "In your Shooting phase, after this unit has shot, it can make a normal move of up to D6\". If it does,\nuntil the end of the turn, this unit is not eligible to declare a charge."
      }
    ],
    "keywords": [
      "Vehicle",
      "Fly",
      "Imperium",
      "Land Speeder",
      "Faction: Adeptus Astartes"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Redemptor Dreadnought": {
    "name": "Redemptor Dreadnought",
    "characteristics": {
      "Move": "8\"",
      "Toughness": "10",
      "Save": "2+",
      "Wounds": "12",
      "Leadership": "6+",
      "Objective Control": "4"
    },
    "weapons": [
      {
        "name": "Icarus Rocket Pod",
        "range": "24\"",
        "attacks": "D3",
        "skill": "3+",
        "strength": "8",
        "ap": "-1",
        "damage": "2",
        "abilities": "Anti-fly 2+"
      },
      {
        "name": "➤ Macro Plasma Incinerator - Standard",
        "range": "36\"",
        "attacks": "D6+1",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "2",
        "abilities": "Blast"
      },
      {
        "name": "➤ Macro Plasma Incinerator - Supercharge",
        "range": "36\"",
        "attacks": "D6+1",
        "skill": "3+",
        "strength": "9",
        "ap": "-4",
        "damage": "3",
        "abilities": "Blast, Hazardous"
      },
      {
        "name": "Heavy Onslaught Gatling Cannon",
        "range": "24\"",
        "attacks": "12",
        "skill": "3+",
        "strength": "6",
        "ap": "0",
        "damage": "1",
        "abilities": "Devastating Wounds"
      },
      {
        "name": "Heavy Flamer",
        "range": "12\"",
        "attacks": "D6",
        "skill": "N/A",
        "strength": "5",
        "ap": "-1",
        "damage": "1",
        "abilities": "Ignores Cover, Torrent"
      },
      {
        "name": "Onslaught gatling cannon",
        "range": "24\"",
        "attacks": "8",
        "skill": "3+",
        "strength": "5",
        "ap": "0",
        "damage": "1",
        "abilities": "Devastating Wounds"
      },
      {
        "name": "Twin Fragstorm Grenade Launcher",
        "range": "18\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Blast, Twin-linked"
      },
      {
        "name": "Twin Storm Bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2, Twin-linked"
      },
      {
        "name": "Redemptor Fist",
        "range": "Melee",
        "attacks": "5",
        "skill": "3+",
        "strength": "12",
        "ap": "-2",
        "damage": "3",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Duty Eternal",
        "description": "Each time an attack is allocated to this model, subtract 1 from the Damage characteristic of that attack"
      }
    ],
    "keywords": [
      "Vehicle",
      "Walker",
      "Imperium",
      "Redemptor Dreadnought",
      "Faction: Adeptus Astartes",
      "Dreadnought"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Repulsor": {
    "name": "Repulsor",
    "characteristics": {
      "Move": "10\"",
      "Toughness": "12",
      "Save": "3+",
      "Wounds": "16",
      "Leadership": "6+",
      "Objective Control": "5"
    },
    "weapons": [
      {
        "name": "Hunter-slayer missile",
        "range": "48\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "14",
        "ap": "-3",
        "damage": "D6",
        "abilities": "Indirect Fire, One Shot"
      },
      {
        "name": "Repulsor Defensive Array",
        "range": "24\"",
        "attacks": "18",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "Twin heavy bolter",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Sustained Hits 1, Twin-linked"
      },
      {
        "name": "Twin lascannon",
        "range": "48\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "12",
        "ap": "-3",
        "damage": "D6+1",
        "abilities": "Twin-linked"
      },
      {
        "name": "Heavy Onslaught Gatling Cannon",
        "range": "24\"",
        "attacks": "12",
        "skill": "3+",
        "strength": "6",
        "ap": "0",
        "damage": "1",
        "abilities": "Devastating Wounds"
      },
      {
        "name": "Las-talon",
        "range": "36\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "10",
        "ap": "-3",
        "damage": "D6+1",
        "abilities": ""
      },
      {
        "name": "Armoured Hull",
        "range": "Melee",
        "attacks": "6",
        "skill": "4+",
        "strength": "8",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Transport",
        "description": "This model has a transport capacity of 14 ADEPTUS ASTARTES INFANTRY models. Each JUMP PACK, WULFEN, GRAVIS or TERMINATOR model takes up the space of 2 models and each CENTURION model takes up the space of 3 models."
      },
      {
        "name": "Emergency Combat Embarkation",
        "description": "Once per turn, in your opponent’s Charge phase, after an enemy unit has selected targets for its charge but before it makes a Charge move, you can select one Adeptus Astartes unit from your army that was selected as a target of that charge. Provided that unit is not within Engagement Range of any enemy units and every model in that unit is within 3\" of this Transport, it can embark within this Transport. The charging unit can then select new targets for its charge."
      }
    ],
    "keywords": [
      "Vehicle",
      "Imperium",
      "Smoke",
      "Repulsor",
      "Faction: Adeptus Astartes",
      "Transport",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Repulsor Executioner": {
    "name": "Repulsor Executioner",
    "characteristics": {
      "Move": "10\"",
      "Toughness": "12",
      "Save": "3+",
      "Wounds": "16",
      "Leadership": "6+",
      "Objective Control": "5"
    },
    "weapons": [
      {
        "name": "Heavy Onslaught Gatling Cannon",
        "range": "24\"",
        "attacks": "12",
        "skill": "3+",
        "strength": "6",
        "ap": "0",
        "damage": "1",
        "abilities": "Devastating Wounds"
      },
      {
        "name": "Icarus Rocket Pod",
        "range": "24\"",
        "attacks": "D3",
        "skill": "3+",
        "strength": "8",
        "ap": "-1",
        "damage": "2",
        "abilities": "Anti-fly 2+"
      },
      {
        "name": "Ironhail Heavy Stubber",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 3"
      },
      {
        "name": "Twin heavy bolter",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "5",
        "ap": "-1",
        "damage": "2",
        "abilities": "Sustained Hits 1, Twin-linked"
      },
      {
        "name": "Twin Icarus ironhail heavy stubber",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Anti-FLY 4+, Rapid Fire 3, Twin-linked"
      },
      {
        "name": "Repulsor Executioner Defensive Array",
        "range": "24\"",
        "attacks": "10",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      },
      {
        "name": "➤ Macro Plasma Incinerator - Standard",
        "range": "36\"",
        "attacks": "D6+1",
        "skill": "3+",
        "strength": "8",
        "ap": "-3",
        "damage": "2",
        "abilities": "Blast"
      },
      {
        "name": "➤ Macro Plasma Incinerator - Supercharge",
        "range": "36\"",
        "attacks": "D6+1",
        "skill": "3+",
        "strength": "9",
        "ap": "-4",
        "damage": "3",
        "abilities": "Blast, Hazardous"
      },
      {
        "name": "Heavy Laser Destroyer",
        "range": "72\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "16",
        "ap": "-4",
        "damage": "D6+4",
        "abilities": "Heavy"
      },
      {
        "name": "Armoured Hull",
        "range": "Melee",
        "attacks": "6",
        "skill": "4+",
        "strength": "8",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Transport",
        "description": "This model has a transport capacity of 7 Adeptus Astartes Infantry models. Each Jump Pack, Wulfen, Gravis or Terminator model takes up the space of 2 models and each Centurion model takes up the space of 3 models."
      },
      {
        "name": "Executioner",
        "description": "Each time this model makes an attack that targets a unit that is Below Half-strength, add 1 to the Hit roll."
      }
    ],
    "keywords": [
      "Vehicle",
      "Smoke",
      "Imperium",
      "Transport",
      "Repulsor Executioner",
      "Faction: Adeptus Astartes",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Storm Speeder Hailstrike": {
    "name": "Storm Speeder Hailstrike",
    "characteristics": {
      "Move": "14\"",
      "Toughness": "9",
      "Save": "3+",
      "Wounds": "11",
      "Leadership": "6+",
      "Objective Control": "3"
    },
    "weapons": [
      {
        "name": "Fragstorm grenade launcher",
        "range": "18\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Blast"
      },
      {
        "name": "Onslaught gatling cannon",
        "range": "24\"",
        "attacks": "8",
        "skill": "3+",
        "strength": "5",
        "ap": "0",
        "damage": "1",
        "abilities": "Devastating Wounds"
      },
      {
        "name": "Twin Ironhail Heavy Stubber",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 3, Twin-linked"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Hailstrike",
        "description": "Each time this model has shot, select one enemy unit (excluding MONSTERS or VEHICLES) that was hit by one or more of those attacks. Until the end of the phase, each time a friendly ADEPTUS ASTARTES unit makes a ranged attack that targets that enemy unit, improve the Armour Penetration characteristic of that attack by 1. The same enemy unit can only be affected by this ability once per phase."
      }
    ],
    "keywords": [
      "Vehicle",
      "Fly",
      "Imperium",
      "Faction: Adeptus Astartes",
      "Storm Speeder Hailstrike",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Storm Speeder Hammerstrike": {
    "name": "Storm Speeder Hammerstrike",
    "characteristics": {
      "Move": "14\"",
      "Toughness": "9",
      "Save": "3+",
      "Wounds": "11",
      "Leadership": "6+",
      "Objective Control": "3"
    },
    "weapons": [
      {
        "name": "Hammerstrike Missile Launcher",
        "range": "36\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "9",
        "ap": "-3",
        "damage": "D6",
        "abilities": ""
      },
      {
        "name": "Krakstorm Grenade Launcher",
        "range": "18\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "9",
        "ap": "-1",
        "damage": "D3",
        "abilities": ""
      },
      {
        "name": "Melta Destroyer",
        "range": "18\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "9",
        "ap": "-4",
        "damage": "D6",
        "abilities": "Melta 2"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Hammerstrike",
        "description": "Each time this model has shot, select one enemy unit that was hit by one or more of those attacks. Until the end of the phase, that enemy unit cannot have the Benefit of Cover."
      }
    ],
    "keywords": [
      "Imperium",
      "Fly",
      "Vehicle",
      "Storm Speeder Hammerstrike",
      "Faction: Adeptus Astartes",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Storm Speeder Thunderstrike": {
    "name": "Storm Speeder Thunderstrike",
    "characteristics": {
      "Move": "14\"",
      "Toughness": "9",
      "Save": "3+",
      "Wounds": "11",
      "Leadership": "6+",
      "Objective Control": "3"
    },
    "weapons": [
      {
        "name": "Stormfury Missiles",
        "range": "48\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "12",
        "ap": "-3",
        "damage": "D6+1",
        "abilities": ""
      },
      {
        "name": "Thunderstrike Las-talon",
        "range": "36\"",
        "attacks": "2",
        "skill": "2+",
        "strength": "9",
        "ap": "-3",
        "damage": "D6+1",
        "abilities": ""
      },
      {
        "name": "Twin Icarus Rocket Pod",
        "range": "24\"",
        "attacks": "D3",
        "skill": "3+",
        "strength": "8",
        "ap": "-1",
        "damage": "2",
        "abilities": "Anti-Fly 2+, Twin-linked"
      },
      {
        "name": "Close combat weapon",
        "range": "Melee",
        "attacks": "4",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Thunderstrike",
        "description": "Each time this model has shot, select one enemy MONSTER or VEHICLE unit that was hit by one or more of those attacks. Until the end of the phase, each time a friendly ADEPTUS ASTARTES unit makes a ranged attack that targets that enemy unit, add 1 to the Wound roll."
      }
    ],
    "keywords": [
      "Vehicle",
      "Fly",
      "Imperium",
      "Storm Speeder Thunderstrike",
      "Faction: Adeptus Astartes",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Thunderhawk Gunship": {
    "name": "Thunderhawk Gunship",
    "characteristics": {
      "Move": "20+\"",
      "Toughness": "12",
      "Save": "2+",
      "Wounds": "30",
      "Leadership": "6+",
      "Objective Control": "0"
    },
    "weapons": [
      {
        "name": "Hellstrike missile battery",
        "range": "72\"",
        "attacks": "4",
        "skill": "3+",
        "strength": "8",
        "ap": "-2",
        "damage": "3",
        "abilities": "Anti-FLY 4+"
      },
      {
        "name": "Thunderhawk heavy cannon",
        "range": "48\"",
        "attacks": "D6+6",
        "skill": "3+",
        "strength": "10",
        "ap": "-2",
        "damage": "3",
        "abilities": "Blast"
      },
      {
        "name": "Turbo-laser destructor",
        "range": "96\"",
        "attacks": "D3+1",
        "skill": "3+",
        "strength": "20",
        "ap": "-4",
        "damage": "D6+6",
        "abilities": "Blast"
      }
    ],
    "abilities": [
      {
        "name": "Aerial Assault",
        "description": "Each time a unit with the Deep Strike ability disembarks from this model after it has made a Normal move, that unit is still eligible to declare a charge this turn."
      },
      {
        "name": "Damaged: 1-10 wounds remaining",
        "description": "While this model has 1-10 wounds remaining, each time this model makes an attack, subtract 1 from the Hit roll."
      },
      {
        "name": "Thunderhawk Cluster Bombs",
        "description": "Each time the bearer ends a Normal move, you can select one enemy unit it moved over during that move and roll six D6: for each 3+, that unit suffers 1 mortal wound."
      }
    ],
    "keywords": [
      "Faction: Adeptus Astartes",
      "Vehicle",
      "Titanic",
      "Fly",
      "Transport",
      "Imperium",
      "Thunderhawk Gunship"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Drop Pod": {
    "name": "Drop Pod",
    "characteristics": {
      "Move": "-",
      "Toughness": "7",
      "Save": "3+",
      "Wounds": "8",
      "Leadership": "6+",
      "Objective Control": "0"
    },
    "weapons": [],
    "abilities": [
      {
        "name": "Drop Pod Assault",
        "description": "This model must start the battle in Reserves and can be set up in the Reinforcements step of your first, second or third Movement phase, regardless of any mission rules. Any units embarked within this model must immediately disembark after it has been set up on the battlefield, and they must be set up more than 8\" away from all enemy models."
      },
      {
        "name": "Transport",
        "description": "This model has a transport capacity of 12 Adeptus Astartes Infantry models. It cannot transport Jump Pack, Wulfen, Gravis, Centurion or Terminator models."
      },
      {
        "name": "Combat Disembarkation",
        "description": "Each time a unit disembarks from this model after it has been set up on the battlefield, that unit is still eligible to declare a charge this turn"
      },
      {
        "name": "Deployment Complete",
        "description": "Once this unit is set up on the battlefield and all units within it have disembarked, until the end of the battle, units cannot embark within this TRANSPORT"
      }
    ],
    "keywords": [
      "Vehicle",
      "Imperium",
      "Drop Pod",
      "Transport",
      "Dedicated Transport",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Impulsor": {
    "name": "Impulsor",
    "characteristics": {
      "Move": "12\"",
      "Toughness": "9",
      "Save": "3+",
      "Wounds": "11",
      "Leadership": "6+",
      "Objective Control": "2"
    },
    "weapons": [
      {
        "name": "Ironhail Heavy Stubber",
        "range": "36\"",
        "attacks": "3",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 3"
      },
      {
        "name": "➤ Bellicatus Missile Array - Frag",
        "range": "48\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Blast"
      },
      {
        "name": "➤ Bellicatus Missile Array - Icarus",
        "range": "48\"",
        "attacks": "D3",
        "skill": "3+",
        "strength": "8",
        "ap": "-1",
        "damage": "2",
        "abilities": "Anti-Fly 2+"
      },
      {
        "name": "➤ Bellicatus Missile Array - Krak",
        "range": "48\"",
        "attacks": "1",
        "skill": "3+",
        "strength": "8",
        "ap": "-2",
        "damage": "D6",
        "abilities": ""
      },
      {
        "name": "Ironhail Skytalon Array",
        "range": "36\"",
        "attacks": "8",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Anti-Fly 4+, Sustained Hits 1"
      },
      {
        "name": "Storm bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2"
      },
      {
        "name": "Fragstorm grenade launcher",
        "range": "18\"",
        "attacks": "D6",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Blast"
      },
      {
        "name": "Armoured Hull",
        "range": "Melee",
        "attacks": "3",
        "skill": "4+",
        "strength": "6",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Transport",
        "description": "This model has a transport capacity of 7 TACTICUS or PHOBOS INFANTRY models. It cannot transport JUMP PACK models."
      },
      {
        "name": "Assault Vehicle",
        "description": "Units can disembark from this Transport after it has Advanced. Units that do so count as having made a Normal move, and cannot declare a charge that turn."
      },
      {
        "name": "Orbital Comms Array [Aura]",
        "description": "While a friendly Adeptus Astartes unit is within 6\" of the bearer, each time you target that unit with a Stratagem, roll one D6: on a 5+, you gain 1CP"
      },
      {
        "name": "Shield Dome",
        "description": "The bearer has a 5+ invulnerable save."
      }
    ],
    "keywords": [
      "Vehicle",
      "Transport",
      "Dedicated Transport",
      "Imperium",
      "Faction: Adeptus Astartes",
      "Impulsor"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  },
  "Rhino": {
    "name": "Rhino",
    "characteristics": {
      "Move": "12\"",
      "Toughness": "9",
      "Save": "3+",
      "Wounds": "10",
      "Leadership": "6+",
      "Objective Control": "2"
    },
    "weapons": [
      {
        "name": "Hunter-killer missile",
        "range": "48\"",
        "attacks": "1",
        "skill": "2+",
        "strength": "14",
        "ap": "-3",
        "damage": "D6",
        "abilities": "One Shot"
      },
      {
        "name": "Storm bolter",
        "range": "24\"",
        "attacks": "2",
        "skill": "3+",
        "strength": "4",
        "ap": "0",
        "damage": "1",
        "abilities": "Rapid Fire 2"
      },
      {
        "name": "Armoured Tracks",
        "range": "Melee",
        "attacks": "3",
        "skill": "4+",
        "strength": "6",
        "ap": "0",
        "damage": "1",
        "abilities": ""
      }
    ],
    "abilities": [
      {
        "name": "Self Repair",
        "description": "At the end of your Command phase, this model regains 1 lost wound."
      },
      {
        "name": "Transport",
        "description": "This model has a transport capacity of 12 ADEPTUS ASTARTES INFANTRY models. It cannot transport JUMP PACK, WULFEN, PHOBOS, GRAVIS, CENTURION, TERMINATOR or TACTICUS models (excluding TACTICUS CHARACTER models that began the battle attached to a non-TACTICUS unit)"
      }
    ],
    "keywords": [
      "Imperium",
      "Smoke",
      "Dedicated Transport",
      "Transport",
      "Vehicle",
      "Faction: Adeptus Astartes",
      "Rhino",
      "Frame"
    ],
    "sourceName": "OpenHammer API · BSData Warhammer 40,000 11th Edition",
    "sourceUrl": "https://github.com/EshanPrakash/openhammer-api",
    "verificationStatus": "community-reference",
    "officialRulesCrossCheck": "pending"
  }
});
