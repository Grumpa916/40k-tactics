import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import {
  getBattleUnitDatasheet,
  getCombatFormationMembers,
  getCombatFormationRoot
} from "./battle-unit-reference.js";
import { getLiveUnitVitals } from "./live-unit-vitals.js";
import { isUnitBattleShocked } from "./unit-status-summary.js";
import { getSpatialContext } from "./spatial-context.js";
import { parseCombatCharacteristic } from "./saved-roster-combat-profile.js";
import { clamp01, impactLabel, opponentPlayerIds, unitById } from "./tactical-context-utils.js";

function characteristicValue(unit, datasheet, keys) {
  const sources = [
    unit?.characteristics,
    unit?.profile?.characteristics,
    datasheet?.characteristics
  ];
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }
  return null;
}

function memberOc(state, unit) {
  const datasheet = getBattleUnitDatasheet(state, unit);
  const perModel = parseCombatCharacteristic(characteristicValue(unit, datasheet, [
    "objectiveControl", "Objective Control", "Objective control", "OC", "oc"
  ]));
  const vitals = getLiveUnitVitals(state, unit);
  const exactModels = Number.isInteger(vitals.models) && vitals.models >= 0 ? vitals.models : null;
  const fallbackModels = exactModels == null && Number.isInteger(vitals.startingModels) && vitals.startingModels > 0
    ? vitals.startingModels
    : exactModels;
  if (!Number.isFinite(perModel) || fallbackModels == null) {
    return Object.freeze({ perModel: perModel ?? null, models: exactModels, total: null, confidence: "low" });
  }
  return Object.freeze({
    perModel,
    models: fallbackModels,
    total: perModel * fallbackModels,
    confidence: exactModels == null ? "low" : "moderate"
  });
}

/**
 * Estimate the formation's currently usable OC from saved datasheet values and
 * tracked surviving models. Battle-shock removes usable OC from this advisory
 * estimate. Exact tabletop model placement and rules overrides remain authoritative.
 */
export function getFormationObjectiveContribution(state, unitOrId) {
  const unit = typeof unitOrId === "string" ? unitById(state, unitOrId) : unitOrId;
  const root = getCombatFormationRoot(state, unit);
  if (!root || root.status === "destroyed") {
    return Object.freeze({ totalOc: 0, effectiveOc: 0, battleShocked: false, confidence: "low", members: Object.freeze([]) });
  }
  const members = getCombatFormationMembers(state, root);
  const shocked = members.some((member) => isUnitBattleShocked(member)) || isUnitBattleShocked(root);
  const details = members.map((member) => Object.freeze({
    unitId: member.id,
    unitName: member.name ?? member.id,
    ...memberOc(state, member)
  }));
  const known = details.filter((detail) => Number.isFinite(detail.total));
  const totalOc = known.length === details.length
    ? known.reduce((sum, detail) => sum + detail.total, 0)
    : known.length ? known.reduce((sum, detail) => sum + detail.total, 0) : null;
  const confidence = details.length && details.every((detail) => detail.confidence === "moderate")
    ? "moderate"
    : "low";
  return Object.freeze({
    totalOc,
    effectiveOc: shocked ? 0 : totalOc,
    battleShocked: shocked,
    confidence,
    members: Object.freeze(details)
  });
}

function nearestObjectiveEntry(state, unit) {
  if (!unit) return null;
  try {
    const spatial = getSpatialContext(state, { playerId: unit.ownerId });
    return (spatial.objectiveProximity ?? [])
      .filter((entry) => entry.unitId === getCombatFormationRoot(state, unit)?.id)
      .sort((a, b) => a.distance - b.distance || a.objectiveId.localeCompare(b.objectiveId))[0] ?? null;
  } catch {
    return null;
  }
}

function ocNearObjective(state, playerId, objectiveId) {
  if (!playerId || !objectiveId) return { total: 0, uncertain: false, units: [] };
  let spatial = null;
  try { spatial = getSpatialContext(state, { playerId }); } catch { spatial = null; }
  const entries = (spatial?.objectiveProximity ?? []).filter((entry) =>
    entry.objectiveId === objectiveId && entry.distance <= 6
  );
  const roots = [...new Set(entries.map((entry) => entry.unitId))]
    .map((id) => unitById(state, id))
    .filter((unit) => unit && getCombatFormationRoot(state, unit)?.id === unit.id && unit.status !== "destroyed");
  const contributions = roots.map((unit) => ({ unit, oc: getFormationObjectiveContribution(state, unit) }));
  return {
    total: contributions.reduce((sum, entry) => sum + (Number(entry.oc.effectiveOc) || 0), 0),
    uncertain: contributions.some((entry) => entry.oc.effectiveOc == null || entry.oc.confidence === "low"),
    units: contributions.map((entry) => Object.freeze({
      unitId: entry.unit.id,
      unitName: entry.unit.name ?? entry.unit.id,
      effectiveOc: entry.oc.effectiveOc,
      battleShocked: entry.oc.battleShocked
    }))
  };
}

