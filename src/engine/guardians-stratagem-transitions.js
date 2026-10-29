import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { getGuardiansStratagemOpportunities } from '../rules/guardians-stratagem-opportunities.js';
import { rulesContextKey } from '../rules/rules-phase-window.js';
import { recordCommandPointChange } from './command-points-ledger.js';
import { recordCustodesKatahReadied } from './custodes-katah-transitions.js';

export function recordGuardiansStratagemUse(state, {playerId,unitId,stratagemId,enemyUnitId=null,
  timingConfirmed=false,unitLimitConfirmed=false,rangeConfirmed=false}={}) {
  const entry=getGuardiansStratagemOpportunities(state,{playerId,unitId,stratagemId}).find(item=>item.unitId===unitId);
  if (!entry || !entry.available) throw new Error(entry?.blockedReason??'This Guardians stratagem is unavailable for this unit and timing.');
  if (timingConfirmed!==true || unitLimitConfirmed!==true) throw new Error('Confirm the timing and that no other stratagem targeted this unit this phase.');
  if (['in-auramite-clad','swift-as-the-eagle'].includes(stratagemId)) {
    if (!entry.enemies.some(enemy=>enemy.id===enemyUnitId)) throw new Error('Select the enemy unit for the current trigger.');
  } else if (enemyUnitId!==null) throw new Error('This stratagem does not select an enemy unit.');
  if (stratagemId==='swift-as-the-eagle' && rangeConfirmed!==true) throw new Error('Confirm the enemy ended its move within 8″ and this unit is unengaged.');
  let next=recordCommandPointChange(state,{playerId,amount:-entry.cpCost,reason:'spend',note:entry.title});
  if (stratagemId==='superhuman-focus') next=recordCustodesKatahReadied(next,{playerId,unitId,source:'Superhuman Focus'});
  return appendHistoryEntry(next,createEvent('custodes.guardians_stratagem_used',{
    playerId,unitId,stratagemId,ruleName:entry.title,enemyUnitId,cpSpent:entry.cpCost,
    timingConfirmed:true,unitLimitConfirmed:true,...(rangeConfirmed?{rangeConfirmed:true}:{}),
    round:state.battle.round,turn:state.turn,phase:state.phase,contextKey:rulesContextKey(state)
  }));
}
