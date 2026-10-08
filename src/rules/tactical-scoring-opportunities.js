import { evaluateScoringOpportunityAtTiming } from "./scoring-opportunity-timing.js";

export function getScoringOpportunityAdvisories(
  state,
  { definitions = [], timing } = {}
) {
  if (!Array.isArray(definitions)) {
    throw new TypeError("Scoring definitions must be an array.");
  }
  if (!timing) {
    throw new TypeError("Scoring timing is required.");
  }

  const evaluations = definitions.map((definition) =>
    evaluateScoringOpportunityAtTiming(state, definition, timing)
  );

  return {
    timing,
    evaluations,
    available: evaluations
      .filter((evaluation) => evaluation.due && evaluation.opportunity?.eligible)
      .map((evaluation) => evaluation.opportunity)
  };
}
