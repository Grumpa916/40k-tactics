import { createEndgameReviewScreen } from './endgame-review-screen.js';
import { createPrototypeWorkspace, renderPrototypeWorkspaceTools } from './prototype-workspace.js';
import { getScoringCheckpointReminder } from "../application/scoring-checkpoint-reminders.js";
import { renderScoringCheckpointDialog, refreshScoringCheckpointDialog } from "./scoring-checkpoint-dialog.js";
import { getPhaseProgressionAction, renderPhaseProgressionPanel } from "./phase-progression-panel.js";
import { getSecondaryMissionHistory, getSecondaryMissionMode, SECONDARY_MISSION_MODES, SECONDARY_MISSION_STATUS } from "../rules/secondary-mission-lifecycle.js";
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { createChargeScreen } from "./charge-screen.js";
import { createCommandScreen } from "./command-screen.js";
import { createEventPreparationScreen as createBattleSetupScreen } from "./event-preparation-screen.js";
import { createEventPreparationScreen as createDeploymentScreen } from "./event-preparation-screen.js";
import { createFightScreen } from "./fight-screen.js";
import { createMovementScreen } from "./movement-screen.js";
import { createBattlePersistencePanel } from "./battle-persistence-panel.js";
import { createSupabaseAuthPanel } from "./supabase-auth-panel.js";
import { createSupabaseBattleStore } from "../persistence/supabase-battle-store.js";
import { createSupabaseArmyRosterStore } from "../persistence/supabase-army-roster-store.js";
import { createArmyRosterPanel } from "./army-roster-panel.js";
import { createArmySelectionPanel } from "./army-selection-panel.js";
import { createShootingScreen } from "./shooting-screen.js";
import { renderEventLogPanel, renderUnitStatusPanel, renderReferencePanel, renderArmyRosterOverlay } from "./battle-context-panels.js";
import { renderTurnClockPanel } from "./turn-clock-panel.js";
import { formatElapsedTime, getTurnClockElapsedMs, getTurnClockState } from "../state/turn-clock.js";
import { renderPersistentMissionSummary } from "./mission-summary-panel.js";
import { bindMissionReviewPanel, renderMissionReviewPanel, renderMissionReviewToggle } from "./mission-review-panel.js";
import { renderDecisionReminderHost, tyranidDecisionContextKey } from './battle-decision-reminders-view.js';
import { getTyranidDecisionReminders, TYRANID_DECISION_IDS } from "../rules/tyranid-decision-reminders.js";
import { evaluatePreGameReadiness } from "../rules/pre-game-readiness.js";
import {
  phaseLabel,
  renderScoreAdjustOverlay,
  renderScoreAdjustStyles,
  renderStatusSummaryContent
} from "./battle-shell-scoreboard.js";
import { setupContinueLabel, setupTabLabel } from "./setup-navigation-labels.js";

const PHASES = Object.freeze([
  { id: "command", label: "Command", status: "live" },
  { id: "movement", label: "Movement", status: "live" },
  { id: "shooting", label: "Shooting", status: "live" },
  { id: "charge", label: "Charge", status: "live" },
  { id: "fight", label: "Fight", status: "live" }
]);

