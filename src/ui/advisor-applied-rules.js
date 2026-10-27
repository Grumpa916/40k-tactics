import { escapeHtml } from './combat-workspace.js';

export function renderAdvisorAppliedRules(rules = []) {
  if (!rules.length) return '';
  return `<details class="advisor-applied-rules" data-view-key="advisor-applied-rules"><summary>Rules included · ${rules.length}</summary><ul>${rules.map(rule => `<li>${escapeHtml(rule)}</li>`).join('')}</ul></details>`;
}
