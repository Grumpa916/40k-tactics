import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getLiveMapStatusBadges, applyLiveMapStatusBadges } from '../../src/ui/live-map-status-badges.js';

function state(overrides = {}) {
  return {
    phase:'fight', turn:2, activePlayer:'p1',
    battle:{status:'active',round:2,turn:2,activePlayerId:'p1',firstPlayerId:'p1'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    units:[
      {id:'a',ownerId:'p1',name:'Custodian Guard',status:'deployed',battleShocked:true,position:{x:10,y:10}},
      {id:'b',ownerId:'p2',name:'Enemy',status:'deployed',position:{x:20,y:10}}
    ],
    objectives:[],history:[{
      type:'charge.outcome_recorded',
      payload:{unitId:'a',targetIds:['b'],outcome:'successful',round:2,turn:2}
    }],
    ...overrides
  };
}

test('map badges show current relevant unit states without replacing the compact marker', () => {
  const current = state();
  const badges = getLiveMapStatusBadges(current,'a');
  const labels = badges.map(item => item.label);
  assert.ok(labels.includes('Battle-shocked'));
  assert.ok(labels.includes('Engaged'));
  assert.ok(labels.includes('Charged this turn'));
  assert.equal(labels.includes('Activated / Resolved'), false);

  const html = applyLiveMapStatusBadges(
    '<div class="battlefield-map__unit friendly is-compact" data-map-unit-id="a" title="Custodian Guard">CG</div>',
    current
  );
  assert.match(html, />CG<span class="unit-map-status-badges"/);
  assert.match(html, /Battle-shocked/);
  assert.match(html, /Charged this turn/);
});

test('Custodes map badges use the approved readied, re-readied and active colors', () => {
  const custodes = state({
    phase:'movement',
    armyRosters:{p1:{faction:'Adeptus Custodes',units:[{
      id:'roster-a',
      datasheet:{name:'Custodian Guard',keywords:['Infantry','Adeptus Custodes'],abilities:[{name:"Martial Ka'tah"}]}
    }]}},
    units:[{id:'a',ownerId:'p1',name:'Custodian Guard',status:'deployed',position:{x:10,y:10},metadata:{rosterUnitId:'roster-a'}}],
    history:[]
  });
  const ready = getLiveMapStatusBadges(custodes,'a').find(item => item.label === "Martial Ka'tah readied");
  assert.equal(ready?.className,'is-katah-readied');

  const active = state({
    phase:'movement',
    armyRosters:custodes.armyRosters,
    units:custodes.units,
    history:[{type:'custodes.katah_expended',payload:{playerId:'p1',unitId:'a',katahName:'Calistus',cycleRound:2,round:2,turn:2,phase:'movement'}}]
  });
  const activeBadge = getLiveMapStatusBadges(active,'a').find(item => item.label === "Martial Ka'tah Calistus active");
  assert.equal(activeBadge?.className,'is-katah-active');
});

test('map badges are omitted when a unit has no current visible status', () => {
  const current = state({phase:'movement',units:[{id:'plain',ownerId:'p2',name:'Opponent',status:'deployed'}],history:[]});
  assert.deepEqual(getLiveMapStatusBadges(current,'plain'),[]);
});

test('friendly live-map units stack above enemy units so friendly status badges remain visible', () => {
  const css = readFileSync(new URL('../../src/ui/styles/live-map-symbols.css', import.meta.url), 'utf8');
  const opponent = css.match(/\.battlefield-map__unit\.opponent\s*\{[^}]*z-index:(\d+)/s);
  const friendly = css.match(/\.battlefield-map__unit\.friendly\s*\{[^}]*z-index:(\d+)/s);
  const badges = css.match(/\.unit-map-status-badges\s*\{[^}]*z-index:(\d+)/s);
  assert.ok(opponent && friendly && badges);
  assert.ok(Number(friendly[1]) > Number(opponent[1]));
  assert.ok(Number(badges[1]) > Number(friendly[1]));
});
