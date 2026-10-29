import { COMMAND_TYPES } from '../commands/game-commands.js';
import { getTyranidDecisionReminders, TYRANID_DECISION_IDS } from '../rules/tyranid-decision-reminders.js';
import { tyranidDecisionContextKey } from './battle-decision-reminders-view.js';

export function createBattleDecisionReminderController(container, {
  session,
  onRender = () => {},
  onRefresh = () => {}
} = {}) {
  let battleShockMessage = '';
  let battleShockReminder = null;
  let observedBattleShockContextKey = null;
  let dismissedTyranidDecisionContextKey = null;
  let factionDecisionMessage = '';

  function getState() {
    return {
      battleShockMessage,
      battleShockReminder,
      dismissedTyranidDecisionContextKey,
      factionDecisionMessage
    };
  }

  function synchronize(state) {
    const phase = state?.phase ?? null;
    const playerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
    const contextKey = state?.battle?.status === 'active' && phase === 'command' && playerId
      ? [state.battle?.round ?? 0, state.turn ?? 0, playerId].join(':')
      : null;
    if (contextKey && contextKey !== observedBattleShockContextKey) {
      observedBattleShockContextKey = contextKey;
      battleShockReminder = {
        round: state.battle?.round ?? 0,
        turn: state.turn ?? 0,
        playerId
      };
    } else if (!contextKey) {
      observedBattleShockContextKey = null;
      battleShockReminder = null;
    }
    return getState();
  }

  function handleTyranidHyperAdaptationChoice(event) {
    const button = event.target?.closest?.('[data-faction-decision-choice]');
    if (!button || !container.contains(button)) return;
    const playerId = button.getAttribute('data-faction-player-id');
    const decisionId = button.getAttribute('data-faction-decision-id');
    const choice = button.getAttribute('data-faction-decision-choice');
    try {
      session.dispatch({
        type: COMMAND_TYPES.RECORD_FACTION_ABILITY_DECISION,
        payload: { playerId, decisionId, choice }
      });
      factionDecisionMessage = 'Hyper-adaptation choice recorded.';
    } catch (error) {
      factionDecisionMessage = error?.message ?? String(error);
    }
    const messageHost = container.querySelector?.('[data-faction-decision-message]');
    if (messageHost) messageHost.textContent = factionDecisionMessage;
    onRefresh();
  }

  function handleUseTyranidFactionAbility(event) {
    const button = event.target?.closest?.('[data-use-faction-decision]');
    if (!button || !container.contains(button)) return;
    const playerId = button.getAttribute('data-faction-player-id');
    const decisionId = button.getAttribute('data-use-faction-decision');
    try {
      session.dispatch({
        type: COMMAND_TYPES.RECORD_FACTION_ABILITY_DECISION,
        payload: { playerId, decisionId, choice: 'use' }
      });
      factionDecisionMessage = 'Shadow in the Warp recorded as used. Resolve the required Battle-shock tests at the table.';
    } catch (error) {
      factionDecisionMessage = error?.message ?? String(error);
    }
    const messageHost = container.querySelector?.('[data-faction-decision-message]');
    if (messageHost) messageHost.textContent = factionDecisionMessage;
    onRefresh();
  }

  function handleDismissTyranidFactionAbility(event) {
    const button = event.target?.closest?.('[data-dismiss-faction-decision]');
    if (!button || !container.contains(button)) return;
    const decisionId = button.getAttribute('data-dismiss-faction-decision');
    const playerId = button.getAttribute('data-faction-player-id');
    const state = session.getState();
    const decision = getTyranidDecisionReminders(state, playerId)
      .find(item => item.id === decisionId);
    if (decision?.id === TYRANID_DECISION_IDS.SHADOW_IN_THE_WARP) {
      dismissedTyranidDecisionContextKey = tyranidDecisionContextKey(decision, state);
    }
    onRefresh();
  }

  function handleBattleShockResult(event) {
    const button = event.target?.closest?.('[data-battle-shock-result]');
    if (!button || !container.contains(button)) return;
    const unitId = button.getAttribute('data-unit-id');
    const result = button.getAttribute('data-battle-shock-result');
    const eligibilityConfirmed = button.getAttribute('data-eligibility-confirmed') === 'true';
    try {
      session.dispatch({ type: COMMAND_TYPES.RECORD_BATTLE_SHOCK_TEST, payload: {
        unitId, result, eligibilityConfirmed
      }});
      battleShockMessage = 'Battle-shock result recorded for ' +
        (session.getState().units?.find(unit => unit.id === unitId)?.name ?? unitId) + '.';
    } catch (error) {
      battleShockMessage = error?.message ?? String(error);
    }
    onRender();
  }

  function handleDismissBattleShockReminder(event) {
    const button = event.target?.closest?.('[data-dismiss-battle-shock-reminder]');
    if (!button || !container.contains(button)) return;
    battleShockReminder = null;
    button.closest('.battle-shock-reminder__backdrop')?.remove();
  }

  const clickHandlers = [
    handleTyranidHyperAdaptationChoice,
    handleUseTyranidFactionAbility,
    handleDismissTyranidFactionAbility,
    handleBattleShockResult,
    handleDismissBattleShockReminder
  ];
  clickHandlers.forEach(handler => container.addEventListener?.('click', handler));

  return {
    getState,
    synchronize,
    destroy() {
      clickHandlers.forEach(handler => container.removeEventListener?.('click', handler));
    }
  };
}
