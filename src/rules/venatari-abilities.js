import { getBattleUnitDatasheet, getCombatFormationRoot } from './battle-unit-reference.js';
import { getFightEngagementState } from './fight-engagement-state.js';
import { isUnitBattleShocked } from './unit-status-summary.js';
import { rulesContextKey } from './rules-phase-window.js';

export function getVenatariAbilityBlockReason(state, unit, ruleId) {
  if (ruleId === 'swift-ruin') {
    if ((state.battle?.round ?? 0) < 2) return 'Rapid Ingress is unavailable in battle round 1.';
    if (isUnitBattleShocked(unit)) return 'A Battle-shocked unit cannot be targeted with Rapid Ingress.';
  }
  if (ruleId === 'take-wing' && getFightEngagementState(state).engagedUnitIds
    .includes(getCombatFormationRoot(state, unit)?.id ?? unit.id)) {
    return 'Resolve this unit’s recorded engagement before using Take Wing.';
  }
  return null;
}

export function getVenatariMineTargets(state, sourceId) {
  const source = state.units?.find(unit => unit.id === sourceId);
  if (!source) return [];
  return (state.units ?? []).filter(unit => unit.ownerId !== source.ownerId &&
    unit.status === 'deployed' && getCombatFormationRoot(state, unit)?.id === unit.id)
    .map(unit => {
      const keywords = getBattleUnitDatasheet(state, unit)?.keywords ?? unit.profile?.keywords ?? [];
      const known = keywords.length > 0;
      const largeTarget = keywords.some(keyword => ['monster', 'vehicle'].includes(String(keyword).toLowerCase()));
      return { unitId: unit.id, name: unit.name, maxWounds: largeTarget || !known ? 6 : 3,
        damageReminder: largeTarget ? '2D3 mortal wounds on 2+' : known ? 'D3 mortal wounds on 2+' : 'Check target keywords: D3, or 2D3 for Monster/Vehicle' };
    });
}

// A declaration authorizes placement only during that same opponent Movement phase.
// Legacy reminder-only records cannot authorize an arrival.
export function getPendingVenatariIngress(state) {
  if (state.battle?.status !== 'active' || state.phase !== 'movement' || state.battle.round < 2) return [];
  const contextKey = rulesContextKey(state);
  const activePlayer = state.activePlayer ?? state.battle.activePlayerId;
  return (state.units ?? []).filter(unit => unit.status === 'reserves' && unit.ownerId !== activePlayer &&
    (state.history ?? []).some(event => event.type === 'rules.reminder_used' &&
      event.payload?.ruleId === 'swift-ruin' && event.payload.unitId === unit.id &&
      event.payload.playerId === unit.ownerId && event.payload.contextKey === contextKey &&
      event.payload.ingressConfirmed === true));
}

export function arrivedFromReservesThisTurn(state, unitId) {
  return (state.history ?? []).some(event => event.type === 'unit.arrived_from_reserves' &&
    event.payload?.unitId === unitId && event.payload.turn === state.turn &&
    event.payload.round === state.battle?.round);
}
