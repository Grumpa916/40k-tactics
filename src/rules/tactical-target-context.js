import {
  getTargetObjectiveImpact,
  getTargetPrimaryMissionImpact
} from "./tactical-objective-impact.js";
import { getTargetSecondaryMissionImpact } from "./tactical-secondary-target-impact.js";
import { getTargetThreatImpact } from "./tactical-threat-impact.js";
import { getTargetObjectiveSwing } from "./tactical-objective-swing.js";
import { getTargetRetaliationRisk } from "./tactical-retaliation-risk.js";
import { getGameStrategyContext } from "./tactical-game-strategy.js";
import { getStratagemResourceContext } from "./tactical-stratagem-context.js";
import { getPrimaryStrategyContext } from "./tactical-primary-strategy-router.js";
import { clamp01, impactLabel } from "./tactical-context-utils.js";

export {
  getTargetObjectiveImpact,
  getTargetPrimaryMissionImpact,
  getTargetSecondaryMissionImpact,
  getTargetThreatImpact,
  getTargetObjectiveSwing,
  getTargetRetaliationRisk,
  getGameStrategyContext,
  getStratagemResourceContext,
  getPrimaryStrategyContext
};

function scoringRole({ objective, primary, secondary, objectiveSwing }) {
  const ocScore = clamp01((Number(objectiveSwing?.targetNominalOc) || 0) / 10);
  const score = clamp01(
    0.22 * objective.score +
    0.27 * primary.score +
    0.27 * secondary.score +
    0.18 * objectiveSwing.score +
    0.06 * ocScore
  );
  const role = score >= 0.68
    ? "key-scoring-unit"
    : score <= 0.18
      ? "low-scoring-value"
      : "mixed-role";
  const reason = role === "key-scoring-unit"
    ? "This unit combines objective/mission relevance with meaningful control leverage and should not be treated as a disposable target."
    : role === "low-scoring-value"
      ? "Recorded mission, objective and OC context do not currently identify this unit as a key scoring piece."
      : "This unit has some scoring relevance, but its value is split between mission and combat roles.";
  return Object.freeze({ score, label: impactLabel(score), role, reason });
}

function battleShockContext({ objective, primary, secondary, objectiveSwing, stratagems }) {
  const active = stratagems.targetBattleShocked === true || objectiveSwing.targetBattleShocked === true;
  if (!active) {
    return Object.freeze({
      active: false,
      score: 0,
      marginalKillPenalty: 0,
      reason: "Target is not currently recorded as Battle-shocked."
    });
  }
  const scoringSuppression = clamp01(
    0.4 * objective.score + 0.35 * primary.score + 0.25 * secondary.score
  );
  const marginalKillPenalty = clamp01(Math.max(scoringSuppression, objectiveSwing.score) * 0.75);
  return Object.freeze({
    active: true,
    score: clamp01(0.45 + 0.55 * scoringSuppression),
    marginalKillPenalty,
    ocSuppressed: objectiveSwing.targetOc === 0 && Number(objectiveSwing.targetNominalOc) > 0,
    stratagemAccessSuppressed: stratagems.targetBattleShocked === true,
    reason: `Target is already Battle-shocked${objectiveSwing.targetOc === 0 ? ", so its saved OC is treated as suppressed" : ""}${stratagems.targetBattleShocked ? " and its controlling player cannot target it with Stratagems" : ""}. Mission value already neutralized by Battle-shock is not double-counted as kill value.`
  });
}

export function getTargetStrategicContext(state, options = {}) {
  const objective = getTargetObjectiveImpact(state, options);
  const primary = getTargetPrimaryMissionImpact(state, options);
  const secondary = getTargetSecondaryMissionImpact(state, options);
  const threat = getTargetThreatImpact(state, options);
  const objectiveSwing = getTargetObjectiveSwing(state, options);
  const retaliation = getTargetRetaliationRisk(state, options);
  const gameStrategy = getGameStrategyContext(state, options);
  const stratagems = getStratagemResourceContext(state, options);
  const primaryStrategy = getPrimaryStrategyContext(state, options);
  const battleShock = battleShockContext({ objective, primary, secondary, objectiveSwing, stratagems });
  const role = scoringRole({ objective, primary, secondary, objectiveSwing });
  const weights = gameStrategy.weights;

  const weightedPrimary = primary.score * weights.primary;
  const weightedSecondary = secondary.score * weights.secondary;
  const weightedThreat = threat.score * weights.threat;
  const weightedObjective = objective.score;
  const weightedSwing = objectiveSwing.score * weights.objectiveSwing;
  const weightedRetaliation = retaliation.score * weights.retaliation;
  const weightedPrimaryStrategy = primaryStrategy.targetingScore * weights.primary;
  const score = clamp01(
    0.23 * weightedPrimary +
    0.21 * weightedSecondary +
    0.14 * weightedThreat +
    0.12 * weightedObjective +
    0.20 * weightedSwing +
    0.10 * weightedRetaliation +
    0.12 * weightedPrimaryStrategy
  );

  return Object.freeze({
    score,
    label: impactLabel(score),
    objective,
    primary,
    primaryStrategy,
    secondary,
    threat,
    objectiveSwing,
    retaliation,
    stratagems,
    battleShock,
    scoringRole: role,
    gameStrategy,
    reason: [
      primary.reason,
      primaryStrategy.active ? primaryStrategy.reason : "",
      secondary.reason,
      objectiveSwing.reason,
      threat.reason,
      retaliation.reason,
      battleShock.active ? battleShock.reason : "",
      gameStrategy.reason
    ].filter(Boolean).join(" ")
  });
}