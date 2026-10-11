import { getScoringOpportunityAdvisories } from "../rules/tactical-scoring-opportunities.js";
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { getCommandPointBalance, getCommandPointHistory } from "../engine/command-points-ledger.js";
import { getLatestUndoableVictoryPointsAward, getVictoryPointHistory, getVictoryPointScore, hasEffectiveVictoryPointOpportunity } from "../engine/victory-points-ledger.js";
import { SCORING_TIMINGS } from "../rules/mission-definition.js";
import { evaluateScoringCheckpoint, SCORING_CHECKPOINTS } from "../engine/scoring-check-coordinator.js";
import { getSecondaryMissionHistory, SECONDARY_MISSION_STATUS } from "../rules/secondary-mission-lifecycle.js";
import { renderBattlefieldMap } from "./battlefield-map.js";

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

function vpCapDescription(cap) {
  return ({
    "primary-turn": "15 VP primary turn cap",
    "primary-game": "45 VP primary game cap",
    "secondary-turn": "15 VP secondary turn cap",
    "secondary-game": "45 VP secondary game cap",
    "fixed-secondary-card": "20 VP Fixed Secondary card cap"
  })[cap] ?? "mission scoring cap";
}

export function createCommandScreen(container, {
  session,
  perspectivePlayerId = null,
  missionDefinitions = [],
  secondaryMissionCatalog = [],
  scoringCheckpoint = null,
  scoringCheckpointActivePlayerId = null,
  scoringCheckpointPlayerId = null
} = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("A browser container element is required.");
  }
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function") {
    throw new TypeError("A game session is required.");
  }

  let selectedSecondaryPlayerId = null;
  let secondaryMissionMessage = "";
  let vpMessage = "";
  let objectiveMessage = "";

  function recordCp(amount, reason, note) {
    const state = session.getState();
    const playerId = perspectivePlayerId ?? state.activePlayer;
    if (!playerId) return;
    session.dispatch({ type: COMMAND_TYPES.RECORD_COMMAND_POINT_CHANGE, payload: {
      playerId, amount, reason, note, turn: state.turn ?? 0, round: state.battle?.round ?? 0
    }});
  }

  function handleClick(event) {
    const target = event.target?.closest?.("[data-cp-gain], [data-cp-spend], [data-mission-award], [data-secondary-mission-add], [data-vp-undo], [data-objective-control-set]");
    if (!target || !container.contains(target)) return;
    if (target.hasAttribute("data-vp-undo")) {
      const state = session.getState();
      const award = getLatestUndoableVictoryPointsAward(state);
      if (!award) {
        vpMessage = "No VP award is currently safe to undo.";
        render();
        return;
      }
      try {
        session.dispatch({ type: COMMAND_TYPES.UNDO_LATEST_VICTORY_POINTS_AWARD, payload: {
          playerId: award.playerId,
          reason: "Corrected latest VP entry",
          turn: state.turn ?? 0,
          round: state.battle?.round ?? 0
        }});
        vpMessage = "Undid latest VP entry (" + (award.amount > 0 ? "+" : "−") + Math.abs(award.amount) +
          " VP) for " + playerName(state, award.playerId) + ".";
      } catch (error) {
        vpMessage = error?.message ?? String(error);
      }
      render();
      return;
    }
    if (target.hasAttribute("data-objective-control-set")) {
      const state = session.getState();
      const objectiveId = target.getAttribute("data-objective-id");
      const selectedControl = target.getAttribute("data-objective-control-set");
      const players = Array.isArray(state.players) ? state.players : [];
      const playerId = perspectivePlayerId ?? state.activePlayer ?? players[0]?.id ?? null;
      const opponent = players.find((player) => player.id !== playerId);
      const objective = (state.objectives ?? []).find((item) => item?.id === objectiveId);
      if (!objective) {
        objectiveMessage = "Objective not found. Refresh the Command screen and try again.";
        render();
        return;
      }
      let controllerId = null;
      let contestingPlayerIds = [];
      let controlState = selectedControl;
      if (selectedControl === "controlled") {
        if (!playerId) {
          objectiveMessage = "Select a player before recording objective control.";
          render();
          return;
        }
        controllerId = playerId;
      } else if (selectedControl === "opponent-controlled") {
        if (!playerId || !opponent) {
          objectiveMessage = "Two configured players are required to record opponent control.";
          render();
          return;
        }
        controllerId = opponent.id;
        controlState = "controlled";
      } else if (selectedControl === "contested") {
        if (players.length < 2) {
          objectiveMessage = "Two configured players are required to record a contested objective.";
          render();
          return;
        }
        contestingPlayerIds = players.map((player) => player.id);
      } else if (selectedControl !== "uncontrolled") {
        objectiveMessage = "Unknown objective-control selection.";
        render();
        return;
      }
      try {
        session.dispatch({ type: COMMAND_TYPES.RECORD_OBJECTIVE_CONTROL, payload: {
          objectiveId, controllerId, contestingPlayerIds, controlState
        }});
        objectiveMessage = objective.name + ": " + ({
          controlled: "control recorded for you",
          "opponent-controlled": "control recorded for opponent",
          contested: "contested",
          uncontrolled: "uncontrolled"
        })[selectedControl] + ".";
      } catch (error) {
        objectiveMessage = error?.message ?? String(error);
      }
      render();
      return;
    }
    if (target.hasAttribute("data-cp-gain")) recordCp(1, "gain", "Manually recorded gain");
    if (target.hasAttribute("data-cp-spend")) recordCp(-1, "spend", "Manually recorded spend");
    if (target.hasAttribute("data-secondary-mission-add")) {
      const state = session.getState();
      if (state.phase !== "command") {
        secondaryMissionMessage = "Secondary missions can be entered during the Command phase only.";
        render();
        return;
      }
      const missionMode = state.scoring?.secondaryMissionMode;
      if (!missionMode) {
        secondaryMissionMessage = "Choose Fixed or Tactical mode before entering secondary cards.";
        render();
        return;
      }
      const playerId = container.querySelector("[data-secondary-player]")?.value ||
        perspectivePlayerId || state.activePlayer;
      const round = state.battle?.round ?? 0;
      const turn = state.turn ?? 0;
      const currentActivePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
      const priorSecondaryHistory = getSecondaryMissionHistory(state);
      if (missionMode === "tactical") {
        if (playerId !== currentActivePlayerId) {
          secondaryMissionMessage = "Tactical cards can only be drawn for the active player during that player's Command phase.";
          render();
          return;
        }
        const drawnThisCommandPhase = priorSecondaryHistory.filter((item) =>
          item.playerId === playerId && item.drawnRound === round && item.drawnTurn === turn &&
          item.isRedrawReplacement !== true
        ).length;
        const pendingRedraw = state.scoring?.secondaryMissionRedrawPendingByPlayer?.[playerId];
        const replacementPending = Boolean(pendingRedraw &&
          pendingRedraw.round === round && pendingRedraw.turn === turn);
        if (drawnThisCommandPhase >= 2 && !replacementPending) {
          secondaryMissionMessage = "Two Tactical cards have already been recorded for this Command phase. Use New Orders for the one-time replacement draw.";
          render();
          return;
        }
      } else if (missionMode === "fixed") {
        const fixedCards = priorSecondaryHistory.filter((item) =>
          item.playerId === playerId && item.definition?.missionMode === "fixed"
        ).length;
        if (fixedCards >= 2) {
          secondaryMissionMessage = "Each player selects only two Fixed secondary cards for the battle.";
          render();
          return;
        }
      }
      const definitionId = container.querySelector("[data-secondary-definition]")?.value;
      const configuredDefinition = missionDefinitions.find((item) =>
        item.id === definitionId && item.category === "secondary");
      const selectedCatalogDefinition = secondaryMissionCatalog.find((item) =>
        item.id === definitionId && item.category === "secondary");
      const manualName = String(container.querySelector("[data-secondary-name]")?.value ?? "").trim();
      const manualTiming = container.querySelector("[data-secondary-timing]")?.value;
      if (selectedCatalogDefinition && !selectedCatalogDefinition.availableModes?.includes(missionMode)) {
        secondaryMissionMessage = "That card is not available in the selected " + missionMode + " mode.";
        render();
        return;
      }
      const allowedTimings = [
        SCORING_TIMINGS.COMMAND_PHASE,
        SCORING_TIMINGS.END_OF_TURN,
        SCORING_TIMINGS.END_OF_OPPONENT_TURN,
        SCORING_TIMINGS.END_OF_BATTLE
      ];
      let definition;
      if (configuredDefinition) {
        definition = configuredDefinition;
      } else if (selectedCatalogDefinition) {
        if ((!Array.isArray(selectedCatalogDefinition.scoringWindows) ||
             selectedCatalogDefinition.scoringWindows.length === 0) &&
            !allowedTimings.includes(manualTiming)) {
          secondaryMissionMessage = "This card has no verified scoring-window data yet. Choose its checkpoint from the physical card.";
          render();
          return;
        }
        definition = {
          ...selectedCatalogDefinition,
          timing: selectedCatalogDefinition.scoringWindows?.[0]?.timing ?? manualTiming,
          conditions: [],
          manualEntry: true
        };
      } else {
        if (!manualName || !allowedTimings.includes(manualTiming)) {
          secondaryMissionMessage = "Choose a catalog mission or enter a card name and its scoring checkpoint.";
          render();
          return;
        }
        if (missionMode === "fixed") {
          const normalizedName = manualName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
          const fixedNames = secondaryMissionCatalog
            .filter((item) => item.category === "secondary" && item.fixedAvailable)
            .map((item) => item.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
          if (!fixedNames.includes(normalizedName)) {
            secondaryMissionMessage = "Only cards marked as Fixed-available in the catalog can be entered in Fixed mode.";
            render();
            return;
          }
        }
        const normalizedName = manualName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        const matchingCatalogDefinition = secondaryMissionCatalog.find((item) =>
          item.category === "secondary" &&
          item.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === normalizedName);
        if (matchingCatalogDefinition) {
          if (!matchingCatalogDefinition.availableModes?.includes(missionMode)) {
            secondaryMissionMessage = "That card is not available in the selected " + missionMode + " mode.";
            render();
            return;
          }
          definition = {
            ...matchingCatalogDefinition,
            timing: matchingCatalogDefinition.scoringWindows?.[0]?.timing ?? manualTiming,
            conditions: [],
            manualEntry: true
          };
        } else {
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
      }
      if (!playerId) {
        secondaryMissionMessage = "Select a player before adding a secondary mission.";
        render();
        return;
      }
      try {
        session.dispatch({ type: COMMAND_TYPES.DRAW_SECONDARY_MISSION, payload: {
          definition, playerId, round, turn
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
      const alreadyRecorded = hasEffectiveVictoryPointOpportunity(state, scoringPlayerId, definitionId, opportunityKey);
      if (!definition || !definition.victoryPoints || !scoringPlayerId || alreadyRecorded) return;
      session.dispatch({ type: COMMAND_TYPES.RECORD_VICTORY_POINTS, payload: {
        playerId: scoringPlayerId,
        amount: definition.victoryPoints,
        reason: definition.name,
        missionDefinitionId: definition.id,
        category: definition.category,
        ...(definition.missionMode ? { missionMode: definition.missionMode } : {}),
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
      return;
    }
    if (target?.matches?.("[data-secondary-mode]")) {
      if (!target.value) return;
      try {
        session.dispatch({ type: COMMAND_TYPES.SET_SECONDARY_MISSION_MODE, payload: { mode: target.value } });
        secondaryMissionMessage = "Battle-wide secondary mode set to " + target.value + ".";
      } catch (error) {
        secondaryMissionMessage = error?.message ?? String(error);
      }
      render();
    }
  }

  function handleSubmit(event) {
    const redrawForm = event.target?.closest?.("[data-secondary-redraw-form]");
    if (redrawForm && container.contains(redrawForm)) {
      event.preventDefault();
      const state = session.getState();
      const playerId = state.activePlayer ?? state.battle?.activePlayerId;
      const formData = new FormData(redrawForm);
      const instanceId = String(formData.get("secondary-redraw-card") ?? "");
      if (!playerId || !instanceId) {
        secondaryMissionMessage = "Select one of your active Tactical cards for New Orders.";
        render();
        return;
      }
      try {
        session.dispatch({ type: COMMAND_TYPES.USE_SECONDARY_MISSION_REDRAW, payload: {
          playerId, instanceId, round: state.battle?.round ?? 0, turn: state.turn ?? 0
        }});
        secondaryMissionMessage = "New Orders used: 1 CP spent and the selected card discarded. Record the replacement card below.";
      } catch (error) {
        secondaryMissionMessage = error?.message ?? String(error);
      }
      render();
      return;
    }
    const secondaryForm = event.target?.closest?.("[data-secondary-vp-form]");
    if (secondaryForm && container.contains(secondaryForm)) {
      event.preventDefault();
      const state = session.getState();
      const formData = new FormData(secondaryForm);
      const instanceId = String(formData.get("secondary-vp-card") ?? "");
      const amount = Number(formData.get("secondary-vp-amount"));
      const entry = getSecondaryMissionHistory(state).find((item) =>
        item.instanceId === instanceId && item.status === SECONDARY_MISSION_STATUS.ACTIVE);
      const playerId = entry?.playerId;
      if (!playerId || !entry || !Number.isInteger(amount) || amount <= 0) {
        secondaryMissionMessage = "Select an active secondary card and enter a positive whole-number VP amount.";
        render();
        return;
      }
      const round = state.battle?.round ?? 0;
      const turn = state.turn ?? 0;
      const missionMode = state.scoring?.secondaryMissionMode ?? entry.definition?.missionMode;
      if (!missionMode) {
        secondaryMissionMessage = "Set the battle-wide Fixed or Tactical mode before recording secondary scoring.";
        render();
        return;
      }
      try {
        session.dispatch({ type: COMMAND_TYPES.RECORD_SECONDARY_MISSION_SCORE, payload: {
          playerId, instanceId, amount, turn, round
        }});
        secondaryMissionMessage = "Secondary VP recorded for " + (entry.definition?.name ?? entry.definitionId) + ". Check the ledger for any cap applied.";
      } catch (error) {
        secondaryMissionMessage = error?.message ?? String(error);
      }
      render();
      return;
    }
    const form = event.target?.closest?.("[data-vp-form]");
    if (!form || !container.contains(form)) return;
    event.preventDefault();
    const state = session.getState();
    const formData = new FormData(form);
    const playerId = String(formData.get("vp-player") ?? "");
    const enteredAmount = Number(formData.get("vp-amount"));
    const direction = String(formData.get("vp-direction") ?? "add");
    const amount = direction === "deduct" ? -enteredAmount : enteredAmount;
    const reason = String(formData.get("vp-reason") ?? "").trim();
    if (!playerId || !Number.isInteger(enteredAmount) || enteredAmount <= 0 ||
        !["add", "deduct"].includes(direction) || !reason) return;
    try {
      session.dispatch({ type: COMMAND_TYPES.ADJUST_VICTORY_POINTS, payload: {
        playerId, amount, reason, turn: state.turn ?? 0, round: state.battle?.round ?? 0
      }});
      vpMessage = "Adjusted VP by " + (amount > 0 ? "+" : "−") + Math.abs(amount) +
        " for " + playerName(state, playerId) + ".";
    } catch (error) {
      vpMessage = error?.message ?? String(error);
    }
    render();
  }

  function render() {
    const state = session.getState();
    const playerId = perspectivePlayerId ?? state.activePlayer;
    const players = Array.isArray(state.players) ? state.players : [];
    if (!selectedSecondaryPlayerId || !players.some((player) => player.id === selectedSecondaryPlayerId)) {
      selectedSecondaryPlayerId = perspectivePlayerId ?? state.activePlayer ?? players[0]?.id ?? null;
    }
    const objectives = Array.isArray(state.objectives) ? state.objectives : [];
    const objectiveCards = objectives.length ? objectives.map((objective) => {
      const objectiveId = escapeHtml(objective.id);
      const objectiveName = escapeHtml(objective.name ?? objective.label ?? objective.id);
      const currentState = objective.control?.controlState ?? "unrecorded";
      const me = perspectivePlayerId ?? state.activePlayer ?? players[0]?.id ?? null;
      const hasOpponent = players.some((player) => player.id !== me);
      return '<article class="command-objective" data-command-objective="' + objectiveId + '">' +
        '<strong>' + objectiveName + '</strong><span>' + escapeHtml(objectiveStatus(objective, state, playerId)) + '</span>' +
        '<div class="command-objective__actions" aria-label="Record control for ' + objectiveName + '">' +
        '<button type="button" data-objective-control-set="controlled" data-objective-id="' + objectiveId +
          '" aria-pressed="' + String(currentState === "controlled" && objective.control?.controllerId === me) + '">You</button>' +
        '<button type="button" data-objective-control-set="opponent-controlled" data-objective-id="' + objectiveId +
          '" aria-pressed="' + String(currentState === "controlled" && objective.control?.controllerId !== me) + '"' +
          (!hasOpponent ? ' disabled' : '') + '>Opponent</button>' +
        '<button type="button" data-objective-control-set="contested" data-objective-id="' + objectiveId +
          '" aria-pressed="' + String(currentState === "contested") + '"' +
          (players.length < 2 ? ' disabled' : '') + '>Contested</button>' +
        '<button type="button" data-objective-control-set="uncontrolled" data-objective-id="' + objectiveId +
          '" aria-pressed="' + String(currentState === "uncontrolled") + '">Uncontrolled</button>' +
        '</div></article>';
    }).join("") : '<p>No objectives have been configured for this battle.</p>';

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
          const alreadyRecorded = hasEffectiveVictoryPointOpportunity(state, playerId, item.definitionId, opportunityKey);
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
        scoringPlayerId: scoringCheckpointPlayerId ?? playerId,
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
          (item.result.manualReviewRequired ? 'Manual review required' :
            item.result.eligible ? 'Evidence supports eligibility' : 'Conditions not all satisfied') + '</span>' +
          (item.result.manualReviewRequired
            ? '<p>' + (item.result.rulesVerified
              ? 'Scoring window reference was transcribed from an official sample card. Check the physical card and battlefield state; the app does not infer eligibility.'
              : 'Card scoring conditions are not configured from a verified rules source. Check the printed mission rules; no eligibility is inferred.') + '</p>' +
              ((item.result.scoringWindows ?? []).length
                ? '<ul class="command-scoring__tiers">' + item.result.scoringWindows.flatMap((window) =>
                    (window.tiers ?? []).map((tier) => '<li><strong>' + escapeHtml(tier.vp) + ' VP (' +
                      escapeHtml(window.modes?.join("/") ?? "mode") + '):</strong> ' + escapeHtml(tier.summary) +
                      '</li>')).join("") + '</ul>'
                : '')
            : '<ul>' + (item.result.conditions ?? []).map((condition) => '<li>' + escapeHtml(condition.evidence) + ': ' +
              (condition.eligible ? 'satisfied' : 'not satisfied') + '</li>').join("") + '</ul>') +
          '</article>').join("")
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
    const secondaryDefinitions = [
      ...missionDefinitions.filter((definition) => definition?.category === "secondary"),
      ...secondaryMissionCatalog.filter((definition) => definition?.category === "secondary" &&
        !missionDefinitions.some((configured) => configured?.id === definition.id))
    ];
    const secondaryMissionMode = state.scoring?.secondaryMissionMode ?? "";
    const activeSecondaryForSelectedPlayer = secondaryHistory.filter((item) =>
      item.playerId === selectedSecondaryPlayerId && item.status === SECONDARY_MISSION_STATUS.ACTIVE);
    const currentActivePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
    const currentRound = state.battle?.round ?? 0;
    const currentTurn = state.turn ?? 0;
    const tacticalDrawCount = secondaryHistory.filter((item) =>
      item.playerId === currentActivePlayerId && item.drawnRound === currentRound &&
      item.drawnTurn === currentTurn && item.isRedrawReplacement !== true).length;
    const tacticalRedrawPending = state.scoring?.secondaryMissionRedrawPendingByPlayer?.[currentActivePlayerId];
    const fixedCardsSelected = secondaryHistory.filter((item) =>
      item.playerId === selectedSecondaryPlayerId && ((state.scoring?.secondaryMissionMode ?? item.definition?.missionMode) === "fixed")).length;
    const secondaryModeStatusMarkup = secondaryMissionMode === "tactical" && state.phase === "command"
      ? '<p class="command-secondary-mode-status">' +
        (tacticalRedrawPending && tacticalRedrawPending.round === currentRound && tacticalRedrawPending.turn === currentTurn
          ? 'Two normal Tactical draws may be recorded independently; the New Orders replacement is still pending.'
          : 'Tactical cards recorded for this Command phase: ' + Math.min(tacticalDrawCount, 2) + ' of 2.') +
        '</p>'
      : secondaryMissionMode === "fixed"
        ? '<p class="command-secondary-mode-status">Fixed cards selected for ' +
          escapeHtml(playerName(state, selectedSecondaryPlayerId)) + ': ' + Math.min(fixedCardsSelected, 2) + ' of 2.</p>'
        : "";
    const activeSecondaryIds = new Set(activeSecondaryForSelectedPlayer.map((item) => item.definitionId));
    const seenSecondaryIds = new Set(secondaryHistory
      .filter((item) => item.playerId === selectedSecondaryPlayerId)
      .map((item) => item.definitionId));
    const selectableSecondaryDefinitions = secondaryDefinitions.filter((definition) =>
      !activeSecondaryIds.has(definition.id) &&
      !(secondaryMissionMode === "tactical" && seenSecondaryIds.has(definition.id)) &&
      (!secondaryMissionMode || definition.availableModes?.includes(secondaryMissionMode) !== false) &&
      !(secondaryMissionMode === "fixed" && definition.fixedAvailable === false));
    const activeSecondaryForVp = secondaryHistory.filter((item) =>
      item.status === SECONDARY_MISSION_STATUS.ACTIVE &&
      !(((state.scoring?.secondaryMissionMode ?? item.definition?.missionMode) === "fixed") &&
        (item.scoringHistory ?? []).some((scored) =>
          scored.round === (state.battle?.round ?? 0) && scored.turn === (state.turn ?? 0))));
    const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
    const activeTacticalCards = secondaryHistory.filter((item) =>
      item.playerId === activePlayerId &&
      item.status === SECONDARY_MISSION_STATUS.ACTIVE &&
      ((state.scoring?.secondaryMissionMode ?? item.definition?.missionMode) === "tactical"));
    const redrawUsed = Boolean(state.scoring?.secondaryMissionRedrawUsedByPlayer?.[activePlayerId]);
    const activePlayerCp = activePlayerId ? getCommandPointBalance(state, activePlayerId) : 0;
    const secondaryRedrawOptions = activeTacticalCards.map((item) =>
      '<option value="' + escapeHtml(item.instanceId) + '">' +
      escapeHtml(item.definition?.name ?? item.definitionId) + '</option>'
    ).join("");
    const secondaryRedrawMarkup = state.phase === "command" &&
      state.scoring?.secondaryMissionMode === "tactical" && activePlayerId
      ? '<section class="command-secondary-redraw"><h3>New Orders (once per battle)</h3>' +
        (redrawUsed
          ? '<p>New Orders has already been used by this player in this battle.</p>'
          : activePlayerCp < 1
            ? '<p>New Orders costs 1 CP; the active player does not have enough Command Points.</p>'
            : activeTacticalCards.length
              ? '<p>At the end of your Command phase, spend 1 CP to discard one active Tactical card and record one replacement drawn from the physical deck.</p>' +
                '<form data-secondary-redraw-form class="command-vp-form">' +
                '<label>Card to discard<select name="secondary-redraw-card" required>' + secondaryRedrawOptions + '</select></label>' +
                '<button type="submit">Use New Orders (−1 CP)</button></form>'
              : '<p>No active Tactical cards are available to replace.</p>') + '</section>'
      : "";
    const secondaryVpCardOptions = activeSecondaryForVp.map((item) =>
      '<option value="' + escapeHtml(item.instanceId) + '">' +
      escapeHtml(playerName(state, item.playerId) + " — " + (item.definition?.name ?? item.definitionId)) + '</option>'
    ).join("");
    const secondaryVpForm = players.length && activeSecondaryForVp.length
      ? '<section class="command-secondary-award"><h3>Confirm secondary mission VP</h3>' +
        '<p>Use only after checking the physical card and confirming the actual score. Mission caps are applied by the ledger.</p>' +
        '<form data-secondary-vp-form class="command-vp-form">' +
        '<label>Active secondary card<select name="secondary-vp-card" required>' + secondaryVpCardOptions + '</select></label>' +
        '<label>VP actually scored<input name="secondary-vp-amount" type="number" min="1" step="1" value="3" required></label>' +
        '<button type="submit">Confirm secondary VP</button></form></section>'
      : "";
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
    const manualTimingOptions = '<option value="">Choose checkpoint...</option>' + [
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
          '<label>Battle-wide secondary mode<select data-secondary-mode ' +
          ((secondaryHistory.length || (state.battle && secondaryMissionMode)) ? 'disabled' : '') + ' required>' +
          '<option value="">Choose mode before entering cards...</option>' +
          '<option value="fixed"' + (secondaryMissionMode === "fixed" ? ' selected' : '') + '>Fixed</option>' +
          '<option value="tactical"' + (secondaryMissionMode === "tactical" ? ' selected' : '') + '>Tactical</option>' +
          '</select></label>' +
          '<label>Player<select data-secondary-player>' + secondaryPlayerOptions + '</select></label>' +
          '<label>Mission from catalog<select data-secondary-definition>' + secondaryDefinitionOptions + '</select></label>' +
          '<label>Or enter card name<input data-secondary-name type="text" maxlength="160" placeholder="Name printed on your card"></label>' +
          '<label>Card scoring checkpoint<select data-secondary-timing>' + manualTimingOptions + '</select></label>' +
          '<button type="button" data-secondary-mission-add>Record selected mission</button>' +
          secondaryModeStatusMarkup + '</div></form>' +
          '<p>The catalog contains names and Fixed/Tactical availability for all cards, plus verified scoring-window references for a limited set of official sample cards. Other cards remain names-only until their text is checked. All scoring still requires table-side confirmation; no VP is awarded automatically.</p>';
    const secondaryMissionManager = '<section class="command-secondary-missions"><h2>Manual secondary-mission entry</h2>' +
      '<p>No automatic draw or selection occurs. Choose Fixed or Tactical once for the battle before entering cards. The mode is locked after the first card is recorded; card availability is checked against the catalog.</p>' +
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
    const undoableVpAward = getLatestUndoableVictoryPointsAward(state);
    const undoVpMarkup = undoableVpAward
      ? '<button type="button" data-vp-undo>Undo latest VP entry (' +
        (undoableVpAward.amount > 0 ? "+" : "−") + escapeHtml(Math.abs(undoableVpAward.amount)) +
        ' VP for ' + escapeHtml(playerName(state, undoableVpAward.playerId)) + ')</button>'
      : '<p>Undo is available immediately after a VP award, before another game action is recorded.</p>';
    const vpHistory = (Array.isArray(state.history) ? state.history : [])
      .filter((event) => ["victory_points.awarded", "victory_points.adjusted",
        "victory_points.award_undone", "victory_points.adjustment_undone"].includes(event?.type))
      .slice(-8).reverse();
    const vpHistoryMarkup = vpHistory.length ? vpHistory.map((event) => {
      const entry = event.payload ?? {};
      const isUndo = event.type === "victory_points.award_undone" ||
        event.type === "victory_points.adjustment_undone";
      const label = isUndo
        ? "Undo (" + (entry.amount > 0 ? "+" : "−") + Math.abs(entry.amount) + " VP)"
        : (entry.amount > 0 ? "+" : "−") + Math.abs(entry.amount) + " VP";
      const capNotice = !isUndo && entry.requestedAmount > entry.amount
        ? '<small>Cap applied: requested ' + escapeHtml(entry.requestedAmount) + ' VP; awarded ' +
          escapeHtml(entry.amount) + ' VP (' + (entry.appliedCaps ?? []).map(vpCapDescription)
            .map(escapeHtml).join(", ") + ').</small>'
        : '';
      return '<li><strong>' + escapeHtml(label) + '</strong> · ' + escapeHtml(playerName(state, entry.playerId)) +
        ' — ' + escapeHtml(entry.reason) + ' <small>(Round ' + escapeHtml(entry.round) +
        ', turn ' + escapeHtml(entry.turn) + '; total ' + escapeHtml(entry.scoreAfter) + ')</small> ' +
        capNotice + '</li>';
    }).join("") : '<li>No victory points recorded yet.</li>';

    container.innerHTML = '<main class="command-screen"><header><div><div class="command-kicker">LIVE BATTLE</div>' +
      '<h1>Command Phase</h1><p>Round ' + escapeHtml(state.battle?.round ?? "—") + ' · Turn ' +
      escapeHtml(state.turn ?? "—") + ' · ' + escapeHtml(playerName(state, playerId)) +
      '</p></div><div class="command-points"><span>Command Points</span><strong>' +
      escapeHtml(commandPointsFor(state, playerId)) + '</strong></div></header>' +
      '<p class="command-note">Review command points, objective control and command-phase scoring evidence. Mission scoring remains a table-side decision; the app does not award points automatically.</p>' +
      '<section><h2>Victory Point score</h2><div class="command-scoreboard">' + (scoreCards || '<p>Add players to the battle to track scores.</p>') + '</div>' +
      '<p>Use mission Confirm buttons for capped Primary and Secondary scoring. Manual adjustments can add or subtract VP without consuming mission caps; deductions cannot reduce a score below zero.</p>' +
      (players.length ? '<form class="command-vp-form" data-vp-form><label>Player<select name="vp-player" required>' + playerOptions +
      '</select></label><label>Adjustment<select name="vp-direction" required><option value="add" selected>Add VP</option><option value="deduct">Subtract VP</option></select></label>' +
      '<label>VP amount<input name="vp-amount" type="number" min="1" step="1" value="5" required></label>' +
      '<label>Manual adjustment reason<input name="vp-reason" type="text" maxlength="160" placeholder="e.g. Correct an entry error" required></label>' +
      '<button type="submit">Confirm VP adjustment</button></form>' : '<p>Configure both players before recording adjustments.</p>') +
      undoVpMarkup + (vpMessage ? '<p role="status">' + escapeHtml(vpMessage) + '</p>' : '') + '<h3>Recent confirmed awards</h3><ol class="command-ledger-history">' + vpHistoryMarkup + '</ol></section>' +
      '<section><h2>Command Point ledger</h2><p>Record actual gains and spending. Each entry updates the balance and battle history; the app does not assume a gain occurs automatically.</p>' +
      '<div class="command-ledger-actions"><button type="button" data-cp-gain>Record +1 CP</button><button type="button" data-cp-spend>Record −1 CP</button></div>' +
      '<ol class="command-ledger-history">' + cpHistoryMarkup + '</ol></section>' +
      '<section><h2>Live battlefield map</h2>' +
      renderBattlefieldMap(state, { mode: "live", perspectivePlayerId: playerId }) +
      '<p>Map positions are approximate references. Objective control is recorded manually below and is not inferred from marker positions.</p></section>' +
      '<section><h2>Objective control</h2><p>Tap the result that matches the table. This records your assessment; the app does not determine control from map coordinates.</p>' +
      (objectiveMessage ? '<p role="status">' + escapeHtml(objectiveMessage) + '</p>' : '') +
      '<div class="command-objectives">' + objectiveCards + '</div></section>' +
      secondaryMissionManager +
      secondaryRedrawMarkup +
      secondaryVpForm +
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
