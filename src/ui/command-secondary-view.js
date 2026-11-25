import { getCommandPointBalance } from '../engine/command-points-ledger.js';
import { SCORING_TIMINGS } from '../rules/mission-definition.js';
import {
  getSecondaryMissionHistory, getSecondaryMissionMode,
  getPendingSecondaryMissionRuleReplacement, getPendingSecondaryMissionCardChoice,
  getSecondaryMissionCardChoiceOptions, getActiveBurdenTrustAssignments,
  getSecondaryMissionReplacementOpportunity, SECONDARY_MISSION_STATUS
} from '../rules/secondary-mission-lifecycle.js';
import { objectivePickerLabel } from '../rules/objective-display-labels.js';

// Presentation for Command's Tactical card entry, When Drawn choices, and New Orders.
// The caller owns the battle session and the voice-capture lifecycle.
export function renderCommandSecondaries(state, {
  missionDefinitions, secondaryMissionCatalog, perspectivePlayerId,
  secondaryMissionNotice, voiceCapture, voiceStage, voiceTranscript, voiceDraft,
  voiceMessage, escapeHtml, playerName
}) {
  const players = Array.isArray(state.players) ? state.players : [];
  const selectedSecondaryPlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? perspectivePlayerId ?? players[0]?.id ?? null;
  const secondaryHistory = getSecondaryMissionHistory(state);
  const secondaryDefinitions = [
    ...missionDefinitions.filter((definition) => definition?.category === "secondary"),
    ...secondaryMissionCatalog.filter((definition) => definition?.category === "secondary" &&
      !missionDefinitions.some((configured) => configured?.id === definition.id))
  ];
  const secondaryMissionMode = getSecondaryMissionMode(state, selectedSecondaryPlayerId) ?? "";
  const activeSecondaryForSelectedPlayer = secondaryHistory.filter((item) =>
    item.playerId === selectedSecondaryPlayerId && item.status === SECONDARY_MISSION_STATUS.ACTIVE);
  const currentActivePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  const currentRound = state.battle?.round ?? 0;
  const currentTurn = state.turn ?? 0;
  const tacticalDrawCount = secondaryHistory.filter((item) =>
    item.playerId === selectedSecondaryPlayerId && item.drawnRound === currentRound &&
    item.drawnTurn === currentTurn && item.status !== SECONDARY_MISSION_STATUS.RETURNED_TO_DECK &&
    item.isRedrawReplacement !== true).length;
  const tacticalRedrawPending = state.scoring?.secondaryMissionRedrawPendingByPlayer?.[currentActivePlayerId];
  const secondaryRuleReplacementPending = getPendingSecondaryMissionRuleReplacement(state, currentActivePlayerId);
  const secondaryCardChoicePending = getPendingSecondaryMissionCardChoice(state, currentActivePlayerId);
  const fixedCardsSelected = secondaryHistory.filter((item) =>
    item.playerId === selectedSecondaryPlayerId && ((getSecondaryMissionMode(state, item.playerId) ?? item.definition?.missionMode) === "fixed")).length;
  const secondaryModeStatusMarkup = secondaryMissionMode === "tactical" && state.phase === "command"
    ? '<p class="command-secondary-mode-status">' +
      (secondaryCardChoicePending
        ? "Choose the " + secondaryCardChoicePending.choiceType + " for the card you just drew."
        : secondaryRuleReplacementPending
        ? secondaryRuleReplacementPending.stage === "return"
          ? 'Defend Stronghold must be returned for a replacement before continuing.'
          : 'Draw the replacement card now before continuing.'
        : tacticalRedrawPending && tacticalRedrawPending.round === currentRound && tacticalRedrawPending.turn === currentTurn
          ? 'Two normal Tactical draws may be recorded independently; the New Orders replacement is still pending.'
          : 'Tactical cards recorded for this Command phase: ' + Math.min(tacticalDrawCount, 2) + ' of 2.') +
      '</p>'
    : secondaryMissionMode === "fixed"
      ? '<p class="command-secondary-mode-status">Fixed cards selected for ' +
        escapeHtml(playerName(state, selectedSecondaryPlayerId)) + ': ' + Math.min(fixedCardsSelected, 2) + ' of 2.</p>'
      : "";
  const activeSecondaryIds = new Set(activeSecondaryForSelectedPlayer.map((item) => item.definitionId));
  const seenSecondaryIds = new Set(secondaryHistory
    .filter((item) => item.playerId === selectedSecondaryPlayerId &&
      item.status !== SECONDARY_MISSION_STATUS.RETURNED_TO_DECK)
    .map((item) => item.definitionId));
  const selectableSecondaryDefinitions = secondaryDefinitions.filter((definition) =>
    !activeSecondaryIds.has(definition.id) &&
    !(getSecondaryMissionMode(state, selectedSecondaryPlayerId) === "tactical" && seenSecondaryIds.has(definition.id)) &&
    (!secondaryMissionMode || definition.availableModes?.includes(secondaryMissionMode) !== false) &&
    !(getSecondaryMissionMode(state, selectedSecondaryPlayerId) === "fixed" && definition.fixedAvailable === false));
  const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  const activeTacticalCards = secondaryHistory.filter((item) =>
    item.playerId === activePlayerId &&
    item.status === SECONDARY_MISSION_STATUS.ACTIVE &&
    ((getSecondaryMissionMode(state, item.playerId) ?? item.definition?.missionMode) === "tactical"));
  const redrawUsed = Boolean(state.scoring?.secondaryMissionRedrawUsedByPlayer?.[activePlayerId]);
  const activePlayerCp = activePlayerId ? getCommandPointBalance(state, activePlayerId) : 0;
  const secondaryRedrawOptions = activeTacticalCards.map((item) =>
    '<option value="' + escapeHtml(item.instanceId) + '">' +
    escapeHtml(item.definition?.name ?? item.definitionId) + '</option>'
  ).join("");
  const secondaryRedrawMarkup = state.phase === "command" &&
    getSecondaryMissionMode(state, activePlayerId) === "tactical" && activePlayerId
    ? '<section class="command-secondary-redraw"><h3>New Orders (once per battle)</h3>' +
      (secondaryRuleReplacementPending
        ? '<p>Resolve the When Drawn replacement before using New Orders.</p>'
        : redrawUsed
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
  const secondaryDefinitionOptions = '<option value="">Select a mission…</option>' +
    selectableSecondaryDefinitions.map((definition) =>
      '<option value="' + escapeHtml(definition.id) + '">' + escapeHtml(definition.name ?? definition.id) + '</option>'
    ).join("");
  const secondaryHistoryMarkup = activeSecondaryForSelectedPlayer.length
    ? '<section class="command-secondary-active"><h3>Active cards and When Drawn rules</h3>' +
      activeSecondaryForSelectedPlayer.map((item) => {
        const opportunity = getSecondaryMissionReplacementOpportunity(state, item, {
          round: currentRound, turn: currentTurn
        });
        const replacementControl = opportunity.eligible
          ? (opportunity.requiresConfirmation
            ? '<label><input type="checkbox" data-secondary-rule-condition="' + escapeHtml(item.instanceId) + '"> ' +
              escapeHtml(opportunity.confirmationPrompt) + '</label>'
            : '') +
            '<button type="button" data-secondary-rule-return="' + escapeHtml(item.instanceId) + '">' +
            (opportunity.mandatory ? 'Return for required replacement' : 'Return and replace card') + '</button>'
          : '';
        const cardName = item.definition?.name ?? item.definitionId;
        let cardChoiceControl = '';
        if (item.definitionId === "secondary-beacon") {
          const selectedUnit = item.cardState?.beaconUnitId;
          const selectedName = state.units?.find((unit) => unit.id === selectedUnit)?.name;
          if (selectedUnit) {
            cardChoiceControl = '<p><strong>Beacon unit:</strong> ' + escapeHtml(selectedName ?? selectedUnit) + ' (locked for this card).</p>';
          } else {
            const options = getSecondaryMissionCardChoiceOptions(state, { playerId: item.playerId, choiceType: "beacon" });
            cardChoiceControl = '<form data-secondary-card-choice-form data-secondary-choice-type="beacon" data-secondary-choice-card="' + escapeHtml(item.instanceId) + '">' +
              '<label>Choose your Beacon unit<select name="beacon-unit" required><option value="">Select a battlefield or embarked unit…</option>' +
              options.map((unit) => '<option value="' + escapeHtml(unit.id) + '">' + escapeHtml(unit.name ?? unit.id) + '</option>').join('') +
              '</select></label><button type="submit">Set Beacon unit</button></form>';
          }
        } else if (item.definitionId === "secondary-a-tempting-target") {
          const selectedObjectiveId = item.cardState?.temptingTargetObjectiveId;
          if (selectedObjectiveId) {
            cardChoiceControl = '<p><strong>Opponent selected target:</strong> ' + escapeHtml(objectivePickerLabel(state, selectedObjectiveId, perspectivePlayerId ?? state.activePlayer ?? players[0]?.id)) + ' (locked for this card).</p>';
          } else {
            const options = getSecondaryMissionCardChoiceOptions(state, { playerId: item.playerId, choiceType: "tempting-target" });
            cardChoiceControl = '<form data-secondary-card-choice-form data-secondary-choice-type="tempting-target" data-secondary-choice-card="' + escapeHtml(item.instanceId) + '">' +
              '<label>Opponent selects a No Man’s Land objective<select name="tempting-target" required><option value="">Select objective…</option>' +
              options.map((objective) => '<option value="' + escapeHtml(objective.id) + '">' + escapeHtml(objectivePickerLabel(state, objective.id, perspectivePlayerId ?? state.activePlayer ?? players[0]?.id)) + '</option>').join('') +
              '</select></label><button type="submit">Record opponent’s target</button></form>';
          }
        } else if (item.definitionId === "secondary-burden-of-trust") {
          const options = getSecondaryMissionCardChoiceOptions(state, { playerId: item.playerId, choiceType: "burden-trust" });
          const activeAssignments = getActiveBurdenTrustAssignments(state, item, { turn: currentTurn });
          const assignedByObjective = new Map(activeAssignments.map((assignment) => [assignment.objectiveId, assignment]));
          const objectiveChoices = (state.objectives ?? []).map((objective) => {
            const current = assignedByObjective.get(objective.id);
            const unitOptions = '<option value="">Not guarded</option>' + options.map((unit) =>
              '<option value="' + escapeHtml(unit.id) + '"' + (current?.unitId === unit.id ? ' selected' : '') + '>' +
              escapeHtml(unit.name ?? unit.id) + '</option>').join('');
            return '<label>' + escapeHtml(objectivePickerLabel(state, objective.id, perspectivePlayerId ?? state.activePlayer ?? players[0]?.id)) +
              '<select name="guard-' + escapeHtml(objective.id) + '">' + unitOptions + '</select></label>';
          }).join('');
          cardChoiceControl = '<form data-secondary-card-choice-form data-secondary-choice-type="burden-trust" data-secondary-choice-card="' + escapeHtml(item.instanceId) + '">' +
            '<p>Assign one deployed unit to each objective you control. Recheck range and control at the end of the opponent’s turn.</p>' +
            objectiveChoices + '<button type="submit">Save Burden of Trust guards</button></form>';
        }
        return '<article><strong>' + escapeHtml(cardName) + '</strong>' +
          (replacementControl ? '<p>' + escapeHtml(opportunity.reason) + '</p>' + replacementControl : '') +
          cardChoiceControl + '</article>';
      }).join('') + '</section>'
    : '<p>No active secondary cards have been entered for this player.</p>';
  const manualTimingOptions = '<option value="">Choose checkpoint...</option>' + [
    [SCORING_TIMINGS.COMMAND_PHASE, "End of Command phase"],
    [SCORING_TIMINGS.END_OF_TURN, "End of turn"],
    [SCORING_TIMINGS.END_OF_OPPONENT_TURN, "End of opponent's turn"],
    [SCORING_TIMINGS.END_OF_BATTLE, "End of battle"]
  ].map(([value, label]) => '<option value="' + value + '">' + label + '</option>').join("");
  const secondaryAddLabel = secondaryRuleReplacementPending?.stage === "draw"
    ? "Record replacement card" : "Record secondary card";
  const secondaryEntryMarkup = state.phase !== "command"
    ? '<p>Manual secondary-mission entry is available during the Command phase. Current game phase: ' +
      escapeHtml(state.phase ?? "unknown") + '.</p>'
    : !players.length
      ? '<p>Add players before entering secondary missions.</p>'
      : '<form data-secondary-mission-form><div class="command-vp-form">' +
        '<p><strong>Secondary mode:</strong> ' + escapeHtml(secondaryMissionMode || "Not set") + '</p>' +
        (secondaryRuleReplacementPending?.stage === "draw"
          ? '<p>Choose the replacement card you just drew from the physical deck.</p>' : '') +
        '<label>Mission from catalog<select data-secondary-definition>' + secondaryDefinitionOptions + '</select></label>' +
        '<button type="button" data-secondary-mission-add>' + secondaryAddLabel + '</button>' +
        secondaryModeStatusMarkup + '</div></form>';
  const voiceMarkup = secondaryMissionMode === 'tactical' ?
    '<section class="command-voice-secondary" aria-label="Speak Tactical secondary cards">' +
    '<h3>Speak drawn cards</h3><p>Warmind draws; record two cards for ' + escapeHtml(playerName(state, selectedSecondaryPlayerId)) + '.</p>' +
    '<button type="button" data-voice-secondary-start style="min-height:48px">' + (voiceCapture?.listening ? 'Stop listening' : '🎙 Tap to speak') + '</button>' +
    '<p data-voice-secondary-status role="status">' + escapeHtml(({
      starting: 'Starting Safari speech recognition…',
      started: 'Speech recognition started; waiting for microphone…',
      audio: 'Microphone open; waiting for speech…',
      speech: 'Speech detected; waiting for transcript…'
    })[voiceStage] ?? '') + '</p>' +
    '<div class="command-voice-dictation"><label>Cards heard <input data-voice-secondary-text value="' + escapeHtml(voiceTranscript) + '" placeholder="Cleanse and Plunder" style="min-height:44px"></label>' +
    '<p>Tap the field, then the iPad keyboard microphone. If it mishears you, clear and dictate again.</p>' +
    '<button type="button" data-voice-secondary-clear style="min-height:44px">Clear and dictate again</button>' +
    '<button type="button" data-voice-secondary-review style="min-height:44px">Review cards</button></div>' +
    (voiceDraft ? '<div data-voice-secondary-preview><p role="status">Record for ' + escapeHtml(playerName(state, voiceDraft.playerId)) + ': ' +
      voiceDraft.definitions.map(card => escapeHtml(card.name)).join(' and ') + '?</p>' +
      '<button type="button" data-voice-secondary-confirm style="min-height:48px">Confirm both cards</button>' +
      '<button type="button" data-voice-secondary-cancel>Cancel</button></div>' : '') +
    (voiceMessage ? '<p role="status">' + escapeHtml(voiceMessage) + '</p>' : '') + '</section>' : '';
  const secondaryMissionManager = state.phase === "command"
    ? '<section class="command-secondary-missions">' + voiceMarkup + '<details><summary>Enter card manually</summary>' + secondaryEntryMarkup + '</details>' +
      secondaryHistoryMarkup +
      (secondaryMissionNotice ? '<p role="status">' + escapeHtml(secondaryMissionNotice) + '</p>' : '') +
      '</section>'
    : '';

  return { secondaryMissionMode, tacticalDrawCount, secondaryRedrawMarkup, secondaryMissionManager };
}
