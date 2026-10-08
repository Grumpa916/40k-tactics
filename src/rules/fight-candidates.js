import { UNIT_STATUS } from "../state/unit.js";

const CHARGE_EVENT = "charge.outcome_recorded";
const FIGHT_ACTIVATION_EVENT = "fight.unit_activated";

function currentTurnEvents(state, type) {
  return state.history.filter((event) =>
    event?.type === type &&
    event?.payload?.turn === state.turn
  );
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
    unit?.id &&
    !activated.has(unit.id)
  );

  return {
    fightsFirst: deployed
      .filter((unit) => fightsFirst.has(unit.id))
      .map((unit) => unit.id),
    normal: deployed
      .filter((unit) => !fightsFirst.has(unit.id))
      .map((unit) => unit.id),
    activated: units
      .filter((unit) => activated.has(unit?.id))
      .map((unit) => unit.id)
  };
}
