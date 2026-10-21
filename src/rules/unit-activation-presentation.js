import { isCombatActivationFinished } from './combat-activation-state.js';
// Presentation comes from saved events, scoped to the recorded phase and turn.
export function getUnitActivationPresentation(state, unitId) {
  const events = (state.history ?? []).filter(event => event.payload?.unitId === unitId &&
    event.payload?.round === state.battle?.round && event.payload?.turn === state.turn);
  const activationType = { shooting:'shooting.unit_activated', charge:'charge.outcome_recorded', fight:'fight.unit_activated' }[state.phase];
  const activation = events.find(event => event.type === activationType);
  if (!activation) return '';
  const action = activation.payload?.actionType;
  if (state.phase === 'charge') return 'resolved';
  if (state.phase === 'shooting' && action && action !== 'shoot') return 'resolved';
  if (state.phase === 'fight' && action === 'not_fight') return 'resolved';
  if (isCombatActivationFinished(state, unitId)) return 'resolved';
  return 'active';
}
