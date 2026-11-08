import { renderScoreTransactions, scoreboardAdjustmentCommand } from "../../src/ui/scoreboard-transactions.js";
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { getCommandPointBalance, getCommandPointHistory } from '../../src/engine/command-points-ledger.js';
import { createBattleShell } from '../../src/ui/battle-shell.js';

test('command screen no longer renders full VP and CP adjustment sections',()=>{
 const src=fs.readFileSync(new URL('../../src/ui/command-screen.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/Victory Point score<\/h2>/);
 assert.doesNotMatch(src,/Command Point ledger<\/h2>/);
});

test('scoreboard opens compact VP and CP adjustment controls',()=>{
 const shell=fs.readFileSync(new URL('../../src/ui/battle-shell.js',import.meta.url),'utf8');
 const scoreboard=fs.readFileSync(new URL('../../src/ui/battle-shell-scoreboard.js',import.meta.url),'utf8');
 assert.match(shell,/data-open-score-adjust/);
 assert.match(scoreboard,/data-score-adjust-kind=\"vp\"/);
 assert.match(scoreboard,/data-score-adjust-kind=\"cp\"/);
});

test('live objective markers are clickable and have perspective colors',()=>{
 const src=fs.readFileSync(new URL('../../src/ui/battlefield-map.js',import.meta.url),'utf8');
 assert.match(src,/data-map-objective-id/);
 assert.match(src,/is-mine/);
 assert.match(src,/is-opponent/);
 assert.match(src,/is-contested/);
 const labels=fs.readFileSync(new URL('../../src/rules/objective-display-labels.js',import.meta.url),'utf8');
 assert.match(labels,/My Home/);
 assert.match(labels,/Opponent Home/);
});

test('canonical objectives default to uncontrolled',()=>{
 const src=fs.readFileSync(new URL('../../src/engine/battlefield-map-transitions.js',import.meta.url),'utf8');
 assert.match(src,/controlState: \"uncontrolled\"/);
});


test('score adjustment can collapse, refresh in place, and report adjustment results',()=>{
 const shell=fs.readFileSync(new URL('../../src/ui/battle-shell.js',import.meta.url),'utf8');
 const scoreboard=fs.readFileSync(new URL('../../src/ui/battle-shell-scoreboard.js',import.meta.url),'utf8');
 assert.match(scoreboard,/data-toggle-score-adjust-collapse/);
 assert.match(shell,/data-score-adjust-host/);
 assert.match(shell,/scoreAdjustHost\.innerHTML = renderScoreAdjustOverlay/);
 assert.match(shell,/scoreAdjustMessage/);
 assert.match(shell,/stopPropagation/);
});

test('scoreboard CP buttons record manual changes for either player', () => {
 clearCommandHandlers(); registerCoreCommandHandlers();
 const state = createGameState({ phase: 'movement', turn: 1, activePlayer: 'p1', players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }], units: [], commandPoints: { p1: 2, p2: 1 }, battle: { id: 'test', status: 'active', round: 1, activePlayerId: 'p1' } });
 const session = createGameSession(state);
 const listeners = new Set();
 const screen = { innerHTML: '', replaceChildren() {} };
 const root = { innerHTML: '', replaceChildren() {}, contains: () => true, querySelector: selector => selector === '[data-battle-screen]' ? screen : null,
  addEventListener(type, fn) { if (type === 'click') listeners.add(fn); }, removeEventListener(type, fn) { listeners.delete(fn); } };
 const shell = createBattleShell(root, { session, screenFactories: {} });
 const click = (selector, attrs) => {
  const button = { getAttribute: key => attrs[key] ?? null };
  const event = { preventDefault() {}, stopPropagation() {}, target: { closest: value => value === selector ? button : null } };
  for (const fn of [...listeners]) fn(event);
 };
 try {
  click('[data-open-score-adjust]', { 'data-open-score-adjust': 'p1', 'data-open-score-adjust-kind': 'cp' });
  click('[data-score-adjust-kind]', { 'data-score-adjust-kind': 'cp', 'data-score-adjust-amount': '1' });
  assert.equal(getCommandPointBalance(session.getState(), 'p1'), 3);
  click('[data-score-adjust-kind]', { 'data-score-adjust-kind': 'cp', 'data-score-adjust-amount': '-1' });
  assert.equal(getCommandPointBalance(session.getState(), 'p1'), 2);
  click('[data-open-score-adjust]', { 'data-open-score-adjust': 'p2', 'data-open-score-adjust-kind': 'cp' });
  click('[data-score-adjust-kind]', { 'data-score-adjust-kind': 'cp', 'data-score-adjust-amount': '1' });
  assert.equal(getCommandPointBalance(session.getState(), 'p2'), 2);
  assert.deepEqual(getCommandPointHistory(session.getState()).map(item => item.reason), ['adjustment', 'adjustment', 'adjustment']);
 } finally { shell.destroy(); }
});

test('scoreboard reason choices preserve CP ledger semantics and transaction history',()=>{
 const state=createGameState({phase:'shooting',turn:2,activePlayer:'p1',players:[{id:'p1',name:'You'}],units:[],commandPoints:{p1:2},battle:{status:'active',round:1}});
 const spend=scoreboardAdjustmentCommand(state,{playerId:'p1',kind:'cp',amount:-1,reason:'stratagem'});
 assert.equal(spend.payload.reason,'spend'); assert.throws(()=>scoreboardAdjustmentCommand(state,{playerId:'p1',kind:'cp',amount:1,reason:'spend'}),/−1/);
 const vp=scoreboardAdjustmentCommand(state,{playerId:'p1',kind:'vp',amount:-1,reason:'missed'});assert.equal(vp.payload.reason,'Missed score');
 const html=renderScoreTransactions({...state,history:[{type:'command_points.changed',payload:{playerId:'p1',amount:-1,reason:'spend',note:'Stratagem spend',turn:2,round:1,phase:'shooting',balanceBefore:2,balanceAfter:1}}]},'p1','cp');
 assert.match(html,/Stratagem spend/);assert.match(html,/Round 1 · Turn 2 · shooting · Balance 1/);
});
