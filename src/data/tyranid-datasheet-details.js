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
      Object.freeze({ name: "Shadow in the Warp", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Synapse", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Alpha Warrior", description: "Weapons equipped by models in this model's unit have Sustained Hits 1." }),
      Object.freeze({ name: "Aggressive Leader-beast", description: "In the opponent's Shooting phase, if a model in this unit is destroyed by an enemy unit's attacks, this unit can make a surge move of up to D6 inches." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 75,
    pointsOptions: Object.freeze([{ models: 1, points: 75, condition: "1 model" }]),
    dataSource: Object.freeze({
      status: "source-reviewed",
      sourceName: "40k.app Tyranid Prime with Lash Whip datasheet",
      sourceUrl: "https://www.40k.app/factions/tyranids/units/tyranid-prime-with-lash-whip",
      reviewedAt: REVIEWED_AT,
      officialRulesCrossCheck: "pending"
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
    keywords: Object.freeze(["Burrower", "Great Devourer", "Infantry", "Raveners"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Ravener claws and talons", range: "Melee", attacks: 3, skill: "3+", strength: 5, ap: -2, damage: 2, abilities: "Twin-linked" })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deep Strike", description: "This unit can be set up using the Deep Strike rules." }),
      Object.freeze({ name: "Synapse", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Death From Below", description: "At the end of the opponent's turn, if this unit is not within Engagement Range of an enemy unit, it can be removed from the battlefield and placed into Strategic Reserves." })
    ]),
    defaultModelCount: 5,
    defaultPoints: 125,
    pointsOptions: Object.freeze([
      Object.freeze({ models: 5, points: 125, condition: "1st or 2nd Raveners unit in the army" }),
      Object.freeze({ models: 5, points: 135, condition: "3rd or later Raveners unit in the army (+10 points)" })
    ]),
    dataSource: Object.freeze({
      status: "source-reviewed",
      sourceName: "40k.app Raveners datasheet",
      sourceUrl: "https://www.40k.app/factions/tyranids/units/raveners",
      reviewedAt: REVIEWED_AT,
      officialRulesCrossCheck: "pending"
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
      Object.freeze({ name: "Deadly Demise D3", description: "When destroyed, this model can inflict mortal wounds as described by the current rule." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Synapse", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Will of the Hive Mind", description: "Once per battle round, when a friendly Tyranids unit within 12 inches is targeted with a Stratagem, reduce that usage's CP cost by 1." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 195,
    pointsOptions: Object.freeze([{ models: 1, points: 195, condition: "1 model" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Hive Tyrant datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/hive-tyrant", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
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
      Object.freeze({ name: "Synapse", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Node Lash", description: "While leading a unit, add 1 to its models' Hit rolls; against a Battle-shocked target, add 1 to the Wound roll as well." }),
      Object.freeze({ name: "Psychic Terror", description: "When this model is on the battlefield as Shadow in the Warp is unleashed, subtract 1 from the resulting enemy Battle-shock tests." }),
      Object.freeze({ name: "Neuroloids", description: "In your Command phase, select up to two friendly Tyranids units within 18 inches to be considered within Synapse Range until your next Command phase." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 130,
    pointsOptions: Object.freeze([{ models: 1, points: 130, condition: "1 model" }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Neurotyrant datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/neurotyrant", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
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
      Object.freeze({ name: "Synapse", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Guardian Organism", description: "While a CHARACTER model is leading this unit, that CHARACTER model has Feel No Pain 5+." })
    ]),
    defaultModelCount: 3,
    defaultPoints: 80,
    pointsOptions: Object.freeze([{ models: 3, points: 80 }, { models: 6, points: 160 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Tyrant Guard datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/tyrant-guard", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
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
      Object.freeze({ name: "Shadow in the Warp", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Synapse", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Vicious Insight", description: "While leading a unit, weapons equipped by models in that unit have Devastating Wounds." }),
      Object.freeze({ name: "Hypnotic Gaze", description: "At the start of the Fight phase, select one enemy unit within Engagement Range; subtract 1 from its models' Hit rolls for the phase." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 80,
    pointsOptions: Object.freeze([{ models: 1, points: 80 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Broodlord datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/broodlord", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:old-one-eye": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 9, Save: "2+", Wounds: 9, Leadership: "8+", "Objective Control": 3, "Feel No Pain": "5+" }),
    keywords: Object.freeze(["Character", "Epic Hero", "Great Devourer", "Monster", "Old One Eye"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Old One Eye's claws and talons (strike)", equipment: "Default", range: "Melee", attacks: 6, skill: "3+", strength: 14, ap: -3, damage: "D6+1" }),
      Object.freeze({ name: "Old One Eye's claws and talons (sweep)", equipment: "Default", range: "Melee", attacks: 12, skill: "3+", strength: 6, ap: -1, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Feel No Pain 5+", description: "This model has Feel No Pain 5+." }),
      Object.freeze({ name: "Leader", description: "Can lead Carnifexes, according to the reviewed datasheet listing." }),
      Object.freeze({ name: "Synapse", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Alpha Leader", description: "While leading a unit, each time a model in that unit makes an attack, you can re-roll the Hit roll." }),
      Object.freeze({ name: "Unstoppable Monster", description: "At the start of each player's Command phase, this model regains up to D3 lost wounds." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 140,
    pointsOptions: Object.freeze([{ models: 1, points: 140 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Old One Eye datasheet", sourceUrl: "https://www.40k.app/879/factions/tyranids/units/old-one-eye", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:carnifexes": Object.freeze({
    characteristics: Object.freeze({ Move: '8"', Toughness: 9, Save: "2+", Wounds: 8, Leadership: "8+", "Objective Control": 3 }),
    keywords: Object.freeze(["Carnifexes", "Great Devourer", "Monster"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Carnifex scything talons", equipment: "Default", range: "Melee", attacks: 6, skill: "4+", strength: 9, ap: -2, damage: 3 }),
      Object.freeze({ name: "Carnifex extra scything talons", equipment: "Default", range: "Melee", attacks: 2, skill: "4+", strength: 9, ap: -2, damage: 3, abilities: "Extra Attacks" }),
      Object.freeze({ name: "Chitinous claws and teeth", equipment: "Default", range: "Melee", attacks: 4, skill: "4+", strength: 6, ap: 0, damage: 1 }),
      Object.freeze({ name: "Bio-plasma", equipment: "Wargear option", range: '12"', attacks: "D3", skill: "4+", strength: 7, ap: -2, damage: 1, abilities: "Assault, Blast" }),
      Object.freeze({ name: "Heavy venom cannon", equipment: "Wargear option", range: '36"', attacks: "D3", skill: "4+", strength: 9, ap: -2, damage: 3, abilities: "Blast" }),
      Object.freeze({ name: "Deathspitters with slimer maggots", equipment: "Wargear option", range: '24"', attacks: 6, skill: "4+", strength: 7, ap: -2, damage: 1 }),
      Object.freeze({ name: "Devourers with brainleech worms", equipment: "Wargear option", range: '18"', attacks: 12, skill: "4+", strength: 6, ap: 0, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Deadly Demise 1", description: "When destroyed, this model can inflict mortal wounds as described by the current rule." }),
      Object.freeze({ name: "Synapse", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Blistering Assault", description: "In the opponent's Shooting phase, if an enemy unit's attacks cause a model in this unit to lose a wound, this unit can make a surge move of up to D6+2 inches." }),
      Object.freeze({ name: "Leader compatibility", description: "The reviewed datasheet listing allows Old One Eye to lead this unit." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 90,
    pointsOptions: Object.freeze([{ models: 1, points: 90 }, { models: 2, points: 180 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Carnifexes datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/carnifexes", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
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
      Object.freeze({ name: "Deadly Demise D3", description: "When destroyed, this model can inflict mortal wounds as described by the current rule." }),
      Object.freeze({ name: "Shadow in the Warp", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Synapse", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Hive Commander", description: "At the start of your Command phase, if this model is on the battlefield, you gain 1CP." }),
      Object.freeze({ name: "Malign Presence", description: "Once per turn, when the opponent targets a unit within 12 inches of this model with a Stratagem, increase that use's CP cost by 1." }),
      Object.freeze({ name: "Domination of the Hive Mind", description: "While a friendly Tyranids unit is within 9 inches of this model, that unit is within your army's Synapse Range." })
    ]),
    defaultModelCount: 1,
    defaultPoints: 210,
    pointsOptions: Object.freeze([{ models: 1, points: 210 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app The Swarmlord datasheet", sourceUrl: "https://www.40k.app/879/factions/tyranids/units/the-swarmlord", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  }),
  "tyranids:neurogaunts": Object.freeze({
    characteristics: Object.freeze({ Move: '6"', Toughness: 3, Save: "6+", Wounds: 1, Leadership: "8+", "Objective Control": 1 }),
    keywords: Object.freeze(["Endless Multitude", "Great Devourer", "Infantry", "Neurogaunts"]),
    weapons: Object.freeze([
      Object.freeze({ name: "Chitinous claws and teeth", equipment: "Default", range: "Melee", attacks: 1, skill: "4+", strength: 3, ap: 0, damage: 1 })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: "Neurocytes", description: "While this unit is within Synapse Range of a friendly Tyranids unit (excluding Neurogaunt units), it has the Synapse keyword." }),
      Object.freeze({ name: "Leader compatibility", description: "The reviewed datasheet listing allows a Neurotyrant to lead this unit." })
    ]),
    defaultModelCount: 11,
    defaultPoints: 45,
    pointsOptions: Object.freeze([{ models: 11, points: 45 }, { models: 22, points: 90 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Neurogaunts datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/neurogaunts", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
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
      Object.freeze({ name: "Shadow in the Warp", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Synapse", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Spirit Leech", description: "While an enemy unit is within 6 inches, if this unit contains a Neurothrope, each time that enemy unit fails a Battle-shock test it suffers D3 mortal wounds and one model in this unit regains up to D3 lost wounds." }),
      Object.freeze({ name: "Warp Field", description: "While a friendly Tyranids unit is within 6 inches of this unit, models in that unit have a 6+ invulnerable save." }),
      Object.freeze({ name: "Leader compatibility", description: "The reviewed datasheet listing allows a Neurotyrant to lead this unit." })
    ]),
    defaultModelCount: 3,
    defaultPoints: 100,
    pointsOptions: Object.freeze([{ models: 3, points: 100 }, { models: 6, points: 200 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Zoanthropes datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/unit/zoanthropes", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
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
      Object.freeze({ name: "Synapse", description: "Tyranid faction ability; consult current rules for its full effect." }),
      Object.freeze({ name: "Skulking Horrors", description: "In the opponent's Movement phase, if an enemy unit ends a move within 8 inches and this unit is not in Engagement Range, this unit can make a Normal move of up to D6 inches." }),
      Object.freeze({ name: "Leader compatibility", description: "The reviewed datasheet listing allows a Tyranid Prime with Lash Whip to lead this unit." })
    ]),
    defaultModelCount: 10,
    defaultPoints: 60,
    pointsOptions: Object.freeze([{ models: 10, points: 60 }, { models: 20, points: 110 }]),
    dataSource: Object.freeze({ status: "source-reviewed", sourceName: "40k.app Termagants datasheet", sourceUrl: "https://www.40k.app/factions/tyranids/units/termagants", reviewedAt: REVIEWED_AT, officialRulesCrossCheck: "pending" })
  })
});

export function getTyranidDatasheetDetails(datasheetId) {
  return TYRANID_DATASHEET_DETAILS[datasheetId] ?? null;
}
