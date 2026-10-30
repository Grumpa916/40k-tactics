import { getSecondaryMissionHistory, getSecondaryMissionMode, SECONDARY_MISSION_STATUS } from './secondary-mission-lifecycle.js';
import { getPrimaryMissionDefinition } from '../data/primary-mission-catalog.js';
import { getCompleteSecondaryMissionById } from '../data/secondary-mission-complete-catalog.js';
import { getLocateAndDenyState } from './locate-and-deny-state.js';
import { getTriangulationState } from './triangulation-state.js';
import { getVitalLinkState } from './vital-link-state.js';

export const ACTION_REVIEW_TIMINGS = ['command-phase','end-of-turn','end-of-opponent-turn'];

const LOCATE_AND_DENY_ACTION = Object.freeze({
  id: 'sensor-sweep',
  name: 'Sensor Sweep',
  phase: 'shooting',
  reviewTiming: 'end-of-turn',
  summary: 'Once per turn, a qualifying unit within range of a central objective can remove one of your operation markers at end of turn if it controls that objective. This Action cannot start when only one marker remains.'
});

function getPrimaryMissionActionOption(state, playerId) {
  const players = state.players ?? [];
  const myPlayerId = players[0]?.id ?? null;
  const setup = state.battlefieldMap?.missionSetup;
  if (!playerId || !setup?.myDisposition || !setup?.opponentDisposition) return null;
  const ownDisposition = playerId === myPlayerId ? setup.myDisposition : setup.opponentDisposition;
  const opponentDisposition = playerId === myPlayerId ? setup.opponentDisposition : setup.myDisposition;
  const definition = getPrimaryMissionDefinition(ownDisposition, opponentDisposition);
  let action = definition?.action;
  if (definition?.id === 'primary-locate-and-deny') {
    const locate = getLocateAndDenyState(state, { playerId, perspectivePlayerId: myPlayerId ?? playerId });
    if (locate.setupComplete && !locate.sensorSweepAvailable) return null;
    action = LOCATE_AND_DENY_ACTION;
  }
  if (definition?.id === 'primary-triangulation') {
    const triangulation = getTriangulationState(state, { playerId, perspectivePlayerId: myPlayerId ?? playerId });
    if (!triangulation.actionAvailableThisTurn) return null;
  }
  if (definition?.id === 'primary-vital-link') {
    const vitalLink = getVitalLinkState(state, { playerId, perspectivePlayerId: myPlayerId ?? playerId });
    if (!vitalLink.actionAvailableThisTurn) return null;
  }
  if (!definition || !action || action.phase !== 'shooting') return null;
  const round = state.battle?.round ?? 0;
  if (Number.isInteger(action.minRound) && round < action.minRound) return null;
  const instanceId = `primary:${playerId}:${definition.id}`;
  return {
    id: instanceId,
    instanceId,
    definitionId: definition.id,
    name: `${definition.name} — ${action.name}`,
    missionName: definition.name,
    actionName: action.name,
    missionKind: 'primary',
    missionAction: action,
    knownShootingAction: true,
    actionSummary: action.summary ?? null,
    timings: [action.reviewTiming ?? 'end-of-turn'],
    notes: [action.summary],
    rulesVerified: definition.rulesVerified === true,
    fallbackTiming: action.reviewTiming ?? 'end-of-turn'
  };
}

export function getMissionActionOptions(state, playerId = state.activePlayer) {
  const mode = getSecondaryMissionMode(state, playerId);
  const secondary = getSecondaryMissionHistory(state, playerId).filter(item => item.status === SECONDARY_MISSION_STATUS.ACTIVE).map(item => {
    const windows = (item.definition.scoringWindows ?? []).filter(window => !window.modes?.length || window.modes.includes(mode));
    const complete = getCompleteSecondaryMissionById(item.definitionId);
    const missionAction = complete?.missionAction ?? null;
    return { id:item.instanceId, instanceId:item.instanceId, definitionId:item.definitionId, name:item.definition.name,
      missionKind:'secondary', missionAction, knownShootingAction:missionAction?.phase === 'shooting', actionSummary:missionAction?.summary ?? null,
      timings:[...new Set(windows.map(window=>window.timing).filter(t=>ACTION_REVIEW_TIMINGS.includes(t)))],
      notes:item.definition.referenceNotes ?? [], rulesVerified:item.definition.rulesVerified === true,
      fallbackTiming:ACTION_REVIEW_TIMINGS.includes(item.definition.timing) ? item.definition.timing : 'end-of-turn' };
  });
  const primary = getPrimaryMissionActionOption(state, playerId);
  return primary ? [primary, ...secondary] : secondary;
}

export function getMissionActionReviews(state, { playerId, checkpoint, round = state.battle?.round, turn = state.turn } = {}) {
  const reviewed = new Map((state.history ?? []).filter(e=>e.type==='mission_action.reviewed').map(e=>[e.payload.actionKey,e.payload]));
  return (state.history ?? []).filter(e=>e.type==='shooting.unit_activated' && e.payload?.missionInstanceId && e.payload?.actionCompletedImmediately!==true).map(e=>{
    const action=e.payload, key=[action.round,action.turn,action.unitId].join(':');
    const unit=state.units.find(u=>u.id===action.unitId);
    return { ...action, actionKey:key, unitName:unit?.name ?? action.unitId, unitStatus:unit?.status,
      review:reviewed.get(key) ?? null, objective:state.objectives?.find(o=>o.id===action.objectiveId) ?? null };
  }).filter(action=>action.playerId===playerId && action.reviewTiming===checkpoint &&
    (checkpoint==='end-of-opponent-turn' ? action.turn < turn : action.turn <= turn) && action.round<=round && (!action.review || action.review.turn===turn && action.review.round===round));
}
