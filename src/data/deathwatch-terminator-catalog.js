// Source-scoped Deathwatch ally data. Reviewed against the current Warmind 11e
// Codex card supplied 2026-11-25; GW's June Faction Pack confirms identity,
// options and abilities but predates the October Codex weapon changes.
const sourceUrl = 'https://warmind.online/d/deathwatch/codex-terminator-squad';
const officialPack = 'https://assets.warhammer-community.com/eng_08-06_warhammer40000_faction_pack_deathwatch-z0ebavrfze-muhcibnets.pdf';
const weapon = (name, range, attacks, skill, strength, ap, damage, abilities = '') =>
  Object.freeze({ name, range, attacks, skill, strength, ap, damage, abilities });
const ability = (name, description) => Object.freeze({ name, description });

export const DEATHWATCH_TERMINATOR_CATALOG = Object.freeze([
  Object.freeze({
    id: 'deathwatch:deathwatch-terminator-squad',
    name: 'Deathwatch Terminator Squad',
    faction: 'Deathwatch',
    defaultModelCount: 5,
    defaultPoints: 190,
    pointsOptions: Object.freeze([{models:5,points:190},{models:10,points:380}]),
    sourceName: 'Warmind 11e Codex datasheet, reviewed from user screenshots 25 Nov 2026; GW June pack for rules identity',
    sourceUrl,
    officialSourceUrl: officialPack,
    reviewedAt: '2026-11-25',
    verificationStatus: 'current-datasheet-cross-check',
    officialRulesCrossCheck: 'pending-direct-october-codex',
    datasheet: Object.freeze({
      name: 'Deathwatch Terminator Squad',
      characteristics: Object.freeze({
        Move:'5"', Toughness:'6', Save:'2+', Wounds:'3',
        Leadership:'6+', 'Objective Control':'1', 'Invulnerable save':'4+'
      }),
      weapons: Object.freeze([
        weapon('Assault Cannon','24"','6','3+','6','-2','1','Sustained Hits 1'),
        weapon('Cyclone Missile Launcher - Frag','36"','8','3+','4','-1','1','Blast 2'),
        weapon('Cyclone Missile Launcher - Krak','36"','2','3+','10','-2','D3+3'),
        weapon('Heavy Flamer','12"','3','N/A','5','-1','1','Blast 2, Torrent'),
        weapon('Plasma Cannon - Standard','36"','3','3+','9','-2','2','Blast 1'),
        weapon('Plasma Cannon - Supercharge','36"','3','3+','10','-3','3','Blast 1, Hazardous'),
        weapon('Storm Bolter','24"','2','3+','5','-1','1','Rapid Fire 2'),
        weapon('Chainfist - Standard','Melee','2','4+','8','-2','2'),
        weapon('Chainfist - Hunter','Melee','3','3+','12','-2','3','Hunter: Monster/Vehicle'),
        weapon('Power Fist','Melee','3','3+','8','-2','2'),
        weapon('Power Weapon','Melee','5','3+','5','-2','1'),
        weapon('Thunder Hammer','Melee','3','3+','8','-2','3','Devastating Wounds'),
        weapon('Twin Lightning Claws','Melee','6','3+','5','-2','1','Twin-linked')
      ]),
      abilities: Object.freeze([
        ability('Deep Strike','This unit has Deep Strike.'),
        ability('Terminatus Assault','Re-roll Charge rolls; enemies in Engagement Range after the Charge take a Battle-shock test, with a conditional -1.'),
        ability('Teleport Homer','One token placed before battle. Once, Rapid Ingress costs 1 CP less if arrival is within 3 inches of token and more than 8 inches from enemies; token is removed if enemy ends a move within 1 inch.'),
        ability('Storm Shield','An equipped model has Wounds 4 instead of 3.')
      ]),
      wargearOptions: Object.freeze([
        'Sergeant and ordinary Terminators: Storm Bolter and Power Fist; may exchange the pair for Storm Bolter and Power Weapon, Storm Bolter and Chainfist, Twin Lightning Claws, or Thunder Hammer and Storm Shield.',
        'Up to three heavy-weapon Terminators replace ordinary Terminators. They have Assault Cannon and Power Fist; Assault Cannon may become Heavy Flamer, Plasma Cannon, or Cyclone Missile Launcher and Storm Bolter. Power Fist may become Chainfist or Power Weapon.',
        'Cyclone Missile Launcher costs +10 points per model; Thunder Hammer and Storm Shield costs +5 points per model. Later copies of this squad may use a higher unit price.'
      ]),
      keywords: Object.freeze(['Infantry','Imperium','Terminator','Kill Team','Deathwatch Terminator Squad','Adeptus Astartes','Deathwatch']),
      sourceName: 'Warmind current 11e card, user screenshots 25 Nov 2026',
      sourceUrl, officialRulesCrossCheck:'pending-direct-october-codex'
    })
  })
]);
