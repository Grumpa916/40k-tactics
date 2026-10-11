export const ARMY_ROSTER_SCHEMA_VERSION = 1;

function requireText(value, label) {
  const text = String(value ?? "").trim();
  if (!text) throw new TypeError(label + " is required.");
  return text;
}

function cloneData(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function normalizeUnit(unit) {
  if (!unit || typeof unit !== "object" || Array.isArray(unit)) {
    throw new TypeError("A roster unit must be an object.");
  }
  return cloneData(unit);
}

export function createArmyRoster({
  id,
  name,
  faction = null,
  pointsLimit = null,
  battleSize = null,
  detachment = null,
  units = [],
  notes = "",
  createdAt = null,
  updatedAt = createdAt
} = {}) {
  if (!Array.isArray(units)) throw new TypeError("Roster units must be an array.");
  return {
    schemaVersion: ARMY_ROSTER_SCHEMA_VERSION,
    id: requireText(id, "Roster id"),
    name: requireText(name, "Roster name"),
    faction: faction == null ? null : String(faction).trim() || null,
    pointsLimit: Number.isFinite(pointsLimit) && pointsLimit >= 0 ? pointsLimit : null,
    battleSize: battleSize == null ? null : String(battleSize).trim() || null,
    detachment: detachment == null ? null : String(detachment).trim() || null,
    units: units.map(normalizeUnit),
    notes: String(notes ?? ""),
    createdAt,
    updatedAt
  };
}

export function addUnitToRoster(roster, unit, { updatedAt = roster?.updatedAt ?? null } = {}) {
  assertRoster(roster);
  const normalized = normalizeUnit(unit);
  if (!normalized.id) throw new TypeError("Roster unit id is required.");
  if (roster.units.some((item) => item.id === normalized.id)) {
    throw new RangeError("Roster unit id already exists: " + normalized.id);
  }
  return { ...cloneData(roster), units: [...cloneData(roster.units), normalized], updatedAt };
}

export function updateRosterUnit(roster, unitId, changes, { updatedAt = roster?.updatedAt ?? null } = {}) {
  assertRoster(roster);
  requireText(unitId, "Roster unit id");
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
    throw new TypeError("Unit changes must be an object.");
  }
  if (!roster.units.some((item) => item.id === unitId)) {
    throw new RangeError("Roster unit not found: " + unitId);
  }
  const units = roster.units.map((item) => item.id === unitId
    ? { ...cloneData(item), ...cloneData(changes), id: item.id }
    : cloneData(item));
  return { ...cloneData(roster), units, updatedAt };
}

export function removeUnitFromRoster(roster, unitId, { updatedAt = roster?.updatedAt ?? null } = {}) {
  assertRoster(roster);
  requireText(unitId, "Roster unit id");
  if (!roster.units.some((item) => item.id === unitId)) {
    throw new RangeError("Roster unit not found: " + unitId);
  }
  return { ...cloneData(roster), units: roster.units.filter((item) => item.id !== unitId).map(cloneData), updatedAt };
}

export function renameArmyRoster(roster, name, { updatedAt = roster?.updatedAt ?? null } = {}) {
  assertRoster(roster);
  return { ...cloneData(roster), name: requireText(name, "Roster name"), updatedAt };
}

export function duplicateArmyRoster(roster, { id, name, createdAt = null, updatedAt = createdAt } = {}) {
  assertRoster(roster);
  const copy = cloneData(roster);
  return {
    ...copy,
    id: requireText(id, "Duplicate roster id"),
    name: requireText(name, "Duplicate roster name"),
    units: copy.units.map((unit) => ({ ...unit })),
    createdAt,
    updatedAt
  };
}

export function deleteArmyRoster(rosters, rosterId) {
  if (!Array.isArray(rosters)) throw new TypeError("Roster library must be an array.");
  requireText(rosterId, "Roster id");
  if (!rosters.some((roster) => roster?.id === rosterId)) {
    throw new RangeError("Roster not found: " + rosterId);
  }
  return rosters.filter((roster) => roster.id !== rosterId).map(cloneData);
}

export function selectRosterForBattle(roster, {
  playerId,
  snapshotId,
  battleId = null,
  selectedAt = null
} = {}) {
  assertRoster(roster);
  const snapshot = cloneData(roster);
  return {
    ...snapshot,
    id: requireText(snapshotId, "Battle roster snapshot id"),
    sourceRosterId: roster.id,
    sourceRosterName: roster.name,
    playerId: requireText(playerId, "Player id"),
    battleId,
    selectedAt,
    isBattleSnapshot: true
  };
}

export function assertRoster(roster) {
  if (!roster || typeof roster !== "object" || !Array.isArray(roster.units)) {
    throw new TypeError("A valid army roster is required.");
  }
  requireText(roster.id, "Roster id");
  requireText(roster.name, "Roster name");
  const ids = new Set();
  for (const unit of roster.units) {
    if (!unit?.id) throw new TypeError("Every roster unit requires an id.");
    if (ids.has(unit.id)) throw new RangeError("Duplicate roster unit id: " + unit.id);
    ids.add(unit.id);
  }
  return true;
}
