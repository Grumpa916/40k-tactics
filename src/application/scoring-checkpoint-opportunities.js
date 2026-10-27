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

function reviewMissionDependsOnObjectives(mission) {
  const result = mission?.result ?? {};
  if ((result.conditions ?? []).some((condition) => condition?.evidence === 'objective-control')) return true;
  const windows = result.scoringWindows ?? (result.scoringWindow ? [result.scoringWindow] : []);
  return windows.some((window) => (window?.tiers ?? []).some((tier) => /objective|control/i.test(String(tier?.summary ?? ''))));
}

function reviewMissionEvidenceUnavailable(mission) {
  const result = mission?.result ?? {};
  if (result.manualReviewRequired === true) return true;
  return (result.conditions ?? []).some((condition) =>
    condition?.reason != null || condition?.actual == null && condition?.eligible === false
  );
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

export function getMissionReviewOpportunity(state, mission) {
  if (!mission) return null;
  const result = mission.result ?? {};
  const objectiveDependent = reviewMissionDependsOnObjectives(mission);
  const needsObjectiveConfirmation = objectiveDependent && !areObjectiveControlsFresh(state);
  const needsManualConfirmation = reviewMissionEvidenceUnavailable(mission);
  const eligible = result.eligible === true;
  return Object.freeze({
    kind: mission.category ?? (mission.instanceId ? 'secondary' : 'mission'),
    definitionId: mission.definitionId,
    instanceId: mission.instanceId ?? null,
    definitionName: mission.definitionName ?? mission.definitionId,
    actionable: eligible || needsObjectiveConfirmation || needsManualConfirmation,
    eligible,
    objectiveDependent,
    needsObjectiveConfirmation,
    needsManualConfirmation
  });
}

export const getSecondaryCheckpointOpportunity = getMissionReviewOpportunity;

function actionableActions(actions = []) {
  return actions.filter((action) => !action?.review || action.review.outcome === 'completed');
}

function decorateReviewMissions(state, missions = []) {
  return missions
    .map((mission) => ({ mission, opportunity: getMissionReviewOpportunity(state, mission) }))
    .filter((entry) => entry.opportunity?.actionable);
}

export function decorateScoringCheckpointGroup(state, group) {
  const primaryOpportunity = getPrimaryCheckpointOpportunity(state, group);
  const reviewPrimaryOpportunities = decorateReviewMissions(state, group?.review?.primary ?? []);
  const secondaryOpportunities = decorateReviewMissions(state, group?.review?.secondary ?? []);
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
