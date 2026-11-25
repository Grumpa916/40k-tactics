import { isManualScoringEnabled } from '../config/feature-flags.js';
import { scoreboardAdjustmentCommand } from './scoreboard-transactions.js';
import { secondaryCorrectionCommand } from './secondary-score-correction-control.js';
import { toggleSecondaryPlannerCard } from './secondary-planner-selection.js';
import { PHASES, SCREEN_FACTORIES } from './battle-screen-registry.js';
import { createPhaseUnitSelection } from './phase-unit-selection.js';
import { renderSelectedUnitStatePanel } from './selected-unit-state-panel.js';
import { createRulesReminderController } from './rules-reminder-panel.js';
import { createPrototypeWorkspace } from './prototype-workspace.js';
import { getScoringCheckpointReminder } from "../application/scoring-checkpoint-reminders.js";
import { refreshScoringCheckpointDialog } from "./scoring-checkpoint-dialog.js";
import { getPhaseProgressionAction, renderPhaseProgressionPanel, screenOwnsPhaseProgression } from "./phase-progression-panel.js";
import { getSecondaryMissionHistory, getSecondaryMissionMode, SECONDARY_MISSION_MODES, SECONDARY_MISSION_STATUS } from "../rules/secondary-mission-lifecycle.js";
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { mapObjectiveControlCommand, nextMapObjectiveControl, renderMapObjectiveControlPicker } from './map-objective-control-picker.js';
import { createBattlePersistencePanel } from "./battle-persistence-panel.js";
import { createSupabaseAuthPanel } from "./supabase-auth-panel.js";
import { createSupabaseBattleStore } from "../persistence/supabase-battle-store.js";
import { createSupabaseArmyRosterStore } from "../persistence/supabase-army-roster-store.js";
import { createArmyRosterPanel } from "./army-roster-panel.js";
import { createArmySelectionPanel } from "./army-selection-panel.js";
import { renderEventLogPanel, renderUnitStatusPanel, renderReferencePanel, renderArmyRosterOverlay } from "./battle-context-panels.js";
import { renderTurnClockPanel } from "./turn-clock-panel.js";
import { formatElapsedTime, getTurnClockElapsedMs, getTurnClockState } from "../state/turn-clock.js";
import { renderPersistentMissionSummary } from "./mission-summary-panel.js";
import { bindMissionReviewPanel } from "./mission-review-panel.js";
import { renderShell } from "./battle-shell-view.js";
import { renderDecisionReminderHost } from './battle-decision-reminders-view.js';
import { createBattleDecisionReminderController } from './battle-decision-reminder-controller.js';
import { evaluatePreGameReadiness } from "../rules/pre-game-readiness.js";
import {
  phaseLabel,
  renderScoreAdjustOverlay,
  renderStatusSummaryContent
} from "./battle-shell-scoreboard.js";
import { setupContinueLabel, setupTabLabel, setupScreenOwnsContinue } from "./setup-navigation-labels.js";
import { bindSecondaryPlanner, createSecondaryPlannerState } from "./secondary-planner-panel.js";
import { readAppTheme, saveAppTheme, nextAppTheme, applyAppThemeToShell } from './app-theme-preference.js';


function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

