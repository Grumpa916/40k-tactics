import {
  getConsecrateReviewState,
  isConsecrateMissionForPlayer,
  isOpponentHomeObjectiveForPlayer,
  isPlayerHomeObjective
} from "./consecrate-state.js";
import { clamp01 } from "./tactical-context-utils.js";

function controlledBy(control, playerId) {
  return control?.controlState === "controlled" && control?.controllerId === playerId;
}

function objectiveSnapshot(state, playerId) {
  const all = Array.isArray(state?.objectives) ? state.objectives : [];
  const known = all.length > 0 && all.every((objective) => objective?.control != null);
  const controlled = known ? all.filter((objective) => controlledBy(objective.control, playerId)) : [];
  const opponentControlled = known ? all.filter((objective) =>
    objective?.control?.controlState === "controlled" && objective.control.controllerId != null && objective.control.controllerId !== playerId
  ) : [];
  const nonHomeControlled = controlled.filter((objective) => !isPlayerHomeObjective(state, objective, playerId));
  return Object.freeze({
    known,
    controlled: controlled.length,
    opponentControlled: opponentControlled.length,
    margin: controlled.length - opponentControlled.length,
    nonHomeControlled: nonHomeControlled.length,
    nonHomeControlledIds: Object.freeze(nonHomeControlled.map((objective) => objective.id))
  });
}

