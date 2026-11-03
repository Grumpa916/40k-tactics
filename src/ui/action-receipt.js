import { escapeHtml } from './combat-workspace.js';
export function renderActionReceipt(session, { compact = false } = {}) {
  const action = session.getLastCorrection?.();
  if (!action) return '';
  if (compact) return '<div class="live-action-receipt live-action-receipt--compact" role="status"><span class="live-action-receipt__summary" title="' + escapeHtml(action.detail) +
    '"><strong>Last:</strong> ' + escapeHtml(action.detail) + '</span><button type="button" data-live-undo aria-label="Undo ' +
    escapeHtml(action.label) + '" title="Undo ' + escapeHtml(action.label) + '">Undo</button></div>';
  return '<div class="live-action-receipt" role="status"><span>Recorded: ' + escapeHtml(action.detail) +
    '</span><button type="button" data-live-undo>Undo ' + escapeHtml(action.label) + '</button></div>';
}
