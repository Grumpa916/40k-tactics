import { attachmentParent } from '../rules/event-preparation.js';
import { updateDeploymentWorkspace } from './deployment-workspace-transitions.js';
import { setActualDeploymentPosition } from './battlefield-map-transitions.js';
import { appendHistoryEntry } from '../state/history.js';
import { createEvent } from '../events/event.js';
import { getPendingVenatariIngress } from '../rules/venatari-abilities.js';

// A tap is one transaction: no intermediate on-board/reserve state is exposed.
export function transferMapReserve(state, { unitId, destination, position } = {}) {
  const unit = state.units.find(item => item.id === unitId);
  if (!unit || !['battlefield','reserves'].includes(destination)) throw new Error('Select a unit and a valid destination.');
  if (['destroyed','embarked'].includes(unit.status) || attachmentParent(state,unit)) throw new Error('Select the deployed unit or its bodyguard.');
  if (destination === 'battlefield' && (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y) || position.x<0 || position.x>60 || position.y<0 || position.y>44)) throw new Error('Tap a position within the battlefield.');
  if (state.battle?.status === 'deployment') {
    let next = updateDeploymentWorkspace(state,{action:'location',unitId,kind:destination==='reserves'?'reserve':'field'});
    if (destination==='battlefield') next=setActualDeploymentPosition(next,{unitId,playerId:unit.ownerId,position});
    return next;
  }
  if (state.battle?.status!=='active') throw new Error('Live reserve transfers require an active battle.');
  const swiftRuin = destination === 'battlefield' && getPendingVenatariIngress(state).some(item => item.id === unitId);
  if (destination==='battlefield' && unit.status!=='reserves') throw new Error('Select a reserve unit before placing it on the map.');
  if (destination==='reserves' && unit.status!=='deployed') throw new Error('Select a battlefield unit before moving it to reserves.');
  return applyReserveTransfer(state, {
    unit,
    destination,
    position,
    reason: swiftRuin ? 'Swift Ruin' : 'Manual live-state correction'
  });
}

// Shared atomic update after the calling command validates its own rules window.
export function applyReserveTransfer(state, {unit, destination, position, reason=null}) {
  const unitId = unit.id;
  const members=state.units.filter(item=>item.id===unitId || attachmentParent(state,item)===unitId).map(item=>item.id);
  const declaredReserves={...state.battlefieldMap?.declaredReserves};
  const actualDeployment={...state.battlefieldMap?.actualDeployment};
  for (const id of members) {delete actualDeployment[id]; if(destination==='reserves') declaredReserves[id]=true; else delete declaredReserves[id];}
  let next={...state,battlefieldMap:{...state.battlefieldMap,actualDeployment,declaredReserves},units:state.units.map(item=>{
    if(!members.includes(item.id))return item;
    return {...item,status:destination==='reserves'?'reserves':'deployed',position:destination==='reserves'?null:{...position},
      ...(destination==='battlefield' && Array.isArray(item.models)?{models:item.models.map(model=>({...model,position:{...position}}))}:{})};
  })};
  for (const id of members) next=appendHistoryEntry(next,createEvent(destination==='reserves'?'unit.entered_reserves':'unit.arrived_from_reserves',{
    unitId:id,playerId:unit.ownerId,turn:state.turn,round:state.battle.round,phase:state.phase,position:destination==='battlefield'?position:null,...(reason?{reason}:{})
  }));
  return next;
}
