import { createArmyRoster } from './army-roster-library.js';
import { ARMY_UNIT_CATALOG } from '../data/army-unit-catalog.js';
import { resolveInitialUnitPoints } from './army-roster-unit-costs.js';

const pointsPattern = /\b(\d[\d,]*)\s*(?:pts?\.?|points?)\b/i;
const sections = /^(?:ATTACHED UNITS|CHARACTERS|BATTLELINE|OTHER DATASHEETS|DEDICATED TRANSPORTS|ALLIED UNITS)$/i;
function normalize(value) {
 return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function getPoints(line) {
 const match = line.match(pointsPattern);
 return match ? Number(match[1].replaceAll(',', '')) : null;
}
function headerName(line) {
 return normalize(line.replace(/\(?\d[\d,]*\s*(?:pts?\.?|points?)\)?/gi, '').replace(/^\s*\d+\s*[x×]\s*/i, '').replace(/\b\d+\s+models?\b/i, ''));
}
function modelCount(line, candidate) {
 const match = line.match(/\b(\d+)\s+models?\b/i) ?? line.match(/^\s*(\d+)\s*[x×]\s*/i);
 return match ? Number(match[1]) : candidate.defaultModelCount ?? 1;
}
function captureEquippedWeapon(unit, line) {
 const match = line.match(/^[•◦*]\s*(?:(\d+)\s*[x×]\s+)?(.+)$/i);
 if (!match || !Array.isArray(unit?.datasheet?.weapons)) return;
 const sourceName = match[2].trim();
 const weapon = unit.datasheet.weapons.find(item => normalize(item?.name) === normalize(sourceName));
 if (!weapon?.name) return;
 const quantity = match[1] ? Number(match[1]) : 1;
 if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) return;
 if (!Array.isArray(unit.equippedWeapons)) unit.equippedWeapons = [];
 const existing = unit.equippedWeapons.find(item => normalize(item.name) === normalize(weapon.name));
 if (existing) {
  existing.quantity += quantity;
  return;
 }
 unit.equippedWeapons.push({ name: weapon.name, quantity, sourceName });
}
function attachSourceValidationErrors(units, sourceErrors) {
 for (const unit of units) {
  const key = normalize(unit?.name);
  if (!key) continue;
  const matching = sourceErrors.filter(error => normalize(error).includes(key));
  if (!matching.length) continue;
  unit.sourceValidationErrors = matching.slice();
  const wargearErrors = matching.filter(error => /\bwargear\b/i.test(error));
  if (wargearErrors.length) {
   unit.loadoutValidation = {
    status: 'source-invalid',
    source: 'warhammer-app-export',
    errors: wargearErrors.slice()
   };
  }
 }
}

