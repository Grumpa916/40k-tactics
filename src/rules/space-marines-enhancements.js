import { SPACE_MARINES_CURRENT_ENHANCEMENTS } from '../data/space-marines-enhancements.js';
import { getRosterDetachmentNames } from './roster-detachment-selection.js';
import { resolveBuilderUnitCost } from './army-builder-cost.js';
const norm=v=>String(v??'').trim().toLowerCase();
const names=unit=>(unit?.unitUpgrades??[]).map(item=>typeof item==='string'?item:item?.id??item?.name).filter(Boolean);
const keys=unit=>[...(unit?.datasheet?.keywords??[]),...(unit?.keywords??[])].map(norm);
const isAstartes=unit=>String(unit?.datasheetId??'').startsWith('space-marines:');
export function getSpaceMarineEnhancementDefinition(input,detachment=null){
  const entry=typeof input==='string'?{id:input,name:input}:input??{};
  if(entry.detachment)detachment=entry.detachment;
  return SPACE_MARINES_CURRENT_ENHANCEMENTS.find(def=>def.id===entry.id) ??
    (detachment?SPACE_MARINES_CURRENT_ENHANCEMENTS.find(def=>def.name===entry.name&&def.detachment===detachment):null) ??
    (SPACE_MARINES_CURRENT_ENHANCEMENTS.filter(def=>def.name===entry.name).length===1
      ?SPACE_MARINES_CURRENT_ENHANCEMENTS.find(def=>def.name===entry.name):null);
}
export function getSpaceMarineEnhancementDefinitions(unit){
  return (unit?.unitUpgrades??[]).map(raw=>getSpaceMarineEnhancementDefinition(raw)).filter(Boolean);
}
export function getSpaceMarineEnhancementNames(unit){
  return (unit?.unitUpgrades??[]).map(x=>getSpaceMarineEnhancementDefinition(x)?.name ??
    (typeof x==='string'?x:x?.name??x?.id)).filter(Boolean);
}
export function getSpaceMarineEnhancementCost(unit){
  return getSpaceMarineEnhancementDefinitions(unit).reduce((sum,def)=>sum+def.points,0);
}
function hasRole(unit,key){
  const id=norm(unit?.datasheetId),name=norm(unit?.name);
  const wordset=keys(unit);
  const has=v=>wordset.some(word=>word===v||word.startsWith(v+' '));
  if(key==='adeptus astartes')return isAstartes(unit);
  if(key==='captain')return has('captain')||/\bcaptain\b/.test(name);
  if(key==='ancient')return has('ancient')||/\bancient\b/.test(name);
  if(key==='apothecary-biologis')return /apothecary-biologis/.test(id);
  if(key==='dreadnought')return has('dreadnought')||id.includes('dreadnought');
  if(key==='speeder')return has('speeder')||id.includes('speeder');
  if(key==='mounted')return has('mounted')||id.includes('bike')||id.includes('atvs');
  if(key==='vehicle')return has('vehicle');
  if(key==='infantry')return has('infantry');
  if(key==='phobos')return has('phobos')||id.includes('phobos');
  if(key==='gravis')return has('gravis')||id.includes('gravis')||id.includes('aggressor')||
    id.includes('heavy-intercessor')||id.includes('eradicator')||id.includes('inceptor');
  if(key==='terminator')return has('terminator')||id.includes('terminator');
  if(key==='tacticus')return has('tacticus')||id.includes('tacticus')||
    /space-marines:(?:captain|lieutenant|ancient|apothecary|intercessor|assault-intercessor|hellblaster|infernus|sternguard|desolation|bladeguard)/.test(id);
  if(key==='vehicle-excluding-transport-fly-walker')return has('vehicle') &&
    !['dedicated transport','fly','walker','dreadnought'].some(has);
  if(key==='infantry-or-mounted')return has('infantry')||hasRole(unit,'mounted');
  return has(key);
}
export function isEligibleSpaceMarineEnhancement(unit,def,roster=null){
  if(!isAstartes(unit) || !def)return false;
  const words=keys(unit);
  if(words.includes('epic hero'))return false;
  if(roster && !getRosterDetachmentNames(roster).includes(def.detachment))return false;
  // Standard Enhancements are given only to non-Epic Character units.
  if(!def.upgrade && !words.includes('character'))return false;
  return hasRole(unit,def.restriction);
}
export function getEligibleSpaceMarineEnhancements(unit,roster){
  return SPACE_MARINES_CURRENT_ENHANCEMENTS.filter(def=>isEligibleSpaceMarineEnhancement(unit,def,roster));
}
export function validateSpaceMarineEnhancements(roster){
  if(norm(roster?.faction)!=='space marines')return [];
  const errors=[],copies=new Map(),assigned=new Set(),units=roster?.units??[];
  const detachments=new Set(getRosterDetachmentNames(roster));
  let counted=0;
  for(const unit of units){
    const raw=(unit.unitUpgrades??[]).filter(Boolean);
    if(raw.length>1)errors.push((unit.name??unit.id)+': maximum one Enhancement per unit.');
    if(raw.length)assigned.add(unit.id);
    for(const entry of raw){
      const def=getSpaceMarineEnhancementDefinition(entry);
      if(!def){errors.push((unit.name??unit.id)+': unknown or ambiguous Space Marines enhancement '+JSON.stringify(entry));continue;}
      if(!detachments.has(def.detachment))errors.push(def.name+' requires '+def.detachment+'.');
      if(!isEligibleSpaceMarineEnhancement(unit,def,roster))errors.push((unit.name??unit.id)+' is not an eligible bearer of '+def.name+'.');
      copies.set(def.id,(copies.get(def.id)??0)+1);
    }
    if(raw.length && Number.isFinite(unit.basePoints) && Number.isFinite(unit.points) &&
      unit.points!==unit.basePoints+getSpaceMarineEnhancementCost(unit)){
      errors.push((unit.name??unit.id)+': total points do not include the correct enhancement cost.');
    }
  }
  for(const [id,count] of copies){
    const def=SPACE_MARINES_CURRENT_ENHANCEMENTS.find(item=>item.id===id);
    const max=def?.upgrade?3:1;
    if(count>max)errors.push(def.name+': maximum '+max+' '+(max===1?'copy':'copies')+' per army.');
    counted+=def.upgrade?1:count;
  }
  const limit=Number(roster?.pointsLimit)>0 && Number(roster.pointsLimit)<=1000?2:4;
  if(counted>limit)errors.push('Space Marines Enhancement limit: '+counted+' of '+limit+'.');
  for(const unit of units){
    if(!assigned.has(unit.id))continue;
    for(const otherId of [unit.attachedToBodyguardId,...(unit.attachedLeaderIds??[])].filter(Boolean)){
      if(assigned.has(otherId))errors.push('An attached Space Marines unit cannot have two enhancements: '+(unit.name??unit.id)+'.');
    }
  }
  return [...new Set(errors)];
}
export function setSpaceMarineEnhancement(roster,unitId,selectedId,{basePoints=null}={}){
  if(norm(roster?.faction)!=='space marines')throw new Error('A Space Marines roster is required.');
  const unit=roster.units?.find(u=>u.id===unitId);
  if(!unit)throw new Error('Unit not found in roster.');
  const selected=String(selectedId??'').trim();
  const def=selected?getSpaceMarineEnhancementDefinition(selected):null;
  if(selected&&!def)throw new Error('Choose a published Space Marines enhancement.');
  const calculated=resolveBuilderUnitCost(unit,roster,unit.equippedWargear??[]);
  const inferred=Number.isFinite(unit.basePoints)?unit.basePoints:
    Number.isFinite(unit.points)?unit.points-getSpaceMarineEnhancementCost(unit):null;
  const base=Number.isFinite(basePoints)?basePoints:calculated.points??inferred;
  if(!Number.isFinite(base)||base<0)throw new Error('Confirm the base unit price before choosing an enhancement.');
  const upgraded={...unit,basePoints:base,points:base+(def?.points??0),unitUpgrades:
    def?[{id:def.id,name:def.name,detachment:def.detachment,points:def.points,upgrade:def.upgrade}]:[]};
  const updated={...roster,units:roster.units.map(u=>u.id===unitId?upgraded:u)};
  const errors=validateSpaceMarineEnhancements(updated);
  if(errors.length)throw new Error(errors.join(' '));
  return updated;
}
