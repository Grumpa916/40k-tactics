import { matchWargearSelection } from './wargear-loadout-validation.js';

// These size-changing fixed-loadout units have one of each selection per model,
// verified by the current App export fixture. Mixed/optional loadouts use slot rules.
const PER_MODEL_FIXED = new Set([
 'tyranids:gargoyles','tyranids:hormagaunts','tyranids:barbgaunts','tyranids:biovores',
 'tyranids:genestealers','tyranids:neurogaunts','tyranids:pyrovores',
 'tyranids:tyranid-warriors-with-melee-bio-weapons','tyranids:venomthropes',
 'tyranids:von-ryan-s-leapers','tyranids:zoanthropes'
]);
export function resizeBuilderFixedEquipment(unit) {
 if(!PER_MODEL_FIXED.has(unit.datasheetId))return unit;
 const names=unit.equippedWargear?.length?unit.equippedWargear.map(item=>item.name):
  [...new Set((unit.datasheet?.weapons??[]).filter(weapon=>weapon.equipment==='Default').map(weapon=>weapon.name.replace(/\s*\([^)]*\)\s*$/,'')))];
 const equippedWargear=[],equippedWeapons=[];
 for(const name of names){
  const match=matchWargearSelection({datasheetId:unit.datasheetId,datasheet:unit.datasheet,sourceName:name});
  if(!match)throw new Error(`${name}: profile needs review before changing unit size.`);
  equippedWargear.push({name:match.name,quantity:unit.modelCount,profileNames:match.profileNames,sourceName:'Army Builder',match:match.match});
  for(const profileName of match.profileNames)equippedWeapons.push({name:profileName,selectionName:match.name,quantity:unit.modelCount,sourceName:'Army Builder'});
 }
 return {...unit,equippedWargear,equippedWeapons,loadoutValidation:{status:'profile-matched',reviewedRules:false,source:'manual-army-builder',errors:[]}};
}
