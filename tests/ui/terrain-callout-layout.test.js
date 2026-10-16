import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_COMPANION_MAP_CATALOG } from '../../src/data/event-companion-map-catalog.js';
import { buildCompleteTerrainPlacementOverlay } from '../../src/ui/terrain-placement-guide-model.js';
import { layoutTerrainCallouts, TERRAIN_CALLOUT_WIDTH } from '../../src/ui/terrain-callout-layout.js';
for(const layout of EVENT_COMPANION_MAP_CATALOG.layouts.filter(l=>+l.page>=9&&+l.page<=53)) {
 test(`Page ${layout.page}: focused callout boxes fit without overlap and preserve source information`,()=>{
  const overlay=buildCompleteTerrainPlacementOverlay(layout), before=structuredClone(overlay);
  const boxes=layoutTerrainCallouts(overlay.callouts);
  assert.equal(boxes.length,overlay.callouts.length);
  assert.deepEqual(overlay,before);
  for(let i=0;i<boxes.length;i++){
   const a=boxes[i];assert.deepEqual(a.values,overlay.callouts[i].values);assert.equal(a.anchorX,overlay.callouts[i].anchorX);assert.equal(a.anchorY,overlay.callouts[i].anchorY);
   assert.ok(a.displayX>=TERRAIN_CALLOUT_WIDTH/2&&a.displayX<=100-TERRAIN_CALLOUT_WIDTH/2);
   assert.ok(a.displayY>=a.boxHeight/2&&a.displayY<=100-a.boxHeight/2);
   for(const b of boxes.slice(i+1).filter(b=>b.terrain===a.terrain)) assert.ok(Math.abs(a.displayX-b.displayX)>=TERRAIN_CALLOUT_WIDTH||Math.abs(a.displayY-b.displayY)>=(a.boxHeight+b.boxHeight)/2,`${a.terrain} boxes must not overlap`);
  }
 });
}
