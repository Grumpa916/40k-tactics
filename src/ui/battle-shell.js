import { getSecondaryMissionHistory, getSecondaryMissionMode, SECONDARY_MISSION_MODES, SECONDARY_MISSION_STATUS } from "../rules/secondary-mission-lifecycle.js";
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { createChargeScreen } from "./charge-screen.js";
import { createCommandScreen } from "./command-screen.js";
import { createBattleSetupScreen } from "./battle-setup-screen.js";
import { createDeploymentScreen } from "./deployment-screen.js";
import { createFightScreen } from "./fight-screen.js";
import { createMovementScreen } from "./movement-screen.js";
import { createBattlePersistencePanel } from "./battle-persistence-panel.js";
import { createSupabaseAuthPanel } from "./supabase-auth-panel.js";
import { createSupabaseBattleStore } from "../persistence/supabase-battle-store.js";
import { createSupabaseArmyRosterStore } from "../persistence/supabase-army-roster-store.js";
import { createArmyRosterPanel } from "./army-roster-panel.js";
import { createShootingScreen } from "./shooting-screen.js";
import { renderEventLogPanel, renderUnitStatusPanel, renderReferencePanel, renderArmyRosterOverlay } from "./battle-context-panels.js";
import { renderTurnClockPanel } from "./turn-clock-panel.js";
import { formatElapsedTime, getTurnClockElapsedMs, getTurnClockState } from "../state/turn-clock.js";
import { renderPersistentMissionSummary } from "./mission-summary-panel.js";
import { getBattleShockEligibility, isUnitBattleShocked } from "../rules/unit-status-summary.js";
import { getTyranidDecisionReminders, TYRANID_DECISION_IDS } from "../rules/tyranid-decision-reminders.js";
import { evaluatePreGameReadiness } from "../rules/pre-game-readiness.js";

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
  fight: createFightScreen
});

