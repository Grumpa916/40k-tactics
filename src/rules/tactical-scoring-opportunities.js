import { evaluateScoringOpportunityAtTiming } from "./scoring-opportunity-timing.js";

function buildConditionAdvisories(evaluation) {
  if (!evaluation.due || !evaluation.opportunity) return [];

  return evaluation.opportunity.conditions.map((condition) => ({
    evidence: condition.evidence,
    eligible: condition.eligible,
    status: condition.eligible ? "satisfied" : "not-satisfied",
    details: { ...condition }
  }));
}

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

  const due = evaluations.filter((evaluation) => evaluation.due);
  const available = due
    .filter((evaluation) => evaluation.opportunity?.eligible)
    .map((evaluation) => evaluation.opportunity);

  const advisories = due.map((evaluation) => ({
    definitionId: evaluation.definitionId,
    timing: evaluation.timing,
    available: evaluation.opportunity?.eligible ?? false,
    conditions: buildConditionAdvisories(evaluation)
  }));

  return {
    timing,
    evaluations,
    due,
    available,
    advisories
  };
}
