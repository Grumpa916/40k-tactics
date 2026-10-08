import { SCORING_ACTION_TYPES, getScoringActionContext } from "./scoring-action-context.js";
import { getSpatialContext } from "./spatial-context.js";

const CANDIDATE_BANDS = new Set(["close", "near", "mid"]);

function unitCandidateRank(band) {
  if (band === "close") return 3;
  if (band === "near") return 2;
  if (band === "mid") return 1;
  return 0;
}

export function getTacticalScoringActions(
  state,
  { playerId, scoringAdvisories } = {}
) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!scoringAdvisories || typeof scoringAdvisories !== "object") {
    throw new TypeError("Scoring advisories are required.");
  }

  const contexts = (Array.isArray(scoringAdvisories.due) ? scoringAdvisories.due : [])
    .map((evaluation) => evaluation?.opportunity)
    .filter(Boolean)
    .map((opportunity) => getScoringActionContext(opportunity));
  const spatial = getSpatialContext(state, { playerId });

  return contexts.map((context) => {
    const actions = context.actions.map((action) => {
      if (
        action.type !== SCORING_ACTION_TYPES.SECURE_OBJECTIVE &&
        action.type !== SCORING_ACTION_TYPES.CONTEST_OBJECTIVE &&
        action.type !== SCORING_ACTION_TYPES.BREAK_CONTEST
      ) {
        return action;
      }

      const candidates = spatial.objectiveProximity
        .filter((entry) =>
          entry.objectiveId === action.objectiveId &&
          CANDIDATE_BANDS.has(entry.band)
        )
        .sort((a, b) => unitCandidateRank(b.band) - unitCandidateRank(a.band))
        .map((entry) => ({
          unitId: entry.unitId,
          distance: entry.distance,
          distanceBand: entry.band,
          confidence: entry.band === "close" ? "high" : entry.band === "near" ? "moderate" : "low"
        }));

      return {
        ...action,
        candidates
      };
    });

    return {
      ...context,
      actions
    };
  });
}
