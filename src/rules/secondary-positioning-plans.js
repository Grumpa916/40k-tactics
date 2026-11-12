import { getSecondaryMissionIntelligence } from './secondary-mission-intelligence.js';
import { getPlunderTerrainOptions, getPlunderActionState } from './secondary-mission-action-state.js';
import { pointInTerrainPolygon } from './death-trap-state.js';
import { getLiveUnitPosition } from './spatial-context.js';
import { hasKeyword, clamp01 } from './tactical-context-utils.js';
import { getTerritoryStatusForPosition } from './battlefield-territory.js';

const CENTRE=Object.freeze({x:30,y:22});
const BOARD=Object.freeze({width:60,height:44});
const UNCERTAINTY=3;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const proximity=(value,move)=>Number.isFinite(move)?clamp01(1-Math.max(0,value-move)/(30+UNCERTAINTY)):0.3;
const isPositionUnit=(state,unit)=>unit?.status==='deployed' && !unit.battleShocked && !hasKeyword(state,unit,'aircraft');
const quarter=point=>point.x<30?(point.y<22?'bottom-left':'top-left'):(point.y<22?'bottom-right':'top-right');
const quarterNames=['top-left','top-right','bottom-left','bottom-right'];
const quarterCenters=Object.freeze({
  'top-left':{x:15,y:33},'top-right':{x:45,y:33},
  'bottom-left':{x:15,y:11},'bottom-right':{x:45,y:11}
});
function terrainStagingPoint(points){
  if(!Array.isArray(points)||points.length<3)return null;
  const centroid={x:points.reduce((n,p)=>n+p.x,0)/points.length,
    y:points.reduce((n,p)=>n+p.y,0)/points.length};
  if(pointInTerrainPolygon(centroid,points))return centroid;
  for(let i=0;i<points.length;i++){
    const mid={x:(points[i].x+points[(i+1)%points.length].x)/2,
      y:(points[i].y+points[(i+1)%points.length].y)/2};
    if(pointInTerrainPolygon(mid,points))return mid;
  }
  return null;
}
const edgeDistances=point=>Object.freeze({
  left:point.x,right:BOARD.width-point.x,
  bottom:point.y,top:BOARD.height-point.y
});

/**
 * Map-based staging advice, not a legal scoring evaluator. The unit marker is
 * an approximate centre point: wholly-within zones, base boundaries, the 6-inch
 * edge requirement and controlling an objective need physical confirmation.
 * No option authorizes an Action, awards VP or marks a condition complete.
 */
