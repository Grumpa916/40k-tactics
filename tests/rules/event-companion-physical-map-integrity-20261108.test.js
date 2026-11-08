import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_COMPANION_MAP_CATALOG } from '../../src/data/event-companion-map-catalog.js';
import { getEventCompanionMapLayout } from '../../src/rules/event-companion-map-catalog.js';

// Additional *independent* map integrity protections following direct
// physical-PDF examination of GW Event Companion v1.2 printed pages 21–23.
// Geometry is unchanged; no attempt is made to certify the uninspected v1.3
// PDF or to infer scenery/wall layouts from approximate terrain footprints.
const width=60, height=44;
const near=(a,b,epsilon=0.015)=>assert.ok(Math.abs(a-b)<=epsilon,
  'expected '+a+' to be within '+epsilon+' of '+b);
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function signedArea(points) {
  return points.reduce((sum,a,index)=>{
    const b=points[(index+1)%points.length];
    return sum+a.x*b.y-b.x*a.y;
  },0)/2;
}
function improperCross(a,b,c,d) {
  // Only report proper interior edge crossings, not legal shared corners.
  const abC=cross(a,b,c), abD=cross(a,b,d);
  const cdA=cross(c,d,a), cdB=cross(c,d,b);
  return abC*abD < -1e-8 && cdA*cdB < -1e-8;
}
function assertSimplePolygon(points, context) {
  assert.ok(Array.isArray(points) && points.length>=3,context+' requires 3+ vertices');
  assert.ok(Math.abs(signedArea(points))>=0.04,context+' cannot have zero area');
  for(const [i,p] of points.entries()){
    assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y),context+' finite vertex '+i);
    assert.ok(p.x>=-1e-6&&p.x<=width+1e-6,context+' x in board '+i);
    assert.ok(p.y>=-1e-6&&p.y<=height+1e-6,context+' y in board '+i);
  }
  for(let i=0;i<points.length;i++)for(let j=i+2;j<points.length;j++){
    if(i===0&&j===points.length-1)continue;
    assert.ok(!improperCross(points[i],points[(i+1)%points.length],
      points[j],points[(j+1)%points.length]),
    context+' cannot self-intersect at segments '+i+', '+j);
  }
}

test('all 45 official pages contain valid, complete, individually identifiable terrain footprints',()=>{
  const layouts=EVENT_COMPANION_MAP_CATALOG.layouts;
  assert.equal(layouts.length,45);
  assert.deepEqual(layouts.map(layout=>layout.page).slice().sort((a,b)=>a-b),
    Array.from({length:45},(_,i)=>i+9),'exactly one page per official layout 9–53');
  for(const layout of layouts){
    const prefix='page '+layout.page+' layout '+layout.layout;
    assert.equal(layout.verified,true,prefix+' previously reviewed');
    const entries=Object.entries(layout.terrainGeometry??{});
    assert.equal(entries.length,16,prefix+' sixteen printed terrain footprints');
    assert.deepEqual(entries.map(([id])=>id).sort((a,b)=>
      Number(a.slice(1))-Number(b.slice(1))),
      Array.from({length:16},(_,i)=>'T'+(i+1)),prefix+' all terrain identities');
    for(const [name,shape] of entries) assertSimplePolygon(shape.points,prefix+' '+name);
  }
});

test('all 45 objective sources remain finite, distinct and on the printed 60×44 board',()=>{
  const pages=EVENT_COMPANION_MAP_CATALOG.layouts;
  for(const layout of pages){
    const objectives=Object.entries(layout.objectivePositions??{});
    assert.ok(objectives.length>=4&&objectives.length<=6,
      'page '+layout.page+' objective count');
    assert.ok(objectives.some(([id])=>id==='Defender Home'));
    assert.ok(objectives.some(([id])=>id==='Attacker Home'));
    const occupied=new Set();
    for(const [id,p] of objectives){
      assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y),'page '+layout.page+' '+id+' finite');
      assert.ok(p.x>=0&&p.x<=width&&p.y>=0&&p.y<=height,
        'page '+layout.page+' '+id+' on battlefield');
      const key=p.x.toFixed(3)+','+p.y.toFixed(3);
      assert.ok(!occupied.has(key),'page '+layout.page+' duplicate objective '+id);
      occupied.add(key);
    }
  }
});

// All eighteen points below were sampled independently from the user's actual
// Event Companion v1.2 PDF. On 8 Nov 2026 the unmirrored catalog coordinates
// were projected onto the printed PDF (90° portrait<->landscape transform) and
// visually lined up with all printed objective symbols.
const PDF_OBJECTIVE_LANDMARKS=Object.freeze({
  21: {
    'Defender Home':[8.1,32.9], 'Attacker Home':[51.6,11.0],
    'Central 1':[35.6,20.3], 'Central 2':[25.1,24.5],
    'Expansion 1':[14.0,8.4], 'Expansion 2':[45.6,35.0]
  },
  22: {
    'Defender Home':[10.5,31.3], 'Attacker Home':[49.3,11.9],
    'Central 1':[25.3,24.2], 'Central 2':[34.5,37.5],
    'Expansion 1':[25.3,6.6], 'Expansion 2':[34.8,20.0]
  },
  23: {
    'Defender Home':[22.2,37.7], 'Attacker Home':[37.9,6.1],
    'Central 1':[34.7,21.5], 'Central 2':[25.3,22.5],
    'Expansion 1':[11.2,18.2], 'Expansion 2':[48.9,25.9]
  }
});

test('all 18 objectives on problematic PDF pages 21–23 retain their physically overlaid positions',()=>{
  for(const [page,expected] of Object.entries(PDF_OBJECTIVE_LANDMARKS)){
    const source=EVENT_COMPANION_MAP_CATALOG.layouts.find(layout=>layout.page===Number(page));
    assert.ok(source,'missing printed page '+page);
    assert.equal(Object.keys(expected).length,6,'six independent PDF landmarks '+page);
    assert.deepEqual(Object.keys(source.objectivePositions).slice().sort(),Object.keys(expected).sort());
    const map=getEventCompanionMapLayout(source.missionA,source.missionB,source.layout);
    assert.equal(map.page,Number(page));
    assert.equal(map.landscapeMirrorY,true,'correct vertically reflected orientation '+page);
    assert.equal(map.landscapeMirrorX,false,'do not return to erroneous X mirror '+page);
    for(const [name,[x,y]] of Object.entries(expected)){
      const before=source.objectivePositions[name],after=map.objectivePositions[name];
      near(before.x,x);near(before.y,y);
      near(after.x,x);near(after.y,height-y);
      // Companion print is portrait; board layout is landscape. This exact
      // projection produced crosses over all printed icons in the audit.
      const portraitX=(height-before.y)/height;
      const portraitY=before.x/width;
      assert.ok(portraitX>=0&&portraitX<=1&&portraitY>=0&&portraitY<=1);
    }
  }
});
