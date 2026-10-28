import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
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

export function isBattlefieldDominanceMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === "primary-battlefield-dominance";
}

function controlledBy(control, playerId) {
  return control?.controlState === "controlled" && control?.controllerId === playerId;
}

function objectiveSnapshot(state, playerId, perspectivePlayerId) {
  const all = Array.isArray(state?.objectives) ? state.objectives : [];
  const playerHomeObjectives = all.filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const homeRoleKnown = playerHomeObjectives.length > 0;
  const known = all.length > 0 && all.every((objective) => objective?.control != null);
  if (!known) {
    return Object.freeze({
      known: false,
      homeRoleKnown,
      controlled: 0,
      opponentControlled: 0,
      margin: 0,
      playerHomeControlled: null,
      playerHomeObjectiveIds: Object.freeze(playerHomeObjectives.map((objective) => objective.id)),
      nonHomeControlled: homeRoleKnown ? 0 : null,
      nonHomeControlledObjectiveIds: Object.freeze([])
    });
  }

  const controlled = all.filter((objective) => controlledBy(objective.control, playerId));
  const opponentControlled = all.filter((objective) =>
    objective?.control?.controlState === "controlled" &&
    objective.control.controllerId != null &&
    objective.control.controllerId !== playerId
  );
  const playerHomeControlled = homeRoleKnown
    ? playerHomeObjectives.some((objective) => controlledBy(objective.control, playerId))
    : null;
  const nonHomeControlled = homeRoleKnown
    ? controlled.filter((objective) => !isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId))
    : [];

  return Object.freeze({
    known: true,
    homeRoleKnown,
    controlled: controlled.length,
    opponentControlled: opponentControlled.length,
    margin: controlled.length - opponentControlled.length,
    playerHomeControlled,
    playerHomeObjectiveIds: Object.freeze(playerHomeObjectives.map((objective) => objective.id)),
    nonHomeControlled: homeRoleKnown ? nonHomeControlled.length : null,
    nonHomeControlledObjectiveIds: Object.freeze(nonHomeControlled.map((objective) => objective.id))
  });
}

function timingSummary(round) {
  if (round === 1) {
    return "Round 1: the only Battlefield Dominance scoring window is 2 VP for controlling more objectives than the opponent at end of your turn.";
  }
  if (round === 2) {
    return "Round 2 has two pressures: per-objective scoring at the end of your Command phase, plus the final 2 VP objective-majority check at end of your turn.";
  }
  if (round < 5) {
    return `Round ${round}: score controlled objectives at the end of your Command phase; the Round 1–2 majority check no longer applies.`;
  }
  return "Round 5: per-objective scoring moves to the end of your turn, so movement this turn can directly change the Primary score before the checkpoint.";
}

