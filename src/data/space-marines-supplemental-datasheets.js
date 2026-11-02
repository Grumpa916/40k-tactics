// Focused reviewed Space Marines datasheets that are not yet present in the
// broader community-reference projection used by the Army Builder.
// Keep this file small and source-specific so entries can be folded into the
// generated catalog later without duplicating the entire projection.

const REVIEWED_AT = '2026-11-01';
const MFM_SOURCE = 'https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/';

export const SPACE_MARINES_SUPPLEMENTAL_DATASHEETS = Object.freeze({
  'Marneus Calgar': Object.freeze({
    name: 'Marneus Calgar',
    characteristics: Object.freeze({
      Move: '6"',
      Toughness: '6',
      Save: '2+',
      Wounds: '6',
      Leadership: '6+',
      'Objective Control': '1',
      'Invulnerable save': '4+'
    }),
    weapons: Object.freeze([
      Object.freeze({
        name: 'Gauntlets of Ultramar', range: '18"', attacks: '4', skill: '2+',
        strength: '5', ap: '-2', damage: '2', abilities: 'Close-Quarters, Twin-linked'
      }),
      Object.freeze({
        name: 'Gauntlets of Ultramar', range: 'Melee', attacks: '6', skill: '2+',
        strength: '10', ap: '-3', damage: '3', abilities: 'Twin-linked'
      }),
      Object.freeze({
        name: 'Gauntlets of Ultramar - Overhead Smash', range: 'Melee', attacks: '1', skill: '2+',
        strength: '14', ap: '-3', damage: 'D3+3', abilities: 'Extra Attacks, Twin-linked'
      })
    ]),
    abilities: Object.freeze([
      Object.freeze({ name: 'Deep Strike', description: 'This unit can enter the battlefield using Deep Strike.' }),
      Object.freeze({ name: 'Leader', description: 'Can lead the currently reviewed eligible Space Marine infantry units, including Aggressors, Assault Intercessors, Bladeguard Veterans, Company Heroes, Eradicators, Heavy Intercessors, Infernus, Intercessors, Sternguard Veterans, Terminators, Vanguard Veterans and Victrix Honour Guard.' }),
      Object.freeze({ name: 'Codex Adept', description: 'The Assault, Devastator and Tactical combat doctrines are active for this unit.' }),
      Object.freeze({ name: 'Master Tactician', description: 'In your Movement phase, select one visible friendly Adeptus Astartes unit within 9 inches and choose a combat doctrine for it until the start of your next Command phase.' }),
      Object.freeze({ name: 'Thunderhawk Insertion', description: 'During Declare Battle Formations, one friendly Gravis, Phobos or Tacticus unit can gain Deep Strike.' })
    ]),
    keywords: Object.freeze(['Infantry','Character','Epic Hero','Imperium','Terminator','Chapter Master','Marneus Calgar','Faction: Adeptus Astartes','Faction: Ultramarines']),
    sourceName: 'October 2026 Space Marines rules / MFM reviewed profile',
    sourceUrl: MFM_SOURCE,
    reviewedAt: REVIEWED_AT,
    verificationStatus: 'source-reviewed',
    officialRulesCrossCheck: 'current-mfm'
  })
});
