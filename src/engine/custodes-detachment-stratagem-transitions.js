import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { getPreternaturalRapidityOpportunities } from '../rules/custodes-detachment-stratagem-opportunities.js';
import { rulesContextKey } from '../rules/rules-phase-window.js';
import { recordCommandPointChange } from './command-points-ledger.js';

export function recordCustodesDetachmentStratagemUse(state,{playerId,unitId,stratagemId,timingConfirmed=false,unitLimitConfirmed=false}={}) {
  if (stratagemId!=='preternatural-rapidity') throw new Error('This detachment Stratagem is not supported yet.');
  const entry=getPreternaturalRapidityOpportunities(state,{playerId,unitId}).find(item=>item.unitId===unitId);
  if (!entry || !entry.available) throw new Error(entry?.blockedReason ?? 'Preternatural Rapidity is unavailable for this unit and timing.');
  if (timingConfirmed!==true || unitLimitConfirmed!==true) throw new Error('Confirm the Advance timing and that no other Stratagem targeted this unit this phase.');
  const next=recordCommandPointChange(state,{playerId,amount:-entry.cpCost,reason:'spend',note:entry.title});
  return appendHistoryEntry(next,createEvent('custodes.detachment_stratagem_used',{
    playerId,unitId,stratagemId,detachmentName:'Dread Host',ruleName:entry.title,cpSpent:entry.cpCost,
    timingConfirmed:true,unitLimitConfirmed:true,round:state.battle.round,turn:state.turn,phase:state.phase,
    contextKey:rulesContextKey(state)
  }));
}
