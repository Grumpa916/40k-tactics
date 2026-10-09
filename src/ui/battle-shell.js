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

function renderShell(container, state, viewedPhase) {
  const phaseItems = PHASES.map((phase) => {
    const active = phase.id === viewedPhase ? " is-active" : "";
    const status = phase.status === "live" ? "Ready" : "Planned";
    return `<li class="battle-phase${active}">
      <button type="button" class="battle-phase__button" data-battle-phase-button="${phase.id}" aria-pressed="${phase.id === viewedPhase}">
        <strong>${phase.label}</strong><span>${status}</span>
      </button>
    </li>`;
  }).join("");

  container.innerHTML = `<main class="battle-shell">
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

  function destroyMountedScreen() {
    if (mountedScreen?.destroy) mountedScreen.destroy();
    mountedScreen = null;
    mountedPhase = null;
  }

  function render() {
    const state = session.getState();
    const actualPhase = state?.phase ?? null;
    if (actualPhase !== observedGamePhase) {
      observedGamePhase = actualPhase;
      viewedPhase = actualPhase;
    }

    if (viewedPhase !== mountedPhase) {
      destroyMountedScreen();
      renderShell(container, state, viewedPhase);

      const screenContainer = container.querySelector("[data-battle-screen]");
      const factory = screenFactories[viewedPhase];

      if (factory && screenContainer) {
        mountedScreen = factory(screenContainer, {
          session,
          perspectivePlayerId,
          gameData,
          missionActions,
          missionDefinitions
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

  function handlePhaseNavigation(event) {
    const button = event.target?.closest?.("[data-battle-phase-button]");
    if (!button || !container.contains(button)) return;
    const nextPhase = button.getAttribute("data-battle-phase-button");
    if (!PHASES.some((phase) => phase.id === nextPhase)) return;
    viewedPhase = nextPhase;
    render();
  }

  container.addEventListener?.("click", handlePhaseNavigation);
  const unsubscribe = session.subscribe(render);
  render();

  return {
    getState: () => session.getState(),
    render,
    destroy: () => {
      unsubscribe();
      container.removeEventListener?.("click", handlePhaseNavigation);
      destroyMountedScreen();
      container.replaceChildren();
    }
  };
}