function phaseLabel(phase) {
  if (phase === "setup") return "Battle Setup & Saves";
  if (phase === "deployment") return "Deployment";
  return PHASES.find((item) => item.id === phase)?.label ?? phase;
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function hasBattleShockTestInCurrentTurn(state, unitId, round, turn) {
  return (Array.isArray(state.history) ? state.history : []).some((event) =>
    event?.type === "battle_shock.test_recorded" &&
    event?.payload?.unitId === unitId &&
    event?.payload?.round === round &&
    event?.payload?.turn === turn);
}

function renderBattleShockReminder(state, reminder) {
  if (!reminder || state?.battle?.status !== "active" || state.phase !== "command") return "";
  const round = state.battle?.round ?? 0;
  const turn = state.turn ?? 0;
  const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  if (reminder.playerId !== activePlayerId || reminder.round !== round || reminder.turn !== turn) return "";
  const units = (Array.isArray(state.units) ? state.units : []).filter((unit) => {
    if (unit.ownerId !== reminder.playerId ||
        hasBattleShockTestInCurrentTurn(state, unit.id, round, turn)) return false;
    const eligibility = getBattleShockEligibility(unit);
    return eligibility.requiresTest === true;
  });
  if (!units.length) return "";
  const untrackedCount = (Array.isArray(state.units) ? state.units : []).filter((unit) =>
    unit.ownerId === reminder.playerId &&
    !hasBattleShockTestInCurrentTurn(state, unit.id, round, turn) &&
    getBattleShockEligibility(unit).requiresTest === null
  ).length;

  const rows = units.map((unit) => {
    const eligibility = getBattleShockEligibility(unit);
    const unknown = eligibility.requiresTest === null;
    const reason = isUnitBattleShocked(unit)
      ? "Already Battle-shocked — test required"
      : unknown
        ? "Strength is not tracked — check the physical unit and datasheet"
        : "At or below half-strength";
    const confirmed = unknown ? "true" : "false";
    const unitId = escapeHtml(unit.id);
    return '<li class="battle-shock-reminder__unit"><div><strong>' +
      escapeHtml(unit.name ?? unit.id) + '</strong><small>' + escapeHtml(reason) + '</small></div>' +
      '<div class="battle-shock-reminder__results">' +
      '<button type="button" data-battle-shock-result="passed" data-unit-id="' + unitId +
      '" data-eligibility-confirmed="' + confirmed + '">Passed</button>' +
      '<button type="button" data-battle-shock-result="failed" data-unit-id="' + unitId +
      '" data-eligibility-confirmed="' + confirmed + '">Failed</button>' +
      '</div></li>';
  }).join("");
  return '<div class="battle-shock-reminder__backdrop"><section class="battle-shock-reminder" role="dialog" ' +
    'aria-modal="true" aria-labelledby="battle-shock-reminder-title"><div class="battle-shock-reminder__kicker">COMMAND PHASE</div>' +
    '<h2 id="battle-shock-reminder-title">Battle-shock checks</h2>' +
    '<p>Review these units now. Enter the actual result from the table.</p>' +
    (untrackedCount ? '<p class="battle-shock-reminder__note">' + untrackedCount +
      ' additional unit(s) have untracked strength. Check Unit Status and the physical unit/card; they are not assumed to need a test.</p>' : '') +
    '<ul class="battle-shock-reminder__list">' + rows + '</ul>' +
    '<div class="battle-shock-reminder__actions"><button type="button" data-dismiss-battle-shock-reminder>Review later</button></div>' +
    '</section></div>';
}

function tyranidDecisionContextKey(decision, state) {
  return [
    decision?.id ?? "",
    state?.battle?.round ?? 0,
    state?.turn ?? 0,
    state?.activePlayer ?? state?.battle?.activePlayerId ?? ""
  ].join(":");
}

function renderTyranidDecisionReminder(decision) {
  if (!decision) return "";
  if (decision.id === TYRANID_DECISION_IDS.HYPER_ADAPTATIONS) {
    const options = (decision.options ?? []).map((option) =>
      '<li class="tyranid-decision-reminder__option"><div><strong>' + escapeHtml(option.name) +
      '</strong><p>' + escapeHtml(option.summary) + '</p></div>' +
      '<button type="button" data-faction-decision-choice="' + escapeHtml(option.id) +
      '" data-faction-decision-id="' + escapeHtml(decision.id) +
      '" data-faction-player-id="' + escapeHtml(decision.playerId) + '">Choose</button></li>'
    ).join("");
    return '<div class="tyranid-decision-reminder__backdrop"><section class="tyranid-decision-reminder" role="dialog" ' +
      'aria-modal="true" aria-labelledby="tyranid-hyper-adaptations-title"><div class="tyranid-decision-reminder__kicker">ROUND 1 · INVASION FLEET</div>' +
      '<h2 id="tyranid-hyper-adaptations-title">Choose Hyper-adaptations</h2>' +
      '<p>' + escapeHtml(decision.description) + ' Choose one adaptation for this battle.</p>' +
      '<ul class="tyranid-decision-reminder__options">' + options + '</ul>' +
      '<p class="tyranid-decision-reminder__note">The choice is recorded in battle history. Attack effects are a reference reminder; combat results are still resolved at the table.</p>' +
      '</section></div>';
  }
  if (decision.id === TYRANID_DECISION_IDS.SHADOW_IN_THE_WARP) {
    const carriers = (decision.carriers ?? []).map(escapeHtml).join(", ");
    return '<div class="tyranid-decision-reminder__backdrop"><section class="tyranid-decision-reminder" role="dialog" ' +
      'aria-modal="true" aria-labelledby="tyranid-shadow-in-the-warp-title"><div class="tyranid-decision-reminder__kicker">COMMAND PHASE · ONCE PER BATTLE</div>' +
      '<h2 id="tyranid-shadow-in-the-warp-title">Shadow in the Warp</h2>' +
      '<p>' + escapeHtml(decision.description) + '</p>' +
      '<p><strong>Available from:</strong> ' + carriers + '</p>' +
      '<p>Using it records the decision only. Resolve the required enemy Battle-shock tests at the table and check the applicable Synapse/Psychic modifiers.</p>' +
      '<div class="tyranid-decision-reminder__actions"><button type="button" data-use-faction-decision="' +
      escapeHtml(decision.id) + '" data-faction-player-id="' + escapeHtml(decision.playerId) + '">Use now</button>' +
      '<button type="button" data-dismiss-faction-decision="' + escapeHtml(decision.id) +
      '" data-faction-player-id="' + escapeHtml(decision.playerId) + '">Not now</button></div>' +
      '</section></div>';
  }
  return "";
}

function renderDecisionReminderHost(state, {
  perspectivePlayerId = null,
  battleShockReminder = null,
  dismissedTyranidDecisionContextKey = null
} = {}) {
  const playerId = perspectivePlayerId ?? state?.players?.[0]?.id ?? null;
  const decisions = getTyranidDecisionReminders(state, playerId);
  const hyperAdaptation = decisions.find((decision) =>
    decision.id === TYRANID_DECISION_IDS.HYPER_ADAPTATIONS);
  const shadowInTheWarp = decisions.find((decision) =>
    decision.id === TYRANID_DECISION_IDS.SHADOW_IN_THE_WARP &&
    tyranidDecisionContextKey(decision, state) !== dismissedTyranidDecisionContextKey);
  const factionDecision = hyperAdaptation ?? shadowInTheWarp;
  if (factionDecision) return renderTyranidDecisionReminder(factionDecision);
  return renderBattleShockReminder(state, battleShockReminder);
}

function renderStatusSummaryContent(state, viewedPhase, clockPanelOpen = false) {
  const round = state.battle?.round ?? 0;
  const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  const players = Array.isArray(state.players) ? state.players : [];
  const clock = getTurnClockState(state);
  const clockPlayerId = clock.activePlayerId ?? activePlayerId;
  const clockTime = clockPlayerId
    ? formatElapsedTime(getTurnClockElapsedMs(state, clockPlayerId))
    : "--:--";
  const playerSummary = players.map((player) => {
    const vp = Number.isFinite(state.victoryPoints?.[player.id]) ? state.victoryPoints[player.id] : 0;
    const cpValue = state.commandPoints?.[player.id];
    const cp = Number.isFinite(cpValue) ? cpValue :
      Number.isFinite(cpValue?.current) ? cpValue.current : "—";
    const active = player.id === activePlayerId ? " is-active" : "";
    return '<div class="battle-shell__player-summary' + active + '">' +
      '<strong>' + escapeHtml(player.name ?? player.id) + '</strong>' +
      '<span>' + vp + ' VP</span><span>' + cp + ' CP</span></div>';
  }).join("");
  return '<div class="battle-shell__round-summary"><strong>Round ' + (round || "—") + '</strong>' +
    '<span>' + escapeHtml(phaseLabel(state.phase ?? viewedPhase)) + '</span></div>' +
    '<div class="battle-shell__player-summaries">' + playerSummary + '</div>' +
    '<button type="button" class="battle-shell__clock-button" data-toggle-turn-clock ' +
    'aria-expanded="' + String(clockPanelOpen) + '" aria-controls="battle-turn-clock-panel">' +
    '<span>Clock</span><time data-turn-clock-header-time>' + clockTime + '</time></button>';
}

function setupTabLabel(tab) {
  return ({ saves: "Setup · Account & Saves", "army-builder": "Step 1 of 5 · Game Size & Muster Armies",
    "pre-game": "Step 2 of 5 · Pre-game", "mission-map": "Step 3 of 5 · Mission & Secondaries",
    battlefield: "Step 4 of 5 · Create the Battlefield", deployment: "Step 5 of 5 · Deploy and Begin" })[tab] ?? "Setup";
}

function setupContinueLabel(tab) {
  return ({ saves: "Continue to Game Size", "army-builder": "Continue to Pre-game",
    "pre-game": "Continue to Mission &amp; Secondaries", "mission-map": "Continue to Create the Battlefield",
    battlefield: "Continue to Deploy and Begin", deployment: "Deploy and Begin" })[tab] ?? "Continue";
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
  setupWorkspaceTab = "saves",
  setupNavigationMessage = ""
} = {}) {
  const setupTab = { id: "setup", label: "Setup & Saves", status: "live" };
  const visiblePhases = [setupTab, ...(state.battle?.status === "deployment"
    ? [{ id: "deployment", label: "Deployment", status: "live" }, ...PHASES]
    : PHASES)];
  const phaseItems = visiblePhases.map((phase) => {
    const active = phase.id === viewedPhase ? " is-active" : "";
    const status = phase.status === "live" ? "Ready" : "Planned";
    return '<li class="battle-phase' + active + '">' +
      '<button type="button" class="battle-phase__button" data-battle-phase-button="' + phase.id +
      '" aria-pressed="' + String(phase.id === viewedPhase) + '">' +
      '<strong>' + phase.label + '</strong><span>' +
      (phase.id === "setup" ? "Pre-game & cloud saves" : status) +
      '</span></button></li>';
  }).join("");

  const statusSummary = '<section class="battle-shell__status-summary" data-battle-status-summary aria-label="Persistent score and Command Points">' +
    renderStatusSummaryContent(state, viewedPhase, clockPanelOpen) + '</section>';
  const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  const players = Array.isArray(state.players) ? state.players : [];
  const clockPanel = '<div data-turn-clock-panel-host>' +
    renderTurnClockPanel(state, { open: clockPanelOpen, message: clockMessage }) + '</div>';

  const reminderPlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  const tacticalDiscardCards = scoringReminder?.timing === "end-of-turn" &&
    getSecondaryMissionMode(state, reminderPlayerId) === SECONDARY_MISSION_MODES.TACTICAL && reminderPlayerId
    ? getSecondaryMissionHistory(state, reminderPlayerId).filter((item) =>
        item.status === SECONDARY_MISSION_STATUS.ACTIVE &&
        item.definition?.missionMode === SECONDARY_MISSION_MODES.TACTICAL)
    : [];
  const tacticalDiscardForm = tacticalDiscardCards.length
    ? '<section class="battle-tactical-discard"><h3>Discard Tactical cards for +1 CP</h3>' +
      '<p>At the end of your own turn, discard one or more active Tactical cards to gain 1 CP total.</p>' +
      '<form data-tactical-discard-form>' +
      tacticalDiscardCards.map((item) =>
        '<label><input type="checkbox" name="discard-instance" value="' + escapeHtml(item.instanceId) + '">' +
        escapeHtml(item.definition?.name ?? item.definitionId) + '</label>'
      ).join("") +
      '<button type="submit">Discard selected cards and gain +1 CP</button></form></section>'
    : "";
  const decisionReminderMarkup = !scoringReminder && !scoringReviewCheckpoint
    ? renderDecisionReminderHost(state, {
        perspectivePlayerId,
        battleShockReminder,
        dismissedTyranidDecisionContextKey
      })
    : "";
  const reminderMarkup = scoringReminder ? '<div class="battle-scoring-reminder__backdrop">' +
    '<section class="battle-scoring-reminder" role="dialog" aria-modal="true" aria-labelledby="battle-scoring-reminder-title">' +
    '<h2 id="battle-scoring-reminder-title">Scoring checkpoint</h2>' +
    '<p>' + escapeHtml(scoringReminder.label) + '. Check any Primary or Secondary mission due now.</p>' +
    '<ul>' + (scoringReminder.missions.map((mission) => '<li>' + escapeHtml(mission) + '</li>').join("") ||
      '<li>Review your mission cards and confirm any points earned.</li>') + '</ul>' +
    tacticalDiscardForm +
    '<div class="battle-scoring-reminder__actions"><button type="button" data-review-scoring>Review scoring</button>' +
    '<button type="button" data-dismiss-scoring-reminder>Remind me later</button></div></section></div>' : "";

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
  const isSetupView = viewedPhase === "setup" || setupWorkspaceTab !== "deployment";
  const workspace = '<section class="battle-shell__workspace' + (isSetupView ? ' is-setup-view' : '') + '" data-battle-workspace' +
    (viewedPhase === "setup" && (setupWorkspaceTab === "army-builder" || setupWorkspaceTab === "saves") ? ' hidden' : '') +
    ' data-left-collapsed="' + String(leftPanelCollapsed) + '" data-right-collapsed="' + String(rightPanelCollapsed) + '">' +
    '<aside class="battle-shell__side-panel battle-shell__side-panel--left" data-battle-side-panel="left"' + (isSetupView ? ' hidden' : '') + '>' +
    leftToggle + '<div id="battle-left-panel-body" class="battle-shell__panel-body" data-battle-context-body>' +
    renderUnitStatusPanel(state, { openSections: contextOpenStates }) + renderEventLogPanel(state, { openSections: contextOpenStates }) + '</div></aside>' +
    '<section class="battle-shell__content">' +
    '<section data-battle-screen></section>' +
    '<div data-battle-mission-summary-host>' +
    renderPersistentMissionSummary(state, { perspectivePlayerId, missionDefinitions, openStates: missionOpenStates }) +
    '</div></section>' +
    '<aside class="battle-shell__side-panel battle-shell__side-panel--right" data-battle-side-panel="right"' + (isSetupView ? ' hidden' : '') + '>' +
    rightToggle + '<div id="battle-right-panel-body" class="battle-shell__panel-body" data-battle-reference-body>' +
    renderReferencePanel(state, gameData ?? {}, perspectivePlayerId, { openSections: referenceOpenStates }) + '</div></aside></section>';
  const armyDock = '<nav class="battle-shell__army-dock" aria-label="Open army rosters">' +
    '<button type="button" data-open-army-roster="' + escapeHtml(yourPlayerId ?? "") + '"' +
    (yourPlayerId ? "" : " disabled") + '><strong>My Army</strong><span>' + escapeHtml(myName) + '</span></button>' +
    '<button type="button" data-open-army-roster="' + escapeHtml(opponentPlayerId ?? "") + '"' +
    (opponentPlayerId ? "" : " disabled") + '><strong>Opponent Army</strong><span>' + escapeHtml(opponentName) + '</span></button></nav>';
  const armyOverlay = '<div class="battle-shell__army-overlay" data-army-roster-overlay' +
    (armyRosterPlayerId ? "" : " hidden") + '>' +
    (armyRosterPlayerId ? renderArmyRosterOverlay(state, armyRosterPlayerId, gameData ?? {}) : "") + '</div>';

  container.innerHTML = '<main class="battle-shell">' + reminderMarkup +
    '<div data-decision-reminder-host>' + decisionReminderMarkup + '</div>' +
    '<ol class="battle-shell__phases" aria-label="Battle phase navigation">' + phaseItems + '</ol>' +
    statusSummary + clockPanel +
    (viewedPhase === "setup"
      ? '<nav class="battle-shell__setup-tabs" aria-label="Setup tasks">' +
        '<button type="button" data-setup-workspace-tab="saves" aria-pressed="' + String(setupWorkspaceTab === "saves") + '">Account &amp; Saves</button>' +
        '<button type="button" data-setup-workspace-tab="army-builder" aria-pressed="' + String(setupWorkspaceTab === "army-builder") + '">Step 1 · Game Size &amp; Armies</button>' +
        '<button type="button" data-setup-workspace-tab="pre-game" aria-pressed="' + String(setupWorkspaceTab === "pre-game") + '">Step 2 · Pre-game</button>' +
        '<button type="button" data-setup-workspace-tab="mission-map" aria-pressed="' + String(setupWorkspaceTab === "mission-map") + '">Step 3 · Mission &amp; Secondaries</button>' +
        '<button type="button" data-setup-workspace-tab="battlefield" aria-pressed="' + String(setupWorkspaceTab === "battlefield") + '">Step 4 · Create the Battlefield</button>' +
        '<button type="button" data-setup-workspace-tab="deployment" aria-pressed="' + String(setupWorkspaceTab === "deployment") + '">Step 5 · Deploy and Begin</button></nav>' +
        (showCloud
          ? '<section class="battle-shell__setup-tools" aria-label="Army Builder and cloud battle saves">' +
            '<section data-setup-workspace-panel="saves"' + (setupWorkspaceTab === "saves" ? '' : ' hidden') + '><h2>Account &amp; Cloud Saves</h2>' +
            '<p>Sign in to save a battle before play or load a previous battle to resume it.</p>' +
            '<div data-supabase-auth-panel></div><div data-battle-persistence-panel></div></section>' +
            '<section data-setup-workspace-panel="army-builder"' + (setupWorkspaceTab === "army-builder" ? '' : ' hidden') + '><div data-army-roster-panel></div></section></section>'
          : '<section data-setup-workspace-panel="army-builder"><p>Army Builder requires the signed-in roster store.</p></section>') +
        '<footer class="battle-shell__setup-bottom-nav"><div><span data-setup-step-label>' + setupTabLabel(setupWorkspaceTab) + '</span>' +
        '<p role="status" data-setup-navigation-message>' + escapeHtml(setupNavigationMessage) + '</p></div>' +
        '<button type="button" data-setup-workspace-continue>' + setupContinueLabel(setupWorkspaceTab) + '</button></footer>'
      : "") +
    '<p class="battle-shell__view-note">Viewing ' + escapeHtml(phaseLabel(viewedPhase)) +
    '. Selecting a phase changes the screen view, not the recorded game phase.</p>' +
    '<p role="status" class="battle-shell__faction-decision-message" data-faction-decision-message>' +
    escapeHtml(factionDecisionMessage) + '</p>' +
    workspace + armyDock + armyOverlay + '</main>';
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
  supabaseClient = null
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
  const cloudStore = battleStore ?? (supabaseClient ? createSupabaseBattleStore(supabaseClient) : null);
  const showCloud = Boolean(supabaseClient || cloudStore);
  let setupWorkspaceTab = "saves";
  let setupNavigationMessage = "";
  let viewedPhase = session.getState()?.phase ?? "command";
  let observedGamePhase = session.getState()?.phase ?? null;
  let observedActivePlayerId = session.getState()?.activePlayer ?? session.getState()?.battle?.activePlayerId ?? null;
  let scoringReminder = null;
  let scoringReviewCheckpoint = null;
  let scoringReviewActivePlayerId = null;
  let scoringReviewPlayerId = null;
  let reminderSequence = 0;
  let leftPanelCollapsed = true;
  let rightPanelCollapsed = false;
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

  function setupTabLabel(tab) {
    return ({ saves: "Account & Saves", "army-builder": "Step 1 of 4 · Select Armies & Game Size",
      "pre-game": "Step 2 of 4 · Pre-game", "mission-map": "Step 3 of 4 · Mission & Secondaries",
      battlefield: "Step 4 of 4 · Create the Battlefield", deployment: "Step 5 · Deploy and Begin" })[tab] ?? "Setup";
  }

  function setupContinueLabel(tab) {
    return ({ saves: "Continue to Select Armies", "army-builder": "Continue to Pre-game",
      "pre-game": "Continue to Mission & Secondaries", "mission-map": "Continue to Create the Battlefield",
      battlefield: "Continue to Deploy and Begin", deployment: "Deploy and Begin" })[tab] ?? "Continue";
  }

  function setSetupWorkspaceTab(tab) {
    if (!["army-builder", "saves", "pre-game", "mission-map", "battlefield", "deployment"].includes(tab)) return;
    setupWorkspaceTab = tab;
    setupNavigationMessage = "";
    container.querySelectorAll?.("[data-setup-workspace-tab]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-setup-workspace-tab") === tab));
    });
    container.querySelectorAll?.("[data-setup-workspace-panel]").forEach((panel) => {
      panel.hidden = panel.getAttribute("data-setup-workspace-panel") !== tab;
    });
    const workspace = container.querySelector?.("[data-battle-workspace]");
    if (workspace) workspace.hidden = tab === "army-builder" || tab === "saves";
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
    const state = session.getState();
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
      missionOpenStates = { ...missionOpenStates, ...openStates };
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
      const endingPlayerId = observedActivePlayerId;
      observedGamePhase = actualPhase;
      viewedPhase = actualPhase;
      // A checkpoint review belongs to one specific transition. Do not carry it
      // into a later game phase or present it as current after the state advances.
      scoringReviewCheckpoint = null;
      scoringReviewActivePlayerId = null;
      scoringReviewPlayerId = null;
      const currentActivePlayerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
      const opponentTurnJustEnded = previousPhase === "end_turn" &&
        (actualPhase === "start_turn" || actualPhase === "end_battle_round") &&
        perspectivePlayerId != null && endingPlayerId != null && endingPlayerId !== perspectivePlayerId;
      const timing = previousPhase === "command" && actualPhase === "movement"
        ? "command-phase"
        : actualPhase === "end_turn" ? "end-of-turn"
        : opponentTurnJustEnded ? "end-of-opponent-turn" : null;
      if (timing) {
        const reminderPlayerId = timing === "end-of-opponent-turn" ? endingPlayerId : currentActivePlayerId;
        const scoringPlayerId = timing === "end-of-opponent-turn" ? perspectivePlayerId : reminderPlayerId;
        const definitionsDue = missionDefinitions.filter((definition) =>
          definition.timing === timing && definition.category !== "secondary");
        const activeSecondaryDue = scoringPlayerId
          ? getSecondaryMissionHistory(state, scoringPlayerId)
            .filter((instance) => {
              if (instance.status !== SECONDARY_MISSION_STATUS.ACTIVE) return false;
              const definition = instance.definition;
              if (Array.isArray(definition?.scoringWindows) && definition.scoringWindows.length) {
                return definition.scoringWindows.some((window) => window?.timing === timing);
              }
              return definition?.timing === timing;
            })
            .map((instance) => instance.definition?.name ?? instance.definitionId)
          : [];
        const missionNames = [...definitionsDue.map((definition) => definition.name), ...activeSecondaryDue];
        const isPerspectiveTurn = perspectivePlayerId != null && reminderPlayerId != null
          ? reminderPlayerId === perspectivePlayerId
          : null;
        const ownerLabel = timing === "end-of-opponent-turn" ? "your opponent's"
          : isPerspectiveTurn === true ? "your"
          : isPerspectiveTurn === false ? "your opponent's" : "the active player's";
        scoringReminder = {
          id: ++reminderSequence,
          timing,
          label: timing === "command-phase"
            ? `End of ${ownerLabel} Command phase`
            : `End of ${ownerLabel} turn`,
          activePlayerId: reminderPlayerId,
          scoringPlayerId,
          missions: missionNames
        };
      }
    }
    observedActivePlayerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null;

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
        gameData, perspectivePlayerId, leftPanelCollapsed, rightPanelCollapsed, armyRosterPlayerId, clockPanelOpen, clockMessage, missionDefinitions, battleShockReminder, scoringReviewCheckpoint, dismissedTyranidDecisionContextKey, factionDecisionMessage, contextOpenStates, referenceOpenStates, missionOpenStates, setupWorkspaceTab, setupNavigationMessage
      });

      const persistenceContainer = container.querySelector("[data-battle-persistence-panel]");
      const rosterContainer = container.querySelector("[data-army-roster-panel]");
      const rosterStore = supabaseClient ? createSupabaseArmyRosterStore(supabaseClient) : null;
      const mountPersistenceForUser = (user) => {
        mountedPersistencePanel?.destroy();
        mountedPersistencePanel = null;
        mountedRosterPanel?.destroy();
        mountedRosterPanel = null;
        if (user && cloudStore && persistenceContainer) {
          mountedPersistencePanel = createBattlePersistencePanel(persistenceContainer, { session, store: cloudStore });
        }
        if (user && rosterStore && rosterContainer) {
          mountedRosterPanel = createArmyRosterPanel(rosterContainer, {
            store: rosterStore,
            players: session.getState()?.players ?? [],
            canApply: session.getState()?.phase === "setup" && session.getState()?.battle?.status === "setup",
            onApplyRoster: (roster, playerId) => session.dispatch({
              type: COMMAND_TYPES.APPLY_ARMY_ROSTER_TO_BATTLE,
              payload: { roster, playerId }
            })
          });
        } else if (rosterContainer) {
          rosterContainer.innerHTML = "<p>Sign in to create and reuse saved army rosters. Roster storage uses the same account as cloud battle saves.</p>";
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
          setupTab: setupWorkspaceTab
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
    return state;
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
    scoringReviewCheckpoint = scoringReminder?.timing ?? null;
    scoringReviewActivePlayerId = scoringReminder?.activePlayerId ?? null;
    scoringReviewPlayerId = scoringReminder?.scoringPlayerId ?? scoringReminder?.activePlayerId ?? null;
    scoringReminder = null;
    viewedPhase = "command";
    render();
  }

  function handleSetupWorkspaceNavigation(event) {
    const tabButton = event.target?.closest?.("[data-setup-workspace-tab]");
    if (tabButton && container.contains(tabButton)) {
      const requestedTab = tabButton.getAttribute("data-setup-workspace-tab");
      if (requestedTab === "deployment") {
        setSetupWorkspaceTab("battlefield");
        const continueButton = container.querySelector?.("[data-setup-workspace-continue]");
        if (continueButton) handleSetupWorkspaceNavigation({ target: continueButton });
      } else {
        setSetupWorkspaceTab(requestedTab);
      }
      return;
    }
    const continueButton = event.target?.closest?.("[data-setup-workspace-continue]");
    if (!continueButton || !container.contains(continueButton)) return;
    if (setupWorkspaceTab === "battlefield" || setupWorkspaceTab === "deployment") {
      const currentState = session.getState();
      const readiness = evaluatePreGameReadiness(currentState);
      const missing = readiness.missing.map((item) => item.label);
      if ((currentState.players ?? []).some((player) => !getSecondaryMissionMode(currentState, player.id))) missing.push("Set Fixed or Tactical secondary mode for both players");
      if (missing.length) {
        setupNavigationMessage = "Complete before deployment: " + missing.join(", ") + ".";
        const message = container.querySelector?.("[data-setup-navigation-message]");
        if (message) message.textContent = setupNavigationMessage;
        return;
      }
      try {
        session.dispatch({ type: COMMAND_TYPES.ENTER_DEPLOYMENT, payload: {} });
        setupNavigationMessage = "";
      } catch (error) {
        setupNavigationMessage = error?.message ?? String(error);
        const message = container.querySelector?.("[data-setup-navigation-message]");
        if (message) message.textContent = setupNavigationMessage;
      }
      return;
    }
    const order = ["saves", "army-builder", "pre-game", "mission-map", "battlefield"];
    const index = order.indexOf(setupWorkspaceTab);
    setSetupWorkspaceTab(order[index + 1] ?? "deployment");
  }

  function handlePhaseNavigation(event) {
    const button = event.target?.closest?.("[data-battle-phase-button]");
    if (!button || !container.contains(button)) return;
    const nextPhase = button.getAttribute("data-battle-phase-button");
    if (nextPhase !== "setup" && !PHASES.some((phase) => phase.id === nextPhase) &&
        !(nextPhase === "deployment" && session.getState()?.battle?.status === "deployment")) return;
    if (nextPhase !== "command") {
      scoringReviewCheckpoint = null;
      scoringReviewActivePlayerId = null;
      scoringReviewPlayerId = null;
    }
    viewedPhase = nextPhase;
    render();
  }

  container.addEventListener?.("click", handleSetupWorkspaceNavigation);
  container.addEventListener?.("click", handlePhaseNavigation);
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
    render,
    destroy: () => {
      unsubscribe();
      if (clockTickInterval != null) clearInterval(clockTickInterval);
      clockTickInterval = null;
      container.removeEventListener?.("click", handleSetupWorkspaceNavigation);
      container.removeEventListener?.("click", handlePhaseNavigation);
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
