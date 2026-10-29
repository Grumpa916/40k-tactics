import { objectiveAdvisorLabel } from './objective-display-labels.js';
import { getBattleUnitMovement, getCombatFormationMembers, getCombatFormationRoot } from "./battle-unit-reference.js";
import { getDatasheetWeaponOptions } from "./saved-roster-combat-profile.js";
import { getFormationObjectiveContribution } from "./tactical-objective-swing.js";
import { getObjectiveControlForPlayer } from "./objective-control-state.js";
import { getGameStrategyContext } from "./tactical-game-strategy.js";
import { getTargetStrategicContext } from "./tactical-target-context.js";
import { getPrimaryStrategyContext, getPrimaryObjectiveStrategySignal } from "./tactical-primary-strategy.js";
import { getLiveUnitPosition, getSpatialContext } from "./spatial-context.js";
import { getTerritoryStatusForPosition } from "./battlefield-territory.js";
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

function missionReferenceText(mission) {
  const definition = mission?.definition ?? {};
  return [
    ...(definition.scoringWindows ?? []).flatMap((window) => (window?.tiers ?? []).map((tier) => tier?.summary ?? "")),
    ...(definition.referenceNotes ?? []),
    ...(definition.notes ?? []),
    definition.whenDrawn ?? "",
    definition.missionAction?.summary ?? ""
  ].join(" ").toLowerCase();
}

function verifiedMovementMissionSignal(secondaries) {
  const relevant = [];
  for (const mission of secondaries) {
    if (!mission.verified) continue;
    const text = missionReferenceText(mission);
    if (/objective|deployment zone|territory|wholly within|battlefield quarter|centre|center/.test(text)) {
      relevant.push(mission.name);
    }
  }
  return Object.freeze({
    score: Math.min(0.3, relevant.length * 0.15),
    missions: Object.freeze(relevant)
  });
}

