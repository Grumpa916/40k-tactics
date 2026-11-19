import test from 'node:test';
import assert from 'node:assert/strict';
import { getShootingState } from '../../src/rules/shooting-state.js';
import { renderShootingHistoryRow, renderShootingMapIdentity } from '../../src/ui/shooting-screen.js';

const units = [
  { id: 'telemon', name: 'Telemon Heavy Dreadnought', ownerId: 'p1' },
  { id: 'eradicators', name: 'Eradicator Squad with Melta Rifles', ownerId: 'p2' }
];

function shot(weaponId, weaponName) {
  return {
    type: 'combat.attack_resolved',
    payload: {
      attackerId: 'telemon',
      targetId: 'eradicators',
      weaponId,
      ...(weaponName == null ? {} : { weaponName }),
      phase: 'shooting',
      round: 2,
      turn: 1,
      actualDamage: 1,
      expectedDamage: 0.8,
      stateDelta: { target: { woundsAfter: 3, statusAfter: 'deployed' } }
    }
  };
}

test('recorded saved-roster weapon name survives projection and appears instead of internal ID', () => {
  const state = {
    phase: 'shooting',
    turn: 1,
    activePlayer: 'p1',
    battle: { round: 2, activePlayerId: 'p1' },
    units,
    history: [shot('datasheet:p1:telemon:3', 'Spiculus Bolt Launcher')]
  };
  const attack = getShootingState(state).attacks[0];
  assert.equal(attack.weaponId, 'datasheet:p1:telemon:3');
  assert.equal(attack.weaponName, 'Spiculus Bolt Launcher');
  const html = renderShootingHistoryRow(attack, state, { weapons: [] });
  assert.match(html, /Spiculus Bolt Launcher · 1 actual · 0\.8 expected · 3 wounds/);
  assert.doesNotMatch(html, /datasheet:/);
});

test('older attacks without a saved weaponName still resolve catalog names', () => {
  const state = { units };
  const html = renderShootingHistoryRow({
    attackerId: 'telemon', targetId: 'eradicators',
    weaponId: 'legacy-bolter', actualDamage: 2, expectedDamage: 2
  }, state, { weapons: [{ id: 'legacy-bolter', name: 'Storm Bolter' }] });
  assert.match(html, /Storm Bolter/);
  assert.doesNotMatch(html, /legacy-bolter/);
});

test('weapon names from history are escaped and remain separate from recorded IDs', () => {
  const state = { units };
  const html = renderShootingHistoryRow({
    attackerId: 'telemon', targetId: 'eradicators',
    weaponId: 'datasheet:p1:telemon:0', weaponName: 'Blaster <Arc>',
    actualDamage: 0, expectedDamage: 0
  }, state, { weapons: [] });
  assert.match(html, /Blaster &lt;Arc&gt;/);
  assert.doesNotMatch(html, /<Arc>/);
});


test('incomplete combat profiles record tabletop damage without fabricating a 0.0 forecast', () => {
  const state={
    phase:'shooting',turn:1,activePlayer:'p2',
    battle:{round:4,activePlayerId:'p2'},units,
    history:[{
      type:'combat.attack_resolved',payload:{
        attackerId:'eradicators',targetId:'telemon',weaponId:'multi-melta',
        weaponName:'Multi-melta - Hunter',phase:'shooting',round:4,turn:1,
        expectedDamage:null,actualDamage:2,
        stateDelta:{target:{woundsAfter:16,statusAfter:'deployed'}}
      }
    }]
  };
  const attack=getShootingState(state).attacks[0];
  assert.equal(attack.actualDamage,2);
  assert.equal(attack.expectedDamage,null);
  assert.equal(attack.targetWoundsAfter,16);
  const html=renderShootingHistoryRow(attack,state,{weapons:[]});
  assert.match(html,/Multi-melta - Hunter · 2 actual · estimate unavailable · 16 wounds/);
  assert.doesNotMatch(html,/0\.0 expected/);
});

test('a genuine forecast of 0.0 remains distinct from an unavailable forecast', () => {
  const item={attackerId:'eradicators',targetId:'telemon',weaponName:'Bolt pistol',
    expectedDamage:0,actualDamage:0,targetWoundsAfter:18};
  const html=renderShootingHistoryRow(item,{units},{weapons:[]});
  assert.match(html,/0 actual · 0\.0 expected · 18 wounds/);
});

test('legacy history without an expectedDamage field cannot use actual damage as the prediction', () => {
  const state={phase:'shooting',turn:1,activePlayer:'p2',battle:{round:4,activePlayerId:'p2'},units,
    history:[{type:'combat.attack_resolved',payload:{
      attackerId:'eradicators',targetId:'telemon',phase:'shooting',round:4,turn:1,
      actualDamage:2,stateDelta:{target:{woundsAfter:16}}
    }}]};
  const attack=getShootingState(state).attacks[0];
  assert.equal(attack.expectedDamage,null);
  assert.match(renderShootingHistoryRow(attack,state,{weapons:[]}),/estimate unavailable/);
});


test('identical squad names use stable target numbers in the map identity and phase history', () => {
  const duplicateUnits=[
    {id:'eradicators',name:'Eradicator Squad with Melta Rifles',ownerId:'p2'},
    {id:'land-speeder',name:'Land Speeder',ownerId:'p2'},
    {id:'allarus1',name:'Allarus Custodians',ownerId:'p1'},
    {id:'allarus2',name:'Allarus Custodians',ownerId:'p1'}
  ];
  const state={units:duplicateUnits};
  const banner=renderShootingMapIdentity(state,'land-speeder','allarus2');
  assert.match(banner,/Shooter[^<]*|Shooter/);
  assert.match(banner,/Target: Allarus Custodians 2/);
  assert.match(banner,/<strong>Allarus Custodians 2<\/strong>/);
  assert.doesNotMatch(banner,/Allarus Custodians 1/);

  const first=renderShootingHistoryRow({
    attackerId:'eradicators',targetId:'allarus1',
    weaponName:'Multi-melta - Hunter',actualDamage:2,expectedDamage:null,
    targetWoundsAfter:16
  },state,{weapons:[]});
  const second=renderShootingHistoryRow({
    attackerId:'land-speeder',targetId:'allarus2',
    weaponName:'Multi-melta',actualDamage:1,expectedDamage:null,
    targetWoundsAfter:16
  },state,{weapons:[]});
  assert.match(first,/Eradicator Squad with Melta Rifles → Allarus Custodians 1/);
  assert.match(second,/Land Speeder → Allarus Custodians 2/);
  assert.match(first,/2 actual · estimate unavailable · 16 wounds/);
  assert.match(second,/1 actual · estimate unavailable · 16 wounds/);
});

test('unique units and Precision allocations retain existing identity formatting', () => {
  const state={units:[
    {id:'marine',name:'Space Marine',ownerId:'p2'},
    {id:'custodes',name:'Custodian Guard',ownerId:'p1'},
    {id:'leader',name:'Blade Champion',ownerId:'p1'}
  ]};
  const html=renderShootingHistoryRow({
    attackerId:'marine',targetId:'custodes',allocationTargetId:'leader',
    weaponName:'Bolt rifle',actualDamage:1,expectedDamage:0.5
  },state,{weapons:[]});
  assert.match(html,/Space Marine → Custodian Guard \(Blade Champion\)/);
  assert.match(html,/1 actual · 0.5 expected/);
});
