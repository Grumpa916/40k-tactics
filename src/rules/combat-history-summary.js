import { getFightEngagementState } from "./fight-engagement-state.js";

const COMBAT_ATTACK_EVENT = "combat.attack_resolved";
const CHARGE_EVENT = "charge.outcome_recorded";
const FIGHT_ACTIVATION_EVENT = "fight.unit_activated";
const SHOOTING_ACTIVATION_EVENT = "shooting.unit_activated";

function historyOf(state) {
  return Array.isArray(state?.history) ? state.history : [];
}

function unitsOf(state) {
  return Array.isArray(state?.units) ? state.units : [];
}

function unitById(state, unitId) {
  return unitsOf(state).find((unit) => unit.id === unitId) ?? null;
}

function opponentIds(state, playerId) {
  return [...new Set(
    unitsOf(state)
      .map((unit) => unit.ownerId)
      .filter((ownerId) => ownerId && ownerId !== playerId)
  )];
}

function eventFrame(event, index) {
  return {
    type: event.type,
    round: event.payload?.round ?? null,
    turn: event.payload?.turn ?? null,
    eventIndex: index
  };
}

/**
 * Build the authoritative combat history needed by the Tactical Advisor.
 *
 * The summary is derived only from state.units and state.history. It does not
 * infer combat from map coordinates or UI state. Actual damage and target
 * state come from combat.attack_resolved.stateDelta.
 */
export function getCombatHistorySummary(state, { playerId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");

  const units = unitsOf(state);
  const history = historyOf(state);
  const ownedUnits = units.filter((unit) => unit.ownerId === playerId);

  const byUnit = new Map(
    ownedUnits.map((unit) => [
      unit.id,
      {
        unitId: unit.id,
        ownerId: unit.ownerId,
        status: unit.status,
        wounds: unit.wounds,
        destroyed: unit.status === "destroyed",
        damageTaken: 0,
        shotsReceived: [],
        chargesReceived: [],
        fights: [],
        fightActivations: [],
        engagedWith: []
      }
    ])
  );

  const opponentActions = [];

  for (let index = 0; index < history.length; index += 1) {
    const event = history[index];
    if (!event?.type) continue;

    if (event.type === COMBAT_ATTACK_EVENT) {
      const attacker = unitById(state, event.payload?.attackerId);
      const targetId = event.payload?.targetId;
      const targetSummary = byUnit.get(targetId);
      if (!attacker || !targetSummary) continue;

      const attack = {
        ...eventFrame(event, index),
        actorId: attacker.id,
        targetId,
        weaponId: event.payload?.weaponId ?? null,
        phase: event.payload?.phase ?? null,
        actualDamage: event.payload?.actualDamage ?? null,
        expectedDamage: event.payload?.expectedDamage ?? null,
        stateDelta: event.payload?.stateDelta?.target ?? null
      };

      if (attacker.ownerId !== playerId) {
        opponentActions.push(attack);
      }

      if (event.payload?.phase === "shooting" && attacker.ownerId !== playerId) {
        targetSummary.damageTaken += Number.isFinite(event.payload?.actualDamage)
          ? event.payload.actualDamage
          : 0;
        targetSummary.shotsReceived.push(attack);
      }

      if (event.payload?.phase === "fight") {
        if (attacker.ownerId !== playerId || targetSummary.ownerId === playerId) {
          targetSummary.fights.push({
            ...attack,
            opponentId: attacker.ownerId !== playerId ? attacker.id : targetSummary.unitId
          });
        }
      }
      continue;
    }

    if (event.type === CHARGE_EVENT && event.payload?.outcome === "successful") {
      const charger = unitById(state, event.payload?.unitId);
      if (!charger || charger.ownerId === playerId) continue;

      for (const targetId of Array.isArray(event.payload?.targetIds) ? event.payload.targetIds : []) {
        const targetSummary = byUnit.get(targetId);
        if (!targetSummary) continue;
        const charge = {
          ...eventFrame(event, index),
          actorId: charger.id,
          targetId
        };
        targetSummary.chargesReceived.push(charge);
        opponentActions.push(charge);
      }
      continue;
    }

    if (event.type === FIGHT_ACTIVATION_EVENT) {
      const actor = unitById(state, event.payload?.unitId);
      if (!actor || actor.ownerId === playerId) continue;
      const targetSummaryIds = ownedUnits
        .filter((unit) => unit.status !== "destroyed")
        .map((unit) => unit.id);
      opponentActions.push({
        ...eventFrame(event, index),
        actorId: actor.id,
        targetIds: targetSummaryIds
      });
      continue;
    }

    if (event.type === SHOOTING_ACTIVATION_EVENT) {
      const actor = unitById(state, event.payload?.unitId);
      if (!actor || actor.ownerId === playerId) continue;
      opponentActions.push({
        ...eventFrame(event, index),
        actorId: actor.id
      });
    }
  }

  const engagementState = getFightEngagementState(state);
  const engagedWith = new Map(ownedUnits.map((unit) => [unit.id, []]));

  for (const relationship of engagementState.relationships) {
    const [first, second] = relationship.unitIds;
    if (engagedWith.has(first) && !engagedWith.get(first).includes(second)) {
      engagedWith.get(first).push(second);
    }
    if (engagedWith.has(second) && !engagedWith.get(second).includes(first)) {
      engagedWith.get(second).push(first);
    }
  }

  for (const summary of byUnit.values()) {
    summary.engagedWith = engagedWith.get(summary.unitId) ?? [];
  }

  return {
    playerId,
    opponentPlayerIds: opponentIds(state, playerId),
    current: {
      round: state?.battle?.round ?? null,
      turn: state?.turn ?? null
    },
    units: [...byUnit.values()],
    opponentActions
  };
}
