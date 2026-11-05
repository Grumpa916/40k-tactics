import { getRecordedCombatRules } from '../rules/recorded-combat-rules.js';

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

// Use the same formation Toughness and reviewed effect as the combat estimate.
export function renderFightTargetRuleStatus(state, { attackerId, targetId = null } = {}) {
  if (state?.phase !== 'fight') return '';
  const attacker = state.units?.find(unit => unit.id === attackerId && unit.status === 'deployed');
  if (!attacker) return '';
  const attackerRules = getRecordedCombatRules(state, attacker);
  if (!attackerRules.effects.includes('slayer-of-tyrants')) return '';
  const target = state.units?.find(unit => unit.id === targetId && unit.status === 'deployed' && unit.ownerId !== attacker.ownerId);
  const attackerT = attackerRules.unitToughness;
  const targetT = target && getRecordedCombatRules(state, target).unitToughness;
  let status = 'conditional', detail = 'Choose a target to check its Toughness.';
  if (target) {
    if (attackerT == null || targetT == null) {
      status = 'unknown';
      detail = `Check ${target.name}'s Toughness at the table before applying +1 to Wound.`;
    } else if (targetT > attackerT) {
      status = 'applies';
      detail = `${target.name} T${targetT} > ${attacker.name} T${attackerT} · +1 to Wound for melee attacks.`;
    } else {
      status = 'ineligible';
      detail = `${target.name} T${targetT} ≤ ${attacker.name} T${attackerT}.`;
    }
  }
  const label = { conditional:'Conditional rule', unknown:'Check Toughness', applies:'Applies to selected target', ineligible:'Does not apply to selected target' }[status];
  return `<div class="fight-target-rule-status is-${status}" role="status" data-fight-target-rule-status><strong>Slayer of Tyrants · ${label}</strong><span>${esc(detail)}</span></div>`;
}
