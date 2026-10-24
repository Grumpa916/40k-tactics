import { createLocalBattleRecovery } from '../application/local-battle-recovery.js';
import { getCombatDataReadiness } from '../rules/combat-data-readiness.js';

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function mountLiveSessionTools({ root, session, store, onRetryCloud = () => {}, document = root.ownerDocument, window = globalThis.window }) {
  const overlay = document.createElement('div');
  overlay.className = 'live-session-overlay'; overlay.hidden = true; document.body.append(overlay);
  let details = false, cloudMessage = 'Cloud connecting…', recovery;
  let reportState = null, report = null;
  function refresh(status = recovery?.getStatus()) {
    if (!status) return;
    let tools = root.querySelector('[data-live-session-tools]');
    const target = root.querySelector('.prototype-phase-menu > div') ?? root.querySelector('.battle-shell');
    if (!tools && target) { tools = document.createElement('div'); tools.setAttribute('data-live-session-tools', ''); target.append(tools); }
    const correction = session.getLastCorrection?.();
    const summary = root.querySelector('.prototype-phase-menu > summary');
    if (summary) {
      summary.textContent = 'Phases & tools ' + (status.mode === 'saved' ? '●' : status.mode === 'error' ? '!' : '○');
      summary.setAttribute('aria-label', 'Phases and game tools. ' + status.message);
      summary.setAttribute('title', status.message);
    }
    if (tools) tools.innerHTML = '<button type="button" data-live-tools-open>' + esc(status.message) + '</button>' +
      (correction ? '<button type="button" data-live-undo title="' + esc(correction.detail) + '">Undo ' + esc(correction.label) + '</button>' : '');
    const resume = status.mode === 'resume';
    overlay.hidden = !(resume || details || status.mode === 'incompatible');
    if (overlay.hidden) return;
    const state = session.getState();
    if (reportState !== state) { report = getCombatDataReadiness(state); reportState = state; }
    overlay.innerHTML = '<section class="live-session-dialog" role="dialog" aria-modal="true" aria-label="Battle recovery and data"><h2>' +
      (resume ? 'Resume saved battle?' : 'Game tools') + '</h2><p>' + esc(status.message) + '</p>' +
      (status.savedAt || status.record?.savedAt ? '<p>Last device save: ' + esc(new Date(status.savedAt ?? status.record.savedAt).toLocaleString()) + '</p>' : '') +
      (resume ? '<p>Round ' + esc(status.record.state.battle?.round ?? 0) + ' · ' + esc(status.record.state.phase) + '. The restored clock will be paused.</p><button type="button" data-live-resume>Resume battle</button><button type="button" data-live-new>Use new session</button>' :
      '<p>' + esc(cloudMessage) + ' · Device saves and cloud saves are separate.</p><button type="button" data-live-retry-cloud>Retry cloud connection</button><h3>Combat data check</h3>' +
      (report.ready ? '<p>No missing fields found by the baseline checks. Special rules and tabletop modifiers still need confirmation.</p>' :
      '<p>These items can limit Advisor estimates. Recording actual results remains available.</p><ul>' + report.issues.map(i => '<li>' + esc(i.name) + ': ' + esc(i.detail) + '</li>').join('') + '</ul>') +
      (correction ? '<p>Last action: ' + esc(correction.detail) + '</p><button type="button" data-live-undo>Undo ' + esc(correction.label) + '</button>' : '') +
      (status.mode === 'incompatible' ? '<button type="button" data-live-new>Use new session</button>' : status.conflict ? '<button type="button" data-live-use-window>Use this window for device recovery</button>' : '<button type="button" data-live-save>Save on device now</button>') + '<button type="button" data-live-close>Close</button>') + '</section>';
  }
  recovery = createLocalBattleRecovery({ session, store, onChange: refresh });
  const unsubscribe = session.subscribe(() => refresh());
  const click = event => {
    if (event.target.closest?.('[data-live-tools-open]')) { details = true; refresh(); }
    if (event.target.closest?.('[data-live-close]')) { details = false; overlay.hidden = true; }
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
    destroy() { recovery.destroy(); unsubscribe(); overlay.remove(); root.removeEventListener('click', click); document.removeEventListener('visibilitychange', flush); window?.removeEventListener('pagehide', recovery.save); }
  };
}
