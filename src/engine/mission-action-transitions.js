import { appendHistoryEntry } from '../state/history.js';
import { createEvent } from '../events/event.js';
import { getMissionActionReviews } from '../rules/mission-action-state.js';
export function reviewMissionAction(state, { actionKey, playerId, checkpoint, outcome } = {}) {
  if (state.battle?.status!=='active') throw new Error('An active battle is required.');
  if (!['completed','failed'].includes(outcome)) throw new Error('Confirm completed or failed.');
  const active=state.activePlayer ?? state.battle.activePlayerId;
  const inWindow=checkpoint==='command-phase' ? state.phase==='movement' && active===playerId
    : state.phase==='end_turn' && (checkpoint==='end-of-turn' ? active===playerId : checkpoint==='end-of-opponent-turn' && active!==playerId);
  if (!inWindow) throw new Error('Review this action at its recorded scoring checkpoint.');
  const action=getMissionActionReviews(state,{playerId,checkpoint}).find(item=>item.actionKey===actionKey);
  if (!action) throw new Error('A linked mission action for this checkpoint is required.');
  if (action.review) throw new Error('This action has already been reviewed.');
  return appendHistoryEntry(state,createEvent('mission_action.reviewed',{actionKey,playerId,checkpoint,outcome,
    missionInstanceId:action.missionInstanceId, round:state.battle.round,turn:state.turn}));
}
