import { getSecondaryMissionHistory, SECONDARY_MISSION_STATUS } from "./secondary-mission-lifecycle.js";

const DEFINITION_ID = "secondary-a-tempting-target";

/** Recorded-state evidence for the selected target; final control is tabletop-confirmed. */
export function getTemptingTargetScoringEvidence(state, playerId, { instanceId = null } = {}) {
  if (!playerId) {
    return Object.freeze({ count: null, objectiveId: null, objectiveName: null, detail: "Scoring player is not specified." });
  }

  const mission = getSecondaryMissionHistory(state, playerId).find((entry) =>
    entry.definitionId === DEFINITION_ID &&
    entry.status === SECONDARY_MISSION_STATUS.ACTIVE &&
    (!instanceId || entry.instanceId === instanceId)
  );
  if (!mission) {
    return Object.freeze({ count: null, objectiveId: null, objectiveName: null, detail: "No active A Tempting Target card is recorded for this player." });
  }

  const objectiveId = mission.cardState?.temptingTargetObjectiveId ?? null;
  if (!objectiveId) {
    return Object.freeze({ count: null, objectiveId: null, objectiveName: null, detail: "The opponent's No Man's Land target selection has not been recorded." });
  }

  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((entry) => entry?.id === objectiveId);
  if (!objective) {
    return Object.freeze({ count: null, objectiveId, objectiveName: objectiveId, detail: "The selected Tempting Target objective is not present in the current battlefield record." });
  }

  const objectiveName = objective.name ?? objective.label ?? objectiveId;
  const control = objective.control;
  if (!control || control.controlState == null) {
    return Object.freeze({ count: null, objectiveId, objectiveName, detail: objectiveName + " is the selected Tempting Target; objective control has not been recorded." });
  }

  const controlled = control.controlState === "controlled" && control.controllerId === playerId;
  const detail = controlled
    ? objectiveName + " is the selected Tempting Target and is recorded as controlled by you. Confirm control on the tabletop."
    : objectiveName + " is the selected Tempting Target and is not recorded as controlled by you. Confirm control on the tabletop.";
  return Object.freeze({ count: Number(controlled), objectiveId, objectiveName, detail });
}