export function getConsecratePrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = null,
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isConsecrateMissionForPlayer(state, playerId, perspectivePlayerId ?? undefined)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Consecrate strategy is not active for this player."
    });
  }

  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const objectives = objectiveSnapshot(state, playerId);
  const review = getConsecrateReviewState(state, { playerId, perspectivePlayerId: perspectivePlayerId ?? undefined });
  const nonHomeSatisfied = round >= 2 && objectives.known ? objectives.nonHomeControlled >= 1 : round >= 2 ? null : false;
  const majoritySatisfied = round >= 2 && objectives.known ? objectives.margin > 0 : round >= 2 ? null : false;
  const availableObjectiveIds = Object.freeze(review.availableObjectives.map((objective) => objective.id));
  const markerTierGain = review.availableObjectives.length > 0 && (review.consecratedCount === 0 || review.consecratedCount === 2) ? 3 : 0;
  const nextKillVpLeverage = markerTierGain;
  const targetingScore = markerTierGain > 0 ? 0.34 : review.availableObjectives.length > 0 ? 0.16 : 0.06;
  const objectivePreservationScore = !objectives.known ? 0.35
    : round < 2 ? 0.4
      : objectives.margin === 1 ? 0.9
        : objectives.margin <= 0 ? 0.82
          : objectives.nonHomeControlled === 0 ? 0.8 : 0.56;

  let rawRecordedVp = review.endTurnConsecrationVp;
  if (round >= 2 && nonHomeSatisfied) rawRecordedVp += 4;
  if (round >= 2 && majoritySatisfied) rawRecordedVp += 4;

  const consecrationProgress = review.consecratedCount === 0
    ? "No objectives are consecrated yet; the first marker establishes the 3 VP end-of-turn tier."
    : review.consecratedCount === 1
      ? "One objective is consecrated; the second remains in the 3 VP tier, while the third raises it to 6 VP."
      : review.consecratedCount === 2
        ? "Two objectives are consecrated; the next successful consecration raises the end-of-turn tier from 3 VP to 6 VP."
        : `${review.consecratedCount} objectives are consecrated; the 6 VP end-of-turn tier is established.`;
  const carrierProgress = review.allConsecrationUnitIds.length > 0
    ? `${review.allConsecrationUnitIds.length} friendly unit${review.allConsecrationUnitIds.length === 1 ? " is" : "s are"} currently carrying a consecration opportunity until they successfully mark an objective.`
    : "No friendly unit is currently recorded as a consecration unit; destroying an enemy can create one.";
  const objectiveProgress = round < 2
    ? "The non-home and objective-majority control conditions begin in Round 2."
    : !objectives.known
      ? "Objective control is incomplete; confirm controllers before relying on Consecrate control advice."
      : `Objectives: ${objectives.controlled}-${objectives.opponentControlled}; ${objectives.nonHomeControlled} non-home controlled. ${majoritySatisfied ? "Objective majority is currently held." : "Objective majority is not currently held."}`;
  const endgameProgress = review.opponentHomeConsecrated
    ? "The opponent's home objective is already consecrated, satisfying the separate 5 VP end-of-battle condition."
    : "The opponent's home objective is not yet consecrated; reaching it with a consecration unit is worth a separate 5 VP at end of battle.";

  let reason;
  if (review.allConsecrationUnitIds.length > 0 && review.availableObjectives.length > 0) {
    reason = "You already have a live consecration opportunity. Prioritize moving a consecration unit onto an unconsecrated objective rather than treating another kill as automatic Primary VP.";
  } else if (markerTierGain > 0) {
    reason = "Destroying an enemy can create a consecration unit and potentially unlock the next 3 VP marker tier, but the killer must still finish a turn within range of an unconsecrated non-home objective.";
  } else if (round >= 2 && majoritySatisfied === false) {
    reason = "Consecrate's stronger current positional need is objective majority. Improve the objective count while preserving at least one non-home objective.";
  } else if (!review.opponentHomeConsecrated) {
    reason = "Current Consecrate scoring is stable; preserve control and plan a route for a consecration unit to the opponent's home objective for the 5 VP endgame condition.";
  } else {
    reason = "Recorded Consecrate conditions are favorable; preserve the objective position and avoid unnecessary risk that does not improve marker or control scoring.";
  }

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Purge the Foe",
    missionId: "primary-consecrate",
    missionName: "Consecrate",
    round,
    turn,
    targetUnitId,
    objectiveStateKnown: objectives.known,
    controlledObjectives: objectives.controlled,
    opponentControlledObjectives: objectives.opponentControlled,
    objectiveMargin: objectives.margin,
    nonHomeControlled: objectives.nonHomeControlled,
    nonHomeControlledObjectiveIds: objectives.nonHomeControlledIds,
    nonHomeSatisfied,
    majoritySatisfied,
    consecratedObjectiveIds: review.consecratedObjectiveIds,
    consecratedCount: review.consecratedCount,
    endTurnConsecrationVp: review.endTurnConsecrationVp,
    consecrationUnitIds: review.allConsecrationUnitIds,
    deployedConsecrationUnitIds: Object.freeze(review.deployedConsecrationUnits.map((unit) => unit.id)),
    availableConsecrationObjectiveIds: availableObjectiveIds,
    opponentHomeConsecrated: review.opponentHomeConsecrated,
    opponentHomeObjectiveIds: review.opponentHomeObjectiveIds,
    opponentHomeEndBattleVpLeverage: review.opponentHomeConsecrated ? 0 : 5,
    nextKillVpLeverage,
    rawRecordedVp,
    cappedRecordedVp: Math.min(15, rawRecordedVp),
    targetingScore,
    objectivePreservationScore,
    protectCheapUnits: false,
    summary: Object.freeze([
      consecrationProgress,
      carrierProgress,
      objectiveProgress,
      endgameProgress,
      `Recorded current-round conditions represent up to ${Math.min(15, rawRecordedVp)}/15 Primary VP before timing and player confirmation; the opponent-home 5 VP condition is tracked separately.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Recorded combat destructions identify consecration units; kills without an attributed attacker remain player-confirmed.",
      "A consecration unit remains one until it successfully consecrates an objective.",
      "Approximate map positions never determine whether a unit is within range of an objective; the tabletop confirmation is authoritative.",
      "The 15 VP per-round cap is applied to the current-round outlook; the opponent-home 5 VP condition is tracked separately at end of battle."
    ])
  });
}

export function getConsecrateObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = null,
  objectiveId,
  unitId = null,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const context = primaryStrategy ?? getConsecratePrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context?.active) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });

  const controlledNow = control === "controlled" || controlledBy(objective.control, playerId);
  const ownHome = isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId ?? undefined);
  const opponentHome = isOpponentHomeObjectiveForPlayer(state, objective, playerId, perspectivePlayerId ?? undefined);
  const alreadyConsecrated = context.consecratedObjectiveIds.includes(objectiveId);
  const availableToConsecrate = !ownHome && !alreadyConsecrated;
  const unitIsConsecration = Boolean(unitId) && context.consecrationUnitIds.includes(unitId);
  let score = 0.04;
  let vpLeverage = 0;
  const notes = [];

  if (unitIsConsecration && availableToConsecrate) {
    const tierGain = context.consecratedCount === 0 || context.consecratedCount === 2 ? 3 : 0;
    score += tierGain > 0 ? 0.38 : 0.26;
    vpLeverage += tierGain;
    notes.push(tierGain > 0
      ? `This unit is a consecration unit; successfully marking this objective can unlock ${tierGain} additional VP in the current marker tier.`
      : "This unit is a consecration unit; marking this objective advances the persistent Consecrate objective count even though it does not immediately change the current marker tier.");
    notes.push("Confirm objective range on the tabletop at the end of the turn; map distance is advisory only.");
    if (opponentHome && !context.opponentHomeConsecrated) {
      vpLeverage += 5;
      score += context.round >= 4 ? 0.34 : context.round >= 3 ? 0.26 : 0.18;
      notes.push("This is the opponent's home objective, so consecrating it also establishes the separate 5 VP end-of-battle condition.");
    }
  } else if (unitIsConsecration && alreadyConsecrated) {
    notes.push("This objective is already consecrated; this unit must reach a different unconsecrated non-home objective to cash in its consecration status.");
  } else if (unitIsConsecration && ownHome) {
    notes.push("Your home objective cannot be consecrated, so this unit should preserve or cross this position only if the control value justifies it.");
  }

  if (context.round >= 2 && !ownHome) {
    if (!context.nonHomeSatisfied) {
      vpLeverage += 4;
      score += 0.2;
      notes.push("Consecrate also needs at least one non-home objective for the 4 VP control condition.");
    } else if (controlledNow && context.nonHomeControlledObjectiveIds.includes(objectiveId)) {
      vpLeverage += 4;
      score += purpose === "hold-objective" ? 0.18 : 0.1;
      notes.push("This controlled non-home objective currently preserves the 4 VP control condition.");
    }
  }

  if (context.round >= 2) {
    if (context.majoritySatisfied) {
      if (controlledNow && context.objectiveMargin === 1) {
        vpLeverage += 4;
        score += 0.22;
        notes.push("Your objective lead is only one; losing this objective can cost the 4 VP majority condition.");
      }
    } else if (!controlledNow) {
      vpLeverage += 4;
      score += 0.22;
      notes.push("Taking or denying this objective can help create the 4 VP objective-majority condition.");
    }
  }

  if (opponentHome && !context.opponentHomeConsecrated && !unitIsConsecration) {
    score += context.round >= 4 ? 0.12 : 0.05;
    notes.push("The opponent's home objective still needs a consecration unit to establish the separate 5 VP endgame condition.");
  }

  return Object.freeze({
    active: true,
    score: clamp01(score),
    vpLeverage,
    unitIsConsecration,
    availableToConsecrate,
    alreadyConsecrated,
    opponentHome,
    reason: notes.join(" ")
  });
}
