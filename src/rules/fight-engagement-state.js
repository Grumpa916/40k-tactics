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

    if (event.type === FALL_BACK_EVENT && event.payload?.unitId) {
      fallBacks.add(event.payload.unitId);
      fallBackIndexes.set(event.payload.unitId, index);

      for (const [key, relationship] of relationships) {
        if (relationship.unitIds.includes(event.payload.unitId)) {
          relationships.delete(key);
        }
      }
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
      addPair(
        relationships,
        event.payload.attackerId,
        event.payload.targetId,
        "fight",
        index
      );
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
