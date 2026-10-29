import { UNIT_STATUS } from '../state/unit.js';
import { isUnitBattleShocked } from './unit-status-summary.js';
import { getUnitActivationPresentation } from './unit-activation-presentation.js';
import { getFightEngagementState } from './fight-engagement-state.js';
import { getFightCandidates } from './fight-candidates.js';

function currentTurnEvent(state, unitId, type, predicate = () => true) {
  const round = state?.battle?.round;
  const turn = state?.turn;
  return (state?.history ?? []).some(event =>
    event?.type === type &&
    event?.payload?.unitId === unitId &&
    (round == null || event?.payload?.round == null || event.payload.round === round) &&
    (turn == null || event?.payload?.turn == null || event.payload.turn === turn) &&
    predicate(event)
  );
}

function hasActiveMissionAction(state, unitId) {
  const action = [...(state?.history ?? [])].reverse().find(event =>
    event?.type === 'shooting.unit_activated' &&
    event?.payload?.unitId === unitId &&
    event?.payload?.missionInstanceId
  );
  if (!action) return false;
  const key = [action.payload?.round, action.payload?.turn, unitId].join(':');
  return !(state?.history ?? []).some(event =>
    event?.type === 'mission_action.reviewed' && event?.payload?.actionKey === key
  );
}

export function getSelectedUnitActiveStatuses(state = {}, unitId = null) {
  const unit = (state.units ?? []).find(item => item.id === unitId);
  if (!unit) return [];

  const statuses = [];
  if (unit.status === UNIT_STATUS.DESTROYED) statuses.push({ icon: '×', label: 'Destroyed' });
  if (unit.status === UNIT_STATUS.RESERVES) statuses.push({ icon: 'R', label: 'Reserves / Off battlefield' });
  if (isUnitBattleShocked(unit)) statuses.push({ icon: '!', label: 'Battle-shocked' });

  const engaged = getFightEngagementState(state).engagedUnitIds.includes(unit.id);
  if (engaged) statuses.push({ icon: '⚔', label: 'Engaged' });

  const chargedThisTurn = currentTurnEvent(state, unit.id, 'charge.outcome_recorded', event => event?.payload?.outcome === 'successful');
  if (chargedThisTurn) statuses.push({ icon: '↟', label: 'Charged this turn' });

  const fightCandidates = getFightCandidates(state);
  if (fightCandidates.fightsFirst.includes(unit.id)) statuses.push({ icon: 'FF', label: 'Fights First' });

  if (hasActiveMissionAction(state, unit.id)) statuses.push({ icon: '⌛', label: 'Action / Mission Action' });

  const activation = getUnitActivationPresentation(state, unit.id);
  if (activation === 'active') statuses.push({ icon: '…', label: 'Activation in progress' });
  if (activation === 'resolved') statuses.push({ icon: '✓', label: 'Activated / Resolved' });
  return statuses;
}
