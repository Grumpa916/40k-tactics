import { escapeHtml } from './combat-workspace.js';

const styleHref = new URL('./styles/advisor-option-impact.css', import.meta.url).href;
const oneDecimal = value => Number(value).toFixed(1);

/**
 * Read-only expected-damage comparison. A row is an independent alternative,
 * measured against this same baseline; it is never a promise of a dice result.
 */
export function renderAdvisorOptionImpact({
  title = 'Optional ability impact',
  baseline,
  options = [],
  metric = 'expected damage',
  lowerIsBetter = false,
  note = 'Preview only · no CP or Ka’tah readiness is spent.'
} = {}) {
  if (!Number.isFinite(baseline)) return '';
  const entries = options.filter(option => option && Number.isFinite(option.expectedDamage) && option.label);
  if (!entries.length) return '';
  const comparison = option => {
    const after = option.expectedDamage;
    const improvement = lowerIsBetter ? baseline - after : after - baseline;
    const amount = Math.abs(improvement) < 0.05 ? '0.0' : oneDecimal(Math.abs(improvement));
    const delta = improvement > 0.05 ? '+' + amount : improvement < -0.05 ? '−' + amount : '0.0';
    const context = option.cost ? '<small>' + escapeHtml(option.cost) + '</small>' : '';
    return '<div class="advisor-option-impact__row" data-advisor-impact-option="' + escapeHtml(option.id ?? option.label) + '">' +
      '<span><strong>' + escapeHtml(option.label) + '</strong>' + context + '</span>' +
      '<span class="advisor-option-impact__numbers"><strong>' + oneDecimal(baseline) + ' → ' + oneDecimal(after) + '</strong>' +
      '<small>' + escapeHtml(delta) + ' ' + (lowerIsBetter ? 'prevented' : 'gain') + '</small></span></div>';
  };
  const visible = entries.slice(0,3).map(comparison).join('');
  const more = entries.length > 3 ? '<details class="advisor-option-impact__more"><summary>More modeled options (' +
    (entries.length - 3) + ')</summary>' + entries.slice(3).map(comparison).join('') + '</details>' : '';
  return '<link rel="stylesheet" href="' + escapeHtml(styleHref) + '">' +
    '<section class="advisor-option-impact" data-advisor-option-impact><header><strong>' + escapeHtml(title) +
    '</strong><small>Mean ' + escapeHtml(metric) + ' · baseline ' + oneDecimal(baseline) + '</small></header>' +
    visible + more + '<small class="advisor-option-impact__note">' + escapeHtml(note) + '</small></section>';
}