// Shared shell markup lives in battle-shell-view.js.
export function createBattleShell(container, {
  session,
  perspectivePlayerId = null,
  gameData = null,
  missionActions = [],
  missionDefinitions = [],
  secondaryMissionCatalog = [],
  screenFactories = SCREEN_FACTORIES,
  battleStore = null,
  supabaseClient = null,
  layoutMode = "tabletop",
  onRender = () => {}
} = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("A browser container element is required.");
  }
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function") {
    throw new TypeError("A game session is required.");
  }

  const unitSelection = createPhaseUnitSelection();
  let mountedPhase = null;
  let mountedScreen = null;
  let mountedPersistencePanel = null;
  let mountedAuthPanel = null;
  let mountedRosterPanel = null;
  let mountedArmySelectionPanel = null;
  let cloudStore = battleStore ?? (supabaseClient ? createSupabaseBattleStore(supabaseClient) : null);
  let showCloud = Boolean(supabaseClient || cloudStore);
  let cloudPanelsPending = false;
  let setupWorkspaceTab = "saves";
  let setupNavigationMessage = "";
  let phaseProgressionMessage = "";
  let viewedPhase = session.getState()?.phase === "complete" ? "review" : session.getState()?.phase ?? "command";
  let observedGamePhase = session.getState()?.phase ?? null;
  let scoringReminder = null;
  let scoringReviewCheckpoint = null;
  let scoringReviewActivePlayerId = null;
  let scoringReviewPlayerId = null;
  let reminderSequence = 0;
  let leftPanelCollapsed = true;
  let rightPanelCollapsed = false;
  let appTheme = readAppTheme();
  const prototypeWorkspace = createPrototypeWorkspace(container, { session, gameData });
  const rulesReminders = createRulesReminderController(container, {session, perspectivePlayerId});
  const decisionReminders = createBattleDecisionReminderController(container, {
    session,
    onRender: () => render(),
    onRefresh: () => refreshPersistentPanels()
  });
  let armyRosterPlayerId = null;
  let clockPanelOpen = false;
  let clockMessage = "";
  let clockTickInterval = null;
  let contextOpenStates = { "unit-status": true, "event-log": true, "older-events": false };
  let referenceOpenStates = { stratagems: true, "army-rules": false, detachments: false, terrain: false };
  let missionOpenStates = {};
  let missionReviewOpen = false;
  const secondaryPlanner = createSecondaryPlannerState();
  secondaryPlanner.linked = true;
  secondaryPlanner.held = [];
  function plannerPlayerId(state) {
    return state.activePlayer ?? state.battle?.activePlayerId ?? perspectivePlayerId ?? state.players?.[0]?.id ?? null;
  }
  function syncPlannerHand(state) {
    const playerId = plannerPlayerId(state);
    secondaryPlanner.held = playerId
      ? getSecondaryMissionHistory(state)
        .filter((item) => item.playerId === playerId && item.status === SECONDARY_MISSION_STATUS.ACTIVE)
        .map((item) => item.definitionId)
      : [];
  }
  function togglePlannerCard(definitionId) {
    toggleSecondaryPlannerCard({definitionId,session,secondaryPlanner,secondaryMissionCatalog,render,perspectivePlayerId});
  }
  const disposeSecondaryPlanner = bindSecondaryPlanner(container, secondaryPlanner, { onHoldToggle: togglePlannerCard });
  const disposeMissionReviewPanel = bindMissionReviewPanel(container, {
    open: missionReviewOpen,
    onOpenChange: value => { missionReviewOpen = value; }
  });
  let scoreAdjustPlayerId = null;
  let scoreAdjustCollapsed = false;
  let scoreAdjustMessage = "";
  let scoreAdjustKind = "both";

  function setSetupWorkspaceTab(tab) {
    if (!["army-builder", "army-selection", "saves", "pre-game", "mission-map", "battlefield", "deployment"].includes(tab)) return;
    setupWorkspaceTab = tab;
    if (cloudPanelsPending && viewedPhase === 'setup' && ['saves', 'army-builder', 'army-selection'].includes(tab)) {
      cloudPanelsPending = false;
      destroyMountedScreen();
      render();
      return;
    }
    setupNavigationMessage = "";
    container.querySelectorAll?.("[data-setup-workspace-tab]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-setup-workspace-tab") === tab));
    });
    container.querySelectorAll?.("[data-setup-workspace-panel]").forEach((panel) => {
      panel.hidden = panel.getAttribute("data-setup-workspace-panel") !== tab;
    });
    const workspace = container.querySelector?.("[data-battle-workspace]");
    if (workspace) workspace.hidden = tab === "army-builder" || tab === "army-selection" || tab === "saves";
    const label = container.querySelector?.("[data-setup-step-label]");
    if (label) label.textContent = setupTabLabel(tab);
    const status = container.querySelector?.("[data-setup-navigation-message]");
    if (status) status.textContent = "";
    const next = container.querySelector?.("[data-setup-workspace-continue]");
    if (next) next.textContent = setupContinueLabel(tab);
    const setupFooter = container.querySelector?.('.battle-shell__setup-bottom-nav');
    if (setupFooter) setupFooter.hidden = setupScreenOwnsContinue(tab) || tab === "army-builder";
    mountedScreen?.setTab?.(tab === "battlefield" ? "battlefield" : tab === "mission-map" ? "mission-map" : "pre-game");
  }

  function destroyMountedScreen() {
    if (mountedScreen?.destroy) mountedScreen.destroy();
    mountedScreen = null;
    mountedPhase = null;
  }

  function readOpenStates(element, selector, attribute) {
    const openStates = {};
    if (typeof element?.querySelectorAll !== "function") return openStates;
    element.querySelectorAll(selector).forEach((item) => {
      const key = item.getAttribute(attribute);
      if (key) openStates[key] = Boolean(item.open);
    });
    return openStates;
  }

  function refreshPersistentPanels() {
    const decisionState = decisionReminders.getState();
    const phaseHost = container.querySelector?.("[data-phase-progression-host]");
    if (phaseHost) phaseHost.innerHTML = renderPhaseProgressionPanel(session.getState(), viewedPhase, phaseProgressionMessage, screenOwnsPhaseProgression(session.getState(), viewedPhase, screenFactories));
    const state = session.getState();
    refreshScoringCheckpointDialog(container, state, scoringReminder, session);
    const decisionHost = container.querySelector?.("[data-decision-reminder-host]");
    if (decisionHost) {
      decisionHost.innerHTML = renderDecisionReminderHost(state, {
        perspectivePlayerId,
        battleShockReminder: decisionState.battleShockReminder,
        dismissedTyranidDecisionContextKey: decisionState.dismissedTyranidDecisionContextKey
      });
    }
    const summaryContainer = container.querySelector?.("[data-battle-status-summary]");
    if (summaryContainer) summaryContainer.innerHTML = renderStatusSummaryContent(state, viewedPhase, clockPanelOpen);
    const clockHost = container.querySelector?.("[data-turn-clock-panel-host]");
    if (clockHost) clockHost.innerHTML = renderTurnClockPanel(state, { open: clockPanelOpen, message: clockMessage });
    const scoreAdjustHost = container.querySelector?.("[data-score-adjust-host]");
    if (scoreAdjustHost) {
      const players = Array.isArray(state.players) ? state.players : [];
      scoreAdjustHost.innerHTML = renderScoreAdjustOverlay(state, players, scoreAdjustPlayerId, scoreAdjustCollapsed, scoreAdjustMessage, scoreAdjustKind);
    }
    refreshClockDisplay();
    ensureClockTicker();
    const statusContainer = container.querySelector?.("[data-battle-context-body]");
    if (statusContainer) {
      const openSections = readOpenStates(statusContainer, "details[data-context-key]", "data-context-key");
      contextOpenStates = { ...contextOpenStates, ...openSections };
      statusContainer.innerHTML = (decisionState.battleShockMessage
        ? '<p role="status" class="battle-context__message">' + escapeHtml(decisionState.battleShockMessage) + '</p>'
        : "") +
        renderUnitStatusPanel(state, { openSections }) +
        renderEventLogPanel(state, { openSections });
    }
    const missionSummaryHost = container.querySelector?.("[data-battle-mission-summary-host]");
    if (missionSummaryHost) {
      const openStates = readOpenStates(missionSummaryHost, "details[data-mission-summary-key]", "data-mission-summary-key");
      missionOpenStates = openStates;
      missionSummaryHost.innerHTML = renderPersistentMissionSummary(state, {
        perspectivePlayerId, missionDefinitions, openStates
      });
    }
    const selectedStateHost = container.querySelector?.("[data-selected-unit-state-host]");
    if (selectedStateHost) selectedStateHost.innerHTML = renderSelectedUnitStatePanel(state, unitSelection.get(state), { perspectivePlayerId });
    const referenceContainer = container.querySelector?.("[data-battle-reference-content]");
    if (referenceContainer) {
      const openSections = readOpenStates(referenceContainer, "details[data-reference-key]", "data-reference-key");
      referenceOpenStates = { ...referenceOpenStates, ...openSections };
      referenceContainer.innerHTML = renderReferencePanel(state, gameData ?? {}, perspectivePlayerId, { openSections });
    }
    const overlay = container.querySelector?.("[data-army-roster-overlay]");
    if (overlay && armyRosterPlayerId && !overlay.hidden) {
      overlay.innerHTML = renderArmyRosterOverlay(state, armyRosterPlayerId, gameData ?? {});
    }
    prototypeWorkspace.refresh();
  }

  function refreshClockDisplay() {
    const state = session.getState();
    container.querySelectorAll?.("[data-clock-player-elapsed]").forEach((element) => {
      const playerId = element.getAttribute("data-clock-player-elapsed");
      element.textContent = formatElapsedTime(getTurnClockElapsedMs(state, playerId));
    });
    const clock = getTurnClockState(state);
    const playerId = clock.activePlayerId ?? state.activePlayer ?? state.battle?.activePlayerId ?? null;
    const headerTime = container.querySelector?.("[data-turn-clock-header-time]");
    if (headerTime) headerTime.textContent = playerId
      ? formatElapsedTime(getTurnClockElapsedMs(state, playerId))
      : "--:--";
  }

  function ensureClockTicker() {
    const running = getTurnClockState(session.getState()).running;
    const shouldTick = running || clockPanelOpen;
    if (shouldTick && clockTickInterval == null) {
      clockTickInterval = setInterval(refreshClockDisplay, 1000);
      clockTickInterval?.unref?.();
    } else if (!shouldTick && clockTickInterval != null) {
      clearInterval(clockTickInterval);
      clockTickInterval = null;
    }
  }

  function render() {
    const state = session.getState();
    syncPlannerHand(state);
    const actualPhase = state?.phase ?? null;
    const decisionState = decisionReminders.synchronize(state);
    if (actualPhase !== observedGamePhase) {
      const previousPhase = observedGamePhase;
      observedGamePhase = actualPhase;
      viewedPhase = actualPhase === "complete" ? "review" : actualPhase;
      if (actualPhase === "command") rightPanelCollapsed = false;
      scoringReviewCheckpoint = null;
      scoringReviewActivePlayerId = null;
      scoringReviewPlayerId = null;
      scoreAdjustPlayerId = null;
      scoreAdjustCollapsed = false;
      scoreAdjustMessage = "";
      const nextReminder = isManualScoringEnabled()
        ? getScoringCheckpointReminder(state, {previousPhase, missionDefinitions, perspectivePlayerId})
        : null;
      if (nextReminder) scoringReminder = {...nextReminder, id:++reminderSequence};
      else scoringReminder = null;
    }

    if (viewedPhase !== mountedPhase) {
      contextOpenStates = {
        ...contextOpenStates,
        ...readOpenStates(container.querySelector?.("[data-battle-context-body]"),
          "details[data-context-key]", "data-context-key")
      };
      referenceOpenStates = {
        ...referenceOpenStates,
        ...readOpenStates(container.querySelector?.("[data-battle-reference-body]"),
          "details[data-reference-key]", "data-reference-key")
      };
      missionOpenStates = {
        ...missionOpenStates,
        ...readOpenStates(container.querySelector?.("[data-battle-mission-summary-host]"),
          "details[data-mission-summary-key]", "data-mission-summary-key")
      };
      destroyMountedScreen();
      mountedPersistencePanel?.destroy();
      mountedPersistencePanel = null;
      mountedAuthPanel?.destroy();
      mountedAuthPanel = null;
      mountedRosterPanel?.destroy();
      mountedRosterPanel = null;
      renderShell(container, state, viewedPhase, scoringReminder, showCloud, {
        gameData, perspectivePlayerId, leftPanelCollapsed, rightPanelCollapsed, armyRosterPlayerId, clockPanelOpen, clockMessage, missionDefinitions, battleShockReminder: decisionState.battleShockReminder, scoringReviewCheckpoint, dismissedTyranidDecisionContextKey: decisionState.dismissedTyranidDecisionContextKey, factionDecisionMessage: decisionState.factionDecisionMessage, contextOpenStates, referenceOpenStates, missionOpenStates, missionReviewOpen, setupWorkspaceTab, setupNavigationMessage, layoutMode, phaseProgressionOwned: screenOwnsPhaseProgression(state, viewedPhase, screenFactories), scoreAdjustPlayerId, scoreAdjustCollapsed, scoreAdjustMessage, scoreAdjustKind, selectedUnitId: unitSelection.get(state), appTheme, secondaryPlanner
      });
      if (viewedPhase === 'setup') cloudPanelsPending = false;

      const persistenceContainer = container.querySelector("[data-battle-persistence-panel]");
      const rosterContainer = container.querySelector("[data-army-roster-panel]");
      const selectionContainer = container.querySelector("[data-army-selection-panel]");
      const rosterStore = supabaseClient ? createSupabaseArmyRosterStore(supabaseClient) : null;
      const mountPersistenceForUser = (user) => {
        mountedPersistencePanel?.destroy();
        mountedPersistencePanel = null;
        mountedRosterPanel?.destroy();
        mountedRosterPanel = null;
        mountedArmySelectionPanel?.destroy();
        mountedArmySelectionPanel = null;
        if (user && cloudStore && persistenceContainer) {
          mountedPersistencePanel = createBattlePersistencePanel(persistenceContainer, { session, store: cloudStore });
        }
        if (user && rosterStore && rosterContainer) {
          mountedRosterPanel = createArmyRosterPanel(rosterContainer, {
            store: rosterStore,
            players: [],
            canApply: false
          });
        } else if (rosterContainer) {
          rosterContainer.innerHTML = "<p>Sign in to create and reuse saved army rosters. Roster storage uses the same account as cloud battle saves.</p>";
        }
        if (user && rosterStore && selectionContainer) {
          mountedArmySelectionPanel = createArmySelectionPanel(selectionContainer, {
            store: rosterStore,
            session,
            canApply: true
          });
        } else if (selectionContainer) {
          selectionContainer.innerHTML = "<p>Sign in to select saved army lists for this battle.</p>";
        }
      };
      if (supabaseClient) {
        const authContainer = container.querySelector("[data-supabase-auth-panel]");
        if (authContainer) mountedAuthPanel = createSupabaseAuthPanel(authContainer, {
          client: supabaseClient, onAuthChange: mountPersistenceForUser
        });
      } else if (cloudStore && persistenceContainer) {
        mountedPersistencePanel = createBattlePersistencePanel(persistenceContainer, { session, store: cloudStore });
        if (rosterContainer) rosterContainer.innerHTML = "<p>Army roster management requires the signed-in Supabase account.</p>";
        if (selectionContainer) selectionContainer.innerHTML = "<p>Army selection requires the signed-in Supabase account.</p>";
      }

      const screenContainer = container.querySelector("[data-battle-screen]");
      const factory = screenFactories[viewedPhase];

      if (factory && screenContainer) {
        mountedScreen = factory(screenContainer, {
          session,
          perspectivePlayerId,
          gameData,
          missionActions,
          missionDefinitions,
          secondaryMissionCatalog,
          scoringCheckpoint: scoringReviewCheckpoint,
          scoringCheckpointActivePlayerId: scoringReviewActivePlayerId,
          scoringCheckpointPlayerId: scoringReviewPlayerId,
          setupTab: setupWorkspaceTab,
          layoutMode,
          unitSelection
        });
        mountedPhase = viewedPhase;
      } else if (screenContainer) {
        screenContainer.innerHTML = `<div class="battle-shell__placeholder">
          <h2>${phaseLabel(viewedPhase)} Phase</h2>
          <p>This phase is reserved in the shared battle flow and will be added later.</p>
        </div>`;
        mountedPhase = viewedPhase;
      }
    }

    refreshPersistentPanels();
    rulesReminders.refresh();
    onRender();
    return state;
  }

  function handleScoreAdjust(event) {
    const open = event.target?.closest?.("[data-open-score-adjust]");
    if (open && container.contains(open)) {
      event.preventDefault?.(); event.stopPropagation?.();
      const kind = open.getAttribute("data-open-score-adjust-kind") || "both";
      if (!isManualScoringEnabled() && kind === "vp") return;
      scoreAdjustPlayerId = open.getAttribute("data-open-score-adjust"); scoreAdjustKind = kind; scoreAdjustCollapsed = false; scoreAdjustMessage = ""; render(); return;
    }
    const collapse = event.target?.closest?.("[data-toggle-score-adjust-collapse]");
    if (collapse && container.contains(collapse) && scoreAdjustPlayerId) {
      event.preventDefault?.(); event.stopPropagation?.();
      scoreAdjustCollapsed = !scoreAdjustCollapsed; render(); return;
    }
    const close = event.target?.closest?.("[data-close-score-adjust]");
    const backdrop = event.target?.closest?.("[data-score-adjust-backdrop]");
    if (close || (backdrop && event.target === backdrop)) {
      event.preventDefault?.(); event.stopPropagation?.();
      scoreAdjustPlayerId = null; scoreAdjustKind = "both"; scoreAdjustCollapsed = false; scoreAdjustMessage = ""; render(); return;
    }
    const secondaryCorrection = event.target?.closest?.("[data-correct-secondary-score]");
    if (secondaryCorrection && container.contains(secondaryCorrection) && scoreAdjustPlayerId) {
      event.preventDefault?.(); event.stopPropagation?.();
      try {
        const round=Number(container.querySelector('[data-score-secondary-round]')?.value);
        session.dispatch(secondaryCorrectionCommand(container,scoreAdjustPlayerId));
        scoreAdjustMessage='Secondary score corrected for round '+round+'.';
      } catch(error) { scoreAdjustMessage=error?.message??String(error); }
      render(); return;
    }
    const adjust = event.target?.closest?.("[data-score-adjust-kind]");
    if (!adjust || !container.contains(adjust) || !scoreAdjustPlayerId) return;
    event.preventDefault?.(); event.stopPropagation?.();
    const state = session.getState();
    const amount = Number(adjust.getAttribute("data-score-adjust-amount"));
    const kind = adjust.getAttribute("data-score-adjust-kind");
    if (!Number.isInteger(amount) || !["vp","cp"].includes(kind)) return;
    try {
      const reason = container.querySelector?.('[data-score-reason="' + kind + '"]')?.value ?? 'adjustment';
      session.dispatch(scoreboardAdjustmentCommand(state, { playerId: scoreAdjustPlayerId, amount, kind, reason }));
      scoreAdjustMessage = (amount > 0 ? "+" : "") + amount + " " + kind.toUpperCase() + " recorded.";
    } catch (error) {
      scoreAdjustMessage = error?.message ?? String(error);
    }
    render();
  }

  function handleMapObjectiveToggle(event) {
    const state = session.getState();
    const option = event.target?.closest?.('[data-map-objective-control-choice]');
    if (option && container.contains(option)) {
      const picker = option.closest?.('[data-map-objective-picker]');
      const objectiveId = picker?.getAttribute('data-objective-id');
      if (!picker || !objectiveId || state.battle?.status !== 'active') return;
      try {
        session.dispatch(mapObjectiveControlCommand(state, {
          objectiveId, choice: option.getAttribute('data-map-objective-control-choice'), perspectivePlayerId
        }));
        picker.hidden = true;
        render();
      } catch (error) {
        const message = picker.querySelector?.('[data-map-objective-control-error]');
        if (message) message.textContent = error?.message ?? String(error);
        else console.error(error);
      }
      return;
    }
    const close = event.target?.closest?.('[data-map-objective-control-close]');
    if (close && container.contains(close)) {
      const picker = close.closest?.('[data-map-objective-picker]');
      if (picker) picker.hidden = true;
      return;
    }
    const marker = event.target?.closest?.('[data-map-objective-id]');
    if (!marker || !container.contains(marker)) {
      if (!event.target?.closest?.('[data-map-objective-picker]')) {
        const picker = container.querySelector?.('[data-map-objective-picker]');
        if (picker) picker.hidden = true;
      }
      return;
    }
    if (state.battle?.status !== 'active') return;
    const objectiveId = marker.getAttribute('data-map-objective-id');
    const objective = (state.objectives ?? []).find(item => item?.id === objectiveId);
    if (!objective) return;
    const topDown = marker.closest?.('.live-map.is-top-down');
    const picker = topDown?.querySelector?.('[data-map-objective-picker]');
    if (picker) {
      picker.setAttribute('data-objective-id', objectiveId);
      picker.innerHTML = renderMapObjectiveControlPicker(state, {
        objectiveId, label: marker.textContent?.trim() || objective.name || objectiveId,
        perspectivePlayerId
      });
      picker.hidden = false;
      return;
    }
    // Retain the compact single-tap cycle in the standard map.
    const next = nextMapObjectiveControl(state, objectiveId, perspectivePlayerId);
    if (!next) return;
    try {
      session.dispatch(mapObjectiveControlCommand(state, { objectiveId, choice: next, perspectivePlayerId }));
      render();
    } catch (error) { console.error(error); }
  }

  function handleMissionSummaryToggle(event) {
    const primaryWindow = event.target?.closest?.('.battle-mission-summary__section[data-mission-summary-key="mission-section-primary"]');
    const summary = event.target?.closest?.(".battle-mission-summary__section > summary");
    const details = primaryWindow && !event.target?.closest?.('.battle-mission-summary__section-content')
      ? primaryWindow
      : summary?.parentElement;
    if (!details || !container.contains(details)) return;
    const key = details.getAttribute?.("data-mission-summary-key");
    if (!key) return;
    event.preventDefault?.();
    details.open = !details.open;
    missionOpenStates = { ...missionOpenStates, [key]: details.open };
  }

  function handleToggleTurnClock(event) {
    const button = event.target?.closest?.("[data-toggle-turn-clock]");
    if (!button || !container.contains(button)) return;
    clockPanelOpen = !clockPanelOpen;
    refreshPersistentPanels();
    ensureClockTicker();
  }

  function handleCloseTurnClock(event) {
    const button = event.target?.closest?.("[data-close-turn-clock]");
    if (!button || !container.contains(button)) return;
    clockPanelOpen = false;
    refreshPersistentPanels();
    ensureClockTicker();
  }

  function handleTurnClockAction(event) {
    const button = event.target?.closest?.("[data-turn-clock-action]");
    if (!button || !container.contains(button)) return;
    const action = button.getAttribute("data-turn-clock-action");
    try {
      session.dispatch({
        type: action === "pause" ? COMMAND_TYPES.PAUSE_TURN_CLOCK : COMMAND_TYPES.START_TURN_CLOCK,
        payload: { nowMs: Date.now() }
      });
      clockMessage = "";
    } catch (error) {
      clockMessage = error?.message ?? String(error);
    }
    refreshPersistentPanels();
    ensureClockTicker();
  }

  function openRightPanel() {
    rightPanelCollapsed = false;
    const workspace = container.querySelector?.("[data-battle-workspace]");
    workspace?.setAttribute?.("data-right-collapsed", "false");
    const button = container.querySelector?.('[data-toggle-battle-panel="right"]');
    button?.setAttribute?.("aria-expanded", "true");
    const label = button?.querySelector?.("[data-panel-toggle-label]");
    if (label) label.textContent = "Hide references ›";
  }

  function handleToggleBattlePanel(event) {
    const button = event.target?.closest?.("[data-toggle-battle-panel]");
    if (!button || !container.contains(button)) return;
    const side = button.getAttribute("data-toggle-battle-panel");
    if (side === "left") leftPanelCollapsed = !leftPanelCollapsed;
    else if (side === "right") rightPanelCollapsed = !rightPanelCollapsed;
    else return;
    const workspace = container.querySelector?.("[data-battle-workspace]");
    workspace?.setAttribute?.("data-left-collapsed", String(leftPanelCollapsed));
    workspace?.setAttribute?.("data-right-collapsed", String(rightPanelCollapsed));
    const collapsed = side === "left" ? leftPanelCollapsed : rightPanelCollapsed;
    button.setAttribute?.("aria-expanded", String(!collapsed));
    const label = button.querySelector?.("[data-panel-toggle-label]");
    if (label) {
      label.textContent = side === "left"
        ? (collapsed ? "› Show status" : "‹ Hide status")
        : (collapsed ? "Show references ‹" : "Hide references ›");
    }
  }

  function handleOpenArmyRoster(event) {
    const button = event.target?.closest?.("[data-open-army-roster]");
    if (!button || !container.contains(button)) return;
    const playerId = button.getAttribute("data-open-army-roster");
    if (!playerId) return;
    armyRosterPlayerId = playerId;
    const overlay = container.querySelector?.("[data-army-roster-overlay]");
    if (!overlay) return;
    overlay.innerHTML = renderArmyRosterOverlay(session.getState(), playerId, gameData ?? {});
    overlay.hidden = false;
  }

  function handleCloseArmyRoster(event) {
    const button = event.target?.closest?.("[data-close-army-roster]");
    const overlay = container.querySelector?.("[data-army-roster-overlay]");
    if (!overlay || overlay.hidden) return;
    if (!button && event.target !== overlay) return;
    armyRosterPlayerId = null;
    overlay.innerHTML = "";
    overlay.hidden = true;
  }

  function handleSubmit(event) {
    const punishmentForm = event.target?.closest?.("[data-punishment-condemnation-form]");
    if (punishmentForm && container.contains(punishmentForm)) {
      event.preventDefault();
      const state = session.getState();
      const playerId = punishmentForm.getAttribute("data-player-id") ?? state.activePlayer ?? state.battle?.activePlayerId;
      const formData = new FormData(punishmentForm);
      const unitIds = formData.getAll("condemned-unit").map(String);
      const tabletopEligibilityConfirmed = formData.get("tabletop-confirmed") === "yes";
      try {
        session.dispatch({ type: COMMAND_TYPES.RECORD_PUNISHMENT_CONDEMNATION, payload: {
          playerId, unitIds, tabletopEligibilityConfirmed
        }});
        phaseProgressionMessage = "Punishment condemned units recorded. You can begin the Command phase.";
        render();
      } catch (error) {
        punishmentForm.insertAdjacentHTML("beforebegin", '<p role="alert">' + escapeHtml(error?.message ?? error) + '</p>');
      }
      return;
    }
    const form = event.target?.closest?.("[data-tactical-discard-form]");
    if (!form || !container.contains(form)) return;
    event.preventDefault();
    const state = session.getState();
    const playerId = state.activePlayer ?? state.battle?.activePlayerId;
    const formData = new FormData(form);
    const instanceIds = formData.getAll("discard-instance").map(String);
    try {
      session.dispatch({ type: COMMAND_TYPES.DISCARD_TACTICAL_SECONDARIES_FOR_CP, payload: {
        playerId, instanceIds, round: state.battle?.round ?? 0, turn: state.turn ?? 0
      }});
      form.outerHTML = '<p role="status">Discard recorded. +1 CP added to the ledger.</p>';
    } catch (error) {
      form.insertAdjacentHTML("beforebegin", '<p role="alert">' + escapeHtml(error?.message ?? error) + '</p>');
    }
  }

  function handleDismissScoringReminder(event) {
    const button = event.target?.closest?.("[data-dismiss-scoring-reminder]");
    if (!button || !container.contains(button)) return;
    scoringReminder = null;
    render();
  }

  function handleReviewScoring(event) {
    const button = event.target?.closest?.("[data-review-scoring]");
    if (!button || !container.contains(button)) return;
    scoringReviewCheckpoint = button.getAttribute("data-scoring-checkpoint") ?? scoringReminder?.timing ?? null;
    scoringReviewActivePlayerId = scoringReminder?.activePlayerId ?? null;
    scoringReviewPlayerId = button.getAttribute("data-scoring-player") ?? scoringReminder?.scoringPlayerId ?? scoringReminder?.activePlayerId ?? null;
    scoringReminder = null;
    openRightPanel();
    viewedPhase = "command";
    render();
  }

  function handleSetupWorkspaceNavigation(event) {
    const tabButton = event.target?.closest?.("[data-setup-workspace-tab]");
    if (tabButton && container.contains(tabButton)) {
      const requestedTab = tabButton.getAttribute("data-setup-workspace-tab");
      if (requestedTab === "deployment") {
        setSetupWorkspaceTab("mission-map");
        const continueButton = container.querySelector?.("[data-setup-workspace-continue]");
        if (continueButton) handleSetupWorkspaceNavigation({ target: continueButton });
      } else {
        setSetupWorkspaceTab(requestedTab);
      }
      return;
    }
    const continueButton = event.target?.closest?.("[data-setup-workspace-continue]");
    if (!continueButton || !container.contains(continueButton)) return;
    if (["pre-game", "battlefield", "mission-map", "deployment"].includes(setupWorkspaceTab)) {
      container.querySelector?.("[data-prep-next]")?.click();
      return;
    }
    if (setupWorkspaceTab === "army-builder") {
      setSetupWorkspaceTab("army-selection");
      return;
    }
    const order = ["saves", "army-selection", "pre-game"];
    const index = order.indexOf(setupWorkspaceTab);
    setSetupWorkspaceTab(order[index + 1] ?? "deployment");
  }

  function handlePhaseProgression(event) {
    const checkpointButton = event.target?.closest?.("[data-open-scoring-checkpoint]");
    if (checkpointButton && container.contains(checkpointButton)) {
      if (!isManualScoringEnabled()) return;
      const state=session.getState();
      scoringReminder=getScoringCheckpointReminder(state,{previousPhase:state.phase === "movement" ? "command" : "fight",missionDefinitions,perspectivePlayerId});
      refreshPersistentPanels(); return;
    }
    const returnButton = event.target?.closest?.("[data-return-current-phase]");
    const advanceButton = event.target?.closest?.("[data-advance-game-phase]");
    const button = returnButton ?? advanceButton;
    if (!button || !container.contains(button)) return;
    const state = session.getState();
    phaseProgressionMessage = "";
    if (returnButton) {
      viewedPhase = state.phase;
      render();
      return;
    }
    if (viewedPhase !== state.phase) return;
    if (mountedScreen?.requestPhaseEnd) { mountedScreen.requestPhaseEnd(); return; }
    const action = getPhaseProgressionAction(state);
    if (!action || action.disabled || !action.type) return;
    try {
      session.dispatch({ type: action.type, payload: action.payload });
    } catch (error) {
      phaseProgressionMessage = error?.message ?? String(error);
    }
    render();
  }

  function handlePhaseNavigation(event) {
    const button = event.target?.closest?.("[data-battle-phase-button]");
    if (!button || !container.contains(button)) return;
    const nextPhase = button.getAttribute("data-battle-phase-button");
    if (nextPhase !== "setup" && nextPhase !== "review" && !PHASES.some((phase) => phase.id === nextPhase) &&
        !(nextPhase === "deployment" && session.getState()?.battle?.status === "deployment")) return;
    if (nextPhase !== "command") {
      scoringReviewCheckpoint = null;
      scoringReviewActivePlayerId = null;
      scoringReviewPlayerId = null;
    }
    if (nextPhase === "command") openRightPanel();
    viewedPhase = nextPhase;
    render();
  }

  function handleAppThemeToggle(event) {
    const button = event.target?.closest?.('[data-app-theme-toggle]');
    if (!button || !container.contains(button)) return;
    appTheme = saveAppTheme(nextAppTheme(appTheme));
    applyAppThemeToShell(container, appTheme);
    // The switch only changes presentation. Do not rerender the battle, clear
    // map selections, scroll the right panel, or dispatch a game command.
  }

  container.addEventListener?.("click", handleAppThemeToggle);
  container.addEventListener?.("click", handleMissionSummaryToggle);
  container.addEventListener?.("click", handleScoreAdjust);
  container.addEventListener?.("click", handleMapObjectiveToggle);
  container.addEventListener?.("click", handleSetupWorkspaceNavigation);
  container.addEventListener?.("click", handlePhaseNavigation);
  container.addEventListener?.("click", handlePhaseProgression);
  container.addEventListener?.("click", handleToggleTurnClock);
  container.addEventListener?.("click", handleCloseTurnClock);
  container.addEventListener?.("click", handleTurnClockAction);
  container.addEventListener?.("click", handleToggleBattlePanel);
  container.addEventListener?.("click", handleOpenArmyRoster);
  container.addEventListener?.("click", handleCloseArmyRoster);
  container.addEventListener?.("click", handleDismissScoringReminder);
  container.addEventListener?.("click", handleReviewScoring);
  container.addEventListener?.("submit", handleSubmit);
  const unsubscribeSelection = unitSelection.subscribe(() => refreshPersistentPanels());
  const unsubscribe = session.subscribe(render);
  render();

  return {
    getState: () => session.getState(),
    connectCloud(client) {
      supabaseClient = client;
      cloudStore = battleStore ?? createSupabaseBattleStore(client);
      showCloud = true;
      cloudPanelsPending = true;
      if (viewedPhase === 'setup' && setupWorkspaceTab === 'saves') {
        destroyMountedScreen();
        render();
      }
    },
    render,
    destroy: () => {
      unsubscribe();
      unsubscribeSelection();
      prototypeWorkspace.destroy();
      rulesReminders.destroy();
      if (clockTickInterval != null) clearInterval(clockTickInterval);
      clockTickInterval = null;
      container.removeEventListener?.("click", handleMissionSummaryToggle);
      disposeMissionReviewPanel();
      disposeSecondaryPlanner();
      container.removeEventListener?.("click", handleScoreAdjust);
      container.removeEventListener?.("click", handleMapObjectiveToggle);
      container.removeEventListener?.("click", handleSetupWorkspaceNavigation);
      container.removeEventListener?.("click", handlePhaseNavigation);
      container.removeEventListener?.("click", handlePhaseProgression);
      container.removeEventListener?.("click", handleToggleTurnClock);
      container.removeEventListener?.("click", handleCloseTurnClock);
      container.removeEventListener?.("click", handleTurnClockAction);
      container.removeEventListener?.("click", handleToggleBattlePanel);
      container.removeEventListener?.("click", handleOpenArmyRoster);
      container.removeEventListener?.("click", handleCloseArmyRoster);
      container.removeEventListener?.("click", handleDismissScoringReminder);
      decisionReminders.destroy();
      unitSelection.clear();
      container.removeEventListener?.("click", handleReviewScoring);
      container.removeEventListener?.("submit", handleSubmit);
      destroyMountedScreen();
      mountedPersistencePanel?.destroy();
      mountedPersistencePanel = null;
      mountedAuthPanel?.destroy();
      mountedAuthPanel = null;
      mountedRosterPanel?.destroy();
      mountedRosterPanel = null;
      container.replaceChildren();
    }
  };
}
