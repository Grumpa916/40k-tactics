import { ADEPTUS_CUSTODES_DETACHMENTS, ADEPTUS_CUSTODES_KATAH } from "../data/adeptus-custodes-faction-rules.js";
import { getBattleUnitDatasheet, getCombatFormationMembers, getCombatFormationRoot } from "./battle-unit-reference.js";
import { getExpectedDamage } from "./expected-damage.js";
import { getFightEngagementState } from "./fight-engagement-state.js";
import { getRosterDetachmentNames, isAdeptusCustodesFaction } from "./roster-detachment-selection.js";
import { getProbabilisticUnitProfile } from "./saved-roster-combat-profile.js";
import { isUnitBattleShocked } from "./unit-status-summary.js";

const KATAH_BY_NAME = new Map(ADEPTUS_CUSTODES_KATAH.map((item) => [item.name, item]));
const DETACHMENT_BY_NAME = new Map(ADEPTUS_CUSTODES_DETACHMENTS.map((item) => [item.name, item]));

function unitById(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : []).find((unit) => unit?.id === unitId) ?? null;
}

function selectedDetachments(state, playerId) {
  const roster = state?.armyRosters?.[playerId];
  if (!roster || !isAdeptusCustodesFaction(roster.faction)) return [];
  return getRosterDetachmentNames(roster).map((name) => DETACHMENT_BY_NAME.get(name)).filter(Boolean);
}

export function hasCustodesDetachment(state, playerId, detachmentName) {
  return selectedDetachments(state, playerId).some((detachment) => detachment.name === detachmentName);
}

function hasNamedAbility(datasheet, abilityName) {
  return (Array.isArray(datasheet?.abilities) ? datasheet.abilities : []).some((ability) =>
    String(ability?.name ?? ability ?? "").trim().toLowerCase() === abilityName.toLowerCase()
  );
}

export function isMartialKatahEligible(state, unitOrId) {
  const unit = typeof unitOrId === "string" ? unitById(state, unitOrId) : unitOrId;
  if (!unit || unit.status !== "deployed") return false;
  const roster = state?.armyRosters?.[unit.ownerId];
  if (!roster || !isAdeptusCustodesFaction(roster.faction)) return false;
  const root = getCombatFormationRoot(state, unit);
  if (!root || root.id !== unit.id && typeof unitOrId !== "string") return false;
  const members = getCombatFormationMembers(state, root);
  return members.some((member) => hasNamedAbility(getBattleUnitDatasheet(state, member), "Martial Ka'tah"));
}

function activePlayerId(state) {
  return state?.battle?.activePlayerId ?? state?.activePlayer ?? null;
}

/**
 * A first-player Custodes army becomes readied in its Command phase at the start
 * of each round. A second-player army does not begin its new readiness cycle
 * until its own turn starts. This keeps readiness correct during the opponent's
 * first turn of a round without requiring a synthetic "ready every unit" event.
 */
export function getCustodesReadinessCycleRound(state, playerId) {
  const round = Number(state?.battle?.round ?? 0);
  if (!Number.isInteger(round) || round < 1) return 0;
  const firstPlayerId = state?.battle?.firstPlayerId ?? null;
  const active = activePlayerId(state);
  if (!firstPlayerId || !active) return round;
  if (playerId === firstPlayerId) return round;
  return active === playerId ? round : Math.max(0, round - 1);
}

function katahEvents(state, playerId, unitId, cycleRound) {
  return (Array.isArray(state?.history) ? state.history : []).filter((event) =>
    ["custodes.katah_expended", "custodes.katah_readied"].includes(event?.type) &&
    event?.payload?.playerId === playerId &&
    event?.payload?.unitId === unitId &&
    event?.payload?.cycleRound === cycleRound
  );
}

