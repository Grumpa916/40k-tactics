import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { UNIT_STATUS } from '../state/unit.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';

function restoredStatus(state, unit) {
  if (unit.status !== UNIT_STATUS.DESTROYED) return unit.status;
  if (state.battlefieldMap?.declaredReserves?.[unit.id] === true && !unit.position) return UNIT_STATUS.RESERVES;
  return UNIT_STATUS.DEPLOYED;
}

export function adjustUnitWounds(state, { unitId, amount } = {}) {
  if (!state?.battle || state.battle.status !== 'active') {
    throw new Error('Wounds can only be adjusted during an active battle.');
  }
  if (!unitId) throw new TypeError('A unit id is required to adjust wounds.');
  if (!Number.isInteger(amount) || amount === 0) throw new TypeError('Wound adjustment must be a non-zero integer.');

  const unit = (state.units ?? []).find((item) => item.id === unitId);
  if (!unit) throw new Error('Unit not found: ' + unitId);
  if (unit.status === UNIT_STATUS.EMBARKED) throw new Error('Embarked unit wounds cannot be adjusted from the live battlefield controls.');

  const vitals = getLiveUnitVitals(state, unit);
  if (!Number.isFinite(vitals.wounds)) throw new Error('This unit does not have a tracked wound total.');

  const maximum = Number.isFinite(vitals.startingWounds) ? vitals.startingWounds : null;
  const woundsBefore = vitals.wounds;
  const woundsAfter = Math.max(0, maximum == null ? woundsBefore + amount : Math.min(maximum, woundsBefore + amount));
  if (woundsAfter === woundsBefore) return state;

  const statusBefore = unit.status;
  const statusAfter = woundsAfter === 0 ? UNIT_STATUS.DESTROYED : restoredStatus(state, unit);
  const unitAfter = { ...unit, wounds: woundsAfter, status: statusAfter };

  const event = createEvent('unit.wounds_adjusted', {
    unitId,
    playerId: unit.ownerId,
    amount: woundsAfter - woundsBefore,
    woundsBefore,
    woundsAfter,
    statusBefore,
    statusAfter,
    round: state.battle?.round ?? 0,
    turn: state.turn ?? 0,
    phase: state.phase ?? null,
    reason: 'Manual live-state correction'
  });

  return appendHistoryEntry({
    ...state,
    units: state.units.map((item) => item.id === unitId ? unitAfter : item)
  }, event);
}
