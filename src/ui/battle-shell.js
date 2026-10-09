import { createChargeScreen } from "./charge-screen.js";
import { createFightScreen } from "./fight-screen.js";
import { createShootingScreen } from "./shooting-screen.js";

const PHASES = Object.freeze([
  { id: "command", label: "Command", status: "planned" },
  { id: "movement", label: "Movement", status: "planned" },
  { id: "shooting", label: "Shooting", status: "live" },
  { id: "charge", label: "Charge", status: "live" },
  { id: "fight", label: "Fight", status: "live" }
]);

const SCREEN_FACTORIES = Object.freeze({
  shooting: createShootingScreen,
  charge: createChargeScreen,
  fight: createFightScreen
});

function renderShell(container, state) {
  const activePhase = state?.phase ?? null;
  const phaseItems = PHASES.map((phase) => {
    const active = phase.id === activePhase ? " is-active" : "";
    const status = phase.status === "live" ? "Ready" : "Planned";
    return `<li class="battle-phase${active}" data-battle-phase="${phase.id}">
      <strong>${phase.label}</strong><span>${status}</span>
    </li>`;
  }).join("");

  container.innerHTML = `<main class="battle-shell">
    <ol class="battle-shell__phases" aria-label="Battle phases">${phaseItems}</ol>
    <section class="battle-shell__content" data-battle-screen></section>
  </main>`;
}

export function createBattleShell(container, {
  session,
  perspectivePlayerId = null,
  gameData = null,
  missionActions = [],
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

  function destroyMountedScreen() {
    if (mountedScreen?.destroy) mountedScreen.destroy();
    mountedScreen = null;
    mountedPhase = null;
  }

  function render() {
    const state = session.getState();
    const phase = state?.phase ?? null;

    if (phase !== mountedPhase) {
      destroyMountedScreen();
      renderShell(container, state);

      const screenContainer = container.querySelector("[data-battle-screen]");
      const factory = screenFactories[phase];

      if (factory && screenContainer) {
        mountedScreen = factory(screenContainer, {
          session,
          perspectivePlayerId,
          gameData,
          missionActions
        });
        mountedPhase = phase;
      } else {
        screenContainer.innerHTML = `<div class="battle-shell__placeholder">
          <h2>${phaseLabel(phase)} Phase</h2>
          <p>This phase is reserved in the shared battle flow and will be added later.</p>
        </div>`;
        mountedPhase = phase;
      }
    } else {
      const phaseHeading = container.querySelector(".battle-shell__header h1");
      if (phaseHeading) phaseHeading.textContent = `${phaseLabel(phase)} Phase`;
    }

    return state;
  }

  const unsubscribe = session.subscribe(render);
  render();

  return {
    getState: () => session.getState(),
    render,
    destroy: () => {
      unsubscribe();
      destroyMountedScreen();
      container.replaceChildren();
    }
  };
}
