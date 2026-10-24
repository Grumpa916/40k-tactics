import { escapeHtml as esc } from './combat-workspace.js';

const mean = value => Number.isFinite(value) ? value.toFixed(1) : '—';

function phaseReferences(context) {
  if (!context?.own) return '';
  const list = items => items.length ? '<ul>' + items.map(item =>
    `<li><strong>${esc(item.name)}</strong> · ${esc(item.cpCost)} CP${item.detachmentName ? ' · ' + esc(item.detachmentName) : ''}<br><small>${esc(item.timing)} ${esc(item.description)}</small></li>`).join('') + '</ul>' : '<p>No affordable catalog options established.</p>';
  return `<details data-view-key="shoot-phase-rules"><summary>CP &amp; phase references</summary>
    <p>You: ${esc(context.own.cp)} CP${context.opponent ? ' · Opponent: ' + esc(context.opponent.cp) + ' CP' : ''}.</p>
    <strong>Your possible options</strong>${list(context.own.affordable ?? [])}
    ${context.targetBattleShocked ? '<p>The target is Battle-shocked; its controlling player cannot target it with Stratagems while that status applies.</p>' : context.opponent ? '<strong>Opponent defensive references</strong>' + list(context.opponent.defence ?? []) : ''}
    <small>Catalog references only. Confirm timing, targets and eligibility at the table. These effects are not automatically applied to the damage estimate.</small>
  </details>`;
}

// Present existing strategy outputs without adding another ranking calculation.
export function renderAdvisorDecisionSummary(item) {
  if (!item) return '';
  const fire = item.fireCoordination;
  const support = fire?.concentratedFireViable && fire.contributors?.length
    ? `<p><strong>Supporting fire:</strong> ${esc(fire.contributors.map(unit => unit.unitName).join(' + '))} · ${mean(fire.combinedExpectedDamage)} combined mean damage, including this activation. Not a combined kill probability; resolve attacks separately.</p>` : '';
  const alternative = fire?.betterMatch && fire.bestAlternative
    ? `<p><strong>Stronger match:</strong> ${esc(fire.bestAlternative.unitName)} · ${esc(fire.bestAlternative.weaponName)} (${mean(fire.bestAlternative.expectedDamage)} mean damage).</p>` : '';
  return `<section class="shoot-advisory__decision" data-advisor-decision>
    <strong>Why this target</strong><p>${esc(item.recommendation)}</p>
    ${alternative}${support}${fire?.likelyOverkill ? '<p>Possible overkill: consider saving this weapon for a harder target.</p>' : ''}
    ${phaseReferences(item.stratagemContext)}
  </section>`;
}
