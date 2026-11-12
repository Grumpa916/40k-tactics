import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { recordCommandPointChange, getCommandPointBalance } from './command-points-ledger.js';
import { getRosterDetachmentNames } from '../rules/roster-detachment-selection.js';
import { getBattleRosterUnit } from '../rules/battle-unit-reference.js';
import { SPACE_MARINES_STRATAGEM_CATALOG } from '../data/space-marines-stratagems.js';
import { recordSpaceMarineDoctrineUse } from '../rules/space-marine-doctrines.js';
import { rulesContextKey } from '../rules/rules-phase-window.js';

const normalized=value=>String(value??'').trim().toLowerCase();
const active=state=>state.activePlayer??state.battle?.activePlayerId;
const words=(state,unit)=>{
 const rosterUnit=getBattleRosterUnit(state,unit);
 return [...(rosterUnit?.datasheet?.keywords??[]),...(rosterUnit?.keywords??[])]
  .map(normalized);
};
function eligibleType(state,unit,target){
 if(!unit||unit.status!=='deployed')return false;
 const id=normalized(getBattleRosterUnit(state,unit)?.datasheetId);
 const wordsList=words(state,unit);
 const has=word=>wordsList.includes(word);
 const is=word=>has(word)||id.includes(word.replaceAll(' ','-'));
 if(target==='Adeptus Astartes')return id.startsWith('space-marines:');
 if(target==='Vehicle')return has('vehicle');
 if(target==='Dreadnought')return is('dreadnought');
 if(target==='Kill Team')return is('kill team');
 if(target==='Infantry')return has('infantry');
 if(target==='Transport')return has('transport');
 if(target==='Infantry or Mounted')return has('infantry')||is('mounted')||is('bike');
 if(target==='Mounted or Speeder')return is('mounted')||is('bike')||is('speeder')||is('atv');
 if(target==='Mounted')return is('mounted')||is('bike')||is('atv');
 if(target==='Terminator')return is('terminator');
 if(target==='Tacticus')return is('tacticus')||['intercessor','hellblaster','bladeguard','infernus','sternguard','desolation'].some(k=>id.includes(k));
 if(target==='Gravis')return is('gravis')||['aggressor','heavy-intercessor','inceptor','eradicator'].some(k=>id.includes(k));
 if(target==='Phobos')return is('phobos')||['infiltrator','incursor','reiver','eliminator'].some(k=>id.includes(k));
 if(target==='Phobos or Scout')return eligibleType(state,unit,'Phobos')||id.includes('scout');
 return false;
}
export function getSpaceMarineStratagemUses(state,playerId=null){
 return (state?.history??[]).filter(event=>event.type==='space_marines.stratagem_used')
 .map(event=>event.payload).filter(payload=>playerId==null||payload.playerId===playerId);
}
export function getSpaceMarineStratagemOpportunities(state,{playerId,unitId=null}={}){
 if(state?.battle?.status!=='active'||normalized(state.armyRosters?.[playerId]?.faction)!=='space marines')return [];
 const chosen=new Set(getRosterDetachmentNames(state.armyRosters[playerId]));
 const unit=(state.units??[]).find(u=>u.id===unitId&&u.ownerId===playerId);
 const previous=getSpaceMarineStratagemUses(state,playerId);
 const phase=state.phase;
 const ownTurn=active(state)===playerId;
 return SPACE_MARINES_STRATAGEM_CATALOG.filter(def=>chosen.has(def.detachment)&&def.phases.includes(phase)
   &&(def.turn==='either'||(ownTurn&&def.turn==='own')||(!ownTurn&&def.turn==='opponent')))
 .map(def=>{
  const used=previous.find(use=>use.stratagemId===def.id&&use.contextKey===rulesContextKey(state));
  const spentOnUnit=previous.find(use=>use.unitId===unitId&&
    use.contextKey===rulesContextKey(state));
  const affordable=getCommandPointBalance(state,playerId)>=def.cpCost;
  const unitEligible=unit!=null&&eligibleType(state,unit,def.target);
  const available=!!unitEligible&&!used&&!spentOnUnit&&affordable;
  return {...def,available,affordable,used,
    reason:!unit?'Select a friendly unit on the map':
     !unitEligible?'Selected unit does not have required keywords':
     used?'Already used in this phase':spentOnUnit?'This unit already received a Stratagem this phase':
     !affordable?'Not enough CP':'Confirm actual tabletop trigger and target before recording'};
 });
}
export function recordSpaceMarineStratagemUse(state,{
 playerId,unitId,stratagemId,timingConfirmed=false,targetConfirmed=false,doctrine=null
}={}){
 if(state?.battle?.status!=='active')throw new Error('A battle must be active.');
 const def=SPACE_MARINES_STRATAGEM_CATALOG.find(x=>x.id===stratagemId);
 if(!def)throw new Error('Unknown or unreviewed Space Marine Stratagem.');
 const available=getSpaceMarineStratagemOpportunities(state,{playerId,unitId}).find(x=>x.id===stratagemId);
 if(!available?.available)throw new Error(available?.reason??'The Stratagem is unavailable in this phase.');
 if(!timingConfirmed||!targetConfirmed)
  throw new Error('Confirm the printed timing, selected target and any special conditions at the table.');
 if(def.name==='Adaptive Strategy'&&!['assault','tactical','devastator'].includes(doctrine))
  throw new Error('Adaptive Strategy requires choosing the Doctrine for the targeted unit.');
 // Unit-specific Stratagem doctrine requires no army-wide per-battle use.
 const spent=recordCommandPointChange(state,{playerId,amount:-def.cpCost,reason:'spend',
  note:def.name+' · '+def.detachment,round:state.battle.round,turn:state.turn});
 const applied=def.name==='Adaptive Strategy'
   ?recordSpaceMarineDoctrineUse(spent,{playerId,doctrine,scope:'unit',unitId,source:'stratagem'})
   :spent;
 return appendHistoryEntry(applied,createEvent('space_marines.stratagem_used',{
  playerId,unitId,stratagemId:def.id,ruleName:def.name,detachmentName:def.detachment,
  cpSpent:def.cpCost,round:state.battle.round,turn:state.turn,phase:state.phase,
  contextKey:rulesContextKey(state),timingConfirmed,targetConfirmed,
  ...(doctrine?{doctrine}:{}),
  note:'Tabletop action confirmed; non-Doctrine effects are not auto-resolved.'
 }));
}
