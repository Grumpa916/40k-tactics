import test from 'node:test';
import assert from 'node:assert/strict';
import { filterCatalog, renderCatalogResults, renderArmyBuilder } from '../../src/ui/army-builder-view.js';
import { getCatalogRoleGroup } from '../../src/ui/army-builder-catalog-order.js';

const roster={schemaVersion:1,id:'r',name:'Swarm',faction:'Tyranids',pointsLimit:2000,units:[]};
const order=['epic-hero','character','battleline','monster','transport','other'];

test('default catalog order is Epic Heroes, Characters, Battleline, Monsters, Transports, then Other',()=>{
  const rows=filterCatalog({current:roster,sort:'name'});
  assert.ok(rows.length>20);
  const indexes=rows.map(unit=>order.indexOf(getCatalogRoleGroup(unit)));
  assert.ok(indexes.every(index=>index>=0));
  for(let i=1;i<indexes.length;i++) assert.ok(indexes[i]>=indexes[i-1],`${rows[i-1].name} should not sort after ${rows[i].name}`);
  const epic=rows.filter(unit=>getCatalogRoleGroup(unit)==='epic-hero');
  assert.ok(epic.some(unit=>unit.name==='The Swarmlord'));
  assert.ok(epic.some(unit=>unit.name==='Old One Eye'));
  const hiveTyrant=rows.find(unit=>unit.name==='Hive Tyrant');
  assert.equal(getCatalogRoleGroup(hiveTyrant),'character');
});

test('catalog renders fixed role headings and omits search/category/sort controls',()=>{
  const html=renderCatalogResults({current:roster,sort:'name',busy:false});
  const positions=['Epic Heroes','Characters','Battleline','Monsters','Transports','Other'].map(label=>html.indexOf(`>${label}</h4>`));
  const present=positions.filter(position=>position>=0);
  assert.ok(present.length>=4);
  assert.deepEqual([...present].sort((a,b)=>a-b),present);
  const builder=renderArmyBuilder({current:roster,page:'editor',records:[],players:[],unitSearch:'',category:'',sort:'name',fits:false,busy:false});
  assert.doesNotMatch(builder,/data-unit-search/);
  assert.doesNotMatch(builder,/data-catalog-category/);
  assert.doesNotMatch(builder,/data-catalog-sort/);
  assert.match(builder,/data-catalog-fits/);
  assert.match(builder,/grouped by battlefield role/);
});

test('internal alphabetical and points sorting remain available for non-UI callers',()=>{
  const alpha=filterCatalog({current:roster,sort:'alpha'});
  const names=alpha.map(unit=>unit.name);
  assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b)));
  const points=filterCatalog({current:roster,sort:'points'}).filter(unit=>unit.defaultPoints!=null);
  for(let i=1;i<points.length;i++) assert.ok(points[i].defaultPoints>=points[i-1].defaultPoints);
});
