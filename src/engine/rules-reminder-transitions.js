import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { getBattleRulesReminders, rulesContextKey } from '../rules/battle-rules-reminders.js';
import { recordCommandPointChange } from './command-points-ledger.js';
import { recordCustodesKatahReadied } from './custodes-katah-transitions.js';

export function recordRulesReminderUse(state, {playerId,unitId=null,ruleId,choice=null}={}) {
  const entry=getBattleRulesReminders(state,{playerId}).find(item=>item.ruleId===ruleId && (item.unitId??null)===unitId);
  if(!entry?.limit || !entry.available || entry.used) throw new Error('This rule is unavailable, already used, or outside its timing window.');
  if(entry.choices && !entry.choices.some(item=>item.id===choice)) throw new Error('Choose one of the listed rule effects.');
  if(!entry.choices && choice!==null) throw new Error('This rule does not require an effect choice.');
  let next=state;
  if(ruleId==='aquila-commander') next=recordCommandPointChange(next,{playerId,amount:1,reason:'gain',note:'Aquila Commander',round:state.battle.round,turn:state.turn});
  if(ruleId==='superhuman-focus') {
    next=recordCommandPointChange(next,{playerId,amount:-1,reason:'spend',note:'Superhuman Focus',round:state.battle.round,turn:state.turn});
    next=recordCustodesKatahReadied(next,{playerId,unitId,source:'Superhuman Focus'});
  }
  return appendHistoryEntry(next,createEvent('rules.reminder_used',{playerId,unitId,ruleId,choice,ruleName:entry.title,contextKey:rulesContextKey(state),round:state.battle.round,turn:state.turn,phase:state.phase}));
}

export function setUnitBattleNote(state,{playerId,unitId,note}={}) {
  const unit=state?.units?.find(item=>item.id===unitId && item.ownerId===playerId);
  if(!unit) throw new Error('Choose a unit belonging to this player.');
  if(typeof note!=='string' || note.length>2000) throw new Error('Unit notes must be text of 2,000 characters or fewer.');
  return {...state,units:state.units.map(item=>item.id===unitId?{...item,metadata:{...item.metadata,battleRulesNote:note.trim()}}:item)};
}
