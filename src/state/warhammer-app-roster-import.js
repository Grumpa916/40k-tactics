import { createArmyRoster } from './army-roster-library.js';
import { ARMY_UNIT_CATALOG } from '../data/army-unit-catalog.js';
import { createRulesDataRevisionStamp } from '../data/rules-data-revisions.js';
import { resolveInitialUnitPoints } from './army-roster-unit-costs.js';
import { matchWargearSelection, summarizeWargearAudit, validateWargearLoadout } from '../rules/wargear-loadout-validation.js';

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
 return normalize(line.replace(/\(?\d[\d,]*\s*(?:pts?\.?|points?)\)?/gi, '').replace(/^\s*\d+\s*[x×]\s*/i, '').replace(/\s*[x×]\s*\d+\s*$/i, '').replace(/\b\d+\s+models?\b/i, ''));
}
function modelCount(line, candidate) {
 const match = line.match(/\b(\d+)\s+models?\b/i) ?? line.match(/^\s*(\d+)\s*[x×]\s*/i);
 return match ? Number(match[1]) : candidate.defaultModelCount ?? 1;
}
function singularModelName(value) {
 const name = normalize(value);
 if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
 if (/(?:xes|ches|shes|sses|zes)$/.test(name)) return name.slice(0, -2);
 return name.endsWith('s') ? name.slice(0, -1) : name;
}
function indentation(raw) {
 return String(raw ?? '').length - String(raw ?? '').trimStart().length;
}
function nextNonblankRaw(lines, index) {
 for (let next = index + 1; next < lines.length; next += 1) {
  if (lines[next].trim()) return lines[next];
 }
 return '';
}
function parseModelGroupLine({ raw, line, current, nextRaw }) {
 const match = line.match(/^[•*]\s*(\d+)\s*[x×]\s+(.+)$/i);
 if (!match || !current) return null;
 const quantity = Number(match[1]);
 const sourceName = match[2].trim();
 if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) return null;
 // A matched combat profile is equipment, never a model-group label.
 if (matchWargearSelection({ datasheetId: current.datasheetId, datasheet: current.datasheet, sourceName })) return null;
 const nextLine = String(nextRaw ?? '').trim();
 const hasNestedEquipment = /^◦\s*/.test(nextLine) && indentation(nextRaw) > indentation(raw);
 const matchesUnitModelName = singularModelName(sourceName) === singularModelName(current.name);
 return hasNestedEquipment || matchesUnitModelName ? { quantity, sourceName } : null;
}
function addSelection(unit, match, quantity, sourceName) {
 if (!Array.isArray(unit.equippedWargear)) unit.equippedWargear = [];
 const selected = unit.equippedWargear.find(item => normalize(item.name) === normalize(match.name));
 if (selected) selected.quantity += quantity;
 else unit.equippedWargear.push({ name: match.name, quantity, sourceName, profileNames: match.profileNames.slice(), match: match.match });

 if (!Array.isArray(unit.equippedWeapons)) unit.equippedWeapons = [];
 for (const profileName of match.profileNames) {
  const existing = unit.equippedWeapons.find(item => normalize(item.name) === normalize(profileName));
  if (existing) existing.quantity += quantity;
  else unit.equippedWeapons.push({ name: profileName, quantity, sourceName, selectionName: match.name });
 }
}
function addUnmatched(unit, sourceName, quantity) {
 if (!Array.isArray(unit.unmatchedWargear)) unit.unmatchedWargear = [];
 const existing = unit.unmatchedWargear.find(item => normalize(item.sourceName) === normalize(sourceName));
 if (existing) existing.quantity += quantity;
 else unit.unmatchedWargear.push({ sourceName, quantity });
}
function captureEquipmentLine(unit, line) {
 const match = line.match(/^([•◦·*])\s*(?:(\d+)\s*[x×]\s+)?(.+)$/i);
 if (!match || !unit) return;
 const marker = match[1];
 const sourceName = match[3].trim();
 if (/^(?:Attached as:|Warlord\b)/i.test(sourceName)) return;
 const quantity = match[2] ? Number(match[2]) : 1;
 if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) return;
 const resolved = matchWargearSelection({ datasheetId: unit.datasheetId, datasheet: unit.datasheet, sourceName });
 if (resolved) { addSelection(unit, resolved, quantity, sourceName); return; }
 // Multi-model App exports use a top-level bullet for model groups and nested
 // circles for their equipment. Single-model top-level bullets are equipment.
 if (marker === '◦' || marker === '·' || unit.modelCount === 1) addUnmatched(unit, sourceName, quantity);
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
function finalizeLoadoutValidation(unit) {
 const reviewed = validateWargearLoadout(unit);
 const unmatched = unit.unmatchedWargear ?? [];
 if (unit.loadoutValidation?.status === 'source-invalid') {
  unit.loadoutValidation.reviewedRuleValidation = reviewed;
  if (unmatched.length) unit.loadoutValidation.unmatchedWargear = unmatched.slice();
  return;
 }
 if (!unit.equippedWargear?.length && !unmatched.length) return;
 if (unmatched.length && reviewed.status !== 'rules-invalid') {
  unit.loadoutValidation = {
   ...reviewed,
   status: 'unverified',
   errors: [...(reviewed.errors ?? []), ...unmatched.map(item => `No combat profile matched imported wargear: ${item.quantity}x ${item.sourceName}.`)]
  };
  return;
 }
 unit.loadoutValidation = reviewed;
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
 const modelGroupTotals = new Map();
 let current = null, group = null, detachment = null, inErrors = false;
 for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
  const raw = lines[lineIndex];
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
 if (/^[•◦·*]/.test(line) || /^\s+/.test(raw)) {
   if (!current) continue;
   current.notes += '\n' + raw;
   const role = line.match(/Attached as:\s*(Leader|Bodyguard)\b/i);
   if (role) current.importedAttachmentRole = role[1].toLowerCase();
   if (/^[•*]\s*Warlord$/i.test(line)) current.isWarlord = true;

   const modelGroup = parseModelGroupLine({ raw, line, current, nextRaw: nextNonblankRaw(lines, lineIndex) });
   if (modelGroup) {
    const total = (modelGroupTotals.get(current.id) ?? 0) + modelGroup.quantity;
    modelGroupTotals.set(current.id, total);
    current.modelCount = total;
    continue;
   }

   captureEquipmentLine(current, line);
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
    reviewedAt: candidate.reviewedAt ?? null, pointsSourceName: candidate.pointsSourceName ?? null,
    pointsSourceUrl: candidate.pointsSourceUrl ?? null, rulesDataRevisionId: candidate.rulesDataRevisionId ?? null,
    officialRulesCrossCheck: candidate.officialRulesCrossCheck ?? 'pending', rosterImport: 'warhammer-app-text'}};
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
 units.forEach(finalizeLoadoutValidation);
 warnings.push(...sourceErrors.map(error => 'Warhammer App export: ' + error));
 const declaredPoints = getPoints(firstLine);
 const totalPoints = units.reduce((sum, unit) => sum + (unit.points ?? 0), 0);
 if (declaredPoints != null && (totalPoints !== declaredPoints || units.some(u => u.points == null))) warnings.push('Imported unit costs total ' + totalPoints + ' points; export declares ' + declaredPoints + '. Review missing units and costs.');
 const roster = createArmyRoster({id, name, faction: selectedFaction, pointsLimit, detachment, units,
  notes: 'Imported from pasted Warhammer App text. Original export is preserved below for review.\n\n' + text,
  rulesDataRevision: createRulesDataRevisionStamp(selectedFaction), createdAt, updatedAt});
 return {roster, unrecognized, warnings, sourceErrors, wargearAudit: summarizeWargearAudit(roster), declaredPoints, totalPoints};
}
