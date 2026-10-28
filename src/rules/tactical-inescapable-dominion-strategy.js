import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isOpponentHomeObjectiveForPlayer } from "./consecrate-state.js";
import { clamp01 } from "./tactical-context-utils.js";

function players(state) {
  return Array.isArray(state?.players) ? state.players : [];
}

function defaultPerspectivePlayerId(state) {
  return players(state)[0]?.id ?? state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
}

function missionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!playerId || !setup?.myDisposition || !setup?.opponentDisposition) return null;
  const definitions = getBattlePrimaryMissionDefinitions(setup.myDisposition, setup.opponentDisposition);
  if (!definitions) return null;
  return playerId === perspectivePlayerId ? definitions.myMission : definitions.opponentMission;
}

export function isInescapableDominionMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === "primary-inescapable-dominion";
}

function controlledBy(control, playerId) {
  return control?.controlState === "controlled" && control?.controllerId === playerId;
}

function objectiveSnapshot(state, playerId, perspectivePlayerId) {
  const all = Array.isArray(state?.objectives) ? state.objectives : [];
  const opponentHome = all.filter((objective) => isOpponentHomeObjectiveForPlayer(state, objective, playerId, perspectivePlayerId));
  const opponentHomeObjectiveIds = Object.freeze(opponentHome.map((objective) => objective.id));
  const known = all.length > 0 && all.every((objective) => objective?.control != null);
  if (!known) {
    return Object.freeze({
      known: false,
      controlled: 0,
      opponentControlled: 0,
      margin: 0,
      controlledIds: Object.freeze([]),
      opponentHomeRoleKnown: opponentHome.length > 0,
      opponentHomeControlled: null,
      opponentHomeObjectiveIds
    });
  }

  const controlled = all.filter((objective) => controlledBy(objective.control, playerId));
  const opponentControlled = all.filter((objective) =>
    objective?.control?.controlState === "controlled" &&
    objective.control.controllerId != null &&
    objective.control.controllerId !== playerId
  );
  return Object.freeze({
    known: true,
    controlled: controlled.length,
    opponentControlled: opponentControlled.length,
    margin: controlled.length - opponentControlled.length,
    controlledIds: Object.freeze(controlled.map((objective) => objective.id)),
    opponentHomeRoleKnown: opponentHome.length > 0,
    opponentHomeControlled: opponentHome.length > 0 ? opponentHome.some((objective) => controlledBy(objective.control, playerId)) : null,
    opponentHomeObjectiveIds
  });
}

function timingSummary(round) {
  if (round === 1) return "Round 1: 4 VP is available at end of turn for controlling three or more objectives; the two-objective and majority conditions begin in Round 2.";
  if (round < 5) return `Round ${round}: the 5 VP two-objective and 4 VP majority conditions check at end of Command phase; the 4 VP three-objective condition still checks at end of turn.`;
  return "Round 5: the two-objective, three-objective and majority conditions all resolve at end of turn, so movement can directly change every round-scoring Dominion condition.";
}

