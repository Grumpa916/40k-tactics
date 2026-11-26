// Source: player-supplied Warmind 11th-edition screenshots, 25 November 2026.
// Distinct from the ordinary Terminator Squad: up to three heavy weapons per
// five models, plasma cannon, Terminatus Assault, and different melee swaps.
const weapon = (name, range, attacks, skill, strength, ap, damage, abilities = '') =>
  Object.freeze({ name, range, attacks, skill, strength, ap, damage, abilities });
const melee = (name, attacks, skill, strength, ap, damage, abilities = '') =>
  weapon(name, 'Melee', attacks, skill, strength, ap, damage, abilities);
const ability = (name, description) => Object.freeze({ name, description });

export const DEATHWATCH_TERMINATOR_DATASHEET = Object.freeze({
  name: 'Deathwatch Terminator Squad',
  characteristics: Object.freeze({
    Move: '5"', Toughness: '6', Save: '2+', 'Invulnerable save': '4+',
    Wounds: '3', Leadership: '6+', 'Objective Control': '1'
  }),
  weapons: Object.freeze([
    weapon('Assault Cannon', '24"', '6', '3+', '6', '-2', '1', 'Sustained Hits 1'),
    weapon('Cyclone Missile Launcher - Frag', '36"', '8', '3+', '4', '-1', '1', 'Blast 2'),
    weapon('Cyclone Missile Launcher - Krak', '36"', '2', '3+', '10', '-2', 'D3+3'),
    weapon('Heavy Flamer', '12"', '3', 'N/A', '5', '-1', '1', 'Blast 2, Torrent'),
    weapon('Plasma Cannon - Standard', '36"', '3', '3+', '9', '-2', '2', 'Blast 1'),
    weapon('Plasma Cannon - Supercharge', '36"', '3', '3+', '10', '-3', '3', 'Blast 1, Hazardous'),
    weapon('Storm Bolter', '24"', '2', '3+', '5', '-1', '1', 'Rapid Fire 2'),
    melee('Chainfist - Standard', '2', '4+', '8', '-2', '2'),
    melee('Chainfist - Hunter', '3', '3+', '12', '-2', '3', 'Hunter: Monster/Vehicle only'),
    melee('Power Fist', '3', '3+', '8', '-2', '2'),
    melee('Power Weapon', '5', '3+', '5', '-2', '1'),
    melee('Thunder Hammer', '3', '3+', '8', '-2', '3', 'Devastating Wounds'),
    melee('Twin Lightning Claws', '6', '3+', '5', '-2', '1', 'Twin-linked')
  ]),
  abilities: Object.freeze([
    ability('Terminatus Assault', 'Re-roll Charge rolls for this unit. After it finishes a Charge move, every enemy unit within Engagement Range takes a Battle-shock test; subtract 1 from the result if that enemy has neither the IMPERIUM nor CHAOS keyword.'),
    ability('Teleport Homer', 'Place one token before battle. When Rapid Ingress targets this unit, remove the token to reduce the stratagem cost by 1 CP; arrive within 3 inches of it and more than 8 inches from each enemy. Remove the token if an enemy ends a move within 1 inch.'),
    ability('Deep Strike', 'This unit has Deep Strike.'),
    ability('Storm Shield', 'Only an equipped model has Wounds 4; track mixed-model wounds on the tabletop.'),
    ability('Combat Doctrines', 'Use the army Combat Doctrines rule for this unit.')
  ]),
  keywords: Object.freeze(['Infantry', 'Imperium', 'Terminator', 'Kill Team', 'Deathwatch Terminator Squad', 'Faction: Adeptus Astartes', 'Faction: Deathwatch']),
  sourceName: 'Warmind 11th edition Deathwatch datasheet, user-supplied screenshots',
  sourceUrl: 'https://warmind.online/d/deathwatch/codex-terminator-squad',
  profileReviewedAt: '2026-11-25',
  officialOctoberCodexFullTextVerified: false
});

