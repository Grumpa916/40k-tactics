import { ARMY_UNIT_CATALOG } from '../data/army-unit-catalog.js';

// Resolve existing reviewed price options; never infer a per-model price.
const ORDINAL_START = {
 'tyranids:exocrine': 3, 'tyranids:maleceptor': 3, 'tyranids:screamer-killer': 2,
 'tyranids:genestealers': 3, 'tyranids:hive-guard': 3, 'tyranids:neurolictor': 3,
 'tyranids:pyrovores': 3, 'tyranids:haruspex': 3, 'tyranids:harridan': 2,
 'tyranids:hierophant': 2, 'tyranids:tyrannocyte': 4, 'tyranids:norn-assimilator': 2,
 'tyranids:norn-emissary': 2, 'tyranids:hyperadapted-raveners': 3, 'tyranids:raveners': 3
};

function ordinalRange(condition) {
 const normalized = String(condition ?? '').toLowerCase().replace(/[–—]/g, '-');
 let match = normalized.match(/\b(\d+)(?:st|nd|rd|th)\s*-\s*(\d+)(?:st|nd|rd|th)\b/);
 if (match) return { min: Number(match[1]), max: Number(match[2]) };
 match = normalized.match(/\b(\d+)(?:st|nd|rd|th)\s*\+/);
 if (match) return { min: Number(match[1]), max: Number.POSITIVE_INFINITY };
 match = normalized.match(/\b(\d+)(?:st|nd|rd|th)\b/);
 return match ? { min: Number(match[1]), max: Number(match[1]) } : null;
}

function resolveReviewedOrdinalOption(options, ordinal) {
 const tagged = options.map(option => ({ option, range: ordinalRange(option.condition) }));
 // Only use the generic ordinal resolver when every candidate price explicitly
 // declares an ordinal range. Mixed ordinal/wargear pricing remains review-gated.
 if (!tagged.length || tagged.some(entry => !entry.range)) return null;
 const matches = tagged.filter(({ range }) => ordinal >= range.min && ordinal <= range.max);
 return matches.length === 1 ? matches[0].option : null;
}

