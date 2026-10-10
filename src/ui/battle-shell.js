import { getSecondaryMissionHistory, SECONDARY_MISSION_MODES, SECONDARY_MISSION_STATUS } from "../rules/secondary-mission-lifecycle.js";
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { createChargeScreen } from "./charge-screen.js";
import { createCommandScreen } from "./command-screen.js";
import { createBattleSetupScreen } from "./battle-setup-screen.js";
import { createDeploymentScreen } from "./deployment-screen.js";
import { createFightScreen } from "./fight-screen.js";
import { createMovementScreen } from "./movement-screen.js";
import { createShootingScreen } from "./shooting-screen.js";

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
  if (phase === "deployment") return "Deployment";
  return PHASES.find((item) => item.id === phase)?.label ?? phase;
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function renderShell(container, state, viewedPhase, scoringReminder = null) {
  const visiblePhases = state.battle?.status === "deployment"
    ? [{ id: "deployment", label: "Deployment", status: "live" }, ...PHASES]
    : PHASES;
  const phaseItems = visiblePhases.map((phase) => {
    const active = phase.id === viewedPhase ? " is-active" : "";
    const status = phase.status === "live" ? "Ready" : "Planned";
    return `<li class="battle-phase${active}">
      <button type="button" class="battle-phase__button" data-battle-phase-button="${phase.id}" aria-pressed="${phase.id === viewedPhase}">
        <strong>${phase.label}</strong><span>${status}</span>
      </button>
    </li>`;
  }).join("");

  const reminderPlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  const tacticalDiscardCards = scoringReminder?.timing === "end-of-turn" &&
    state.scoring?.secondaryMissionMode === SECONDARY_MISSION_MODES.TACTICAL && reminderPlayerId
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
  const reminderMarkup = scoringReminder ? `<div class="battle-scoring-reminder__backdrop">
    <section class="battle-scoring-reminder" role="dialog" aria-modal="true" aria-labelledby="battle-scoring-reminder-title">
      <h2 id="battle-scoring-reminder-title">Scoring checkpoint</h2>
      <p>${escapeHtml(scoringReminder.label)}. Check any Primary or Secondary mission due now.</p>
      <ul>${scoringReminder.missions.map((mission) => `<li>${escapeHtml(mission)}</li>`).join("") || "<li>Review your mission cards and confirm any points earned.</li>"}</ul>
      ${tacticalDiscardForm}
      <div class="battle-scoring-reminder__actions">
        <button type="button" data-review-scoring>Review scoring</button>
        <button type="button" data-dismiss-scoring-reminder>Remind me later</button>
      </div>
    </section>
  </div>` : "";
  container.innerHTML = `<main class="battle-shell">
    ${reminderMarkup}
    <ol class="battle-shell__phases" aria-label="Battle phase navigation">${phaseItems}</ol>
    <p class="battle-shell__view-note">Viewing ${phaseLabel(viewedPhase)}. Selecting a phase changes the screen view, not the recorded game phase.</p>
    <section class="battle-shell__content" data-battle-screen></section>
  </main>`;
}

export function createBattleShell(container, {
  session,
  perspectivePlayerId = null,
  gameData = null,
  missionActions = [],
  missionDefinitions = [],
  secondaryMissionCatalog = [],
  screenFactories = SCREEN_FACTORIES
} = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("A browser container element is required.");
  }
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function") {
    throw new TypeError("A game session is required.");
  }

  let mountedPhase = null;
  let mountedScreen = null;
  let viewedPhase = session.getState()?.phase ?? "command";
  let observedGamePhase = session.getState()?.phase ?? null;
  let observedActivePlayerId = session.getState()?.activePlayer ?? session.getState()?.battle?.activePlayerId ?? null;
  let scoringReminder = null;
  let scoringReviewCheckpoint = null;
  let scoringReviewActivePlayerId = null;
  let scoringReviewPlayerId = null;
  let reminderSequence = 0;

  function destroyMountedScreen() {
    if (mountedScreen?.destroy) mountedScreen.destroy();
    mountedScreen = null;
    mountedPhase = null;
  }

  function render() {
    const state = session.getState();
    const actualPhase = state?.phase ?? null;
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
      destroyMountedScreen();
      renderShell(container, state, viewedPhase, scoringReminder);

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
          scoringCheckpointPlayerId: scoringReviewPlayerId
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

    return state;
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
    button.closest(".battle-scoring-reminder__backdrop")?.remove();
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

  function handlePhaseNavigation(event) {
    const button = event.target?.closest?.("[data-battle-phase-button]");
    if (!button || !container.contains(button)) return;
    const nextPhase = button.getAttribute("data-battle-phase-button");
    if (!PHASES.some((phase) => phase.id === nextPhase) &&
        !(nextPhase === "deployment" && session.getState()?.battle?.status === "deployment")) return;
    if (nextPhase !== "command") {
      scoringReviewCheckpoint = null;
      scoringReviewActivePlayerId = null;
      scoringReviewPlayerId = null;
    }
    viewedPhase = nextPhase;
    render();
  }

  container.addEventListener?.("click", handlePhaseNavigation);
  container.addEventListener?.("click", handleDismissScoringReminder);
  container.addEventListener?.("click", handleReviewScoring);
  container.addEventListener?.("submit", handleSubmit);
  const unsubscribe = session.subscribe(render);
  render();

  return {
    getState: () => session.getState(),
    render,
    destroy: () => {
      unsubscribe();
      container.removeEventListener?.("click", handlePhaseNavigation);
      container.removeEventListener?.("click", handleDismissScoringReminder);
      container.removeEventListener?.("click", handleReviewScoring);
      container.removeEventListener?.("submit", handleSubmit);
      destroyMountedScreen();
      container.replaceChildren();
    }
  };
}
