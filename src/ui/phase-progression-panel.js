import { COMMAND_TYPES } from '../commands/game-commands.js';
import { TURN_STEPS } from '../state/turn.js';

const LABELS = { start_turn: 'Start of turn', command: 'Command', movement: 'Movement', shooting: 'Shooting', charge: 'Charge', fight: 'Fight', end_turn: 'End of turn', end_battle_round: 'End of battle round' };
const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function getPhaseProgressionAction(state) {
  if (state?.battle?.status !== 'active') return null;
  const phase = state.phase;
  if (phase === 'end_turn') {
    const next = state.players?.find(player => player.id !== state.activePlayer);
    return next ? { type: COMMAND_TYPES.END_TURN, payload: { nextActivePlayerId: next.id }, label: 'Finish turn · Continue to ' + (next.name ?? next.id) } : null;
  }
  if (phase === 'end_battle_round') return { type: COMMAND_TYPES.ADVANCE_BATTLE_ROUND, payload: {}, label: 'Begin Round ' + (state.battle.round + 1) };
  const next = TURN_STEPS[TURN_STEPS.indexOf(phase) + 1];
  if (!TURN_STEPS.includes(phase) || !next) return null;
  return { type: COMMAND_TYPES.CHANGE_PHASE, payload: { phase: next }, label: phase === 'start_turn' ? 'Begin Command phase' : phase === 'fight' ? 'End Fight · Review end of turn' : 'End ' + LABELS[phase] + ' · Continue to ' + LABELS[next] };
}

export function renderPhaseProgressionPanel(state, viewedPhase, message = '') {
  const action = getPhaseProgressionAction(state);
  if (!action) return '';
  const current = LABELS[state.phase] ?? state.phase;
  const viewingOther = viewedPhase !== state.phase;
  return '<style>.battle-phase-progress{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin:12px 0;padding:12px 16px;border:1px solid #80659c;border-radius:10px;background:#211b2a}.battle-phase-progress p{margin:4px 0}.battle-phase-progress button{min-height:48px;padding:10px 16px;border:1px solid #b99bdd;border-radius:8px;background:#41314f;color:#fff;font:inherit;font-weight:750;touch-action:manipulation}.battle-phase-progress [role=status]{flex-basis:100%}</style>' +
    '<section class="battle-phase-progress" aria-label="Advance the recorded game phase"><div><strong>Current phase: ' + escapeHtml(current) + '</strong><p>' +
    (viewingOther ? 'Return to the current phase to continue play.' : state.phase === 'end_turn' || state.phase === 'end_battle_round' ? 'Finish any scoring checks before continuing.' : 'Complete your tabletop actions, then end this phase.') + '</p></div>' +
    '<button type="button" ' + (viewingOther ? 'data-return-current-phase' : 'data-advance-game-phase') + '>' + escapeHtml(viewingOther ? 'Return to current phase · ' + current : action.label) + '</button>' +
    (['movement','end_turn'].includes(state.phase) ? '<button type="button" data-open-scoring-checkpoint>Scoring check</button>' : '') +
    (message ? '<p role="status">' + escapeHtml(message) + '</p>' : '') + '</section>';
}