function territoryMissionSignal(secondaries) {
  const verified = [];
  const reviewOnly = [];
  let directOutsideOwn = 0;
  let forwardStaging = 0;

  for (const mission of secondaries) {
    const text = missionReferenceText(mission);
    const outsideOwn = /not within your territory|outside your territory/.test(text);
    const opponentDeployment = /opponent(?:'|’)?s deployment zone/.test(text);
    const opponentHome = /opponent(?:'|’)?s home objective/.test(text);
    if (!outsideOwn && !opponentDeployment && !opponentHome) continue;

    if (!mission.verified) {
      reviewOnly.push(mission.name);
      continue;
    }

    verified.push(mission.name);
    if (outsideOwn) directOutsideOwn += 0.24;
    if (opponentDeployment || opponentHome) forwardStaging += 0.08;
  }

  return Object.freeze({
    score: Math.min(0.32, directOutsideOwn + forwardStaging),
    directOutsideOwn: Math.min(0.28, directOutsideOwn),
    forwardStaging: Math.min(0.12, forwardStaging),
    missions: Object.freeze(verified),
    reviewOnlyMissions: Object.freeze(reviewOnly)
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

function objectiveOptions(state, { playerId, perspectivePlayerId, unit, movement, oc, spatial, strategy, missionSignal, primaryStrategy }) {
  const entries = (spatial.objectiveProximity ?? []).filter((entry) => entry.unitId === unit.id);
  return entries.map((entry) => {
    const control = getObjectiveControlForPlayer(state, { playerId, objectiveId: entry.objectiveId });
    const action = objectiveAction({ control, distance: entry.distance, movement });
    const purpose = objectivePurpose(control, action);
    const primarySignal = getPrimaryObjectiveStrategySignal(state, {
      playerId,
      perspectivePlayerId,
      objectiveId: entry.objectiveId,
      control,
      purpose,
      primaryStrategy
    });
    const ocValue = Number.isFinite(oc.effectiveOc) ? clamp01(oc.effectiveOc / 8) : 0.35;
    const usableOcFactor = oc.battleShocked ? 0.35 : 0.58 + 0.42 * ocValue;
    const suppressSmokePrimary = primaryStrategy?.missionId === "primary-smoke-and-mirrors" &&
      (oc.battleShocked === true || (Number.isFinite(oc.effectiveOc) && oc.effectiveOc <= 0));
    const primaryStrategyScoreApplied = suppressSmokePrimary ? 0 : primarySignal.score;
    const urgency = Math.min(1.35, (strategy.weights.primary + strategy.weights.objectiveSwing) / 2);
    const holdBonus = purpose === "hold-objective" && Number(oc.effectiveOc) > 0
      ? 0.18 + Math.min(0.12, Number(oc.effectiveOc) * 0.02)
      : 0;
    const score = clamp01(
      objectiveBase(control) *
      reachFactor(entry.distance, movement, action) *
      usableOcFactor *
      urgency +
      missionSignal.score +
      holdBonus +
      primaryStrategyScoreApplied
    );
    const objectiveName=objectiveAdvisorLabel(state,entry.objectiveId,perspectivePlayerId);
    let reason = `${objectiveName} is ${control ?? "uncontrolled"} and about ${entry.distance}\" away on the approximate map.`;
    if (Number.isFinite(oc.effectiveOc)) reason += ` This formation currently contributes about ${oc.effectiveOc} usable OC.`;
    if (holdBonus > 0) reason += " Holding receives extra value because this formation is already contributing usable OC near a friendly-controlled objective.";
    if (primarySignal.active && primarySignal.reason && !suppressSmokePrimary) reason += ` ${primarySignal.reason}`;
    if (suppressSmokePrimary) reason += " Smoke and Mirrors objective bonuses are suppressed because this formation has no usable OC to complete or establish the required objective-control play.";
    if (oc.battleShocked) reason += " It is Battle-shocked, so its saved OC is treated as suppressed for this recommendation.";
    if (missionSignal.missions.length) reason += ` Verified active movement-relevant secondary context: ${missionSignal.missions.join(", ")}.`;
    return Object.freeze({
      kind: "objective",
      purpose,
      score,
      objectiveId: entry.objectiveId,
      objectiveName,
      distance: entry.distance,
      control,
      primaryStrategySignal: primarySignal,
      primaryStrategyScoreApplied,
      actionHint: movementActionLabel(action),
      confidence: Number.isFinite(movement) && oc.confidence !== "low" ? "moderate" : "low",
      reason
    });
  });
}

function territoryMoveAction(status, movement) {
  const distance = Number(status?.distanceToBoundary);
  if (!Number.isFinite(distance) || !Number.isFinite(movement)) return "reposition";
  if (distance <= movement + MAP_UNCERTAINTY) return "normal-move";
  if (distance <= movement + MAX_ADVANCE_ROLL + MAP_UNCERTAINTY) return "advance-option";
  return "reposition";
}

function territoryOptions(state, { playerId, unit, movement, strategy, territorySignal }) {
  const position = getLiveUnitPosition(state, unit);
  if (!position) return [];
  const status = getTerritoryStatusForPosition(state, { playerId, position, uncertainty: MAP_UNCERTAINTY });
  if (status.territory === "unknown") return [];

  const missionBonus = territorySignal.score;
  const genericForwardValue = clamp01(0.18 + strategy.urgency * 0.08);
  const reviewText = territorySignal.reviewOnlyMissions.length
    ? ` Review-only territory mission context: ${territorySignal.reviewOnlyMissions.join(", ")}; it does not change the numeric ranking.`
    : "";
  const verifiedText = territorySignal.missions.length
    ? ` Verified territory-relevant secondary context: ${territorySignal.missions.join(", ")}.`
    : "";

  if (status.territory === "boundary") {
    const score = clamp01(0.22 + missionBonus * 0.85 + strategy.urgency * 0.05);
    return [Object.freeze({
      kind: "territory",
      purpose: "confirm-territory-boundary",
      score,
      territoryTarget: "boundary",
      distance: status.distanceToBoundary,
      actionHint: "Measure the final position from the dotted territory line before relying on a territory-dependent mission",
      confidence: "low",
      territoryStatus: status,
      reason: `This formation is within the ±${MAP_UNCERTAINTY}\" advisory band of the territory boundary, so the map does not claim which territory it occupies.${verifiedText}${reviewText}`
    })];
  }

  if (status.territory === "opponent") {
    const score = clamp01(genericForwardValue + 0.12 + missionBonus);
    return [Object.freeze({
      kind: "territory",
      purpose: "hold-opponent-territory",
      score,
      territoryTarget: "opponent",
      distance: status.distanceToBoundary,
      actionHint: "Preserve the opponent-territory position unless an objective or combat route has greater value",
      confidence: status.confidence,
      territoryStatus: status,
      reason: `This formation is approximately ${Math.round(status.distanceToBoundary)}\" inside opponent territory on the advisory map.${verifiedText}${reviewText}`
    })];
  }

  const action = territoryMoveAction(status, movement);
  const reachBoost = action === "normal-move" ? 0.14 : action === "advance-option" ? 0.08 : 0;
  const score = clamp01(genericForwardValue + reachBoost + missionBonus);
  const actionHint = action === "normal-move"
    ? "A Normal Move can plausibly cross the dotted territory boundary; confirm the final tabletop position"
    : action === "advance-option"
      ? "An Advance may be needed to cross the dotted territory boundary; confirm after the roll and final tabletop position"
      : "Reposition toward the territory boundary; the current saved Move does not establish a crossing";
  return [Object.freeze({
    kind: "territory",
    purpose: "enter-opponent-territory",
    score,
    territoryTarget: "opponent",
    distance: status.distanceToBoundary,
    actionHint,
    confidence: Number.isFinite(movement) ? "moderate" : "low",
    territoryStatus: status,
    reason: `This formation is approximately ${Math.round(status.distanceToBoundary)}\" from the dotted territory boundary on your side.${verifiedText}${reviewText}`
  })];
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
  if (best.purpose === "hold-objective") return `${name}: hold ${best.objectiveName ?? best.objectiveId}; current scoring position is more valuable than unnecessary movement.`;
  if (best.purpose === "reinforce-objective") return `${name}: reinforce ${best.objectiveName ?? best.objectiveId}.`;
  if (best.purpose === "contest-objective") return `${name}: move toward ${best.objectiveName ?? best.objectiveId} to pressure enemy control.`;
  if (best.purpose === "swing-objective") return `${name}: prioritize ${best.objectiveName ?? best.objectiveId}; it is already contested and this move can improve the local scoring fight.`;
  if (best.purpose === "claim-objective") return `${name}: move toward ${best.objectiveName ?? best.objectiveId} to establish control.`;
  if (best.purpose === "enter-opponent-territory") return `${name}: consider crossing into opponent territory for forward positioning and any verified territory-dependent secondary value.`;
  if (best.purpose === "hold-opponent-territory") return `${name}: preserve the opponent-territory position unless another move has greater mission or combat value.`;
  if (best.purpose === "confirm-territory-boundary") return `${name}: measure the territory line before relying on this position for a territory-dependent secondary.`;
  if (best.purpose === "enter-ranged-pressure") return `${name}: reposition to bring ${best.targetName} into stronger Shooting pressure.`;
  if (best.purpose === "stage-charge") return `${name}: reposition toward ${best.targetName} to improve the later Charge decision.`;
  if (best.purpose === "preserve-ranged-pressure") return `${name}: preserve pressure on ${best.targetName}; do not move without a better mission or positional gain.`;
  if (best.purpose === "pressure-target") return `${name}: reposition toward ${best.targetName}, a strategically valuable enemy unit.`;
  return `${name}: improve board position; no higher-confidence mission or combat route is established yet.`;
}

export function getMovementStrategicRecommendations(state, { playerId, perspectivePlayerId = playerId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (state?.phase !== "movement") {
    return Object.freeze({ playerId, strategy: getGameStrategyContext(state, { playerId }), activeSecondaries: Object.freeze([]), recommendations: Object.freeze([]) });
  }

  const strategy = getGameStrategyContext(state, { playerId });
  const primaryStrategy = getPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const spatial = getSpatialContext(state, { playerId });
  const secondaries = activeSecondaries(state, playerId);
  const missionSignal = verifiedMovementMissionSignal(secondaries);
  const territorySignal = territoryMissionSignal(secondaries);
  const roots = (state?.units ?? []).filter((unit) =>
    unit?.ownerId === playerId && unit?.status === "deployed" && getCombatFormationRoot(state, unit)?.id === unit.id
  );

  const recommendations = roots.map((unit) => {
    const movement = getBattleUnitMovement(state, unit);
    const oc = getFormationObjectiveContribution(state, unit);
    const weapons = formationWeapons(state, unit);
    const territory = territoryOptions(state, { playerId, unit, movement, strategy, territorySignal });
    const candidates = [
      ...objectiveOptions(state, { playerId, perspectivePlayerId, unit, movement, oc, spatial, strategy, missionSignal, primaryStrategy }),
      ...territory,
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
      territory: territory[0]?.territoryStatus ?? null,
      score: best.score,
      priority: best.score >= 0.8 ? 5 : best.score >= 0.65 ? 4 : best.score >= 0.48 ? 3 : best.score >= 0.3 ? 2 : 1,
      purpose: best.purpose,
      confidence: best.confidence,
      actionHint: best.actionHint,
      objectiveId: best.objectiveId ?? null,
      objectiveName:best.objectiveName ?? null,
      targetUnitId: best.targetUnitId ?? null,
      targetName: best.targetName ?? null,
      territoryTarget: best.territoryTarget ?? null,
      distance: best.distance ?? null,
      strategicContext: best.strategicContext ?? null,
      primaryStrategySignal: best.primaryStrategySignal ?? null,
      primaryStrategyScoreApplied: best.primaryStrategyScoreApplied ?? 0,
      recommendation: recommendationText(unit, best),
      reason: best.reason,
      alternatives: Object.freeze(candidates.slice(1, 3))
    });
  }).sort((a, b) => b.score - a.score || b.priority - a.priority || a.unitName.localeCompare(b.unitName));

  return Object.freeze({
    playerId,
    strategy,
    primaryStrategy,
    activeSecondaries: Object.freeze(secondaries.map(({ id, name, verified }) => Object.freeze({ id, name, verified }))),
    missionSignal,
    territorySignal,
    recommendations: Object.freeze(recommendations)
  });
}
