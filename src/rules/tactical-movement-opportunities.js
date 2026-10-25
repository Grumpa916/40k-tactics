import { getBattleUnitMovement, getCombatFormationMembers, getCombatFormationRoot } from "./battle-unit-reference.js";
import { getDatasheetWeaponOptions } from "./saved-roster-combat-profile.js";
import { getFormationObjectiveContribution } from "./tactical-objective-swing.js";
import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { getGameStrategyContext } from "./tactical-game-strategy.js";
import { getTargetStrategicContext } from "./tactical-target-context.js";
import { getSpatialContext } from "./spatial-context.js";
import { clamp01, unitById } from "./tactical-context-utils.js";

const MAP_UNCERTAINTY = 3;
const MAX_CHARGE_ROLL = 12;
const MAX_ADVANCE_ROLL = 6;

function activeSecondaries(state, playerId) {
  return (state?.scoring?.secondaryMissions ?? [])
    .filter((mission) => mission?.playerId === playerId && mission?.status === "active")
    .map((mission) => ({
      id: mission.instanceId ?? mission.definitionId ?? mission.definition?.id ?? "secondary",
      name: mission.definition?.name ?? mission.name ?? mission.definitionId ?? "Secondary mission",
      verified: mission.definition?.rulesVerified === true,
      definition: mission.definition ?? null
    }));
}

function verifiedMovementMissionSignal(secondaries) {
  const relevant = [];
  for (const mission of secondaries) {
    if (!mission.verified) continue;
    const text = (mission.definition?.scoringWindows ?? [])
      .flatMap((window) => window?.tiers ?? [])
      .map((tier) => tier?.summary ?? "")
      .join(" ")
      .toLowerCase();
    if (/objective|deployment zone|territory|wholly within|battlefield quarter|centre|center/.test(text)) {
      relevant.push(mission.name);
    }
  }
  return Object.freeze({
    score: Math.min(0.3, relevant.length * 0.15),
    missions: Object.freeze(relevant)
  });
}

function formationWeapons(state, unit) {
  const members = getCombatFormationMembers(state, unit);
  const ranged = [];
  const melee = [];
  for (const member of members) {
    ranged.push(...getDatasheetWeaponOptions(state, member, { type: "ranged" }));
    melee.push(...getDatasheetWeaponOptions(state, member, { type: "melee" }));
  }
  const maxRange = ranged.reduce((best, weapon) => {
    const range = Number(weapon?.characteristics?.range);
    return Number.isFinite(range) ? Math.max(best, range) : best;
  }, 0);
  return Object.freeze({
    hasRanged: ranged.length > 0,
    maxRangedRange: maxRange || null,
    hasMelee: melee.length > 0
  });
}

function objectiveAction({ control, distance, movement }) {
  if (control === "controlled" && distance <= 6) return "hold";
  if (Number.isFinite(movement) && distance <= movement + MAP_UNCERTAINTY) return "normal-move";
  if (Number.isFinite(movement) && distance <= movement + MAX_ADVANCE_ROLL + MAP_UNCERTAINTY) return "advance-option";
  return "reposition";
}

function objectiveBase(control) {
  if (control === "contested" || control === "contested-by-others") return 1;
  if (control === "enemy-controlled") return 0.95;
  if (control === "uncontrolled" || control == null) return 0.72;
  if (control === "controlled") return 0.48;
  return 0.4;
}

function objectivePurpose(control, action) {
  if (control === "controlled" && action === "hold") return "hold-objective";
  if (control === "controlled") return "reinforce-objective";
  if (control === "enemy-controlled") return "contest-objective";
  if (control === "contested" || control === "contested-by-others") return "swing-objective";
  return "claim-objective";
}

function reachFactor(distance, movement, action) {
  if (distance <= 3) return 1;
  if (action === "hold") return 0.95;
  if (action === "normal-move") return 0.92;
  if (action === "advance-option") return 0.72;
  if (!Number.isFinite(movement)) return Math.max(0.28, 1 - distance / 36);
  return Math.max(0.2, 1 - Math.max(0, distance - movement) / 30);
}

function movementActionLabel(action) {
  if (action === "hold") return "Hold or make only a small reposition";
  if (action === "normal-move") return "Normal Move can plausibly reach the area";
  if (action === "advance-option") return "Advance may be needed; roll before deciding";
  return "Reposition toward this purpose";
}

