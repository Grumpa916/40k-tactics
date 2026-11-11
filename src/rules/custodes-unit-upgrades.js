import { ADEPTUS_CUSTODES_DETACHMENTS } from '../data/adeptus-custodes-faction-rules.js';
import { getRosterDetachmentNames } from './roster-detachment-selection.js';

const DETACHMENT='Might of the Moritoi';
const source=ADEPTUS_CUSTODES_DETACHMENTS.find(item=>item.name===DETACHMENT);
export const MORITOI_UPGRADES=Object.freeze((source?.enhancements??[])
  .filter(item=>['Memento Moritoi','Augury Uplink'].includes(item.name))
  .map(item=>Object.freeze({
    id:item.name.toLowerCase().replaceAll(' ','-'),
    name:item.name,
    points:item.points,
    detachment:DETACHMENT,
    description:item.description,
    restriction:'ADEPTUS CUSTODES DREADNOUGHT model only',
    maxPerArmy:1
  })));
const byName=new Map(MORITOI_UPGRADES.map(item=>[item.name,item]));
const byId=new Map(MORITOI_UPGRADES.map(item=>[item.id,item]));
const lower=v=>String(v??'').toLowerCase().trim();
const clean=v=>String(v??'').trim();
export function getUnitUpgradeDefinition(nameOrId){return byName.get(nameOrId)??byId.get(nameOrId)??null;}
export function getUnitUpgradeNames(unit) {
  return (Array.isArray(unit?.unitUpgrades)?unit.unitUpgrades:[])
    .map(item=>typeof item==='string'?item:item?.name??item?.id)
    .filter(Boolean).map(value=>getUnitUpgradeDefinition(value)?.name??String(value));
}
export function getUnitUpgradeCost(unit) {
  return getUnitUpgradeNames(unit).reduce((sum,name)=>sum+(getUnitUpgradeDefinition(name)?.points??0),0);
}
export function isEligibleMoritoiDreadnought(unit) {
  const id=lower(unit?.datasheetId);
  const words=[...(unit?.datasheet?.keywords??[]),...(unit?.keywords??[])].map(lower);
  return id.startsWith('adeptus-custodes:') &&
    (words.includes('dreadnought') || /(?:contemptor|telemon|achillus|galatus|dreadnought)/.test(id)) &&
    !words.includes('epic hero');
}
export function validateRosterUnitUpgrades(roster) {
  const errors=[],units=Array.isArray(roster?.units)?roster.units:[];
  const allowed=lower(roster?.faction)==='adeptus custodes' &&
    getRosterDetachmentNames(roster).includes(DETACHMENT);
  const byUpgrade=new Map();
  for (const unit of units) {
    const upgrades=getUnitUpgradeNames(unit);
    if(upgrades.length>1)errors.push((unit.name??unit.id)+': only one enhancement or Upgrade may be assigned to a unit.');
    const seen=new Set();
    for (const name of upgrades) {
      const definition=getUnitUpgradeDefinition(name);
      if(!definition){errors.push((unit.name??unit.id)+': unknown Unit Upgrade '+name+'.');continue;}
      if(!allowed)errors.push((unit.name??unit.id)+': '+name+' requires the '+DETACHMENT+' detachment.');
      if(!isEligibleMoritoiDreadnought(unit))errors.push((unit.name??unit.id)+': '+name+' requires an Adeptus Custodes Dreadnought.');
      if(seen.has(name))errors.push((unit.name??unit.id)+': '+name+' is selected twice.');
      seen.add(name);
      byUpgrade.set(name,(byUpgrade.get(name)??0)+1);
    }
    if(upgrades.length && Number.isFinite(unit.basePoints)){
      const expected=unit.basePoints+getUnitUpgradeCost(unit);
      if(unit.points!==expected)errors.push((unit.name??unit.id)+': total cost should be '+expected+' points including selected upgrades.');
    }
  }
  for(const [name,count] of byUpgrade)if(count>1){
    errors.push(name+' can only be taken once per army (currently assigned '+count+' times).');
  }
  return errors;
}

function publishedBasePoints(unit,totalUpgradeCost=0) {
  const options=(unit?.pointsOptions??[]).filter(item=>item?.models===unit?.modelCount&&Number.isFinite(item.points));
  // When an imported unit already costs 250 = 220 base + 30 Upgrade,
  // recover the base only when the points evidence is unambiguous.
  const match=options.filter(item=>item.points+totalUpgradeCost===unit.points);
  const unique=[...new Set(match.map(item=>item.points))];
  return unique.length===1?unique[0]:null;
}
export function setMoritoiUpgrade(roster,unitId,nameOrId) {
  const existing=roster?.units?.find(unit=>unit.id===unitId);
  if(!existing)throw new Error('Select a saved unit before assigning an upgrade.');
  const nextName=clean(nameOrId);
  const def=nextName?getUnitUpgradeDefinition(nextName):null;
  if(nextName&&!def)throw new Error('Unknown Custodes unit upgrade.');
  const currentCost=getUnitUpgradeCost(existing);
  // basePoints always represents the pre-upgrade MFM/copy-order cost.
  // Reconcile older imports with already-inclusive 250/310-point totals.
  const unambiguous=def&&!existing.unitUpgrades?.length
    ? publishedBasePoints(existing,def.points):null;
  const base=Number.isFinite(existing.basePoints)
    ? existing.basePoints
    : unambiguous??(Number.isFinite(existing.points)?existing.points-currentCost:null);
  if(base===null||base<0)throw new Error('Set and verify the unit’s base points cost before assigning an upgrade.');
  const upgrade=def?[{id:def.id,name:def.name,points:def.points,detachment:def.detachment}]:[];
  const units=roster.units.map(unit=>unit.id===unitId
    ? {...unit,basePoints:base,unitUpgrades:upgrade,points:base+(def?.points??0)}
    : unit);
  const updated={...roster,units};
  const problems=validateRosterUnitUpgrades(updated);
  if(problems.length)throw new Error(problems.join(' '));
  return updated;
}
export function reconcileUpgradePoints(unit) {
  if(!unit?.unitUpgrades?.length)return unit;
  const cost=getUnitUpgradeCost(unit);
  const base=Number.isFinite(unit.basePoints)?unit.basePoints
    : publishedBasePoints(unit,cost);
  if(base===null||!Number.isFinite(base)||base<0)return unit;
  return {...unit,basePoints:base,points:base+cost};
}
export function detectImportMoritoiUpgrade(line) {
  const normalized=clean(line).replace(/^[•◦·*]\s*/,'')
    .replace(/^\d+\s*[x×]\s*/i,'')
    .replace(/\s*\(\d+\s*(?:pts?|points?)\)\s*$/i,'')
    .replace(/\s*\(one per army\)\s*/i,'').trim();
  return getUnitUpgradeDefinition(normalized);
}
