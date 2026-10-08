export { RULE_SET_VERSIONS, createRuleSet } from "./rule-set.js";
export { createRuleContext } from "./rule-context.js";
export { DATA_SCHEMA_VERSION, createGameData } from "../data/game-data.js";
export { createUnitProfile } from "./unit-profile.js";
export { createWeaponProfile } from "./weapon-profile.js";
export { getUnitWeapons, getUnitCharacteristic } from "./unit-rules.js";
export { getWeaponCharacteristic, isRangedWeapon, isMeleeWeapon } from "./weapon-rules.js";
export { resolveAttackRoll, resolveWoundRoll } from "./combat-resolution.js";
export { normalizeModifier, applyTargetModifier, isCriticalHit } from "./combat-modifiers.js";
export { resolveSaveRoll, resolveDamage } from "./save-damage-resolution.js";
export { resolveAttack } from "./attack-resolution.js";
export { buildAttackProfile } from "./combat-profile.js";
export { getFightCandidates } from "./fight-candidates.js";
export { getFightState } from "./fight-state.js";
export {
  createTurnSnapshot,
  getTurnSnapshot,
  getPreviousTurnSnapshot,
  getScoringEventsForTurn,
  getUnitDestructionsForTurn,
  getFriendlyUnitDestructionsForTurn,
  getEnemyUnitDestructionsForTurn,
  getUnitStateAtTurnStart,
  getObjectiveStateAtTurnStart
} from "./scoring-evidence-state.js";

export { getShootingTargetPriorities } from "./tactical-shooting-targets.js";
export { getExpectedDamage } from "./expected-damage.js";
export { getFireConcentrationAdvisory } from "./tactical-fire-concentration.js";
export {
  SCORING_EVIDENCE,
  evaluateObjectiveControl,
  evaluateUnitStatus,
  evaluateUnitOwnership,
  evaluateUnitDestruction,
  evaluateTurnSnapshot
} from "./scoring-eligibility.js";

export {
  SCORING_TIMINGS,
  createScoringCondition,
  createMissionDefinition,
  evaluateMissionDefinition
} from "./mission-definition.js";

export {
  SCORING_OPPORTUNITY_STATES,
  evaluateScoringOpportunity
} from "./scoring-opportunity.js";

export {\n  isScoringTimingDue,\n  evaluateScoringOpportunityAtTiming\n} from "./scoring-opportunity-timing.js";\n
export {
  SCORING_ACTION_TYPES,
  getScoringActionContext,
  getScoringActionContexts
} from "./scoring-action-context.js";

export { getTacticalScoringActions } from "./tactical-scoring-actions.js";
