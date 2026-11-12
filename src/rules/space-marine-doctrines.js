import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { getRosterDetachmentNames } from './roster-detachment-selection.js';
import { getBattleRosterUnit, getCombatFormationMembers } from './battle-unit-reference.js';
import { getUnitUpgradeNames } from './custodes-unit-upgrades.js';

// GW 11e Codex previews, 10–14 Sep 2026:
// https://www.warhammer-community.com/en-gb/articles/ifgezlgu/space-marines-rules-first-look/
// https://www.warhammer-community.com/en-gb/articles/zcobdkzh/your-first-look-at-15-new-space-marine-detachments/
// Timing and expanded rules independently reconciled with 30 Oct 11e reference.
export const SPACE_MARINES_DOCTRINES=Object.freeze([
 Object.freeze({id:'assault',name:'Assault Doctrine',summary:'Advance does not prevent the unit from charging.'}),
 Object.freeze({id:'devastator',name:'Devastator Doctrine',summary:'Ranged attacks gain Assault.'}),
 Object.freeze({id:'tactical',name:'Tactical Doctrine',summary:'Fall Back does not prevent shooting or charging.'})
]);
const isMarine=(state,playerId)=>String(state?.armyRosters?.[playerId]?.faction??'').toLowerCase()==='space marines';
const activePlayer=state=>state?.activePlayer??state?.battle?.activePlayerId;
const doctrineEvent=e=>e?.type==='space_marines.doctrine_selected';
const allEvents=(state,playerId)=>(state?.history??[]).filter(e=>doctrineEvent(e)&&e.payload?.playerId===playerId);
const idOf=v=>SPACE_MARINES_DOCTRINES.find(d=>d.id===v)?.id??null;
const expired=(state,event)=>Number(state?.turn??0)>Number(event?.payload?.turn??0)+1;
const detachedNames=state=>getRosterDetachmentNames(state);
const rosterOf=(state,playerId)=>state?.armyRosters?.[playerId];
export function getSpaceMarineDoctrineUses(state,playerId){
 const uses={assault:0,devastator:0,tactical:0};
 for(const e of allEvents(state,playerId))if(e.payload?.scope==='army'&&e.payload?.doctrine in uses)
  uses[e.payload.doctrine]+=1;
 return uses;
}
export function getSpaceMarineDoctrineRemaining(state,playerId){
 const uses=getSpaceMarineDoctrineUses(state,playerId),names=detachedNames(rosterOf(state,playerId));
 const gladius=names.includes('Gladius Task Force');
 const bonusUsed=Object.values(uses).reduce((sum,value)=>sum+Math.max(0,value-1),0);
 const brethren={assault:'Assault Brethren',tactical:'Tactical Brethren',devastator:'Devastator Brethren'};
 return SPACE_MARINES_DOCTRINES.map(item=>{
  const limit=1+Number(names.includes(brethren[item.id]))+Number(gladius&&bonusUsed===0);
  return {...item,uses:uses[item.id],available:uses[item.id]<limit,
   remaining:Math.max(0,limit-uses[item.id]),extraAvailableFromGladius:gladius&&bonusUsed===0};
 });
}
export function getActiveSpaceMarineDoctrine(state,playerId){
 if(!isMarine(state,playerId))return null;
 const event=allEvents(state,playerId).filter(e=>e.payload.scope==='army').at(-1);
 return event&&!expired(state,event)?event.payload.doctrine:null;
}
export function getActiveSpaceMarineUnitDoctrines(state,unitOrId){
 const unit=typeof unitOrId==='string'
  ?(state.units??[]).find(u=>u.id===unitOrId):unitOrId;
 if(!unit||!isMarine(state,unit.ownerId))return [];
 const members=getCombatFormationMembers(state,unit);
 const group=members.length?members:[unit];
 if(group.some(member=>String(getBattleRosterUnit(state,member)?.datasheetId??'').includes('roboute-guilliman')))
  return ['assault','devastator','tactical'];
 const history=allEvents(state,unit.ownerId).filter(e=>e.payload.scope==='unit'&&!expired(state,e));
 const overrides=history.filter(e=>group.some(member=>member.id===e.payload.unitId));
 const latest=overrides.at(-1);
 let effective=latest?[latest.payload.doctrine]:
   [getActiveSpaceMarineDoctrine(state,unit.ownerId)].filter(Boolean);
 if(group.some(member=>getUnitUpgradeNames(getBattleRosterUnit(state,member))
    .some(name=>['Adept of the Codex','Tactical Insight'].includes(name))))
   effective=[...effective,'tactical'];
 return [...new Set(effective)];
}
export function recordSpaceMarineDoctrineUse(state,{playerId,doctrine,scope='army',unitId=null,source='army'}={}){
 if(!state?.battle||state.battle.status!=='active'||state.phase!=='command')
  throw new Error('Select Combat Doctrines in an active Command phase.');
 if(playerId!==activePlayer(state)||!isMarine(state,playerId))
  throw new Error('Only the active Space Marines player may select a Combat Doctrine.');
 const selected=idOf(doctrine);
 if(!selected)throw new Error('Select Assault, Devastator or Tactical Doctrine.');
 if(!['army','unit'].includes(scope))throw new Error('Doctrine scope must be army or unit.');
 const events=allEvents(state,playerId);
 if(scope==='army'){
   if(events.some(e=>e.payload.scope==='army'&&e.payload.turn===state.turn))
     throw new Error('An army-wide Combat Doctrine is already chosen for this Command phase.');
   const remaining=getSpaceMarineDoctrineRemaining(state,playerId).find(d=>d.id===selected);
   if(!remaining?.available)throw new Error('This Doctrine has already reached its per-battle use limit.');
 } else {
   const unit=(state?.units??[]).find(u=>u.id===unitId&&u.ownerId===playerId&&u.status==='deployed');
   if(!unit)throw new Error('Choose a deployed friendly Space Marines unit.');
   const data=getBattleRosterUnit(state,unit);
   if(source==='captain' &&
     !(data?.datasheet?.abilities??[]).some(a=>a.name==='Strategic Acumen'))
     throw new Error('Only a Captain with Strategic Acumen can declare a unit-specific doctrine here.');
   if(!['captain','stratagem'].includes(source))throw new Error('Unsupported unit doctrine source.');
   if(events.some(e=>e.payload.scope==='unit'&&e.payload.unitId===unitId&&
      e.payload.turn===state.turn&&e.payload.source===source))
     throw new Error('This unit already recorded this doctrine source in the current Command phase.');
 }
 return appendHistoryEntry(state,createEvent('space_marines.doctrine_selected',{
  playerId,doctrine:selected,scope,source,unitId:scope==='unit'?unitId:null,
  round:state.battle.round,turn:state.turn,phase:state.phase,
  note:'This doctrine expires at the start of the player’s next Command phase.'
 }));
}
