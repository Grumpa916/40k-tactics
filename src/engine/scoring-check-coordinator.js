import { evaluateMissionDefinition, SCORING_TIMINGS } from "../rules/mission-definition.js";
import { getSecondaryMissionHistory, SECONDARY_MISSION_STATUS } from "../rules/secondary-mission-lifecycle.js";

export const SCORING_CHECKPOINTS = Object.freeze({
  COMMAND_PHASE: SCORING_TIMINGS.COMMAND_PHASE,
  END_OF_TURN: SCORING_TIMINGS.END_OF_TURN,
  END_OF_OPPONENT_TURN: SCORING_TIMINGS.END_OF_OPPONENT_TURN,
  END_OF_BATTLE: SCORING_TIMINGS.END_OF_BATTLE
});

function validateCheckpoint(checkpoint) {
  if (!Object.values(SCORING_CHECKPOINTS).includes(checkpoint)) {
    throw new Error("Unsupported scoring checkpoint: " + checkpoint);
  }
}

function scoringWindowsForInstance(state, instance, checkpoint = null) {
  const definition = instance.definition;
  if (!Array.isArray(definition?.scoringWindows)) return [];
  const missionMode = state?.scoring?.secondaryMissionMode ?? definition.missionMode ?? null;
  const currentRound = state?.battle?.round ?? state?.round ?? null;
  return definition.scoringWindows.filter((window) =>
    (checkpoint == null || window?.timing === checkpoint) &&
    (window?.minRound == null || currentRound == null || currentRound >= window.minRound) &&
    (!missionMode || !Array.isArray(window?.modes) || window.modes.length === 0 ||
      window.modes.includes(missionMode)));
}

function evaluateSecondaryInstance(state, instance, checkpoint) {
  const definition = instance.definition;
  const scoringWindows = scoringWindowsForInstance(state, instance, checkpoint);
  const scoringWindow = scoringWindows[0] ?? null;
  const reviewMetadata = {
    scoringWindow,
    scoringWindows,
    rulesVerified: definition?.rulesVerified === true,
    referenceNotes: Array.isArray(definition?.referenceNotes) ? definition.referenceNotes : []
  };
  if (!Array.isArray(definition?.conditions) || definition.conditions.length === 0) {
    return {
      definitionId: instance.definitionId,
      timing: scoringWindow?.timing ?? definition?.timing,
      ...reviewMetadata,
      eligible: false,
      manualReviewRequired: true,
      conditions: []
    };
  }
  return { ...evaluateMissionDefinition(state, definition), ...reviewMetadata };
}

/**
 * Evaluate missions at one explicit scoring checkpoint for one player.
 * Primary definitions are supplied by the primary-mission adapter; secondary
 * definitions are read only from that player’s ACTIVE lifecycle instances.
 * This function only reports eligibility. It never awards VP or changes state.
 */
export function evaluateScoringCheckpoint(state, {
  checkpoint,
  scoringPlayerId,
  activePlayerId = null,
  primaryDefinitions = []
} = {}) {
  validateCheckpoint(checkpoint);
  if (typeof scoringPlayerId !== "string" || !scoringPlayerId.trim()) {
    throw new TypeError("A scoring player id is required.");
  }
  if (activePlayerId != null && (typeof activePlayerId !== "string" || !activePlayerId.trim())) {
    throw new TypeError("The active player id must be a non-empty string when provided.");
  }
  if (checkpoint === SCORING_CHECKPOINTS.END_OF_OPPONENT_TURN &&
      (!activePlayerId || activePlayerId === scoringPlayerId)) {
    throw new Error("End-of-opponent-turn scoring requires the opponent to be the active player.");
  }
  if (!Array.isArray(primaryDefinitions)) {
    throw new TypeError("Primary mission definitions must be an array.");
  }

  const primary = primaryDefinitions
    .filter((definition) => definition && definition.category !== "secondary" && definition.timing === checkpoint)
    .map((definition) => ({
      category: "primary",
      definitionId: definition.id,
      definitionName: definition.name,
      result: evaluateMissionDefinition(state, definition)
    }));

  const history = getSecondaryMissionHistory(state, scoringPlayerId);
  const secondary = history
    .filter((instance) => {
      if (instance.status !== SECONDARY_MISSION_STATUS.ACTIVE) return false;
      const definition = instance.definition;
      if (Array.isArray(definition?.scoringWindows) && definition.scoringWindows.length) {
        return scoringWindowsForInstance(state, instance, checkpoint).length > 0;
      }
      return definition?.timing === checkpoint;
    })
    .map((instance) => ({
      category: "secondary",
      instanceId: instance.instanceId,
      definitionId: instance.definitionId,
      definitionName: instance.definition?.name ?? instance.definitionId,
      result: evaluateSecondaryInstance(state, instance, checkpoint)
    }));

  return Object.freeze({
    checkpoint,
    scoringPlayerId,
    activePlayerId,
    primary: Object.freeze(primary),
    secondary: Object.freeze(secondary),
    eligibleCount: primary.filter((item) => item.result.eligible).length +
      secondary.filter((item) => item.result.eligible).length,
    requiresPlayerConfirmation: true,
    awardsVictoryPoints: false
  });
}
