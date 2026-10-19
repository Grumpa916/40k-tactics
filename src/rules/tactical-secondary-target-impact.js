import {
  getSecondaryMissionHistory,
  SECONDARY_MISSION_STATUS
} from "./secondary-mission-lifecycle.js";
import { isUnitBattleShocked } from "./unit-status-summary.js";
import {
  clamp01,
  distanceBetween,
  hasKeyword,
  impactLabel,
  opponentPlayerIds,
  unitById,
  unitPosition
} from "./tactical-context-utils.js";

const TABLE_CENTRE = Object.freeze({ x: 30, y: 22 });

function activeSecondaryEntries(state, playerId) {
  if (!playerId) return [];
  return getSecondaryMissionHistory(state, playerId)
    .filter((entry) => entry.status === SECONDARY_MISSION_STATUS.ACTIVE);
}

function definitionSlug(definition) {
  return String(definition?.id ?? "")
    .replace(/^secondary-/, "")
    .trim()
    .toLowerCase();
}

function structuredDestructionRelevance(definition, targetUnitId) {
  const conditions = Array.isArray(definition?.conditions) ? definition.conditions : [];
  return conditions.some((condition) =>
    condition?.evidence === "unit-destruction" &&
    condition?.args?.unitId === targetUnitId &&
    condition?.args?.expected !== false
  );
}

function centreGroundRelevance(state, target) {
  if (!target || target.status === "destroyed") return null;
  if (isUnitBattleShocked(target) || hasKeyword(state, target, "aircraft")) return null;
  const distance = distanceBetween(unitPosition(target), TABLE_CENTRE);
  if (!Number.isFinite(distance) || distance > 9) return null;
  const score = distance <= 3 ? 1 : distance <= 6 ? 0.82 : 0.3;
  return { score, distance };
}

/**
 * Active secondary cards influence target ranking only when their stored rules
 * are verified or when they contain an explicit structured destruction target.
 * Draft/unverified card text remains visible but cannot silently alter advice.
 */
export function getTargetSecondaryMissionImpact(state, { playerId, targetUnitId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!targetUnitId) throw new TypeError("targetUnitId is required.");

  const target = unitById(state, targetUnitId);
  if (!target || target.ownerId === playerId || target.status === "destroyed") {
    return Object.freeze({
      score: 0,
      label: "none",
      confidence: "low",
      scoringSignals: Object.freeze([]),
      denialSignals: Object.freeze([]),
      unresolvedMissions: Object.freeze([]),
      reason: "No active secondary target context is available."
    });
  }

  const own = activeSecondaryEntries(state, playerId);
  const opponent = opponentPlayerIds(state, playerId)
    .flatMap((id) => activeSecondaryEntries(state, id));
  const scoringSignals = [];
  const denialSignals = [];
  const unresolvedMissions = [];

  for (const entry of own) {
    const definition = entry.definition ?? {};
    const slug = definitionSlug(definition);
    const verified = definition.rulesVerified === true;

    if (structuredDestructionRelevance(definition, targetUnitId)) {
      scoringSignals.push({
        missionId: definition.id,
        missionName: definition.name ?? definition.id,
        score: 1,
        confidence: verified ? "high" : "moderate",
        reason: "This active secondary contains a structured destruction condition for the selected target."
      });
      continue;
    }

    if (verified && slug === "assassination" && hasKeyword(state, target, "character")) {
      scoringSignals.push({
        missionId: definition.id,
        missionName: definition.name ?? "Assassination",
        score: 1,
        confidence: "high",
        reason: "Active Assassination makes this enemy CHARACTER a directly scoring-relevant target."
      });
      continue;
    }

    if (verified && slug === "centre-ground") {
      const relevance = centreGroundRelevance(state, target);
      if (relevance) {
        scoringSignals.push({
          missionId: definition.id,
          missionName: definition.name ?? "Centre Ground",
          score: relevance.score,
          confidence: relevance.distance <= 3 ? "moderate" : "low",
          reason: `This enemy is approximately ${relevance.distance.toFixed(1)} inches from battlefield centre; removing it may help clear Centre Ground. Exact tabletop distance remains authoritative.`
        });
      }
      continue;
    }

    if (!verified) unresolvedMissions.push(definition.name ?? definition.id ?? "Unverified secondary");
  }

  for (const entry of opponent) {
    const definition = entry.definition ?? {};
    const slug = definitionSlug(definition);
    const verified = definition.rulesVerified === true;

    if (verified && slug === "centre-ground") {
      const relevance = centreGroundRelevance(state, target);
      if (relevance) {
        denialSignals.push({
          missionId: definition.id,
          missionName: definition.name ?? "Centre Ground",
          score: relevance.score,
          confidence: relevance.distance <= 3 ? "moderate" : "low",
          reason: `This opponent unit is approximately ${relevance.distance.toFixed(1)} inches from battlefield centre and may be contributing to their Centre Ground scoring.`
        });
      }
      continue;
    }

    if (!verified) unresolvedMissions.push(definition.name ?? definition.id ?? "Unverified opponent secondary");
  }

  const bestScoring = scoringSignals.reduce((best, signal) => Math.max(best, signal.score), 0);
  const bestDenial = denialSignals.reduce((best, signal) => Math.max(best, signal.score), 0);
  const score = clamp01(Math.max(
    bestScoring,
    0.8 * bestDenial,
    0.65 * bestScoring + 0.35 * bestDenial
  ));
  const evidence = [...scoringSignals, ...denialSignals];
  const confidence = evidence.some((signal) => signal.confidence === "high")
    ? "high"
    : evidence.some((signal) => signal.confidence === "moderate")
      ? "moderate"
      : "low";

  const reasonParts = evidence.map((signal) => signal.reason);
  if (unresolvedMissions.length) {
    reasonParts.push(`${[...new Set(unresolvedMissions)].join(", ")} are active but their target-specific effect is not used for ranking because the stored card rules are not verified.`);
  }

  return Object.freeze({
    score,
    label: impactLabel(score),
    confidence,
    scoringSignals: Object.freeze(scoringSignals.map((signal) => Object.freeze({ ...signal }))),
    denialSignals: Object.freeze(denialSignals.map((signal) => Object.freeze({ ...signal }))),
    unresolvedMissions: Object.freeze([...new Set(unresolvedMissions)]),
    reason: reasonParts.join(" ") || "No verified active secondary directly changes this target's priority."
  });
}
