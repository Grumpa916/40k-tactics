/**
 * Space Marines 11th-edition detachment audit, 11 November 2026.
 * The current Codex's 16 active detachments are distinguished from the
 * previous Faction Pack's explicitly Legends detachments. Legacy chapter
 * supplements absent from this 16-detachment Codex list remain provisional
 * until their own official publication is compared; never delete saved lists.
 *
 * Cross-check (secondary current 2026-10-30):
 * https://tactical40k.com/codex/space-marines
 * GW codex preview (primary):
 * https://www.warhammer-community.com/en-gb/articles/zcobdkzh/your-first-look-at-15-new-space-marine-detachments/
 */
const SOURCE = 'https://tactical40k.com/codex/space-marines';
const row=(name,detachmentPoints,forceDisposition,ruleName,ruleSummary,uniqueTag=null,alternatives=[])=>Object.freeze({
  name,detachmentPoints,forceDisposition,
  forceDispositionOptions:Object.freeze([forceDisposition,...alternatives]),
  ruleName,ruleSummary,
  ...(uniqueTag?{uniqueTag}:{}),
  category:'current-codex',
  rulesCertification:'2026-10-30-independent-current-reference-gw-october-primary-pending',
  sourceUrl:SOURCE
});
export const SPACE_MARINES_CURRENT_11E_DETACHMENTS=Object.freeze([
 row('Gladius Task Force',3,'Priority Assets','Codex Discipline',
   'Select one Combat Doctrine one additional time per battle.',null,['Take and Hold']),
 row('Ironstorm Spearhead',1,'Purge the Foe','Ironstorm Auto-targeters',
   'Adeptus Astartes Vehicle ranged attacks, excluding Walkers, may re-roll one Hit and one Wound roll.'),
 row('Stormlance Task Force',1,'Reconnaissance','Lightning-fast Strike',
   'Friendly Adeptus Astartes Mounted or Speeder units have +2 inches Move.'),
 row('Deathwatch Support',1,'Disruption','Mission Tactics',
   'Kill Teams gain extra attacks benefits from their active Combat Doctrine. Includes restricted Deathwatch allies.'),
 row('Gauntlet Task Force',1,'Reconnaissance','Combined Deployment',
   'Friendly Transports can mark a target they hit; recently disembarked Astartes gain Sustained Hits 1 against it.'),
 row('Phobos Shadow Force',1,'Disruption','Shadow Masters',
   'After shooting, friendly Phobos or Scout Squad units can remain hidden or reposition, subject to restrictions.'),
 row('Tacticus Attack Force',1,'Take and Hold','Wrath of the Chapter',
   'Friendly Tacticus units may re-roll Advance rolls.'),
 row('Phobos Shock Force',1,'Disruption','Vanguard Ambushers',
   'Hidden Phobos units may re-roll Wound rolls of 1 after the Movement phase.'),
 row('Terminator Storm Force',1,'Priority Assets','Death Blow',
   'Friendly Adeptus Astartes Terminator units have +1 to Charge rolls.'),
 row('Assault Brethren',1,'Take and Hold','Assault Mastery',
   'Select Assault Doctrine one additional time per battle.','Doctrines'),
 row('Gravis Linebreaker Force',1,'Take and Hold','Walking Fortress',
   'Friendly Gravis units gain +1 to ranged Hit rolls after making a Normal move, while losing Heavy.'),
 row('Devastator Brethren',1,'Purge the Foe','Devastator Mastery',
   'Select Devastator Doctrine one additional time per battle.','Doctrines'),
 row('Gravis Siege Force',1,'Take and Hold','Indomitable Defence',
   'Gravis units within objective range are harder to wound with attacks whose Strength exceeds their Toughness.'),
 row('Tactical Brethren',1,'Priority Assets','Tactical Mastery',
   'Select Tactical Doctrine one additional time per battle.','Doctrines'),
 row('Ironclad Champions',1,'Priority Assets','Enduring Vengeance',
   'Friendly Adeptus Astartes Dreadnought units may re-roll Hit rolls of 1.'),
 row('Tacticus Firestorm Force',1,'Priority Assets','Codex Fire-patterns',
   'Friendly Tacticus units gain Rapid Fire benefits at maximum weapon range.')
]);
export const SPACE_MARINES_EXPLICIT_LEGENDS_DETACHMENTS=Object.freeze([
 'Vengeful Hosts','Fulguris Task Force','Librarius Conclave','Subversion Assets',
 'Armoured Speartip','Headhunter Task Force','Hammer of Avernii','Emperor\'s Shield',
 'Bastion Task Force','Orbital Assault Force','Reclamation Force'
]);
export const SPACE_MARINES_CURRENT_DETACHMENT_INDEX=Object.freeze({
 reviewedAt:'2026-11-11',
 currentCount:16,
 legendsCount:11,
 currentSourceUrl:SOURCE,
 officialOctober2026FactionPackDirectlyVerified:false,
 officialCurrentMfmDetachmentPointsDirectlyVerified:false
});
