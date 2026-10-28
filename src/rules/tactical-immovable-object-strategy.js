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

export function isImmovableObjectMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === "primary-immovable-object";
}

function controlledBy(control, playerId) {
  return control?.controlState === "controlled" && control?.controllerId === playerId;
}

function objectiveName(objective) {
  return String(objective?.layoutObjective ?? objective?.name ?? objective?.id ?? "");
}

function isCentralObjective(objective) {
  return /cent(er|ral)/i.test(objectiveName(objective));
}

function objectiveSnapshot(state, playerId, perspectivePlayerId) {
  const all = Array.isArray(state?.objectives) ? state.objectives : [];
  const known = all.length > 0 && all.every((objective) => objective?.control != null);
  const homeObjectives = all.filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const homeRoleKnown = homeObjectives.length > 0;
  const centralObjectives = all.filter(isCentralObjective);
  const centralRoleKnown = centralObjectives.length > 0;

  if (!known) {
    return Object.freeze({
      known: false,
      homeRoleKnown,
      centralRoleKnown,
      controlled: 0,
      nonHomeControlled: null,
      nonHomeControlledIds: Object.freeze([]),
      playerHomeObjectiveIds: Object.freeze(homeObjectives.map((objective) => objective.id)),
      centralObjectiveIds: Object.freeze(centralObjectives.map((objective) => objective.id)),
      centralControlled: null,
      centralControlledIds: Object.freeze([])
    });
  }

  const controlled = all.filter((objective) => controlledBy(objective.control, playerId));
  const nonHomeControlled = homeRoleKnown
    ? controlled.filter((objective) => !isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId))
    : [];
  const centralControlled = centralObjectives.filter((objective) => controlledBy(objective.control, playerId));

  return Object.freeze({
    known: true,
    homeRoleKnown,
    centralRoleKnown,
    controlled: controlled.length,
    nonHomeControlled: homeRoleKnown ? nonHomeControlled.length : null,
    nonHomeControlledIds: Object.freeze(nonHomeControlled.map((objective) => objective.id)),
    playerHomeObjectiveIds: Object.freeze(homeObjectives.map((objective) => objective.id)),
    centralObjectiveIds: Object.freeze(centralObjectives.map((objective) => objective.id)),
    centralControlled: centralRoleKnown ? centralControlled.length : null,
    centralControlledIds: Object.freeze(centralControlled.map((objective) => objective.id))
  });
}

function timingSummary(round) {
  if (round === 1) {
    return "Round 1: score 3 VP at end of turn if you control at least one central objective. The 5 VP per non-home objective condition begins in Round 2.";
  }
  if (round < 5) {
    return `Round ${round}: non-home objectives score 5 VP each at the end of your Command phase; controlling at least one central objective can still add 3 VP at end of turn.`;
  }
  return "Round 5: both scoring components resolve at end of turn, so movement can directly change the 5 VP non-home scoring and the 3 VP central-objective condition this turn.";
}

