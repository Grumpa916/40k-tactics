import { UNIT_STATUS } from "../state/unit.js";
import {
  getFightEngagementState,
  getFightStepStartEngagementState
} from "./fight-engagement-state.js";

const CHARGE_EVENT = "charge.outcome_recorded";
const FIGHT_ACTIVATION_EVENT = "fight.unit_activated";

function currentTurnEvents(state, type) {
  return state.history.filter((event) =>
    event?.type === type &&
    event?.payload?.turn === state.turn
  );
}

function hasEngagementAwareHistory(state) {
  return (Array.isArray(state?.history) ? state.history : []).some((event) =>
    event?.type === "unit.fell_back" ||
    event?.type === "combat.attack_resolved" && event?.payload?.phase === "fight" ||
    event?.type === CHARGE_EVENT && Array.isArray(event?.payload?.targetIds)
  );
}

function getEligibility(state, units) {
  if (!hasEngagementAwareHistory(state)) {
    return {
      eligible: new Set(units.map((unit) => unit.id)),
      engagedNow: new Set(),
      wasEngagedAtFightStepStart: new Set()
    };
  }

  const current = getFightEngagementState(state);
  const start = getFightStepStartEngagementState(state);

  const chargedThisTurn = new Set(
    currentTurnEvents({ ...state, history: state.history }, CHARGE_EVENT)
      .filter((event) =>
        event?.payload?.outcome === "successful" &&
        event?.payload?.unitId
      )
      .map((event) => event.payload.unitId)
  );

  const eligible = new Set([
    ...current.engagedUnitIds,
    ...start.engagedUnitIds,
    ...chargedThisTurn
  ]);

  return {
    eligible,
    engagedNow: new Set(current.engagedUnitIds),
    wasEngagedAtFightStepStart: new Set(start.engagedUnitIds)
  };
}

export function getFightCandidates(state) {
  const units = Array.isArray(state?.units) ? state.units : [];
  const history = Array.isArray(state?.history) ? state.history : [];

  const activated = new Set(
    history
      .filter((event) =>
        event?.type === FIGHT_ACTIVATION_EVENT &&
        event?.payload?.turn === state?.turn
      )
      .map((event) => event?.payload?.unitId)
      .filter(Boolean)
  );

  const fightsFirst = new Set(
    currentTurnEvents({ ...state, history }, CHARGE_EVENT)
      .filter((event) =>
        event?.payload?.outcome === "successful" &&
        event?.payload?.unitId
      )
      .map((event) => event.payload.unitId)
  );

  const deployed = units.filter((unit) =>
    unit?.status === UNIT_STATUS.DEPLOYED &&
    unit?.id
  );

  const available = deployed.filter((unit) => !activated.has(unit.id));
  const eligibility = getEligibility(state, available);
  const eligibleAvailable = available.filter((unit) => eligibility.eligible.has(unit.id));

  return {
    fightsFirst: eligibleAvailable
      .filter((unit) => fightsFirst.has(unit.id))
      .map((unit) => unit.id),
    normal: eligibleAvailable
      .filter((unit) => !fightsFirst.has(unit.id))
      .map((unit) => unit.id),
    activated: deployed
      .filter((unit) => activated.has(unit.id))
      .map((unit) => unit.id)
  };
}
