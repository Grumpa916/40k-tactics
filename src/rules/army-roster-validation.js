import { findArmyUnitCandidates } from "../data/army-unit-catalog.js";
import { summarizeRosterPoints } from "../state/army-roster-points-summary.js";

const text = (value) => String(value ?? "").trim().toLowerCase();
const keywords = (unit) => (unit?.datasheet?.keywords ?? []).map(text);
const hasKeyword = (unit, value) => keywords(unit).includes(text(value));

export function validateArmyRoster(roster = {}) {
  const issues = [], warnings = [], units = Array.isArray(roster.units) ? roster.units : [];
  const candidates = new Map(findArmyUnitCandidates({ faction: roster.faction }).map((unit) => [unit.id, unit]));
  const ids = new Set(units.map((unit) => unit?.id).filter(Boolean));
  if (!text(roster.name)) issues.push("Army list needs a name.");
  if (!text(roster.faction)) issues.push("Choose a faction before using this list.");
  if (!text(roster.detachment)) warnings.push("Choose a detachment before battle preparation.");
  if (!Number.isFinite(roster.pointsLimit) || roster.pointsLimit <= 0) warnings.push("Set a points limit to validate the army budget.");
  const summary = summarizeRosterPoints(roster);
  if (summary.overLimit) issues.push(`Army is ${Math.abs(summary.remainingPoints)} points over its ${roster.pointsLimit}-point limit.`);
  if (summary.unitsWithoutPoints) warnings.push(`${summary.unitsWithoutPoints} unit${summary.unitsWithoutPoints === 1 ? " has" : "s have"} no resolved points cost.`);
  const counts = new Map();
  for (const unit of units) {
    const key = unit?.datasheetId || `manual:${text(unit?.name)}`;
    counts.set(key, [...(counts.get(key) ?? []), unit]);
    if (unit?.attachedToBodyguardId && !ids.has(unit.attachedToBodyguardId)) issues.push(`${unit.name}: attached Bodyguard is missing.`);
    for (const leaderId of unit?.attachedLeaderIds ?? []) if (!ids.has(leaderId)) issues.push(`${unit.name}: attached Leader is missing.`);
  }
  for (const [key, entries] of counts) {
    const unit = entries[0], roleSource = candidates.get(key) ?? unit;
    const max = hasKeyword(roleSource, "Battleline") ? 6 : hasKeyword(roleSource, "Epic Hero") ? 1 : 3;
    if (entries.length > max) issues.push(`${unit.name}: ${entries.length} copies selected; this list allows at most ${max}.`);
  }
  return { status: issues.length ? "invalid" : warnings.length ? "review" : "valid", issues, warnings, summary };
}
