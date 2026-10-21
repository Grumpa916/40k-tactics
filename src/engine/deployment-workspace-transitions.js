import { deploymentUnits, attachmentParent, formationFor, preparationIssues } from '../rules/event-preparation.js';
import { isCombinedDeployment, deploymentWorkspaceIssues } from '../rules/deployment-workspace.js';
const isValidBattlefieldPosition = p => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x>=0 && p.x<=60 && p.y>=0 && p.y<=44;
import { setActualDeploymentPosition } from './battlefield-map-transitions.js';
import { setPreGameRoles } from './battle-setup-transitions.js';
import { startFirstTurn, changePhase } from './state-transitions.js';
import { appendHistoryEntry } from '../state/history.js';
import { createEvent } from '../events/event.js';

const savedPosition = (state,id) => {
  const actual=state.battlefieldMap?.actualDeployment?.[id];
  const plan=state.battlefieldMap?.deploymentPlan?.[id];
  const live=state.units.find(unit=>unit.id===id)?.position;
  return [actual?.position??actual,plan?.position??plan,live].find(isValidBattlefieldPosition) ?? null;
};
function openWorkspace(state) {
  const issues=preparationIssues(state,'mission');
  if(issues.length) throw new Error(issues.join('; '));
  if(isCombinedDeployment(state)) return state;
  const formations={...state.preparation?.formations};
  for(const unit of deploymentUnits(state)) {
    if(state.battlefieldMap?.declaredReserves?.[unit.id]) formations[unit.id]={kind:'reserve',source:'existing'};
    else if(!formations[unit.id]) formations[unit.id]=unit.status==='embarked' && unit.transportId ? {kind:'embarked',transportId:unit.transportId,source:'existing'} : {kind:'field',source:'combined'};
  }
  let next={...state,phase:'deployment',battle:{...state.battle,status:'deployment'},preparation:{...state.preparation,version:2,mode:'combined',step:'deployment',formations,
    firstPlayerId:state.preparation?.firstPlayerId??state.preGameSetup?.firstPlayerId??null, deploymentComplete:false, previousCheckpoint:state.preparation?.step??null}};
  for(const unit of deploymentUnits(next)) {
    if(formationFor(next,unit).kind!=='field') { next=setLocation(next,{unitId:unit.id,...formationFor(next,unit),normalize:true}); continue; }
    const position=savedPosition(state,unit.id);
    if(position) next=setActualDeploymentPosition(next,{unitId:unit.id,playerId:unit.ownerId,position});
  }
  return next;
}
function setLocation(state,{unitId,kind,transportId,normalize=false}) {
  const unit=deploymentUnits(state).find(item=>item.id===unitId);
  if(!unit || !['field','reserve','embarked'].includes(kind)) throw new Error('Choose a valid unit and location.');
  const previous=formationFor(state,unit);
  if(!normalize && previous.kind===kind && (kind!=='embarked'||previous.transportId===transportId)) return state;
  if(kind==='embarked') {
    const carrier=deploymentUnits(state).find(item=>item.id===transportId&&item.ownerId===unit.ownerId&&item.id!==unit.id);
    if(!carrier || formationFor(state,carrier).kind==='embarked') throw new Error('Choose a friendly, non-embarked transport.');
    if(deploymentUnits(state).some(item=>formationFor(state,item).transportId===unitId)) throw new Error('Remove this transport’s passengers before embarking it.');
  }
  const members=state.units.filter(item=>item.id===unitId||attachmentParent(state,item)===unitId).map(item=>item.id);
  const actualDeployment={...state.battlefieldMap?.actualDeployment}, declaredReserves={...state.battlefieldMap?.declaredReserves};
  const heldPositions={...state.preparation?.heldPositions};
  const oldPosition=previous.kind==='field'?savedPosition(state,unitId):null;
  if(oldPosition) heldPositions[unitId]=oldPosition;
  for(const id of members){delete actualDeployment[id];delete declaredReserves[id];if(kind==='reserve')declaredReserves[id]=true;}
  let next={...state,preparation:{...state.preparation,heldPositions,reserveReview:normalize?state.preparation.reserveReview:{},deploymentComplete:false,
    formations:{...state.preparation.formations,[unitId]:{kind,...(kind==='embarked'?{transportId}:{}),source:'combined'}}},
    battlefieldMap:{...state.battlefieldMap,actualDeployment,declaredReserves},
    units:state.units.map(item=>members.includes(item.id)?{...item,status:kind==='embarked'?'embarked':'reserves',position:null,transportId:kind==='embarked'?transportId:null}:item)};
  if(kind==='field') {
    const position=heldPositions[unitId]??savedPosition(next,unitId);
    if(isValidBattlefieldPosition(position))next=setActualDeploymentPosition(next,{unitId,playerId:unit.ownerId,position});
  }
  return next;
}
/** One atomic command per user decision; starting a battle cannot leave half-applied setup. */
export function updateDeploymentWorkspace(state,payload={}) {
  if(!['setup','deployment'].includes(state.battle?.status)) throw new Error('Deployment is closed after the battle starts.');
  const {action,playerId}=payload;
  if(action!=='open' && !isCombinedDeployment(state))throw new Error('Open Deploy & Begin first.');
  let next=state;
  if(action==='open') next=openWorkspace(state);
  else if(action==='location')next=setLocation(state,payload);
  else if(action==='attacker')next=setPreGameRoles(state,{attackerPlayerId:playerId,firstPlayerId:state.preGameSetup?.firstPlayerId??null});
  else if(action==='first-player') {
    if(!state.players.some(player=>player.id===playerId))throw new Error('Choose a first player.');
    next={...state,preparation:{...state.preparation,firstPlayerId:playerId}};
  } else if(action==='reserve-review') {
    if(!state.players.some(player=>player.id===playerId))throw new Error('Choose an army.');
    next={...state,preparation:{...state.preparation,reserveReview:{...state.preparation.reserveReview,[playerId]:'Reserve total and any applicable exceptions checked on the tabletop.'}}};
  } else if(action==='begin') {
    const issues=deploymentWorkspaceIssues(state);
    if(issues.length)throw new Error(issues.join('; '));
    next={...state,preparation:{...state.preparation,step:'ready',deploymentComplete:true,tabletopReview:true}};
    next=appendHistoryEntry(next,createEvent('battle.deployment_reviewed',{source:'combined',firstPlayerId:next.preparation.firstPlayerId}));
    next=startFirstTurn(next,{activePlayerId:next.preparation.firstPlayerId,...(payload.nowMs==null?{}:{nowMs:payload.nowMs})});
    next=changePhase(next,{phase:'command'});
  } else throw new Error('Unknown deployment action.');
  if(next===state)return state;
  return appendHistoryEntry(next,createEvent('battle.deployment_workspace_updated',payload));
}