export function getCustodesKatahState(state, { playerId, unitId } = {}) {
  const unit = unitById(state, unitId);
  if (!unit || unit.ownerId !== playerId || !isMartialKatahEligible(state, unit.id)) {
    return Object.freeze({ eligible: false, readied: false, cycleRound: 0, lastKatah: null, reason: "This unit is not a deployed Martial Ka'tah unit for this player." });
  }
  const root = getCombatFormationRoot(state, unit) ?? unit;
  const cycleRound = getCustodesReadinessCycleRound(state, playerId);
  if (cycleRound < 1) {
    return Object.freeze({ eligible: true, readied: false, cycleRound, lastKatah: null, reason: "This unit has not reached its first Command-phase readiness cycle yet." });
  }
  const events = katahEvents(state, playerId, root.id, cycleRound);
  let readied = true;
  let lastKatah = null;
  for (const event of events) {
    if (event.type === "custodes.katah_readied") readied = true;
    if (event.type === "custodes.katah_expended") {
      readied = false;
      lastKatah = event.payload?.katahName ?? null;
    }
  }
  return Object.freeze({
    eligible: true,
    readied,
    cycleRound,
    lastKatah,
    reason: readied
      ? `Martial Ka'tah is readied for readiness cycle ${cycleRound}.`
      : `${lastKatah ?? "A Martial Ka'tah"} has been expended for readiness cycle ${cycleRound}.`
  });
}

export function isCustodesKatahTimingAvailable(state, katahName, playerId) {
  const phase = state?.phase ?? null;
  const active = activePlayerId(state);
  if (katahName === "Conservai") return phase === "command" && active === playerId;
  if (katahName === "Calistus") return phase === "movement" && active === playerId;
  if (katahName === "Salvus") return phase === "shooting" && active === playerId;
  if (katahName === "Dacatarai" || katahName === "Kaptaris" || katahName === "Rendax") return phase === "fight";
  return false;
}

function targetHasKeyword(targetProfile, keyword) {
  return (Array.isArray(targetProfile?.keywords) ? targetProfile.keywords : []).some((item) =>
    String(item).trim().toLowerCase() === keyword.toLowerCase()
  );
}

function weaponWith(weapon, changes) {
  return {
    ...weapon,
    characteristics: {
      ...(weapon?.characteristics ?? {}),
      ...changes
    }
  };
}

function expectedDamage(attacker, target, weapon) {
  try {
    return getExpectedDamage({ attacker, target, weapon }).expectedDamage;
  } catch {
    return null;
  }
}

