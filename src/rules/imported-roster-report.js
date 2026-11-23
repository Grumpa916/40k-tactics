import { findArmyUnitCandidates } from '../data/army-unit-catalog.js';

/**
 * One catalog cross-check for an imported roster.
 * Call this from the importer and from the explicit roster refresh only.
 * Gameplay, unit taps and phase changes must not call it.
 */
let validationPasses = 0;

export function importedRosterValidationPasses() {
  return validationPasses;
}

export function isUserEnteredUnit(unit) {
  return unit?.dataSource?.status === 'manual-entry' || unit?.dataSource?.origin === 'import-unmatched';
}

function normalize(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function canonical(value) {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const keys = Object.keys(value).filter(key => value[key] !== undefined).sort();
  return '{' + keys.map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
}

function hashText(text) {
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= BigInt(text.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, '0');
}

function wargearSignature(unit) {
  const rows = [];
  for (const item of unit?.equippedWargear ?? []) {
    rows.push(['equipped', normalize(item?.name), Number(item?.quantity) || 1]);
  }
  for (const item of unit?.unmatchedWargear ?? []) {
    rows.push(['unmatched', normalize(item?.sourceName), Number(item?.quantity) || 1]);
  }
  rows.sort((a, b) => a.join('\0').localeCompare(b.join('\0')));
  return rows;
}

/**
 * Catalog signature: datasheet id + faction tag + normalized wargear + model count.
 * Model count is included so a 5-model and a 10-model copy of the same datasheet
 * do not share one stored content record. Points are omitted; a price difference
 * is an import-report mismatch, not a second datasheet.
 * Manual signature: normalized name + notes + faction tag, so a repeated unmatched
 * line references the first copy instead of storing another empty datasheet.
 */
export function unitContentSignature(unit) {
  const factionTag = normalize(unit?.factionTag || unit?.dataSource?.factionTag || '');
  if (isUserEnteredUnit(unit) || !unit?.datasheetId) {
    return hashText(canonical({
      kind: 'manual',
      factionTag,
      name: normalize(unit?.name),
      notes: normalize(unit?.notes)
    }));
  }
  return hashText(canonical({
    kind: 'catalog',
    factionTag,
    datasheetId: String(unit.datasheetId),
    modelCount: Number(unit.modelCount) || 1,
    wargear: wargearSignature(unit)
  }));
}

/** Keep one datasheet per signature. Later instances reference the owner's id. */
export function foldDuplicateUnitContent(units) {
  const groups = new Map();
  for (const unit of units) {
    const signature = unitContentSignature(unit);
    unit.contentSignature = signature;
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(unit);
  }
  const sharedUnitContent = {};
  for (const [signature, group] of groups) {
    const owner = group[0];
    if (group.length > 1) {
      group.forEach((unit, index) => {
        unit.instanceIndex = index + 1;
        unit.instanceLabel = unit.name + ' ' + (index + 1);
        if (index === 0) return;
        unit.datasheet = null;
        unit.pointsOptions = [];
        unit.contentOwnerId = owner.id;
      });
    }
    sharedUnitContent[signature] = {
      signature,
      ownerUnitId: owner.id,
      datasheetId: owner.datasheetId ?? null,
      factionTag: owner.factionTag ?? owner.dataSource?.factionTag ?? null,
      instanceIds: group.map(unit => unit.id)
    };
  }
  return sharedUnitContent;
}

export function withResolvedUnitContent(unit, units = []) {
  if (!unit || unit.datasheet || !unit.contentOwnerId) return unit;
  const owner = units.find(item => item?.id === unit.contentOwnerId);
  if (!owner?.datasheet && !owner?.pointsOptions?.length) return unit;
  return {
    ...unit,
    datasheet: unit.datasheet ?? owner?.datasheet ?? null,
    pointsOptions: unit.pointsOptions?.length ? unit.pointsOptions : (owner?.pointsOptions ?? [])
  };
}

export function reassignSharedUnitContent(sharedUnitContent, units, removed) {
  if (!sharedUnitContent || !removed) return sharedUnitContent ?? null;
  const shared = {};
  for (const [signature, entry] of Object.entries(sharedUnitContent)) {
    const instanceIds = (entry.instanceIds ?? []).filter(id => id !== removed.id);
    if (!instanceIds.length) continue;
    let ownerUnitId = entry.ownerUnitId;
    if (ownerUnitId === removed.id) {
      ownerUnitId = instanceIds[0];
      const next = units.find(unit => unit.id === ownerUnitId);
      if (next) {
        if (removed.datasheet && !next.datasheet) next.datasheet = removed.datasheet;
        if (!next.pointsOptions?.length && removed.pointsOptions?.length) next.pointsOptions = removed.pointsOptions;
        delete next.contentOwnerId;
      }
    }
    for (const unit of units) {
      if (unit.contentOwnerId === removed.id) unit.contentOwnerId = ownerUnitId;
    }
    shared[signature] = { ...entry, ownerUnitId, instanceIds };
  }
  return shared;
}

function wargearDetail(unit) {
  return (unit.unmatchedWargear ?? []).map(item => (Number(item.quantity) || 1) + 'x ' + item.sourceName).join(', ');
}

export function buildImportedRosterReport(roster, { source = 'import', assessCost = null, generatedAt = null } = {}) {
  validationPasses += 1;
  const faction = roster?.faction ?? null;
  const catalog = findArmyUnitCandidates({ faction });
  const byId = new Map(catalog.map(candidate => [candidate.id, candidate]));
  const units = Array.isArray(roster?.units) ? roster.units : [];
  const entries = [];
  for (const unit of units) {
    const entered = isUserEnteredUnit(unit);
    if (entered) {
      entries.push({
        kind: 'unmatched-unit',
        unitId: unit.id ?? null,
        name: unit.name ?? 'Unit',
        detail: 'User-entered import. No catalog datasheet was matched.' +
          (unit.points == null ? ' Costs unknown.' : ' ' + unit.points + ' pts kept from the export.')
      });
    }
    if ((unit.unmatchedWargear ?? []).length) {
      entries.push({
        kind: 'unmatched-wargear',
        unitId: unit.id ?? null,
        name: unit.name ?? 'Unit',
        detail: (entered ? 'User-entered equipment was not matched to a catalog profile: ' : 'No combat profile matched: ') + wargearDetail(unit)
      });
    }
    if (!entered && unit.datasheetId) {
      const candidate = byId.get(unit.datasheetId);
      if (!candidate) {
        entries.push({
          kind: 'unmatched-unit',
          unitId: unit.id ?? null,
          name: unit.name ?? 'Unit',
          detail: 'Datasheet ' + unit.datasheetId + ' is not in the current catalog.'
        });
      } else if (typeof assessCost === 'function') {
        const price = assessCost(candidate, unit, roster);
        if (price?.status === 'mismatch' || price?.status === 'missing') {
          entries.push({ kind: 'points-mismatch', unitId: unit.id ?? null, name: unit.name ?? 'Unit', detail: price.reason });
        }
        if (unit.datasheet && candidate.datasheet && canonical(unit.datasheet) !== canonical(candidate.datasheet)) {
          entries.push({
            kind: 'stale-datasheet',
            unitId: unit.id ?? null,
            name: unit.name ?? 'Unit',
            detail: 'Saved datasheet copy differs from the current catalog.'
          });
        }
      }
    }
    if (unit.contentOwnerId) {
      entries.push({
        kind: 'deduped-content',
        unitId: unit.id ?? null,
        name: unit.instanceLabel || unit.name || 'Unit',
        detail: 'References stored content on ' + unit.contentOwnerId + ' instead of a second datasheet copy.'
      });
    }
  }
  const summary = {
    units: units.length,
    matched: units.filter(unit => !isUserEnteredUnit(unit) && unit.datasheetId).length,
    unmatched: units.filter(isUserEnteredUnit).length,
    deduped: units.filter(unit => unit.contentOwnerId).length,
    unmatchedWargear: entries.filter(entry => entry.kind === 'unmatched-wargear').length,
    pointsMismatches: entries.filter(entry => entry.kind === 'points-mismatch').length,
    staleDatasheets: entries.filter(entry => entry.kind === 'stale-datasheet').length
  };
  return {
    source,
    generatedAt,
    faction,
    catalogUnits: catalog.length,
    summary,
    entries
  };
}
