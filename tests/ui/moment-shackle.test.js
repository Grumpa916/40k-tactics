import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { getBattleRulesReminders } from '../../src/rules/battle-rules-reminders.js';
import { recordRulesReminderUse } from '../../src/engine/rules-reminder-transitions.js';
import { createGameSession } from '../../src/application/game-session.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { createRulesReminderController, renderRulesReminderDialog, renderUnitRulesReminders } from '../../src/ui/rules-reminder-panel.js';

const use = (state, choice) => recordRulesReminderUse(state, {
  playerId: 'p1', unitId: 'trajann', ruleId: 'moment-shackle', choice
});
const card = html => [...html.matchAll(/<article\b[\s\S]*?<\/article>/g)]
  .map(match => match[0]).find(value => value.includes('<strong>Moment Shackle</strong>')) ?? '';
const unitPanel = state => renderUnitRulesReminders(state, {
  perspectivePlayerId: 'p1', selectedUnitId: 'wardens'
});

test('Moment Shackle offers both choices for the attached Trajann at the start of either player’s phases', () => {
  for (const activePlayer of ['p1', 'p2']) {
    for (const phase of ['command', 'movement', 'shooting', 'charge', 'fight']) {
      const state = custodesReminderState({ phase, activePlayer });
      const html = card(unitPanel(state));
      assert.match(html, /Available/);
      assert.match(html, /Once per battle for your army/);
      assert.match(html, /data-rule-choice="attacks"/);
      assert.match(html, /data-rule-choice="save"/);
      assert.doesNotMatch(html, /Active this phase/);
      assert.throws(() => use(state, 'both'), /Choose one/);
      assert.throws(() => recordRulesReminderUse(state, {
        playerId: 'p2', unitId: 'trajann', ruleId: 'moment-shackle', choice: 'save'
      }));
    }
  }
});

test('the chosen save remains visible after an opponent activation and save/resume, only for Trajann', () => {
  let state = use(custodesReminderState(), 'save');
  state.history.push({ type: 'shooting.unit_activated', payload: { unitId: 'marine', round: 1, turn: 1 } });
  state = JSON.parse(JSON.stringify(state));
  for (const html of [unitPanel(state), renderRulesReminderDialog(state, { playerId: 'p1' })]) {
    const active = card(html);
    assert.match(active, /Active this phase/);
    assert.match(active, /Trajann has a 3\+ invulnerable save/);
    assert.match(active, /not his bodyguard/);
    assert.doesNotMatch(active, /Add 3|data-record-rule-use/);
  }
  assert.throws(() => use(state, 'attacks'));
});

test('the attack choice shows only its selected effect and becomes spent at the next phase', () => {
  let state = use(custodesReminderState({ phase: 'fight' }), 'attacks');
  const active = card(unitPanel(state));
  assert.match(active, /Active this phase/);
  assert.match(active, /Add 3 to the Attacks characteristic of Trajann’s Watcher’s Axe/);
  assert.doesNotMatch(active, /3\+ invulnerable|data-record-rule-use/);
  state = { ...state, phase: 'command', turn: 2, activePlayer: 'p1' };
  state.history.push({ type: 'turn.started', payload: { turn: 2, phase: 'command' } });
  assert.equal(card(unitPanel(state)), '');
  const spent = card(renderRulesReminderDialog(state, { playerId: 'p1' }));
  assert.match(spent, /This limited ability has already been used/);
  assert.match(spent, /Recorded in round 1 · fight · \+3 Axe attacks/);
  assert.doesNotMatch(spent, /Active this phase|data-record-rule-use/);
  assert.throws(() => use(state, 'save'));
});

test('Moment Shackle’s once-per-army limit also blocks a second matching model', () => {
  let state = custodesReminderState();
  state.units.push({ ...state.units.find(unit => unit.id === 'trajann'), id: 'second-trajann' });
  state = use(state, 'save');
  assert.throws(() => recordRulesReminderUse(state, {
    playerId: 'p1', unitId: 'second-trajann', ruleId: 'moment-shackle', choice: 'attacks'
  }));
});

test('the choice button records Moment Shackle and immediate undo restores availability', () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const session = createGameSession(custodesReminderState());
  const events = new Map();
  const root = {
    querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener(name, fn) { events.set(name, fn); },
    removeEventListener(name) { events.delete(name); }
  };
  const controller = createRulesReminderController(root, { session, perspectivePlayerId: 'p1' });
  const attrs = { 'data-rule-player': 'p1', 'data-rule-unit': 'trajann',
    'data-rule-id': 'moment-shackle', 'data-rule-choice': 'attacks' };
  const button = { getAttribute: name => attrs[name] ?? null };
  events.get('click')({ target: { closest: selector => selector === '[data-record-rule-use]' ? button : null } });
  assert.match(card(unitPanel(session.getState())), /Active this phase/);
  assert.equal(session.getState().history.at(-1).payload.choice, 'attacks');
  events.get('click')({ target: { closest: selector => selector === '[data-undo-rule-use]' ? {} : null } });
  assert.match(card(unitPanel(session.getState())), /Available/);
  assert.ok(!getBattleRulesReminders(session.getState(), { playerId: 'p1' })
    .find(entry => entry.ruleId === 'moment-shackle').used);
  controller.destroy();
});
