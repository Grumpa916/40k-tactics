import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSelectedUnitStatePanel } from '../../src/ui/selected-unit-state-panel.js';
const state={players:[{id:'p1'}],units:[
  {id:'g1',name:'Contemptor-Galatus Dreadnought',ownerId:'p1',status:'deployed',
    unitUpgrades:[{name:'Memento Moritoi'}]},
  {id:'g2',name:'Contemptor-Galatus Dreadnought',ownerId:'p1',status:'deployed'}
]};
test('selected Galatus shows its own upgrade and stat row, not its duplicate’s',()=>{
  const enhanced=renderSelectedUnitStatePanel(state,'g1',{perspectivePlayerId:'p1'});
  const plain=renderSelectedUnitStatePanel(state,'g2',{perspectivePlayerId:'p1'});
  assert.match(enhanced,/Memento Moritoi/);
  assert.match(enhanced,/melee attacks gain/);
  assert.match(enhanced,/unit-state__profile/);
  assert.doesNotMatch(plain,/Memento Moritoi/);
});
