import { getSecondaryMissionHistory, getSecondaryMissionMode, SECONDARY_MISSION_STATUS } from './secondary-mission-lifecycle.js';
export const ACTION_REVIEW_TIMINGS = ['command-phase','end-of-turn','end-of-opponent-turn'];
export function getMissionActionOptions(state, playerId = state.activePlayer) {
  const mode = getSecondaryMissionMode(state, playerId);
  return getSecondaryMissionHistory(state, playerId).filter(item => item.status === SECONDARY_MISSION_STATUS.ACTIVE).map(item => {
    const windows = (item.definition.scoringWindows ?? []).filter(window => !window.modes?.length || window.modes.includes(mode));
    return { id:item.instanceId, instanceId:item.instanceId, definitionId:item.definitionId, name:item.definition.name,
      timings:[...new Set(windows.map(window=>window.timing).filter(t=>ACTION_REVIEW_TIMINGS.includes(t)))],
      notes:item.definition.referenceNotes ?? [], rulesVerified:item.definition.rulesVerified === true,
      fallbackTiming:ACTION_REVIEW_TIMINGS.includes(item.definition.timing) ? item.definition.timing : 'end-of-turn' };
  });
}
export function getMissionActionReviews(state, { playerId, checkpoint, round = state.battle?.round, turn = state.turn } = {}) {
  const reviewed = new Map((state.history ?? []).filter(e=>e.type==='mission_action.reviewed').map(e=>[e.payload.actionKey,e.payload]));
  return (state.history ?? []).filter(e=>e.type==='shooting.unit_activated' && e.payload?.missionInstanceId).map(e=>{
    const action=e.payload, key=[action.round,action.turn,action.unitId].join(':');
    const unit=state.units.find(u=>u.id===action.unitId);
    return { ...action, actionKey:key, unitName:unit?.name ?? action.unitId, unitStatus:unit?.status,
      review:reviewed.get(key) ?? null, objective:state.objectives?.find(o=>o.id===action.objectiveId) ?? null };
  }).filter(action=>action.playerId===playerId && action.reviewTiming===checkpoint &&
    (checkpoint==='end-of-opponent-turn' ? action.turn < turn : action.turn <= turn) && action.round<=round && (!action.review || action.review.turn===turn && action.review.round===round));
}
