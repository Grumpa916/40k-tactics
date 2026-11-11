import {
  getSecondaryMissionHistory,
  getSecondaryMissionMode,
  getPendingSecondaryMissionRuleReplacement,
  getPendingSecondaryMissionCardChoice,
  SECONDARY_MISSION_MODES,
  SECONDARY_MISSION_STATUS
} from './secondary-mission-lifecycle.js';

/**
 * Single source of truth for the Command-to-Movement transition guard.
 *
 * The same reason drives the engine's hard block and the iPad footer's
 * inactive/ready state; visual readiness can never contradict the rule gate.
 */
export function getCommandPhaseExitBlocker(state) {
  if (state?.phase !== 'command') return null;
  const playerId=state.activePlayer ?? state.battle?.activePlayerId;
  const pendingRedraw=state.scoring?.secondaryMissionRedrawPendingByPlayer?.[playerId];
  if (pendingRedraw && pendingRedraw.round === (state.battle?.round ?? 0) &&
      pendingRedraw.turn === (state.turn ?? 0)) {
    return 'Record the New Orders replacement card before leaving the Command phase.';
  }

  const pendingCardChoice=getPendingSecondaryMissionCardChoice(state,playerId);
  if (pendingCardChoice) {
    return 'Resolve the ' + pendingCardChoice.choiceType + ' choice before leaving the Command phase.';
  }

  const pendingRuleReplacement=getPendingSecondaryMissionRuleReplacement(state,playerId);
  if (pendingRuleReplacement) {
    return pendingRuleReplacement.stage === 'return'
      ? 'Return Defend Stronghold and draw its required replacement before leaving the Command phase.'
      : 'Record the replacement Tactical card before leaving the Command phase.';
  }

  if (getSecondaryMissionMode(state,playerId) === SECONDARY_MISSION_MODES.TACTICAL) {
    const activeCards=getSecondaryMissionHistory(state,playerId).filter(card =>
      card.status === SECONDARY_MISSION_STATUS.ACTIVE);
    if (activeCards.length < 2) {
      return 'Record two active Tactical secondary cards for the active player before leaving the Command phase.';
    }
  }
  return null;
}