export function getInescapableDominionPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isInescapableDominionMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Inescapable Dominion strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const phase = String(state?.phase ?? "");
  const objectives = objectiveSnapshot(state, playerId, perspectivePlayerId);
  const twoObjectiveActive = round >= 2;
  const twoObjectiveSatisfied = twoObjectiveActive && objectives.known ? objectives.controlled >= 2 : twoObjectiveActive ? null : false;
  const threeObjectiveSatisfied = objectives.known ? objectives.controlled >= 3 : null;
  const majorityActive = round >= 2;
  const majoritySatisfied = majorityActive && objectives.known ? objectives.margin > 0 : majorityActive ? null : false;
  const twoObjectiveVp = twoObjectiveSatisfied ? 5 : 0;
  const threeObjectiveVp = threeObjectiveSatisfied ? 4 : 0;
  const majorityVp = majoritySatisfied ? 4 : 0;
  const rawRecordedVp = twoObjectiveVp + threeObjectiveVp + majorityVp;
  const cappedRecordedVp = Math.min(15, rawRecordedVp);
  const endBattleVp = objectives.opponentHomeControlled === true ? 5 : 0;

  let objectivePreservationScore = objectives.known ? 0.58 : 0.34;
  if (objectives.known && objectives.controlled === 2) objectivePreservationScore = Math.max(objectivePreservationScore, 0.95);
  if (objectives.known && objectives.controlled === 3) objectivePreservationScore = Math.max(objectivePreservationScore, 0.97);
  if (majorityActive && objectives.known && objectives.margin === 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.96);
  if (round >= 4 && objectives.opponentHomeRoleKnown) objectivePreservationScore = Math.max(objectivePreservationScore, objectives.opponentHomeControlled ? 0.98 : 0.82);
  if (round === 5) objectivePreservationScore = Math.max(objectivePreservationScore, 0.98);

  const countProgress = !objectives.known
    ? "Objective control is incomplete; confirm every controller before relying on Dominion thresholds."
    : `Objectives: ${objectives.controlled}-${objectives.opponentControlled}. ${threeObjectiveSatisfied ? "The 4 VP three-objective condition is currently met." : `Need ${Math.max(0, 3 - objectives.controlled)} more controlled objective${Math.max(0, 3 - objectives.controlled) === 1 ? "" : "s"} for the 4 VP end-of-turn condition.`}`;
  const commandProgress = round < 2
    ? "The 5 VP two-objective and 4 VP majority conditions are not active until Round 2."
    : !objectives.known
      ? "The Round 2+ threshold conditions cannot be calculated until objective control is complete."
      : `${twoObjectiveSatisfied ? "The 5 VP two-objective condition is met." : "The 5 VP two-objective condition is not met."} ${majoritySatisfied ? "The 4 VP objective-majority condition is met." : "The 4 VP objective-majority condition is not met."}`;
  const endgameProgress = !objectives.opponentHomeRoleKnown
    ? "The opponent's home objective is not identified from the saved battlefield roles, so the 5 VP end-of-battle condition remains player-confirmed."
    : objectives.opponentHomeControlled
      ? "The opponent's home objective is currently controlled; preserving it protects the 5 VP end-of-battle condition."
      : "The opponent's home objective is not currently controlled; access to it remains a 5 VP end-of-battle opportunity.";

  let reason;
  if (!objectives.known) {
    reason = "Confirm objective control first. Inescapable Dominion is driven by exact control-count thresholds and objective majority.";
  } else if (round === 5 && objectives.controlled < 2) {
    reason = "Round 5 resolves all round-scoring thresholds at end of turn. Reaching two objectives is the first critical breakpoint because it unlocks 5 VP and can also improve the majority condition.";
  } else if (round === 5 && objectives.controlled === 2) {
    reason = "You are on the two-objective breakpoint. A third objective is worth another 4 VP at end of turn and may also establish the 4 VP majority condition, making a reliable third capture especially valuable.";
  } else if (objectives.controlled < 2 && round >= 2) {
    reason = "You are below the two-objective breakpoint. Establishing a second durable objective is the highest-confidence Dominion need for the next applicable 5 VP checkpoint.";
  } else if (objectives.controlled === 2) {
    reason = "Two objectives cover the 5 VP threshold, but a third objective adds the 4 VP end-of-turn condition and often improves the objective-majority race.";
  } else if (majorityActive && !majoritySatisfied) {
    reason = "The two- and three-objective thresholds are more stable than the majority condition. Favor an objective swing that establishes a lead rather than low-value damage that leaves the count tied or behind.";
  } else if (round >= 4 && objectives.opponentHomeRoleKnown && !objectives.opponentHomeControlled) {
    reason = "Current round thresholds are favorable. Preserve them while developing a credible route to the opponent's home objective for the 5 VP end-of-battle condition.";
  } else {
    reason = "Recorded Dominion thresholds are favorable. Preserve the objective count and majority rather than abandoning scoring positions for damage that does not change control.";
  }

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Take and Hold",
    missionId: mission.id,
    missionName: mission.name,
    round,
    phase,
    turn: Number.isInteger(state?.turn) ? state.turn : 0,
    targetUnitId,
    objectiveStateKnown: objectives.known,
    controlledObjectives: objectives.controlled,
    controlledObjectiveIds: objectives.controlledIds,
    opponentControlledObjectives: objectives.opponentControlled,
    objectiveMargin: objectives.margin,
    twoObjectiveActive,
    twoObjectiveSatisfied,
    twoObjectiveVp,
    threeObjectiveSatisfied,
    threeObjectiveVp,
    majorityActive,
    majoritySatisfied,
    majorityVp,
    roundCheckpointTiming: round >= 5 ? "end-of-turn" : round >= 2 ? "split-command-and-end-turn" : "end-of-turn",
    opponentHomeRoleKnown: objectives.opponentHomeRoleKnown,
    opponentHomeControlled: objectives.opponentHomeControlled,
    opponentHomeObjectiveIds: objectives.opponentHomeObjectiveIds,
    endBattleVp,
    rawRecordedVp,
    cappedRecordedVp,
    nextKillVpLeverage: 0,
    targetingScore: 0.05,
    objectivePreservationScore,
    protectCheapUnits: false,
    summary: Object.freeze([
      timingSummary(round),
      countProgress,
      commandProgress,
      endgameProgress,
      `Recorded round conditions currently represent up to ${cappedRecordedVp}/15 Primary VP before timing and player confirmation${endBattleVp ? "; the opponent-home condition also currently represents 5 end-of-battle VP" : ""}.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Objective control comes from recorded tabletop confirmation; approximate map position does not determine control.",
      "In Rounds 2-4, movement after the Command-phase checkpoint cannot retroactively change that completed checkpoint; it can still change the 4 VP three-objective end-of-turn condition and prepare the next Command phase.",
      "In Round 5, all three round-scoring conditions resolve at end of turn and can be changed by same-turn movement.",
      "The opponent-home condition is tracked separately as an end-of-battle opportunity.",
      "Inescapable Dominion has no direct kill-scoring condition, so destroying a unit receives no automatic Primary VP premium.",
      "The 15 VP Primary cap is applied to the current-round outlook."
    ])
  });
}

export function getInescapableDominionObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const context = primaryStrategy ?? getInescapableDominionPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context?.active) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });

  const controlledNow = control === "controlled" || controlledBy(objective.control, playerId);
  const opponentHome = context.opponentHomeObjectiveIds.includes(objectiveId) || isOpponentHomeObjectiveForPlayer(state, objective, playerId, perspectivePlayerId);
  const opponentOwnsNow = objective?.control?.controlState === "controlled" && objective.control.controllerId != null && objective.control.controllerId !== playerId;
  const deltaIfTaken = controlledNow ? 0 : opponentOwnsNow ? 2 : 1;
  const controlledAfterTake = context.controlledObjectives + (controlledNow ? 0 : 1);
  const marginAfterTake = context.objectiveMargin + deltaIfTaken;

  let vpLeverage = 0;
  let score = 0.12;
  const notes = [];

  if (controlledNow) {
    if (context.controlledObjectives === 3) {
      vpLeverage += 4;
      score += 0.28;
      notes.push("Losing this objective would drop you below the three-objective threshold and cost the 4 VP end-of-turn condition.");
    } else if (context.controlledObjectives > 3) {
      score += 0.08;
      notes.push("This objective provides buffer above the three-objective threshold.");
    }
    if (context.round >= 2 && context.controlledObjectives === 2) {
      vpLeverage += 5;
      score += 0.3;
      notes.push("Losing this objective would drop you below the two-objective threshold for the 5 VP condition at the next applicable checkpoint.");
    }
    if (context.round >= 2 && context.objectiveMargin === 1) {
      vpLeverage += 4;
      score += 0.28;
      notes.push("Your objective lead is only one; losing this objective can cost the 4 VP majority condition.");
    }
  } else {
    if (context.controlledObjectives < 3 && controlledAfterTake >= 3) {
      vpLeverage += 4;
      score += 0.3;
      notes.push("Taking this objective reaches the three-objective threshold for the 4 VP end-of-turn condition.");
    }
    if (context.round >= 2 && context.controlledObjectives < 2 && controlledAfterTake >= 2) {
      vpLeverage += 5;
      score += 0.32;
      notes.push(context.round === 5
        ? "Taking this objective reaches the two-objective threshold for 5 VP at this turn's end-of-turn checkpoint."
        : "Taking this objective reaches the two-objective threshold for the next applicable 5 VP Command-phase checkpoint.");
    }
    if (context.round >= 2 && context.objectiveMargin <= 0 && marginAfterTake > 0) {
      vpLeverage += 4;
      score += 0.3;
      notes.push(context.round === 5
        ? "This swing can establish objective majority for 4 VP at the Round 5 end-of-turn checkpoint."
        : "This swing can establish objective majority for the next applicable 4 VP Command-phase checkpoint.");
    }
  }

  if (opponentHome) {
    vpLeverage += 5;
    score += context.round >= 4 ? 0.34 : 0.18;
    notes.push(controlledNow
      ? "This is the opponent's home objective; preserving it protects the 5 VP end-of-battle Dominion condition."
      : "This is the opponent's home objective and carries a separate 5 VP end-of-battle opportunity.");
  }

  if (context.round === 5) score += 0.12;
  if (notes.length === 0) notes.push("This objective contributes to Dominion count and majority buffer, but it does not currently cross a scoring breakpoint by itself.");

  return Object.freeze({
    active: true,
    missionName: context.missionName,
    objectiveId,
    controlledNow,
    opponentHome,
    opponentOwnsNow,
    controlledAfterTake,
    marginAfterTake,
    vpLeverage,
    score: clamp01(score),
    reason: notes.join(" ")
  });
}