export function getSecondaryPositionalPlanningOptions(state,{playerId,unit,movement}={}){
  if(!playerId||!unit||!isPositionUnit(state,unit))return Object.freeze([]);
  const current=getLiveUnitPosition(state,unit);
  if(!current)return Object.freeze([]);
  const cards=getSecondaryMissionIntelligence(state,{playerId}).filter(card=>card.verified&&card.eligibleNow);
  const options=[];
  for(const card of cards){
    const mission=card.definitionId;
    if(mission==='secondary-centre-ground'){
      const d=distance(current,CENTRE);
      options.push(Object.freeze({
        kind:'position',purpose:'stage-centre-ground',locationLabel:'Battlefield centre',
        targetPosition:CENTRE,score:clamp01(0.32+0.35*proximity(d,movement)),
        distance:d,confidence:'low',
        actionHint:'Stage within 3″ of battlefield centre; confirm no enemies inside the relevant 3″/6″ radius at the end-turn check',
        reason:'Centre Ground requires an eligible friendly unit near the actual board centre. This route is approximate; other enemy units and model bases can invalidate it.'
      }));
    }
    if(mission==='secondary-behind-enemy-lines'){
      const status=getTerritoryStatusForPosition(state,{playerId,position:current,uncertainty:UNCERTAINTY});
      if(status.territory==='unknown')continue;
      options.push(Object.freeze({
        kind:'position',purpose:'stage-enemy-deployment',locationLabel:'Opponent deployment zone',
        score:status.territory==='opponent'?0.58:status.territory==='boundary'?0.43:0.35,
        confidence:'low',territoryTarget:'opponent',
        actionHint:'Advance toward the opponent deployment zone; count only units wholly inside it and not Battle-shocked or AIRCRAFT',
        reason:'Behind Enemy Lines requires the opponent’s deployment zone, not merely opponent territory. Confirm the full unit footprint against the physical deployment boundary.'
      }));
    }
    if(mission==='secondary-display-of-might'){
      options.push(Object.freeze({
        kind:'position',purpose:'stage-no-mans-land',locationLabel:'No Man’s Land',
        score:0.43,confidence:'low',
        actionHint:'Move an additional eligible unit wholly into No Man’s Land and compare both players’ unit counts at each applicable checkpoint',
        reason:'Display of Might compares units wholly within No Man’s Land at own and opponent-turn scoring windows. Approximate map centres alone cannot prove whole-unit presence.'
      }));
    }
    if(mission==='secondary-engage-on-all-fronts'){
      const occupied=new Set((state.units??[])
        .filter(other=>other.ownerId===playerId&&other.id!==unit.id&&isPositionUnit(state,other))
        .map(other=>getLiveUnitPosition(state,other)).filter(Boolean)
        .filter(pos=>distance(pos,CENTRE)>6+UNCERTAINTY).map(quarter));
      const available=quarterNames.filter(name=>!occupied.has(name));
      if(!available.length)continue;
      const destination=available.map(name=>({name,point:quarterCenters[name],distance:distance(current,quarterCenters[name])}))
        .sort((a,b)=>a.distance-b.distance)[0];
      options.push(Object.freeze({
        kind:'position',purpose:'stage-empty-quarter',locationLabel:'Unrepresented '+destination.name+' quarter',
        targetPosition:destination.point,score:clamp01(0.31+0.25*proximity(destination.distance,movement)),
        distance:destination.distance,confidence:'low',
        actionHint:'Stage wholly within the chosen quarter and more than 6″ from battlefield centre; aim for three or four distinct quarters',
        reason:'Engage on All Fronts needs qualified presence in different quarters. Existing quarter counts are approximate and cannot prove whole-model eligibility.'
      }));
    }
    if(mission==='secondary-plunder'){
      if(getPlunderActionState(state,{playerId,instanceId:card.instanceId}).usedThisTurn)continue;
      const terrain=getPlunderTerrainOptions(state,{playerId})
        .filter(item=>item.eligibleByMap===true)
        .map(item=>({...item,centre:terrainStagingPoint(item.points)}))
        .filter(item=>item.centre)
        .map(item=>({...item,distance:distance(current,item.centre)}))
        .sort((a,b)=>a.distance-b.distance)[0];
      if(terrain){
        const location=getTerritoryStatusForPosition(state,{playerId,position:terrain.centre,uncertainty:UNCERTAINTY});
        options.push(Object.freeze({
          kind:'position',purpose:'stage-plunder-terrain',locationLabel:'Terrain '+terrain.terrainAreaId,
          terrainAreaId:terrain.terrainAreaId,targetPosition:terrain.centre,
          score:clamp01((location.territory==='opponent'?0.36:0.18)+0.18*proximity(terrain.distance,movement)),
          distance:terrain.distance,confidence:'low',
          actionHint:'Stage a unit INSIDE the selected terrain area for a Shooting-phase Plunder Action; check that the entire terrain area is outside your territory',
          reason:'The map identifies a terrain candidate, not a legal Plunder action. Confirm terrain ownership, the physical footprint, and once-per-turn use before recording manually.'
        }));
      }
    }
    if(mission==='secondary-outflank'){
      const status=getTerritoryStatusForPosition(state,{playerId,position:current,uncertainty:UNCERTAINTY});
      const edges=Object.entries(edgeDistances(current)).sort((a,b)=>a[1]-b[1]);
      const [nearEdge,nearDistance]=edges[0];
      options.push(Object.freeze({
        kind:'position',purpose:'stage-outflank-edge',locationLabel:'Battlefield '+nearEdge+' edge',
        score:clamp01((status.territory==='opponent'?0.4:0.27)+0.26*proximity(nearDistance,movement)),
        distance:nearDistance,confidence:'low',
        actionHint:'Stage within 6″ of a battlefield edge; for 5 VP use two units on opposite edges with at least one outside your territory',
        reason:'Outflank depends on physical edge distance and opposite-edge placement. Nearest edge is advisory and does not by itself satisfy the territory condition.'
      }));
    }
  }
  return Object.freeze(options);
}
