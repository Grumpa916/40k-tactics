/**
 * Limited 11th-edition Codex: Space Marines characteristic corrections.
 *
 * Games Workshop explicitly confirmed Tacticus Toughness 5, Terminator
 * Toughness 6, and Phobos Move 8"/Toughness 4 before the Codex launch.
 * Do not extrapolate unprinted weapon numbers or change saved equipment.
 *
 * https://www.warhammer-community.com/en-gb/articles/bbnskauh/big-space-marines-news/
 * https://www.warhammer-community.com/en-gb/articles/rylbvfnv/warhammer-40000-balance-update-emboldened-astartes/
 */
const codexGroup=(units,changes)=>units.map(name=>[name,Object.freeze(changes)]);
const changes=Object.fromEntries([
  ...codexGroup([
    'Intercessor Squad','Assault Intercessor Squad','Hellblaster Squad',
    'Infernus Squad','Desolation Squad','Sternguard Veteran Squad'
  ],{Toughness:'5'}),
  ...codexGroup(['Terminator Squad','Terminator Assault Squad'],{Toughness:'6'}),
  ...codexGroup([
    'Incursor Squad','Infiltrator Squad','Reiver Squad','Eliminator Squad',
    'Captain in Phobos Armour','Librarian in Phobos Armour',
    'Lieutenant in Phobos Armour'
  ],{Move:'8"',Toughness:'4'})
]);

export const SPACE_MARINES_CODEX_CHARACTERISTIC_CORRECTIONS=Object.freeze(changes);

export function applyReviewedSpaceMarineCharacteristics(name,datasheet) {
  if (!datasheet) return null;
  const patch=changes[name];
  if (!patch) return datasheet;
  return Object.freeze({
    ...datasheet,
    characteristics:Object.freeze({...(datasheet.characteristics??{}),...patch})
  });
}
