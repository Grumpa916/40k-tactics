import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { getPreternaturalRapidityOpportunities, getLightningWrathOpportunities, getGoldenLightOpportunities, getUnleashTheLionsOpportunities } from '../rules/custodes-detachment-stratagem-opportunities.js';
import { rulesContextKey } from '../rules/rules-phase-window.js';
import { recordCommandPointChange } from './command-points-ledger.js';
import { splitCustodesTerminators } from './unleash-the-lions-transitions.js';

export function recordCustodesDetachmentStratagemUse(state,{playerId,unitId,stratagemId,timingConfirmed=false,unitLimitConfirmed=false,woundsByModel=null,vexillaModelIndex=null}={}) {
  const getOpportunities=stratagemId==='preternatural-rapidity' ? getPreternaturalRapidityOpportunities
    : stratagemId==='lightning-wrath' ? getLightningWrathOpportunities
      : stratagemId==='golden-light-of-the-moiraides' ? getGoldenLightOpportunities
        : stratagemId==='unleash-the-lions' ? getUnleashTheLionsOpportunities : null;
  if (!getOpportunities) throw new Error('This detachment Stratagem is not supported yet.');
  const entry=getOpportunities(state,{playerId,unitId}).find(item=>item.unitId===unitId);
  if (!entry || !entry.available) throw new Error(entry?.blockedReason ?? 'This Stratagem is unavailable for this unit and timing.');
  if (timingConfirmed!==true || unitLimitConfirmed!==true) throw new Error('Confirm the Stratagem timing and that no other Stratagem targeted this unit this phase.');
  const next=recordCommandPointChange(state,{playerId,amount:-entry.cpCost,reason:'spend',note:entry.title});
  const recorded=appendHistoryEntry(next,createEvent('custodes.detachment_stratagem_used',{
    playerId,unitId,stratagemId,detachmentName:stratagemId==='unleash-the-lions'?'Lions of the Emperor':'Dread Host',ruleName:entry.title,cpSpent:entry.cpCost,
    timingConfirmed:true,unitLimitConfirmed:true,round:state.battle.round,turn:state.turn,phase:state.phase,
    contextKey:rulesContextKey(state)
  }));
  return stratagemId==='unleash-the-lions'
    ? splitCustodesTerminators(recorded,{playerId,unitId,woundsByModel,vexillaModelIndex}) : recorded;
}
