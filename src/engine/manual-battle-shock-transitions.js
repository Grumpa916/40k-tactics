import { appendHistoryEntry } from '../state/history.js';
import { createEvent } from '../events/event.js';
import { isUnitBattleShocked } from '../rules/unit-status-summary.js';
// Table-side effects can cause Battle-shock in any phase. This does not record a Command test.
export function setManualBattleShock(state, { unitId, battleShocked } = {}) {
  if (state.battle?.status !== 'active') throw new Error('Battle-shock status requires an active battle.');
  if (typeof battleShocked !== 'boolean') throw new TypeError('Choose a Battle-shock status.');
  const unit = state.units?.find(item => item.id === unitId);
  if (!unit || !['deployed','reserves'].includes(unit.status)) throw new Error('Select a unit on the battlefield or in reserves.');
  if (isUnitBattleShocked(unit) === battleShocked) return state;
  const updated = {...unit,battleShocked,battleShock:{...unit.battleShock,active:battleShocked,status:battleShocked?'battle-shocked':'clear'}};
  return appendHistoryEntry({...state, units:state.units.map(item=>item.id===unitId?updated:item)}, createEvent('battle_shock.status_changed', {
    unitId,playerId:unit.ownerId,battleShockedBefore:isUnitBattleShocked(unit),battleShockedAfter:battleShocked,
    round:state.battle.round,turn:state.turn,phase:state.phase,source:'manual'
  }));
}
