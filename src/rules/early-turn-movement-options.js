import { getCombatFormationRoot, getCombatFormationMembers, getBattleUnitMovement } from './battle-unit-reference.js';
import { getLiveUnitPosition } from './spatial-context.js';
import { getEffectiveMovementAction } from '../engine/movement-refinement-transitions.js';
import { getEarlyTurnPlan } from './early-turn-plan.js';

const BOARD_WIDTH = 60, BOARD_HEIGHT = 44;
const valid = p => Number.isFinite(p?.x) && Number.isFinite(p?.y) &&
  p.x >= 0 && p.x <= BOARD_WIDTH && p.y >= 0 && p.y <= BOARD_HEIGHT;
const rounded = n => Math.round(n * 10) / 10;
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const unavailable = reason => Object.freeze({ available:false, reason, options:Object.freeze([]) });
const mapUnit = (state,id) => (state?.units??[]).find(unit => unit.id===id);
const livePosition = (state,unit) => unit ? getLiveUnitPosition(state,unit) : null;

function formationNormalMove(state,unit) {
  const members=getCombatFormationMembers(state,unit);
  if (!members.length || members.some(member => member.status!=='deployed'))
    return {available:false,reason:'An attached member is not deployed.'};
  const speeds=members.map(member => getBattleUnitMovement(state,member));
  if (speeds.some(speed => !Number.isFinite(speed)))
    return {available:false,reason:'Movement characteristic unknown; no hypothetical move will be invented.'};
  if (members.some(member => getEffectiveMovementAction(state,member.id)))
    return {available:false,reason:'Movement is already recorded for this formation; compare from its current position.'};
  const positions=members.map(member => livePosition(state,member));
  if (positions.some(p => !valid(p)))
    return {available:false,reason:'Place all formation members on the map before previewing a new position.'};
  return {available:true,members,positions,speed:Math.min(...speeds)};
}

// Produce a transient what-if board, including actualDeployment because the live
// spatial helper deliberately prefers deployment coordinates before a real move.
// Never append history, move models in the real game, or change the action ledger.
export function projectNormalMoveForPlanning(state,{unitId,destination}={}) {
  const unit=getCombatFormationRoot(state,mapUnit(state,unitId));
  if (!unit || unit.status!=='deployed' || !valid(destination))
    return unavailable('Choose a deployed formation and an in-bounds hypothetical destination.');
  const info=formationNormalMove(state,unit);
  if (!info.available) return unavailable(info.reason);
  const origin=info.positions[0];
  const dx=destination.x-origin.x,dy=destination.y-origin.y;
  const travel=Math.hypot(dx,dy);
  if (travel>info.speed+1e-6)
    return unavailable('The proposed position exceeds the slowest known formation Move characteristic.');
  const memberIds=new Set(info.members.map(member=>member.id));
  const nextPosition=new Map();
  for (let i=0;i<info.members.length;i++){
    const member=info.members[i];
    const next={x:rounded(info.positions[i].x+dx),y:rounded(info.positions[i].y+dy)};
    if (!valid(next)) return unavailable('A formation member would leave the battlefield.');
    if ((member.models??[]).some(model=>model?.position &&
      Number.isFinite(model.position.x) && Number.isFinite(model.position.y) &&
      !valid({x:rounded(model.position.x+dx),y:rounded(model.position.y+dy)})))
      return unavailable('A model would leave the battlefield.');
    nextPosition.set(member.id,next);
  }
  const units=(state.units??[]).map(member => {
    if (!memberIds.has(member.id)) return member;
    const next=nextPosition.get(member.id);
    return {
      ...member,position:next,
      ...(Array.isArray(member.models)?{models:member.models.map(model=>
        valid(model.position)?{...model,position:{x:rounded(model.position.x+dx),y:rounded(model.position.y+dy)}}:model)}:{})
    };
  });
  const oldDeployment=state.battlefieldMap?.actualDeployment??{};
  const nextDeployment={...oldDeployment};
  for(const member of info.members){
    const original=oldDeployment[member.id];
    const next=nextPosition.get(member.id);
    nextDeployment[member.id]=original && typeof original==='object'
      ? {...original,position:next} : {position:next};
  }
  return Object.freeze({
    available:true,origin:Object.freeze({...origin}),
    position:Object.freeze({x:rounded(destination.x),y:rounded(destination.y)}),
    travel:rounded(travel),
    maxNormalMove:info.speed,
    state:{
      ...state,units,
      battlefieldMap:{...(state.battlefieldMap??{}),actualDeployment:nextDeployment}
    }
  });
}

