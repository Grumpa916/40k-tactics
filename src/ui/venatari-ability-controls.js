import { getVenatariMineTargets } from '../rules/venatari-abilities.js';

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const confirm = (name, label) => `<label class="venatari-confirm"><input type="checkbox" name="${name}" required><span>${label}</span></label>`;
function choices(name, max, legend) {
  return `<fieldset class="venatari-number-choices"><legend>${legend}</legend>${Array.from({length:max+1}, (_, n) =>
    `<label><input type="radio" name="${name}" value="${n}" ${n === 0 ? 'checked' : ''}><span>${n}</span></label>`).join('')}</fieldset>`;
}

export function renderVenatariAbilityControls(state, entry) {
  if (!entry.venatariControl || entry.used) return '';
  let fields = '', action = '';
  if (entry.ruleId === 'cascade-mine') {
    const targets = getVenatariMineTargets(state, entry.unitId);
    if (!targets.length) return '<p>No deployed enemy units are available for the mine.</p>';
    fields = `<label>Enemy target<select name="targetId" required><option value="">Choose enemy within 3″…</option>${targets.map(target =>
      `<option value="${esc(target.unitId)}">${esc(target.name)} · ${esc(target.damageReminder)}</option>`).join('')}</select></label>` +
      choices('actualWounds', 6, 'Actual wounds lost after defenses') +
      '<small>Use 0 for a failed roll or no wounds lost. Maximum 3, or 6 against a Monster/Vehicle. This updates the target’s tracked wounds.</small>' +
      confirm('rangeConfirmed', 'Enemy is within 3″, checked at the table');
    action = 'Record mine result · spend mine';
  } else if (entry.ruleId === 'take-wing') {
    fields = confirm('phaseEndConfirmed', 'Opponent Fight phase has ended') +
      confirm('unengagedConfirmed', 'This unit is unengaged, checked at the table');
    action = 'Take Wing · return to reserves';
  } else if (entry.ruleId === 'swift-ruin') {
    fields = confirm('phaseEndConfirmed', 'Opponent Movement phase has ended') +
      confirm('ingressConfirmed', 'Rapid Ingress is legal for this unit; placement restrictions checked') +
      choices('cpSpent', 3, 'Actual CP spent after the 1 CP discount and other modifiers') +
      '<small>Normally 0 CP (1 CP − 1). Any selected cost is deducted once. Then select this unit in the Swift Ruin tray and tap its arrival position on the map.</small>';
    action = 'Confirm Swift Ruin · place from tray';
  }
  return `<details class="venatari-ability-controls"><summary>${esc(action)}</summary><form data-venatari-ability-form data-rule-id="${esc(entry.ruleId)}" data-rule-unit="${esc(entry.unitId)}" data-rule-player="${esc(entry.playerId)}">${fields}<button type="submit">${esc(action)}</button></form></details>`;
}

export function readVenatariAbilityForm(form) {
  const checked = name => form.querySelector(`[name="${name}"]`)?.checked === true;
  const selectedNumber = name => Number(form.querySelector(`[name="${name}"]:checked`)?.value ?? 0);
  return {
    playerId:form.getAttribute('data-rule-player'), unitId:form.getAttribute('data-rule-unit'),
    ruleId:form.getAttribute('data-rule-id'), targetId:form.querySelector('[name="targetId"]')?.value || null,
    actualWounds:selectedNumber('actualWounds'), cpSpent:selectedNumber('cpSpent'),
    rangeConfirmed:checked('rangeConfirmed'), phaseEndConfirmed:checked('phaseEndConfirmed'),
    unengagedConfirmed:checked('unengagedConfirmed'), ingressConfirmed:checked('ingressConfirmed')
  };
}
