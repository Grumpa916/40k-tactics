export const DATA_SCHEMA_VERSION = 1;

export function createGameData({
  ruleSetId,
  units = [],
  weapons = [],
  missions = [],
  objectives = [],
  stratagems = []
} = {}) {
  if (!ruleSetId || typeof ruleSetId !== "string") {
    throw new TypeError("A rule set id is required.");
  }
  return Object.freeze({
    schemaVersion: DATA_SCHEMA_VERSION,
    ruleSetId,
    units: [...units],
    weapons: [...weapons],
    missions: [...missions],
    objectives: [...objectives],
    stratagems: [...stratagems]
  });
}
