import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';
import { getVenatariMineTargets } from '../rules/venatari-abilities.js';
import { rulesContextKey } from '../rules/rules-phase-window.js';
import { requireRulesReminderUse } from './rules-reminder-transitions.js';
import { applyReserveTransfer } from './map-reserve-transitions.js';
import { recordCommandPointChange } from './command-points-ledger.js';

export function recordVenatariAbilityUse(state, {
  playerId, unitId, ruleId, targetId = null, actualWounds = 0, cpSpent = 0,
  rangeConfirmed = false, phaseEndConfirmed = false, unengagedConfirmed = false,
  ingressConfirmed = false
} = {}) {
  const entry = requireRulesReminderUse(state, { playerId, unitId, ruleId });
  if (!entry.venatariControl) throw new Error('Choose one of this unit’s Venatari abilities.');
  const unit = state.units.find(item => item.id === unitId);
  let next = state;
  const details = {};
  if (ruleId === 'cascade-mine') {
    if (rangeConfirmed !== true) throw new Error('Confirm that the chosen enemy is within 3″ at the table.');
    const target = getVenatariMineTargets(state, unitId).find(item => item.unitId === targetId);
    if (!target) throw new Error('Choose a deployed enemy unit as the mine target.');
    if (!Number.isInteger(actualWounds) || actualWounds < 0 || actualWounds > target.maxWounds) {
      throw new Error('Record actual wounds lost from 0 to ' + target.maxWounds + ', after any defensive rolls.');
    }
    const before = state.units.find(item => item.id === targetId);
    const woundsBefore = getLiveUnitVitals(state, before).wounds;
    if (actualWounds > 0 && !Number.isFinite(woundsBefore)) throw new Error('The target needs a tracked wound count before recording mine damage.');
    const woundsAfter = Number.isFinite(woundsBefore) ? Math.max(0, woundsBefore - actualWounds) : null;
    const statusAfter = woundsAfter === 0 ? 'destroyed' : before.status;
    const stateDelta = { target: { unitId:targetId, woundsBefore, woundsAfter, statusBefore:before.status, statusAfter } };
    next = { ...state, units:state.units.map(item => item.id === targetId
      ? {...item, ...(woundsAfter !== null ? {wounds:woundsAfter} : {}), status:statusAfter} : item) };
    next = appendHistoryEntry(next, createEvent('unit.mortal_wounds_recorded', {
      sourceUnitId:unitId, targetId, playerId, ruleId, actualWounds, stateDelta,
      round:state.battle.round, turn:state.turn, phase:state.phase
    }));
    Object.assign(details, {targetId, actualWounds, rangeConfirmed:true});
  } else if (ruleId === 'take-wing') {
    if (phaseEndConfirmed !== true || unengagedConfirmed !== true) {
      throw new Error('Confirm the end of opponent Fight and that this unit is unengaged.');
    }
    next = applyReserveTransfer(state, {unit, destination:'reserves', reason:'Take Wing'});
    Object.assign(details, {phaseEndConfirmed:true, unengagedConfirmed:true});
  } else if (ruleId === 'swift-ruin') {
    if (phaseEndConfirmed !== true || ingressConfirmed !== true) {
      throw new Error('Confirm the end of opponent Movement and legal Rapid Ingress placement.');
    }
    if (!Number.isInteger(cpSpent) || cpSpent < 0 || cpSpent > 3) throw new Error('Choose the actual CP cost from 0 to 3 after the discount and other modifiers.');
    if (cpSpent) next = recordCommandPointChange(next, {playerId, amount:-cpSpent, reason:'spend', note:'Rapid Ingress · Swift Ruin'});
    Object.assign(details, {phaseEndConfirmed:true, ingressConfirmed:true, cpSpent});
  }
  return appendHistoryEntry(next, createEvent('rules.reminder_used', {
    playerId, unitId, ruleId, choice:null, ruleName:entry.title, ...details,
    contextKey:rulesContextKey(state), round:state.battle.round, turn:state.turn, phase:state.phase
  }));
}
