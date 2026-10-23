export const ADEPTUS_CUSTODES_RULE_SOURCES = Object.freeze({
  officialDownloads: 'https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/',
  officialArmyRulesPreview: 'https://www.warhammer-community.com/en-gb/articles/vygelghy/new-army-rules-from-codex-adeptus-custodes/',
  officialDetachmentsPreview: 'https://www.warhammer-community.com/en-gb/articles/joz5iubm/your-first-look-at-13-new-adeptus-custodes-detachments/',
  currentReference: 'https://orpheax.github.io/custobuilder/'
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
  Object.freeze({ name:'Aegis of the Emperor', description:'Adeptus Custodes units have Feel No Pain 5+ against mortal wounds.' }),
  Object.freeze({ name:'Aquila Commander', description:'At the start of each battle round, an eligible commander can provide one additional Command Point for the army.' }),
  Object.freeze({ name:'Daughters of the Abyss', description:'Anathema Psykana models have strong protection against Psychic attacks and project a short-range anti-Psychic protection aura to nearby Adeptus Custodes units.' })
]);

export const ADEPTUS_CUSTODES_DETACHMENTS = Object.freeze([
  Object.freeze({ name:'Guardians of the Throne', detachmentPoints:3, forceDisposition:'Priority Assets and Purge the Foe', ruleName:'Martial Mastery', rule:'When a Custodes unit fights, choose Sustained Hits 1 or Lethal Hits for its melee attacks.' }),
  Object.freeze({ name:'Shadowkeepers', detachmentPoints:1, forceDisposition:'Purge the Foe', uniqueShieldHost:true, favouredKatah:'Kaptaris', ruleName:'Wardens of the Dark Cells', rule:'Non-Monster/Vehicle Custodes on objectives are harder to wound in melee when the attack Strength exceeds their Toughness.' }),
  Object.freeze({ name:'Solar Watch', detachmentPoints:1, forceDisposition:'Reconnaissance', uniqueShieldHost:true, favouredKatah:'Calistus', ruleName:'Talon Sortie', rule:'Custodes units that Fall Back can remain eligible to charge.' }),
  Object.freeze({ name:'Aquilan Shield', detachmentPoints:1, forceDisposition:'Take and Hold', uniqueShieldHost:true, favouredKatah:'Salvus', ruleName:'Gilded Guardians', rule:'Non-Monster/Vehicle Custodes on objectives are harder to wound by ranged attacks whose Strength exceeds their Toughness.' }),
  Object.freeze({ name:'Dread Host', detachmentPoints:1, forceDisposition:'Purge the Foe', uniqueShieldHost:true, favouredKatah:'Dacatarai', ruleName:"Instruments of the Emperor's Wrath", rule:'Custodes units can re-roll Charge rolls.' }),
  Object.freeze({ name:'Emissaries Imperatus', detachmentPoints:1, forceDisposition:'Priority Assets', uniqueShieldHost:true, favouredKatah:'Conservai', ruleName:'Heralds of the Throne', rule:'Custodes units have Fights First.' }),
  Object.freeze({ name:"Emperor's Chosen", detachmentPoints:1, forceDisposition:'Priority Assets', uniqueShieldHost:true, favouredKatah:'Rendax', ruleName:'Magna Imperator', rule:'Each Custodes unit selected to attack can re-roll one Hit roll and one Wound roll.' }),
  Object.freeze({ name:'Auric Champions', detachmentPoints:1, forceDisposition:'Purge the Foe', ruleName:'Assemblage of Might', rule:'In your Command phase choose a dreadful foe; Custodes Character attacks against it gain +1 to Wound.' }),
  Object.freeze({ name:'Honoured Companions', detachmentPoints:1, forceDisposition:'Take and Hold', ruleName:"Companion's Watch", rule:'Trusted Sentinel units on objectives can re-roll Wound rolls of 1.' }),
  Object.freeze({ name:'Lions of the Emperor', detachmentPoints:1, forceDisposition:'Disruption', ruleName:'On Gilded Wings', rule:'Eligible unengaged Custodes Terminator units can return to Strategic Reserves after the opponent Fight phase.' }),
  Object.freeze({ name:'Might of the Moritoi', detachmentPoints:1, forceDisposition:'Take and Hold', ruleName:'Moritoi Ancients', rule:'Custodes Dreadnoughts gain escalating combat bonuses as they suffer damage.' }),
  Object.freeze({ name:'Grav-Assault Force', detachmentPoints:1, forceDisposition:'Reconnaissance', ruleName:'Flare Shields', rule:'Friendly Grav-Assault units have a 4+ invulnerable save against ranged attacks.' }),
  Object.freeze({ name:'Null Maiden Vigil', detachmentPoints:1, forceDisposition:'Disruption', ruleName:'Silent Sisterhood', rule:'Anathema Psykana Characters can be Warlords and Prosecutor Squads gain Battleline; the detachment also intensifies Sisters of Silence battlefield pressure.' })
]);

export const ADEPTUS_CUSTODES_RULES_DATA = Object.freeze({
  name:'Codex: Adeptus Custodes',
  version:'October 2026',
  legalFrom:'2026-10',
  publicationType:'Codex',
  sourceUrl:ADEPTUS_CUSTODES_RULE_SOURCES.officialDownloads,
  armyRules:ADEPTUS_CUSTODES_ARMY_RULES,
  detachments:ADEPTUS_CUSTODES_DETACHMENTS
});
