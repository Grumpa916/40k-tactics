import { TYRANID_ENHANCEMENTS, TYRANID_ENHANCEMENTS_BY_NAME } from '../data/tyranid-enhancements.js';
import { getRosterDetachmentNames } from './roster-detachment-selection.js';
import { resolveBuilderUnitCost } from './army-builder-cost.js';

const norm=v=>String(v??'').trim().toLowerCase();
const unitId=u=>norm(u?.datasheetId).replace(/^tyranids:/,'');
const keywords=u=>[...(u?.datasheet?.keywords??[]),...(u?.keywords??[])]
  .map(norm);
export const getTyranidEnhancementDefinition=value=>
  TYRANID_ENHANCEMENTS_BY_NAME[String(value??'')] ??
  TYRANID_ENHANCEMENTS.find(item=>item.id===String(value??'')) ?? null;
export function getTyranidEnhancementNames(unit){
  return (unit?.unitUpgrades??[]).map(item=>typeof item==='string'?item:item?.name??item?.id)
    .filter(Boolean).map(value=>getTyranidEnhancementDefinition(value)?.name).filter(Boolean);
}
export function getTyranidEnhancementCost(unit){
  return getTyranidEnhancementNames(unit).reduce((sum,name)=>sum+(getTyranidEnhancementDefinition(name)?.points??0),0);
}
export function isEligibleTyranidEnhancementBearer(unit, enhancement,roster=null){
  const def=typeof enhancement==='string'?getTyranidEnhancementDefinition(enhancement):enhancement;
  if(!def||!unitId(unit)||!norm(unit?.datasheetId).startsWith('tyranids:'))return false;
  const keys=keywords(unit);
  if(keys.includes('epic hero'))return false;
  if(roster && !getRosterDetachmentNames(roster).includes(def.detachment))return false;
  const root=unitId(unit);
  if(!def.restriction.some(word=>word==='tyranids'||word===root||keys.includes(word)))return false;
  if(def.name==='Regenerating Monstrosity'&&keys.includes('monster'))return false;
  if(def.upgrade)return true;
  return keys.includes('character')||
    (root==='trygon'&&getRosterDetachmentNames(roster).includes('Subterranean Assault')&&unit?.subterraneanCharacter===true);
}
const unitLabel=unit=>String(unit.name??unit.id??'Unit');
export function validateTyranidRosterEnhancements(roster){
  if(norm(roster?.faction)!=='tyranids')return [];
  const errors=[], byName=new Map(), units=roster?.units??[];
  let counted=0;
  const selected=getRosterDetachmentNames(roster);
  let characterTrygons=0;
  const enhancedIds=new Set();
  for(const unit of units){
    if(unitId(unit)==='trygon'&&unit.subterraneanCharacter===true){
      characterTrygons++;
      if(!selected.includes('Subterranean Assault'))errors.push(unitLabel(unit)+': Trygon CHARACTER designation requires Subterranean Assault.');
    }
    const assigned=(unit.unitUpgrades??[]).map(item=>typeof item==='string'?item:item?.name??item?.id).filter(Boolean);
    if(assigned.length>1)errors.push(unitLabel(unit)+': a unit cannot have more than one Enhancement or Upgrade.');
    if(assigned.length)enhancedIds.add(unit.id);
    for(const name of assigned){
      const def=getTyranidEnhancementDefinition(name);
      if(!def){errors.push(unitLabel(unit)+': unknown Tyranid enhancement '+name+'.');continue;}
      if(!selected.includes(def.detachment))errors.push(unitLabel(unit)+': '+def.name+' requires '+def.detachment+'.');
      if(!isEligibleTyranidEnhancementBearer(unit,def,roster))
        errors.push(unitLabel(unit)+': ineligible bearer for '+def.name+'.');
      byName.set(def.name,(byName.get(def.name)??0)+1);
    }
    const cost=getTyranidEnhancementCost(unit);
    if(assigned.length && Number.isFinite(unit.basePoints)&&Number.isFinite(unit.points) &&
        unit.points!==unit.basePoints+cost)
      errors.push(unitLabel(unit)+': saved points must include '+cost+' enhancement points.');
  }
  if(characterTrygons>2)errors.push('Subterranean Assault allows at most two Trygons to gain CHARACTER.');
  for(const [name,count] of byName){
    const def=getTyranidEnhancementDefinition(name);
    if(count>(def?.upgrade?3:1))errors.push(name+': maximum '+(def?.upgrade?3:1)+' per army.');
    counted+=def?.upgrade?1:count;
  }
  const limit=Number(roster?.pointsLimit)>0&&Number(roster.pointsLimit)<=1000?2:4;
  if(counted>limit)errors.push('Enhancement count '+counted+' exceeds '+limit+' for this battle size.');
  // A leader attached to a bodyguard with its own Enhancement cannot carry another.
  for(const unit of units){
    if(!enhancedIds.has(unit.id))continue;
    const groupIds=[unit.attachedToBodyguardId,...(unit.attachedLeaderIds??[])].filter(Boolean);
    for(const other of groupIds)if(enhancedIds.has(other))
      errors.push(unitLabel(unit)+': attached unit cannot have two Enhancements.');
  }
  return [...new Set(errors)];
}

/** Save the chosen enhancement without mutating other units or guessing unresolved costs. */
export function setTyranidEnhancement(roster,unitIdToChange,nameOrId,options={}){
  if(norm(roster?.faction)!=='tyranids')throw new Error('A Tyranids army is required.');
  const selected=String(nameOrId??'').trim();
  const def=selected?getTyranidEnhancementDefinition(selected):null;
  if(selected&&!def)throw new Error('Unknown Tyranid enhancement.');
  const original=(roster?.units??[]).find(unit=>unit.id===unitIdToChange);
  if(!original)throw new Error('Select a roster unit before assigning an enhancement.');
  const updatedUnit={...original,...(options.subterraneanCharacter!==undefined
    ? {subterraneanCharacter:options.subterraneanCharacter===true}: {})};
  const explicitBase=Number.isFinite(options.basePoints)?options.basePoints:null;
  const calculated=resolveBuilderUnitCost(updatedUnit,roster,updatedUnit.equippedWargear??[]);
  const oldCost=getTyranidEnhancementCost(original);
  const base=explicitBase??calculated.points??(Number.isFinite(original.basePoints)
    ? original.basePoints:Number.isFinite(original.points)?original.points-oldCost:null);
  if(base===null||!Number.isFinite(base)||base<0)throw new Error('Confirm this unit base price before assigning its enhancement.');
  const replacement={
    ...updatedUnit,
    basePoints:base,
    points:base+(def?.points??0),
    unitUpgrades:def?[{id:def.id,name:def.name,points:def.points,detachment:def.detachment,upgrade:def.upgrade}]:[]
  };
  const next={...roster,units:roster.units.map(unit=>unit.id===unitIdToChange?replacement:unit)};
  const errors=validateTyranidRosterEnhancements(next);
  if(errors.length)throw new Error(errors.join(' '));
  return next;
}
export function getEligibleTyranidEnhancements(unit,roster){
  return TYRANID_ENHANCEMENTS.filter(x=>isEligibleTyranidEnhancementBearer(unit,x,roster));
}
