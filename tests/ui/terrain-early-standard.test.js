import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_COMPANION_MAP_CATALOG as C } from '../../src/data/event-companion-map-catalog.js';
import { getEventCompanionPlacementCandidate as candidate } from '../../src/data/event-companion-placement-candidates.js';
import { getEventCompanionTerrainMirrorPolicy as mirror } from '../../src/rules/event-companion-terrain-mirror-policy.js';
import { getEventCompanionTerrainPlacementReviewStatus as status } from '../../src/data/event-companion-placement-review-status.js';
import { buildCandidateTerrainPlacementOverlay, buildCanonicalTerrainPlacementOverlay as canonical, buildCompleteTerrainPlacementOverlay as complete, terrainGuideViolatesOwnTerrain } from '../../src/ui/terrain-placement-guide-model.js';
import { transformEventCompanionPlacement } from '../../src/rules/event-companion-terrain-placement-policy.js';
const counts=[17,20,18,18,20,19,21,19,20], opposite={left:'right',right:'left',top:'bottom',bottom:'top'};
for(let page=9;page<=17;page++)test(`Page ${page} meets the common source, canonical, mirror, and source-exception standard`,()=>{
 const l=C.layouts.find(l=>l.page===page),raw=candidate(page),a=canonical(l),b=complete(l);
 assert.equal(raw.sourceAudit.terrainGuideCount,counts[page-9]);assert.equal(a.guides.length,counts[page-9]);
 assert.equal(raw.sourceAudit.printedDimensionCount,raw.guides.length+raw.sourceAudit.excludedDeploymentDimensions.length);
 assert.equal(raw.sourceAudit.ambiguousCount,0);assert.equal(status(page).mirrorConfirmed,true);
 assert.deepEqual(buildCandidateTerrainPlacementOverlay(l),a);
 assert.deepEqual(b.guides.filter(g=>!g.mirrored),a.guides);
 assert.equal(new Set(b.guides.map(g=>g.terrain)).size,16);
 for(const g of a.guides){
  assert.equal(g.edge,transformEventCompanionPlacement(g.sourceAnchor,g.sourceEdge,'flipX').edge);
  assert.ok(raw.guides.some(o=>o.value===g.value&&o.sourceAnchor.every((x,i)=>x===g.sourceAnchor[i])));
  const id=[g.value,...g.sourceAnchor].join('|');
  if(g.preserveSourcePoint){assert.deepEqual(g.anchor,transformEventCompanionPlacement(g.sourceAnchor,g.sourceEdge,'flipX').point);assert.ok(raw.sourceAudit.sourcePointExceptions.some(e=>e.sourceIdentity===id));}
  else assert.ok(l.terrainGeometry[g.terrain].points.some(p=>p.x===g.anchor[0]&&p.y===g.anchor[1]));
  if(terrainGuideViolatesOwnTerrain(l,g))assert.ok(raw.sourceAudit.sourcePathExceptions.includes(id));
 }
 for(const g of b.guides.filter(g=>g.mirrored)){
  const o=a.guides.find(o=>o.terrain===g.mirroredFromTerrain&&o.value===g.value&&opposite[o.edge]===g.edge&&o.anchor.every((x,i)=>x===g.mirroredFromAnchor[i]));assert.ok(o);assert.equal(g.terrain,mirror(page).terrainMap[o.terrain]);
  if(o.preserveSourcePoint)assert.deepEqual(g.anchor,transformEventCompanionPlacement(o.anchor,o.edge,'rotate180').point);
 }
});
for(let page=9;page<=53;page++)test(`Full range Page ${page}: all terrain covered, canonical preserved, boxed focus data available`,()=>{
 const l=C.layouts.find(l=>l.page===page),a=canonical(l),b=complete(l);
 assert.ok(a.guides.length>0);assert.equal(new Set(b.guides.map(g=>g.terrain)).size,16);assert.deepEqual(b.guides.filter(g=>!g.mirrored),a.guides);
 assert.equal(b.guides.length,b.lines.length);assert.equal(b.callouts.reduce((n,c)=>n+c.values.length,0),b.guides.length);assert.ok(b.callouts.every(c=>c.values.length>0));
});
test('Page 18 includes the previously restricted 10-inch counterpart without changing the canonical layer',()=>{
 const l=C.layouts.find(l=>l.page===18),a=canonical(l),b=complete(l);
 assert.equal(a.guides.length,17);assert.ok(b.guides.some(g=>g.terrain==='T5'&&g.value==='10"'&&g.mirrored&&g.mirroredFromTerrain==='T7'));
});
