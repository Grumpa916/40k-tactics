const CONFIDENCE_WEIGHT = Object.freeze({
  high: 1,
  moderate: 0.75,
  low: 0.5
});

const TYPE_VALUE = Object.freeze({
  scoring: 4,
  fight: 4,
  "shooting-target": 4,
  charge: 3,
  engagement: 3,
  survival: 3,
  threat: 2,
  objective: 2
});

function normalizeConfidence(value) {
  return Object.hasOwn(CONFIDENCE_WEIGHT, value) ? value : "low";
}

function recommendationValue(recommendation) {
  const priority = Number.isFinite(recommendation?.priority)
    ? recommendation.priority
    : 0;
  const confidence = CONFIDENCE_WEIGHT[normalizeConfidence(recommendation?.confidence)];
  const typeValue = TYPE_VALUE[recommendation?.type] ?? 1;

  return priority * 10 + typeValue + confidence;
}

function sortRecommendations(items) {
  return [...items].sort((a, b) =>
    recommendationValue(b) - recommendationValue(a) ||
    (a.unitId ?? "").localeCompare(b.unitId ?? "") ||
    (a.targetUnitId ?? "").localeCompare(b.targetUnitId ?? "") ||
    (a.objectiveId ?? "").localeCompare(b.objectiveId ?? "") ||
    (a.type ?? "").localeCompare(b.type ?? "")
  );
}

export function rankTacticalRecommendations(
  recommendations,
  { limit = 5 } = {}
) {
  if (!Array.isArray(recommendations)) return [];

  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 5;

  return sortRecommendations(
    recommendations
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        ...item,
        confidence: normalizeConfidence(item.confidence)
      }))
  ).slice(0, safeLimit);
}

export function getTacticalOpportunityValue(recommendation) {
  if (!recommendation || typeof recommendation !== "object") return null;

  return {
    priority: Number.isFinite(recommendation.priority) ? recommendation.priority : 0,
    confidence: normalizeConfidence(recommendation.confidence),
    categoryValue: TYPE_VALUE[recommendation.type] ?? 1
  };
}
