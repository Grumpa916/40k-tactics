import { getCombatHistorySummary } from "./combat-history-summary.js";
import { getSpatialContext } from "./spatial-context.js";
import { getScoringOpportunityAdvisories } from "./tactical-scoring-opportunities.js";
import { getTacticalScoringActions } from "./tactical-scoring-actions.js";
import { getTacticalCombatRecommendations } from "./tactical-combat-recommendations.js";

function unitById(state, unitId) {

  return (Array.isArray(state?.units) ? state.units : []).find((unit) => unit.id === unitId) ?? null;
}

function scoringRecommendationPriority(action) {
  const confidence = action?.candidates?.[0]?.confidence;
  if (confidence === "high") return 3;
  if (confidence === "moderate") return 2;
  return 1;
}

function recommendationScore(item) {
  if (item.type === "scoring") {
    return item.priority * 10 + (item.candidates?.length ? 2 : 0);
  }
  return item.priority * 10;
}

function sortRecommendations(items) {
  return items.sort((a, b) =>
    recommendationScore(b) - recommendationScore(a) ||
    (a.unitId ?? "").localeCompare(b.unitId ?? "") ||
    (a.targetUnitId ?? "").localeCompare(b.targetUnitId ?? "")
  );
}

function getScoringRecommendations(scoringActions) {
  if (!Array.isArray(scoringActions)) return [];

  return scoringActions.flatMap((context) =>
    (Array.isArray(context?.actions) ? context.actions : [])
      .filter((action) => action?.type && action.type !== "condition-satisfied")
      .map((action) => ({
        type: "scoring",
        priority: scoringRecommendationPriority(action),
        actionType: action.type,
        objectiveId: action.objectiveId,
        unitId: action.candidates?.[0]?.unitId ?? null,
        confidence: action.candidates?.[0]?.confidence ?? "low",
        reason: action.reason,
        candidates: action.candidates ?? []
      }))
  );
}

export function getTacticalPriorities(state, { playerId, scoringDefinitions = [], scoringTiming = null, shootingContext = null } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");

  const combat = getCombatHistorySummary(state, { playerId });
  const spatial = getSpatialContext(state, { playerId });
  const priorities = [];

  for (const unitSummary of combat.units) {
    if (unitSummary.destroyed) continue;

    if (unitSummary.chargesReceived.length > 0 || unitSummary.engagedWith.length > 0) {
      priorities.push({
        type: "engagement",
        priority: 3,
        unitId: unitSummary.unitId,
        reason: unitSummary.engagedWith.length > 0
          ? "Unit is currently engaged in Fight."
          : "Unit was charged by an opponent."
      });
    }

    if (unitSummary.damageTaken > 0) {
      priorities.push({
        type: "survival",
        priority: 2,
        unitId: unitSummary.unitId,
        reason: "Unit has taken damage from the opponent."
      });
    }
  }

  for (const proximity of spatial.unitProximity) {
    const other = unitById(state, proximity.otherUnitId);
    if (!other || other.ownerId === playerId) continue;
    if (proximity.band === "close" || proximity.band === "near") {
      priorities.push({
        type: "threat",
        priority: proximity.band === "close" ? 3 : 2,
        unitId: proximity.unitId,
        targetUnitId: proximity.otherUnitId,
        reason: "Enemy unit is approximately " + proximity.distance + " inches away."
      });
    }
  }

  for (const objective of spatial.objectiveProximity) {
    if (objective.band === "close" || objective.band === "near") {
      priorities.push({
        type: "objective",
        priority: objective.band === "close" ? 3 : 2,
        unitId: objective.unitId,
        objectiveId: objective.objectiveId,
        reason: "Unit is approximately " + objective.distance + " inches from the objective."
      });
    }
  }

  priorities.sort((a, b) => b.priority - a.priority);

  const scoringOpportunities = scoringTiming
    ? getScoringOpportunityAdvisories(state, {
        definitions: scoringDefinitions,
        timing: scoringTiming
      })
    : null;

  const scoringActions = scoringOpportunities
    ? getTacticalScoringActions(state, {
        playerId,
        scoringAdvisories: scoringOpportunities
      })
    : null;

  const scoringRecommendations = getScoringRecommendations(scoringActions);
  const combatRecommendations = getTacticalCombatRecommendations(state, {
    playerId,
    shootingContext
  });
  const recommendations = sortRecommendations([
    ...priorities,
    ...scoringRecommendations,
    ...combatRecommendations.recommendations
  ]);

  return {
    playerId,
    phase: state?.phase ?? null,
    priorities,
    scoringOpportunities,
    scoringActions,
    combatRecommendations,
    recommendations
  };
}
