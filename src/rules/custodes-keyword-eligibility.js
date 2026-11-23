import { getBattleUnitDatasheet } from './battle-unit-reference.js';

/** Datasheet keywords only. Army faction membership is not a keyword. */
export function unitDatasheetKeywords(state, unit) {
  return (getBattleUnitDatasheet(state, unit)?.keywords ?? [])
    .map(value => String(value ?? '').trim())
    .filter(Boolean);
}

export function unitHasKeyword(state, unit, keyword) {
  const needle = String(keyword ?? '').trim().toLowerCase();
  return unitDatasheetKeywords(state, unit).some(value => value.toLowerCase() === needle);
}

/** ADEPTUS CUSTODES on this unit's own sheet. Anathema Psykana never qualifies. */
export function isAdeptusCustodesKeywordUnit(state, unit) {
  return unitHasKeyword(state, unit, 'Adeptus Custodes') && !unitHasKeyword(state, unit, 'Anathema Psykana');
}
