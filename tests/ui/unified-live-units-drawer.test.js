import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPrototypeWorkspace } from '../../src/ui/prototype-workspace.js';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { createShootingScreen } from '../../src/ui/shooting-screen.js';
import { createChargeTabletopScreen } from '../../src/ui/charge-tabletop-screen.js';
import { createFightTabletopScreen } from '../../src/ui/fight-tabletop-screen.js';
import { fakeDom } from '../helpers/combat-dom.js';

const gameData={weapons:[
  {id:'gun',name:'Ranged cannon',type:'ranged',characteristics:{range:36,attacks:2,skill:3,strength:6,ap:-1,damage:1}},
  {id:'sword',name:'Blade',type:'melee',characteristics:{attacks:3,skill:3,strength:5,ap:-1,damage:2}}
]};

function state(phase){
  const unit=(id,ownerId,x)=>({id,name:id,ownerId,status:'deployed',wounds:12,
    position:{x,y:20},profile:{weaponIds:['gun','sword'],characteristics:{toughness:5,save:3}}});
  const next=createGameState({
    phase,turn:1,activePlayer:'p1',
    battle:{id:'b',status:'active',round:1,firstPlayerId:'p1',activePlayerId:'p1'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    units:[unit('custodian','p1',20),unit('marine','p2',25)]
  });
  if(phase==='fight')next.history.push({type:'charge.outcome_recorded',
    payload:{unitId:'custodian',playerId:'p1',outcome:'successful',
      targetIds:['marine'],measuredDistances:{marine:5},round:1,turn:1}});
  return next;
}

test('single Units toggle controls the Shooting, Charge and Fight drawer without opening the phase panel',()=>{
  const attrs={};const handlers={};const button={hidden:true,attrs:{},
    setAttribute(k,v){this.attrs[k]=v;}};
  const shell={setAttribute(k,v){attrs[k]=v;}};
  const drawer={id:'live-units'};
  let phase='shooting',activePlayer='p1';
  const container={
    querySelector(sel){return ({
      '.battle-shell':shell,
      '.shoot-screen--tabletop, .combat-workspace':{},
      '#live-units':drawer,
      '[data-movement-roster-toggle]':button
    })[sel]??null;},
    querySelectorAll(){return[];},
    addEventListener(type,fn){handlers[type]=fn;},
    removeEventListener(type){delete handlers[type];}
  };
  const workspace=createPrototypeWorkspace(container,{session:{
    getState:()=>({phase,activePlayer,players:[{id:'p1'},{id:'p2'}]})
  }});
  const tap=attribute=>({closest(sel){return sel===attribute?button:null;}});
  const selected={closest(sel){return sel.includes('[data-select-phase-unit]')?{}:null;}};
  workspace.refresh();
  assert.equal(button.hidden,false);
  assert.equal(button.attrs['aria-controls'],'live-units');
  assert.equal(button.attrs['aria-expanded'],'false');
  assert.equal(attrs['data-controls-collapsed'],'true');
  handlers.click({target:tap('[data-movement-roster-toggle]')});
  assert.equal(attrs['data-live-roster-open'],'true');
  assert.equal(button.attrs['aria-expanded'],'true');
  // The phase's actual selection handler runs on the row/map marker. The
  // workspace dismisses the drawer without expanding the right panel.
  handlers.click({target:selected});
  assert.equal(attrs['data-live-roster-open'],'false');
  assert.equal(attrs['data-controls-collapsed'],'true');
  handlers.click({target:tap('[data-movement-roster-toggle]')});
  handlers.keydown({key:'Escape',target:null});
  assert.equal(attrs['data-live-roster-open'],'false');
  handlers.click({target:tap('[data-movement-roster-toggle]')});
  phase='charge';workspace.refresh();
  assert.equal(attrs['data-live-roster-open'],'false','phase switch closes drawer');
  assert.equal(attrs['data-controls-collapsed'],'true');
  handlers.click({target:tap('[data-movement-roster-toggle]')});
  phase='fight';activePlayer='p2';workspace.refresh();
  assert.equal(attrs['data-live-roster-open'],'false');
  assert.equal(button.hidden,false);
  workspace.destroy();
});

test('all three combat phases have a map-first drawer with no duplicate unit picker in right panel',()=>{
  clearCommandHandlers();registerCoreCommandHandlers();
  const trials=[
    ['shooting',createShootingScreen],
    ['charge',createChargeTabletopScreen],
    ['fight',createFightTabletopScreen]
  ];
  for(const [phase,create] of trials){
    const session=createGameSession(state(phase)),root=fakeDom();
    const screen=create(root,{session,perspectivePlayerId:'p1',gameData});
    try{
      const html=root.innerHTML;
      assert.match(html,/id="live-units"/,phase);
      assert.match(html,/phase-army-roster__tabs/,phase);
      assert.match(html,/data-select-phase-unit="custodian"/,phase);
      assert.match(html,/data-map-unit-id="custodian"/,phase);
      assert.doesNotMatch(html,/data-shooting-unit-picker|data-charge-unit=|data-fight-select=/,phase);
      if(phase==='shooting'){
        assert.match(html,/phase-army-roster__section-heading">Ready/);
        root.click('[data-select-phase-unit]','custodian');
        assert.match(root.innerHTML,/data-choice-shoot/);
        assert.match(root.innerHTML,/class="phase-selected-vitals"/);
        assert.match(root.innerHTML,/data-adjust-unit-wounds="-1"/);
        assert.match(root.innerHTML,/data-toggle-live-battle-shock/);
      }else if(phase==='charge'){
        assert.match(html,/phase-army-roster__section-heading">Eligible chargers/);
        assert.doesNotMatch(html,/<summary>Available chargers/);
        root.click('[data-select-phase-unit]','custodian');
        assert.match(root.innerHTML,/class="phase-selected-vitals"/);
        assert.match(root.innerHTML,/data-adjust-unit-wounds="-1"/);
        assert.match(root.innerHTML,/data-toggle-live-battle-shock/);
      }else{
        assert.match(html,/phase-army-roster__section-heading">Other eligible fighters/);
        assert.doesNotMatch(html,/class="fight-order"/);
        root.click('[data-select-phase-unit]','custodian');
        assert.match(root.innerHTML,/data-fight-weapon/);
        assert.match(root.innerHTML,/class="phase-selected-vitals"/);
        assert.match(root.innerHTML,/data-adjust-unit-wounds="-1"/);
        assert.match(root.innerHTML,/data-toggle-live-battle-shock/);
      }
    }finally{screen.destroy();}
  }
});

test('phase roster CSS removes permanent list column without changing Movement drawer',()=>{
  const css=readFileSync(new URL('../../src/ui/styles/phase-army-roster.css',import.meta.url),'utf8');
  const unified=css.slice(css.lastIndexOf('/* Priority 2: one-tap Units drawer'));
  assert.match(unified,/\.shoot-screen--tabletop\.has-army-roster/);
  assert.match(unified,/data-combat-phase="charge"/);
  assert.match(unified,/data-combat-phase="fight"/);
  assert.match(unified,/grid-template-columns:minmax\(0,2\.55fr\) minmax\(290px,1fr\) !important/);
  assert.match(unified,/#live-units \{[\s\S]*?position:absolute !important/);
  assert.match(unified,/data-live-roster-open="true"/);
  assert.doesNotMatch(unified,/#movement-units/,'old Movement drawer retained unchanged');
});
