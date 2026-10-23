// Custodes names and published points captured from the user's Warhammer App
// export.  Datasheet combat profiles are intentionally absent until each unit
// is cross-checked; imports therefore preserve wargear as reviewable text.
const entries = [
  ['Blade Champion', 175, 1], ['Knight-Centura', 55, 1], ['Shield-Captain', 205, 1],
  ['Shield-Captain in Allarus Terminator Armour', 185, 1], ['Shield-Captain on Dawneagle Jetbike', 205, 1],
  ['Trajann Valoris', 265, 1], ['Custodian Guard Sodality', 240, 3], ['Sentinel Guard Sodality', 240, 3],
  ['Anathema Psykana Rhino', 70, 1], ['Allarus Custodians', 180, 2],
  ['Aquilon Terminators with Solarite Power Gauntlets', 285, 3], ['Aquilon Terminators with Solarite Power Talons', 275, 3],
  ['Ares Gunship', 580, 1], ['Caladius Annihilator Grav-Tank', 250, 1], ['Caladius Grav-Tank', 230, 1],
  ['Contemptor-Achillus Dreadnought', 230, 1], ['Contemptor-Galatus Dreadnought', 220, 1], ['Coronus Grav-Carrier', 225, 1],
  ['Custodian Wardens', 200, 2], ['Gyrfalcon Jetbike Sodality', 260, 2], ['Orion Assault Dropship', 690, 1],
  ['Pallas Grav-Attack', 135, 1], ['Prosecutor Squad', 45, 4], ['Telemon Heavy Dreadnought', 280, 1],
  ['Venatari with Kinetic Destroyers', 255, 3], ['Venatari with Verutum Lances', 270, 3],
  ['Vertus Praetors', 220, 2], ['Vigilator Squad', 50, 4], ['Witchseeker Squad', 55, 4]
];

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const ADEPTUS_CUSTODES_ARMY_CATALOG = Object.freeze(entries.map(([name, points, models]) => Object.freeze({
  id: `adeptus-custodes:${slug(name)}`,
  name,
  faction: 'Adeptus Custodes',
  defaultModelCount: models,
  defaultPoints: points,
  pointsOptions: [{ models, points }],
  sourceName: 'Warhammer App export supplied for 40K Tactics Custodes expansion',
  sourceUrl: 'https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/',
  verificationStatus: 'points-reviewed',
  officialRulesCrossCheck: 'pending'
})));
