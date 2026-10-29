export const rulesContextKey = state => [state?.battle?.round ?? 0, state?.turn ?? 0, state?.activePlayer ?? state?.battle?.activePlayerId, state?.phase].join(':');

// UI selections do not close a window; recorded tabletop actions do.
export function isRulesPhaseOpening(state) {
  const history = state?.history ?? [];
  let boundary = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (['turn.phase_changed', 'turn.started', 'battle.round_advanced'].includes(history[i]?.type)) { boundary = i; break; }
  }
  return !history.slice(boundary + 1).some(event => /^(combat\.attack_resolved|shooting\.unit_activated|fight\.unit_activated|charge\.|unit\.(normal_move_resolved|advanced|fell_back|stationary_recorded))/.test(event.type));
}
