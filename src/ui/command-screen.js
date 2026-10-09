import { getScoringOpportunityAdvisories } from "../rules/tactical-scoring-opportunities.js";
import { SCORING_TIMINGS } from "../rules/mission-definition.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function playerName(state, playerId) {
  return (Array.isArray(state.players) ? state.players : []).find((player) => player.id === playerId)?.name ??
    (playerId === state.activePlayer ? "Active player" : playerId ?? "Unknown");
}

function objectiveStatus(objective, state, playerId) {
  const control = objective.control;
  if (!control || control.controlState === "uncontrolled") return "Uncontrolled";
  if (control.controlState === "contested") {
    return control.contestingPlayerIds?.includes(playerId) ? "Contested by you" : "Contested";
  }
  return control.controllerId === playerId ? "Controlled by you" :
    "Controlled by " + playerName(state, control.controllerId);
}

function commandPointsFor(state, playerId) {
  const value = state.commandPoints?.[playerId];
  if (Number.isFinite(value)) return String(value);
  if (Number.isFinite(value?.current)) return String(value.current);
  return "Not tracked";
}

export function createCommandScreen(container, {
  session,
  perspectivePlayerId = null,
  missionDefinitions = []
} = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("A browser container element is required.");
  }
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function") {
    throw new TypeError("A game session is required.");
  }

  function render() {
    const state = session.getState();
    const playerId = perspectivePlayerId ?? state.activePlayer;
    const objectives = Array.isArray(state.objectives) ? state.objectives : [];
    const objectiveCards = objectives.length ? objectives.map((objective) =>
      '<article class="command-objective"><strong>' + escapeHtml(objective.name ?? objective.label ?? objective.id) +
      '</strong><span>' + escapeHtml(objectiveStatus(objective, state, playerId)) + '</span></article>'
    ).join("") : '<p>No objectives have been configured for this battle.</p>';

    let scoring = '<p>No mission scoring definitions were supplied. No score is being inferred or awarded.</p>';
    if (missionDefinitions.length) {
      try {
        const advisory = getScoringOpportunityAdvisories(state, {
          definitions: missionDefinitions,
          timing: SCORING_TIMINGS.COMMAND_PHASE
        });
        scoring = advisory.due.length ? advisory.due.map((item) =>
          '<article class="command-scoring"><strong>' + escapeHtml(
            missionDefinitions.find((definition) => definition.id === item.definitionId)?.name ?? item.definitionId
          ) + '</strong><span class="' + (item.opportunity?.eligible ? 'is-available' : 'is-unavailable') + '">' +
          (item.opportunity?.eligible ? 'Evidence supports eligibility' : 'Conditions not all satisfied') +
          '</span><ul>' + (item.opportunity?.conditions ?? []).map((condition) =>
            '<li>' + escapeHtml(condition.evidence) + ': ' +
            (condition.eligible ? 'satisfied' : 'not satisfied') + '</li>'
          ).join("") + '</ul><small>Review the mission rules and confirm scoring at the table. This advisory does not award points.</small></article>'
        ).join("") : '<p>No configured mission definitions are due to be evaluated in the Command phase.</p>';
      } catch (error) {
        scoring = '<p role="alert">Scoring advisory unavailable: ' + escapeHtml(error?.message ?? error) + '</p>';
      }
    }

    container.innerHTML = '<main class="command-screen"><header><div><div class="command-kicker">LIVE BATTLE</div>' +
      '<h1>Command Phase</h1><p>Round ' + escapeHtml(state.battle?.round ?? "—") + ' · Turn ' +
      escapeHtml(state.turn ?? "—") + ' · ' + escapeHtml(playerName(state, playerId)) +
      '</p></div><div class="command-points"><span>Command Points</span><strong>' +
      escapeHtml(commandPointsFor(state, playerId)) + '</strong></div></header>' +
      '<p class="command-note">Review command points, objective control and command-phase scoring evidence. Mission scoring remains a table-side decision; the app does not award points automatically.</p>' +
      '<section><h2>Objective control</h2><div class="command-objectives">' + objectiveCards + '</div></section>' +
      '<section><h2>Command-phase scoring review</h2>' + scoring + '</section></main>';
  }

  const unsubscribe = session.subscribe(render);
  render();
  return { render, destroy() { unsubscribe(); container.replaceChildren(); } };
}
