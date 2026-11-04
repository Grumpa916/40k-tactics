/**
 * Source-scoped 11th edition combat-profile corrections for the 3 units
 * whose selectable loadouts were reviewed in this pass. Avoid changing
 * the generated community-reference projection in place.
 *
 * October 2026 Codex profiles cross-checked with current 11e datasheet
 * reference; official June 2026 Faction Pack corroborates mandatory
 * heavy-bolter Eradicator equipment but predates the October Codex.
 */
const ranged=(name,range,attacks,skill,strength,ap,damage,abilities)=>Object.freeze({name,range,attacks,skill,strength,ap,damage,abilities});
const melee=(name,attacks,skill,strength,ap,damage,abilities)=>ranged(name,'Melee',attacks,skill,strength,ap,damage,abilities);
const ability=(name,description)=>Object.freeze({name,description});
const changes=Object.freeze({
  'Intercessor Squad':Object.freeze({
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Bolt Rifle - Focused Fire','24"','1','3+','6','-1','2','Heavy, Rapid Fire 1'),
      ranged('Bolt Rifle - Saturation','24"','2','3+','5','-1','1','Assault, Rapid Fire 1'),
      ranged('Grenade Launcher - Frag','24"','4','3+','4','-1','1','Blast 1'),
      ranged('Grenade Launcher - Krak','24"','1','3+','10','-2','3','Rapid Fire 1'),
      ranged('Hand Flamer','9"','3','N/A','4','0','1','Close-Quarters, Torrent'),
      ranged('Plasma Pistol - Standard','12"','1','3+','7','-2','1','Close-Quarters'),
      ranged('Plasma Pistol - Supercharge','12"','1','3+','8','-3','2','Close-Quarters, Hazardous'),
      melee('Knives and Fists','3','3+','5','0','1',''),
      melee('Chainsword','5','3+','5','-1','1',''),
      melee('Power Fist','3','3+','8','-2','2',''),
      melee('Power Weapon','4','3+','5','-2','1',''),
      melee('Thunder Hammer','3','4+','8','-2','3','Devastating Wounds')
    ]),
    abilities:Object.freeze([
      ability('Bolter Discipline','During the Shooting phase, ranged attacks gain +1 to Hit when the unit or target is within range of an objective marker.'),
      ability('Tactical Mainstay','Being engaged or Battle-shocked does not prevent this unit starting a tabletop action, and starting an action does not stop it shooting.')
    ])
  }),
  'Eradicator Squad with Melta Rifles':Object.freeze({
    weapons:Object.freeze([
      ranged('Bolt Pistol','12"','1','3+','5','-1','1','Close-Quarters'),
      ranged('Melta Rifle','18"','1','3+','10','-3','D3+2','Melta 2'),
      ranged('Melta Rifle - Hunter','18"','1','2+','12','-3','D3+2','Melta 2, Hunter: Monster/Vehicle only'),
      ranged('Multi-melta','18"','2','3+','10','-3','D3+2','Melta 3'),
      ranged('Multi-melta - Hunter','18"','2','2+','12','-3','D3+2','Melta 3, Hunter: Monster/Vehicle only'),
      melee('Ceramite Fists','3','3+','5','0','1','')
    ]),
    abilities:Object.freeze([
      ability('Total Obliteration','This unit’s ranged attacks can re-roll their Damage rolls. Confirm any roll changes at the tabletop.')
    ])
  }),
  'Aggressor Squad':Object.freeze({
    weapons:Object.freeze([
      ranged('Flamestorm Gauntlets - Close Quarters','12"','3','N/A','4','-1','1','Close-Quarters, Torrent, Twin-linked'),
      ranged('Flamestorm Gauntlets - Ranged','12"','3','N/A','4','-1','1','Blast 2, Torrent, Twin-linked'),
      ranged('Auto Boltstorm Gauntlets','18"','3','3+','5','-1','1','Close-Quarters, Twin-linked'),
      ranged('Fragstorm Grenade Launcher','18"','3','3+','4','-1','1','Blast 1'),
      melee('Twin Power Fists','3','3+','8','-2','2','Twin-linked')
    ]),
    abilities:Object.freeze([ability('Close-quarters Firestorm','This unit’s attacks that target an enemy unit within 9" have +1 Strength.')])
  }),
  'Terminator Assault Squad':Object.freeze({
    weapons:Object.freeze([
      melee('Twin Lightning Claws','6','3+','5','-2','1','Twin-linked'),
      melee('Thunder Hammer','3','3+','8','-2','3','Devastating Wounds')
    ]),
    abilities:Object.freeze([
      ability('Teleport Homer','Once per battle, use the deployed Teleport Homer to reduce Rapid Ingress CP cost by 1; follow the placement and 8-inch enemy-exclusion conditions on the current datasheet.'),
      ability('Terminatus Assault','After this unit charges, Lightning Claws gain Sustained Hits 1 against non-Monster/Vehicle targets; Thunder Hammers gain Sustained Hits 1 against Monster/Vehicle targets.'),
      ability('Storm Shield','Only models equipped with a Storm Shield have +1 W. Track each affected model manually in mixed units.')
    ])
  }),
  'Eradicator Squad with Heavy Bolters':Object.freeze({
    weapons:Object.freeze([
      ranged('Bolt pistol','12"','1','3+','4','0','1','Close-Quarters'),
      ranged('Heavy Bolter','36"','3','3+','5','-1','2','Heavy, Sustained Hits 1'),
      melee('Close combat weapon','3','3+','4','0','1','')
    ]),
    abilities:Object.freeze([ability('Overlapping Detonations','In your Shooting phase, select a visible enemy non-Monster/Vehicle unit; this unit’s heavy bolters have Blast 1 when targeting it.')])
  })
});
export const SPACE_MARINES_REVIEWED_PROFILE_PATCHES=changes;
export function applyReviewedSpaceMarineWargearProfiles(name,datasheet) {
 if(!datasheet || !changes[name])return datasheet;
 const patch=changes[name];
 return Object.freeze({
   ...datasheet,
   weapons:patch.weapons,
   abilities:patch.abilities,
   sourceName:'November 2026 11e selected loadout/profile cross-check',
   sourceUrl:'https://www.wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html',
   officialOctoberCodexFullTextVerified:false,
   profileReviewedAt:'2026-11-03'
 });
}
