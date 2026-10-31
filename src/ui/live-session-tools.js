import { createLocalBattleRecovery } from '../application/local-battle-recovery.js';
import { getCombatDataReadiness } from '../rules/combat-data-readiness.js';
import { createDialogLifecycle } from './dialog-lifecycle.js';

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function mountLiveSessionTools({ root, session, store, onRetryCloud = () => {}, document = root.ownerDocument, window = globalThis.window }) {
  const overlay = document.createElement('div');
  overlay.className = 'live-session-overlay'; overlay.hidden = true; document.body.append(overlay);
  let details = false, incompatibleDismissed = false, cloudMessage = 'Cloud connecting…', recovery;
  const dismiss = () => { details = false; incompatibleDismissed = true; dialog.close(); };
  const dialog = createDialogLifecycle({ overlay, document, onDismiss: dismiss,
    getReturnFocus: () => root.querySelector('.prototype-phase-menu > summary') });
  let reportState = null, report = null;
  function refresh(status = recovery?.getStatus()) {
    if (!status) return;
    let tools = root.querySelector('[data-live-session-tools]');
    const target = root.querySelector('.prototype-phase-menu > div') ?? root.querySelector('.battle-shell');
    if (!tools && target) { tools = document.createElement('div'); tools.setAttribute('data-live-session-tools', ''); target.append(tools); }
    const correction = session.getLastCorrection?.();
    const summary = root.querySelector('.prototype-phase-menu > summary');
    if (summary) {
      summary.textContent = status.mode === 'saved' ? '●' : status.mode === 'error' ? '!' : '⋯';
      summary.setAttribute('aria-label', 'Game tools. ' + status.message);
      summary.setAttribute('title', status.message);
    }
    if (tools) tools.innerHTML = '<button type="button" data-live-tools-open>' + esc(status.message) + '</button>' +
      (correction ? '<button type="button" data-live-undo title="' + esc(correction.detail) + '">Undo ' + esc(correction.label) + '</button>' : '');
    const resume = status.mode === 'resume';
    if (!(resume || details || (status.mode === 'incompatible' && !incompatibleDismissed))) { dialog.close(); return; }
    const state = session.getState();
    if (reportState !== state) { report = getCombatDataReadiness(state); reportState = state; }
    const html = '<section class="live-session-dialog" role="dialog" aria-modal="true" aria-label="Battle recovery and data"><h2>' +
      (resume ? 'Resume saved battle?' : 'Game tools') + '</h2><p>' + esc(status.message) + '</p>' +
      (status.savedAt || status.record?.savedAt ? '<p>Last device save: ' + esc(new Date(status.savedAt ?? status.record.savedAt).toLocaleString()) + '</p>' : '') +
      (resume ? '<p>Round ' + esc(status.record.state.battle?.round ?? 0) + ' · ' + esc(status.record.state.phase) + '. The restored clock will be paused.</p><button type="button" data-dialog-key="resume" data-live-resume>Resume battle</button><button type="button" data-dialog-key="new" data-live-new>Use new session</button>' :
      '<p>' + esc(cloudMessage) + ' · Device saves and cloud saves are separate.</p><button type="button" data-dialog-key="retry-cloud" data-live-retry-cloud>Retry cloud connection</button><h3>Combat data check</h3>' +
      (report.ready ? '<p>No missing fields found by the baseline checks. Special rules and tabletop modifiers still need confirmation.</p>' :
      '<p>These items can limit Advisor estimates. Recording actual results remains available.</p><ul>' + report.issues.map(i => '<li>' + esc(i.name) + ': ' + esc(i.detail) + '</li>').join('') + '</ul>') +
      (correction ? '<p>Last action: ' + esc(correction.detail) + '</p><button type="button" data-dialog-key="undo" data-live-undo>Undo ' + esc(correction.label) + '</button>' : '') +
      (status.mode === 'incompatible' ? '<button type="button" data-dialog-key="new" data-live-new>Use new session</button>' : status.conflict ? '<button type="button" data-dialog-key="use-window" data-live-use-window>Use this window for device recovery</button>' : '<button type="button" data-dialog-key="save" data-live-save>Save on device now</button>') + '<button type="button" data-dialog-key="close" data-live-close>Close</button>') + '</section>';
    dialog.render(html, { canDismiss: !resume });
  }
  let emergencyStorage = null;
  try { emergencyStorage = window?.localStorage ?? null; } catch { /* Safari can deny local storage. */ }
  recovery = createLocalBattleRecovery({ session, store, onChange: refresh, emergencyStorage });
  const unsubscribe = session.subscribe(() => refresh());
  const click = event => {
    if (event.target.closest?.('a[href][target="_blank"]')?.textContent?.trim() === 'Rule reference') recovery.saveForExternalReference();
    const opener = event.target.closest?.('[data-live-tools-open]');
    if (opener) { dialog.rememberOpener(opener); details = true; refresh(); }
    if (event.target.closest?.('[data-live-close]')) dismiss();
    if (event.target.closest?.('[data-live-resume]')) { recovery.resume(); details = false; refresh(); }
    if (event.target.closest?.('[data-live-new]')) { recovery.startFresh(); details = false; refresh(); }
    if (event.target.closest?.('[data-live-save]')) recovery.save();
    if (event.target.closest?.('[data-live-use-window]')) void recovery.useThisWindow();
    if (event.target.closest?.('[data-live-undo]')) session.undoLastAction?.();
    if (event.target.closest?.('[data-live-retry-cloud]')) onRetryCloud();
  };
  root.addEventListener('click', click); overlay.addEventListener('click', click);
  const flush = () => { if (document.visibilityState === 'hidden') recovery.save(); };
  document.addEventListener('visibilitychange', flush); window?.addEventListener('pagehide', recovery.save);
  return {
    recovery,
    refresh,
    setCloudStatus(message) { cloudMessage = message; refresh(); },
    destroy() { recovery.destroy(); unsubscribe(); dialog.destroy(); overlay.removeEventListener('click', click); overlay.remove(); root.removeEventListener('click', click); document.removeEventListener('visibilitychange', flush); window?.removeEventListener('pagehide', recovery.save); }
  };
}
