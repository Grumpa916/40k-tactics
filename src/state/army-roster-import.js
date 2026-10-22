import { createArmyRoster, remapRosterUnitIds } from './army-roster-library.js';
export function importArmyRoster(text, createId, timestamp) {
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('Choose an exported 40K Tactics JSON list. The JSON could not be read.'); }
  if (!value || value.schemaVersion !== 1 || !Array.isArray(value.units)) throw new Error('Only 40K Tactics roster schema version 1 is supported.');
  if (value.units.length > 500) throw new Error('A list may contain at most 500 units.');
  const ids = new Set();
  for (const unit of value.units) {
    if (!unit?.id || !unit.name || ids.has(unit.id) || !Number.isInteger(unit.modelCount) || unit.modelCount < 1) throw new Error('Every unit needs a unique ID, name, and positive model count.');
    ids.add(unit.id);
  }
  return remapRosterUnitIds(createArmyRoster({...value,id:createId(),createdAt:timestamp,updatedAt:timestamp}),{createId});
}
