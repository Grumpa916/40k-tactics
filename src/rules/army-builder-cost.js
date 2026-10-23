import { ARMY_UNIT_CATALOG } from '../data/army-unit-catalog.js';

// Resolve existing reviewed price options; never infer a per-model price.
const ORDINAL_START = {
 'tyranids:exocrine': 3, 'tyranids:maleceptor': 3, 'tyranids:screamer-killer': 2,
 'tyranids:genestealers': 3, 'tyranids:hive-guard': 3, 'tyranids:neurolictor': 3,
 'tyranids:pyrovores': 3, 'tyranids:haruspex': 3, 'tyranids:harridan': 2,
 'tyranids:hierophant': 2, 'tyranids:tyrannocyte': 4, 'tyranids:norn-assimilator': 2,
 'tyranids:norn-emissary': 2, 'tyranids:hyperadapted-raveners': 3, 'tyranids:raveners': 3
};
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
