import { findArmyUnitCandidates } from "../data/army-unit-catalog.js";
import { createRulesDataRevisionStamp, getRulesDataRevisionForFaction } from "../data/rules-data-revisions.js";
import { validateWargearLoadout } from "./wargear-loadout-validation.js";

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function sameValue(a, b) {
  return String(a ?? "") === String(b ?? "");
}

function pointsMatch(candidate, unit) {
  if (unit?.points == null || !Array.isArray(candidate?.pointsOptions) || !candidate.pointsOptions.length) return true;
  return candidate.pointsOptions.some((option) =>
    Number(option.models) === Number(unit.modelCount) && Number(option.points) === Number(unit.points)
  );
}

function refreshLoadoutValidation(unit) {
  if (!Array.isArray(unit?.equippedWargear) || !unit.equippedWargear.length) return unit.loadoutValidation ?? null;
  const reviewed = validateWargearLoadout(unit);
  if (unit.loadoutValidation?.status === "source-invalid") {
    return { ...clone(unit.loadoutValidation), reviewedRuleValidation: reviewed };
  }
  return reviewed;
}

export function assessRosterRulesData(roster) {
  const current = getRulesDataRevisionForFaction(roster?.faction);
  if (!current) return { status: "untracked", current: null, saved: roster?.rulesDataRevision ?? null, reasons: [] };
  const saved = roster?.rulesDataRevision ?? null;
  if (!saved) {
    return {
      status: "review-required",
      current,
      saved: null,
      reasons: ["This saved roster predates rules-data revision tracking and must be revalidated once before battle use."]
    };
  }
  const reasons = [];
  if (!sameValue(saved.edition, current.edition)) reasons.push(`Edition changed from ${saved.edition ?? "unknown"} to ${current.edition}.`);
  if (!sameValue(saved.factionRules?.version, current.factionRules?.version)) {
    reasons.push(`Faction Pack changed from v${saved.factionRules?.version ?? "unknown"} to v${current.factionRules?.version}.`);
  }
  if (!sameValue(saved.points?.revision, current.points?.revision)) {
    reasons.push(`Munitorum Field Manual revision changed from ${saved.points?.revision ?? "unknown"} to ${current.points?.revision}.`);
  }
  if (!sameValue(saved.catalog?.revision, current.catalog?.revision)) {
    reasons.push(`Local reviewed catalog changed from ${saved.catalog?.revision ?? "unknown"} to ${current.catalog?.revision}.`);
  }
  if (!reasons.length && sameValue(saved.revisionId, current.revisionId)) {
    return { status: "current", current, saved, reasons: [] };
  }
  if (!reasons.length) reasons.push("Rules-data revision changed and this roster should be revalidated.");
  return { status: "review-required", current, saved, reasons };
}

export function revalidateRosterRulesData(roster, { updatedAt = roster?.updatedAt ?? null } = {}) {
  const current = getRulesDataRevisionForFaction(roster?.faction);
  if (!current) return { status: "untracked", roster: clone(roster), issues: [], warnings: [] };
  const candidates = new Map(findArmyUnitCandidates({ faction: roster?.faction }).map((candidate) => [candidate.id, candidate]));
  const issues = [];
  const warnings = [];
  const refreshedUnits = [];

  for (const sourceUnit of roster?.units ?? []) {
    const unit = clone(sourceUnit);
    if (!unit.datasheetId) {
      warnings.push(`${unit.name}: manual entry has no catalog datasheet and was not revalidated.`);
      refreshedUnits.push(unit);
      continue;
    }
    const candidate = candidates.get(unit.datasheetId);
    if (!candidate) {
      issues.push(`${unit.name}: datasheet ${unit.datasheetId} is not present in the current ${roster.faction} catalog.`);
      refreshedUnits.push(unit);
      continue;
    }
    if (!pointsMatch(candidate, unit)) {
      issues.push(`${unit.name}: ${unit.modelCount} model(s) at ${unit.points} pts does not match a current catalog points option.`);
    }

    const currentWeaponNames = new Set((candidate.datasheet?.weapons ?? []).map((weapon) => String(weapon?.name ?? "").toLowerCase()));
    for (const weapon of unit.equippedWeapons ?? []) {
      if (!currentWeaponNames.has(String(weapon?.name ?? "").toLowerCase())) {
        issues.push(`${unit.name}: equipped weapon profile “${weapon?.name ?? "unknown"}” is not present in the current datasheet.`);
      }
    }

    const refreshed = {
      ...unit,
      pointsOptions: candidate.pointsOptions ?? [],
      datasheet: candidate.datasheet ? clone(candidate.datasheet) : null,
      dataSource: {
        ...(unit.dataSource ?? {}),
        status: candidate.verificationStatus,
        sourceName: candidate.sourceName,
        sourceUrl: candidate.sourceUrl,
        reviewedAt: candidate.reviewedAt ?? null,
        pointsSourceName: candidate.pointsSourceName ?? null,
        pointsSourceUrl: candidate.pointsSourceUrl ?? null,
        rulesDataRevisionId: current.revisionId,
        officialRulesCrossCheck: candidate.officialRulesCrossCheck ?? "pending"
      }
    };
    const loadoutValidation = refreshLoadoutValidation(refreshed);
    if (loadoutValidation) refreshed.loadoutValidation = loadoutValidation;
    if (loadoutValidation?.status === "rules-invalid") {
      issues.push(`${unit.name}: selected wargear no longer passes the current reviewed loadout rules.`);
    }
    if ((unit.unmatchedWargear ?? []).length || loadoutValidation?.status === "unverified") {
      issues.push(`${unit.name}: one or more wargear selections remain unverified against current combat profiles.`);
    }
    refreshedUnits.push(refreshed);
  }

  if (issues.length) {
    return { status: "review-required", roster: clone(roster), issues, warnings, current: clone(current) };
  }

  return {
    status: "current",
    roster: {
      ...clone(roster),
      units: refreshedUnits,
      rulesDataRevision: createRulesDataRevisionStamp(roster.faction),
      updatedAt
    },
    issues: [],
    warnings,
    current: clone(current)
  };
}
