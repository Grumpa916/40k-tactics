import { PHASES } from './battle-screen-registry.js';
import { renderMissionReviewToggle } from './mission-review-panel.js';
import { renderAppThemeToggle } from './app-theme-preference.js';

export function renderShellHeader(state, { viewedPhase, layoutMode, missionReviewOpen, appTheme, statusSummary, tabletopExperiment }) {
  const setupTab = { id: "setup", label: "Setup & Saves", status: "live" };
  const visiblePhases = [setupTab, ...(state.battle?.status === "deployment"
    ? [{ id: "deployment", label: "Deployment", status: "live" }, ...PHASES]
    : PHASES), { id: "review", label: "Game review", status: "live" }];
  let phaseItems = visiblePhases.map((phase) => {
    const active = phase.id === viewedPhase ? " is-active" : "";
    const status = phase.status === "live" ? "Ready" : "Planned";
    return '<li class="battle-phase' + active + '">' +
      '<button type="button" class="battle-phase__button" data-battle-phase-button="' + phase.id +
      '" aria-pressed="' + String(phase.id === viewedPhase) + '">' +
      '<strong>' + phase.label + '</strong><span>' +
      (phase.id === "setup" ? "Pre-game & cloud saves" : status) +
      '</span></button></li>';
  }).join("") + renderMissionReviewToggle({
    visible: layoutMode !== "tabletop" && PHASES.some(phase => phase.id === viewedPhase),
    open: missionReviewOpen
  });

  if (layoutMode !== 'tabletop') phaseItems += '<li class="battle-phase"><button type="button" data-toggle-rules-reminders aria-expanded="false">Rules</button></li>' +
    '<li class="battle-phase battle-phase--theme">' + renderAppThemeToggle(appTheme) + '</li>';

  const layoutSwitch = "";
  return tabletopExperiment
    ? '<header class="battle-shell__tabletop-header">' +
      '<div class="battle-shell__tabletop-topline">' + statusSummary + '</div>' +
      '<details class="battle-shell__live-menu"><summary aria-label="More battle views">⋯</summary><div>' +
      '<button type="button" data-battle-phase-button="setup">Setup &amp; Saves</button>' +
      '<button type="button" data-battle-phase-button="review">Game review</button></div></details>' +
      layoutSwitch + '</header>'
    : '<ol class="battle-shell__phases" aria-label="Battle phase navigation">' + phaseItems + '</ol>' +
      statusSummary + layoutSwitch;
}