export function getBattlefieldDominancePrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isBattlefieldDominanceMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Battlefield Dominance strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const phase = String(state?.phase ?? "");
  const objectives = objectiveSnapshot(state, playerId, perspectivePlayerId);
  const majorityRelevant = round <= 2;
  const majoritySatisfied = majorityRelevant && objectives.known ? objectives.margin > 0 : majorityRelevant ? null : false;
  const majorityVp = majoritySatisfied ? 2 : 0;
  const objectiveScoringActive = round >= 2;
  const baseObjectiveVp = objectiveScoringActive && objectives.known ? objectives.controlled * 3 : 0;
  const homeBonusKnown = objectiveScoringActive && objectives.known && objectives.homeRoleKnown;
  const homeBonusObjectiveCount = homeBonusKnown && objectives.playerHomeControlled ? objectives.nonHomeControlled : 0;
  const homeBonusVp = homeBonusKnown ? homeBonusObjectiveCount * 2 : 0;
  const rawRecordedVp = majorityVp + baseObjectiveVp + homeBonusVp;
  const cappedRecordedVp = Math.min(15, rawRecordedVp);
  const homeRestoreVpLeverage = objectiveScoringActive && objectives.homeRoleKnown && objectives.playerHomeControlled === false
    ? 3 + (objectives.nonHomeControlled ?? 0) * 2
    : 0;

  let objectivePreservationScore = objectives.known ? 0.58 : 0.35;
  if (majorityRelevant && objectives.known && objectives.margin === 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.94);
  if (objectiveScoringActive && objectives.homeRoleKnown && objectives.playerHomeControlled === false) objectivePreservationScore = Math.max(objectivePreservationScore, 0.9);
  if (objectiveScoringActive && objectives.playerHomeControlled && (objectives.nonHomeControlled ?? 0) >= 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.92);
  if (round === 5) objectivePreservationScore = Math.max(objectivePreservationScore, 0.86);

  const objectiveProgress = !objectives.known
    ? "Objective control is incomplete; confirm every objective controller before relying on Battlefield Dominance scoring advice."
    : `Objectives: ${objectives.controlled}-${objectives.opponentControlled}. ${majorityRelevant ? (majoritySatisfied ? "The 2 VP majority condition is currently met." : "The 2 VP majority condition is not currently met.") : "Objective majority no longer scores by itself."}`;

  const homeProgress = !objectiveScoringActive
    ? "The home-objective multiplier begins with the Round 2 per-objective scoring window."
    : !objectives.homeRoleKnown
      ? "Your home objective is not identified from the saved battlefield roles, so the +2 VP non-home multiplier cannot be modeled automatically."
      : objectives.playerHomeControlled
        ? `Home objective controlled: each of your ${(objectives.nonHomeControlled ?? 0)} other controlled objective${objectives.nonHomeControlled === 1 ? "" : "s"} receives the cumulative +2 VP bonus at the applicable scoring checkpoint.`
        : `Home objective not controlled: restoring it is worth 3 VP for the home objective itself and would unlock +2 VP on each of your ${(objectives.nonHomeControlled ?? 0)} other controlled objective${objectives.nonHomeControlled === 1 ? "" : "s"}.`;

  const scoringProgress = objectiveScoringActive && objectives.known
    ? `Current control represents ${baseObjectiveVp} base objective VP${homeBonusKnown ? ` plus ${homeBonusVp} home-linked bonus VP` : " before any manually confirmed home-linked bonus"} at the applicable checkpoint, before the 15 VP round cap.`
    : round === 1
      ? "Per-objective VP is not active in Round 1."
      : "Current per-objective VP cannot be calculated until objective control is complete.";

  let reason;
  if (!objectives.known) {
    reason = "Confirm objective control first. Battlefield Dominance decisions depend almost entirely on the exact objective count and home-objective status.";
  } else if (objectiveScoringActive && !objectives.homeRoleKnown) {
    reason = "The home objective is not identified in the saved battlefield state. Confirm its role before relying on the +2 VP multiplier advice.";
  } else if (objectiveScoringActive && objectives.playerHomeControlled === false) {
    reason = `Recovering your home objective has unusually high leverage: ${homeRestoreVpLeverage} VP of current-position value before the round cap (${3} VP for the home objective plus the non-home multiplier).`;
  } else if (majorityRelevant && majoritySatisfied === false) {
    reason = round === 2
      ? "You do not currently hold the objective majority. A swing objective can still recover the 2 VP end-of-turn condition while also improving future per-objective scoring."
      : "Round 1 is primarily an objective-count race. Favor a reliable objective swing over low-value damage that does not change control.";
  } else if (round === 5) {
    reason = "Round 5 scores at end of turn. Favor reachable objective captures and denials now because they can convert directly into Primary VP this turn.";
  } else if (objectiveScoringActive && objectives.playerHomeControlled) {
    reason = "Your home multiplier is active. Preserve the home objective and favor durable non-home control: each such objective is effectively worth 5 VP at the applicable checkpoint before the round cap.";
  } else {
    reason = "The current Battlefield Dominance position is favorable. Preserve the objective count and avoid abandoning scoring positions for damage that does not improve control.";
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
    homeRoleKnown: objectives.homeRoleKnown,
    controlledObjectives: objectives.controlled,
    opponentControlledObjectives: objectives.opponentControlled,
    objectiveMargin: objectives.margin,
    majorityRelevant,
    majoritySatisfied,
    majorityVp,
    objectiveScoringActive,
    objectiveCheckpointTiming: round >= 5 ? "end-of-turn" : round >= 2 ? "end-of-command" : null,
    playerHomeControlled: objectives.playerHomeControlled,
    playerHomeObjectiveIds: objectives.playerHomeObjectiveIds,
    nonHomeControlled: objectives.nonHomeControlled,
    nonHomeControlledObjectiveIds: objectives.nonHomeControlledObjectiveIds,
    baseObjectiveVp,
    homeBonusObjectiveCount,
    homeBonusVp,
    homeRestoreVpLeverage,
    rawRecordedVp,
    cappedRecordedVp,
    nextKillVpLeverage: 0,
    targetingScore: 0.05,
    objectivePreservationScore,
    protectCheapUnits: false,
    summary: Object.freeze([
      timingSummary(round),
      objectiveProgress,
      homeProgress,
      scoringProgress,
      `Recorded current-position conditions represent up to ${cappedRecordedVp}/15 Primary VP for the round before timing and player confirmation.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Objective control comes from recorded tabletop confirmation; approximate map position does not determine control.",
      "Current control is an advisory snapshot. If a Command-phase checkpoint has already passed this turn, later control changes apply to the next applicable checkpoint instead.",
      "The +2 VP cumulative bonus is modeled only when your home objective can be identified from saved battlefield roles and is controlled.",
      "Battlefield Dominance has no direct kill-scoring condition, so destroying a unit receives no automatic Primary VP premium.",
      "The 15 VP Primary cap is applied to the current-round outlook."
    ])
  });
}

export function getBattlefieldDominanceObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const context = primaryStrategy ?? getBattlefieldDominancePrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context?.active) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });

  const controlledNow = control === "controlled" || controlledBy(objective.control, playerId);
  const ownHome = context.playerHomeObjectiveIds.includes(objectiveId);
  const round = context.round;
  let score = round >= 2 ? 0.12 : 0.07;
  let vpLeverage = 0;
  const notes = [];

  if (round >= 2) {
    if (ownHome) {
      const otherControlled = Math.max(0, context.controlledObjectives - (context.playerHomeControlled ? 1 : 0));
      const multiplierLeverage = context.homeRoleKnown ? otherControlled * 2 : 0;
      vpLeverage += 3 + multiplierLeverage;
      score += controlledNow ? (purpose === "hold-objective" ? 0.38 : 0.31) : 0.42;
      notes.push(controlledNow
        ? `Your home objective is the Battlefield Dominance multiplier: holding it preserves its 3 VP plus ${multiplierLeverage} VP of cumulative bonus on your other currently controlled objectives before the round cap.`
        : `Taking your home objective can add its 3 VP and unlock ${multiplierLeverage} VP of cumulative bonus on your other currently controlled objectives before the round cap.`);
    } else {
      const objectiveVp = context.homeRoleKnown && context.playerHomeControlled ? 5 : 3;
      vpLeverage += objectiveVp;
      score += controlledNow ? (purpose === "hold-objective" ? 0.24 : 0.17) : 0.27;
      notes.push(context.homeRoleKnown && context.playerHomeControlled
        ? `With your home objective controlled, this non-home objective is worth 5 VP at the applicable Battlefield Dominance checkpoint before the round cap.`
        : `This objective contributes 3 VP at the applicable checkpoint; it becomes 5 VP if your home objective is also controlled.`);
    }
  } else {
    notes.push("Round 1 has no per-objective VP; this objective matters through the end-of-turn majority check and Round 2 setup.");
  }

  if (round <= 2 && context.objectiveStateKnown) {
    if (controlledNow && context.objectiveMargin === 1) {
      vpLeverage += 2;
      score += 0.22;
      notes.push("Your objective lead is only one, so losing this objective can cost the 2 VP end-of-turn majority condition.");
    } else if (!controlledNow && context.objectiveMargin <= 0) {
      vpLeverage += 2;
      score += 0.22;
      notes.push("Taking or denying this objective can help establish the 2 VP end-of-turn objective-majority condition.");
    } else if (controlledNow && context.objectiveMargin > 1) {
      score += 0.05;
      notes.push("This objective also provides buffer for the Round 1–2 objective-majority check.");
    }
  }

  if (round === 5) {
    score += controlledNow ? 0.05 : 0.12;
    notes.push("Round 5 scores at end of turn, so a reachable capture here can affect Primary immediately rather than waiting through an opponent turn.");
  }

  return Object.freeze({
    active: true,
    score: clamp01(score),
    vpLeverage,
    ownHome,
    controlledNow,
    majorityRelevant: round <= 2,
    reason: notes.join(" ")
  });
}
