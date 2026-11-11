import { getAdeptusCustodesDatasheetDetails } from '../data/adeptus-custodes-datasheet-details.js';
import { getTyranidWargearRuleSet } from '../data/tyranid-wargear-rules.js';
import { buildManualWargearLoadout, normalizeWargearName } from './wargear-loadout-validation.js';

// The only automatic option is one in which the reviewed datasheet has no
// alternative loadout. Optional equipment, including Vexilla, remains a player
// choice even when every weapon is otherwise mandatory.
export function isReviewedFixedCustodesLoadout(unit) {
  if (!unit?.datasheetId?.startsWith('adeptus-custodes:')) return false;
  const rules=getTyranidWargearRuleSet(unit.datasheetId);
  return Boolean(rules?.fixed?.length &&
    !rules.slots?.length && !rules.optional?.length && !rules.constraints?.length);
}

export function hydrateReviewedFixedCustodesLoadout(unit) {
  if (!isReviewedFixedCustodesLoadout(unit)) return unit;
  // Never hide an invalid export, unknown weapon, or unresolved source line.
  if ((unit.unmatchedWargear?.length ?? 0) ||
      ['source-invalid','unverified'].includes(unit.loadoutValidation?.status)) return unit;

  const rules=getTyranidWargearRuleSet(unit.datasheetId);
  const sheet=unit.datasheet ?? getAdeptusCustodesDatasheetDetails(unit.datasheetId);
  const available=new Set((sheet?.weapons ?? []).map(weapon=>weapon.name));
  if (!available.size || rules.fixed.some(item =>
      (item.profiles ?? [item.name]).some(profile=>!available.has(profile)))) return unit;

  const count=Number(unit.modelCount);
  if (!Number.isInteger(count) || count<1) return unit;
  const expected=rules.fixed.map(item=>({
    name:item.name,quantity:(item.count??0)+(item.perModel??0)*count
  }));
  if (expected.some(item=>!Number.isInteger(item.quantity)||item.quantity<1)) return unit;

  const quantities=new Map(expected.map(item=>[normalizeWargearName(item.name),item.quantity]));
  const actual=new Map();
  for(const item of unit.equippedWargear??[]){
    const name=normalizeWargearName(item.name);
    const quantity=Number(item.quantity);
    if(!quantities.has(name)||!Number.isInteger(quantity)||quantity<1)return unit;
    actual.set(name,(actual.get(name)??0)+quantity);
    if(actual.get(name)>quantities.get(name))return unit;
  }
  const knownProfiles=new Set(rules.fixed.flatMap(item=>(item.profiles??[item.name]).map(normalizeWargearName)));
  for(const item of unit.equippedWeapons??[]){
    if(!knownProfiles.has(normalizeWargearName(item.name))||
       !Number.isInteger(Number(item.quantity))||Number(item.quantity)<1)return unit;
  }

  // Even if an export lists only the ranged weapon, fixed melee weapons are
  // guaranteed and can be added. A partially reported selectable loadout cannot.
  const complete=expected.every(item=>actual.get(normalizeWargearName(item.name))===item.quantity);
  const allProfiles=expected.flatMap(item=>rules.fixed.find(f=>f.name===item.name)
    .profiles.map(profile=>({name:normalizeWargearName(profile),quantity:item.quantity})));
  const weaponCount=new Map();
  for(const item of unit.equippedWeapons??[]){
    const name=normalizeWargearName(item.name);
    weaponCount.set(name,(weaponCount.get(name)??0)+Number(item.quantity));
  }
  const profilesComplete=allProfiles.every(item=>weaponCount.get(item.name)===item.quantity);
  if(complete && profilesComplete &&
      unit.loadoutValidation?.status==='rules-reviewed-valid')return unit;

  const built=buildManualWargearLoadout(unit,expected);
  if(built.loadoutValidation.status!=='rules-reviewed-valid')return unit;
  return {
    ...unit,...built,
    loadoutValidation:{...built.loadoutValidation,source:'reviewed-fixed-custodes'}
  };
}

export function hydrateReviewedFixedCustodesRoster(roster) {
  if (!roster || !Array.isArray(roster.units)) return roster;
  const units=roster.units.map(hydrateReviewedFixedCustodesLoadout);
  return units.every((unit,i)=>unit===roster.units[i]) ? roster : {...roster,units};
}
