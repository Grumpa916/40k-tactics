import { mapUnitLabels, preferredMapUnitDesignator } from './map-unit-labels.js';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function compactSymbol(label) {
  const text = String(label ?? '').trim();
  const match = text.match(/^(.*?)(?:\s+(\d+))?$/);
  const base = (match?.[1] ?? text).replace(/[^A-Za-z0-9\s]/g, ' ').trim();
  const suffix = match?.[2] ?? '';
  const words = base.split(/\s+/).filter(Boolean);
  let symbol = '';
  if (words.length <= 1) symbol = (words[0] ?? 'U').slice(0, 3).toUpperCase();
  else symbol = words.slice(0, 3).map((word) => word[0]).join('').toUpperCase();
  if (suffix) symbol = (symbol.length > 2 ? symbol.slice(0, 2) : symbol) + suffix;
  return symbol || 'U';
}

export function liveUnitSymbolLabels(units = []) {
  const readable = mapUnitLabels(units);
  const result = new Map();
  for (const unit of units) {
    if (!unit?.id) continue;
    const label = readable.get(unit.id);
    result.set(unit.id, preferredMapUnitDesignator(unit)
      ? label.replace(/\s+(\d+)$/, '$1')
      : compactSymbol(label));
  }
  return result;
}

function replaceUnitMarkerText(html, unitId, symbol) {
  const token = `data-map-unit-id="${escapeHtml(unitId)}"`;
  const marker = html.indexOf(token);
  if (marker < 0) return html;
  const contentStart = html.indexOf('>', marker);
  if (contentStart < 0) return html;
  const close = html.indexOf('</div>', contentStart + 1);
  if (close < 0) return html;
  const badge = html.indexOf('<span class="unit-activation-badge"', contentStart + 1);
  const contentEnd = badge >= 0 && badge < close ? badge : close;
  return html.slice(0, contentStart + 1) + escapeHtml(symbol) + html.slice(contentEnd);
}

const OBJECTIVE_MARKER_LABELS = new Map([
  ['My Home', 'mH'], ['MY HOME', 'mH'],
  ['Opp Home', 'oH'], ['OPP HOME', 'oH'],
  ['My Exp', 'mE'], ['MY EXP', 'mE'],
  ['Opp Exp', 'oE'], ['OPP EXP', 'oE'],
  ['Center 1', 'C1'], ['C1', 'C1'],
  ['Center 2', 'C2'], ['C2', 'C2']
]);

function formatObjectiveMarkerLabels(html) {
  return html.replace(/(<button\b[^>]*class="[^"]*\bbattlefield-map__objective\b[^"]*"[^>]*>)([^<]*)(<\/button>)/g,
    (_match, opening, rawLabel, closing) => {
      const label = OBJECTIVE_MARKER_LABELS.get(String(rawLabel ?? '').trim());
      return opening + escapeHtml(label ?? rawLabel) + closing;
    });
}

export function applyApprovedLiveMapSymbols(mapHtml, state) {
  let html = String(mapHtml ?? '');
  const labels = liveUnitSymbolLabels(Array.isArray(state?.units) ? state.units : []);
  for (const [unitId, symbol] of labels) html = replaceUnitMarkerText(html, unitId, symbol);
  return formatObjectiveMarkerLabels(html);
}
