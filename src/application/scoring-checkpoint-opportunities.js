import { missionConditionEvidence } from '../rules/checkpoint-mission-evidence.js';
import { getMissionEvidenceCondition } from '../rules/mission-evidence-conditions.js';
import { estimateCheckpointVp } from '../rules/checkpoint-vp-estimate.js';

const OBJECTIVE_CONDITION_TYPES = new Set([
  'control-non-home',
  'count-non-home',
  'count-objectives',
  'control-more',
  'control-objectives',
  'control-central',
  'control-home',
  'new-non-home-control',
  'control-opponent-home'
]);

function currentTurnStamp(state) {
  return { round: state?.battle?.round ?? 0, turn: state?.turn ?? 0 };
}

export function areObjectiveControlsFresh(state) {
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  if (!objectives.length || objectives.some((objective) => objective?.control == null)) return false;
  const { round, turn } = currentTurnStamp(state);
  return objectives.every((objective) =>
    objective?.controlRecordedAt?.round === round && objective?.controlRecordedAt?.turn === turn
  );
}

function conditionForItem(item) {
  return item?.condition ?? getMissionEvidenceCondition(item?.summary) ?? null;
}

function itemDependsOnObjectives(item) {
  const condition = conditionForItem(item);
  return OBJECTIVE_CONDITION_TYPES.has(condition?.type);
}

function scoreValue(tier, count) {
  const vp = Number(tier?.vp);
  if (!Number.isInteger(vp) || vp <= 0 || !(count > 0)) return 0;
  return /\b(?:per|for each)\b/i.test(String(tier?.summary ?? '')) ? vp * count : vp;
}

function scoreWindowFromEvidence(entries) {
  const satisfied = entries.filter((entry) => entry.evidence.count > 0);
  if (!satisfied.length) return 0;
  const values = satisfied.map((entry) => scoreValue(entry.tier, entry.evidence.count));
  if (entries.length === 1) return values[0] ?? 0;
  const relationships = entries.map((entry) => entry.tier?.relationship).filter(Boolean);
  if (relationships.includes('cumulative')) return values.reduce((sum, value) => sum + value, 0);
  // Tiered cards are normally alternatives. When the catalog does not explicitly
  // identify cumulative scoring, use the highest supported tier rather than
  // silently adding awards together.
  return Math.max(0, ...values);
}

export function estimateReviewMissionVp(state, playerId, mission) {
  const result = mission?.result ?? {};
  const windows = result.scoringWindows ?? (result.scoringWindow ? [result.scoringWindow] : []);
  const evidence = windows.flatMap((window) => (window?.tiers ?? []).map((tier) => ({
    window,
    tier,
    condition: conditionForItem(tier),
    evidence: missionConditionEvidence(state, playerId, tier)
  })));
  const recognized = evidence.filter((entry) => entry.condition != null);
  if (!recognized.length) return null;
  const points = windows.reduce((total, window) => {
    const entries = recognized.filter((entry) => entry.window === window);
    return total + scoreWindowFromEvidence(entries);
  }, 0);
  const partial = evidence.some((entry) => entry.condition == null || entry.evidence.count == null);
  const objectiveDependent = recognized.some((entry) => OBJECTIVE_CONDITION_TYPES.has(entry.condition?.type));
  return Object.freeze({
    points,
    partial,
    objectiveDependent,
    evidence: Object.freeze(recognized)
  });
}

