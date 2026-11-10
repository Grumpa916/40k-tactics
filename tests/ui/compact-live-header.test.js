import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrototypeWorkspace, renderPrototypeWorkspaceTools } from '../../src/ui/prototype-workspace.js';

test('tabletop tools show five phase chips and retain the tools menu', () => {
  const html = renderPrototypeWorkspaceTools();
  assert.match(html, /battle-shell\.is-tabletop-experiment \.battle-shell__tabletop-header > \.battle-shell__phases\{display:none!important\}/);
  assert.match(html, /class="prototype-phase-chips"/);
  assert.match(html, /<details class="prototype-phase-menu"><summary aria-label="More tools">/);
  assert.equal((html.match(/data-battle-phase-button=/g) ?? []).length, 6);
  assert.match(html, /data-battle-phase-button="review">Game review/);
  assert.match(html, /data-movement-roster-toggle aria-controls="movement-units" aria-expanded="false" hidden>Units/);
});

test('Movement selection keeps the phase panel closed and the roster drawer survives a refresh', () => {
  const attributes = {};
  const setAttribute = (name, value) => { attributes[name] = value; };
  const shell = { setAttribute };
  const unitsButton = { hidden: true, setAttribute };
  const handlers = {};
  let roster = {};
  let phase = 'movement';
  const container = {
    querySelector(selector) {
      return {
        '.battle-shell': shell,
        '.shoot-screen--tabletop, .combat-workspace': {},
        '#movement-units': roster,
        '[data-movement-roster-toggle]': unitsButton
      }[selector] ?? null;
    },
    querySelectorAll: () => [],
    addEventListener(type, handler) { handlers[type] = handler; },
    removeEventListener() {}
  };
  const workspace = createPrototypeWorkspace(container, { session: { getState: () => ({ phase }) } });
  workspace.refresh();
  assert.equal(unitsButton.hidden, false);
  assert.equal(attributes['data-movement-roster-open'], 'false');
  handlers.click({ target: { closest: selector => selector === '[data-movement-roster-toggle]' ? unitsButton : null } });
  assert.equal(attributes['aria-expanded'], 'true');
  roster = {};
  workspace.refresh();
  assert.equal(attributes['data-movement-roster-open'], 'true');
  const marker = { closest: selector => selector.includes('[data-phase-map-select]') ? marker : null };
  handlers.click({ target: marker });
  handlers.keydown({ target: marker, key: 'Enter' });
  assert.equal(attributes['data-controls-collapsed'], 'true');
  handlers.keydown({ key: 'Escape' });
  assert.equal(attributes['aria-expanded'], 'false');
  roster = null;
  phase = 'shooting';
  workspace.refresh();
  assert.equal(unitsButton.hidden, true);
  handlers.click({ target: marker });
  assert.equal(attributes['data-controls-collapsed'], 'false');
  workspace.destroy();
});

test('live score moves into the visible HUD and phase chips mark the current phase', () => {
  const shell = {
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    insertBefore() {}
  };
  const tools = { hidden: false };
  const header = { prepend(child) { child.parentElement = this; } };
  const scoreHost = { append(child) { child.parentElement = this; } };
  const summary = { parentElement: header };
  const chips = ['command', 'movement', 'shooting', 'charge', 'fight'].map(id => ({ id, attrs: {}, getAttribute() { return id; }, setAttribute(name, value) { this.attrs[name] = value; } }));
  const focusButton = { textContent: '', setAttribute() {} };
  const panelButton = { textContent: '', setAttribute() {} };
  const combat = {};
  const selectors = new Map([
    ['.battle-shell', shell],
    ['.shoot-screen--tabletop, .combat-workspace', combat],
    ['[data-prototype-tools]', tools],
    ['[data-battle-status-summary]', summary],
    ['[data-workspace-score-host]', scoreHost],
    ['.battle-shell__tabletop-topline', header],
    ['[data-workspace-focus]', focusButton],
    ['[data-workspace-panel]', panelButton]
  ]);
  const container = {
    querySelector(selector) { return selectors.get(selector) ?? null; },
    querySelectorAll(selector) { return selector === '.prototype-phase-chips [data-battle-phase-button]' ? chips : []; },
    addEventListener() {},
    removeEventListener() {}
  };
  const session = {
    getState() {
      return {
        phase: 'shooting',
        activePlayer: 'p1',
        battle: { round: 2, activePlayerId: 'p1' },
        players: [
          { id: 'p1', name: 'You' },
          { id: 'p2', name: 'Opponent' }
        ]
      };
    }
  };

  const workspace = createPrototypeWorkspace(container, { session });
  workspace.refresh();

  assert.equal(summary.parentElement, scoreHost);
  assert.deepEqual(chips.map(chip => chip.attrs['aria-pressed']), ['false', 'false', 'true', 'false', 'false']);
  assert.equal(shell.attributes['data-controls-collapsed'], 'true');
  workspace.destroy();
});
