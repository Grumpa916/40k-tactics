import { findArmyUnitCandidates } from "../data/army-unit-catalog.js";
import { createRulesDataRevisionStamp, getRulesDataRevisionForFaction } from "../data/rules-data-revisions.js";
import { validateWargearLoadout } from "./wargear-loadout-validation.js";
import { resolveBuilderUnitCost } from "./army-builder-cost.js";

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function sameValue(a, b) {
  return String(a ?? "") === String(b ?? "");
}

/**
 * Compare a saved unit's cost with reviewed model-count options, then check
 * the resolved copy-order/wargear condition where the catalog can determine it.
 * Never guess a price when the official option depends on unresolved wargear.
 */
export function assessSavedUnitCost(candidate, unit, roster) {
  if (unit?.points == null || !Number.isFinite(Number(unit.points)) || Number(unit.points) < 0) {
    return { status: "missing", reason: "No valid saved points cost; confirm the unit's current MFM cost." };
  }
  const options = Array.isArray(candidate?.pointsOptions) ? candidate.pointsOptions : [];
  if (!options.length) {
    return { status: "unverified", reason: "This datasheet has no reviewed points options in the local catalog." };
  }
  if (!options.some((option) =>
    Number(option.models) === Number(unit.modelCount) && Number(option.points) === Number(unit.points))) {
    return { status: "mismatch", reason: unit.modelCount + " model(s) at " + unit.points +
      " pts does not match a current catalog points option." };
  }
  const priced = resolveBuilderUnitCost({ ...unit, pointsOptions: options }, roster,
    unit.equippedWargear ?? []);
  if (priced.points != null && Number(priced.points) !== Number(unit.points)) {
    return { status: "mismatch", reason: "Saved " + unit.points + " pts, but the reviewed " +
      "unit-copy/wargear pricing option is " + priced.points + " pts (" + priced.reason + ")." };
  }
  const differentPrices = new Set(options.filter(option =>
    Number(option.models) === Number(unit.modelCount)).map(option => Number(option.points)));
  if (priced.points == null && differentPrices.size > 1) {
    return { status: "unverified", reason: "Price depends on a copy-order or weapon option (" +
      priced.reason + "); confirm against the current MFM before marking it verified." };
  }
  return { status: "matched", reason: priced.reason ?? "Reviewed catalog price matches." };
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
    const priceAssessment = assessSavedUnitCost(candidate, unit, roster);
    if (priceAssessment.status === "missing" || priceAssessment.status === "mismatch") {
      issues.push(`${unit.name}: ${priceAssessment.reason}`);
    } else if (priceAssessment.status === "unverified") {
      warnings.push(`${unit.name}: ${priceAssessment.reason}`);
    }

    // Missing datasheets or loadout-rule coverage are reported, not silently
    // certified. These warnings do not prevent an agreed manual tabletop game.
    if (!candidate.datasheet?.characteristics || !Array.isArray(candidate.datasheet?.weapons) ||
        candidate.datasheet.weapons.length === 0) {
      warnings.push(`${unit.name}: complete combat datasheet/weapon profiles are not available in the local catalog.`);
    }
    if (candidate.officialRulesCrossCheck === "pending" || candidate.officialRulesCrossCheck == null) {
      warnings.push(`${unit.name}: official rules/points cross-check is still pending.`);
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
