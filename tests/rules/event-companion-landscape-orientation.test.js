import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_COMPANION_MAP_CATALOG } from '../../src/data/event-companion-map-catalog.js';
import {
  EVENT_COMPANION_LANDSCAPE_MIRROR_X_PAGES,
  EVENT_COMPANION_LANDSCAPE_MIRROR_Y_PAGES,
  isEventCompanionLandscapeMirrored,
  isEventCompanionLandscapeVerticallyMirrored,
  verticallyMirrorEventCompanionPoint
} from '../../src/rules/event-companion-landscape-orientation.js';
import { getEventCompanionMapLayout } from '../../src/rules/event-companion-map-catalog.js';
import { buildCompleteTerrainPlacementGuides, buildCompleteTerrainPlacementOverlay } from '../../src/ui/terrain-placement-guide-model.js';

// Independent reference landmarks sampled from the red/blue deployment areas
// of GW Event Companion v1.2 pages 9–53. PDF was mapped to a 60×44 landscape
// battlefield by a 90° COUNTERCLOCKWISE rotation. Values are approximate
// zone-color centroids in inches, not replacement source-map geometry.
// [red x, red y, blue x, blue y]
const PDF_REFERENCE_ZONE_CENTROIDS = Object.freeze({
  9:[8.8,19.7,52.2,24.2],10:[30,6.2,30.1,38.2],
  11:[14.7,10.5,46,33.9],12:[27.7,6,32.4,38.5],
  13:[14.1,10.8,46.8,33.6],14:[9.4,22.6,51.4,21.2],
  15:[27.4,6.2,32.8,38.3],16:[10.4,15.7,50.5,28.3],
  17:[9.2,22.3,51.7,21.5],18:[9,20.3,52,23.6],
  19:[31.2,6,28.9,38.4],20:[14.5,10.9,46.3,33.5],
  21:[10.6,15.5,50.4,28.7],22:[9.5,22.4,51.3,21.4],
  23:[29.8,6.4,30.4,38],24:[14.5,10.4,46.2,33.9],
  25:[9,19.3,51.8,24.6],26:[27,5.9,33.2,38.6],
  27:[14.5,10.9,46.3,33.5],28:[8.8,19.9,52.3,24],
  29:[27.4,6,32.7,38.5],30:[9.2,22.6,51.7,21.2],
  31:[30.5,6.2,29.6,38.2],32:[10.6,15.1,50.3,29],
  33:[30.7,6.1,29.5,38.3],34:[14.6,10.7,46.3,33.7],
  35:[9.2,22.1,51.7,21.7],36:[10.5,15.3,50.5,28.8],
  37:[8.9,20.3,52.1,23.6],38:[27.4,5.9,32.8,38.6],
  39:[8.7,20.1,52.3,23.8],40:[31.3,6.1,28.9,38.3],
  41:[14.2,10.7,46.7,33.7],42:[27.7,6.1,32.6,38.5],
  43:[8.7,19.5,52.2,24.3],44:[14.3,10.7,46.6,33.7],
  45:[27.4,5.9,32.8,38.6],46:[10.5,15.3,50.5,28.8],
  47:[9,20.2,52.1,23.5],48:[10.4,15.6,50.6,28.5],
  49:[9,20.1,52.1,23.8],50:[27.6,6,32.6,38.5],
  51:[27.6,5.9,32.7,38.5],52:[10.5,15.2,50.4,28.9],
  53:[9.1,19.5,51.9,24.4]
});

const resolved = src=>getEventCompanionMapLayout(src.missionA,src.missionB,src.layout);
const nearly=(got,want,epsilon=1e-5)=>assert.ok(Math.abs(got-want)<=epsilon,got+' != '+want);
const flipEdge=edge=>edge==='top'?'bottom':edge==='bottom'?'top':edge;

function polygonCentroid(points) {
  let area=0,x=0,y=0;
  for(let index=0;index<points.length;index++){
    const p=points[index], q=points[(index+1)%points.length];
    const cross=p.x*q.y-q.x*p.y;
    area+=cross;x+=(p.x+q.x)*cross;y+=(p.y+q.y)*cross;
  }
  return {x:x/(3*area),y:y/(3*area)};
}

test('all 45 pages use one PDF-reference-aligned Y mirror, never the incorrect X mirrors',()=>{
  const pages=EVENT_COMPANION_MAP_CATALOG.layouts;
  assert.equal(pages.length,45);
  assert.deepEqual(EVENT_COMPANION_LANDSCAPE_MIRROR_X_PAGES,[]);
  assert.deepEqual(EVENT_COMPANION_LANDSCAPE_MIRROR_Y_PAGES,Array.from({length:45},(_,i)=>i+9));
  assert.deepEqual(Object.keys(PDF_REFERENCE_ZONE_CENTROIDS).map(Number),Array.from({length:45},(_,i)=>i+9));
  for(const source of pages){
    assert.equal(isEventCompanionLandscapeMirrored(source.page),false);
    assert.equal(isEventCompanionLandscapeVerticallyMirrored(source.page),true);
    const actual=resolved(source);
    assert.equal(actual.landscapeMirrorX,false);
    assert.equal(actual.landscapeMirrorY,true);
    assert.equal(actual.unmirroredSourceGeometry,source);
  }
});

