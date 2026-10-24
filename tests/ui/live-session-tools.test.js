import test from 'node:test';
import assert from 'node:assert/strict';
import { createDialogLifecycle } from '../../src/ui/dialog-lifecycle.js';
import { mountLiveSessionTools } from '../../src/ui/live-session-tools.js';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { createRecoveryRecord } from '../../src/application/local-battle-recovery.js';

// A narrow DOM fixture: exercises focus, events and replacement, not browser layout.
function fixture() {
  const document = { activeElement: null, events: {}, visibilityState: 'visible',
    addEventListener(name, fn) { this.events[name] = fn; }, removeEventListener(name) { delete this.events[name]; } };
  function element(attrs = {}) {
    let children = [], html = '';
    const node = { attrs, events: {}, hidden: false, isConnected: true, scrollTop: 0,
      getAttribute: name => attrs[name] ?? null, setAttribute: (name, value) => { attrs[name] = String(value); },
      addEventListener: (name, fn) => { node.events[name] = fn; }, removeEventListener: name => { delete node.events[name]; },
      focus() { document.activeElement = node; },
      contains: target => children.includes(target),
      append: child => children.push(child), remove() { node.isConnected = false; },
      closest: selector => matches(node, selector) ? node : null,
      querySelector: selector => children.find(child => matches(child, selector)) ?? null,
      querySelectorAll: selector => children.filter(child => matches(child, selector)),
      get children() { return children; },
      get innerHTML() { return html; },
      set innerHTML(value) {
        children.forEach(child => { child.isConnected = false; }); html = value;
        children = [...value.matchAll(/<(?:section|button)([^>]*)>/g)].map(match => element(Object.fromEntries(
          [...match[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(attr => [attr[1], attr[2] ?? '']))));
      }
    };
    return node;
  }
  function matches(node, selector) {
    const match = selector.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
    return Boolean(match && Object.hasOwn(node.attrs, match[1]) && (match[2] === undefined || node.attrs[match[1]] === match[2]));
  }
  document.createElement = () => element();
  document.body = element(); document.activeElement = document.body;
  const overlay = element(), summary = element(), holder = element(), root = element();
  root.ownerDocument = document;
  root.querySelector = selector => selector === '.prototype-phase-menu > summary' ? summary
    : selector === '.prototype-phase-menu > div' ? holder : holder.querySelector(selector);
  const key = (key, shiftKey = false) => { const event = { key, shiftKey, prevented: false, preventDefault() { this.prevented = true; } }; overlay.events.keydown(event); return event; };
  return { document, overlay, root, summary, holder, element, key };
}
const markup = '<section role="dialog"><button data-dialog-key="save">Save</button><button data-dialog-key="close">Close</button></section>';

test('dialog refresh keeps its scroll and focused action; removed action gets a safe fallback', () => {
  const f = fixture(); f.overlay.hidden = true;
  const dialog = createDialogLifecycle({ ...f });
  dialog.render(markup);
  f.overlay.querySelector('[role="dialog"]').scrollTop = 180;
  f.overlay.querySelectorAll('[data-dialog-key]')[1].focus();
  dialog.render(markup);
  assert.equal(f.document.activeElement.getAttribute('data-dialog-key'), 'close');
  assert.equal(f.overlay.querySelector('[role="dialog"]').scrollTop, 180);
  dialog.render('<section role="dialog"><button data-dialog-key="save">Save</button></section>');
  assert.equal(f.document.activeElement.getAttribute('data-dialog-key'), 'save');
  dialog.destroy();
});

test('dialog traps Tab, respects mandatory resume choice, and restores a connected opener', () => {
  const f = fixture(); f.overlay.hidden = true;
  const opener = f.element(); let dismissed = 0;
  const dialog = createDialogLifecycle({ ...f, onDismiss: () => { dismissed++; dialog.close(); }, getReturnFocus: () => f.summary });
  opener.focus(); dialog.render(markup, { canDismiss: false });
  assert.equal(f.key('Tab', true).prevented, true);
  assert.equal(f.document.activeElement.getAttribute('data-dialog-key'), 'close');
  assert.equal(f.key('Tab').prevented, true);
  assert.equal(f.document.activeElement.getAttribute('data-dialog-key'), 'save');
  f.key('Escape'); assert.equal(dismissed, 0);
  dialog.render(markup); f.key('Escape');
  assert.equal(dismissed, 1); assert.equal(f.document.activeElement, opener);
  opener.focus(); dialog.render(markup); opener.isConnected = false; dialog.close();
  assert.equal(f.document.activeElement, f.summary);
  dialog.destroy(); assert.equal(f.overlay.events.keydown, undefined);
});

function session() {
  return createGameSession(createGameState({ players: [{ id: 'p1' }], phase: 'shooting' }), {
    commandExecutor: state => ({ ...state, turn: state.turn + 1 })
  });
}

test('dismissed incompatible warning stays closed after updates without allowing recovery overwrite', async () => {
  const f = fixture(), s = session(), writes = [];
  const tools = mountLiveSessionTools({ root: f.root, session: s, document: f.document, window: null,
    store: { load: async () => ({ latest: { incompatible: true } }), save: async record => writes.push(record) } });
  await tools.recovery.ready;
  const overlay = f.document.body.children[0];
  assert.equal(overlay.hidden, false);
  overlay.events.click({ target: overlay.querySelector('[data-live-close]') });
  assert.equal(overlay.hidden, true);
  tools.setCloudStatus('Cloud unavailable'); s.dispatch({ type: 'advance' }); tools.refresh();
  assert.equal(overlay.hidden, true); assert.equal(tools.recovery.getStatus().mode, 'incompatible');
  const opener = f.holder.querySelector('[data-live-session-tools]').querySelector('[data-live-tools-open]');
  f.root.events.click({ target: opener });
  assert.equal(overlay.hidden, false);
  overlay.events.keydown({ key: 'Escape', preventDefault() {} });
  assert.equal(overlay.hidden, true);
  tools.destroy(); assert.equal(writes.length, 0);
});

test('resume dialog requires a choice and restores the saved battle before enabling writes', async () => {
  const f = fixture(), s = session(), writes = [];
  const saved = createRecoveryRecord({ ...s.getState(), turn: 4 });
  const tools = mountLiveSessionTools({ root: f.root, session: s, document: f.document, window: null,
    store: { load: async () => ({ latest: saved }), save: async record => writes.push(record) } });
  await tools.recovery.ready;
  const overlay = f.document.body.children[0];
  overlay.events.keydown({ key: 'Escape', preventDefault() {} });
  assert.equal(overlay.hidden, false); assert.equal(writes.length, 0);
  overlay.events.click({ target: overlay.querySelector('[data-live-resume]') });
  await tools.recovery.flush();
  assert.equal(overlay.hidden, true); assert.equal(s.getState().turn, 4);
  assert.equal(writes.at(-1).state.turn, 4);
  tools.destroy();
});
