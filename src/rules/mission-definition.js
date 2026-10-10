import {
  SCORING_EVIDENCE,
  evaluateObjectiveControl,
  evaluateUnitStatus,
  evaluateUnitOwnership,
  evaluateUnitDestruction,
  evaluateTurnSnapshot
} from "./scoring-eligibility.js";

export const SCORING_TIMINGS = Object.freeze({
  COMMAND_PHASE: "command-phase",
  END_OF_TURN: "end-of-turn",
  END_OF_OPPONENT_TURN: "end-of-opponent-turn",
  END_OF_BATTLE: "end-of-battle",
  EVENT: "event"
});

const EVALUATORS = Object.freeze({
  [SCORING_EVIDENCE.OBJECTIVE_CONTROL]: evaluateObjectiveControl,
  [SCORING_EVIDENCE.UNIT_STATUS]: evaluateUnitStatus,
  [SCORING_EVIDENCE.UNIT_OWNERSHIP]: evaluateUnitOwnership,
  [SCORING_EVIDENCE.UNIT_DESTRUCTION]: evaluateUnitDestruction,
  [SCORING_EVIDENCE.TURN_SNAPSHOT]: evaluateTurnSnapshot
});

function validateTiming(timing) {
  if (!Object.values(SCORING_TIMINGS).includes(timing)) {
    throw new Error("Unsupported scoring timing: " + timing);
  }
}

export function createScoringCondition({
  evidence,
  args = {}
} = {}) {
  if (!Object.values(SCORING_EVIDENCE).includes(evidence)) {
    throw new Error("Unsupported scoring evidence: " + evidence);
  }
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    throw new TypeError("Scoring condition args must be an object.");
  }

  return Object.freeze({
    evidence,
    args: Object.freeze({ ...args })
  });
}

export function createMissionDefinition({
  id,
  name,
  timing = SCORING_TIMINGS.END_OF_TURN,
  category = null,
  missionMode = null,
  victoryPoints = null,
  conditions = []
} = {}) {
  if (!id || typeof id !== "string") {
    throw new TypeError("A mission definition id is required.");
  }
  if (!name || typeof name !== "string") {
    throw new TypeError("A mission definition name is required.");
  }
  validateTiming(timing);
  if (category !== null && !["primary", "secondary"].includes(category)) {
    throw new Error("Mission category must be primary or secondary.");
  }
  if (missionMode !== null && !["fixed", "tactical"].includes(missionMode)) {
    throw new Error("Mission mode must be fixed or tactical when supplied.");
  }
  if (missionMode !== null && category !== "secondary") {
    throw new Error("Mission mode can only be supplied for secondary missions.");
  }
  if (victoryPoints !== null && (!Number.isInteger(victoryPoints) || victoryPoints <= 0)) {
    throw new TypeError("Configured victory points must be a positive integer.");
  }
  if (!Array.isArray(conditions) || conditions.length === 0) {
    throw new TypeError("A mission definition requires at least one scoring condition.");
  }

  const normalizedConditions = conditions.map((condition) =>
    createScoringCondition(condition)
  );

  return Object.freeze({
    id,
    name,
    timing,
    category,
    ...(missionMode ? { missionMode } : {}),
    victoryPoints,
    conditions: Object.freeze(normalizedConditions)
  });
}

export function evaluateMissionDefinition(state, definition) {
  if (!definition || typeof definition.id !== "string") {
    throw new TypeError("A mission definition is required.");
  }

  const results = definition.conditions.map((condition) => {
    const evaluator = EVALUATORS[condition.evidence];
    if (!evaluator) {
      throw new Error("No evaluator registered for scoring evidence: " + condition.evidence);
    }
    return evaluator(state, condition.args);
  });

  return {
    definitionId: definition.id,
    timing: definition.timing,
    eligible: results.every((result) => result.eligible),
    conditions: results
  };
}