function objectiveOptions(state, { playerId, unit, movement, oc, spatial, strategy, missionSignal }) {
  const entries = (spatial.objectiveProximity ?? []).filter((entry) => entry.unitId === unit.id);
  return entries.map((entry) => {
    const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: entry.objectiveId });
    const action = objectiveAction({ control, distance: entry.distance, movement });
    const ocValue = Number.isFinite(oc.effectiveOc) ? clamp01(oc.effectiveOc / 8) : 0.35;
    const usableOcFactor = oc.battleShocked ? 0.35 : 0.58 + 0.42 * ocValue;
    const urgency = Math.min(1.35, (strategy.weights.primary + strategy.weights.objectiveSwing) / 2);
    const score = clamp01(
      objectiveBase(control) *
      reachFactor(entry.distance, movement, action) *
      usableOcFactor *
      urgency +
      missionSignal.score
    );
    const purpose = objectivePurpose(control, action);
    let reason = `${entry.objectiveId} is ${control ?? "uncontrolled"} and about ${entry.distance}\" away on the approximate map.`;
    if (Number.isFinite(oc.effectiveOc)) reason += ` This formation currently contributes about ${oc.effectiveOc} usable OC.`;
    if (oc.battleShocked) reason += " It is Battle-shocked, so its saved OC is treated as suppressed for this recommendation.";
    if (missionSignal.missions.length) reason += ` Verified active movement-relevant secondary context: ${missionSignal.missions.join(", ")}.`;
    return Object.freeze({
      kind: "objective",
      purpose,
      score,
      objectiveId: entry.objectiveId,
      distance: entry.distance,
      control,
      actionHint: movementActionLabel(action),
      confidence: Number.isFinite(movement) && oc.confidence !== "low" ? "moderate" : "low",
      reason
    });
  });
}

function targetOptions(state, { playerId, unit, movement, spatial, weapons }) {
  const entries = (spatial.unitProximity ?? []).filter((entry) => entry.unitId === unit.id);
  const options = [];
  for (const entry of entries) {
    const target = unitById(state, entry.otherUnitId);
    if (!target || target.ownerId === playerId || target.status === "destroyed") continue;
    let strategic = null;
    try {
      strategic = getTargetStrategicContext(state, { playerId, targetUnitId: target.id });
    } catch {
      strategic = null;
    }
    if (!strategic) continue;

    const normalMove = Number.isFinite(movement) ? movement : 0;
    const canStageCharge = weapons.hasMelee && Number.isFinite(movement) &&
      entry.distance <= normalMove + MAX_CHARGE_ROLL + MAP_UNCERTAINTY;
    const canEnterRanged = weapons.hasRanged && Number.isFinite(movement) && Number.isFinite(weapons.maxRangedRange) &&
      entry.distance > weapons.maxRangedRange &&
      entry.distance <= weapons.maxRangedRange + normalMove + MAP_UNCERTAINTY;
    const alreadyRanged = weapons.hasRanged && Number.isFinite(weapons.maxRangedRange) && entry.distance <= weapons.maxRangedRange;

    let purpose = "pressure-target";
    let actionHint = "Reposition while preserving options against this target";
    let roleBoost = 0;
    if (canEnterRanged) {
      purpose = "enter-ranged-pressure";
      actionHint = `A Normal Move may bring this target inside the saved ${weapons.maxRangedRange}\" maximum ranged profile`;
      roleBoost = 0.18;
    } else if (canStageCharge) {
      purpose = "stage-charge";
      actionHint = "A Normal Move can plausibly improve a later Charge; measure from the final tabletop position";
      roleBoost = 0.16;
    } else if (alreadyRanged) {
      purpose = "preserve-ranged-pressure";
      actionHint = "Target is already within the approximate maximum saved weapon range; move only if mission or positioning value improves";
      roleBoost = 0.08;
    }

    const proximity = clamp01(1 - entry.distance / 42);
    const score = clamp01(strategic.score * 0.7 + proximity * 0.18 + roleBoost);
    options.push(Object.freeze({
      kind: "target",
      purpose,
      score,
      targetUnitId: target.id,
      targetName: target.name ?? target.id,
      distance: entry.distance,
      strategicContext: strategic,
      actionHint,
      confidence: Number.isFinite(movement) ? "moderate" : "low",
      reason: `${target.name ?? target.id} has ${strategic.label} strategic value and is about ${entry.distance}\" away on the approximate map. ${strategic.reason}`
    }));
  }
  return options;
}

