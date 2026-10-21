import { appendHistoryEntry } from '../state/history.js';
import { createEvent } from '../events/event.js';
import { isCombatActivationFinished } from '../rules/combat-activation-state.js';

export function finishCombatActivation(state, { unitId } = {}) {
  if (state.battle?.status !== 'active' || !['shooting','fight'].includes(state.phase)) throw new Error('Finish an activation during Shooting or Fight.');
  const phase = state.phase;
  const eventType = phase === 'shooting' ? 'shooting.unit_activated' : 'fight.unit_activated';
  const actionType = phase === 'shooting' ? 'shoot' : 'fight';
  const activation = state.history.find(event => event.type === eventType && event.payload?.unitId === unitId &&
    event.payload?.round === state.battle.round && event.payload?.turn === state.turn &&
    (event.payload?.actionType ?? actionType) === actionType);
  if (!activation) throw new Error('Select a unit with a recorded combat activation first.');
  if (isCombatActivationFinished(state, unitId)) return state;
  return appendHistoryEntry(state, createEvent('combat.activation_finished', { unitId, phase, round:state.battle.round, turn:state.turn }));
}
