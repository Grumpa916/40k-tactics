import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { recordVictoryPointsAward, getVictoryPointScore } from './victory-points-ledger.js';
import { getSecondaryMissionHistory, getSecondaryMissionMode, SECONDARY_MISSION_STATUS } from '../rules/secondary-mission-lifecycle.js';

function effectiveAward(state, index) {
  const event=state.history?.[index];
  if(event?.type!=='victory_points.awarded' || event.payload?.category!=='secondary') return null;
  if((state.history??[]).some(item=>['victory_points.award_undone','victory_points.adjustment_undone'].includes(item.type) &&
    (item.payload?.originalAwardEventIndex===index || (event.id && item.payload?.originalAwardEventId===event.id)))) return null;
  return event;
}

/** Correct a recorded card, or score a card that was accidentally discarded/returned.
 * Keep the original history and append an explicit reversal for a changed award.
 */
export function correctSecondaryMissionScore(state,{playerId,instanceId,amount,round,awardEventIndex=null}={}) {
  const entry=getSecondaryMissionHistory(state,playerId).find(card=>card.instanceId===instanceId);
  if(!entry) throw new Error('Choose a secondary card from this player’s battle.');
  if(!Number.isInteger(round)||round<1||round>(state.battle?.round??0)) throw new Error('Choose a played battle round.');
  if(round<(entry.drawnRound??1)) throw new Error('The card had not been drawn in that round.');
  if(!Number.isInteger(amount)||amount<0||amount>15) throw new Error('Enter 0–15 VP for the card.');
  const old=awardEventIndex==null?null:effectiveAward(state,awardEventIndex);
  if(awardEventIndex!=null && (!old || old.payload.playerId!==playerId ||
    old.payload.secondaryMissionBefore?.instanceId!==instanceId)) throw new Error('That card award is no longer available to correct.');
  if(!old && entry.status===SECONDARY_MISSION_STATUS.SCORED) throw new Error('Choose the existing award to correct this scored card.');
  const previous=old?.payload;
  const before=getVictoryPointScore(state,playerId);
  if(old && before<previous.amount) throw new Error('Current VP is below the award being corrected.');
  let updated=state;
  if(old) {
    updated={...updated,victoryPoints:{...(updated.victoryPoints??{}),[playerId]:before-previous.amount}};
    updated=appendHistoryEntry(updated,createEvent('victory_points.award_undone',{
      playerId,amount:previous.amount,reason:'Secondary score correction',
      originalReason:previous.reason,originalAwardEventId:old.id??null,
      originalAwardEventIndex:awardEventIndex,missionDefinitionId:entry.definitionId,
      category:'secondary',opportunityKey:previous.opportunityKey??null,
      round:state.battle.round,turn:state.turn,scoreBefore:before,scoreAfter:before-previous.amount
    }));
  }
  const cards=updated.scoring?.secondaryMissions??[];
  // Preserve the card's original draw/discard record while replacing its scored outcome.
  const card={...entry,status:SECONDARY_MISSION_STATUS.ACTIVE,
    scoringHistory:old?(entry.scoringHistory??[]).filter(item=>item.round!==previous.round):entry.scoringHistory??[],
    scoredRound:null,scoredTurn:null};
  updated={...updated,scoring:{...(updated.scoring??{}),
    secondaryMissions:cards.map(item=>item.instanceId===instanceId?card:item)}};
  if(amount===0) return appendHistoryEntry(updated,createEvent('secondary_mission.score_corrected',{
    playerId,instanceId,round,amount:0,previousAmount:previous?.amount??0,previousRound:previous?.round??null
  }));
  const mode=getSecondaryMissionMode(updated,playerId)??entry.definition?.missionMode??'tactical';
  updated=recordVictoryPointsAward(updated,{
    playerId,amount,reason:entry.definition?.name??entry.definitionId,
    missionDefinitionId:entry.definitionId,category:'secondary',missionMode:mode,
    opportunityKey:[instanceId,round,'manual-correction',updated.history.length].join(':'),
    round,turn:state.turn
  });
  const awarded=updated.history.at(-1);
  updated={...updated,history:[...updated.history.slice(0,-1),{
    ...awarded,payload:{...awarded.payload,secondaryMissionBefore:card,scoreCorrection:true}
  }]};
  const scored={...card,status:mode==='fixed'?SECONDARY_MISSION_STATUS.ACTIVE:SECONDARY_MISSION_STATUS.SCORED,
    scoredRound:round,scoredTurn:state.turn,
    scoringHistory:[...(card.scoringHistory??[]),{round,turn:state.turn,notes:'Corrected '+amount+' VP'}]};
  updated={...updated,scoring:{...updated.scoring,
    secondaryMissions:updated.scoring.secondaryMissions.map(item=>item.instanceId===instanceId?scored:item)}};
  return appendHistoryEntry(updated,createEvent('secondary_mission.score_corrected',{
    playerId,instanceId,round,amount:awarded.payload.amount,
    previousAmount:previous?.amount??0,previousRound:previous?.round??null
  }));
}
export function getCorrectableSecondaryAwards(state,playerId) {
  return (state.history??[]).flatMap((event,index)=>{
    const active=effectiveAward(state,index),instanceId=active?.payload.secondaryMissionBefore?.instanceId;
    return active?.payload.playerId===playerId && instanceId?[{index,instanceId,amount:active.payload.amount,round:active.payload.round}]:[];
  });
}
