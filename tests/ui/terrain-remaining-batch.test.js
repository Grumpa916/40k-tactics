import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_COMPANION_MAP_CATALOG as C } from '../../src/data/event-companion-map-catalog.js';
import { getEventCompanionPlacementCandidate as candidate } from '../../src/data/event-companion-placement-candidates.js';
import { getEventCompanionTerrainMirrorPolicy as mirror } from '../../src/rules/event-companion-terrain-mirror-policy.js';
import { getEventCompanionTerrainPlacementReviewStatus as status } from '../../src/data/event-companion-placement-review-status.js';
import { buildCandidateTerrainPlacementOverlay, buildCanonicalTerrainPlacementOverlay, buildCompleteTerrainPlacementOverlay } from '../../src/ui/terrain-placement-guide-model.js';
import { transformEventCompanionPlacement } from '../../src/rules/event-companion-terrain-placement-policy.js';
const counts=[19,20,19,18,19,20,20,19,16,19,18,17,22,18,22,22,19,18,16,20,16,19,18,22,22,19];
const opposite={left:'right',right:'left',top:'bottom',bottom:'top'};
for(let page=28;page<=53;page++) test(`Page ${page}: audited source, separate mirrors, complete terrain coverage`,()=>{
 const layout=C.layouts.find(x=>+x.page===page), raw=candidate(page), canonical=buildCanonicalTerrainPlacementOverlay(layout), complete=buildCompleteTerrainPlacementOverlay(layout);
 assert.equal(status(page).reviewedBy,'assistant');
 assert.equal(raw.sourceAudit.ambiguousCount,0);
 assert.equal(raw.sourceAudit.printedDimensionCount,raw.guides.length+raw.sourceAudit.excludedDeploymentDimensions.length+raw.sourceAudit.excludedSourceExtractionArtifacts.length);
 assert.equal(canonical.guides.length,counts[page-28]);
 assert.deepEqual(canonical,buildCandidateTerrainPlacementOverlay(layout));
 assert.notStrictEqual(raw.guides,canonical.guides);
 const measured = new Set(canonical.guides.map(g=>g.terrain));
 const expectedMirrors = canonical.guides.filter(g=>!measured.has(mirror(page).terrainMap[g.terrain])).length;
 assert.equal(complete.guides.length,canonical.guides.length+expectedMirrors);
 assert.deepEqual(complete.guides.filter(g=>!g.mirrored),canonical.guides);
 assert.equal(new Set(complete.guides.map(g=>g.terrain)).size,16);
 for(const g of complete.guides.filter(g=>g.mirrored)){
  const original=canonical.guides.find(o=>o.terrain===g.mirroredFromTerrain&&o.value===g.value&&opposite[o.edge]===g.edge&&o.anchor.every((x,i)=>x===g.mirroredFromAnchor[i]));
  assert.ok(original);assert.equal(g.edge,opposite[original.edge]);
  assert.equal(mirror(page).terrainMap[g.terrain],original.terrain);
  if(original.preserveSourcePoint) assert.deepEqual(g.anchor,transformEventCompanionPlacement(original.anchor,original.edge,'rotate180').point);
 }
 for(const g of canonical.guides.filter(g=>g.preserveSourcePoint)){
  assert.ok(raw.sourceAudit.sourcePointExceptions.some(x=>x.sourceIdentity===[g.value,...g.sourceAnchor].join('|')));
  assert.deepEqual(g.anchor,transformEventCompanionPlacement(g.sourceAnchor,g.edge,'flipX').point);
 }
});
test('source audit corrections retain the visible Page 32 and 34 values on their own lines',()=>{
 const p32=candidate(32).guides,p34=candidate(34).guides;
 assert.ok(p32.some(g=>g.value==='24"'&&g.edge==='left'&&g.sourceAnchor[0]===24));
 assert.ok(p32.some(g=>g.value==='23"'&&g.edge==='right'&&g.sourceAnchor[0]===36.96));
 assert.ok(p34.some(g=>g.value==='10"'&&g.edge==='top'&&g.sourceAnchor[0]===38));
});
