import test from 'node:test';
import assert from 'node:assert/strict';
import { mapUnitLabels, shortMapUnitName } from '../../src/ui/map-unit-labels.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';

test('compact labels retain recognizable names and distinguish Norn variants', () => {
  assert.equal(shortMapUnitName({name:'Exocrine'}), 'Exocrine');
  assert.equal(shortMapUnitName({name:'Norn Emissary'}), 'Norn Emiss.');
  assert.equal(shortMapUnitName({name:'Norn Assimilator'}), 'Norn Assim.');
  assert.notEqual(shortMapUnitName({name:'Custodian Guard'}), shortMapUnitName({name:'Custodian Wardens'}));
  assert.ok(shortMapUnitName({name:'An unfamiliar very long unit name'}).length <= 12);
});

const unit = (id, ownerId, status = 'deployed') => ({id, ownerId, name:'Exocrine', status, position:{x:10,y:10}});
test('duplicate numbers remain stable through casualties, reserves and perspective changes', () => {
  const units = [unit('a','p1'),unit('b','p1'),unit('c','p2')];
  const before = mapUnitLabels(units);
  assert.equal(before.get('a'), 'Exocrine 1');
  assert.equal(before.get('b'), 'Exocrine 2');
  assert.equal(before.get('c'), 'Exocrine');
  units[0].status = 'destroyed';
  units[2].status = 'reserves';
  assert.deepEqual(mapUnitLabels(units), before);
  for (const perspectivePlayerId of ['p1','p2']) {
    const html = renderBattlefieldMap({units}, {compactMarkers:true,perspectivePlayerId});
    assert.match(html, />Exocrine 2<\/div>/);
    assert.doesNotMatch(html, />Exocrine 1<\/div>/);
  }
});

test('selected full name is visible and escaped; activation badge and unit identity survive', () => {
  const units = [{...unit('a','p1'),name:'Norn <Emissary> & leader'}];
  const html = renderBattlefieldMap({units}, {compactMarkers:true,selectedUnitId:'a',activationForUnit:()=> 'resolved'});
  assert.match(html, /Selected: <strong>Norn &lt;Emissary&gt; &amp; leader<\/strong>/);
  assert.match(html, /data-map-unit-id="a"/);
  assert.match(html, /Activation complete/);
  assert.doesNotMatch(html, /<Emissary>/);
});
