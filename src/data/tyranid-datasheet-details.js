/**
 * Limited Tyranid datasheet details transcribed from 40k.app on 2026-10-12.
 * These entries are source-reviewed secondary-reference data, not a claim of
 * independent official GW verification. Keep source and review status attached.
 */
const REVIEWED_AT = "2026-10-12";

export const TYRANID_DATASHEET_DETAILS = Object.freeze({
  "tyranids:tyranid-prime-with-lash-whip": Object.freeze({
    characteristics: Object.freeze({
      Move: '10"',
      Toughness: 5,
      Save: "3+",
      Wounds: 6,
      Leadership: "7+",
      "Objective Control": 1
    }),
    keywords: Object.freeze(["Character", "Great Devourer", "Infantry", "Synapse", "Tyranid Prime with Lash Whip"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Lash whip", range: "Melee", attacks: 8, skill: "2+", strength: 4, ap: -2, damage: 1, abilities: "Extra Attacks" }),
      Object.freeze({ name: "Rending claw", range: "Melee", attacks: 4, skill: "2+", strength: 8, ap: -2, damage: 3 }),
      Object.freeze({ name: "Scything talons", range: "Melee", attacks: 6, skill: "2+", strength: 6, ap: -2, damage: 2 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Leader", description: "Can lead the datasheet-listed eligible Bodyguard units." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Alpha Warrior", description: "Weapons equipped by models in this model's unit have Sustained Hits 1." }),
      Object.freeze({ name: "Aggressive Leader-beast", description: "In your opponent's Shooting phase, when an enemy unit has shot, if a model in this unit was destroyed by those attacks, this unit can make a surge move of up to D6 inches." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 75,
    pointsOptions: Object.freeze([{ models: 1, points: 75, condition: "1 model" }]),
    dataSource: Object.freeze({
      status: "source-reviewed",
      sourceName: "Games Workshop Tyranids Faction Pack v1.0 (11th edition; Tyranid Prime with Lash Whip datasheet)",
      sourceUrl: "https://assets.warhammer-community.com/eng_09-06_warhammer40000_faction_pack_tyranids-avhhzmcte8-j0kseag7td.pdf",
      additionalSources: Object.freeze(["https://www.40k.app/factions/tyranids/units/tyranid-prime-with-lash-whip"]),
      pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT,
      officialRulesCrossCheck: "verified"
    })
  }),
  "tyranids:raveners": Object.freeze({
    characteristics: Object.freeze({
      Move: '10"',
      Toughness: 5,
      Save: "4+",
      Wounds: 3,
      Leadership: "8+",
      "Objective Control": 1
    }),
    keywords: Object.freeze(["Burrower", "Great Devourer", "Infantry", "Raveners", "Vanguard Invader"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Ravener claws and talons", range: "Melee", attacks: 3, skill: "3+", strength: 5, ap: -2, damage: 2, abilities: "Twin-linked" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deep Strike", description: "During an ingress move, if every model in this unit has Deep Strike, it can be set up anywhere on the battlefield more than 8 inches horizontally from all enemy units, including within the opponent's deployment zone." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Death From Below", description: "At the end of your opponent's turn, if this unit is not within Engagement Range of one or more enemy units, you can remove it from the battlefield and place it into Strategic Reserves." })
    ]),
    defaultModelCount: 5,
    defaultPoints: 125,
    pointsOptions: Object.freeze([
      Object.freeze({ models: 5, points: 125, condition: "1st or 2nd Raveners unit in the army" }),
      Object.freeze({ models: 5, points: 135, condition: "3rd or later Raveners unit in the army (+10 points)" })
    ]),
    dataSource: Object.freeze({
      status: "source-reviewed",
      sourceName: "Games Workshop Tyranids Faction Pack v1.0 (11th edition; Raveners datasheet)",
      sourceUrl: "https://assets.warhammer-community.com/eng_09-06_warhammer40000_faction_pack_tyranids-avhhzmcte8-j0kseag7td.pdf",
      additionalSources: Object.freeze(["https://www.40k.app/factions/tyranids/units/raveners"]),
      pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT,
      officialRulesCrossCheck: "verified"
    })
  }),
  "tyranids:hive-tyrant": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 10, Save: "2+", Wounds: 10, Leadership: "7+", "Objective Control": 3, "Invulnerable save": "4+" }),
    keywords: Object.freeze(["Character", "Great Devourer", "Hive Tyrant", "Monster", "Psyker", "Synapse"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Monstrous bonesword and lash whip", equipment: "Default", range: "Melee", attacks: 6, skill: "2+", strength: 9, ap: -2, damage: 3, abilities: "Twin-linked" }),
      Object.freeze({ name: "Monstrous scything talons", equipment: "Default", range: "Melee", attacks: 4, skill: "2+", strength: 7, ap: -2, damage: 2, abilities: "Extra Attacks" }),
      Object.freeze({ name: "Heavy venom cannon", equipment: "Wargear option", range: '36"', attacks: "D3", skill: "2+", strength: 9, ap: -2, damage: 3, abilities: "Blast" }),
      Object.freeze({ name: "Stranglethorn cannon", equipment: "Wargear option", range: '36"', attacks: "D6+1", skill: "2+", strength: 7, ap: -1, damage: 2, abilities: "Blast" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Leader", description: "Can lead Tyrant Guard, according to the reviewed datasheet listing." }),
      Object.freeze({ name: "Deadly Demise D3", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D3 mortal wounds; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Will of the Hive Mind", description: "Once per battle round, one model from your army with this ability can use it when a friendly Tyranids unit within 12 inches of that model is targeted with a Stratagem. If it does, reduce the CP cost of that use of that Stratagem by 1CP." }),
      Object.freeze({ name: "Onslaught (Aura, Psychic)", description: "While a friendly TYRANIDS unit is within 6 inches of this model, ranged weapons equipped by models in that unit have the Assault and Lethal Hits abilities." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 195,
    pointsOptions: Object.freeze([{ models: 1, points: 195, condition: "1 model" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Hive Tyrant datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/hive-tyrant", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:neurotyrant": Object.freeze({
    characteristics: Object.freeze({ Move: '6"', Toughness: 8, Save: "4+", Wounds: 9, Leadership: "7+", "Objective Control": 3, "Invulnerable save": "4+" }),
    keywords: Object.freeze(["Character", "Fly", "Great Devourer", "Monster", "Neurotyrant", "Psyker", "Synapse"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Psychic scream", equipment: "Default", range: '18"', attacks: "2D6", skill: "—", strength: 5, ap: -1, damage: 2, abilities: "Psychic, Torrent, Ignores Cover" }),
      Object.freeze({ name: "Neurotyrant claws and lashes", equipment: "Default", range: "Melee", attacks: 6, skill: "3+", strength: 5, ap: 0, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Leader", description: "Can lead Neurogaunts, Tyrant Guard, or Zoanthropes, according to the reviewed datasheet listing." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Node Lash (Psychic)", description: "While this model is leading a unit, each time a model in that unit makes an attack, add 1 to the Hit roll. If the target is Battle-shocked, add 1 to the Wound roll as well." }),
      Object.freeze({ name: "Psychic Terror (Psychic)", description: "When this model is on the battlefield as Shadow in the Warp is unleashed, subtract 1 from the resulting enemy Battle-shock tests." }),
      Object.freeze({ name: "Neuroloids", description: "In your Command phase, you can select up to two friendly TYRANIDS units within 18 inches of this model’s unit. Until the start of your next Command phase, the selected units are always considered to be within Synapse Range of your army." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 120,
    pointsOptions: Object.freeze([{ models: 1, points: 120, condition: "1 model" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Neurotyrant datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/neurotyrant", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:tyrant-guard": Object.freeze({
    characteristics: Object.freeze({ Move: '6"', Toughness: 8, Save: "3+", Wounds: 4, Leadership: "8+", "Objective Control": 1 }),
    keywords: Object.freeze(["Great Devourer", "Infantry", "Tyrant Guard"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Scything talons and rending claws", equipment: "Default", range: "Melee", attacks: 5, skill: "3+", strength: 5, ap: -1, damage: 1 }),
      Object.freeze({ name: "Bone cleaver, lash whip and rending claws", equipment: "Wargear option", range: "Melee", attacks: 3, skill: "3+", strength: 5, ap: -1, damage: 2 }),
      Object.freeze({ name: "Crushing claws and rending claws", equipment: "Wargear option", range: "Melee", attacks: 2, skill: "4+", strength: 8, ap: -2, damage: 2, abilities: "Twin-linked" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Leader compatibility", description: "The reviewed datasheet listing allows Hive Tyrant, Neurotyrant, and The Swarmlord to lead this unit." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Guardian Organism", description: "While a CHARACTER model is leading this unit, that CHARACTER model has Feel No Pain 5+." })
    ]),
    defaultModelCount: 3,
    defaultPoints: 80,
    pointsOptions: Object.freeze([{ models: 3, points: 80 }, { models: 6, points: 170 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Tyrant Guard datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/tyrant-guard", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:broodlord": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 5, Save: "4+", Wounds: 6, Leadership: "7+", "Objective Control": 1, "Invulnerable save": "4+" }),
    keywords: Object.freeze(["Broodlord", "Character", "Great Devourer", "Infantry", "Psyker", "Synapse", "Vanguard Invader"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Broodlord claws and talons", equipment: "Default", range: "Melee", attacks: 5, skill: "2+", strength: 6, ap: -2, damage: 2, abilities: "Devastating Wounds, Twin-linked" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Leader", description: "Can lead Genestealers, according to the reviewed datasheet listing." }),
      Object.freeze({ name: "Scouts 8 inches", description: "This unit has the Scouts 8 inches ability." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Vicious Insight", description: "While leading a unit, weapons equipped by models in that unit have Devastating Wounds." }),
      Object.freeze({ name: "Hypnotic Gaze", description: "At the start of the Fight phase, select one enemy unit within Engagement Range; subtract 1 from its models' Hit rolls for the phase." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 80,
    pointsOptions: Object.freeze([{ models: 1, points: 80 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Broodlord datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/broodlord", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:old-one-eye": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 9, Save: "2+", Wounds: 9, Leadership: "8+", "Objective Control": 3 }),
    keywords: Object.freeze(["Character", "Epic Hero", "Great Devourer", "Monster", "Old One Eye"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Old One Eye's claws and talons (strike)", equipment: "Default", range: "Melee", attacks: 6, skill: "3+", strength: 14, ap: -3, damage: "D6+1" }),
      Object.freeze({ name: "Old One Eye's claws and talons (sweep)", equipment: "Default", range: "Melee", attacks: 12, skill: "3+", strength: 6, ap: -1, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Leader", description: "Can lead Carnifexes, according to the reviewed datasheet listing." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Alpha Leader", description: "While leading a unit, each time a model in that unit makes an attack, you can re-roll the Hit roll." }),
      Object.freeze({ name: "Unstoppable Monster", description: "At the start of each player's Command phase, this model regains up to D3 lost wounds." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 130,
    pointsOptions: Object.freeze([{ models: 1, points: 130 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Old One Eye datasheet", sourceUrl: "https://www.40k.app/879/factions/tyranids/units/old-one-eye", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:carnifexes": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 9, Save: "2+", Wounds: 8, Leadership: "8+", "Objective Control": 3 }),
    keywords: Object.freeze(["Carnifexes", "Great Devourer", "Monster"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Carnifex scything talons", equipment: "Default", range: "Melee", attacks: 6, skill: "4+", strength: 9, ap: -2, damage: 3 }),
      Object.freeze({ name: "Carnifex crushing claws", equipment: "Wargear option", range: "Melee", attacks: 4, skill: "4+", strength: 12, ap: -3, damage: "D6+1" }),
      Object.freeze({ name: "Carnifex extra scything talons", equipment: "Default", range: "Melee", attacks: 2, skill: "4+", strength: 9, ap: -2, damage: 3, abilities: "Extra Attacks" }),
      Object.freeze({ name: "Chitinous claws and teeth", equipment: "Default", range: "Melee", attacks: 4, skill: "4+", strength: 6, ap: 0, damage: 1 }),
      Object.freeze({ name: "Bio-plasma", equipment: "Wargear option", range: '12"', attacks: "D3", skill: "4+", strength: 7, ap: -2, damage: 1, abilities: "Assault, Blast" }),
      Object.freeze({ name: "Heavy venom cannon", equipment: "Wargear option", range: '36"', attacks: "D3", skill: "4+", strength: 9, ap: -2, damage: 3, abilities: "Blast" }),
      Object.freeze({ name: "Spine banks", equipment: "Default", range: '6"', attacks: 5, skill: "4+", strength: 5, ap: 0, damage: 1, abilities: "Assault" }),
      Object.freeze({ name: "Stranglethorn cannon", equipment: "Wargear option", range: '36"', attacks: "D6+1", skill: "4+", strength: 7, ap: -1, damage: 2, abilities: "Blast" }),
      Object.freeze({ name: "Deathspitters with slimer maggots", equipment: "Wargear option", range: '24"', attacks: 6, skill: "4+", strength: 7, ap: -2, damage: 1 }),
      Object.freeze({ name: "Devourers with brainleech worms", equipment: "Wargear option", range: '18"', attacks: 12, skill: "4+", strength: 6, ap: 0, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise 1", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers 1 mortal wound; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Blistering Assault", description: "In your opponent's Shooting phase, when an enemy unit has shot, if a model in this unit lost a wound as a result of those attacks, this unit can make a surge move of up to D6+2 inches." }),
      Object.freeze({ name: "Leader compatibility", description: "The reviewed datasheet listing allows Old One Eye to lead this unit." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 90,
    pointsOptions: Object.freeze([{ models: 1, points: 90 }, { models: 2, points: 180 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Carnifexes datasheet; current 11th-edition cross-check", sourceUrl: "https://www.40k.app/factions/tyranids/units/carnifexes", additionalSources: Object.freeze(["https://wh-rules.ru/factions/tyranids/datasheets/carnifexes"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:the-swarmlord": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 10, Save: "2+", Wounds: 10, Leadership: "7+", "Objective Control": 3, "Invulnerable save": "4+" }),
    keywords: Object.freeze(["Character", "Epic Hero", "Great Devourer", "Hive Tyrant", "Monster", "Psyker", "Synapse", "The Swarmlord"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Synaptic pulse", equipment: "Default", range: '18"', attacks: "D6+3", skill: "—", strength: 5, ap: -1, damage: 2, abilities: "Psychic, Torrent" }),
      Object.freeze({ name: "Bone sabres", equipment: "Default", range: "Melee", attacks: 8, skill: "2+", strength: 9, ap: -2, damage: 3, abilities: "Twin-linked" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Leader", description: "Can lead Tyrant Guard, according to the reviewed datasheet listing." }),
      Object.freeze({ name: "Deadly Demise D3", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D3 mortal wounds; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Hive Commander", description: "At the start of your Command phase, if this model is on the battlefield, you gain 1CP." }),
      Object.freeze({ name: "Malign Presence", description: "Once per turn, when your opponent targets a unit from their army within 12 inches of this model with a Stratagem, increase the CP cost of that use of that Stratagem by 1CP." }),
      Object.freeze({ name: "Domination of the Hive Mind", description: "While a friendly Tyranids unit is within 9 inches of this model, that unit is within your army's Synapse Range." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 210,
    pointsOptions: Object.freeze([{ models: 1, points: 210 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app The Swarmlord datasheet", sourceUrl: "https://www.40k.app/879/factions/tyranids/units/the-swarmlord", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:neurogaunts": Object.freeze({
    characteristics: Object.freeze({ Move: '6"', Toughness: 3, Save: "6+", Wounds: 1, Leadership: "8+", "Objective Control": 1 }),
    keywords: Object.freeze(["Endless Multitude", "Great Devourer", "Infantry", "Neurogaunts"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Chitinous claws and teeth", equipment: "Default", range: "Melee", attacks: 1, skill: "4+", strength: 3, ap: 0, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Neurocytes", description: "While this unit is within Synapse Range of a friendly Tyranids unit (excluding Neurogaunt units), it has the Synapse keyword." }),
      Object.freeze({ name: "Leader compatibility", description: "The reviewed datasheet listing allows a Neurotyrant to lead this unit." })
    ]),
    defaultModelCount: 11,
    defaultPoints: 45,
    pointsOptions: Object.freeze([{ models: 11, points: 45 }, { models: 22, points: 90 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Neurogaunts datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/neurogaunts", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:zoanthropes": Object.freeze({
    characteristics: Object.freeze({ Move: '5"', Toughness: 5, Save: "5+", Wounds: 3, Leadership: "7+", "Objective Control": 1, "Invulnerable save": "4+" }),
    keywords: Object.freeze(["Fly", "Great Devourer", "Infantry", "Psyker", "Synapse", "Zoanthropes"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Warp Blast (witchfire)", equipment: "Default", range: '24"', attacks: "D3", skill: "3+", strength: 7, ap: -2, damage: "D3", abilities: "Blast, Psychic" }),
      Object.freeze({ name: "Warp Blast (focused witchfire)", equipment: "Default", range: '24"', attacks: 1, skill: "3+", strength: 12, ap: -3, damage: "D6+1", abilities: "Lethal Hits, Psychic" }),
      Object.freeze({ name: "Chitinous claws and teeth", equipment: "Default", range: "Melee", attacks: 2, skill: "5+", strength: 3, ap: 0, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Spirit Leech (Aura, Psychic)", description: "While an enemy unit is within 6 inches of this unit, if this unit contains a Neurothrope, each time that enemy unit fails a Battle-shock test, it suffers D3 mortal wounds and one model in this unit regains up to D3 lost wounds." }),
      Object.freeze({ name: "Warp Field (Aura, Psychic)", description: "While a friendly Tyranids unit is within 6 inches of this unit, models in that unit have a 6+ invulnerable save." }),
      Object.freeze({ name: "Leader compatibility", description: "The reviewed datasheet listing allows a Neurotyrant to lead this unit." })
    ]),
    defaultModelCount: 3,
    defaultPoints: 90,
    pointsOptions: Object.freeze([{ models: 3, points: 90 }, { models: 6, points: 190 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Zoanthropes datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/unit/zoanthropes", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:termagants": Object.freeze({
    characteristics: Object.freeze({ Move: '6"', Toughness: 3, Save: "5+", Wounds: 1, Leadership: "8+", "Objective Control": 2 }),
    keywords: Object.freeze(["Battleline", "Endless Multitude", "Great Devourer", "Infantry", "Termagants"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Fleshborer", equipment: "Default", range: '18"', attacks: 1, skill: "4+", strength: 5, ap: 0, damage: 1, abilities: "Assault" }),
      Object.freeze({ name: "Chitinous claws and teeth", equipment: "Default", range: "Melee", attacks: 1, skill: "4+", strength: 3, ap: 0, damage: 1 }),
      Object.freeze({ name: "Termagant devourer", equipment: "Wargear option", range: '18"', attacks: 2, skill: "4+", strength: 4, ap: 0, damage: 1 }),
      Object.freeze({ name: "Termagant spinefists", equipment: "Wargear option", range: '12"', attacks: 2, skill: "4+", strength: 4, ap: 0, damage: 1, abilities: "Assault, Pistol, Twin-linked" }),
      Object.freeze({ name: "Shardlauncher", equipment: "Wargear option", range: '18"', attacks: "D3", skill: "4+", strength: 5, ap: 0, damage: 1, abilities: "Blast, Heavy" }),
      Object.freeze({ name: "Spike rifle", equipment: "Wargear option", range: '24"', attacks: 1, skill: "4+", strength: 4, ap: -1, damage: 1, abilities: "Heavy" }),
      Object.freeze({ name: "Strangleweb", equipment: "Wargear option", range: '18"', attacks: "D6", skill: "—", strength: 2, ap: 0, damage: 1, abilities: "Assault, Devastating Wounds, Torrent" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Skulking Horrors", description: "In your opponent's Movement phase, if an enemy unit ends a move within 8 inches of this unit, if this unit is not within Engagement Range of one or more enemy units, this unit can make a Normal move of up to D6 inches." }),
      Object.freeze({ name: "Leader compatibility", description: "The reviewed datasheet listing allows a Tyranid Prime with Lash Whip to lead this unit." })
    ]),
    defaultModelCount: 10,
    defaultPoints: 55,
    pointsOptions: Object.freeze([{ models: 10, points: 55 }, { models: 20, points: 110 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Termagants datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/termagants", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  })
  ,
  "tyranids:winged-hive-tyrant": Object.freeze({
    characteristics: Object.freeze({ Move: '12"', Toughness: 9, Save: "2+", Wounds: 10, Leadership: "7+", "Objective Control": 3, "Invulnerable save": "4+" }),
    keywords: Object.freeze(["Character", "Fly", "Great Devourer", "Hive Tyrant", "Monster", "Psyker", "Synapse", "Vanguard Invader", "Winged Hive Tyrant"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Monstrous bonesword and lash whip", equipment: "Default", range: "Melee", attacks: 6, skill: "2+", strength: 9, ap: -2, damage: 3, abilities: "Twin-linked" }),
      Object.freeze({ name: "Tyrant talons", equipment: "Default", range: "Melee", attacks: 5, skill: "2+", strength: 7, ap: -2, damage: 2 }),
      Object.freeze({ name: "Monstrous scything talons", equipment: "Wargear option", range: "Melee", attacks: 4, skill: "2+", strength: 7, ap: -2, damage: 2, abilities: "Extra Attacks" }),
      Object.freeze({ name: "Heavy venom cannon", equipment: "Wargear option", range: '36"', attacks: "D3", skill: "2+", strength: 9, ap: -2, damage: 3, abilities: "Blast" }),
      Object.freeze({ name: "Stranglethorn cannon", equipment: "Wargear option", range: '36"', attacks: "D6+1", skill: "2+", strength: 7, ap: -1, damage: 2, abilities: "Blast" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise D3", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D3 mortal wounds; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Deep Strike", description: "During an ingress move, if every model in this unit has Deep Strike, it can be set up anywhere on the battlefield more than 8 inches horizontally from all enemy units, including within the opponent's deployment zone." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Will of the Hive Mind", description: "Once per battle round, one model from your army with this ability can use it when a friendly Tyranids unit within 12 inches of that model is targeted with a Stratagem. If it does, reduce the CP cost of that use of that Stratagem by 1CP." }),
      Object.freeze({ name: "Paroxysm", description: "At the start of the Fight phase, select one visible enemy unit within 12 inches and roll a D6; on 2+, subtract 1 from the Attacks characteristic of its weapons for the phase; on a 1, this Psyker suffers D3 mortal wounds." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 185,
    pointsOptions: Object.freeze([{ models: 1, points: 185, condition: "1 model" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Winged Hive Tyrant datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/winged-hive-tyrant", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:lictor": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 6, Save: "4+", Wounds: 6, Leadership: "7+", "Objective Control": 1 }),
    keywords: Object.freeze(["Great Devourer", "Infantry", "Lictor", "Vanguard Invader"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Lictor claws and talons", equipment: "Default", range: "Melee", attacks: 6, skill: "2+", strength: 7, ap: -2, damage: 2, abilities: "Precision" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Fights First", description: "This unit is eligible to fight in the Fights First step." }),
      Object.freeze({ name: "Infiltrators", description: "During deployment, if every model in this unit has Infiltrators, it can be set up anywhere on the battlefield more than 8 inches horizontally from the opponent’s deployment zone and all enemy units." }),
      Object.freeze({ name: "Lone Operative", description: "Unless this unit is part of an attached unit, enemy models cannot see it unless they are within 12 inches. It also cannot be targeted by Indirect Fire weapons unless the attacking model is within 12 inches." }),
      Object.freeze({ name: "Stealth", description: "If every model in this unit has Stealth, ranged attacks targeting the unit grant it the benefit of cover against those attacks." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Feeder Tendrils", description: "Each time this model destroys an enemy Character model, you gain 1CP." }),
      Object.freeze({ name: "Pheromone Trail", description: "Once per battle round, this model can be targeted with Rapid Ingress for 0CP." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 60,
    pointsOptions: Object.freeze([{ models: 1, points: 60, condition: "1 model" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Lictor datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/lictor", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:deathleaper": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 6, Save: "3+", Wounds: 7, Leadership: "7+", "Objective Control": 1, "Invulnerable save": "4+" }),
    keywords: Object.freeze(["Character", "Deathleaper", "Epic Hero", "Great Devourer", "Infantry", "Vanguard Invader"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Lictor claws and talons", equipment: "Default", range: "Melee", attacks: 6, skill: "2+", strength: 7, ap: -2, damage: 2, abilities: "Precision" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Fights First", description: "This unit is eligible to fight in the Fights First step." }),
      Object.freeze({ name: "Infiltrators", description: "During deployment, if every model in this unit has Infiltrators, it can be set up anywhere on the battlefield more than 8 inches horizontally from the opponent’s deployment zone and all enemy units." }),
      Object.freeze({ name: "Lone Operative", description: "Unless this unit is part of an attached unit, enemy models cannot see it unless they are within 12 inches. It also cannot be targeted by Indirect Fire weapons unless the attacking model is within 12 inches." }),
      Object.freeze({ name: "Stealth", description: "If every model in this unit has Stealth, ranged attacks targeting the unit grant it the benefit of cover against those attacks." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Feeder Tendrils", description: "Each time this model destroys an enemy Character model, you gain 1CP." }),
      Object.freeze({ name: "Fear of the Unseen (Aura)", description: "While an enemy unit is within 6 inches of this model, worsen the Leadership characteristic of models in that unit by 1. In the Battle-shock step of your opponent's Command phase, if such an enemy unit is below its Starting Strength, it must take a Battle-shock test." }),

    ]),
    defaultModelCount: 1,
    defaultPoints: 80,
    pointsOptions: Object.freeze([{ models: 1, points: 80, condition: "1 model" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Deathleaper datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/deathleaper", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:tervigon": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 11, Save: "2+", Wounds: 16, Leadership: "7+", "Objective Control": 5 }),
    keywords: Object.freeze(["Character", "Great Devourer", "Monster", "Psyker", "Synapse", "Tervigon"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Stinger salvoes", equipment: "Default", range: '24"', attacks: 8, skill: "3+", strength: 5, ap: 0, damage: 1 }),
      Object.freeze({ name: "Massive scything talons (strike)", equipment: "Default", range: "Melee", attacks: 4, skill: "3+", strength: 9, ap: -2, damage: "D6" }),
      Object.freeze({ name: "Massive scything talons (sweep)", equipment: "Default", range: "Melee", attacks: 8, skill: "3+", strength: 7, ap: -1, damage: 2 }),
      Object.freeze({ name: "Massive crushing claws", equipment: "Wargear option", range: "Melee", attacks: 4, skill: "4+", strength: 12, ap: -3, damage: "D6+1" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Damaged: 1-5 Wounds Remaining", description: "While this model has 1-5 wounds remaining, each time this model makes an attack, subtract 1 from the Hit roll." }),
      Object.freeze({ name: "Deadly Demise D6", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D6 mortal wounds; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Spawn Termagants", description: "In your Command phase, you can select one friendly Termagants unit within 6 inches of this model and return up to D3+3 destroyed models to that unit. A Termagants unit cannot be selected for this ability more than once per phase." }),
      Object.freeze({ name: "Brood Progenitor (Aura, Psychic)", description: "While a friendly Termagants unit is within 6 inches of this model, ranged weapons equipped by models in that unit have the Lethal Hits ability." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 150,
    pointsOptions: Object.freeze([{ models: 1, points: 150, condition: "1 model" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Tervigon datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/tervigon", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:tyrannofex": Object.freeze({
    characteristics: Object.freeze({ Move: '9"', Toughness: 12, Save: "2+", Wounds: 16, Leadership: "8+", "Objective Control": 5 }),
    keywords: Object.freeze(["Frame", "Great Devourer", "Monster", "Tyrannofex"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Fleshborer hive", equipment: "Default", range: '24"', attacks: 20, skill: "3+", strength: 5, ap: 0, damage: 1, abilities: "Heavy, Sustained Hits 1, Twin-linked" }),
      Object.freeze({ name: "Stinger salvoes", equipment: "Default", range: '24"', attacks: 8, skill: "3+", strength: 5, ap: 0, damage: 1 }),
      Object.freeze({ name: "Powerful limbs", equipment: "Default", range: "Melee", attacks: 4, skill: "3+", strength: 8, ap: 0, damage: 2 }),
      Object.freeze({ name: "Acid spray", equipment: "Wargear option", range: '18"', attacks: "D6+6", skill: "—", strength: 6, ap: -2, damage: 2, abilities: "Torrent" }),
      Object.freeze({ name: "Rupture cannon", equipment: "Wargear option", range: '48"', attacks: 2, skill: "3+", strength: 18, ap: -4, damage: "D6+6", abilities: "Heavy" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Damaged: 1-5 Wounds Remaining", description: "While this model has 1-5 wounds remaining, each time this model makes an attack, subtract 1 from the Hit roll." }),
      Object.freeze({ name: "Deadly Demise D6", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D6 mortal wounds; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Resilient Organism", description: "Once per battle, when an attack is allocated to this model, change that attack's Damage characteristic to 0." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 170,
    pointsOptions: Object.freeze([
      Object.freeze({ models: 1, points: 170, condition: "1st–2nd Tyrannofex; base cost" }),
      Object.freeze({ models: 1, points: 180, condition: "1st–2nd Tyrannofex with Acid Spray (+10 points)" }),
      Object.freeze({ models: 1, points: 190, condition: "1st–2nd Tyrannofex with Rupture Cannon (+20 points)" }),
      Object.freeze({ models: 1, points: 180, condition: "3rd+ Tyrannofex; base cost (+10 points)" }),
      Object.freeze({ models: 1, points: 190, condition: "3rd+ Tyrannofex with Acid Spray (+20 points total)" }),
      Object.freeze({ models: 1, points: 200, condition: "3rd+ Tyrannofex with Rupture Cannon (+30 points total)" })
    ]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Tyrannofex datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/tyrannofex", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:tyranid-warriors-with-ranged-bio-weapons": Object.freeze({
    characteristics: Object.freeze({ Move: '6"', Toughness: 5, Save: "4+", Wounds: 3, Leadership: "7+", "Objective Control": 2 }),
    keywords: Object.freeze(["Great Devourer", "Infantry", "Synapse", "Tyranid Warriors with Ranged Bio-Weapons"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Barbed strangler", equipment: "Wargear option", range: '36"', attacks: "D6+1", skill: "4+", strength: 6, ap: -1, damage: 1, abilities: "Blast" }),
      Object.freeze({ name: "Deathspitter", equipment: "Wargear option", range: '24"', attacks: 3, skill: "4+", strength: 5, ap: -1, damage: 1 }),
      Object.freeze({ name: "Devourer", equipment: "Default", range: '18"', attacks: 5, skill: "4+", strength: 4, ap: 0, damage: 1 }),
      Object.freeze({ name: "Spinefists", equipment: "Wargear option", range: '12"', attacks: 2, skill: "4+", strength: 4, ap: 0, damage: 1, abilities: "Assault, Pistol, Twin-linked" }),
      Object.freeze({ name: "Venom cannon", equipment: "Wargear option", range: '36"', attacks: "D3", skill: "4+", strength: 9, ap: -2, damage: 2, abilities: "Blast" }),
      Object.freeze({ name: "Tyranid Warrior claws and talons", equipment: "Default", range: "Melee", attacks: 5, skill: "3+", strength: 5, ap: -1, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Adaptable Predators", description: "This unit is eligible to shoot and declare a charge in a turn in which it Fell Back." })
    ]),
    defaultModelCount: 3,
    defaultPoints: 60,
    pointsOptions: Object.freeze([{ models: 3, points: 60 }, { models: 6, points: 120 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Tyranid Warriors with Ranged Bio-weapons datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/tyranid-warriors-with-ranged-bio-weapons", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  })
  ,
  "tyranids:barbgaunts": Object.freeze({
    characteristics: Object.freeze({ Move: '6"', Toughness: 4, Save: "4+", Wounds: 2, Leadership: "8+", "Objective Control": 1 }),
    keywords: Object.freeze(["Barbgaunts", "Great Devourer", "Infantry"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Barblauncher", equipment: "Default", range: '24"', attacks: "D6", skill: "4+", strength: 5, ap: 0, damage: 1, abilities: "Blast, Heavy" }),
      Object.freeze({ name: "Chitinous claws and teeth", equipment: "Default", range: "Melee", attacks: 1, skill: "4+", strength: 4, ap: 0, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Disruption Bombardment", description: "After this unit shoots, select an enemy Infantry unit hit; until the end of the opponent's next turn, subtract 2 from its Move and from its Advance and Charge rolls." })
    ]),
    defaultModelCount: 5, defaultPoints: 50,
    pointsOptions: Object.freeze([{ models: 5, points: 50 }, { models: 10, points: 100 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Barbgaunts datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/barbgaunts", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:biovores": Object.freeze({
    characteristics: Object.freeze({ Move: '5"', Toughness: 6, Save: "3+", Wounds: 5, Leadership: "8+", "Objective Control": 1 }),
    keywords: Object.freeze(["Biovores", "Great Devourer", "Infantry"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Spore Mine launcher", equipment: "Default", range: '48"', attacks: "D3", skill: "4+", strength: 6, ap: -1, damage: 2, abilities: "Blast, Devastating Wounds, Heavy, Indirect Fire" }),
      Object.freeze({ name: "Chitin-barbed limbs", equipment: "Default", range: "Melee", attacks: 2, skill: "4+", strength: 5, ap: 0, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise 1", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers 1 mortal wound; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Seed Spore Mines", description: "Once per turn in your Shooting phase, this unit can forgo ranged attacks to add one Spore Mines unit with one model per model in this unit, set up wholly within 48 inches and more than 8 inches from enemy units." })
    ]),
    defaultModelCount: 1, defaultPoints: 60,
    pointsOptions: Object.freeze([{ models: 1, points: 60 }, { models: 2, points: 100 }, { models: 3, points: 140 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Biovores datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/biovores", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:hive-guard": Object.freeze({
    characteristics: Object.freeze({ Move: '6"', Toughness: 7, Save: "3+", Wounds: 4, Leadership: "8+", "Objective Control": 1 }),
    keywords: Object.freeze(["Great Devourer", "Hive Guard", "Infantry"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Shockcannon", equipment: "Default", range: '24"', attacks: 2, skill: "3+", strength: 7, ap: -1, damage: 3, abilities: "Anti-Vehicle 2+" }),
      Object.freeze({ name: "Impaler cannon", equipment: "Wargear option", range: '36"', attacks: 4, skill: "4+", strength: 5, ap: -1, damage: 1, abilities: "Heavy, Indirect Fire" }),
      Object.freeze({ name: "Chitinous claws and teeth", equipment: "Default", range: "Melee", attacks: 3, skill: "4+", strength: 5, ap: 0, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Defensive Stance", description: "When targeted with Fire Overwatch, unmodified Hit rolls of 5+ score hits, or 4+ instead while within range of an objective marker you control." })
    ]),
    defaultModelCount: 3, defaultPoints: 80,
    pointsOptions: Object.freeze([{ models: 3, points: 80 }, { models: 6, points: 160 }, { models: 3, points: 90, condition: "3rd+ Hive Guard unit in army (+10 points)" }, { models: 6, points: 170, condition: "3rd+ Hive Guard unit in army (+10 points)" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Hive Guard datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/hive-guard", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:neurolictor": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 5, Save: "4+", Wounds: 7, Leadership: "7+", "Objective Control": 1, "Invulnerable save": "4+" }),
    keywords: Object.freeze(["Great Devourer", "Infantry", "Neurolictor", "Synapse", "Vanguard Invader"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Piercing claws and talons", equipment: "Default", range: "Melee", attacks: 6, skill: "2+", strength: 6, ap: -2, damage: 1, abilities: "Precision" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Infiltrators", description: "During deployment, if every model in this unit has Infiltrators, it can be set up anywhere on the battlefield more than 8 inches horizontally from the opponent’s deployment zone and all enemy units." }),
      Object.freeze({ name: "Lone Operative", description: "Unless this unit is part of an attached unit, enemy models cannot see it unless they are within 12 inches. It also cannot be targeted by Indirect Fire weapons unless the attacking model is within 12 inches." }),
      Object.freeze({ name: "Stealth", description: "If every model in this unit has Stealth, ranged attacks targeting the unit grant it the benefit of cover against those attacks." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Feeder Tendrils", description: "Each time this model destroys an enemy Character model, you gain 1CP." }),
      Object.freeze({ name: "Neural Disruption", description: "In your Command phase, select one enemy unit within 12 inches of this model. That unit must take a Battle-shock test." }),
      Object.freeze({ name: "Psychological Saboteur (Aura)", description: "While an enemy unit is within 12 inches of this model, if that unit is Battle-shocked, each time a model in that unit makes an attack, subtract 1 from the Hit roll, and each time a friendly TYRANIDS model makes an attack that targets that unit, add 1 to the Wound roll." })
    ]),
    defaultModelCount: 1, defaultPoints: 80,
    pointsOptions: Object.freeze([{ models: 1, points: 80 }, { models: 1, points: 90, condition: "3rd+ Neurolictor in army (+10 points)" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Neurolictor datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/neurolictor", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:pyrovores": Object.freeze({
    characteristics: Object.freeze({ Move: '5"', Toughness: 6, Save: "3+", Wounds: 5, Leadership: "8+", "Objective Control": 1 }),
    keywords: Object.freeze(["Great Devourer", "Harvester", "Infantry", "Pyrovores"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Flamespurt", equipment: "Default", range: '12"', attacks: "D6+1", skill: "—", strength: 6, ap: -1, damage: 1, abilities: "Ignores Cover, Torrent, Twin-linked" }),
      Object.freeze({ name: "Chitin-barbed limbs", equipment: "Default", range: "Melee", attacks: 2, skill: "4+", strength: 5, ap: 0, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise 1", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers 1 mortal wound; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Burning Spray", description: "After this unit shoots, select an enemy unit hit; until the end of the phase, that unit cannot have the Benefit of Cover." })
    ]),
    defaultModelCount: 1, defaultPoints: 40,
    pointsOptions: Object.freeze([
      Object.freeze({ models: 1, points: 40, condition: "1st–2nd Pyrovore unit in army" }),
      Object.freeze({ models: 2, points: 70, condition: "1st–2nd Pyrovore unit in army" }),
      Object.freeze({ models: 3, points: 100, condition: "1st–2nd Pyrovore unit in army" }),
      Object.freeze({ models: 1, points: 50, condition: "3rd+ Pyrovore unit in army (+10 points)" }),
      Object.freeze({ models: 2, points: 80, condition: "3rd+ Pyrovore unit in army (+10 points)" }),
      Object.freeze({ models: 3, points: 110, condition: "3rd+ Pyrovore unit in army (+10 points)" })
    ]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Pyrovores datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/pyrovores", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:von-ryan-s-leapers": Object.freeze({
    characteristics: Object.freeze({ Move: '10"', Toughness: 5, Save: "4+", Wounds: 3, Leadership: "8+", "Objective Control": 1, "Invulnerable save": "6+" }),
    keywords: Object.freeze(["Great Devourer", "Infantry", "Vanguard Invader", "Von Ryan's Leapers"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Leaper's talons", equipment: "Default", range: "Melee", attacks: 6, skill: "3+", strength: 5, ap: -1, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Fights First", description: "This unit is eligible to fight in the Fights First step." }),
      Object.freeze({ name: "Infiltrators", description: "During deployment, if every model in this unit has Infiltrators, it can be set up anywhere on the battlefield more than 8 inches horizontally from the opponent’s deployment zone and all enemy units." }),
      Object.freeze({ name: "Stealth", description: "If every model in this unit has Stealth, ranged attacks targeting the unit grant it the benefit of cover against those attacks." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Pouncing Leap", description: "This unit can be targeted with Heroic Intervention regardless of other uses this phase; that use costs 1 fewer CP and does not prevent uses on other units." })
    ]),
    defaultModelCount: 3, defaultPoints: 55,
    pointsOptions: Object.freeze([{ models: 3, points: 55 }, { models: 6, points: 105 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Von Ryan's Leapers datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/von-ryans-leapers", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:ripper-swarms": Object.freeze({
    characteristics: Object.freeze({ Move: '6"', Toughness: 2, Save: "6+", Wounds: 4, Leadership: "8+", "Objective Control": 0 }),
    keywords: Object.freeze(["Great Devourer", "Harvester", "Ripper Swarms", "Swarm"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Chitinous claws and teeth", equipment: "Default", range: "Melee", attacks: 6, skill: "5+", strength: 2, ap: 0, damage: 1, abilities: "Sustained Hits 1" }),
      Object.freeze({ name: "Spinemaws", equipment: "Wargear option", range: '6"', attacks: 4, skill: "5+", strength: 3, ap: 0, damage: 1, abilities: "Pistol" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deep Strike", description: "During an ingress move, if every model in this unit has Deep Strike, it can be set up anywhere on the battlefield more than 8 inches horizontally from all enemy units, including within the opponent's deployment zone." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Chitinous Horrors", description: "While an enemy unit is within Engagement Range of this unit, halve the Objective Control characteristic of models in that enemy unit." })
    ]),
    defaultModelCount: 1, defaultPoints: 30,
    pointsOptions: Object.freeze([{ models: 1, points: 30 }, { models: 2, points: 40 }, { models: 3, points: 50 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Ripper Swarms datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/ripper-swarms", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:parasite-of-mortrex": Object.freeze({
    characteristics: Object.freeze({ Move: '12"', Toughness: 5, Save: "4+", Wounds: 5, Leadership: "8+", "Objective Control": 1 }),
    keywords: Object.freeze(["Character", "Fly", "Great Devourer", "Infantry", "Parasite of Mortrex", "Synapse", "Vanguard Invader"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Barbed ovipositor", equipment: "Default", range: "Melee", attacks: 1, skill: "2+", strength: 3, ap: -2, damage: 3, abilities: "Anti-Infantry 3+, Extra Attacks" }),
      Object.freeze({ name: "Clawed limbs", equipment: "Default", range: "Melee", attacks: 6, skill: "2+", strength: 5, ap: -1, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deep Strike", description: "During an ingress move, if every model in this unit has Deep Strike, it can be set up anywhere on the battlefield more than 8 inches horizontally from all enemy units, including within the opponent's deployment zone." }),
      Object.freeze({ name: "Lone Operative", description: "Unless this unit is part of an attached unit, enemy models cannot see it unless they are within 12 inches. It also cannot be targeted by Indirect Fire weapons unless the attacking model is within 12 inches." }),
      Object.freeze({ name: "Stealth", description: "If every model in this unit has Stealth, ranged attacks targeting the unit grant it the benefit of cover against those attacks." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Parasitic Infection", description: "Each time an Infantry model is destroyed by an attack made with this model's barbed ovipositor, after this model has finished making its attacks, you can add one new Ripper Swarms unit to your army consisting of D3 models and set it up within 3 inches of this model. If you do, that Ripper Swarms unit can be set up within Engagement Range of the destroyed model's unit, but not within Engagement Range of any other enemy units." }),
      Object.freeze({ name: "It Itches!", description: "At the start of the Fight phase, select one enemy unit within Engagement Range; it must take a Battle-shock test." })
    ]),
    defaultModelCount: 1, defaultPoints: 65,
    pointsOptions: Object.freeze([{ models: 1, points: 65 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Parasite of Mortrex datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/parasite-of-mortrex", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:exocrine": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 10, Save: "3+", Wounds: 14, Leadership: "8+", "Objective Control": 4 }),
    keywords: Object.freeze(["Exocrine", "Great Devourer", "Monster"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Bio-plasmic cannon", equipment: "Default", range: '36"', attacks: "D6+3", skill: "3+", strength: 9, ap: -3, damage: 3, abilities: "Blast, Heavy" }),
      Object.freeze({ name: "Powerful limbs", equipment: "Default", range: "Melee", attacks: 3, skill: "3+", strength: 7, ap: 0, damage: 2 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Damaged: 1-5 Wounds Remaining", description: "While this model has 1-5 wounds remaining, each time this model makes an attack, subtract 1 from the Hit roll." }),
      Object.freeze({ name: "Deadly Demise D3", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D3 mortal wounds; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Symbiotic Targeting", description: "In your Shooting phase, after this model has shot, select one enemy unit hit by one or more of those attacks. Until the end of the phase, each time a friendly Tyranids model makes an attack that targets that unit, re-roll a Hit roll of 1." })
    ]),
    defaultModelCount: 1, defaultPoints: 135,
    pointsOptions: Object.freeze([{ models: 1, points: 135, condition: "1st–2nd Exocrine in army" }, { models: 1, points: 145, condition: "3rd+ Exocrine in army (+10 points)" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Exocrine datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/exocrine", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:haruspex": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 11, Save: "3+", Wounds: 14, Leadership: "8+", "Objective Control": 4 }),
    keywords: Object.freeze(["Great Devourer", "Haruspex", "Harvester", "Monster"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Grasping tongue", equipment: "Default", range: '12"', attacks: 1, skill: "3+", strength: 6, ap: -2, damage: "D6+1", abilities: "Precision" }),
      Object.freeze({ name: "Ravenous maw", equipment: "Default", range: "Melee", attacks: 14, skill: "3+", strength: 7, ap: -1, damage: 2 }),
      Object.freeze({ name: "Shovelling claws", equipment: "Default", range: "Melee", attacks: 4, skill: "3+", strength: 14, ap: -2, damage: "D6+1", abilities: "Extra Attacks" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Damaged: 1-5 Wounds Remaining", description: "While this model has 1-5 wounds remaining, each time this model makes an attack, subtract 1 from the Hit roll." }),
      Object.freeze({ name: "Deadly Demise D3", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D3 mortal wounds; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Grisly Spectacle", description: "Each time this model is selected to fight, after resolving its attacks, if one or more enemy units were destroyed by those attacks, each enemy unit within 6 inches of this model must take a Battle-shock test." })
    ]),
    defaultModelCount: 1, defaultPoints: 125,
    pointsOptions: Object.freeze([{ models: 1, points: 125 }, { models: 1, points: 135, condition: "3rd+ Haruspex in army (+10 points)" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Haruspex datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/haruspex", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:maleceptor": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 11, Save: "3+", Wounds: 14, Leadership: "7+", "Objective Control": 4, "Invulnerable save": "4+" }),
    keywords: Object.freeze(["Great Devourer", "Maleceptor", "Monster", "Psyker", "Synapse"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Psychic overload", equipment: "Default", range: '18"', attacks: "D6+3", skill: "3+", strength: 10, ap: -2, damage: 3, abilities: "Blast, Psychic" }),
      Object.freeze({ name: "Massive scything talons (strike)", equipment: "Default", range: "Melee", attacks: 3, skill: "3+", strength: 9, ap: -2, damage: "D6+1" }),
      Object.freeze({ name: "Massive scything talons (sweep)", equipment: "Default", range: "Melee", attacks: 6, skill: "3+", strength: 7, ap: -1, damage: 2 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Damaged: 1-5 Wounds Remaining", description: "While this model has 1-5 wounds remaining, each time this model makes an attack, subtract 1 from the Hit roll." }),
      Object.freeze({ name: "Deadly Demise D3", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D3 mortal wounds; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Encephalic Diffusion (Aura, Psychic)", description: "While an enemy unit is within 6 inches of this model, each time a model in that unit makes an attack, subtract 1 from the Hit roll, and, if that enemy unit is Below Half-strength, subtract 1 from the Wound roll as well." })
    ]),
    defaultModelCount: 1, defaultPoints: 180,
    pointsOptions: Object.freeze([{ models: 1, points: 180, condition: "1st–2nd Maleceptor in army" }, { models: 1, points: 190, condition: "3rd+ Maleceptor in army (+10 points)" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Maleceptor datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/maleceptor", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:psychophage": Object.freeze({
    characteristics: Object.freeze({ Move: '12"', Toughness: 9, Save: "3+", Wounds: 10, Leadership: "8+", "Objective Control": 3, "Feel No Pain": "5+" }),
    keywords: Object.freeze(["Great Devourer", "Harvester", "Monster", "Psychophage", "Smoke"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Psychoclastic torrent", equipment: "Default", range: '12"', attacks: "D6", skill: "—", strength: 6, ap: -1, damage: 1, abilities: "Ignores Cover, Torrent" }),
      Object.freeze({ name: "Talons and betentacled maw", equipment: "Default", range: "Melee", attacks: 6, skill: "3+", strength: 6, ap: -2, damage: 2, abilities: "Anti-Psyker 4+, Devastating Wounds" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise 1", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers 1 mortal wound; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Feel No Pain 5+", description: "Each time this model would lose a wound, roll one D6: on a 5+, that wound is not lost." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Bio-stimulus", description: "After this model shoots, select an enemy unit hit; until the end of the turn, friendly Tyranids melee attacks targeting it improve AP by 1. The same enemy unit can only be affected once per turn." }),
      Object.freeze({ name: "Feeding Frenzy", description: "Melee attacks targeting a unit below Starting Strength gain +1 to Hit; if the target is also Below Half-strength, they gain +1 to Wound." })
    ]),
    defaultModelCount: 1, defaultPoints: 110,
    pointsOptions: Object.freeze([{ models: 1, points: 110 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "Current 11th-edition Psychophage datasheet listing", sourceUrl: "https://wh-rules.ru/factions/tyranids/datasheets/psychophage", additionalSources: Object.freeze(["https://www.40k.app/factions/tyranids/units/psychophage"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  })
  ,
  "tyranids:the-red-terror": Object.freeze({
    characteristics: Object.freeze({ Move: '10"', Toughness: 8, Save: "3+", Wounds: 9, Leadership: "8+", "Objective Control": 3 }),
    keywords: Object.freeze(["Burrower", "Character", "Epic Hero", "Great Devourer", "Monster", "Mobile", "The Red Terror", "Vanguard Invader"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Gaping maw", equipment: "Default", range: "Melee", attacks: 1, skill: "2+", strength: 5, ap: "—", damage: "D3+2", abilities: "Extra Attacks, Devastating Wounds, Precision" }),
      Object.freeze({ name: "Scything talons", equipment: "Default", range: "Melee", attacks: 12, skill: "2+", strength: 7, ap: -2, damage: 2 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deep Strike", description: "During an ingress move, if every model in this unit has Deep Strike, it can be set up anywhere on the battlefield more than 8 inches horizontally from all enemy units, including within the opponent's deployment zone." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Swallow Whole", description: "Attacks with the gaping maw targeting Infantry, Mounted, or Beasts score Critical Wounds on successful unmodified Wound rolls; destroying such a model with the maw restores up to D3+2 lost wounds." }),
      Object.freeze({ name: "Subterranean Hunter", description: "At the end of the Fight phase, if this unit is not within Engagement Range of one or more enemy units, you can remove it from the battlefield and place it into Strategic Reserves." }),
      Object.freeze({ name: "Serpentine Fiend", description: "This model can move through terrain features, but cannot end a move within a wall, a floor, etc. This model can be set up or end a move on any floor level of Ruins, but if that level is not the ground floor, it can only do so if its base does not overhang the floor at that level." })
    ]),
    defaultModelCount: 1, defaultPoints: 120,
    pointsOptions: Object.freeze([{ models: 1, points: 120 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "Current 11th-edition The Red Terror datasheet listing", sourceUrl: "https://wh-rules.ru/factions/tyranids/datasheets/the-red-terror", additionalSources: Object.freeze(["https://assets.warhammer-community.com/eng_09-06_warhammer40000_faction_pack_tyranids-avhhzmcte8-j0kseag7td.pdf", "https://www.40k.app/factions/tyranids/units/the-red-terror"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:mucolid-spores": Object.freeze({
    characteristics: Object.freeze({ Move: '4"', Toughness: 4, Save: "7+", Wounds: 3, Leadership: "8+", "Objective Control": 0 }),
    keywords: Object.freeze(["Beast", "Fly", "Great Devourer", "Mucolid Spores"]),
    weapons: Object.freeze([]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deep Strike", description: "During an ingress move, if every model in this unit has Deep Strike, it can be set up anywhere on the battlefield more than 8 inches horizontally from all enemy units, including within the opponent's deployment zone." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Bio-minefield", description: "Enemy units cannot start or end an Advance move within 6 inches of this unit." }),
      Object.freeze({ name: "Floating Death", description: "Each time this unit or an enemy unit ends a move, for each model in this unit within 3 inches of one or more enemy units, select one of those enemy units. That model in this unit is destroyed, then roll one D6: on a 2–5, the selected enemy unit suffers D3 mortal wounds; on a 6, it suffers D6 mortal wounds." })
    ]),
    defaultModelCount: 1, defaultPoints: 30,
    pointsOptions: Object.freeze([{ models: 1, points: 30 }, { models: 2, points: 60 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Mucolid Spores datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/mucolid-spores", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:mawloc": Object.freeze({
    characteristics: Object.freeze({ Move: '10"', Toughness: 10, Save: "3+", Wounds: 14, Leadership: "8+", "Objective Control": 4 }),
    keywords: Object.freeze(["Great Devourer", "Mawloc", "Monster", "Vanguard Invader"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Distensible jaw", equipment: "Default", range: "Melee", attacks: 1, skill: "3+", strength: 5, ap: 0, damage: 3, abilities: "Anti-Infantry 4+, Devastating Wounds, Extra Attacks" }),
      Object.freeze({ name: "Mawloc scything talons", equipment: "Default", range: "Melee", attacks: 16, skill: "3+", strength: 8, ap: -2, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Damaged: 1-5 Wounds Remaining", description: "While this model has 1-5 wounds remaining, each time this model makes an attack, subtract 1 from the Hit roll." }),
      Object.freeze({ name: "Deep Strike", description: "During an ingress move, if every model in this unit has Deep Strike, it can be set up anywhere on the battlefield more than 8 inches horizontally from all enemy units, including within the opponent's deployment zone." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Terror From The Deep", description: "When this model is set up using Deep Strike, roll a D6 for each enemy unit within 12 inches: on 2–4 it suffers D3 mortal wounds; on 5+ it suffers 3 mortal wounds and must take a Battle-shock test." })
    ]),
    defaultModelCount: 1, defaultPoints: 130,
    pointsOptions: Object.freeze([{ models: 1, points: 130 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Mawloc datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/mawloc", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:norn-assimilator": Object.freeze({
    characteristics: Object.freeze({ Move: '10"', Toughness: 11, Save: "2+", Wounds: 16, Leadership: "7+", "Objective Control": 5 }),
    keywords: Object.freeze(["Great Devourer", "Harvester", "Monster", "Norn Assimilator", "Synapse"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Toxinjector Harpoon (ranged)", equipment: "Default", range: '12"', attacks: 2, skill: "2+", strength: 12, ap: -3, damage: "D6+1", abilities: "Harpooned" }),
      Object.freeze({ name: "Monstrous scything talons", equipment: "Default", range: "Melee", attacks: 6, skill: "2+", strength: 9, ap: -2, damage: 3 }),
      Object.freeze({ name: "Toxinjector Harpoon (melee)", equipment: "Default", range: "Melee", attacks: 4, skill: "2+", strength: 12, ap: -3, damage: "D6+1", abilities: "Extra Attacks" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Damaged: 1-5 Wounds Remaining", description: "While this model has 1-5 wounds remaining, each time this model makes an attack, subtract 1 from the Hit roll." }),
      Object.freeze({ name: "Deadly Demise D6", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D6 mortal wounds; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Singular Purpose", description: "At the start of the first battle round, select an enemy unit to re-roll Hit and Wound rolls against for the battle, or select an objective marker that grants this model Feel No Pain 5+ and Objective Control 15 while within range." }),
      Object.freeze({ name: "Harpoon Barbs", description: "Once per turn, when an enemy unit within Engagement Range of this model is selected to Fall Back, roll one D6: on a 2+, that unit suffers D6 mortal wounds." })
    ]),
    defaultModelCount: 1, defaultPoints: 250,
    pointsOptions: Object.freeze([{ models: 1, points: 250 }, { models: 1, points: 270, condition: "2nd+ Norn Assimilator in army (+20 points)" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Norn Assimilator datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/norn-assimilator", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:norn-emissary": Object.freeze({
    characteristics: Object.freeze({ Move: '10"', Toughness: 11, Save: "2+", Wounds: 16, Leadership: "7+", "Objective Control": 5, "Invulnerable save": "4+" }),
    keywords: Object.freeze(["Great Devourer", "Monster", "Norn Emissary", "Psyker", "Synapse"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Psychic Tendril (neuroparasite)", equipment: "Default", range: '18"', attacks: 2, skill: "2+", strength: 8, ap: -2, damage: "D3", abilities: "Precision, Psychic" }),
      Object.freeze({ name: "Psychic Tendril (neuroblast)", equipment: "Default", range: '18"', attacks: "2D6", skill: "2+", strength: 6, ap: -2, damage: 1, abilities: "Blast, Psychic" }),
      Object.freeze({ name: "Psychic Tendril (neurolance)", equipment: "Default", range: '18"', attacks: 2, skill: "2+", strength: 12, ap: -3, damage: "D6", abilities: "Melta 2, Psychic" }),
      Object.freeze({ name: "Monstrous rending claws", equipment: "Default", range: "Melee", attacks: 4, skill: "2+", strength: 7, ap: -2, damage: 2, abilities: "Extra Attacks" }),
      Object.freeze({ name: "Monstrous scything talons", equipment: "Default", range: "Melee", attacks: 6, skill: "2+", strength: 9, ap: -2, damage: 3 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Damaged: 1-5 Wounds Remaining", description: "While this model has 1-5 wounds remaining, each time this model makes an attack, subtract 1 from the Hit roll." }),
      Object.freeze({ name: "Deadly Demise D6", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D6 mortal wounds; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Singular Purpose", description: "At the start of the first battle round, select an enemy unit to re-roll Hit and Wound rolls against for the battle, or select an objective marker that grants this model Feel No Pain 5+ and Objective Control 15 while within range." }),
      Object.freeze({ name: "Unnatural Resilience", description: "This model has Feel No Pain 4+ against mortal wounds." })
    ]),
    defaultModelCount: 1, defaultPoints: 250,
    pointsOptions: Object.freeze([{ models: 1, points: 250 }, { models: 1, points: 270, condition: "2nd+ Norn Emissary in army (+20 points)" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Norn Emissary datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/norn-emissary", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:toxicrene": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 11, Save: "3+", Wounds: 14, Leadership: "8+", "Objective Control": 4 }),
    keywords: Object.freeze(["Frame", "Great Devourer", "Monster", "Toxicrene"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Massive toxic lashes (Ranged)", equipment: "Default", range: '9"', attacks: "2D6", skill: "3+", strength: 6, ap: -1, damage: 2, abilities: "Anti-Infantry 2+" }),
      Object.freeze({ name: "Massive toxic lashes (Melee)", equipment: "Default", range: "Melee", attacks: 12, skill: "3+", strength: 6, ap: -1, damage: 2, abilities: "Anti-Infantry 2+" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise D3", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D3 mortal wounds; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Grasping Tendrils", description: "Each time an enemy unit (excluding TITANIC units) within Engagement Range of one or more units from your army with this ability is selected to Fall Back, you can roll one D6: on a 3+, that enemy unit must Remain Stationary instead." }),
      Object.freeze({ name: "Hypertoxic Miasma", description: "At the end of your Movement phase, roll a D6 for each enemy unit within 6 inches: on 2–3 it suffers 1 mortal wound, on 4–5 D3, and on 6 D6." })
    ]),
    defaultModelCount: 1, defaultPoints: 120,
    pointsOptions: Object.freeze([{ models: 1, points: 120 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Toxicrene datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/toxicrene", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  })
  ,
  "tyranids:hormagaunts": Object.freeze({
    characteristics: Object.freeze({ Move: '10"', Toughness: 3, Save: "5+", Wounds: 1, Leadership: "8+", "Objective Control": 2 }),
    keywords: Object.freeze(["Infantry", "Battleline", "Great Devourer", "Endless Multitude", "Hormagaunts"]),
    weapons: Object.freeze([Object.freeze({ name: "Hormagaunt talons", equipment: "Default", range: "Melee", attacks: 3, skill: "4+", strength: 3, ap: -1, damage: 1 })]),
    abilities: Object.freeze([
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Bounding Leap", description: "This unit is eligible to declare a charge in a turn in which it Advanced." })
    ]),
    defaultModelCount: 10, defaultPoints: 70,
    pointsOptions: Object.freeze([{ models: 10, points: 70 }, { models: 20, points: 120 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app points listing and current 11th-edition datasheet", sourceUrl: "https://www.40k.app/879/factions/tyranids/units/hormagaunts/updates", additionalSources: Object.freeze(["https://www.wahapedia.ru/wh40k11ed/factions/tyranids/Hormagaunts"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:genestealers": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 4, Save: "5+", Wounds: 2, Leadership: "7+", "Objective Control": 1, "Invulnerable save": "5+" }),
    keywords: Object.freeze(["Infantry", "Great Devourer", "Vanguard Invader", "Genestealers"]),
    weapons: Object.freeze([Object.freeze({ name: "Genestealer claws and talons", equipment: "Default", range: "Melee", attacks: 4, skill: "2+", strength: 4, ap: -2, damage: 1 })]),
    abilities: Object.freeze([
      Object.freeze({ name: "Scouts 8", description: "This unit has Scouts 8 inches." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Vanguard Predator", description: "Each time a model in this unit makes an attack, re-roll a Hit roll of 1; if the target is within range of an objective marker, re-roll a Wound roll of 1 as well." })
    ]),
    defaultModelCount: 5, defaultPoints: 75,
    pointsOptions: Object.freeze([{ models: 5, points: 75 }, { models: 10, points: 140 }, { models: 5, points: 85, condition: "3rd+ Genestealer unit in army (+10 points)" }, { models: 10, points: 150, condition: "3rd+ Genestealer unit in army (+10 points)" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app points listing and current 11th-edition datasheet", sourceUrl: "https://www.40k.app/factions/tyranids", additionalSources: Object.freeze(["https://www.wahapedia.ru/wh40k11ed/factions/tyranids/Genestealers"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:gargoyles": Object.freeze({
    characteristics: Object.freeze({ Move: '12"', Toughness: 3, Save: "6+", Wounds: 1, Leadership: "8+", "Objective Control": 2 }),
    keywords: Object.freeze(["Infantry", "Battleline", "Fly", "Great Devourer", "Endless Multitude", "Vanguard Invader", "Gargoyles"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Fleshborer", equipment: "Default", range: '18"', attacks: 1, skill: "4+", strength: 5, ap: 0, damage: 1, abilities: "Assault" }),
      Object.freeze({ name: "Blinding venom", equipment: "Default", range: "Melee", attacks: 1, skill: "4+", strength: 3, ap: 0, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deep Strike", description: "During an ingress move, if every model in this unit has Deep Strike, it can be set up anywhere on the battlefield more than 8 inches horizontally from all enemy units, including within the opponent's deployment zone." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Winged Swarm", description: "After this unit shoots, if it is not within Engagement Range, it can make a Normal move of up to 6 inches; if it does, it cannot declare a charge this turn." })
    ]),
    defaultModelCount: 10, defaultPoints: 75,
    pointsOptions: Object.freeze([{ models: 10, points: 75 }, { models: 20, points: 150 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app points listing and current 11th-edition datasheet", sourceUrl: "https://www.40k.app/factions/tyranids", additionalSources: Object.freeze(["https://www.wahapedia.ru/wh40k11ed/factions/tyranids/Gargoyles"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:tyranid-warriors-with-melee-bio-weapons": Object.freeze({
    characteristics: Object.freeze({ Move: '6"', Toughness: 5, Save: "4+", Wounds: 3, Leadership: "7+", "Objective Control": 2 }),
    keywords: Object.freeze(["Infantry", "Great Devourer", "Synapse", "Tyranid Warriors with Melee Bio-weapons"]),
    weapons: Object.freeze([Object.freeze({ name: "Tyranid Warrior claws and talons", equipment: "Default", range: "Melee", attacks: 6, skill: "3+", strength: 5, ap: -2, damage: 1, abilities: "Twin-linked" })]),
    abilities: Object.freeze([
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Adaptive Instincts", description: "Once per turn in the Fight phase, when this unit is selected to fight or when an enemy unit targets it, choose: its melee attacks have +1 Strength, or this unit has +1 Toughness." })
    ]),
    defaultModelCount: 3, defaultPoints: 75,
    pointsOptions: Object.freeze([{ models: 3, points: 75 }, { models: 6, points: 150 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app points/update listing and current 11th-edition datasheet", sourceUrl: "https://www.40k.app/879/factions/tyranids/units/tyranid-warriors-with-melee-bio-weapons/updates", additionalSources: Object.freeze(["https://www.wahapedia.ru/wh40k11ed/factions/tyranids/Tyranid-Warriors-With-Melee-Bio-weapons"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:venomthropes": Object.freeze({
    characteristics: Object.freeze({ Move: '6"', Toughness: 5, Save: "4+", Wounds: 3, Leadership: "8+", "Objective Control": 1 }),
    keywords: Object.freeze(["Infantry", "Fly", "Great Devourer", "Venomthropes"]),
    weapons: Object.freeze([Object.freeze({ name: "Toxic lashes", equipment: "Default", range: "Melee", attacks: 5, skill: "3+", strength: 3, ap: 0, damage: 1, abilities: "Anti-Infantry 2+" })]),
    abilities: Object.freeze([
      Object.freeze({ name: "Stealth", description: "If every model in this unit has Stealth, ranged attacks targeting the unit grant it the benefit of cover against those attacks." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Foul Spores", description: "Friendly Tyranids units within 6 inches of this unit have Stealth." })
    ]),
    defaultModelCount: 3, defaultPoints: 55,
    pointsOptions: Object.freeze([{ models: 3, points: 55 }, { models: 6, points: 110 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app points listing and current 11th-edition datasheet", sourceUrl: "https://www.40k.app/factions/tyranids", additionalSources: Object.freeze(["https://www.wahapedia.ru/wh40k11ed/factions/tyranids/Venomthropes"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:trygon": Object.freeze({
    characteristics: Object.freeze({ Move: '10"', Toughness: 10, Save: "3+", Wounds: 14, Leadership: "8+", "Objective Control": 4 }),
    keywords: Object.freeze(["Monster", "Great Devourer", "Vanguard Invader", "Burrower", "Trygon"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Bio-electric pulse", equipment: "Default", range: '12"', attacks: 6, skill: "3+", strength: 5, ap: 0, damage: 1, abilities: "Sustained Hits 2" }),
      Object.freeze({ name: "Trygon scything talons", equipment: "Default", range: "Melee", attacks: 12, skill: "3+", strength: 9, ap: -2, damage: 3 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deep Strike", description: "During an ingress move, if every model in this unit has Deep Strike, it can be set up anywhere on the battlefield more than 8 inches horizontally from all enemy units, including within the opponent's deployment zone." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Subterranean Tunnels", description: "In your Movement phase, when this model is set up on the battlefield using the Deep Strike ability, it can use a subterranean tunnel. If it does, this model can be set up anywhere on the battlefield that is more than 6 inches horizontally away from all enemy units, but until the end of the turn, it is not eligible to declare a charge." })
    ]),
    defaultModelCount: 1, defaultPoints: 135,
    pointsOptions: Object.freeze([{ models: 1, points: 135 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app points listing and current 11th-edition datasheet", sourceUrl: "https://www.40k.app/factions/tyranids", additionalSources: Object.freeze(["https://www.wahapedia.ru/wh40k11ed/factions/tyranids/Trygon"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:winged-tyranid-prime": Object.freeze({
    characteristics: Object.freeze({ Move: '12"', Toughness: 5, Save: "4+", Wounds: 6, Leadership: "7+", "Objective Control": 1 }),
    keywords: Object.freeze(["Infantry", "Character", "Fly", "Great Devourer", "Synapse", "Vanguard Invader", "Winged Tyranid Prime"]),
    weapons: Object.freeze([Object.freeze({ name: "Prime talons", equipment: "Default", range: "Melee", attacks: 6, skill: "2+", strength: 6, ap: -1, damage: 2 })]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deep Strike", description: "During an ingress move, if every model in this unit has Deep Strike, it can be set up anywhere on the battlefield more than 8 inches horizontally from all enemy units, including within the opponent's deployment zone." }),
      Object.freeze({ name: "Leader", description: "This model can lead eligible Tyranid units listed in the attachment compatibility data." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Alpha Warrior", description: "While this model is leading a unit, weapons equipped by models in that unit have Sustained Hits 1." }),
      Object.freeze({ name: "Death Blow", description: "If destroyed by a melee attack before it has fought this phase, on a D6 roll of 4+ it can fight after the attacking unit finishes its attacks before being removed." })
    ]),
    defaultModelCount: 1, defaultPoints: 65,
    pointsOptions: Object.freeze([{ models: 1, points: 65 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app points listing and current 11th-edition datasheet", sourceUrl: "https://www.40k.app/factions/tyranids", additionalSources: Object.freeze(["https://www.wahapedia.ru/wh40k11ed/factions/tyranids/Winged-Tyranid-Prime"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:harpy": Object.freeze({
    characteristics: Object.freeze({ Move: "—", Toughness: 9, Save: "3+", Wounds: 12, Leadership: "8+", "Objective Control": "—" }),
    keywords: Object.freeze(["Monster", "Fly", "Aircraft", "Great Devourer", "Vanguard Invader", "Harpy"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Stinger salvoes", equipment: "Default", range: '24"', attacks: 8, skill: "3+", strength: 5, ap: 0, damage: 1 }),
      Object.freeze({ name: "Twin heavy venom cannon", equipment: "Default", range: '36"', attacks: "D3", skill: "3+", strength: 9, ap: -2, damage: 3, abilities: "Blast, Twin-linked" }),
      Object.freeze({ name: "Twin stranglethorn cannon", equipment: "Default", range: '36"', attacks: "D6+1", skill: "2+", strength: 7, ap: -1, damage: 2, abilities: "Blast, Twin-linked" }),
      Object.freeze({ name: "Scything wings", equipment: "Default", range: "Melee", attacks: 4, skill: "4+", strength: 7, ap: -1, damage: 2 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise D3", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D3 mortal wounds; if that amount is random, roll separately for each affected unit." }),

      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Spore Mine Cysts", description: "At the end of your opponent's Fight phase, you can do one of the following: select one visible enemy unit (excluding Lone Operative units) within 24 inches of this unit and roll six D6 for that unit, causing 1 mortal wound for each 3+; or add a new Spore Mines unit containing D3 models to your army and set it up anywhere within 6 inches of this model and more than 8 inches horizontally away from all enemy units. You cannot select the Spore Mines option for more than one model per turn." })
    ]),
    defaultModelCount: 1, defaultPoints: 185,
    pointsOptions: Object.freeze([{ models: 1, points: 185 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app points listing and current 11th-edition datasheet", sourceUrl: "https://www.40k.app/factions/tyranids", additionalSources: Object.freeze(["https://www.wahapedia.ru/wh40k11ed/factions/tyranids/Harpy"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:hive-crone": Object.freeze({
    characteristics: Object.freeze({ Move: "—", Toughness: 9, Save: "3+", Wounds: 12, Leadership: "8+", "Objective Control": "—" }),
    keywords: Object.freeze(["Monster", "Fly", "Aircraft", "Great Devourer", "Vanguard Invader", "Hive Crone"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Drool cannon", equipment: "Default", range: '12"', attacks: "2D6", skill: "—", strength: 6, ap: -1, damage: 1, abilities: "Torrent" }),
      Object.freeze({ name: "Stinger salvoes", equipment: "Default", range: '24"', attacks: 8, skill: "3+", strength: 5, ap: 0, damage: 1 }),
      Object.freeze({ name: "Tentaclids", equipment: "Default", range: '36"', attacks: 4, skill: "3+", strength: 7, ap: 0, damage: 2, abilities: "Anti-Vehicle 4+, Devastating Wounds" }),
      Object.freeze({ name: "Scything wings", equipment: "Default", range: "Melee", attacks: 4, skill: "4+", strength: 7, ap: -1, damage: 2 }),
      Object.freeze({ name: "Thorax spur", equipment: "Default", range: "Melee", attacks: 1, skill: "3+", strength: 10, ap: -3, damage: "D6", abilities: "Anti-Fly 2+, Extra Attacks" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise D3", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D3 mortal wounds; if that amount is random, roll separately for each affected unit." }),

      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Airborne Predator", description: "Each time this model makes a ranged attack targeting a unit that can Fly, add 1 to the Hit roll." })
    ]),
    defaultModelCount: 1, defaultPoints: 170,
    pointsOptions: Object.freeze([{ models: 1, points: 170 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app points listing and current 11th-edition datasheet", sourceUrl: "https://www.40k.app/factions/tyranids", additionalSources: Object.freeze(["https://www.wahapedia.ru/wh40k11ed/factions/tyranids/Hive-Crone"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:tyrannocyte": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 9, Save: "3+", Wounds: 10, Leadership: "8+", "Objective Control": 2 }),
    keywords: Object.freeze(["Monster", "Fly", "Frame", "Transport", "Dedicated Transport", "Great Devourer", "Vanguard Invader", "Tyrannocyte"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Tyrannocyte bio-weapons", equipment: "Default", range: '24"', attacks: 5, skill: "4+", strength: 5, ap: -1, damage: 2 }),
      Object.freeze({ name: "Flensing whips", equipment: "Default", range: "Melee", attacks: 6, skill: "4+", strength: 7, ap: -1, damage: 2 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise D3", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D3 mortal wounds; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Deep Strike", description: "During an ingress move, if every model in this unit has Deep Strike, it can be set up anywhere on the battlefield more than 8 inches horizontally from all enemy units, including within the opponent's deployment zone." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Aerial Seeding", description: "This model must start the battle in Reserves, but neither it nor any units embarked within it are counted towards any limits placed on the maximum number of Reserves units you can start the battle with. It can be set up in the Reinforcements step of your first, second or third Movement phase, regardless of mission rules. Any embarked units must immediately disembark more than 8 inches from all enemy models. After this model has been set up on the battlefield, no units can embark within it." }),
      Object.freeze({ name: "Transport", description: "Transport capacity: 20 Tyranids Infantry models, or 1 Tyranids Monster model with Wounds 12 or less; Infantry models with more than 1 Wound take up 3 spaces." })
    ]),
    defaultModelCount: 1, defaultPoints: 80,
    pointsOptions: Object.freeze([{ models: 1, points: 80, condition: "1st–3rd Tyrannocyte in army" }, { models: 1, points: 90, condition: "4th+ Tyrannocyte in army" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app points listing and current 11th-edition datasheet", sourceUrl: "https://www.40k.app/factions/tyranids", additionalSources: Object.freeze(["https://www.wahapedia.ru/wh40k11ed/factions/tyranids/Tyrannocyte"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:hierophant": Object.freeze({
    characteristics: Object.freeze({ Move: '12"', Toughness: 14, Save: "2+", Wounds: 30, Leadership: "8+", "Objective Control": 12, "Invulnerable save": "5+" }),
    keywords: Object.freeze(["Monster", "Titanic", "Towering", "Frame", "Transport", "Great Devourer", "Hierophant"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Bio-plasma torrent", equipment: "Default", range: '12"', attacks: "3D6", skill: "—", strength: 7, ap: -2, damage: 1, abilities: "Assault, Torrent" }),
      Object.freeze({ name: "Dire bio-cannon", equipment: "Default", range: '48"', attacks: "D6+6", skill: "3+", strength: 10, ap: -3, damage: 3, abilities: "Blast" }),
      Object.freeze({ name: "Lashwhip pods", equipment: "Default", range: "Melee", attacks: 10, skill: "3+", strength: 5, ap: -1, damage: 1, abilities: "Extra Attacks" }),
      Object.freeze({ name: "Titanic scything talons", equipment: "Default", range: "Melee", attacks: 8, skill: "3+", strength: 20, ap: -2, damage: "D6+1" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise 2D6", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers 2D6 mortal wounds; roll separately for each affected unit." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Apex-beast", description: "Each time this model makes an attack targeting a Battle-shocked unit, add 1 to the Hit roll." }),
      Object.freeze({ name: "Stalking Forward", description: "Each time this model makes a Normal, Advance or Fall Back move, it can move over models (excluding Titanic models) and terrain features that are 4 inches or less in height as if they were not there." }),
      Object.freeze({ name: "Damaged: 1-10 Wounds Remaining", description: "While this model has 1-10 wounds remaining, subtract 6 from this model’s Objective Control characteristic and each time this model makes an attack, subtract 1 from the Hit roll." }),
      Object.freeze({ name: "Transport", description: "Transport capacity: 20 Tyranids Infantry models; models with more than 1 Wound take up 3 spaces. It cannot transport models that can Fly." })
    ]),
    defaultModelCount: 1, defaultPoints: 810,
    pointsOptions: Object.freeze([{ models: 1, points: 810 }, { models: 1, points: 910, condition: "2nd+ Hierophant in army (+100 points)" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "Games Workshop Tyranids Faction Pack v1.0 (11th edition; Hierophant datasheet)", sourceUrl: "https://assets.warhammer-community.com/eng_09-06_warhammer40000_faction_pack_tyranids-avhhzmcte8-j0kseag7td.pdf", additionalSources: Object.freeze(["https://www.40k.app/factions/tyranids", "https://www.wahapedia.ru/wh40k11ed/factions/tyranids/Hierophant"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "verified" })
  }),
  "tyranids:harridan": Object.freeze({
    characteristics: Object.freeze({ Move: '14"', Toughness: 10, Save: "3+", Wounds: 30, Leadership: "8+", "Objective Control": 0 }),
    keywords: Object.freeze(["Monster", "Titanic", "Fly", "Frame", "Transport", "Great Devourer", "Harridan"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Dire bio-cannon", equipment: "Default", range: '48"', attacks: "D6+6", skill: "3+", strength: 10, ap: -3, damage: 3, abilities: "Blast" }),
      Object.freeze({ name: "Gargantuan scything talons", equipment: "Default", range: "Melee", attacks: 6, skill: "3+", strength: 14, ap: -2, damage: "D6" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise 2D6", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers 2D6 mortal wounds; roll separately for each affected unit." }),
      Object.freeze({ name: "Hover", description: "This model has the Hover core ability." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Frenzied Metabolism", description: "When selected to shoot, this model can add 1 to Wound rolls for its attacks this phase; afterward, on a D6 roll of 2+, it suffers D3 mortal wounds." }),
      Object.freeze({ name: "Transport", description: "Transport capacity: 20 Gargoyles models and 1 Winged Tyranid Prime model." })
    ]),
    defaultModelCount: 1, defaultPoints: 610,
    pointsOptions: Object.freeze([{ models: 1, points: 610 }, { models: 1, points: 660, condition: "2nd+ Harridan in army (+50 points)" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "Games Workshop Tyranids Faction Pack v1.0 (11th edition; Harridan datasheet)", sourceUrl: "https://assets.warhammer-community.com/eng_09-06_warhammer40000_faction_pack_tyranids-avhhzmcte8-j0kseag7td.pdf", additionalSources: Object.freeze(["https://www.40k.app/factions/tyranids", "https://www.wahapedia.ru/wh40k11ed/factions/tyranids/Harridan"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "verified" })
  })
  ,
  "tyranids:hyperadapted-raveners": Object.freeze({
    characteristics: Object.freeze({ Move: '10"', Toughness: 5, Save: "4+", Wounds: "3 (Raveners); 6 (Ravener Prime)", Leadership: "8+ (Raveners); 7+ (Prime)", "Objective Control": 1 }),
    modelProfiles: Object.freeze([
      Object.freeze({ name: "Ravener Prime", Move: '10"', Toughness: 5, Save: "4+", Wounds: 6, Leadership: "7+", "Objective Control": 1, keywords: Object.freeze(["Character", "Synapse"]) }),
      Object.freeze({ name: "Raveners", Move: '10"', Toughness: 5, Save: "4+", Wounds: 3, Leadership: "8+", "Objective Control": 1, keywords: Object.freeze([]) })
    ]),
    keywords: Object.freeze(["Infantry", "Great Devourer", "Vanguard Invader", "Burrowers", "Hyperadapted Raveners"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Venom bolt", equipment: "Default", range: '12"', attacks: "D6+3", skill: "—", strength: 6, ap: -1, damage: 1, abilities: "Assault, Ignores Cover, Torrent" }),
      Object.freeze({ name: "Prime claws and talons", equipment: "Default", range: "Melee", attacks: 6, skill: "3+", strength: 5, ap: -2, damage: 2, abilities: "Anti-Monster 5+, Anti-Vehicle 5+, Twin-linked" }),
      Object.freeze({ name: "Ravener heavy claws and talons", equipment: "Default", range: "Melee", attacks: 3, skill: "3+", strength: 5, ap: -2, damage: 2, abilities: "Anti-Monster 5+, Anti-Vehicle 5+, Twin-linked" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deep Strike", description: "During an ingress move, if every model in this unit has Deep Strike, it can be set up anywhere on the battlefield more than 8 inches horizontally from all enemy units, including within the opponent's deployment zone." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Ravener Prime only. Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Leader", description: "The Ravener Prime leads the Hyperadapted Raveners unit." }),
      Object.freeze({ name: "Alpha Invader", description: "Weapons equipped by models in this unit have Sustained Hits 1." }),
      Object.freeze({ name: "Hypersensory Array", description: "Once per battle round, you can target this unit with the Rapid Ingress or Heroic Intervention Stratagem, regardless of any other uses of that Stratagem this phase. If you do, that use costs 1 fewer CP and does not prevent uses of that Stratagem on other units this phase." })
    ]),
    defaultModelCount: 5, defaultPoints: 165,
    pointsOptions: Object.freeze([
      Object.freeze({ models: 5, points: 165, condition: "1st or 2nd Hyperadapted Raveners unit in the army" }),
      Object.freeze({ models: 5, points: 175, condition: "3rd+ Hyperadapted Raveners unit in the army (+10 points)" })
    ]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "Games Workshop Tyranids Faction Pack v1.0 (11th edition; Hyperadapted Raveners datasheet)", sourceUrl: "https://assets.warhammer-community.com/eng_09-06_warhammer40000_faction_pack_tyranids-avhhzmcte8-j0kseag7td.pdf", additionalSources: Object.freeze(["https://www.40k.app/factions/tyranids", "https://www.wahapedia.ru/wh40k11ed/factions/tyranids/Hyperadapted-Raveners"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  })
  ,
  "tyranids:screamer-killer": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 9, Save: "2+", Wounds: 10, Leadership: "8+", "Objective Control": 3 }),
    keywords: Object.freeze(["Screamer-Killer", "Great Devourer", "Monster", "Tyranids"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Bio-plasmic scream", equipment: "Default", range: '18"', attacks: "D6+3", skill: "4+", strength: 8, ap: -2, damage: 1, abilities: "Assault, Blast" }),
      Object.freeze({ name: "Screamer-Killer talons", equipment: "Default", range: "Melee", attacks: 10, skill: "3+", strength: 10, ap: -2, damage: 3 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise 1", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers 1 mortal wound; if that amount is random, roll separately for each affected unit." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),Object.freeze({ name: "Death Scream", description: "In your Shooting phase, after this model has shot, select one enemy unit hit by one or more of those attacks. That unit must take a Battle-shock test, subtracting 1 from that test." })]),
    defaultModelCount: 1, defaultPoints: 125,
    pointsOptions: Object.freeze([{ models: 1, points: 125 }, { models: 1, points: 135, condition: "2nd+ Screamer-Killer in army (+10 points)" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "Warhammer 40,000 11th Ed Tyranids datasheet listing", sourceUrl: "https://wh-rules.ru/factions/tyranids/datasheets/screamer-killer", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:spore-mines": Object.freeze({
    characteristics: Object.freeze({ Move: '4"', Toughness: 1, Save: "7+", Wounds: 1, Leadership: "8+", "Objective Control": 0 }),
    keywords: Object.freeze(["Spore Mines", "Great Devourer", "Fly", "Beast", "Tyranids"]),
    weapons: Object.freeze([]),
    abilities: Object.freeze([
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Bio-minefield", description: "Enemy units cannot start or end an Advance move within 6 inches of this unit." }),
      Object.freeze({ name: "Floating Death", description: "Each time this unit or an enemy unit ends a move, for each model in this unit within 3 inches of one or more enemy units, select one of those enemy units. Destroy that Spore Mine; on a D6 roll of 2–5 the enemy unit suffers 1 mortal wound, and on a 6 it suffers D3 mortal wounds." })
    ]),
    defaultModelCount: 3, defaultPoints: 55,
    pointsOptions: Object.freeze([{ models: 3, points: 55 }, { models: 6, points: 110 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "Warhammer 40,000 11th Ed Tyranids datasheet listing", sourceUrl: "https://wh-rules.ru/factions/tyranids/datasheets/spore-mines", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:sporocyst": Object.freeze({
    characteristics: Object.freeze({ Move: "—", Toughness: 10, Save: "3+", Wounds: 10, Leadership: "8+", "Objective Control": 0 }),
    keywords: Object.freeze(["Sporocyst", "Great Devourer", "Monster", "Tyranids"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Sporocyst bio-weapons", equipment: "Default", range: '24"', attacks: 10, skill: "4+", strength: 5, ap: -1, damage: 2 }),
      Object.freeze({ name: "Flensing whips", equipment: "Default", range: "Melee", attacks: 6, skill: "4+", strength: 7, ap: -1, damage: 2 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Seed Mucolids", description: "Once per turn in your Shooting phase, when selected to shoot, this unit can use this ability instead of making ranged attacks. Add one Mucolid Spores unit containing 1 model wholly within 18 inches of this model and more than 8 inches horizontally from enemy units." }),
      Object.freeze({ name: "Hive Defences", description: "You can target this model with Fire Overwatch for 0CP, even if you have already targeted a different unit with that Stratagem this turn. This model can only be targeted with that Stratagem once per turn." })
    ]),
    defaultModelCount: 1, defaultPoints: 145,
    pointsOptions: Object.freeze([{ models: 1, points: 145 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "Warhammer 40,000 11th Ed Tyranids datasheet listing", sourceUrl: "https://wh-rules.ru/factions/tyranids/datasheets/sporocyst", pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  })
  ,
  "tyranids:malanthrope": Object.freeze({
    characteristics: Object.freeze({ Move: '6"', Toughness: 5, Save: "4+", Wounds: 10, Leadership: "7+", "Objective Control": 3 }),
    keywords: Object.freeze(["Infantry", "Character", "Fly", "Great Devourer", "Synapse", "Malanthrope", "Tyranids", "Legends"]),
    weapons: Object.freeze([Object.freeze({ name: "Grasping tail", equipment: "Default", range: "Melee", attacks: 4, skill: "4+", strength: 5, ap: 0, damage: 2 })]),
    abilities: Object.freeze([
      Object.freeze({ name: "Leader", description: "Can lead datasheet-listed eligible Bodyguard units." }),
      Object.freeze({ name: "Stealth", description: "If every model in this unit has Stealth, ranged attacks targeting the unit grant it the benefit of cover against those attacks." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Once per battle, in either player's Command phase, if a unit from your army with this ability is on the battlefield, you can unleash it. Each enemy unit on the battlefield must take a Battle-shock test; subtract 1 from each such test if that enemy unit is within 6 inches of one or more SYNAPSE units from your army." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Enhanced Toxic Miasma", description: "While this model is leading a unit, the range of that unit's Foul Spores Aura ability is increased to 9 inches." }),
      Object.freeze({ name: "Prey Adaptation", description: "Each time this model's unit is selected to fight, choose one melee weapon ability for its melee weapons until the end of the phase: Sustained Hits 1, Lance, or Lethal Hits." })
    ]),
    defaultModelCount: 1, defaultPoints: 75, legends: true,
    pointsOptions: Object.freeze([{ models: 1, points: 75 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "Current 11th-edition community Legends datasheet listing", sourceUrl: "https://wh-rules.ru/factions/tyranids/datasheets/malanthrope", additionalSources: Object.freeze(["https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending", availability: "Legends" })
  }),
  "tyranids:barbed-hierodule": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 12, Save: "2+", Wounds: 18, Leadership: "8+", "Objective Control": 5 }),
    keywords: Object.freeze(["Monster", "Frame", "Great Devourer", "Barbed Hierodule", "Tyranids", "Legends"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Bio-cannon", equipment: "Default", range: '48"', attacks: "D6+3", skill: "3+", strength: 9, ap: -2, damage: 2, abilities: "Blast" }),
      Object.freeze({ name: "Hierodule scything talons", equipment: "Default", range: "Melee", attacks: 8, skill: "3+", strength: 14, ap: -2, damage: "D3+3" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise D6", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D6 mortal wounds; roll separately for each affected unit." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Overgrown Barbs", description: "In your Shooting phase, after this model has shot, select one enemy unit (excluding TITANIC units) that was hit by one or more of those attacks. Until the start of your next turn, while this model is on the battlefield, that enemy unit is suppressed. While a unit is suppressed, each time a model in that unit makes an attack, subtract 1 from the Hit roll." }),
      Object.freeze({ name: "Damaged: 1-6 Wounds Remaining", description: "While this model has 1-6 wounds remaining, each time this model makes an attack, subtract 1 from the Hit roll." })
    ]),
    defaultModelCount: 1, defaultPoints: 340, legends: true,
    pointsOptions: Object.freeze([{ models: 1, points: 340 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "Current 11th-edition community Legends datasheet listing", sourceUrl: "https://wh-rules.ru/factions/tyranids/datasheets/barbed-hierodule", additionalSources: Object.freeze(["https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending", availability: "Legends" })
  }),
  "tyranids:dimachaeron": Object.freeze({
    characteristics: Object.freeze({ Move: '12"', Toughness: 10, Save: "3+", Wounds: 16, Leadership: "7+", "Objective Control": 5, "Invulnerable save": "5+" }),
    keywords: Object.freeze(["Monster", "Frame", "Great Devourer", "Dimachaeron", "Tyranids", "Legends"]),
    weapons: Object.freeze([Object.freeze({ name: "Massive scything sickle-talons", equipment: "Default", range: "Melee", attacks: 10, skill: "3+", strength: 9, ap: -2, damage: 3, abilities: "Twin-linked" })]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise D6", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D6 mortal wounds; roll separately for each affected unit." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Digestion Spine", description: "Each time this model fights, after it has resolved its attacks, if one or more enemy models (excluding VEHICLE models) were destroyed as the result of those attacks, this model regains up to D3 wounds." }),
      Object.freeze({ name: "Damaged: 1-5 Wounds Remaining", description: "While this model has 1-5 wounds remaining, each time this model makes an attack, subtract 1 from the Hit roll." })
    ]),
    defaultModelCount: 1, defaultPoints: 200, legends: true,
    pointsOptions: Object.freeze([{ models: 1, points: 200 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "Current 11th-edition community Legends datasheet listing", sourceUrl: "https://wh-rules.ru/factions/tyranids/datasheets/dimachaeron", additionalSources: Object.freeze(["https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending", availability: "Legends" })
  }),
  "tyranids:scythed-hierodule": Object.freeze({
    characteristics: Object.freeze({ Move: '12"', Toughness: 12, Save: "2+", Wounds: 18, Leadership: "8+", "Objective Control": 5 }),
    keywords: Object.freeze(["Monster", "Frame", "Great Devourer", "Scythed Hierodule", "Tyranids", "Legends"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Bio-acid spray", equipment: "Default", range: '18"', attacks: "3D6", skill: "—", strength: 6, ap: -2, damage: 1, abilities: "Torrent" }),
      Object.freeze({ name: "Hierodule scything talons", equipment: "Default", range: "Melee", attacks: 10, skill: "3+", strength: 14, ap: -2, damage: "D3+3" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise D6", description: "Each time this model is destroyed, after any embarked units make emergency disembark moves, roll one D6. On a 6, each unit within 6 inches suffers D6 mortal wounds; roll separately for each affected unit." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Irresistible Force", description: "This model is eligible to declare a charge in a turn in which it Fell Back." }),
      Object.freeze({ name: "Damaged: 1-6 Wounds Remaining", description: "While this model has 1-6 wounds remaining, each time this model makes an attack, subtract 1 from the Hit roll." })
    ]),
    defaultModelCount: 1, defaultPoints: 330, legends: true,
    pointsOptions: Object.freeze([{ models: 1, points: 330 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "Current 11th-edition community Legends datasheet listing", sourceUrl: "https://wh-rules.ru/factions/tyranids/datasheets/scythed-hierodule", additionalSources: Object.freeze(["https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending", availability: "Legends" })
  }),
  "tyranids:sky-slasher-swarms": Object.freeze({
    characteristics: Object.freeze({ Move: '12"', Toughness: 2, Save: "6+", Wounds: 4, Leadership: "8+", "Objective Control": 0 }),
    keywords: Object.freeze(["Swarm", "Great Devourer", "Fly", "Sky-slasher Swarms", "Tyranids", "Legends"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Spinemaws", equipment: "Default", range: '6"', attacks: 4, skill: "5+", strength: 3, ap: 0, damage: 1, abilities: "Pistol" }),
      Object.freeze({ name: "Claws and teeth", equipment: "Default", range: "Melee", attacks: 6, skill: "5+", strength: 2, ap: 0, damage: 1, abilities: "Sustained Hits 1" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deep Strike", description: "During an ingress move, if every model in this unit has Deep Strike, it can be set up anywhere on the battlefield more than 8 inches horizontally from all enemy units, including within the opponent's deployment zone." }),
      Object.freeze({ name: "Synapse", description: "While a TYRANIDS unit from your army is within 6 inches of one or more friendly SYNAPSE models, it is within Synapse Range. While in Synapse Range, it takes Battle-shock tests on 3D6 instead of 2D6, and each model in it adds 1 to the Strength characteristic of its melee attacks." }),
      Object.freeze({ name: "Chitinous Horrors", description: "While an enemy unit is within Engagement Range of one or more units with this ability, halve the Objective Control characteristic of models in that enemy unit." })
    ]),
    defaultModelCount: 3, defaultPoints: 60, legends: true,
    pointsOptions: Object.freeze([{ models: 3, points: 60 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "Current 11th-edition community Legends datasheet listing", sourceUrl: "https://wh-rules.ru/factions/tyranids/datasheets/sky-slasher-swarms", additionalSources: Object.freeze(["https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/"]), pointsSourceName: "Games Workshop Munitorum Field Manual v1.5 (2026-09-30)", pointsSourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending", availability: "Legends" })
  })
});

export function getTyranidDatasheetDetails(datasheetId) {
  return TYRANID_DATASHEET_DETAILS[datasheetId] ?? null;
}
