import test from 'node:test';
import assert from 'node:assert/strict';
import { liveUnitSymbolLabels } from '../../src/ui/live-map-symbols.js';
import { mapUnitLabels, shortMapUnitName, unitDisplayLabels } from '../../src/ui/map-unit-labels.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';

test('compact labels retain recognizable names and distinguish variants', () => {
  assert.equal(shortMapUnitName({name:'Exocrine'}), 'Exocrine');
  assert.equal(shortMapUnitName({name:'Norn Emissary'}), 'Norn Em');
  assert.equal(shortMapUnitName({name:'Norn Assimilator'}), 'Norn As');
  assert.equal(shortMapUnitName({name:'Blade Champion'}), 'B. Champ');
  assert.equal(shortMapUnitName({name:'Shield-Captain'}), 'S. Capt');
  assert.equal(shortMapUnitName({name:'Hormagaunts'}), 'Horm');
  assert.equal(shortMapUnitName({name:'Termagants'}), 'Term');
  assert.equal(shortMapUnitName({name:'Tyrannofex'}), 'Tfex');
  assert.notEqual(shortMapUnitName({name:'Custodian Guard'}), shortMapUnitName({name:'Custodian Wardens'}));
  assert.equal(shortMapUnitName({name:'Captain in Gravis Armour'}), 'Captain Gravis');
  assert.equal(shortMapUnitName({name:'Hellblaster Squad'}), 'Hellblaster');
  assert.equal(shortMapUnitName({name:'Librarian in Terminator Armour'}), 'Librarian Term.');
  assert.ok(shortMapUnitName({name:'An unfamiliar very long unit name'}).length <= 15);
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

test('full unit names use the same stable duplicate numbers as map markers', () => {
  const units = [
    {...unit('a','p1'),name:'Sentinel Guard Sodality'},
    {...unit('b','p1'),name:'Sentinel Guard Sodality'},
    {...unit('c','p2'),name:'Sentinel Guard Sodality'}
  ];
  const labels = unitDisplayLabels(units);
  assert.equal(labels.get('a'), 'Sentinel Guard Sodality 1');
  assert.equal(labels.get('b'), 'Sentinel Guard Sodality 2');
  assert.equal(labels.get('c'), 'Sentinel Guard Sodality');
  assert.equal(mapUnitLabels(units).get('a'), 'Sent 1');
  assert.equal(mapUnitLabels(units).get('b'), 'Sent 2');
  const html = renderBattlefieldMap({units}, {compactMarkers:true,selectedUnitId:'a',perspectivePlayerId:'p1'});
  assert.match(html, /Selected: <strong>Sentinel Guard Sodality 1<\/strong>/);
  assert.match(html, /aria-label="Select Sentinel Guard Sodality 1"/);
});

test('selected full name is visible and escaped; activation badge and unit identity survive', () => {
  const units = [{...unit('a','p1'),name:'Norn <Emissary> & leader'}];
  const html = renderBattlefieldMap({units}, {compactMarkers:true,selectedUnitId:'a',activationForUnit:()=> 'resolved'});
  assert.match(html, /Selected: <strong>Norn &lt;Emissary&gt; &amp; leader<\/strong>/);
  assert.match(html, /data-map-unit-id="a"/);
  assert.match(html, /Activation complete/);
  assert.doesNotMatch(html, /<Emissary>/);
});

test('attached characters use bodyguard plus each leader, and dreadnought variants stay distinct', () => {
  assert.equal(shortMapUnitName({name:'Telemon Dreadnought'}), 'TEL');
  assert.equal(shortMapUnitName({name:'Galatus Dreadnought'}), 'CGD');
  assert.equal(shortMapUnitName({name:'Ballistus Dreadnought'}), 'BAD');
  assert.equal(shortMapUnitName({name:'Brutalis Dreadnought'}), 'BRD');
  assert.notEqual(shortMapUnitName({name:'Ballistus Dreadnought'}), shortMapUnitName({name:'Brutalis Dreadnought'}));
  const units = [
    {id:'term-a',ownerId:'p1',name:'Terminator Squad',status:'deployed',position:{x:8,y:8},metadata:{rosterUnitId:'term-a-roster'}},
    {id:'term-b',ownerId:'p1',name:'Terminator Squad',status:'deployed',position:{x:18,y:8},metadata:{rosterUnitId:'term-b-roster'}},
    {id:'calgar',ownerId:'p1',name:'Marneus Calgar in Armour of Antilochus',status:'deployed',position:{x:19,y:10},metadata:{rosterUnitId:'calgar-roster'}},
    {id:'honour',ownerId:'p1',name:'Victrix Honour Guard',status:'deployed',position:{x:30,y:8},metadata:{rosterUnitId:'honour-roster'}},
    {id:'ancient',ownerId:'p1',name:'Ancient',status:'deployed',position:{x:32,y:9},metadata:{rosterUnitId:'ancient-roster'}},
    {id:'lieutenant',ownerId:'p1',name:'Lieutenant',status:'deployed',position:{x:31,y:10},metadata:{rosterUnitId:'lieutenant-roster'}},
    {id:'telemon',ownerId:'p1',name:'Telemon Dreadnought',status:'deployed',position:{x:12,y:20},metadata:{datasheetId:'adeptus-custodes:telemon-heavy-dreadnought',rosterUnitId:'telemon-roster'}},
    {id:'galatus',ownerId:'p1',name:'Galatus Dreadnought',status:'deployed',position:{x:24,y:20},metadata:{datasheetId:'adeptus-custodes:contemptor-galatus-dreadnought',rosterUnitId:'galatus-roster'}}
  ];
  const state = {
    units,
    armyRosters:{p1:{units:[
      {id:'term-a-roster',name:'Terminator Squad'},
      {id:'term-b-roster',name:'Terminator Squad',attachedLeaderIds:['calgar-roster']},
      {id:'calgar-roster',name:'Marneus Calgar in Armour of Antilochus',attachedToBodyguardId:'term-b-roster'},
      {id:'honour-roster',name:'Victrix Honour Guard',attachedLeaderIds:['ancient-roster','lieutenant-roster']},
      {id:'ancient-roster',name:'Ancient',attachedToBodyguardId:'honour-roster'},
      {id:'lieutenant-roster',name:'Lieutenant',attachedToBodyguardId:'honour-roster'},
      {id:'telemon-roster',name:'Telemon Heavy Dreadnought',unitUpgrades:[{name:'Memento Moritoi'}]},
      {id:'galatus-roster',name:'Contemptor-Galatus Dreadnought',unitUpgrades:['Augury Uplink']}
    ]}}
  };
  const symbols = liveUnitSymbolLabels(units, state);
  assert.equal(symbols.get('term-b'), 'TE2');
  assert.equal(symbols.get('calgar'), 'MC');
  assert.equal(symbols.get('telemon'), 'TEL/MM');
  assert.equal(symbols.get('galatus'), 'CGD/AU');
  assert.equal(unitDisplayLabels(units, state).get('telemon'), 'Telemon Dreadnought · Memento Moritoi');
  assert.equal(unitDisplayLabels(units, state).get('galatus'), 'Galatus Dreadnought · Augury Uplink');
  const html = renderBattlefieldMap(state, {compactMarkers:true,perspectivePlayerId:'p1'});
  assert.match(html, /data-map-formation-symbol="TE2\+MC"/);
  assert.match(html, /data-map-formation-symbol="VH\+ANC\+LIE"/);
  assert.doesNotMatch(html, /data-map-formation-symbol="[^"]*\+\d+"/);
  assert.match(html, /<strong>TEL\/MM<\/strong> Telemon Dreadnought · Memento Moritoi/);
  assert.match(html, /<strong>CGD\/AU<\/strong> Galatus Dreadnought · Augury Uplink/);
  assert.doesNotMatch(html, /data-map-unit-id="calgar"|data-map-unit-id="ancient"|data-map-unit-id="lieutenant"/);
});

test('live map closes zoom wrappers before selected names, legends and notices', async () => {
  const { createLiveMapView } = await import('../../src/ui/live-map-view.js');
  const state = { units:[unit('a','p1')] };
  for (const options of [{}, {selectedUnitId:'a'}, {selectedUnitId:'a',showUnits:false}]) {
    const html = createLiveMapView().render(state, options);
    const stack = [];
    for (const token of html.matchAll(/<div\b[^>]*>|<\/div>|<p\b[^>]*>/g)) {
      if (token[0].startsWith('<div')) {
        if (token[0].includes('battlefield-map__legend')) {
          assert.ok(!stack.some(tag => /live-map__(canvas|viewport)/.test(tag)));
        }
        stack.push(token[0]);
      } else if (token[0] === '</div>') {
        assert.ok(stack.length > 0);
        stack.pop();
      } else {
        assert.ok(!stack.some(tag => /live-map__(canvas|viewport)/.test(tag)));
      }
    }
    assert.equal(stack.length, 0);
  }
});
