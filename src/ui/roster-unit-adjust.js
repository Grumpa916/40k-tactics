import { renderRosterUnitQuickAdjust } from './selected-unit-quick-adjust.js';

const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

export function rosterUnitEditorStylesheet() {
  return '<link rel="stylesheet" href="' + new URL('./styles/roster-unit-adjust.css', import.meta.url).href + '">';
}

// Keep every adjustment closed until its unit row is tapped. The unit row
// itself handles disclosure and still retains normal phase selection.
export function renderRosterUnitEditor(state, unit, {enabled = true} = {}) {
  if (!enabled) return '';
  const controls = renderRosterUnitQuickAdjust(state, unit);
  if (!controls) return '';
  const id = esc(unit.id), name = esc(unit.name ?? unit.id);
  return '<details class="roster-unit-editor" id="roster-unit-editor-' + id +
    '" data-view-key="roster-unit-editor-' + id +
    '"><summary class="roster-unit-editor__summary">Wounds, models and Battle-shock for ' + name +
    '</summary><div class="roster-unit-editor__body">' + controls + '</div></details>';
}
