import { renderStatusSummaryContent, renderScoreAdjustOverlay, renderScoreAdjustStyles, phaseLabel } from './battle-shell-scoreboard.js';
import { renderTurnClockPanel } from './turn-clock-panel.js';
import { renderDecisionReminderHost } from './battle-decision-reminders-view.js';
import { renderScoringCheckpointDialog } from './scoring-checkpoint-dialog.js';
import { renderPersistentMissionSummary } from './mission-summary-panel.js';
import { renderUnitStatusPanel, renderEventLogPanel, renderReferencePanel, renderArmyRosterOverlay } from './battle-context-panels.js';
import { renderSelectedUnitStatePanel } from './selected-unit-state-panel.js';
import { renderShellHeader } from './battle-shell-phase-header.js';
import { renderMissionReviewPanel } from './mission-review-panel.js';
import { renderSecondaryPlanner } from './secondary-planner-panel.js';
import { renderPrototypeWorkspaceTools } from './prototype-workspace.js';
import { renderPhaseProgressionPanel } from './phase-progression-panel.js';
import { renderAppThemeToggle } from './app-theme-preference.js';
import { setupScreenOwnsContinue, setupTabLabel, setupContinueLabel } from './setup-navigation-labels.js';

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function renderShell(container, state, viewedPhase, scoringReminder = null, showCloud = false, {
  gameData = null,
  perspectivePlayerId = null,
  leftPanelCollapsed = true,
  rightPanelCollapsed = false,
  selectedUnitId = null,
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
  phaseProgressionOwned = false,
  scoreAdjustPlayerId = null,
  scoreAdjustCollapsed = false,
  scoreAdjustMessage = "",
  scoreAdjustKind = "both",
  appTheme = "custodes",
  secondaryPlanner = null
} = {}) {
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
    '<div data-selected-unit-state-host>' + renderSelectedUnitStatePanel(state, selectedUnitId, { perspectivePlayerId }) + '</div>' +
    '<div data-battle-reference-content>' + renderReferencePanel(state, gameData ?? {}, perspectivePlayerId, { openSections: referenceOpenStates }) + '</div></div></aside></section>';
  const scoreAdjustOverlay = '<div data-score-adjust-host>' + renderScoreAdjustOverlay(state, players, scoreAdjustPlayerId, scoreAdjustCollapsed, scoreAdjustMessage, scoreAdjustKind) + '</div>';
  const armyOverlay = '<div class="battle-shell__army-overlay" data-army-roster-overlay' +
    (armyRosterPlayerId ? "" : " hidden") + '>' +
    (armyRosterPlayerId ? renderArmyRosterOverlay(state, armyRosterPlayerId, gameData ?? {}) : "") + '</div>';
  const shellLiveHeader = renderShellHeader(state, { viewedPhase, layoutMode, missionReviewOpen, appTheme, statusSummary, tabletopExperiment });

  if (secondaryPlanner && viewedPhase === "setup") secondaryPlanner.open = false;
  const missionReviewMarkup = renderMissionReviewPanel(persistentMissionSummary, { open: missionReviewOpen, openStates: missionOpenStates });
  container.innerHTML = '<main class="battle-shell' + (isReviewView ? ' is-review-view' : '') + (tabletopExperiment ? ' is-tabletop-experiment' : '') + (state.preparation?.mode === 'combined' && state.battle?.status === 'deployment' ? ' is-deploy-begin' : '') + ((isScrollablePreparationView || isScrollableLiveView) ? ' is-scrollable-preparation' : '') + '" data-app-theme="' + appTheme + '">' + reminderMarkup +
    '<div data-decision-reminder-host>' + decisionReminderMarkup + '</div><div data-rules-reminder-host></div>' +
    shellLiveHeader + (secondaryPlanner && viewedPhase !== "setup" ? renderSecondaryPlanner(secondaryPlanner) : "") + missionReviewMarkup + (tabletopExperiment ? renderPrototypeWorkspaceTools({ missionReviewOpen, appTheme, secondaryPlannerOpen: Boolean(secondaryPlanner?.open) }) : "") +
    clockPanel + '<div data-phase-progression-host>' + renderPhaseProgressionPanel(state, viewedPhase, '', phaseProgressionOwned) + '</div>' +
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
            '<div class="setup-appearance-pref"><span>App colors</span>' + renderAppThemeToggle(appTheme) + '</div>' +
            '<div data-supabase-auth-panel></div><div data-battle-persistence-panel></div></section>' +
            '<section data-setup-workspace-panel="army-builder"' + (setupWorkspaceTab === "army-builder" ? '' : ' hidden') + '><nav class="battle-shell__builder-nav" aria-label="Army Builder navigation"><button type="button" data-setup-workspace-tab="army-selection">← Back to Select Armies</button></nav><div data-army-roster-panel></div></section>' +
            '<section data-setup-workspace-panel="army-selection"' + (setupWorkspaceTab === "army-selection" ? '' : ' hidden') + '><div data-army-selection-panel></div></section></section>'
          : '<section data-setup-workspace-panel="army-builder"><p>Army Builder requires the signed-in roster store.</p></section><section data-setup-workspace-panel="army-selection" hidden><p>Sign in to select saved army lists.</p></section>') +
        '<style>.battle-shell__setup-bottom-nav [data-setup-workspace-continue]{width:auto;min-width:0;max-width:190px;padding:8px 12px;white-space:nowrap}</style><footer class="battle-shell__setup-bottom-nav"' + (setupScreenOwnsContinue(setupWorkspaceTab) || setupWorkspaceTab === "army-builder" ? ' hidden' : '') + '><div><span data-setup-step-label>' + setupTabLabel(setupWorkspaceTab) + '</span>' +
        '<p role="status" data-setup-navigation-message>' + escapeHtml(setupNavigationMessage) + '</p></div>' +
        '<button type="button" data-setup-workspace-continue>' + setupContinueLabel(setupWorkspaceTab) + '</button></footer>'
      : "") +
    '<p class="battle-shell__view-note">Viewing ' + escapeHtml(phaseLabel(viewedPhase)) +
    '. Selecting a phase changes the screen view, not the recorded game phase.</p>' +
    '<p role="status" class="battle-shell__faction-decision-message" data-faction-decision-message>' +
    escapeHtml(factionDecisionMessage) + '</p>' +
    workspace + armyOverlay + scoreAdjustOverlay + renderScoreAdjustStyles() + '</main>';
}

