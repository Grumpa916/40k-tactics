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
  })
});

export function getTyranidDatasheetDetails(datasheetId) {
  return TYRANID_DATASHEET_DETAILS[datasheetId] ?? null;
}
