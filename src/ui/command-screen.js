import { getScoringOpportunityAdvisories } from "../rules/tactical-scoring-opportunities.js";
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { getCommandPointHistory } from "../engine/command-points-ledger.js";
import { getVictoryPointHistory, getVictoryPointScore } from "../engine/victory-points-ledger.js";
import { SCORING_TIMINGS } from "../rules/mission-definition.js";
import { evaluateScoringCheckpoint, SCORING_CHECKPOINTS } from "../engine/scoring-check-coordinator.js";
import { getSecondaryMissionHistory, SECONDARY_MISSION_STATUS } from "../rules/secondary-mission-lifecycle.js";

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
  missionDefinitions = [],
  scoringCheckpoint = null,
  scoringCheckpointActivePlayerId = null
} = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("A browser container element is required.");
  }
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function") {
    throw new TypeError("A game session is required.");
  }

  let selectedSecondaryPlayerId = null;
  let secondaryMissionMessage = "";

  function recordCp(amount, reason, note) {
    const state = session.getState();
    const playerId = perspectivePlayerId ?? state.activePlayer;
    if (!playerId) return;
    session.dispatch({ type: COMMAND_TYPES.RECORD_COMMAND_POINT_CHANGE, payload: {
      playerId, amount, reason, note, turn: state.turn ?? 0, round: state.battle?.round ?? 0
    }});
  }

  function handleClick(event) {
    const target = event.target?.closest?.("[data-cp-gain], [data-cp-spend], [data-mission-award], [data-secondary-mission-add]");
    if (!target || !container.contains(target)) return;
    if (target.hasAttribute("data-cp-gain")) recordCp(1, "gain", "Manually recorded gain");
    if (target.hasAttribute("data-cp-spend")) recordCp(-1, "spend", "Manually recorded spend");
    if (target.hasAttribute("data-secondary-mission-add")) {
      const state = session.getState();
      if (state.phase !== "command") {
        secondaryMissionMessage = "Secondary missions can be entered during the Command phase only.";
        render();
        return;
      }
      const playerId = container.querySelector("[data-secondary-player]")?.value ||
        perspectivePlayerId || state.activePlayer;
      const definitionId = container.querySelector("[data-secondary-definition]")?.value;
      let definition = missionDefinitions.find((item) =>
        item.id === definitionId && item.category === "secondary");
      if (!definition) {
        const manualName = String(container.querySelector("[data-secondary-name]")?.value ?? "").trim();
        const manualTiming = container.querySelector("[data-secondary-timing]")?.value;
        const allowedTimings = [
          SCORING_TIMINGS.COMMAND_PHASE,
          SCORING_TIMINGS.END_OF_TURN,
          SCORING_TIMINGS.END_OF_OPPONENT_TURN,
          SCORING_TIMINGS.END_OF_BATTLE
        ];
        if (!manualName || !allowedTimings.includes(manualTiming)) {
          secondaryMissionMessage = "Choose a catalog mission or enter a card name and its scoring checkpoint.";
          render();
          return;
        }
        const slug = manualName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "secondary";
        definition = {
          id: "manual-" + slug + "-" + (state.battle?.round ?? 0) + "-" +
            (state.turn ?? 0) + "-" + (getSecondaryMissionHistory(state).length + 1),
          name: manualName,
          category: "secondary",
          timing: manualTiming,
          conditions: [],
          manualEntry: true
        };
      }
      if (!playerId) {
        secondaryMissionMessage = "Select a player before adding a secondary mission.";
        render();
        return;
      }
      try {
        session.dispatch({ type: COMMAND_TYPES.DRAW_SECONDARY_MISSION, payload: {
          definition, playerId, round: state.battle?.round ?? 0, turn: state.turn ?? 0
        }});
        selectedSecondaryPlayerId = playerId;
        secondaryMissionMessage = "Mission added to the selected player's active secondary missions.";
        render();
      } catch (error) {
        secondaryMissionMessage = error?.message ?? String(error);
        render();
      }
      return;
    }
    if (target.hasAttribute("data-mission-award")) {
      const definitionId = target.getAttribute("data-mission-award");
      const definition = missionDefinitions.find((item) => item.id === definitionId);
      const state = session.getState();
      const scoringPlayerId = perspectivePlayerId ?? state.activePlayer;
      const round = state.battle?.round ?? 0;
      const turn = state.turn ?? 0;
      const opportunityKey = [round, turn, scoringPlayerId].join(":");
      const alreadyRecorded = getVictoryPointHistory(state, scoringPlayerId).some((entry) =>
        entry.missionDefinitionId === definitionId && entry.opportunityKey === opportunityKey
      );
      if (!definition || !definition.victoryPoints || !scoringPlayerId || alreadyRecorded) return;
      session.dispatch({ type: COMMAND_TYPES.RECORD_VICTORY_POINTS, payload: {
        playerId: scoringPlayerId,
        amount: definition.victoryPoints,
        reason: definition.name,
        missionDefinitionId: definition.id,
        category: definition.category,
        opportunityKey,
        turn,
        round
      }});
    }
  }

  function handleChange(event) {
    const target = event.target;
    if (target?.matches?.("[data-secondary-player]")) {
      selectedSecondaryPlayerId = target.value;
      secondaryMissionMessage = "";
      render();
    }
  }

  function handleSubmit(event) {
    const form = event.target?.closest?.("[data-vp-form]");
    if (!form || !container.contains(form)) return;
    event.preventDefault();
    const state = session.getState();
    const formData = new FormData(form);
    const playerId = String(formData.get("vp-player") ?? "");
    const amount = Number(formData.get("vp-amount"));
    const reason = String(formData.get("vp-reason") ?? "").trim();
    if (!playerId || !Number.isInteger(amount) || amount <= 0 || !reason) return;
    session.dispatch({ type: COMMAND_TYPES.RECORD_VICTORY_POINTS, payload: {
      playerId, amount, reason, turn: state.turn ?? 0, round: state.battle?.round ?? 0
    }});
  }

  function render() {
    const state = session.getState();
    const playerId = perspectivePlayerId ?? state.activePlayer;
    const players = Array.isArray(state.players) ? state.players : [];
    if (!selectedSecondaryPlayerId || !players.some((player) => player.id === selectedSecondaryPlayerId)) {
      selectedSecondaryPlayerId = perspectivePlayerId ?? state.activePlayer ?? players[0]?.id ?? null;
    }
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
        scoring = advisory.due.length ? advisory.due.map((item) => {
          const definition = missionDefinitions.find((candidate) => candidate.id === item.definitionId);
          const round = state.battle?.round ?? 0;
          const turn = state.turn ?? 0;
          const opportunityKey = [round, turn, playerId].join(":");
          const alreadyRecorded = getVictoryPointHistory(state, playerId).some((entry) =>
            entry.missionDefinitionId === item.definitionId && entry.opportunityKey === opportunityKey
          );
          const confirmButton = item.opportunity?.eligible && definition?.victoryPoints && playerId
            ? (alreadyRecorded
              ? '<p><strong>Scoring recorded for this turn.</strong></p>'
              : '<button type="button" data-mission-award="' + escapeHtml(item.definitionId) + '">Confirm +' +
                escapeHtml(definition.victoryPoints) + ' VP</button>')
            : '';
          return '<article class="command-scoring"><strong>' + escapeHtml(definition?.name ?? item.definitionId) +
            '</strong>' + (definition?.category ? '<span class="command-scoring__category">' +
              escapeHtml(definition.category === "primary" ? "Primary mission" : "Secondary mission") + '</span>' : '') +
            '<span class="' + (item.opportunity?.eligible ? 'is-available' : 'is-unavailable') + '">' +
            (item.opportunity?.eligible ? 'Evidence supports eligibility' : 'Conditions not all satisfied') +
            '</span>' + (definition?.victoryPoints ? '<p>Configured award: ' + escapeHtml(definition.victoryPoints) + ' VP</p>' : '') +
            '<ul>' + (item.opportunity?.conditions ?? []).map((condition) =>
              '<li>' + escapeHtml(condition.evidence) + ': ' +
              (condition.eligible ? 'satisfied' : 'not satisfied') + '</li>'
            ).join("") + '</ul>' + confirmButton +
            '<small>Confirm only after checking the mission rules and table state.</small></article>';
        }).join("") : '<p>No configured mission definitions are due to be evaluated in the Command phase.</p>';
      } catch (error) {
        scoring = '<p role="alert">Scoring advisory unavailable: ' + escapeHtml(error?.message ?? error) + '</p>';
      }
    }

    let checkpointReview = "";
    const checkpoint = scoringCheckpoint ?? SCORING_CHECKPOINTS.COMMAND_PHASE;
    const checkpointLabels = {
      [SCORING_CHECKPOINTS.COMMAND_PHASE]: "End of Command phase",
      [SCORING_CHECKPOINTS.END_OF_TURN]: "End of turn",
      [SCORING_CHECKPOINTS.END_OF_OPPONENT_TURN]: "End of opponent's turn",
      [SCORING_CHECKPOINTS.END_OF_BATTLE]: "End of battle"
    };
    try {
      const review = evaluateScoringCheckpoint(state, {
        checkpoint,
        scoringPlayerId: playerId,
        activePlayerId: scoringCheckpointActivePlayerId ?? state.activePlayer ?? state.battle?.activePlayerId ?? null,
        primaryDefinitions: missionDefinitions.filter((definition) => definition?.category !== "secondary")
      });
      const rows = [
        ...review.primary.map((item) => ({ ...item, categoryLabel: "Primary mission" })),
        ...review.secondary.map((item) => ({ ...item, categoryLabel: "Active secondary card" }))
      ];
      checkpointReview = rows.length
        ? rows.map((item) => '<article class="command-scoring"><strong>' + escapeHtml(item.definitionName ?? item.definitionId) +
          '</strong><span class="command-scoring__category">' + item.categoryLabel + '</span><span class="' +
          (item.result.eligible ? 'is-available' : 'is-unavailable') + '">' +
          (item.result.eligible ? 'Evidence supports eligibility' : 'Conditions not all satisfied') + '</span><ul>' +
          (item.result.conditions ?? []).map((condition) => '<li>' + escapeHtml(condition.evidence) + ': ' +
            (condition.eligible ? 'satisfied' : 'not satisfied') + '</li>').join("") +
          '</ul></article>').join("")
        : '<p>No active missions are configured for this checkpoint.</p>';
    } catch (error) {
      checkpointReview = '<p role="alert">Scoring checkpoint review unavailable: ' +
        escapeHtml(error?.message ?? error) + '</p>';
    }
    checkpointReview = '<section class="command-checkpoint-review"><h2>' +
      escapeHtml(checkpointLabels[checkpoint] ?? checkpoint) + ' scoring review</h2>' +
      '<p>Review eligibility evidence and confirm points manually. This review does not award VP or change card status.</p>' +
      checkpointReview + '</section>';

    const secondaryHistory = getSecondaryMissionHistory(state);
    const secondaryDefinitions = missionDefinitions.filter((definition) => definition?.category === "secondary");
    const activeSecondaryForSelectedPlayer = secondaryHistory.filter((item) =>
      item.playerId === selectedSecondaryPlayerId && item.status === SECONDARY_MISSION_STATUS.ACTIVE);
    const activeSecondaryIds = new Set(activeSecondaryForSelectedPlayer.map((item) => item.definitionId));
    const selectableSecondaryDefinitions = secondaryDefinitions.filter((definition) => !activeSecondaryIds.has(definition.id));
    const secondaryPlayerOptions = players.map((player) =>
      '<option value="' + escapeHtml(player.id) + '"' +
      (player.id === selectedSecondaryPlayerId ? ' selected' : '') + '>' +
      escapeHtml(player.name ?? player.id) + '</option>'
    ).join("");
    const secondaryDefinitionOptions = '<option value="">Enter a mission manually</option>' +
      selectableSecondaryDefinitions.map((definition) =>
        '<option value="' + escapeHtml(definition.id) + '">' + escapeHtml(definition.name ?? definition.id) + '</option>'
      ).join("");
    const secondaryHistoryMarkup = secondaryHistory.length
      ? secondaryHistory.slice().reverse().map((item) => '<li><strong>' +
        escapeHtml(item.definition?.name ?? item.definitionId) + '</strong> — ' +
        escapeHtml(playerName(state, item.playerId)) + ' · ' + escapeHtml(item.status) +
        ' <small>(entered Round ' + escapeHtml(item.drawnRound) + ', turn ' + escapeHtml(item.drawnTurn) + ')</small></li>'
      ).join("")
      : '<li>No secondary missions have been entered yet.</li>';
    const manualTimingOptions = [
      [SCORING_TIMINGS.COMMAND_PHASE, "End of Command phase"],
      [SCORING_TIMINGS.END_OF_TURN, "End of turn"],
      [SCORING_TIMINGS.END_OF_OPPONENT_TURN, "End of opponent's turn"],
      [SCORING_TIMINGS.END_OF_BATTLE, "End of battle"]
    ].map(([value, label]) => '<option value="' + value + '">' + label + '</option>').join("");
    const secondaryEntryMarkup = state.phase !== "command"
      ? '<p>Manual secondary-mission entry is available during the Command phase. Current game phase: ' +
        escapeHtml(state.phase ?? "unknown") + '.</p>'
      : !players.length
        ? '<p>Add players before entering secondary missions.</p>'
        : '<form data-secondary-mission-form><div class="command-vp-form">' +
          '<label>Player<select data-secondary-player>' + secondaryPlayerOptions + '</select></label>' +
          '<label>Mission from catalog<select data-secondary-definition>' + secondaryDefinitionOptions + '</select></label>' +
          '<label>Or enter card name<input data-secondary-name type="text" maxlength="160" placeholder="Name printed on your card"></label>' +
          '<label>Card scoring checkpoint<select data-secondary-timing>' + manualTimingOptions + '</select></label>' +
          '<button type="button" data-secondary-mission-add>Record selected mission</button></div></form>' +
          '<p>Select a supplied definition or enter the card name and its scoring checkpoint from the printed rules. Manual entries without configured scoring conditions remain advisory-only and require your own rules check; no VP is awarded here.</p>';
    const secondaryMissionManager = '<section class="command-secondary-missions"><h2>Manual secondary-mission entry</h2>' +
      '<p>Enter missions manually during the Command phase. No automatic draw or selection occurs.</p>' +
      secondaryEntryMarkup +
      (secondaryMissionMessage ? '<p role="status">' + escapeHtml(secondaryMissionMessage) + '</p>' : '') +
      '<h3>Secondary mission history</h3><ol class="command-ledger-history">' + secondaryHistoryMarkup + '</ol></section>';

    const cpHistory = getCommandPointHistory(state, playerId).slice(-5).reverse();
    const cpHistoryMarkup = cpHistory.length ? cpHistory.map((entry) =>
      '<li><strong>' + escapeHtml(entry.amount > 0 ? '+' + entry.amount : entry.amount) +
      ' CP</strong> · ' + escapeHtml(entry.reason) + (entry.note ? ' — ' + escapeHtml(entry.note) : '') +
      ' <small>(balance ' + escapeHtml(entry.balanceAfter) + ')</small></li>'
    ).join("") : '<li>No Command Point changes recorded yet.</li>';

    const playerOptions = players.map((player) =>
      '<option value="' + escapeHtml(player.id) + '"' + (player.id === (playerId ?? players[0]?.id) ? ' selected' : '') +
      '>' + escapeHtml(player.name ?? player.id) + '</option>'
    ).join("");
    const scoreCards = players.map((player) =>
      '<article class="command-score-card"><span>' + escapeHtml(player.name ?? player.id) +
      '</span><strong>' + escapeHtml(getVictoryPointScore(state, player.id)) + ' VP</strong></article>'
    ).join("");
    const vpHistory = getVictoryPointHistory(state).slice(-6).reverse();
    const vpHistoryMarkup = vpHistory.length ? vpHistory.map((entry) =>
      '<li><strong>+' + escapeHtml(entry.amount) + ' VP</strong> · ' + escapeHtml(playerName(state, entry.playerId)) +
      ' — ' + escapeHtml(entry.reason) + ' <small>(Round ' + escapeHtml(entry.round) +
      ', turn ' + escapeHtml(entry.turn) + '; total ' + escapeHtml(entry.scoreAfter) + ')</small></li>'
    ).join("") : '<li>No victory points recorded yet.</li>';

    container.innerHTML = '<main class="command-screen"><header><div><div class="command-kicker">LIVE BATTLE</div>' +
      '<h1>Command Phase</h1><p>Round ' + escapeHtml(state.battle?.round ?? "—") + ' · Turn ' +
      escapeHtml(state.turn ?? "—") + ' · ' + escapeHtml(playerName(state, playerId)) +
      '</p></div><div class="command-points"><span>Command Points</span><strong>' +
      escapeHtml(commandPointsFor(state, playerId)) + '</strong></div></header>' +
      '<p class="command-note">Review command points, objective control and command-phase scoring evidence. Mission scoring remains a table-side decision; the app does not award points automatically.</p>' +
      '<section><h2>Victory Point score</h2><div class="command-scoreboard">' + (scoreCards || '<p>Add players to the battle to track scores.</p>') + '</div>' +
      '<p>Only record points after confirming the award at the table. Eligibility advice never changes the score.</p>' +
      (players.length ? '<form class="command-vp-form" data-vp-form><label>Player<select name="vp-player" required>' + playerOptions +
      '</select></label><label>VP awarded<input name="vp-amount" type="number" min="1" step="1" value="5" required></label>' +
      '<label>Reason / mission scoring<input name="vp-reason" type="text" maxlength="160" placeholder="e.g. Confirmed primary objective" required></label>' +
      '<button type="submit">Confirm VP award</button></form>' : '<p>Configure both players before recording awards.</p>') +
      '<h3>Recent confirmed awards</h3><ol class="command-ledger-history">' + vpHistoryMarkup + '</ol></section>' +
      '<section><h2>Command Point ledger</h2><p>Record actual gains and spending. Each entry updates the balance and battle history; the app does not assume a gain occurs automatically.</p>' +
      '<div class="command-ledger-actions"><button type="button" data-cp-gain>Record +1 CP</button><button type="button" data-cp-spend>Record −1 CP</button></div>' +
      '<ol class="command-ledger-history">' + cpHistoryMarkup + '</ol></section>' +
      '<section><h2>Objective control</h2><div class="command-objectives">' + objectiveCards + '</div></section>' +
      secondaryMissionManager +
      '<section><h2>Command-phase scoring review</h2>' + scoring + '</section>' + checkpointReview + '</main>'; 
  }

  container.addEventListener?.("click", handleClick);
  container.addEventListener?.("change", handleChange);
  container.addEventListener?.("submit", handleSubmit);
  const unsubscribe = session.subscribe(render);
  render();
  return { render, destroy() {
    unsubscribe();
    container.removeEventListener?.("click", handleClick);
    container.removeEventListener?.("change", handleChange);
    container.removeEventListener?.("submit", handleSubmit);
    container.replaceChildren();
  }};
}
