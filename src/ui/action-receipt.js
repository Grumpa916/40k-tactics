import { escapeHtml } from './combat-workspace.js';
export function renderActionReceipt(session) {
  const action = session.getLastCorrection?.();
  if (!action) return '';
  return '<div class="live-action-receipt" role="status"><span>Recorded: ' + escapeHtml(action.detail) +
    '</span><button type="button" data-live-undo>Undo ' + escapeHtml(action.label) + '</button></div>';
}
