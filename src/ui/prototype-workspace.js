import { renderArmyUnitDialog, renderEventLogPanel } from './battle-context-panels.js';
import { isUnitBattleShocked } from '../rules/unit-status-summary.js';
import { createCommand } from '../commands/command.js';
import { COMMAND_TYPES } from '../commands/game-commands.js';

export function renderPrototypeWorkspaceTools() {
  const href = new URL('./styles/prototype-workspace.css', import.meta.url).href;
  return `<link rel="stylesheet" href="${href}"><nav class="prototype-workspace-tools" data-prototype-tools aria-label="Battle view"><strong data-workspace-phase>Battlefield</strong><button type="button" data-workspace-focus>Overview</button><button type="button" data-workspace-panel aria-expanded="true">Hide side panel ⇥</button></nav>`;
}
// UI-only preferences persist across shell/phase renders without touching game state.
export function createPrototypeWorkspace(container, {session, gameData = {}}) {
  let focus = true, collapsed = false, unitId = null, logOpen = false, returnFocus = null;
  function refresh() {
    const shell = container.querySelector?.('.battle-shell');
    if (!shell) return;
    const combat = !!container.querySelector?.('.shoot-screen--tabletop, .combat-workspace');
    shell.setAttribute('data-battle-focus',String(combat && focus));
    shell.setAttribute('data-controls-collapsed',String(combat && collapsed));
    const tools = container.querySelector('[data-prototype-tools]');
    if (tools) tools.hidden = !combat;
    const progression = container.querySelector('[data-phase-progression-host]');
    if (combat && focus && tools && progression && progression.parentElement !== tools) tools.append?.(progression);
    else if ((!combat || !focus) && progression?.parentElement === tools) shell.insertBefore?.(progression,container.querySelector('[data-battle-workspace]'));
    const phase = container.querySelector('[data-workspace-phase]');
    if (phase) phase.textContent = 'Battlefield · ' + (session.getState().phase ?? '').replaceAll('_',' ');
    const focusButton = container.querySelector('[data-workspace-focus]');
    if (focusButton) { focusButton.textContent = focus ? 'Overview' : 'Battle view ⛶'; focusButton.setAttribute('aria-pressed',String(focus)); }
    const panelButton = container.querySelector('[data-workspace-panel]');
    if (panelButton) { panelButton.textContent = collapsed ? 'Show side panel ⇤' : 'Hide side panel ⇥'; panelButton.setAttribute('aria-expanded',String(!collapsed)); }
    const overlay = container.querySelector('[data-army-roster-overlay]');
    if (overlay && (unitId || logOpen)) {
      overlay.hidden = false;
      overlay.innerHTML = unitId ? renderArmyUnitDialog(session.getState(),unitId,gameData) :
        '<section class="battle-shell__army-dialog" role="dialog" aria-modal="true" aria-label="Battle log"><header class="battle-shell__army-dialog-header"><h2>Battle log</h2><button type="button" data-close-army-roster>Close</button></header>' + renderEventLogPanel(session.getState(),{limit:30}) + '</section>';
    }
  }
  function click(event) {
    const target = event.target;
    if (target?.closest?.('[data-workspace-focus]')) { focus = !focus; refresh(); }
    if (target?.closest?.('[data-workspace-panel]')) { collapsed = !collapsed; refresh(); }
    const detail = target?.closest?.('[data-open-unit-details]');
    if (detail) { returnFocus = detail; unitId = detail.getAttribute('data-open-unit-details'); logOpen = false; refresh(); container.querySelector('[data-army-back]')?.focus?.(); }
    const log = target?.closest?.('[data-open-battle-log]');
    if (log) { returnFocus = log; unitId = null; logOpen = true; refresh(); container.querySelector('[data-close-army-roster]')?.focus?.(); }
    if (target?.closest?.('[data-open-army-roster]')) { unitId = null; logOpen = false; }
    if (target?.closest?.('[data-army-back]')) {
      const unit = session.getState().units.find(item=>item.id===unitId);
      unitId = null;
      // Use the shell's existing roster opener and its close/backdrop behavior.
      const button = [...container.querySelectorAll('[data-open-army-roster]')].find(item=>item.getAttribute('data-open-army-roster')===unit?.ownerId);
      button?.click?.();
    }
    if (target?.closest?.('[data-close-army-roster]') || target === container.querySelector('[data-army-roster-overlay]')) { unitId = null; logOpen = false; returnFocus?.focus?.(); }
    const shock = target?.closest?.('[data-manual-battle-shock]');
    if (shock) {
      const unit = session.getState().units.find(item=>item.id===shock.getAttribute('data-manual-battle-shock'));
      try {
        session.dispatch(createCommand(COMMAND_TYPES.SET_MANUAL_BATTLE_SHOCK,{unitId:unit.id,battleShocked:!isUnitBattleShocked(unit)}));
        refresh();
      } catch(error) { const status=container.querySelector('[data-army-status]'); if(status) status.textContent=error.message; }
    }
  }
  function keydown(event) {
    if (event.key === 'Escape' && !container.querySelector('[data-army-roster-overlay]')?.hidden) container.querySelector('[data-close-army-roster]')?.click?.();
  }
  container.addEventListener?.('click',click);
  container.addEventListener?.('keydown',keydown);
  return {refresh,destroy(){container.removeEventListener?.('click',click);container.removeEventListener?.('keydown',keydown);}};
}