/**
 * Estimate whether removing a target could change control of its nearest objective.
 * This intentionally uses a generous 6-inch map band because map coordinates are
 * approximate. The result is a tactical signal, never an objective-control ruling.
 */
export function getTargetObjectiveSwing(state, { playerId, targetUnitId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!targetUnitId) throw new TypeError("targetUnitId is required.");
  const target = unitById(state, targetUnitId);
  if (!target || target.ownerId === playerId || target.status === "destroyed") {
    return Object.freeze({ score: 0, label: "none", objectiveId: null, targetOc: 0, potentialFlip: false, reason: "No enemy objective-control swing is available." });
  }

  const nearest = nearestObjectiveEntry(state, target);
  if (!nearest || nearest.distance > 6) {
    return Object.freeze({
      score: 0,
      label: "none",
      objectiveId: nearest?.objectiveId ?? null,
      targetOc: getFormationObjectiveContribution(state, target).effectiveOc,
      potentialFlip: false,
      reason: "Target is not close enough to a recorded objective for a reliable control-swing estimate."
    });
  }

  const targetOc = getFormationObjectiveContribution(state, target);
  const friendly = ocNearObjective(state, playerId, nearest.objectiveId);
  const opponentIds = opponentPlayerIds(state, playerId);
  const opponents = opponentIds.map((id) => ocNearObjective(state, id, nearest.objectiveId));
  const opponentBefore = opponents.reduce((sum, entry) => sum + entry.total, 0);
  const targetContribution = Number(targetOc.effectiveOc) || 0;
  const opponentAfter = Math.max(0, opponentBefore - targetContribution);
  const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: nearest.objectiveId });
  const potentialFlip = targetContribution > 0 &&
    ["enemy-controlled", "contested", "contested-by-others"].includes(control) &&
    friendly.total > opponentAfter;
  const potentialContest = targetContribution > 0 && !potentialFlip &&
    ["enemy-controlled", "contested", "contested-by-others"].includes(control) &&
    friendly.total > 0 && friendly.total >= opponentAfter;
  const share = opponentBefore > 0 ? Math.min(1, targetContribution / opponentBefore) : 0;
  const proximity = nearest.distance <= 3 ? 1 : 0.55;
  const score = targetContribution <= 0 ? 0 : clamp01(
    0.3 * share + 0.15 * proximity + (potentialFlip ? 0.65 : 0) + (potentialContest ? 0.35 : 0)
  );
  const uncertain = friendly.uncertain || opponents.some((entry) => entry.uncertain) || targetOc.confidence === "low";

  let reason;
  if (targetOc.battleShocked) {
    reason = `Target is already Battle-shocked, so its saved OC is not treated as contributing to ${nearest.objectiveId}; destroying it is not credited with an objective flip.`;
  } else if (potentialFlip) {
    reason = `Target contributes about ${targetContribution} saved OC near ${nearest.objectiveId}. Removing it could swing the local estimate from ${friendly.total} vs ${opponentBefore} OC to ${friendly.total} vs ${opponentAfter}.`;
  } else if (targetContribution > 0) {
    reason = `Target contributes about ${targetContribution} saved OC near ${nearest.objectiveId}; removing it reduces the local opponent estimate from ${opponentBefore} to ${opponentAfter} OC but does not currently project a clean flip.`;
  } else {
    reason = `No usable saved OC contribution is established for this target near ${nearest.objectiveId}.`;
  }
  if (uncertain) reason += " Surviving-model or map uncertainty lowers confidence; confirm actual contesting models at the table.";

  return Object.freeze({
    score,
    label: impactLabel(score),
    confidence: uncertain ? "low" : nearest.distance <= 3 ? "moderate" : "low",
    objectiveId: nearest.objectiveId,
    distance: nearest.distance,
    control,
    targetOc: targetContribution,
    targetNominalOc: targetOc.totalOc,
    targetBattleShocked: targetOc.battleShocked,
    friendlyOc: friendly.total,
    opponentOcBefore: opponentBefore,
    opponentOcAfter: opponentAfter,
    potentialFlip,
    potentialContest,
    reason
  });
}