export function getPrimaryCheckpointOpportunity(state, group) {
  const reference = group?.primaryReference;
  const windows = Array.isArray(group?.primaryScoringWindows) ? group.primaryScoringWindows : [];
  if (!reference || !windows.length) return null;

  const items = windows.flatMap((window) => window?.items ?? []);
  if (!items.length) return null;
  const evidence = items.map((item) => ({ item, evidence: missionConditionEvidence(state, group.playerId, item) }));
  const objectiveDependent = items.some(itemDependsOnObjectives);
  const objectiveFresh = areObjectiveControlsFresh(state);
  const unknownEvidence = evidence.some((entry) => entry.evidence.count == null);
  const estimate = estimateCheckpointVp(state, group.playerId, {
    ...reference,
    scoringWindows: windows
  }, group.checkpoint);
  const calculatedPoints = Number(estimate?.points) > 0 ? Number(estimate.points) : 0;
  const needsObjectiveConfirmation = objectiveDependent && !objectiveFresh;
  const needsManualConfirmation = unknownEvidence || estimate?.partial === true;
  const actionable = calculatedPoints > 0 || needsObjectiveConfirmation || needsManualConfirmation;

  return Object.freeze({
    kind: 'primary',
    definitionId: reference.id,
    definitionName: reference.name,
    actionable,
    calculatedPoints,
    estimate: estimate ?? null,
    objectiveDependent,
    needsObjectiveConfirmation,
    needsManualConfirmation,
    evidence: Object.freeze(evidence)
  });
}

export function getMissionReviewOpportunity(state, mission, playerId = null) {
  if (!mission) return null;
  const result = mission.result ?? {};
  const scoringPlayerId = playerId ?? mission.playerId ?? result.playerId ?? null;
  const estimate = scoringPlayerId ? estimateReviewMissionVp(state, scoringPlayerId, mission) : null;
  const objectiveDependent = estimate?.objectiveDependent === true ||
    (result.conditions ?? []).some((condition) => condition?.evidence === 'objective-control');
  const needsObjectiveConfirmation = objectiveDependent && !areObjectiveControlsFresh(state);
  const eligible = result.eligible === true;
  const calculatedPoints = Number(estimate?.points) > 0 ? Number(estimate.points) : 0;
  const needsManualConfirmation = result.manualReviewRequired === true || estimate?.partial === true;
  // A due-but-manual card is not actionable by itself. It becomes actionable
  // only when recorded evidence supports points, a calculable objective check
  // needs confirmation, or a recorded mission action is handled separately.
  const actionable = eligible || calculatedPoints > 0 || needsObjectiveConfirmation;
  return Object.freeze({
    kind: mission.category ?? (mission.instanceId ? 'secondary' : 'mission'),
    definitionId: mission.definitionId,
    instanceId: mission.instanceId ?? null,
    definitionName: mission.definitionName ?? mission.definitionId,
    actionable,
    eligible,
    calculatedPoints,
    estimate: estimate ?? null,
    objectiveDependent,
    needsObjectiveConfirmation,
    needsManualConfirmation
  });
}

export const getSecondaryCheckpointOpportunity = getMissionReviewOpportunity;

function actionableActions(actions = []) {
  return actions.filter((action) => !action?.review || action.review.outcome === 'completed');
}

function decorateReviewMissions(state, playerId, missions = []) {
  return missions
    .map((mission) => ({ mission, opportunity: getMissionReviewOpportunity(state, mission, playerId) }))
    .filter((entry) => entry.opportunity?.actionable);
}

export function decorateScoringCheckpointGroup(state, group) {
  const primaryOpportunity = getPrimaryCheckpointOpportunity(state, group);
  const reviewPrimaryOpportunities = decorateReviewMissions(state, group?.playerId, group?.review?.primary ?? []);
  const secondaryOpportunities = decorateReviewMissions(state, group?.playerId, group?.review?.secondary ?? []);
  const actions = actionableActions(group?.actions ?? []);
  const reviewOpportunities = [...reviewPrimaryOpportunities, ...secondaryOpportunities];
  const actionable = Boolean(primaryOpportunity?.actionable || reviewOpportunities.length || actions.length);
  const requiresObjectiveConfirmation = Boolean(
    primaryOpportunity?.needsObjectiveConfirmation ||
    reviewOpportunities.some((entry) => entry.opportunity.needsObjectiveConfirmation)
  );

  return {
    ...group,
    opportunity: primaryOpportunity,
    reviewPrimaryOpportunities,
    secondaryOpportunities,
    actionableActions: actions,
    actionable,
    requiresObjectiveConfirmation
  };
}