function fallbackOption(unit, movement, strategy) {
  return Object.freeze({
    kind: "position",
    purpose: "reposition",
    score: clamp01(0.25 + strategy.urgency * 0.15),
    actionHint: Number.isFinite(movement)
      ? `Use the saved ${movement}\" Move to improve board position without assuming exact legality from the map`
      : "Reposition using the tabletop Move characteristic; saved movement data is unavailable",
    confidence: Number.isFinite(movement) ? "moderate" : "low",
    reason: `No stronger recorded objective or enemy-target movement purpose is established for ${unit.name ?? unit.id}.`
  });
}

function recommendationText(unit, best) {
  const name = unit.name ?? unit.id;
  if (best.purpose === "hold-objective") return `${name}: hold ${best.objectiveId}; current scoring position is more valuable than unnecessary movement.`;
  if (best.purpose === "reinforce-objective") return `${name}: reinforce ${best.objectiveId}.`;
  if (best.purpose === "contest-objective") return `${name}: move toward ${best.objectiveId} to pressure enemy control.`;
  if (best.purpose === "swing-objective") return `${name}: prioritize ${best.objectiveId}; it is already contested and this move can improve the local scoring fight.`;
  if (best.purpose === "claim-objective") return `${name}: move toward ${best.objectiveId} to establish control.`;
  if (best.purpose === "enter-ranged-pressure") return `${name}: reposition to bring ${best.targetName} into stronger Shooting pressure.`;
  if (best.purpose === "stage-charge") return `${name}: reposition toward ${best.targetName} to improve the later Charge decision.`;
  if (best.purpose === "preserve-ranged-pressure") return `${name}: preserve pressure on ${best.targetName}; do not move without a better mission or positional gain.`;
  if (best.purpose === "pressure-target") return `${name}: reposition toward ${best.targetName}, a strategically valuable enemy unit.`;
  return `${name}: improve board position; no higher-confidence mission or combat route is established yet.`;
}

export function getMovementStrategicRecommendations(state, { playerId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (state?.phase !== "movement") {
    return Object.freeze({ playerId, strategy: getGameStrategyContext(state, { playerId }), activeSecondaries: Object.freeze([]), recommendations: Object.freeze([]) });
  }

  const strategy = getGameStrategyContext(state, { playerId });
  const spatial = getSpatialContext(state, { playerId });
  const secondaries = activeSecondaries(state, playerId);
  const missionSignal = verifiedMovementMissionSignal(secondaries);
  const roots = (state?.units ?? []).filter((unit) =>
    unit?.ownerId === playerId && unit?.status === "deployed" && getCombatFormationRoot(state, unit)?.id === unit.id
  );

  const recommendations = roots.map((unit) => {
    const movement = getBattleUnitMovement(state, unit);
    const oc = getFormationObjectiveContribution(state, unit);
    const weapons = formationWeapons(state, unit);
    const candidates = [
      ...objectiveOptions(state, { playerId, unit, movement, oc, spatial, strategy, missionSignal }),
      ...targetOptions(state, { playerId, unit, movement, spatial, weapons }),
      fallbackOption(unit, movement, strategy)
    ].sort((a, b) => b.score - a.score || a.kind.localeCompare(b.kind));
    const best = candidates[0];
    return Object.freeze({
      type: "movement",
      unitId: unit.id,
      unitName: unit.name ?? unit.id,
      movement,
      effectiveOc: oc.effectiveOc,
      battleShocked: oc.battleShocked,
      weapons,
      score: best.score,
      priority: best.score >= 0.8 ? 5 : best.score >= 0.65 ? 4 : best.score >= 0.48 ? 3 : best.score >= 0.3 ? 2 : 1,
      purpose: best.purpose,
      confidence: best.confidence,
      actionHint: best.actionHint,
      objectiveId: best.objectiveId ?? null,
      targetUnitId: best.targetUnitId ?? null,
      targetName: best.targetName ?? null,
      distance: best.distance ?? null,
      strategicContext: best.strategicContext ?? null,
      recommendation: recommendationText(unit, best),
      reason: best.reason,
      alternatives: Object.freeze(candidates.slice(1, 3))
    });
  }).sort((a, b) => b.score - a.score || b.priority - a.priority || a.unitName.localeCompare(b.unitName));

  return Object.freeze({
    playerId,
    strategy,
    activeSecondaries: Object.freeze(secondaries.map(({ id, name, verified }) => Object.freeze({ id, name, verified }))),
    missionSignal,
    recommendations: Object.freeze(recommendations)
  });
}