export function getImmovableObjectPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isImmovableObjectMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Immovable Object strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const phase = String(state?.phase ?? "");
  const objectives = objectiveSnapshot(state, playerId, perspectivePlayerId);
  const nonHomeScoringActive = round >= 2;
  const nonHomeVp = nonHomeScoringActive && objectives.known && objectives.homeRoleKnown
    ? (objectives.nonHomeControlled ?? 0) * 5
    : 0;
  const centralConditionSatisfied = objectives.known && objectives.centralRoleKnown
    ? (objectives.centralControlled ?? 0) > 0
    : null;
  const centralVp = centralConditionSatisfied ? 3 : 0;
  const rawRecordedVp = nonHomeVp + centralVp;
  const cappedRecordedVp = Math.min(15, rawRecordedVp);

  let objectivePreservationScore = objectives.known ? 0.6 : 0.34;
  if (centralConditionSatisfied && objectives.centralControlled === 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.92);
  if (centralConditionSatisfied === false) objectivePreservationScore = Math.max(objectivePreservationScore, 0.9);
  if (nonHomeScoringActive && (objectives.nonHomeControlled ?? 0) >= 2) objectivePreservationScore = Math.max(objectivePreservationScore, 0.88);
  if (round === 5) objectivePreservationScore = Math.max(objectivePreservationScore, 0.94);

  const centralProgress = !objectives.centralRoleKnown
    ? "Central objectives are not identified in the saved battlefield state, so the 3 VP end-of-turn condition cannot be modeled automatically."
    : !objectives.known
      ? "Central objective control is not fully recorded. Confirm tabletop control before relying on the 3 VP condition."
      : centralConditionSatisfied
        ? `You control ${objectives.centralControlled} central objective${objectives.centralControlled === 1 ? "" : "s"}; the 3 VP end-of-turn central condition is currently satisfied.`
        : "You control no central objectives; securing either central objective can establish the 3 VP end-of-turn condition.";

  const nonHomeProgress = !nonHomeScoringActive
    ? "The 5 VP per non-home objective scoring condition begins in Round 2."
    : !objectives.homeRoleKnown
      ? "Your home objective is not identified from saved battlefield roles, so non-home objective count cannot be modeled automatically."
      : !objectives.known
        ? "Non-home objective control is incomplete; confirm controllers before relying on the 5 VP calculation."
        : `You currently control ${objectives.nonHomeControlled} objective${objectives.nonHomeControlled === 1 ? "" : "s"} other than your home objective, representing ${nonHomeVp} VP at the applicable checkpoint before the round cap.`;

  let reason;
  if (!objectives.known) {
    reason = "Confirm objective control first. Immovable Object depends on exact central and non-home objective control.";
  } else if (!objectives.centralRoleKnown) {
    reason = "Central objectives are not identified in the saved battlefield state. Confirm them before relying on central-objective advice.";
  } else if (centralConditionSatisfied === false) {
    reason = round === 5
      ? "Secure a central non-home objective if practical: in Round 5 it can contribute 5 VP as a non-home objective and establish the separate 3 VP central condition at the same end-of-turn checkpoint, before the 15 VP cap."
      : "A central objective is the immediate scoring pressure: controlling at least one at end of turn is worth 3 VP, while non-home control also sets up the next applicable 5 VP checkpoint.";
  } else if (round === 1) {
    reason = "Protect at least one central objective through end of turn for 3 VP, while using other non-home positions to prepare for Round 2 scoring.";
  } else if (round < 5) {
    reason = "Protect the central condition through end of turn and preserve durable non-home control for the next Command-phase checkpoint. Your home objective has no direct Immovable Object VP value.";
  } else {
    reason = "Round 5 converts current movement directly into scoring. Prioritize non-home objectives, especially a central objective if the 3 VP central condition is not already secure.";
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
    centralRoleKnown: objectives.centralRoleKnown,
    playerHomeObjectiveIds: objectives.playerHomeObjectiveIds,
    centralObjectiveIds: objectives.centralObjectiveIds,
    centralControlledObjectiveIds: objectives.centralControlledIds,
    centralControlled: objectives.centralControlled,
    centralConditionSatisfied,
    centralVp,
    nonHomeScoringActive,
    nonHomeCheckpointTiming: round >= 5 ? "end-of-turn" : round >= 2 ? "end-of-command" : null,
    nonHomeControlled: objectives.nonHomeControlled,
    nonHomeControlledObjectiveIds: objectives.nonHomeControlledIds,
    nonHomeVp,
    rawRecordedVp,
    cappedRecordedVp,
    nextKillVpLeverage: 0,
    targetingScore: 0.05,
    objectivePreservationScore,
    protectCheapUnits: false,
    summary: Object.freeze([
      timingSummary(round),
      centralProgress,
      nonHomeProgress,
      `Recorded current-position conditions represent up to ${cappedRecordedVp}/15 Primary VP for the round before timing and player confirmation.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Objective control comes from recorded tabletop confirmation; approximate map position does not determine control.",
      "The 3 VP central-objective condition is scored once per turn, not once per central objective.",
      "The 5 VP condition excludes your home objective.",
      "In Rounds 2–4, movement after the Command phase changes future non-home scoring rather than retroactively changing a completed Command-phase checkpoint.",
      "Immovable Object has no direct kill-scoring condition, so destroying a unit receives no automatic Primary VP premium.",
      "The 15 VP Primary cap is applied to the current-round outlook."
    ])
  });
}

export function getImmovableObjectObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const context = primaryStrategy ?? getImmovableObjectPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context?.active) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });

  const controlledNow = control === "controlled" || controlledBy(objective.control, playerId);
  const ownHome = context.playerHomeObjectiveIds.includes(objectiveId);
  const central = context.centralObjectiveIds.includes(objectiveId);
  const round = context.round;
  let score = 0.04;
  let vpLeverage = 0;
  const notes = [];

  if (ownHome) {
    notes.push("Your home objective is excluded from the 5 VP Immovable Object objective scoring and has no direct Primary VP value from this mission.");
  } else if (round >= 2) {
    vpLeverage += 5;
    score += controlledNow ? (purpose === "hold-objective" ? 0.28 : 0.2) : 0.33;
    notes.push(round === 5
      ? "This non-home objective is worth 5 VP at the Round 5 end-of-turn checkpoint before the round cap."
      : "This non-home objective is worth 5 VP at the applicable Command-phase checkpoint; movement now protects or prepares that scoring position rather than rewriting a checkpoint that already passed.");
  } else {
    score += 0.11;
    notes.push("This non-home objective does not score 5 VP in Round 1, but controlling it can prepare the Round 2 Command-phase position.");
  }

  if (central) {
    const centralCount = Number(context.centralControlled) || 0;
    const isControlledCentral = context.centralControlledObjectiveIds.includes(objectiveId);
    const soleCentral = isControlledCentral && centralCount === 1;
    const canEstablishCentralCondition = !controlledNow && centralCount === 0;
    if (soleCentral || canEstablishCentralCondition) {
      vpLeverage += 3;
      score += 0.34;
      notes.push(soleCentral
        ? "This is your only controlled central objective, so losing it can cost the separate 3 VP end-of-turn central condition."
        : "Taking this objective can establish the separate 3 VP end-of-turn central condition.");
    } else if (centralCount > 0) {
      score += 0.08;
      notes.push("The 3 VP central condition is already supported by another controlled central objective, so this objective does not add a second 3 VP award.");
    }
  }

  if (round === 5 && central && !ownHome) {
    score += 0.08;
    notes.push("Round 5 resolves both Immovable Object scoring components at end of turn, increasing the immediate value of a central non-home objective.");
  }

  if (controlledNow && purpose === "hold-objective") score += 0.06;
  if (!controlledNow && purpose === "contest-objective") score += 0.05;

  return Object.freeze({
    active: true,
    missionName: context.missionName,
    objectiveId,
    ownHome,
    central,
    controlledNow,
    vpLeverage,
    score: clamp01(score),
    reason: notes.join(" "),
    assumptions: context.assumptions
  });
}
