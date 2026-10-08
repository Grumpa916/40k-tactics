import { SCORING_EVIDENCE } from "./scoring-eligibility.js";

export const SCORING_ACTION_TYPES = Object.freeze({
  SECURE_OBJECTIVE: "secure-objective",
  CONTEST_OBJECTIVE: "contest-objective",
  BREAK_CONTEST: "break-contest"
});

function getObjectiveAction(condition) {
  if (condition.evidence !== SCORING_EVIDENCE.OBJECTIVE_CONTROL) {
    return null;
  }

  const { objectiveId, playerId, expected, actual } = condition;

  if (!objectiveId || !playerId || expected !== "controlled") {
    return null;
  }

  if (condition.eligible) {
    return null;
  }

  if (actual === "uncontrolled") {
    return {
      type: SCORING_ACTION_TYPES.SECURE_OBJECTIVE,
      objectiveId,
      playerId,
      reason: "Objective is uncontrolled and control is required."
    };
  }

  if (actual === "enemy-controlled") {
    return {
      type: SCORING_ACTION_TYPES.CONTEST_OBJECTIVE,
      objectiveId,
      playerId,
      reason: "Objective is enemy-controlled and control is required."
    };
  }

  if (actual === "contested" || actual === "contested-by-others") {
    return {
      type: SCORING_ACTION_TYPES.BREAK_CONTEST,
      objectiveId,
      playerId,
      reason: "Objective is contested and control is required."
    };
  }

  return null;
}

export function getScoringActionContext(
  scoringOpportunity,
  { includeSatisfied = false } = {}
) {
  if (!scoringOpportunity || typeof scoringOpportunity !== "object") {
    throw new TypeError("A scoring opportunity is required.");
  }

  const conditions = Array.isArray(scoringOpportunity.conditions)
    ? scoringOpportunity.conditions
    : [];

  const actions = [];

  for (const condition of conditions) {
    if (!condition || typeof condition !== "object") continue;

    const action = getObjectiveAction(condition);
    if (action) {
      actions.push({
        ...action,
        evidence: condition.evidence,
        status: condition.eligible ? "satisfied" : "not-satisfied"
      });
    } else if (includeSatisfied && condition.eligible) {
      actions.push({
        type: "condition-satisfied",
        evidence: condition.evidence,
        status: "satisfied"
      });
    }
  }

  return {
    definitionId: scoringOpportunity.definitionId ?? null,
    timing: scoringOpportunity.timing ?? null,
    available: scoringOpportunity.eligible === true,
    actions
  };
}

export function getScoringActionContexts(scoringAdvisories, options = {}) {
  if (!scoringAdvisories || typeof scoringAdvisories !== "object") {
    throw new TypeError("Scoring advisories are required.");
  }

  if (Array.isArray(scoringAdvisories.due)) {
    return scoringAdvisories.due
      .map((evaluation) => evaluation?.opportunity)
      .filter(Boolean)
      .map((opportunity) => getScoringActionContext(opportunity, options));
  }

  const available = Array.isArray(scoringAdvisories.available)
    ? scoringAdvisories.available
    : [];

  return available.map((opportunity) =>
    getScoringActionContext(opportunity, options)
  );
}