export function getBuilderPriceOptions(unit) {
 const catalog = ARMY_UNIT_CATALOG.find(candidate => candidate.id === unit?.datasheetId);
 return catalog?.pointsOptions ?? unit?.pointsOptions ?? [];
}
export function getBuilderModelCounts(unit) {
 return [...new Set(getBuilderPriceOptions(unit).map(option => option.models).filter(count => Number.isInteger(count) && count > 0))].sort((a,b) => a-b);
}
export function resolveBuilderUnitCost(unit, roster, selections = unit?.equippedWargear ?? []) {
 const options = getBuilderPriceOptions(unit).filter(option => option.models === unit.modelCount);
 if (!options.length) return { points: null, reason: 'No published price for this model count.' };
 const peers = (roster?.units ?? [unit]).filter(item => item.datasheetId === unit.datasheetId);
 const index = peers.findIndex(item => item.id === unit.id);
 const ordinal = index < 0 ? peers.length + 1 : index + 1;
 if (unit.datasheetId === 'tyranids:tyrannofex') {
  const gun = selections.find(item => ['Fleshborer hive', 'Acid spray', 'Rupture cannon'].includes(item.name) && item.quantity > 0)?.name;
  if (!gun) return { points: null, reason: 'Choose the main gun to calculate points.' };
  const option = options.find(item => {
   const condition = String(item.condition ?? '').toLowerCase();
   const matchesOrdinal = ordinal >= 3 ? condition.includes('3rd+') : condition.includes('1st–2nd');
   const matchesGun = gun === 'Fleshborer hive' ? condition.includes('base cost') : condition.includes(gun.toLowerCase());
   return matchesOrdinal && matchesGun;
  });
  return option ? { points: option.points, reason: option.condition } : { points: null, reason: 'No matching reviewed weapon price.' };
 }
 // Assault Terminators have a per-model Storm Shield upgrade. Apply it on
 // top of the applicable 1st/2nd or 3rd+ base size price; never assume all
 // models carry a shield or silently upgrade saved army points.
 if(unit.datasheetId==='space-marines:terminator-assault-squad'){
  const shields=selections.filter(item=>item.name==='Thunder Hammer and Storm Shield')
    .reduce((sum,item)=>sum+(Number(item.quantity)||0),0);
  if(!Number.isInteger(shields)||shields<0||shields>unit.modelCount)
   return {points:null,reason:'Storm Shield quantity must be between zero and the unit model count.'};
  const base=resolveReviewedOrdinalOption(options,ordinal);
  if(!base)return {points:null,reason:'No reviewed base price for this Assault Terminator copy/size.'};
  return {points:base.points+5*shields,reason:base.condition+'; '+shields+' Storm Shield(s) at 5 pts each'};
 }
 // Cyclone Terminators retain their storm bolter and pay a per-launcher
 // upgrade. Apply that on top of the correct squad-size/copy-order base.
 if (unit.datasheetId === 'space-marines:terminator-squad') {
  const launchers=selections.filter(x=>x.name==='Cyclone Missile Launcher and Storm Bolter')
    .reduce((total,x)=>total+Number(x.quantity ?? 0),0);
  const maximum=Math.floor(unit.modelCount/5);
  if(!Number.isInteger(launchers)||launchers<0||launchers>maximum)
   return {points:null,reason:'Cyclone Launcher limit: at most one per five models.'};
  const base=resolveReviewedOrdinalOption(options,ordinal);
  if(!base)return {points:null,reason:'No reviewed Terminator Squad size/copy base price.'};
  return {points:base.points+10*launchers,reason:base.condition+'; '+launchers+' Cyclone Launcher(s) at 10 pts each'};
 }
 // Each Invader ATV can swap its main Gatling Cannon to Multi-melta for +5 pts.
 // The 1/2 model and 1st–2nd/3rd+ base points must be chosen first.
 if(unit.datasheetId==='space-marines:invader-atvs'){
  const melta=selections.filter(x=>x.name==='Multi-melta')
    .reduce((sum,x)=>sum+Number(x.quantity??0),0);
  if(!Number.isInteger(melta)||melta<0||melta>unit.modelCount)
   return {points:null,reason:'At most one Multi-melta per Invader ATV.'};
  const base=resolveReviewedOrdinalOption(options,ordinal);
  if(!base)return {points:null,reason:'No reviewed Invader ATV size/copy base cost.'};
  return {points:base.points+5*melta,
    reason:(base.condition??'reviewed base')+'; '+melta+' Multi-melta at 5 pts each'};
 }
 // The 11e Redemptor Macro Plasma Incinerator is a +10 point weapon upgrade.
 // Do not silently multiply alternative Standard/Supercharge attack profiles.
 if(unit.datasheetId==='space-marines:redemptor-dreadnought'){
  const plasma=selections.filter(x=>x.name==='Macro Plasma Incinerator')
    .reduce((sum,x)=>sum+Number(x.quantity??0),0);
  if(!Number.isInteger(plasma)||plasma<0||plasma>1)
   return {points:null,reason:'At most one Macro Plasma Incinerator can be equipped.'};
  const base=resolveReviewedOrdinalOption(options,ordinal);
  if(!base)return {points:null,reason:'No reviewed Redemptor Dreadnought first-two / third+ points tier.'};
  return {points:base.points+10*plasma,
    reason:(base.condition??'reviewed base')+'; '+plasma+' Macro Plasma Incinerator at 10 pts'};
 }
 // Desolation Sergeant's Vengor Launcher costs 5 points above the squad's
 // reviewed first-two / third+ price. It is never available to a second model.
 if(unit.datasheetId==='space-marines:desolation-squad'){
  const vengor=selections.filter(x=>x.name==='Vengor Launcher')
    .reduce((sum,x)=>sum+Number(x.quantity??0),0);
  if(!Number.isInteger(vengor)||vengor<0||vengor>1)
   return {points:null,reason:'Only the Desolation Sergeant can carry one Vengor Launcher.'};
  const base=resolveReviewedOrdinalOption(options,ordinal);
  if(!base)return {points:null,reason:'No reviewed Desolation Squad size/copy base price.'};
  return {points:base.points+5*vengor,
    reason:(base.condition??'reviewed base')+'; '+vengor+' Vengor Launcher at 5 pts'};
 }
 // Victrix composition counts the Chapter Ancient within the 3/6 selected
 // models. The Banner of Macragge has a separate reviewed points surcharge.
 if(unit.datasheetId==='space-marines:victrix-honour-guard'){
  const ancient=selections.filter(x=>x.name==='Chapter Ancient')
    .reduce((sum,x)=>sum+Number(x.quantity??0),0);
  const champion=selections.filter(x=>x.name==='Chapter Champion')
    .reduce((sum,x)=>sum+Number(x.quantity??0),0);
  if(!Number.isInteger(ancient)||!Number.isInteger(champion)||
     ancient<0||champion<0||ancient>1||champion>1||
     ancient+champion>=unit.modelCount)
   return {points:null,reason:'Victrix composition: max one Ancient and Champion, at least one ordinary Guard.'};
  const base=resolveReviewedOrdinalOption(options,ordinal);
  if(!base)return {points:null,reason:'No reviewed Victrix squad size/copy base price.'};
  return {points:base.points+15*ancient,
    reason:(base.condition??'reviewed base')+'; '+ancient+' Banner of Macragge at 15 pts'};
 }
 const reviewedOrdinalOption = resolveReviewedOrdinalOption(options, ordinal);
 if (reviewedOrdinalOption) return {
  points: reviewedOrdinalOption.points,
  reason: reviewedOrdinalOption.condition || `${unit.modelCount} models`
 };
 const threshold = ORDINAL_START[unit.datasheetId];
 if (threshold) {
  const surcharge = ordinal >= threshold;
  const option = options.find(item => surcharge ? String(item.condition ?? '').includes('+') : !String(item.condition ?? '').includes('+'));
  if (option) return { points: option.points, reason: option.condition || `${unit.modelCount} models` };
 }
 const distinct = [...new Set(options.map(option => option.points))];
 if (distinct.length === 1) return { points: distinct[0], reason: options[0].condition || `${unit.modelCount} models` };
 return { points: null, reason: 'Price depends on a condition that needs review.' };
}
