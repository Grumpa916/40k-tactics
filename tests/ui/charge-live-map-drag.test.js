import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { createChargeScreen } from '../../src/ui/charge-screen.js';
import { COMMAND_TYPES } from '../../src/commands/game-commands.js';

function state(phase = 'charge') {
  return createGameState({
    phase,
    turn:1,
    activePlayer:'p1',
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    battle:{id:'b',status:'active',round:1,firstPlayerId:'p1',activePlayerId:'p1'},
    units:[
      {id:'charger',name:'Charger',ownerId:'p1',status:'deployed',position:{x:20,y:20}},
      {id:'support',name:'Support',ownerId:'p1',status:'deployed',position:{x:15,y:15}},
      {id:'enemy',name:'Enemy',ownerId:'p2',status:'deployed',position:{x:25,y:20}}
    ]
  });
}

function attachedState() {
  return createGameState({
    phase:'charge',
    turn:1,
    activePlayer:'p1',
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    battle:{id:'b',status:'active',round:1,firstPlayerId:'p1',activePlayerId:'p1'},
    armyRosters:{
      p1:{units:[
        {id:'wardens',name:'Custodian Wardens',attachedLeaderIds:['trajann']},
        {id:'trajann',name:'Trajann Valoris',attachedToBodyguardId:'wardens'}
      ]},
      p2:{units:[]}
    },
    units:[
      {id:'wardens-live',name:'Custodian Wardens',ownerId:'p1',status:'deployed',position:{x:20,y:20},metadata:{rosterUnitId:'wardens'}},
      {id:'trajann-live',name:'Trajann Valoris',ownerId:'p1',status:'deployed',position:{x:18,y:20},metadata:{rosterUnitId:'trajann'}},
      {id:'enemy',name:'Enemy',ownerId:'p2',status:'deployed',position:{x:25,y:20}}
    ]
  });
}

function setup(initial = state()) {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const session = createGameSession(initial);
  const handlers = {};
  const root = {
    innerHTML:'',
    replaceChildren() { this.innerHTML = ''; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener(type, handler) { handlers[type] = handler; },
    removeEventListener(type) { delete handlers[type]; }
  };
  const screen = createChargeScreen(root, { session, perspectivePlayerId:'p1' });
  const board = { getBoundingClientRect:() => ({left:0,top:0,width:600,height:440}) };
  function drag(unitId, destination) {
    const unit = session.getState().units.find(item => item.id === unitId);
    const marker = {
      style:{left:unit.position.x / 60 * 100 + '%',top:(44 - unit.position.y) / 44 * 100 + '%'},
      classList:{add() {},remove() {}},
      setPointerCapture() {},
      getAttribute:name => name === 'data-map-unit-id' ? unitId : null,
      closest:selector => selector === '[data-battlefield-map-board]' ? board : selector === '[data-map-mode="live"]' ? {} : null
    };
    const target = { closest:selector => selector === '[data-map-unit-id]' ? marker : null };
    handlers.pointerdown({target,pointerId:1,clientX:unit.position.x * 10,clientY:(44 - unit.position.y) * 10});
    handlers.pointermove({pointerId:1,clientX:destination.x * 10,clientY:(44 - destination.y) * 10,preventDefault() {}});
    handlers.pointerup({pointerId:1,clientX:destination.x * 10,clientY:(44 - destination.y) * 10});
  }
  return { session, root, screen, drag };
}

test('Charge live map lets the active player drag deployed units without adding a movement event', () => {
  const x = setup();
  try {
    const historyBefore = x.session.getState().history.length;
    assert.match(x.root.innerHTML, /Drag an active player's deployed unit/);
    x.drag('charger', {x:30,y:24});
    assert.deepEqual(x.session.getState().units.find(unit => unit.id === 'charger').position, {x:30,y:24});
    assert.equal(x.session.getState().history.length, historyBefore + 1);
    assert.equal(x.session.getState().history.at(-1).type, 'battlefield_map.position_adjusted');

    x.drag('support', {x:18,y:12});
    assert.deepEqual(x.session.getState().units.find(unit => unit.id === 'support').position, {x:18,y:12});
    assert.equal(x.session.getState().history.length, historyBefore + 2);
    assert.ok(x.session.getState().history.slice(historyBefore).every(e=>e.type==='battlefield_map.position_adjusted'));
  } finally {
    x.screen.destroy();
  }
});

test('Charge live map translates an attached Leader and Bodyguard together and one undo restores both', () => {
  const x = setup(attachedState());
  try {
    const historyBefore = x.session.getState().history.length;
    x.drag('trajann-live', {x:22,y:24});
    assert.deepEqual(x.session.getState().units.find(unit => unit.id === 'trajann-live').position, {x:22,y:24});
    assert.deepEqual(x.session.getState().units.find(unit => unit.id === 'wardens-live').position, {x:24,y:24});
    assert.equal(x.session.getState().history.length, historyBefore + 2);
    assert.equal(x.session.getLastCorrection()?.label, 'map move');

    assert.equal(x.session.undoLastAction(), true);
    assert.deepEqual(x.session.getState().units.find(unit => unit.id === 'wardens-live').position, {x:20,y:20});
    assert.deepEqual(x.session.getState().units.find(unit => unit.id === 'trajann-live').position, {x:18,y:20});
    assert.equal(x.session.getState().history.length, historyBefore);

    x.drag('wardens-live', {x:24,y:24});
    assert.deepEqual(x.session.getState().units.find(unit => unit.id === 'wardens-live').position, {x:24,y:24});
    assert.deepEqual(x.session.getState().units.find(unit => unit.id === 'trajann-live').position, {x:22,y:24});
    assert.ok(x.session.getState().history.slice(historyBefore).every(event => event.type === 'battlefield_map.position_adjusted'));
  } finally {
    x.screen.destroy();
  }
});

test('Charge formation drag clamps a shared delta at the battlefield edge', () => {
  const x = setup(attachedState());
  try {
    x.drag('wardens-live', {x:1,y:20});
    assert.deepEqual(x.session.getState().units.find(unit => unit.id === 'wardens-live').position, {x:2,y:20});
    assert.deepEqual(x.session.getState().units.find(unit => unit.id === 'trajann-live').position, {x:0,y:20});

    x.drag('wardens-live', {x:20,y:20});
    assert.deepEqual(x.session.getState().units.find(unit => unit.id === 'wardens-live').position, {x:20,y:20});
    assert.deepEqual(x.session.getState().units.find(unit => unit.id === 'trajann-live').position, {x:18,y:20});
  } finally {
    x.screen.destroy();
  }
});

test('Charge live map keeps opponent units locked', () => {
  const x = setup();
  try {
    const before = {...x.session.getState().units.find(unit => unit.id === 'enemy').position};
    x.drag('enemy', {x:10,y:10});
    assert.deepEqual(x.session.getState().units.find(unit => unit.id === 'enemy').position, before);
  } finally {
    x.screen.destroy();
  }
});

test('live map adjustment remains unavailable outside Movement and Charge', () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const session = createGameSession(state('shooting'));
  assert.throws(() => session.dispatch({
    type:COMMAND_TYPES.ADJUST_LIVE_MAP_POSITION,
    payload:{unitId:'charger',playerId:'p1',moves:[{modelId:'charger',position:{x:22,y:22}}]}
  }), /Movement or Charge phase/);
});
