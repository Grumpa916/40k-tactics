export function isCombatActivationFinished(state, unitId, phase = state.phase) {
  return (state.history ?? []).some(event => event.type === 'combat.activation_finished' &&
    event.payload?.unitId === unitId && event.payload?.phase === phase &&
    event.payload?.round === state.battle?.round && event.payload?.turn === state.turn);
}
