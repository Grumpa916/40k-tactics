import { renderRosterUnitQuickAdjust } from './selected-unit-quick-adjust.js';

const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

export function rosterUnitEditorStylesheet() {
  return '<link rel="stylesheet" href="' + new URL('./styles/roster-unit-adjust.css', import.meta.url).href + '">';
}

// Editing a non-selected unit must not change phase selection or recorded actions.
// The disclosure opens automatically for the currently selected unit.
export function renderRosterUnitEditor(state, unit, {selected = false, enabled = true} = {}) {
  if (!enabled) return '';
  const controls = renderRosterUnitQuickAdjust(state, unit);
  if (!controls) return '';
  const id = esc(unit.id), name = esc(unit.name ?? unit.id);
  return '<details class="roster-unit-editor" data-view-key="roster-unit-editor-' + id + '"' +
    (selected ? ' open' : '') + '><summary aria-label="Adjust wounds, models and Battle-shock for ' + name +
    '">Adjust W / BS</summary><div class="roster-unit-editor__body">' + controls + '</div></details>';
}
