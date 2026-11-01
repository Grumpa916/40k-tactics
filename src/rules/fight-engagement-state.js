import { getCombatFormationRootId } from "./battle-unit-reference.js";

const CHARGE_EVENT = "charge.outcome_recorded";
const FIGHT_ATTACK_EVENT = "combat.attack_resolved";
const FALL_BACK_EVENT = "unit.fell_back";

function eventSequence(state) {
  return Array.isArray(state?.history) ? state.history : [];
}

function eventPosition(event, index) {
  return Number.isInteger(event?.sequence)
    ? event.sequence
    : index;
}

function isEarlierOrEqual(event, boundary, index) {
  const position = eventPosition(event, index);
  return position <= boundary;
}

function pairKey(a, b) {
  return [a, b].sort().join("::");
}

function addPair(map, a, b, source, index) {
  if (!a || !b || a === b) return;
  const key = pairKey(a, b);
  map.set(key, {
    unitIds: [a, b].sort(),
    source,
    eventIndex: index
  });
}

function relationshipIncludesFormation(state, relationship, unitId) {
  const rootId = getCombatFormationRootId(state, unitId);
  if (!rootId) return relationship.unitIds.includes(unitId);
  return relationship.unitIds.some((relatedId) =>
    getCombatFormationRootId(state, relatedId) === rootId
  );
}

function deleteFormationRelationships(state, relationships, unitId) {
  for (const [key, relationship] of relationships) {
    if (relationshipIncludesFormation(state, relationship, unitId)) relationships.delete(key);
  }
}

/**
 * Derive only engagement relationships that are supported by authoritative
 * action history. This deliberately does not use map coordinates as a legal
 * engagement test.
 *
 * A successful Charge establishes engagement with each recorded target.
 * A Fight attack establishes that the attacker and target were engaged when
 * that attack occurred. A later Fall Back invalidates the relationship for
 * subsequent Fight eligibility unless a later event re-establishes it.
 */
export function getFightEngagementState(state, { throughHistoryIndex = null } = {}) {
  const history = eventSequence(state);
  const boundary = throughHistoryIndex == null ? history.length - 1 : throughHistoryIndex;
  if (!Number.isInteger(boundary) || boundary < -1 || boundary >= history.length && history.length > 0) {
    throw new RangeError("Fight engagement history boundary is invalid.");
  }

  const relationships = new Map();
  const fallBacks = new Set();
  const fallBackIndexes = new Map();

  for (let index = 0; index <= boundary; index += 1) {
    const event = history[index];
    if (!event?.type) continue;

    if (event.type === 'unit.entered_reserves') {
      if (event.payload?.unitId) deleteFormationRelationships(state, relationships, event.payload.unitId);
      continue;
    }
    if (event.type === 'unit.mortal_wounds_recorded' && event.payload?.stateDelta?.target?.statusAfter === 'destroyed') {
      if (event.payload?.targetId) deleteFormationRelationships(state, relationships, event.payload.targetId);
      continue;
    }
    if (event.type === FALL_BACK_EVENT && event.payload?.unitId) {
      const rootId = getCombatFormationRootId(state, event.payload.unitId) ?? event.payload.unitId;
      fallBacks.add(rootId);
      fallBackIndexes.set(rootId, index);
      deleteFormationRelationships(state, relationships, event.payload.unitId);
      continue;
    }

    if (event.type === CHARGE_EVENT && event.payload?.outcome === "successful") {
      const chargerId = event.payload.unitId;
      const targets = Array.isArray(event.payload.targetIds) ? event.payload.targetIds : [];
      for (const targetId of targets) {
        addPair(relationships, chargerId, targetId, "charge", index);
      }
      continue;
    }

    if (
      event.type === FIGHT_ATTACK_EVENT &&
      event.payload?.phase === "fight" &&
      event.payload?.attackerId &&
      event.payload?.targetId
    ) {
      if (event.payload?.stateDelta?.target?.statusAfter === "destroyed") {
        deleteFormationRelationships(state, relationships, event.payload.targetId);
      } else {
        addPair(
          relationships,
          event.payload.attackerId,
          event.payload.targetId,
          "fight",
          index
        );
      }
    }
  }

  const engagedUnitIds = new Set();
  for (const relationship of relationships.values()) {
    for (const unitId of relationship.unitIds) engagedUnitIds.add(unitId);
  }

  return {
    engagedUnitIds: [...engagedUnitIds],
    relationships: [...relationships.values()].map((relationship) => ({
      unitIds: [...relationship.unitIds],
      source: relationship.source,
      eventIndex: relationship.eventIndex
    })),
    fellBackThisHistory: [...fallBacks],
    fallBackIndexes: Object.fromEntries(fallBackIndexes),
    boundary
  };
}

/**
 * Returns the subset of known engagement relationships that existed by the
 * beginning of the Fight phase. A later Fall Back is intentionally handled by
 * the normal history derivation, so callers can compare this snapshot with
 * current engagement without treating "ever fought" as current eligibility.
 */
export function getFightStepStartEngagementState(state) {
  const history = eventSequence(state);
  const fightStartIndex = history.findIndex((event) =>
    event?.type === "turn.phase_changed" &&
    event?.payload?.phase === "fight" &&
    event?.payload?.turn === state?.turn &&
    event?.payload?.round === state?.battle?.round
  );

  if (fightStartIndex < 0) {
    return {
      known: false,
      engagedUnitIds: [],
      relationships: []
    };
  }

  const snapshot = getFightEngagementState(state, {
    throughHistoryIndex: fightStartIndex - 1
  });

  return {
    known: true,
    engagedUnitIds: snapshot.engagedUnitIds,
    relationships: snapshot.relationships
  };
}

export function hasFightEngagementHistory(state) {
  return eventSequence(state).some((event) =>
    event?.type === FALL_BACK_EVENT ||
    (event?.type === FIGHT_ATTACK_EVENT && event?.payload?.phase === "fight") ||
    (event?.type === CHARGE_EVENT && Array.isArray(event?.payload?.targetIds))
  );
}

/**
 * Engagement history can be recorded against either an attached Leader marker
 * or its Bodyguard marker. Compare the current combat-formation roots so the
 * relationship remains valid when Fight activates the combined formation.
 */
export function areUnitsEngaged(state, firstUnitId, secondUnitId) {
  if (!firstUnitId || !secondUnitId || firstUnitId === secondUnitId) return false;
  const firstRootId = getCombatFormationRootId(state, firstUnitId);
  const secondRootId = getCombatFormationRootId(state, secondUnitId);
  if (!firstRootId || !secondRootId || firstRootId === secondRootId) return false;

  const current = getFightEngagementState(state);
  const key = pairKey(firstRootId, secondRootId);
  return current.relationships.some((relationship) => {
    const relationshipFirst = getCombatFormationRootId(state, relationship.unitIds[0]);
    const relationshipSecond = getCombatFormationRootId(state, relationship.unitIds[1]);
    return relationshipFirst && relationshipSecond && relationshipFirst !== relationshipSecond &&
      pairKey(relationshipFirst, relationshipSecond) === key;
  });
}
