// iPad-safe target choices: no native select popover is replaced during a redraw.
// Selection remains a local preview until the user explicitly records an attack.
function escapeHtml(value) {
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

export function renderShootingTargetChoices(targets, selectedTargetId, { hasWeapon = false } = {}) {
  const options = Array.isArray(targets) ? targets : [];
  return `<div class="shoot-target-picker" role="group" aria-label="Shooting target" data-shoot-target-picker>
    <strong>Target · tap an enemy marker or choose below</strong>
    ${options.length ? `<div class="shoot-target-picker__choices">${options.map(target =>
      `<button type="button" data-shoot-target-choice="${escapeHtml(target.unitId)}" aria-pressed="${String(target.unitId === selectedTargetId)}">${escapeHtml(target.name)}</button>`
    ).join('')}</div>` : `<p class="shoot-target-picker__empty" role="note">${hasWeapon
      ? 'No eligible targets for this weapon under recorded engagement. Try another weapon or review engagement on the tabletop.'
      : 'No target currently available. Choose a ranged weapon or review the units on the tabletop.'}</p>`}
    ${selectedTargetId ? '<button type="button" class="shoot-target-picker__clear" data-shoot-target-clear>Clear target / choose another</button>' : ''}
  </div>`;
}