/** Read unit blocks so model, weapon and attachment lines never become extra units. */
export function importWarhammerAppRoster({text, faction, name, pointsLimit = null, id, createdAt = null, updatedAt = createdAt} = {}) {
 if (typeof text !== 'string' || !text.trim()) throw new TypeError('Paste a Warhammer App army list first.');
 const selectedFaction = String(faction ?? '').trim();
 if (!selectedFaction) throw new TypeError('Choose the roster faction before importing.');
 const available = ARMY_UNIT_CATALOG.filter(unit => unit.faction.toLowerCase() === selectedFaction.toLowerCase());
 if (!available.length) throw new Error('The catalog has no unit names for ' + selectedFaction + ' yet.');
 const lines = text.split(/\r?\n/);
 const firstLine = lines.find(line => line.trim())?.trim() ?? '';
 const units = [], unrecognized = [], warnings = [], sourceErrors = [];
 const groups = new Map();
 let current = null, group = null, detachment = null, inErrors = false;
 for (const raw of lines) {
  const line = raw.trim();
  if (!line) continue;
  if (/^ERRORS$/i.test(line)) {
   current = null; group = null; inErrors = true;
   continue;
  }
  const groupMatch = line.match(/^Attached unit\s+(\d+)$/i);
  if (groupMatch) { group = groupMatch[1]; current = null; inErrors = false; groups.set(group, []); continue; }
  if (sections.test(line)) { group = null; current = null; inErrors = false; continue; }
  if (inErrors) {
   const errorText = line.replace(/^[•◦*]\s*/, '').trim();
   if (errorText) sourceErrors.push(errorText);
   continue;
  }
  if (/^[•◦*]/.test(line) || /^\s+/.test(raw)) {
   if (!current) continue;
   current.notes += '\n' + raw;
   const role = line.match(/Attached as:\s*(Leader|Bodyguard)\b/i);
   if (role) current.importedAttachmentRole = role[1].toLowerCase();
   if (/^[•*]\s*Warlord$/i.test(line)) current.isWarlord = true;
   const model = line.match(/^[•*]\s*(\d+)\s*[x×]\s+(.+)$/i);
   // Only an exact unit/model name can set model count; weapon quantities cannot.
   if (model && normalize(model[2]).replace(/s$/, '') === normalize(current.name).replace(/s$/, '')) {
    const count = Number(model[1]);
    if (count >= 1 && count <= 500) current.modelCount = count;
    else warnings.push('Review model count for ' + current.name + ': ' + model[1]);
   }
   captureEquippedWeapon(current, line);
   continue;
  }
  if (/\(\d+\s+Detachment Points?\)/i.test(line) || /^(?:army )?detachment\s*[:–-]/i.test(line)) {
   detachment = line.replace(/^(?:army )?detachment\s*[:–-]\s*/i, '').replace(/\s*\(\d+\s+Detachment Points?\)/i, '').trim();
   current = null; continue;
  }
  if (/^(?:army roster|army list|warhammer|battle forge|battle size|strike force|incursion|onslaught|total|grand total|points limit|force disposition|exported (?:from|with))\b/i.test(line)) { current = null; continue; }
  const candidate = available.find(unit => normalize(unit.name) === headerName(line));
  if (!candidate) {
   if (getPoints(line) != null && line !== firstLine) unrecognized.push(line);
   current = null; continue;
  }
  const models = modelCount(line, candidate);
  if (!Number.isInteger(models) || models < 1 || models > 500) { unrecognized.push(line); current = null; continue; }
  current = {id: id + '-unit-' + (units.length + 1), name: candidate.name, modelCount: models,
   points: getPoints(line), pointsOptions: candidate.pointsOptions ?? [], notes: line,
   datasheet: candidate.datasheet ? structuredClone(candidate.datasheet) : null, datasheetId: candidate.id,
   dataSource: {status: candidate.verificationStatus, sourceName: candidate.sourceName, sourceUrl: candidate.sourceUrl,
    reviewedAt: candidate.reviewedAt ?? null, officialRulesCrossCheck: candidate.officialRulesCrossCheck ?? 'pending', rosterImport: 'warhammer-app-text'}};
  units.push(current);
  if (group) groups.get(group).push(current);
 }
 if (!units.length) throw new Error('No unit names matched the ' + selectedFaction + ' catalog. Check the faction and export text.');
 for (const unit of units) {
  if (unit.points == null) unit.points = resolveInitialUnitPoints(available.find(c => c.id === unit.datasheetId), unit.modelCount);
 }
 for (const [number, members] of groups) {
  const leaders = members.filter(u => u.importedAttachmentRole === 'leader');
  const bodyguards = members.filter(u => u.importedAttachmentRole === 'bodyguard');
  if (leaders.length && bodyguards.length === 1) {
   bodyguards[0].attachedLeaderIds = leaders.map(u => u.id);
   leaders.forEach(u => { u.attachedToBodyguardId = bodyguards[0].id; });
  } else warnings.push('Review Attached unit ' + number + ': leader/bodyguard pairing could not be resolved.');
 }
 attachSourceValidationErrors(units, sourceErrors);
 const declaredPoints = getPoints(firstLine);
 const totalPoints = units.reduce((sum, unit) => sum + (unit.points ?? 0), 0);
 if (declaredPoints != null && (totalPoints !== declaredPoints || units.some(u => u.points == null))) warnings.push('Imported unit costs total ' + totalPoints + ' points; export declares ' + declaredPoints + '. Review missing units and costs.');
 return {roster: createArmyRoster({id, name, faction: selectedFaction, pointsLimit, detachment, units,
  notes: 'Imported from pasted Warhammer App text. Original export is preserved below for review.\n\n' + text, createdAt, updatedAt}), unrecognized, warnings, sourceErrors, declaredPoints, totalPoints};
}