export const DEATHWATCH_TERMINATOR_CATALOG = Object.freeze({
  id: 'space-marines:deathwatch-terminator-squad',
  name: 'Deathwatch Terminator Squad',
  faction: 'Space Marines',
  defaultModelCount: 5, defaultPoints: 190,
  pointsOptions: Object.freeze([Object.freeze({ models: 5, points: 190 }), Object.freeze({ models: 10, points: 380 })]),
  datasheet: DEATHWATCH_TERMINATOR_DATASHEET,
  sourceName: DEATHWATCH_TERMINATOR_DATASHEET.sourceName,
  sourceUrl: DEATHWATCH_TERMINATOR_DATASHEET.sourceUrl,
  verificationStatus: 'source-reviewed',
  officialRulesCrossCheck: 'pending',
  officialPointsCrossCheck: 'pending-direct-current-mfm-read',
  selectableWargearCoverage: 'partial-model-pairing-review'
});

const pick = (name, profiles = [name]) => Object.freeze({ name, profiles: Object.freeze(profiles) });
const slot = (id, count, perModel, choices) => Object.freeze({
  id, count, perModel, choices: Object.freeze(choices)
});
const chainfist = pick('Chainfist', ['Chainfist - Standard', 'Chainfist - Hunter']);
const plasma = pick('Plasma Cannon', ['Plasma Cannon - Standard', 'Plasma Cannon - Supercharge']);
const cyclone = pick('Cyclone Missile Launcher and Storm Bolter', [
  'Cyclone Missile Launcher - Frag', 'Cyclone Missile Launcher - Krak', 'Storm Bolter'
]);

export const DEATHWATCH_TERMINATOR_WARGEAR = Object.freeze({
  reviewedAt: '2026-11-25',
  sourceName: DEATHWATCH_TERMINATOR_DATASHEET.sourceName,
  sourceUrl: DEATHWATCH_TERMINATOR_DATASHEET.sourceUrl,
  verificationLevel: 'current-11e-datasheet-cross-check',
  slots: Object.freeze([
    slot('sergeant-ranged', 1, 0, [pick('Storm Bolter'), pick('No ranged weapon', [])]),
    slot('sergeant-melee', 1, 0, [pick('Power Fist'), chainfist, pick('Power Weapon'), pick('Twin Lightning Claws'), pick('Thunder Hammer and Storm Shield', ['Thunder Hammer'])]),
    slot('terminator-ranged', -1, 1, [pick('Storm Bolter'), pick('Assault Cannon'), pick('Heavy Flamer'), plasma, cyclone, pick('No ranged weapon', [])]),
    slot('terminator-melee', -1, 1, [pick('Power Fist'), chainfist, pick('Power Weapon'), pick('Twin Lightning Claws'), pick('Thunder Hammer and Storm Shield', ['Thunder Hammer'])])
  ]),
  constraints: Object.freeze([Object.freeze({
    type: 'max-combined-per-models',
    selections: Object.freeze(['Assault Cannon', 'Heavy Flamer', 'Plasma Cannon', 'Cyclone Missile Launcher and Storm Bolter']),
    models: 5, maxEach: 3
  })]),
  modelSpecificWargear: Object.freeze([Object.freeze({
    selection: 'Thunder Hammer and Storm Shield',
    effect: 'Equipped model has Wounds 4, +5 points. Pair this weapon with its shield on the same model.',
    automaticVitalsApplied: false
  })]),
  manualWargearNotes: Object.freeze([
    'Five models: one Sergeant plus four Terminators. Up to three non-Sergeant Terminators per five models can exchange their storm bolter for a heavy weapon.',
    'Cyclone replaces the assault cannon and includes a storm bolter; Frag and Krak are alternative modes of one launcher. Plasma Standard and Supercharge are alternative modes of one cannon.',
    'A Sergeant or ordinary Terminator swaps its storm bolter and power fist as a pair for a storm bolter/chainfist, storm bolter/power weapon, twin lightning claws, or thunder hammer/storm shield. Confirm paired choices on each physical model; the shared builder slot validator cannot enforce the two slots as a pair.',
    'A heavy weapon Terminator may swap its power fist for a chainfist or power weapon. Storm Shields grant W4 to individual bearers only. Track Teleport Homer, charge re-rolls and Battle-shock manually.'
  ])
});
