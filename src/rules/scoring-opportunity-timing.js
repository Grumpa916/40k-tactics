import { SCORING_TIMINGS } from "./mission-definition.js";
import { evaluateScoringOpportunity } from "./scoring-opportunity.js";

export function isScoringTimingDue(definition, timing) {
  if (!definition || typeof definition.id !== "string") {
    throw new TypeError("A mission definition is required.");
  }
  if (!Object.values(SCORING_TIMINGS).includes(timing)) {
    throw new Error("Unsupported scoring timing: " + timing);
  }

  return definition.timing === timing;
}

export function evaluateScoringOpportunityAtTiming(state, definition, timing) {
  const due = isScoringTimingDue(definition, timing);

  if (!due) {
    return {
      definitionId: definition.id,
      timing: definition.timing,
      evaluationTiming: timing,
      due: false,
      opportunity: null
    };
  }

  return {
    definitionId: definition.id,
    timing: definition.timing,
    evaluationTiming: timing,
    due: true,
    opportunity: evaluateScoringOpportunity(state, definition)
  };
}
