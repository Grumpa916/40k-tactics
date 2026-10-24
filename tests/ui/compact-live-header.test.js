import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrototypeWorkspace, renderPrototypeWorkspaceTools } from '../../src/ui/prototype-workspace.js';

test('tabletop tools hide the large phase strip and retain the compact phase menu', () => {
  const html = renderPrototypeWorkspaceTools();
  assert.match(html, /battle-shell\.is-tabletop-experiment \.battle-shell__tabletop-header > \.battle-shell__phases\{display:none!important\}/);
  assert.match(html, /<details class="prototype-phase-menu"><summary>Phases<\/summary>/);
});

test('compact live strip shows round and phase without duplicating score controls', () => {
  const shell = {
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    insertBefore() {}
  };
  const tools = { hidden: false, append() {} };
  const strip = { innerHTML: '' };
  const nextPhase = { hidden: false, textContent: '' };
  const focusButton = { textContent: '', setAttribute() {} };
  const panelButton = { textContent: '', setAttribute() {} };
  const combat = {};
  const selectors = new Map([
    ['.battle-shell', shell],
    ['.shoot-screen--tabletop, .combat-workspace', combat],
    ['[data-prototype-tools]', tools],
    ['[data-workspace-live-strip]', strip],
    ['[data-workspace-next-phase]', nextPhase],
    ['[data-workspace-focus]', focusButton],
    ['[data-workspace-panel]', panelButton]
  ]);
  const container = {
    querySelector(selector) { return selectors.get(selector) ?? null; },
    querySelectorAll() { return []; },
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

  assert.match(strip.innerHTML, />R2<\/span>/);
  assert.match(strip.innerHTML, />shooting<\/span>/);
  assert.doesNotMatch(strip.innerHTML, /tabletop-live-player|\bVP\b|\bCP\b|<time/);
  workspace.destroy();
});