export function getCustodesFightAdvisorContext(state, {
  playerId,
  unitId,
  sourceUnitId = unitId,
  targetUnitId,
  weapon
} = {}) {
  const unit = unitById(state, unitId);
  const sourceUnit = unitById(state, sourceUnitId) ?? unit;
  const target = unitById(state, targetUnitId);
  if (!unit || !sourceUnit || !target || unit.ownerId !== playerId || sourceUnit.ownerId !== playerId || target.ownerId === playerId || !weapon) {
    return Object.freeze({ available: false, options: Object.freeze([]), bestOption: null });
  }
  if (!isMartialKatahEligible(state, unit.id)) {
    return Object.freeze({ available: false, options: Object.freeze([]), bestOption: null });
  }

  const attackerProfile = getProbabilisticUnitProfile(state, sourceUnit);
  const targetProfile = getProbabilisticUnitProfile(state, target);
  const baseline = expectedDamage(attackerProfile, targetProfile, weapon);
  if (!Number.isFinite(baseline)) {
    return Object.freeze({ available: false, options: Object.freeze([]), bestOption: null });
  }

  const katah = getCustodesKatahState(state, { playerId, unitId: unit.id });
  const options = [];
  const guardians = hasCustodesDetachment(state, playerId, "Guardians of the Throne");
  const monsterVehicle = targetHasKeyword(targetProfile, "Monster") || targetHasKeyword(targetProfile, "Vehicle");

  if (guardians) {
    const sustained = weaponWith(weapon, {
      sustainedHits: Math.max(1, Number(weapon?.characteristics?.sustainedHits) || 0)
    });
    const lethal = weaponWith(weapon, { lethalHits: true });
    const sustainedDamage = expectedDamage(attackerProfile, targetProfile, sustained);
    const lethalDamage = expectedDamage(attackerProfile, targetProfile, lethal);
    if (Number.isFinite(sustainedDamage)) options.push(Object.freeze({ id: "guardians-sustained", label: "Martial Mastery: Sustained Hits 1", expectedDamage: sustainedDamage, requiresKatahUse: false }));
    if (Number.isFinite(lethalDamage)) options.push(Object.freeze({ id: "guardians-lethal", label: "Martial Mastery: Lethal Hits", expectedDamage: lethalDamage, requiresKatahUse: false }));
  }

  if (katah.readied && monsterVehicle) {
    const rendax = weaponWith(weapon, { lethalHits: true });
    const rendaxDamage = expectedDamage(attackerProfile, targetProfile, rendax);
    if (Number.isFinite(rendaxDamage)) options.push(Object.freeze({ id: "rendax", label: "Rendax", katahName: "Rendax", expectedDamage: rendaxDamage, requiresKatahUse: true }));

    if (guardians) {
      const combined = weaponWith(weapon, {
        lethalHits: true,
        sustainedHits: Math.max(1, Number(weapon?.characteristics?.sustainedHits) || 0)
      });
      const combinedDamage = expectedDamage(attackerProfile, targetProfile, combined);
      if (Number.isFinite(combinedDamage)) options.push(Object.freeze({ id: "guardians-sustained-rendax", label: "Martial Mastery: Sustained Hits 1 + Rendax", katahName: "Rendax", expectedDamage: combinedDamage, requiresKatahUse: true }));
    }
  }

  const bestOption = options.slice().sort((a, b) => b.expectedDamage - a.expectedDamage || a.label.localeCompare(b.label))[0] ?? null;
  const gain = bestOption ? bestOption.expectedDamage - baseline : 0;
  const recommendation = bestOption && gain > 0.01
    ? `${bestOption.label} improves projected melee damage from ${baseline.toFixed(2)} to ${bestOption.expectedDamage.toFixed(2)} against this target${bestOption.requiresKatahUse ? "; confirm the Ka'tah only if you choose to spend this unit's readiness" : ""}.`
    : guardians
      ? "Guardians of the Throne is active, but the modeled Martial Mastery choices do not improve this weapon's baseline damage against this target."
      : katah.readied && monsterVehicle
        ? "Rendax is available against this Monster/Vehicle, but it does not improve the modeled baseline for this weapon."
        : null;

  return Object.freeze({
    available: Boolean(guardians || katah.readied && monsterVehicle),
    baselineExpectedDamage: baseline,
    katah,
    guardiansOfTheThrone: guardians,
    rendaxEligible: katah.readied && monsterVehicle,
    options: Object.freeze(options),
    bestOption,
    expectedDamageGain: Math.max(0, gain),
    recommendation
  });
}

export function getCustodesChargeAdvisorContext(state, { playerId, unitId, baseProbability } = {}) {
  const base = Number(baseProbability);
  const eligible = isMartialKatahEligible(state, unitId);
  const rerollCharge = eligible && hasCustodesDetachment(state, playerId, "Dread Host");
  const adjustedProbability = Number.isFinite(base)
    ? rerollCharge ? 1 - ((1 - base) ** 2) : base
    : null;
  return Object.freeze({
    available: eligible && rerollCharge,
    rerollCharge,
    baseProbability: Number.isFinite(base) ? base : null,
    adjustedProbability,
    reason: rerollCharge
      ? "Dread Host allows this Adeptus Custodes unit to re-roll its Charge roll."
      : "No modeled Custodes detachment charge reroll applies."
  });
}

export function hasCustodesFightsFirst(state, unitId) {
  const unit = unitById(state, unitId);
  if (!unit || !isMartialKatahEligible(state, unit.id)) return false;
  return hasCustodesDetachment(state, unit.ownerId, "Emissaries Imperatus");
}

