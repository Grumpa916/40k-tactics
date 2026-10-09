import { createChargeScreen } from "./charge-screen.js";
import { createCommandScreen } from "./command-screen.js";
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
  command: createCommandScreen,
  movement: createMovementScreen,
  shooting: createShootingScreen,
  charge: createChargeScreen,
  fight: createFightScreen
});

function phaseLabel(phase) {
  return PHASES.find((item) => item.id === phase)?.label ?? phase;
}

function renderShell(container, state, viewedPhase, scoringReminder = null) {
  const phaseItems = PHASES.map((phase) => {
    const active = phase.id === viewedPhase ? " is-active" : "";
    const status = phase.status === "live" ? "Ready" : "Planned";
    return `<li class="battle-phase${active}">
      <button type="button" class="battle-phase__button" data-battle-phase-button="${phase.id}" aria-pressed="${phase.id === viewedPhase}">
        <strong>${phase.label}</strong><span>${status}</span>
      </button>
    </li>`;
  }).join("");

  const reminderMarkup = scoringReminder ? `<div class="battle-scoring-reminder__backdrop">
    <section class="battle-scoring-reminder" role="dialog" aria-modal="true" aria-labelledby="battle-scoring-reminder-title">
      <h2 id="battle-scoring-reminder-title">Scoring checkpoint</h2>
      <p>${scoringReminder.label}. Check any Primary or Secondary mission due now.</p>
      <ul>${scoringReminder.missions.map((mission) => `<li>${mission}</li>`).join("") || "<li>Review your mission cards and confirm any points earned.</li>"}</ul>
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
      const currentActivePlayerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
      const opponentTurnJustEnded = previousPhase === "end_turn" &&
        (actualPhase === "start_turn" || actualPhase === "end_battle_round") &&
        perspectivePlayerId != null && endingPlayerId != null && endingPlayerId !== perspectivePlayerId;
      const timing = previousPhase === "command" && actualPhase === "movement"
        ? "command-phase"
        : actualPhase === "end_turn" ? "end-of-turn"
        : opponentTurnJustEnded ? "end-of-opponent-turn" : null;
      if (timing) {
        const definitionsDue = missionDefinitions.filter((definition) => definition.timing === timing);
        const reminderPlayerId = timing === "end-of-opponent-turn" ? endingPlayerId : currentActivePlayerId;
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
          missions: definitionsDue.map((definition) => definition.name)
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
          scoringCheckpoint: scoringReviewCheckpoint
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
    scoringReminder = null;
    viewedPhase = "command";
    render();
  }

  function handlePhaseNavigation(event) {
    const button = event.target?.closest?.("[data-battle-phase-button]");
    if (!button || !container.contains(button)) return;
    const nextPhase = button.getAttribute("data-battle-phase-button");
    if (!PHASES.some((phase) => phase.id === nextPhase)) return;
    viewedPhase = nextPhase;
    render();
  }

  container.addEventListener?.("click", handlePhaseNavigation);
  container.addEventListener?.("click", handleDismissScoringReminder);
  container.addEventListener?.("click", handleReviewScoring);
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
      destroyMountedScreen();
      container.replaceChildren();
    }
  };
}