test('deployment regions across all pages align with PDF reference zone color centroids after CCW rotation',()=>{
  for(const source of EVENT_COMPANION_MAP_CATALOG.layouts){
    const reference=PDF_REFERENCE_ZONE_CENTROIDS[source.page];
    assert.ok(reference,'reference missing for page '+source.page);
    const map=resolved(source);
    for(const [kind,at] of [['defenderDeployment',0],['attackerDeployment',2]]){
      const area=polygonCentroid(map.deploymentZones[kind].points);
      nearly(area.x,reference[at],2.7);
      nearly(area.y,reference[at+1],2.7);
    }
  }
});

test('all 45 layouts preserve IDs, footprints, objectives and mirrored territory rectangles',()=>{
  for(const source of EVENT_COMPANION_MAP_CATALOG.layouts){
    const map=resolved(source);
    assert.deepEqual(Object.keys(map.objectivePositions),Object.keys(source.objectivePositions));
    assert.deepEqual(Object.keys(map.terrainGeometry),Object.keys(source.terrainGeometry));
    assert.deepEqual(Object.keys(map.deploymentZones),Object.keys(source.deploymentZones));
    for(const [name,point] of Object.entries(source.objectivePositions)){
      nearly(map.objectivePositions[name].x,point.x);
      nearly(map.objectivePositions[name].y,44-point.y);
    }
    for(const group of ['terrainGeometry','deploymentZones'])for(const [name,shape] of Object.entries(source[group])){
      const next=map[group][name];
      if(shape.points){
        assert.equal(next.points.length,shape.points.length);
        shape.points.forEach((point,i)=>{
          nearly(next.points[i].x,point.x);
          nearly(next.points[i].y,44-point.y);
        });
      }else{
        nearly(next.x,shape.x);
        nearly(next.y,44-shape.y-shape.height);
        nearly(next.width,shape.width);
        nearly(next.height,shape.height);
      }
    }
  }
});

test('page 21–23 landmark objectives match the latest external reference screenshots',()=>{
  const expected={
    21:{red:[8.1,11.1],blue:[51.6,33]},
    22:{red:[10.5,12.7],blue:[49.3,32.1]},
    23:{red:[22.2,6.3],blue:[37.9,37.9]}
  };
  for(const [page,positions] of Object.entries(expected)){
    const src=EVENT_COMPANION_MAP_CATALOG.layouts.find(s=>s.page===Number(page));
    const map=resolved(src);
    for(const [name,want] of [['Defender Home',positions.red],['Attacker Home',positions.blue]]){
      nearly(map.objectivePositions[name].x,want[0]);
      nearly(map.objectivePositions[name].y,want[1]);
    }
    assert.equal(Object.keys(map.terrainGeometry).length,16);
  }
});

test('every terrain placement guide, anchor, line, callout and measurement reflects vertically',()=>{
  for(const source of EVENT_COMPANION_MAP_CATALOG.layouts){
    const map=resolved(source);
    const before=buildCompleteTerrainPlacementOverlay(source);
    const after=buildCompleteTerrainPlacementOverlay(map);
    for(const key of ['guides','lines','measurements','anchors','callouts'])
      assert.equal(after[key].length,before[key].length,'page '+source.page+' '+key);
    after.guides.forEach((guide,i)=>{
      const old=before.guides[i];
      assert.equal(guide.terrain,old.terrain);
      assert.equal(guide.value,old.value);
      nearly(guide.anchor[0],old.anchor[0]);
      nearly(guide.anchor[1],44-old.anchor[1]);
      assert.equal(guide.edge,flipEdge(old.edge));
    });
    after.lines.forEach((line,i)=>{
      const old=before.lines[i];
      nearly(line[0],old[0]);nearly(line[1],44-old[1]);
      nearly(line[2],old[2]);nearly(line[3],44-old[3]);
    });
    after.callouts.forEach((callout,i)=>{
      const old=before.callouts[i];
      nearly(callout.x,old.x);
      nearly(callout.y,44-old.y);
      assert.deepEqual(callout.values,old.values);
      assert.deepEqual(callout.edges,old.edges.map(flipEdge));
    });
    const beforeGuides=buildCompleteTerrainPlacementGuides(source);
    const afterGuides=buildCompleteTerrainPlacementGuides(map);
    assert.equal(afterGuides.length,beforeGuides.length);
    afterGuides.forEach((group,i)=>{
      nearly(group.anchor[0],beforeGuides[i].anchor[0]);
      nearly(group.anchor[1],44-beforeGuides[i].anchor[1]);
      assert.deepEqual(group.values,beforeGuides[i].values);
      assert.deepEqual(group.edges,beforeGuides[i].edges.map(flipEdge));
    });
  }
});

test('original source catalog is never rewritten and a map resolves to one cached view',()=>{
  const source=EVENT_COMPANION_MAP_CATALOG.layouts.find(l=>l.page===22);
  const bytes=JSON.stringify(source);
  const map=resolved(source);
  assert.equal(map,resolved(source));
  assert.deepEqual(verticallyMirrorEventCompanionPoint({x:10.5,y:31.3}),{x:10.5,y:12.7});
  assert.equal(JSON.stringify(source),bytes);
});
