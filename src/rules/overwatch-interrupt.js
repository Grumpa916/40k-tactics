import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { hasBaseMovementAction } from '../engine/movement-refinement-transitions.js';

// The repo does not store a Fire Overwatch rules card. These moments are the
// interrupt windows named for this work: a unit is set up, or a move starts
// or ends. End-of-phase is not one of them. Range is confirmed at the table
// because no range value is stored. Recording does not change Command Points.

const END_MOVE = new Set(['unit.normal_move_resolved', 'unit.advanced', 'unit.fell_back']);

function current(state) {
  return { round: state?.battle?.round, turn: state?.turn, phase: state?.phase };
}

function reactingPlayerId(state) {
  const active = state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
  return (state?.players ?? []).find(player => player.id && player.id !== active)?.id ?? null;
}

function answered(state, triggerKey) {
  const { round, turn, phase } = current(state);
  return (state.history ?? []).some(event => event.type === 'overwatch.interrupt_answered' &&
    event.payload?.triggerKey === triggerKey && event.payload?.round === round &&
    event.payload?.turn === turn && event.payload?.phase === phase);
}

export function overwatchUsedThisPhase(state, playerId) {
  const { round, turn, phase } = current(state);
  return (state.history ?? []).some(event => event.type === 'overwatch.interrupt_answered' &&
    event.payload?.decision === 'use' && event.payload?.playerId === playerId &&
    event.payload?.round === round && event.payload?.turn === turn && event.payload?.phase === phase);
}

function classify(state, event) {
  if (!event) return null;
  const phase = state.phase;
  if (END_MOVE.has(event.type) && event.payload?.phase === phase) return 'ends-move';
  if (event.type === 'unit.arrived_from_reserves' && event.payload?.phase === phase &&
      (phase === 'movement' || phase === 'charge')) return 'set-up';
  if (event.type === 'charge.outcome_recorded' && phase === 'charge' && event.payload?.outcome === 'successful') return 'ends-move';
  if (event.type === 'unit.stationary_recorded' && event.payload?.phase === phase) return 'not-a-move';
  if (event.type === 'charge.outcome_recorded' && phase === 'charge') return 'not-a-move';
  return null;
}

function offer(state, { moment, enemyUnitId, triggerKey }) {
  const playerId = reactingPlayerId(state);
  const enemy = (state.units ?? []).find(unit => unit.id === enemyUnitId);
  if (!playerId || !enemy || overwatchUsedThisPhase(state, playerId) || answered(state, triggerKey)) return null;
  const active = state.activePlayer ?? state.battle?.activePlayerId;
  if (enemy.ownerId !== active) return null;
  return { playerId, enemyUnitId, enemyName: enemy.name ?? enemy.id, moment, triggerKey, phase: state.phase };
}

export function getOverwatchOffer(state, { selectedUnitId = null } = {}) {
  if (state?.battle?.status !== 'active' || !['movement', 'charge'].includes(state.phase)) return null;
  const active = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  const history = state.history ?? [];
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index];
    const kind = classify(state, event);
    if (!kind) continue;
    const payload = event.payload ?? {};
    if (payload.round != null && payload.round !== state.battle.round) break;
    if (payload.turn != null && payload.turn !== state.turn) break;
    if (payload.playerId !== active) break;
    if (kind === 'not-a-move') break;
    return offer(state, { moment: kind, enemyUnitId: payload.unitId, triggerKey: kind + ':' + index });
  }
  if (state.phase !== 'movement' || !selectedUnitId) return null;
  const selected = (state.units ?? []).find(unit => unit.id === selectedUnitId);
  if (!selected || selected.ownerId !== active || selected.status !== 'deployed') return null;
  if (hasBaseMovementAction(state, selected.id)) return null;
  return offer(state, {
    moment: 'starts-move',
    enemyUnitId: selected.id,
    triggerKey: 'starts-move:' + state.battle.round + ':' + state.turn + ':' + selected.id
  });
}

function requireOffer(state, triggerKey, selectedUnitId) {
  const selected = selectedUnitId ?? (String(triggerKey ?? '').startsWith('starts-move:') ? String(triggerKey).split(':').at(-1) : null);
  const currentOffer = getOverwatchOffer(state, { selectedUnitId: selected });
  if (!currentOffer || currentOffer.triggerKey !== triggerKey) {
    throw new Error('Fire Overwatch is not available for this action.');
  }
  return currentOffer;
}

export function recordOverwatchUse(state, { triggerKey, firingUnitId, inRangeConfirmed, selectedUnitId = null } = {}) {
  const currentOffer = requireOffer(state, triggerKey, selectedUnitId);
  if (inRangeConfirmed !== true) throw new Error('Confirm the enemy unit is within range on the table before recording Overwatch.');
  const firing = (state.units ?? []).find(unit => unit.id === firingUnitId);
  if (!firing || firing.ownerId !== currentOffer.playerId || firing.status !== 'deployed') {
    throw new Error('Choose one of your deployed units to fire Overwatch.');
  }
  const { round, turn, phase } = current(state);
  return appendHistoryEntry(state, createEvent('overwatch.interrupt_answered', {
    decision: 'use', playerId: currentOffer.playerId, firingUnitId, enemyUnitId: currentOffer.enemyUnitId,
    moment: currentOffer.moment, triggerKey, round, turn, phase, recordedCpChange: 0
  }));
}

export function declineOverwatch(state, { triggerKey, selectedUnitId = null } = {}) {
  const currentOffer = requireOffer(state, triggerKey, selectedUnitId);
  const { round, turn, phase } = current(state);
  return appendHistoryEntry(state, createEvent('overwatch.interrupt_answered', {
    decision: 'decline', playerId: currentOffer.playerId, enemyUnitId: currentOffer.enemyUnitId,
    moment: currentOffer.moment, triggerKey, round, turn, phase, recordedCpChange: 0
  }));
}
