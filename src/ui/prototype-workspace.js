import { renderArmyUnitDialog, renderEventLogPanel } from './battle-context-panels.js';
import { isUnitBattleShocked } from '../rules/unit-status-summary.js';
import { createCommand } from '../commands/command.js';
import { COMMAND_TYPES } from '../commands/game-commands.js';

const LIVE_PHASES = Object.freeze([
  ['command', 'Command'],
  ['movement', 'Movement'],
  ['shooting', 'Shooting'],
  ['charge', 'Charge'],
  ['fight', 'Fight']
]);

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export function renderPrototypeWorkspaceTools() {
  const href = new URL('./styles/prototype-workspace.css', import.meta.url).href;
  const navigationHref = new URL('./styles/army-builder-navigation.css', import.meta.url).href;
  const phases = LIVE_PHASES.map(([id, label]) =>
    `<button type="button" data-battle-phase-button="${id}">${label}</button>`
  ).join('');
  return `<link rel="stylesheet" href="${href}"><link rel="stylesheet" href="${navigationHref}"><style>
    .battle-shell.is-tabletop-experiment .battle-shell__tabletop-header > .battle-shell__phases{display:none!important}
    .battle-shell.is-tabletop-experiment[data-battle-focus="true"] .battle-shell__tabletop-header .battle-shell__status-summary{display:none!important}
    .battle-shell.is-tabletop-experiment[data-battle-focus="true"] .battle-shell__tabletop-header{display:block!important;min-height:0!important}
    .battle-shell.is-tabletop-experiment[data-battle-focus="true"] .battle-shell__tabletop-topline{display:block!important;min-height:0!important}
    .battle-shell.is-tabletop-experiment[data-battle-focus="true"] .battle-shell__tabletop-missions{width:100%;min-width:0}
  </style><nav class="prototype-workspace-tools" data-prototype-tools aria-label="Tabletop controls">
    <div class="tabletop-live-strip" data-workspace-live-strip></div>
    <details class="prototype-phase-menu"><summary>Phases</summary><div>${phases}</div></details>
    <button type="button" data-workspace-next-phase data-advance-game-phase hidden>Next phase → Movement</button>
    <button type="button" data-workspace-focus>Overview</button>
    <button type="button" data-workspace-panel aria-expanded="true">Hide panel ⇥</button>
  </nav>`;
}

// UI-only preferences persist across shell/phase renders without touching game state.
export function createPrototypeWorkspace(container, {session, gameData = {}}) {
  let focus = true, collapsed = false, unitId = null, logOpen = false, returnFocus = null;

  function refresh() {
    const shell = container.querySelector?.('.battle-shell');
    if (!shell) return;
    const state = session.getState();
    const combat = !!container.querySelector?.('.shoot-screen--tabletop, .combat-workspace');
    shell.setAttribute('data-battle-focus', String(combat && focus));
    shell.setAttribute('data-controls-collapsed', String(combat && collapsed));
    const tools = container.querySelector('[data-prototype-tools]');
    if (tools) tools.hidden = !combat;
    const progression = container.querySelector('[data-phase-progression-host]');
    if (combat && focus && tools && progression && progression.parentElement !== tools) tools.append?.(progression);
    else if ((!combat || !focus) && progression?.parentElement === tools) shell.insertBefore?.(progression, container.querySelector('[data-battle-workspace]'));

    const strip = container.querySelector('[data-workspace-live-strip]');
    if (strip) {
      const phase = String(state.phase ?? '').replaceAll('_', ' ');
      strip.innerHTML = `<span class="tabletop-live-round">R${esc(state.battle?.round ?? '—')}</span>` +
        `<span class="tabletop-live-phase">${esc(phase)}</span>`;
    }

    const nextPhaseButton = container.querySelector('[data-workspace-next-phase]');
    if (nextPhaseButton) {
      nextPhaseButton.hidden = !(combat && state.phase === 'command');
      nextPhaseButton.textContent = 'Next phase → Movement';
    }
    const focusButton = container.querySelector('[data-workspace-focus]');
    if (focusButton) {
      focusButton.textContent = focus ? 'Overview' : 'Tabletop';
      focusButton.setAttribute('aria-pressed', String(focus));
    }
    const panelButton = container.querySelector('[data-workspace-panel]');
    if (panelButton) {
      panelButton.textContent = collapsed ? 'Show panel ⇤' : 'Hide panel ⇥';
      panelButton.setAttribute('aria-expanded', String(!collapsed));
    }
    const overlay = container.querySelector('[data-army-roster-overlay]');
    if (overlay && (unitId || logOpen)) {
      overlay.hidden = false;
      overlay.innerHTML = unitId ? renderArmyUnitDialog(state, unitId, gameData) :
        '<section class="battle-shell__army-dialog" role="dialog" aria-modal="true" aria-label="Battle log"><header class="battle-shell__army-dialog-header"><h2>Battle log</h2><button type="button" data-close-army-roster>Close</button></header>' + renderEventLogPanel(state, {limit:30}) + '</section>';
    }
  }

  function click(event) {
    const target = event.target;
    if (target?.closest?.('[data-workspace-focus]')) { focus = !focus; refresh(); }
    if (target?.closest?.('[data-workspace-panel]')) { collapsed = !collapsed; refresh(); }
    const detail = target?.closest?.('[data-open-unit-details]');
    if (detail) {
      returnFocus = detail; unitId = detail.getAttribute('data-open-unit-details'); logOpen = false;
      refresh(); container.querySelector('[data-army-back]')?.focus?.();
    }
    const log = target?.closest?.('[data-open-battle-log]');
    if (log) {
      returnFocus = log; unitId = null; logOpen = true;
      refresh(); container.querySelector('[data-close-army-roster]')?.focus?.();
    }
    if (target?.closest?.('[data-open-army-roster]')) { unitId = null; logOpen = false; }
    if (target?.closest?.('[data-army-back]')) {
      const unit = session.getState().units.find(item => item.id === unitId);
      unitId = null;
      const button = [...container.querySelectorAll('[data-open-army-roster]')]
        .find(item => item.getAttribute('data-open-army-roster') === unit?.ownerId);
      button?.click?.();
    }
    if (target?.closest?.('[data-close-army-roster]') || target === container.querySelector('[data-army-roster-overlay]')) {
      unitId = null; logOpen = false; returnFocus?.focus?.();
    }
    const shock = target?.closest?.('[data-manual-battle-shock]');
    if (shock) {
      const unit = session.getState().units.find(item => item.id === shock.getAttribute('data-manual-battle-shock'));
      try {
        session.dispatch(createCommand(COMMAND_TYPES.SET_MANUAL_BATTLE_SHOCK, {unitId:unit.id, battleShocked:!isUnitBattleShocked(unit)}));
        refresh();
      } catch(error) {
        const status = container.querySelector('[data-army-status]');
        if (status) status.textContent = error.message;
      }
    }
  }

  function keydown(event) {
    if (event.key === 'Escape' && !container.querySelector('[data-army-roster-overlay]')?.hidden) {
      container.querySelector('[data-close-army-roster]')?.click?.();
    }
  }

  container.addEventListener?.('click', click);
  container.addEventListener?.('keydown', keydown);
  return {refresh, destroy() {
    container.removeEventListener?.('click', click);
    container.removeEventListener?.('keydown', keydown);
  }};
}