const SCREEN_FACTORIES = Object.freeze({
  setup: createBattleSetupScreen,
  deployment: createDeploymentScreen,
  command: createCommandScreen,
  movement: createMovementScreen,
  shooting: createShootingScreen,
  charge: createChargeScreen,
  fight: createFightScreen,
  review: createEndgameReviewScreen
});

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function renderShell(container, state, viewedPhase, scoringReminder = null, showCloud = false, {
  gameData = null,
  perspectivePlayerId = null,
  leftPanelCollapsed = true,
  rightPanelCollapsed = false,
  armyRosterPlayerId = null,
  clockPanelOpen = false,
  clockMessage = "",
  missionDefinitions = [],
  battleShockReminder = null,
  scoringReviewCheckpoint = null,
  dismissedTyranidDecisionContextKey = null,
  factionDecisionMessage = "",
  contextOpenStates = { "unit-status": true, "event-log": true },
  referenceOpenStates = { stratagems: true },
  missionOpenStates = {},
  missionReviewOpen = false,
  setupWorkspaceTab = "saves",
  setupNavigationMessage = "",
  layoutMode = "tabletop",
  scoreAdjustPlayerId = null,
  scoreAdjustCollapsed = false,
  scoreAdjustMessage = "",
  scoreAdjustKind = "both"
} = {}) {
  const setupTab = { id: "setup", label: "Setup & Saves", status: "live" };
  const visiblePhases = [setupTab, ...(state.battle?.status === "deployment"
    ? [{ id: "deployment", label: "Deployment", status: "live" }, ...PHASES]
    : PHASES), { id: "review", label: "Game review", status: "live" }];
  const phaseItems = visiblePhases.map((phase) => {
    const active = phase.id === viewedPhase ? " is-active" : "";
    const status = phase.status === "live" ? "Ready" : "Planned";
    return '<li class="battle-phase' + active + '">' +
      '<button type="button" class="battle-phase__button" data-battle-phase-button="' + phase.id +
      '" aria-pressed="' + String(phase.id === viewedPhase) + '">' +
      '<strong>' + phase.label + '</strong><span>' +
      (phase.id === "setup" ? "Pre-game & cloud saves" : status) +
      '</span></button></li>';
  }).join("") + renderMissionReviewToggle({
    visible: PHASES.some(phase => phase.id === viewedPhase),
    open: missionReviewOpen
  });

  const statusSummary = '<section class="battle-shell__status-summary" data-battle-status-summary aria-label="Persistent score and Command Points">' +
    renderStatusSummaryContent(state, viewedPhase, clockPanelOpen) + '</section>';
  const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  const players = Array.isArray(state.players) ? state.players : [];
  const clockPanel = '<div data-turn-clock-panel-host>' +
    renderTurnClockPanel(state, { open: clockPanelOpen, message: clockMessage }) + '</div>';

  const decisionReminderMarkup = !scoringReminder && !scoringReviewCheckpoint
    ? renderDecisionReminderHost(state, {
        perspectivePlayerId,
        battleShockReminder,
        dismissedTyranidDecisionContextKey
      })
    : "";
  const reminderMarkup = '<div data-scoring-reminder-host>' + renderScoringCheckpointDialog(state, scoringReminder) + '</div>';

  const yourPlayerId = perspectivePlayerId ?? activePlayerId ?? players[0]?.id ?? null;
  const opponentPlayerId = players.find((player) => player.id !== yourPlayerId)?.id ?? null;
  const myName = players.find((player) => player.id === yourPlayerId)?.name ?? "My Army";
  const opponentName = players.find((player) => player.id === opponentPlayerId)?.name ?? "Opponent Army";
  const leftToggle = '<button type="button" class="battle-shell__panel-toggle" data-toggle-battle-panel="left" ' +
    'aria-controls="battle-left-panel-body" aria-expanded="' + String(!leftPanelCollapsed) + '">' +
    '<span data-panel-toggle-label>' + (leftPanelCollapsed ? '› Show status' : '‹ Hide status') + '</span></button>';
  const rightToggle = '<button type="button" class="battle-shell__panel-toggle" data-toggle-battle-panel="right" ' +
    'aria-controls="battle-right-panel-body" aria-expanded="' + String(!rightPanelCollapsed) + '">' +
    '<span data-panel-toggle-label>' + (rightPanelCollapsed ? 'Show references ‹' : 'Hide references ›') + '</span></button>';
  const isSetupView = viewedPhase === "setup";
  const isReviewView = viewedPhase === "review";
  const isScrollablePreparationView = viewedPhase === "deployment";
  const isScrollableLiveView = ["command", "movement", "charge", "fight"].includes(viewedPhase);
  const tabletopExperiment = layoutMode === "tabletop" && !isSetupView && !isReviewView;
  const persistentMissionSummary = renderPersistentMissionSummary(state, { perspectivePlayerId, missionDefinitions, openStates: missionOpenStates });
  const layoutSwitch = "";
  const workspace = '<section class="battle-shell__workspace' + (isSetupView ? ' is-setup-view' : '') + '" data-battle-workspace' +
    (viewedPhase === "setup" && (setupWorkspaceTab === "army-builder" || setupWorkspaceTab === "army-selection" || setupWorkspaceTab === "saves") ? ' hidden' : '') +
    ' data-left-collapsed="' + String(leftPanelCollapsed) + '" data-right-collapsed="' + String(rightPanelCollapsed) + '">' +
    '<aside class="battle-shell__side-panel battle-shell__side-panel--left" data-battle-side-panel="left"' + (isSetupView ? ' hidden' : '') + '>' +
    leftToggle + '<div id="battle-left-panel-body" class="battle-shell__panel-body" data-battle-context-body>' +
    renderUnitStatusPanel(state, { openSections: contextOpenStates }) + renderEventLogPanel(state, { openSections: contextOpenStates }) + '</div></aside>' +
    '<section class="battle-shell__content">' +
    '<section data-battle-screen></section>' +
    '</section>' +
    '<aside class="battle-shell__side-panel battle-shell__side-panel--right" data-battle-side-panel="right"' + (isSetupView ? ' hidden' : '') + '>' +
    rightToggle + '<div id="battle-right-panel-body" class="battle-shell__panel-body" data-battle-reference-body>' +
    renderReferencePanel(state, gameData ?? {}, perspectivePlayerId, { openSections: referenceOpenStates }) + '</div></aside></section>';
  const scoreAdjustOverlay = '<div data-score-adjust-host>' + renderScoreAdjustOverlay(state, players, scoreAdjustPlayerId, scoreAdjustCollapsed, scoreAdjustMessage, scoreAdjustKind) + '</div>';
  const armyOverlay = '<div class="battle-shell__army-overlay" data-army-roster-overlay' +
    (armyRosterPlayerId ? "" : " hidden") + '>' +
    (armyRosterPlayerId ? renderArmyRosterOverlay(state, armyRosterPlayerId, gameData ?? {}) : "") + '</div>';
  const shellLiveHeader = tabletopExperiment
    ? '<header class="battle-shell__tabletop-header">' +
      '<div class="battle-shell__tabletop-topline">' + statusSummary + '</div>' +
      '<ol class="battle-shell__phases" aria-label="Battle phase navigation">' + phaseItems + '</ol>' +
      layoutSwitch + '</header>'
    : '<ol class="battle-shell__phases" aria-label="Battle phase navigation">' + phaseItems + '</ol>' +
      statusSummary + layoutSwitch;

  const missionReviewMarkup = renderMissionReviewPanel(persistentMissionSummary, { open: missionReviewOpen });
  container.innerHTML = '<main class="battle-shell' + (isReviewView ? ' is-review-view' : '') + (tabletopExperiment ? ' is-tabletop-experiment' : '') + (state.preparation?.mode === 'combined' && state.battle?.status === 'deployment' ? ' is-deploy-begin' : '') + ((isScrollablePreparationView || isScrollableLiveView) ? ' is-scrollable-preparation' : '') + '">' + reminderMarkup +
    '<div data-decision-reminder-host>' + decisionReminderMarkup + '</div>' +
    shellLiveHeader + missionReviewMarkup + (tabletopExperiment ? renderPrototypeWorkspaceTools() : "") +
    clockPanel + '<div data-phase-progression-host>' + renderPhaseProgressionPanel(state, viewedPhase) + '</div>' +
    (viewedPhase === "setup"
      ? '<nav class="battle-shell__setup-tabs" aria-label="Setup tasks">' +
        '<button type="button" data-setup-workspace-tab="saves" aria-pressed="' + String(setupWorkspaceTab === "saves") + '">Account &amp; Saves</button>' +
        '<button type="button" data-setup-workspace-tab="army-builder" aria-pressed="' + String(setupWorkspaceTab === "army-builder") + '">Army Builder</button>' +
        '<button type="button" data-setup-workspace-tab="army-selection" aria-pressed="' + String(setupWorkspaceTab === "army-selection") + '">Step 1 · Select Armies</button>' +
        '<button type="button" data-setup-workspace-tab="pre-game" aria-pressed="' + String(setupWorkspaceTab === "pre-game") + '">Step 2 · Prepare Game</button>' +
        '</nav>' +
        (showCloud
          ? '<section class="battle-shell__setup-tools" aria-label="Army Builder and cloud battle saves">' +
            '<section data-setup-workspace-panel="saves"' + (setupWorkspaceTab === "saves" ? '' : ' hidden') + '><h2>Account &amp; Cloud Saves</h2>' +
            '<p>Sign in to save a battle before play or load a previous battle to resume it.</p>' +
            '<div data-supabase-auth-panel></div><div data-battle-persistence-panel></div></section>' +
            '<section data-setup-workspace-panel="army-builder"' + (setupWorkspaceTab === "army-builder" ? '' : ' hidden') + '><div data-army-roster-panel></div></section>' +
            '<section data-setup-workspace-panel="army-selection"' + (setupWorkspaceTab === "army-selection" ? '' : ' hidden') + '><div data-army-selection-panel></div></section></section>'
          : '<section data-setup-workspace-panel="army-builder"><p>Army Builder requires the signed-in roster store.</p></section><section data-setup-workspace-panel="army-selection" hidden><p>Sign in to select saved army lists.</p></section>') +
        '<style>.battle-shell__setup-bottom-nav [data-setup-workspace-continue]{width:auto;min-width:0;max-width:190px;padding:8px 12px;white-space:nowrap}</style><footer class="battle-shell__setup-bottom-nav"><div><span data-setup-step-label>' + setupTabLabel(setupWorkspaceTab) + '</span>' +
        '<p role="status" data-setup-navigation-message>' + escapeHtml(setupNavigationMessage) + '</p></div>' +
        '<button type="button" data-setup-workspace-continue>' + setupContinueLabel(setupWorkspaceTab) + '</button></footer>'
      : "") +
    '<p class="battle-shell__view-note">Viewing ' + escapeHtml(phaseLabel(viewedPhase)) +
    '. Selecting a phase changes the screen view, not the recorded game phase.</p>' +
    '<p role="status" class="battle-shell__faction-decision-message" data-faction-decision-message>' +
    escapeHtml(factionDecisionMessage) + '</p>' +
    workspace + armyOverlay + scoreAdjustOverlay + renderScoreAdjustStyles() + '</main>';
}

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
  const prototypeWorkspace = createPrototypeWorkspace(container, { session, gameData });
  let armyRosterPlayerId = null;
  let battleShockMessage = "";
  let battleShockReminder = null;
  let observedBattleShockContextKey = null;
  let dismissedTyranidDecisionContextKey = null;
  let factionDecisionMessage = "";
  let clockPanelOpen = false;
  let clockMessage = "";
  let clockTickInterval = null;
  let contextOpenStates = { "unit-status": true, "event-log": true, "older-events": false };
  let referenceOpenStates = { stratagems: true, "army-rules": false, detachments: false, terrain: false };
  let missionOpenStates = {};
  let missionReviewOpen = false;
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
    const phaseHost = container.querySelector?.("[data-phase-progression-host]");
    if (phaseHost) phaseHost.innerHTML = renderPhaseProgressionPanel(session.getState(), viewedPhase, phaseProgressionMessage);
    const state = session.getState();
    refreshScoringCheckpointDialog(container, state, scoringReminder, session);
    const decisionHost = container.querySelector?.("[data-decision-reminder-host]");
    if (decisionHost) {
      decisionHost.innerHTML = renderDecisionReminderHost(state, {
        perspectivePlayerId,
        battleShockReminder,
        dismissedTyranidDecisionContextKey
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
      statusContainer.innerHTML = (battleShockMessage
        ? '<p role="status" class="battle-context__message">' + escapeHtml(battleShockMessage) + '</p>'
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
    const referenceContainer = container.querySelector?.("[data-battle-reference-body]");
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
    const actualPhase = state?.phase ?? null;
    const commandPlayerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
    const commandContextKey = state?.battle?.status === "active" && actualPhase === "command" && commandPlayerId
      ? [state.battle?.round ?? 0, state.turn ?? 0, commandPlayerId].join(":")
      : null;
    if (commandContextKey && commandContextKey !== observedBattleShockContextKey) {
      observedBattleShockContextKey = commandContextKey;
      battleShockReminder = {
        round: state.battle?.round ?? 0,
        turn: state.turn ?? 0,
        playerId: commandPlayerId
      };
    } else if (!commandContextKey) {
      observedBattleShockContextKey = null;
      battleShockReminder = null;
    }
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
      const nextReminder = getScoringCheckpointReminder(state, {previousPhase, missionDefinitions, perspectivePlayerId});
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
        gameData, perspectivePlayerId, leftPanelCollapsed, rightPanelCollapsed, armyRosterPlayerId, clockPanelOpen, clockMessage, missionDefinitions, battleShockReminder, scoringReviewCheckpoint, dismissedTyranidDecisionContextKey, factionDecisionMessage, contextOpenStates, referenceOpenStates, missionOpenStates, missionReviewOpen, setupWorkspaceTab, setupNavigationMessage, layoutMode, scoreAdjustPlayerId, scoreAdjustCollapsed, scoreAdjustMessage, scoreAdjustKind
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
          layoutMode
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
    onRender();
    return state;
  }

  function handleScoreAdjust(event) {
    const open = event.target?.closest?.("[data-open-score-adjust]");
    if (open && container.contains(open)) {
      event.preventDefault?.(); event.stopPropagation?.();
      scoreAdjustPlayerId = open.getAttribute("data-open-score-adjust"); scoreAdjustKind = open.getAttribute("data-open-score-adjust-kind") || "both"; scoreAdjustCollapsed = false; scoreAdjustMessage = ""; render(); return;
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
    const adjust = event.target?.closest?.("[data-score-adjust-kind]");
    if (!adjust || !container.contains(adjust) || !scoreAdjustPlayerId) return;
    event.preventDefault?.(); event.stopPropagation?.();
    const state = session.getState();
    const amount = Number(adjust.getAttribute("data-score-adjust-amount"));
    const kind = adjust.getAttribute("data-score-adjust-kind");
    if (!Number.isInteger(amount) || !["vp","cp"].includes(kind)) return;
    try {
      if (kind === "vp") session.dispatch({ type: COMMAND_TYPES.ADJUST_VICTORY_POINTS, payload: { playerId: scoreAdjustPlayerId, amount, reason: "Scoreboard adjustment", turn: state.turn ?? 0, round: state.battle?.round ?? 0 } });
      else session.dispatch({ type: COMMAND_TYPES.RECORD_COMMAND_POINT_CHANGE, payload: { playerId: scoreAdjustPlayerId, amount, reason: "Scoreboard adjustment", note: "Scoreboard popup", turn: state.turn ?? 0, round: state.battle?.round ?? 0 } });
      scoreAdjustMessage = (amount > 0 ? "+" : "") + amount + " " + kind.toUpperCase() + " recorded.";
    } catch (error) {
      scoreAdjustMessage = error?.message ?? String(error);
    }
    render();
  }

  function handleMapObjectiveToggle(event) {
    const marker = event.target?.closest?.("[data-map-objective-id]");
    if (!marker || !container.contains(marker)) return;
    const state = session.getState();
    if (state.battle?.status !== "active") return;
    const objectiveId = marker.getAttribute("data-map-objective-id");
    const objective = (state.objectives ?? []).find((item) => item?.id === objectiveId);
    if (!objective) return;
    const players = Array.isArray(state.players) ? state.players : [];
    const me = perspectivePlayerId ?? players[0]?.id ?? state.activePlayer ?? null;
    const opponent = players.find((player) => player.id !== me)?.id ?? null;
    const control = objective.control ?? { controlState: "uncontrolled" };
    let next = "mine";
    if (control.controlState === "controlled" && control.controllerId === me) next = "opponent";
    else if (control.controlState === "controlled" && control.controllerId !== me) next = "contested";
    else if (control.controlState === "contested") next = "uncontrolled";
    const payload = { objectiveId, controllerId: null, contestingPlayerIds: [], controlState: "uncontrolled" };
    if (next === "mine") { payload.controlState = "controlled"; payload.controllerId = me; }
    else if (next === "opponent") { payload.controlState = "controlled"; payload.controllerId = opponent; }
    else if (next === "contested") { payload.controlState = "contested"; payload.contestingPlayerIds = players.map((player) => player.id); }
    try { session.dispatch({ type: COMMAND_TYPES.RECORD_OBJECTIVE_CONTROL, payload }); } catch (error) { console.error(error); }
    render();
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

  function handleTyranidHyperAdaptationChoice(event) {
    const button = event.target?.closest?.("[data-faction-decision-choice]");
    if (!button || !container.contains(button)) return;
    const playerId = button.getAttribute("data-faction-player-id");
    const decisionId = button.getAttribute("data-faction-decision-id");
    const choice = button.getAttribute("data-faction-decision-choice");
    try {
      session.dispatch({
        type: COMMAND_TYPES.RECORD_FACTION_ABILITY_DECISION,
        payload: { playerId, decisionId, choice }
      });
      factionDecisionMessage = "Hyper-adaptation choice recorded.";
    } catch (error) {
      factionDecisionMessage = error?.message ?? String(error);
    }
    const messageHost = container.querySelector?.("[data-faction-decision-message]");
    if (messageHost) messageHost.textContent = factionDecisionMessage;
    refreshPersistentPanels();
  }

  function handleUseTyranidFactionAbility(event) {
    const button = event.target?.closest?.("[data-use-faction-decision]");
    if (!button || !container.contains(button)) return;
    const playerId = button.getAttribute("data-faction-player-id");
    const decisionId = button.getAttribute("data-use-faction-decision");
    try {
      session.dispatch({
        type: COMMAND_TYPES.RECORD_FACTION_ABILITY_DECISION,
        payload: { playerId, decisionId, choice: "use" }
      });
      factionDecisionMessage = "Shadow in the Warp recorded as used. Resolve the required Battle-shock tests at the table.";
    } catch (error) {
      factionDecisionMessage = error?.message ?? String(error);
    }
    const messageHost = container.querySelector?.("[data-faction-decision-message]");
    if (messageHost) messageHost.textContent = factionDecisionMessage;
    refreshPersistentPanels();
  }

  function handleDismissTyranidFactionAbility(event) {
    const button = event.target?.closest?.("[data-dismiss-faction-decision]");
    if (!button || !container.contains(button)) return;
    const decisionId = button.getAttribute("data-dismiss-faction-decision");
    const playerId = button.getAttribute("data-faction-player-id");
    const state = session.getState();
    const decision = getTyranidDecisionReminders(state, playerId)
      .find((item) => item.id === decisionId);
    if (decision?.id === TYRANID_DECISION_IDS.SHADOW_IN_THE_WARP) {
      dismissedTyranidDecisionContextKey = tyranidDecisionContextKey(decision, state);
    }
    refreshPersistentPanels();
  }

  function handleBattleShockResult(event) {
    const button = event.target?.closest?.("[data-battle-shock-result]");
    if (!button || !container.contains(button)) return;
    const unitId = button.getAttribute("data-unit-id");
    const result = button.getAttribute("data-battle-shock-result");
    const eligibilityConfirmed = button.getAttribute("data-eligibility-confirmed") === "true";
    try {
      session.dispatch({ type: COMMAND_TYPES.RECORD_BATTLE_SHOCK_TEST, payload: {
        unitId, result, eligibilityConfirmed
      }});
      battleShockMessage = "Battle-shock result recorded for " +
        (session.getState().units?.find((unit) => unit.id === unitId)?.name ?? unitId) + ".";
    } catch (error) {
      battleShockMessage = error?.message ?? String(error);
    }
    render();
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

  function handleDismissBattleShockReminder(event) {
    const button = event.target?.closest?.("[data-dismiss-battle-shock-reminder]");
    if (!button || !container.contains(button)) return;
    battleShockReminder = null;
    button.closest(".battle-shock-reminder__backdrop")?.remove();
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
  container.addEventListener?.("click", handleTyranidHyperAdaptationChoice);
  container.addEventListener?.("click", handleUseTyranidFactionAbility);
  container.addEventListener?.("click", handleDismissTyranidFactionAbility);
  container.addEventListener?.("click", handleBattleShockResult);
  container.addEventListener?.("click", handleDismissScoringReminder);
  container.addEventListener?.("click", handleDismissBattleShockReminder);
  container.addEventListener?.("click", handleReviewScoring);
  container.addEventListener?.("submit", handleSubmit);
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
      prototypeWorkspace.destroy();
      if (clockTickInterval != null) clearInterval(clockTickInterval);
      clockTickInterval = null;
      container.removeEventListener?.("click", handleMissionSummaryToggle);
      disposeMissionReviewPanel();
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
      container.removeEventListener?.("click", handleTyranidHyperAdaptationChoice);
      container.removeEventListener?.("click", handleUseTyranidFactionAbility);
      container.removeEventListener?.("click", handleDismissTyranidFactionAbility);
      container.removeEventListener?.("click", handleBattleShockResult);
      container.removeEventListener?.("click", handleDismissScoringReminder);
      container.removeEventListener?.("click", handleDismissBattleShockReminder);
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
