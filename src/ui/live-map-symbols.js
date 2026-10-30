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
    // Explicit designators retain their case and full prefix when numbered.
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

function numberObjectiveMarkers(html) {
  let objectiveNumber = 0;
  return html.replace(/(<button\b[^>]*class="[^"]*\bbattlefield-map__objective\b[^"]*"[^>]*>)([^<]*)(<\/button>)/g,
    (_match, opening, _label, closing) => {
      objectiveNumber += 1;
      const taggedOpening = opening.slice(0, -1) + ` data-objective-number="${objectiveNumber}">`;
      return taggedOpening + objectiveNumber + closing;
    });
}

export function applyApprovedLiveMapSymbols(mapHtml, state) {
  let html = String(mapHtml ?? '');
  const labels = liveUnitSymbolLabels(Array.isArray(state?.units) ? state.units : []);
  for (const [unitId, symbol] of labels) html = replaceUnitMarkerText(html, unitId, symbol);
  return numberObjectiveMarkers(html);
}
