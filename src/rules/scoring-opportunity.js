import { evaluateMissionDefinition } from "./mission-definition.js";

export const SCORING_OPPORTUNITY_STATES = Object.freeze({
  AVAILABLE: "available",
  NOT_AVAILABLE: "not-available"
});

export function evaluateScoringOpportunity(state, definition) {
  const evaluation = evaluateMissionDefinition(state, definition);

  return {
    definitionId: evaluation.definitionId,
    timing: evaluation.timing,
    state: evaluation.eligible
      ? SCORING_OPPORTUNITY_STATES.AVAILABLE
      : SCORING_OPPORTUNITY_STATES.NOT_AVAILABLE,
    eligible: evaluation.eligible,
    conditions: evaluation.conditions
  };
}
