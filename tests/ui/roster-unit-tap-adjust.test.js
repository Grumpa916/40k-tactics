import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleRosterUnitAdjustment, bindLiveCasualtyControls } from '../../src/ui/live-casualty-controls.js';
import { renderPhaseArmyRoster } from '../../src/ui/phase-army-roster.js';
import { renderMovementRosterRail } from '../../src/ui/movement-dashboard-view.js';
import { readFileSync } from 'node:fs';

function fixture() {
  return {
    battle:{status:'active',round:1,activePlayerId:'p1'},phase:'command',activePlayer:'p1',
    players:[{id:'p1'},{id:'p2'}],history:[],objectives:[],
    units:[
      {id:'leader',ownerId:'p1',name:'Trajann Valoris',status:'deployed',wounds:10,startingWounds:10},
      {id:'enemy',ownerId:'p2',name:'Enemy Unit',status:'deployed',wounds:4,startingWounds:5},
      {id:'lost',ownerId:'p2',name:'Destroyed Unit',status:'destroyed',wounds:0,startingWounds:5}
    ]
  };
}

test('unit-row tap toggles its own controls, leaving selection and details attributes intact', () => {
  const state=fixture();
  const html=renderPhaseArmyRoster(state,'p1',{selectedUnitId:'leader',selectableIds:['leader']});
  const selected=html.match(/<button[^>]*class="phase-army-roster__unit"[^>]*data-select-phase-unit="leader"[^>]*>/)?.[0];
  assert.ok(selected);
  assert.match(selected,/data-roster-adjust-toggle="leader"/);
  assert.match(selected,/aria-pressed="true"/);
  assert.match(selected,/aria-expanded="false"/);
  assert.match(html,/data-open-unit-details="leader"/);
  assert.match(html,/data-roster-adjust-toggle="enemy"/);
  assert.match(html,/data-open-unit-details="enemy"/);
  assert.doesNotMatch(html,/data-roster-adjust-toggle="lost"/);
  assert.match(html,/data-open-unit-details="lost"/);
  assert.equal((html.match(/Adjust W \/ BS/g) ?? []).length,0);
});

test('capture-phase handler expands and collapses one unit without dispatching game commands', () => {
  const editor={open:false};
  const row={
    attributes:{},
    closest(selector){return selector==='.phase-army-roster__entry, .movement-roster__item'
      ? {querySelector: selector => selector==='.roster-unit-editor' ? editor : null} : null;},
    setAttribute(key,val){this.attributes[key]=val;}
  };
  const target={closest: selector => selector==='[data-roster-adjust-toggle]' ? row : null};
  const events={};
  let calls=0;
  const container={
    contains: el=>el===row,
    addEventListener(name,fn,capture){events[name+(capture?'Capture':'Bubble')]=fn;},
    removeEventListener(){calls++;}
  };
  const handler=bindLiveCasualtyControls(container,{session:{dispatch(){throw Error('No game command expected');}}});
  assert.equal(typeof events.clickCapture,'function');
  assert.equal(typeof events.clickBubble,'function');
  events.clickCapture({target});
  assert.equal(editor.open,true);
  assert.equal(row.attributes['aria-expanded'],'true');
  events.clickCapture({target});
  assert.equal(editor.open,false);
  assert.equal(row.attributes['aria-expanded'],'false');
  assert.equal(toggleRosterUnitAdjustment({target:{closest:()=>null}},container),false);
  handler.destroy();
  assert.equal(calls,2);
});

test('Movement uses the same expandable name row, keeping acting selection and info distinct', () => {
  const state={...fixture(),phase:'movement'};
  const html=renderMovementRosterRail(state,{playerId:'p1',perspectivePlayerId:'p1',selectedUnitId:'leader'});
  assert.match(html,/data-move-roster-unit="leader" data-roster-adjust-toggle="leader"/);
  assert.match(html,/data-roster-adjust-toggle="enemy"/);
  assert.match(html,/data-open-unit-details="enemy"/);
  assert.match(html,/data-open-unit-details="lost"/);
  assert.doesNotMatch(html,/roster-unit-editor-leader"[^>]* open/);
  const css=readFileSync(new URL('../../src/ui/styles/roster-unit-adjust.css',import.meta.url),'utf8');
  assert.match(css,/\.roster-unit-editor:not\(\[open\]\) \{ display:none; \}/);
});
