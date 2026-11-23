import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { UNIT_STATUS } from '../state/unit.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';

/**
 * Apply a Hazardous result the player already rolled.
 * The core Hazardous dice table is not stored in this app, so the wound count is entered.
 * Firing Deck assigns that result to the embarked unit that fired, never the transport.
 */
export function resolveFiringDeckHazardous(state, { transportId, bearerId, mortalWounds } = {}) {
  if (!transportId || !bearerId) {
    throw new TypeError('Firing Deck Hazardous resolution needs the transport and the firing unit.');
  }
  if (bearerId === transportId) {
    throw new Error('The transport does not take the Hazardous test for a Firing Deck weapon.');
  }
  if (!Number.isInteger(mortalWounds) || mortalWounds < 0) {
    throw new TypeError('Hazardous damage must be a non-negative integer entered from the test.');
  }
  const transport = state.units?.find(unit => unit.id === transportId);
  const bearer = state.units?.find(unit => unit.id === bearerId);
  if (!transport || !bearer) throw new Error('Transport and firing unit must exist.');
  if (bearer.status !== UNIT_STATUS.EMBARKED || bearer.transportId !== transport.id) {
    throw new Error('The Hazardous test is taken by the embarked unit that fired, not the transport.');
  }
  const previous = getLiveUnitVitals(state, bearer).wounds;
  const tracks = Number.isFinite(previous);
  const nextWounds = tracks ? Math.max(0, previous - mortalWounds) : bearer.wounds;
  const nextStatus = tracks && nextWounds === 0 ? UNIT_STATUS.DESTROYED : bearer.status;
  const event = createEvent('firing_deck.hazardous_resolved', {
    transportId: transport.id,
    bearerId: bearer.id,
    mortalWounds,
    round: state.battle?.round ?? null,
    turn: state.turn ?? null,
    stateDelta: {
      bearer: {
        unitId: bearer.id,
        woundsBefore: previous,
        woundsAfter: nextWounds,
        statusBefore: bearer.status,
        statusAfter: nextStatus
      }
    }
  });
  return appendHistoryEntry({
    ...state,
    units: state.units.map(unit => unit.id === bearer.id ? { ...unit, wounds: tracks ? nextWounds : unit.wounds, status: nextStatus } : unit)
  }, event);
}
