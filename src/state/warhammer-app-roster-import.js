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

/** Read unit blocks so model, weapon and attachment lines never become extra units. */
export function importWarhammerAppRoster({text, faction, name, pointsLimit = null, id, createdAt = null, updatedAt = createdAt} = {}) {
 if (typeof text !== 'string' || !text.trim()) throw new TypeError('Paste a Warhammer App army list first.');
 const selectedFaction = String(faction ?? '').trim();
 if (!selectedFaction) throw new TypeError('Choose the roster faction before importing.');
 const available = ARMY_UNIT_CATALOG.filter(unit => unit.faction.toLowerCase() === selectedFaction.toLowerCase());
 if (!available.length) throw new Error('The catalog has no unit names for ' + selectedFaction + ' yet.');
 const lines = text.split(/\r?\n/);
 const firstLine = lines.find(line => line.trim())?.trim() ?? '';
 const units = [], unrecognized = [], warnings = [];
 const groups = new Map();
 let current = null, group = null, detachment = null;
 for (const raw of lines) {
  const line = raw.trim();
  if (!line) continue;
  const groupMatch = line.match(/^Attached unit\s+(\d+)$/i);
  if (groupMatch) { group = groupMatch[1]; current = null; groups.set(group, []); continue; }
  if (sections.test(line)) { group = null; current = null; continue; }
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
 const declaredPoints = getPoints(firstLine);
 const totalPoints = units.reduce((sum, unit) => sum + (unit.points ?? 0), 0);
 if (declaredPoints != null && (totalPoints !== declaredPoints || units.some(u => u.points == null))) warnings.push('Imported unit costs total ' + totalPoints + ' points; export declares ' + declaredPoints + '. Review missing units and costs.');
 return {roster: createArmyRoster({id, name, faction: selectedFaction, pointsLimit, detachment, units,
  notes: 'Imported from pasted Warhammer App text. Original export is preserved below for review.\n\n' + text, createdAt, updatedAt}), unrecognized, warnings, declaredPoints, totalPoints};
}