function projectedDestination(origin,goal,speed,stopAt) {
  if (!valid(goal)) return null;
  const d=distance(origin,goal);
  const travel=Math.min(speed,Math.max(0,d-stopAt));
  if (d<1e-7||travel<0.05) return null;
  return {x:rounded(origin.x+(goal.x-origin.x)*travel/d),
    y:rounded(origin.y+(goal.y-origin.y)*travel/d)};
}

function nearestGoal(state, origin, collection){
  return collection.filter(item=>valid(item.position))
    .sort((a,b)=>distance(origin,a.position)-distance(origin,b.position) ||
      String(a.id).localeCompare(String(b.id)))[0]??null;
}

function renderableOption(state, unit, kind, label, goal, stopAt, basePosition) {
  const destination=projectedDestination(basePosition.origin,goal,basePosition.maxNormalMove,stopAt);
  if (!destination) return null;
  const projected=projectNormalMoveForPlanning(state,{unitId:unit.id,destination});
  if (!projected.available || projected.travel<0.05) return null;
  const plan=getEarlyTurnPlan(projected.state,{unitId:unit.id,playerId:unit.ownerId});
  if (!plan.available) return null;
  return Object.freeze({
    kind,label,
    position:projected.position,
    travel:projected.travel,
    maxNormalMove:projected.maxNormalMove,
    attack:plan.attack,
    destinationDistance:rounded(distance(projected.position,goal)),
    movement:plan.movement,
    confidence:'low'
  });
}

/**
 * Compare at most three possible Normal Move outcomes during Command / Movement.
 * "Toward objective" and "toward enemy" are straight-line map samples, not
 * suggested legal paths or confirmed engagement / control distances.
 */
export function getMovementWhatIfPlans(state,{unitId,playerId}={}) {
  if (!['command','movement'].includes(state?.phase) || state?.battle?.status!=='active')
    return unavailable('Hypothetical Normal Move comparisons are for active Command or Movement.');
  const active=state.activePlayer??state.battle?.activePlayerId;
  if (playerId!==active)
    return unavailable('Only the active player may plan their own formation.');
  const unit=getCombatFormationRoot(state,mapUnit(state,unitId));
  if (!unit || unit.ownerId!==playerId || unit.status!=='deployed')
    return unavailable('Select your deployed formation to preview movement.');
  const info=formationNormalMove(state,unit);
  if (!info.available) return unavailable(info.reason);
  const origin=info.positions[0];
  const basePlan=getEarlyTurnPlan(state,{unitId:unit.id,playerId});
  if (!basePlan.available) return unavailable(basePlan.reason);
  const hold=Object.freeze({
    kind:'hold',label:'Hold current position',
    position:Object.freeze({...origin}),
    travel:0,maxNormalMove:info.speed,
    attack:basePlan.attack,movement:basePlan.movement,
    confidence:'low',destinationDistance:null
  });
  const options=[hold];
  const objectives=state.objectives??[];
  const suggestedObjective=objectives.find(o=>o.id===basePlan.movement?.objectiveId && valid(o.position));
  const objective=suggestedObjective??nearestGoal(state,origin,[...objectives]);
  if(objective){
    const label=(suggestedObjective?'Toward suggested objective · ':'Toward nearby objective · ')+
      String(objective.label??objective.name??objective.id);
    const projected=renderableOption(state,unit,'objective',label,objective.position,2.5, {
      origin,maxNormalMove:info.speed
    });
    if(projected) options.push(projected);
  }
  const enemies=(state.units??[]).filter(other=>other.ownerId!==playerId &&
    other.status==='deployed' && getCombatFormationRoot(state,other)?.id===other.id);
  const preferred=enemies.find(other=>other.id===basePlan.attack?.targetId && valid(livePosition(state,other)));
  const enemy=preferred??nearestGoal(state,origin,enemies.map(other=>({
    ...other,position:livePosition(state,other)
  })));
  if(enemy){
    const projected=renderableOption(state,unit,'enemy',
      'Stage toward enemy · '+String(enemy.name??enemy.id),
      livePosition(state,enemy),3, {origin,maxNormalMove:info.speed});
    if(projected && !options.some(o=>distance(o.position,projected.position)<0.1))
      options.push(projected);
  }
  return Object.freeze({
    available:true,
    unitId:unit.id,
    maxNormalMove:info.speed,
    options:Object.freeze(options),
    assumptions:'Straight-line, current marker positions only. Does not check terrain, model bases, unit coherency, line of sight, engagement range, charge paths, mission actions or actual OC. A move is never recorded by this preview.'
  });
}