export function getCustodesShootingRangeContext(state, { playerId, unitId, baseRange } = {}) {
  const range = Number(baseRange);
  const katah = getCustodesKatahState(state, { playerId, unitId });
  const aquilan = hasCustodesDetachment(state, playerId, "Aquilan Shield");
  const available = Number.isFinite(range) && katah.readied && aquilan && state?.phase === "shooting" && activePlayerId(state) === playerId;
  return Object.freeze({
    available,
    baseRange: Number.isFinite(range) ? range : null,
    extendedRange: available ? range + 6 : Number.isFinite(range) ? range : null,
    katahName: available ? "Salvus" : null,
    reason: available
      ? `Aquilan Shield's favoured Salvus can extend this ranged profile from ${range}\" to ${range + 6}\" if this unit spends its readiness.`
      : null
  });
}

export function getCustodesMovementContext(state, { playerId, unitId, baseMovement } = {}) {
  const movement = Number(baseMovement);
  const katah = getCustodesKatahState(state, { playerId, unitId });
  const solar = hasCustodesDetachment(state, playerId, "Solar Watch");
  const available = Number.isFinite(movement) && katah.readied && solar && state?.phase === "movement" && activePlayerId(state) === playerId;
  return Object.freeze({
    available,
    baseMovement: Number.isFinite(movement) ? movement : null,
    effectiveMovement: available ? movement + 2 : Number.isFinite(movement) ? movement : null,
    katahName: available ? "Calistus" : null,
    reason: available
      ? `Solar Watch's favoured Calistus can increase this unit's Move by 2\" this phase if it spends its readiness; Calistus also permits movement through models.`
      : null
  });
}

export function getCustodesPhaseRecommendations(state, { playerId } = {}) {
  const roster = state?.armyRosters?.[playerId];
  if (!roster || !isAdeptusCustodesFaction(roster.faction)) return Object.freeze([]);
  const engaged = new Set(getFightEngagementState(state)?.engagedUnitIds ?? []);
  const roots = (state?.units ?? []).filter((unit) =>
    unit?.ownerId === playerId && unit?.status === "deployed" && getCombatFormationRoot(state, unit)?.id === unit.id && isMartialKatahEligible(state, unit.id)
  );
  const recommendations = [];

  for (const unit of roots) {
    const katah = getCustodesKatahState(state, { playerId, unitId: unit.id });
    if (!katah.readied) continue;

    if (state.phase === "command" && activePlayerId(state) === playerId && (engaged.has(unit.id) || isUnitBattleShocked(unit))) {
      recommendations.push(Object.freeze({
        type: "custodes-katah",
        priority: 4,
        confidence: "high",
        unitId: unit.id,
        katahName: "Conservai",
        reason: engaged.has(unit.id)
          ? "Conservai can let this readied unit start an Action while engaged and starting that Action will not prevent it from shooting."
          : "Conservai can let this readied Battle-shocked unit start an Action and starting that Action will not prevent it from shooting."
      }));
    }

    if (state.phase === "movement" && activePlayerId(state) === playerId) {
      const movement = getCustodesMovementContext(state, { playerId, unitId: unit.id, baseMovement: Number(getProbabilisticUnitProfile(state, unit)?.characteristics?.movement) });
      if (hasCustodesDetachment(state, playerId, "Solar Watch")) {
        recommendations.push(Object.freeze({
          type: "custodes-katah",
          priority: movement.available ? 3 : 2,
          confidence: "moderate",
          unitId: unit.id,
          katahName: "Calistus",
          reason: movement.reason ?? "Calistus is readied for this unit; it can move through models during a Normal, Advance or Fall Back move."
        }));
      }
    }

    if (state.phase === "shooting" && activePlayerId(state) === playerId && hasCustodesDetachment(state, playerId, "Aquilan Shield")) {
      recommendations.push(Object.freeze({
        type: "custodes-katah",
        priority: 2,
        confidence: "moderate",
        unitId: unit.id,
        katahName: "Salvus",
        reason: "Salvus is available; Aquilan Shield adds 6\" range when it is used, and Salvus also ignores modifiers to BS, Hit rolls and Wound rolls."
      }));
    }
  }

  return Object.freeze(recommendations);
}

export function getCustodesKatahDefinition(name) {
  return KATAH_BY_NAME.get(name) ?? null;
}
