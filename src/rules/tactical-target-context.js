import {
  getTargetObjectiveImpact,
  getTargetPrimaryMissionImpact
} from "./tactical-objective-impact.js";
import { getTargetSecondaryMissionImpact } from "./tactical-secondary-target-impact.js";
import { getTargetThreatImpact } from "./tactical-threat-impact.js";
import { clamp01, impactLabel } from "./tactical-context-utils.js";

export {
  getTargetObjectiveImpact,
  getTargetPrimaryMissionImpact,
  getTargetSecondaryMissionImpact,
  getTargetThreatImpact
};

export function getTargetStrategicContext(state, options = {}) {
  const objective = getTargetObjectiveImpact(state, options);
  const primary = getTargetPrimaryMissionImpact(state, options);
  const secondary = getTargetSecondaryMissionImpact(state, options);
  const threat = getTargetThreatImpact(state, options);
  const score = clamp01(
    0.32 * primary.score +
    0.28 * secondary.score +
    0.22 * threat.score +
    0.18 * objective.score
  );
  return Object.freeze({
    score,
    label: impactLabel(score),
    objective,
    primary,
    secondary,
    threat,
    reason: [primary.reason, secondary.reason, threat.reason]
      .filter(Boolean)
      .join(" ")
  });
}
