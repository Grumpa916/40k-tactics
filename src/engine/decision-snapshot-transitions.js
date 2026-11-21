import { appendHistoryEntry } from '../state/history.js';
import { createEvent } from '../events/event.js';
import { buildDecisionSnapshot } from '../rules/decision-snapshot.js';

export function recordDecisionSnapshot(state, payload = {}) {
  if (state.battle?.status !== 'active') throw new Error('Record a decision during an active battle.');
  const snapshot = buildDecisionSnapshot(state, payload);
  if (!snapshot) throw new Error('Could not build decision snapshot.');
  return appendHistoryEntry(state, createEvent('decision.snapshot', snapshot));
}
