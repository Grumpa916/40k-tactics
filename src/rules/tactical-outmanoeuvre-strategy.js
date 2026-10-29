import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getRemainingPrimaryVictoryPoints } from "../engine/victory-points-ledger.js";
import {
  isOpponentHomeObjectiveForPlayer,
  isPlayerHomeObjective
} from "./consecrate-state.js";
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

export function isOutmanoeuvreMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === "primary-outmanoeuvre";
}

function controlledBy(control, playerId) {
  return control?.controlState === "controlled" && control?.controllerId === playerId;
}

function effectiveAwardEntries(state, playerId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const reversedIds = new Set(history
    .filter((event) => ["victory_points.award_undone", "victory_points.adjustment_undone"].includes(event?.type))
    .map((event) => event.payload?.originalAwardEventId)
    .filter((id) => id != null));
  const reversedIndices = new Set(history
    .filter((event) => ["victory_points.award_undone", "victory_points.adjustment_undone"].includes(event?.type))
    .map((event) => event.payload?.originalAwardEventIndex)
    .filter((index) => Number.isInteger(index)));

  return history
    .map((event, index) => ({ event, index }))
    .filter(({ event, index }) => event?.type === "victory_points.awarded" &&
      !reversedIndices.has(index) && (!event.id || !reversedIds.has(event.id)))
    .filter(({ event }) => event.payload?.playerId === playerId)
    .map(({ event }) => ({ eventId: event.id ?? null, ...event.payload }));
}

function objectiveSnapshot(state, playerId, perspectivePlayerId) {
  const all = Array.isArray(state?.objectives) ? state.objectives : [];
  const playerHome = all.filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const opponentHome = all.filter((objective) => isOpponentHomeObjectiveForPlayer(state, objective, playerId, perspectivePlayerId));
  const playerHomeObjectiveIds = Object.freeze(playerHome.map((objective) => objective.id));
  const opponentHomeObjectiveIds = Object.freeze(opponentHome.map((objective) => objective.id));
  const playerHomeRoleKnown = playerHome.length > 0;
  const opponentHomeRoleKnown = opponentHome.length > 0;
  const known = all.length > 0 && playerHomeRoleKnown && all.every((objective) => objective?.control != null);
  const opponentHomeControlKnown = opponentHomeRoleKnown && opponentHome.every((objective) => objective?.control != null);
  const opponentHomeControlled = opponentHomeControlKnown
    ? opponentHome.some((objective) => controlledBy(objective.control, playerId))
    : null;

  if (!known) {
    return Object.freeze({
      known: false,
      playerHomeRoleKnown,
      opponentHomeRoleKnown,
      playerHomeObjectiveIds,
      opponentHomeObjectiveIds,
      controlled: 0,
      controlledIds: Object.freeze([]),
      nonHomeControlled: 0,
      nonHomeControlledIds: Object.freeze([]),
      opponentHomeControlled
    });
  }

  const controlled = all.filter((objective) => controlledBy(objective.control, playerId));
  const nonHomeControlled = controlled.filter((objective) => !playerHomeObjectiveIds.includes(objective.id));
  return Object.freeze({
    known: true,
    playerHomeRoleKnown,
    opponentHomeRoleKnown,
    playerHomeObjectiveIds,
    opponentHomeObjectiveIds,
    controlled: controlled.length,
    controlledIds: Object.freeze(controlled.map((objective) => objective.id)),
    nonHomeControlled: nonHomeControlled.length,
    nonHomeControlledIds: Object.freeze(nonHomeControlled.map((objective) => objective.id)),
    opponentHomeControlled
  });
}

function nonHomeVpEach(round) {
  if (round <= 1) return 4;
  if (round <= 3) return 5;
  return 6;
}

function nonHomeCheckpointTiming(round) {
  return round >= 2 && round <= 3 ? "end-of-command" : "end-of-turn";
}

function commandCheckpointCompleted(round, phase) {
  return round >= 2 && round <= 3 && String(phase ?? "") !== "command";
}

function timingSummary(round) {
  if (round === 1) {
    return "Round 1: each controlled non-home objective is worth 4 VP at end of turn, and the opponent's home objective is worth an additional 10 VP at end of turn.";
  }
  if (round <= 3) {
    return `Round ${round}: each controlled non-home objective is worth 5 VP in the Command phase; the opponent's home objective remains worth 10 VP at end of turn.`;
  }
  return `Round ${round}: each controlled non-home objective is worth 6 VP at end of turn, and the opponent's home objective is worth an additional 10 VP at end of turn.`;
}

function currentTurnMissionAwards(state, playerId, missionId, round, turn) {
  return effectiveAwardEntries(state, playerId).filter((entry) =>
    entry.category === "primary" &&
    entry.missionDefinitionId === missionId &&
    entry.round === round &&
    entry.turn === turn
  );
}

function commandAwardAmountForTurn(entries) {
  const explicit = entries.filter((entry) =>
    entry.scoringTiming === "command-phase" ||
    (typeof entry.opportunityKey === "string" && entry.opportunityKey.endsWith(":command-phase"))
  );
  const candidates = explicit.length > 0
    ? explicit
    : entries.filter((entry) => !["end-of-turn", "end-of-battle"].includes(entry.scoringTiming));
  return candidates.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
}

function projectedMissionPrimaryVp(rawMissionVp, actualMissionVpThisTurn, additionalPrimaryAllowance) {
  const raw = Math.max(0, Number(rawMissionVp) || 0);
  const actual = Math.max(0, Number(actualMissionVpThisTurn) || 0);
  const allowance = Math.max(0, Number(additionalPrimaryAllowance) || 0);
  const desired = Math.max(actual, Math.min(15, raw));
  return actual + Math.min(Math.max(0, desired - actual), allowance);
}

function primaryGameRemaining(state, playerId) {
  const used = effectiveAwardEntries(state, playerId)
    .filter((entry) => entry.category === "primary")
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  return Math.max(0, 45 - used);
}

function rawRoundVpForSnapshot(context, { nonHomeControlled, opponentHomeControlled }) {
  const nonHomeVp = context.commandCheckpointCompleted
    ? context.commandAwardAmount
    : Math.max(0, nonHomeControlled) * context.nonHomeVpEach;
  const opponentHomeVp = opponentHomeControlled ? 10 : 0;
  return nonHomeVp + opponentHomeVp;
}

function projectedRoundVpForSnapshot(context, snapshot) {
  return projectedMissionPrimaryVp(
    rawRoundVpForSnapshot(context, snapshot),
    context.actualMissionVpThisTurn,
    context.additionalPrimaryAllowance
  );
}

export function getOutmanoeuvrePrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isOutmanoeuvreMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Outmanoeuvre strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const phase = state?.phase ?? null;
  const objectives = objectiveSnapshot(state, playerId, perspectivePlayerId);
  const perObjectiveVp = nonHomeVpEach(round);
  const checkpointTiming = nonHomeCheckpointTiming(round);
  const checkpointCompleted = commandCheckpointCompleted(round, phase);
  const awardsThisTurn = currentTurnMissionAwards(state, playerId, mission.id, round, turn);
  const actualMissionVpThisTurn = awardsThisTurn.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const commandAwardAmount = round >= 2 && round <= 3 ? commandAwardAmountForTurn(awardsThisTurn) : 0;
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const remainingPrimaryGameVp = primaryGameRemaining(state, playerId);

  const liveNonHomeVp = objectives.known ? objectives.nonHomeControlled * perObjectiveVp : 0;
  const nonHomeVpForRoundCap = !objectives.known
    ? 0
    : checkpointCompleted
      ? commandAwardAmount
      : liveNonHomeVp;
  const opponentHomeVp = objectives.known && objectives.opponentHomeControlled === true ? 10 : 0;
  const rawRecordedVp = nonHomeVpForRoundCap + opponentHomeVp;
  const cappedRecordedVp = projectedMissionPrimaryVp(rawRecordedVp, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const nominalRoundVp = Math.min(15, rawRecordedVp);
  const remainingRoundCap = Math.max(0, 15 - nominalRoundVp);
  const maximumProjectedVp = projectedMissionPrimaryVp(15, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const remainingPrimaryVp = Math.max(0, maximumProjectedVp - cappedRecordedVp);

  let objectivePreservationScore = objectives.known ? 0.6 : 0.34;
  if (objectives.known && objectives.nonHomeControlled > 0) objectivePreservationScore = Math.max(objectivePreservationScore, 0.82);
  if (objectives.opponentHomeControlled === true) objectivePreservationScore = Math.max(objectivePreservationScore, 0.99);
  if (round >= 4 && objectives.known && objectives.nonHomeControlled > 0) objectivePreservationScore = Math.max(objectivePreservationScore, 0.94);
  if (remainingPrimaryGameVp === 0) objectivePreservationScore = Math.min(objectivePreservationScore, 0.2);

  const controlProgress = !objectives.known
    ? "Objective scoring evidence is incomplete; confirm the player's home-objective role and every controller before relying on Outmanoeuvre's per-objective totals or cap headroom."
    : checkpointCompleted
      ? `${objectives.nonHomeControlled} non-home objective${objectives.nonHomeControlled === 1 ? " is" : "s are"} controlled now, but the Round ${round} 5 VP-per-objective Command checkpoint has already passed. ${commandAwardAmount} VP from that completed checkpoint is currently recorded for cap projection.`
      : `${objectives.nonHomeControlled} non-home objective${objectives.nonHomeControlled === 1 ? " is" : "s are"} controlled, representing ${liveNonHomeVp} raw VP at the ${checkpointTiming === "end-of-command" ? "Command" : "end-of-turn"} checkpoint before Primary caps.`;
  const homeProgress = !objectives.opponentHomeRoleKnown
    ? "The opponent's home objective is not identified from the saved battlefield roles; its 10 VP end-of-turn condition remains player-confirmed."
    : objectives.opponentHomeControlled === true
      ? "The opponent's home objective is currently controlled, adding a 10 VP end-of-turn Outmanoeuvre condition before Primary caps."
      : "The opponent's home objective is not currently controlled; taking it is a 10 VP end-of-turn opportunity before Primary caps.";

  let reason;
  if (!objectives.known) {
    reason = "Confirm home-objective roles and objective control first. Outmanoeuvre depends on knowing which objective is excluded from non-home scoring before exact VP or cap leverage can be projected.";
  } else if (remainingPrimaryGameVp === 0) {
    reason = "The 45 VP Primary game cap is already filled, so Outmanoeuvre should no longer distort movement or target priorities for additional Primary scoring.";
  } else if (objectives.opponentHomeRoleKnown && objectives.opponentHomeControlled !== true) {
    reason = round >= 2 && round <= 3 && checkpointCompleted
      ? "The current Command checkpoint has passed, but the opponent's home objective can still add up to 10 VP at end of turn and also establishes a high-value non-home position for the next applicable checkpoint."
      : "The opponent's home objective is Outmanoeuvre's highest-value single location: it carries the 10 VP end-of-turn condition and also counts as a non-home objective for the applicable per-objective condition.";
  } else if (checkpointCompleted) {
    const nextValue = round === 2 ? 5 : 6;
    const nextTiming = round === 2 ? "Round 3 Command phase" : "Round 4 end of turn";
    reason = `The Round ${round} Command checkpoint is complete. Preserve useful non-home positions and stage durable control for the ${nextTiming}, when each non-home objective is worth ${nextValue} VP before caps.`;
  } else if (round >= 4) {
    reason = "Every non-home objective is worth 6 VP at end of turn. Prioritize reliable same-turn control swings, while recognizing that two strong objectives or the opponent-home bonus can quickly fill the 15 VP round cap.";
  } else {
    reason = "Outmanoeuvre rewards board reach over damage. Preserve controlled non-home objectives and favor reliable objective swings that increase the current scoring total before the Primary caps.";
  }

  const capSummary = remainingPrimaryGameVp === 0
    ? "The 45 VP Primary game cap is exhausted; no additional Outmanoeuvre VP can be added."
    : remainingPrimaryVp === 0
      ? "The current Outmanoeuvre outlook has no additional same-turn Primary headroom after recorded awards and the 15 VP round cap."
      : `${remainingPrimaryVp} additional same-turn Primary VP remain available in the current capped Outmanoeuvre projection.`;

  const context = {
    active: true,
    supported: true,
    disposition: "Disruption",
    missionId: mission.id,
    missionName: mission.name,
    round,
    phase,
    turn,
    targetUnitId,
    objectiveStateKnown: objectives.known,
    playerHomeRoleKnown: objectives.playerHomeRoleKnown,
    playerHomeObjectiveIds: objectives.playerHomeObjectiveIds,
    opponentHomeRoleKnown: objectives.opponentHomeRoleKnown,
    opponentHomeObjectiveIds: objectives.opponentHomeObjectiveIds,
    opponentHomeControlled: objectives.opponentHomeControlled,
    controlledObjectives: objectives.controlled,
    controlledObjectiveIds: objectives.controlledIds,
    nonHomeControlled: objectives.nonHomeControlled,
    nonHomeControlledIds: objectives.nonHomeControlledIds,
    nonHomeVpEach: perObjectiveVp,
    nonHomeCheckpointTiming: checkpointTiming,
    commandCheckpointCompleted: checkpointCompleted,
    commandAwardAmount,
    liveNonHomeVp,
    nonHomeVpForRoundCap,
    opponentHomeVp,
    actualMissionVpThisTurn,
    additionalPrimaryAllowance,
    remainingPrimaryGameVp,
    rawRecordedVp,
    nominalRoundVp,
    cappedRecordedVp,
    remainingRoundCap,
    remainingPrimaryVp,
    nextKillVpLeverage: 0,
    targetingScore: 0.05,
    objectivePreservationScore,
    protectCheapUnits: false,
    summary: Object.freeze([
      timingSummary(round),
      controlProgress,
      homeProgress,
      `Current Outmanoeuvre conditions project ${cappedRecordedVp}/15 Primary VP for this turn after recorded awards and caps. ${capSummary}`
    ]),
    reason,
    assumptions: Object.freeze([
      "Objective control comes from recorded tabletop confirmation; approximate map position does not determine control.",
      "The opponent's home objective is also a non-home objective for Outmanoeuvre, so it can satisfy both the 10 VP home condition and the applicable per-objective condition before caps.",
      "In Rounds 2-3, the per-objective condition resolves in the Command phase. Movement after that checkpoint cannot retroactively earn those VP this turn.",
      "In Round 1 and Rounds 4-5, the per-objective condition resolves at end of turn and can be changed by same-turn movement.",
      "Outmanoeuvre has no direct kill-scoring condition, so destroying a unit receives no automatic Primary VP premium.",
      "Both the 15 VP round cap and 45 VP Primary game cap are applied to same-turn scoring leverage."
    ])
  };
  return Object.freeze(context);
}

export function getOutmanoeuvreObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const context = primaryStrategy ?? getOutmanoeuvrePrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context?.active) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });

  const ownHome = context.playerHomeObjectiveIds.includes(objectiveId) || isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId);
  const opponentHome = context.opponentHomeObjectiveIds.includes(objectiveId) || isOpponentHomeObjectiveForPlayer(state, objective, playerId, perspectivePlayerId);
  const nonHome = context.playerHomeRoleKnown ? !ownHome : false;
  const controlledNow = control === "controlled" || controlledBy(objective.control, playerId);
  const sameTurnNonHomeActive = !context.commandCheckpointCompleted;
  const futureCheckpointVp = context.commandCheckpointCompleted
    ? context.round === 2 ? 5 : context.round === 3 ? 6 : 0
    : 0;
  const nextCheckpointTiming = context.commandCheckpointCompleted
    ? context.round === 2 ? "Round 3 Command phase" : context.round === 3 ? "Round 4 end of turn" : null
    : null;

  if (ownHome) {
    return Object.freeze({
      active: true,
      ownHome: true,
      opponentHome: false,
      nonHome: false,
      controlledNow,
      purpose,
      rawVpLeverage: 0,
      vpLeverage: 0,
      preservationVpLeverage: 0,
      stagingVpLeverage: 0,
      nextCheckpointSetup: false,
      score: 0.04,
      reason: "Your home objective does not satisfy either Outmanoeuvre scoring condition, so it receives no mission-specific Primary premium."
    });
  }

  const rawPotential = (opponentHome ? 10 : 0) + (sameTurnNonHomeActive && nonHome ? context.nonHomeVpEach : 0);
  if (!context.objectiveStateKnown) {
    const potentialStage = context.commandCheckpointCompleted && nonHome
      ? Math.min(futureCheckpointVp, context.remainingPrimaryGameVp)
      : 0;
    return Object.freeze({
      active: true,
      ownHome: false,
      opponentHome,
      nonHome,
      controlledNow,
      purpose,
      rawVpLeverage: rawPotential,
      vpLeverage: 0,
      preservationVpLeverage: 0,
      stagingVpLeverage: potentialStage,
      nextCheckpointSetup: potentialStage > 0,
      nextCheckpointTiming,
      score: context.remainingPrimaryGameVp === 0 ? 0.03 : opponentHome ? 0.48 : potentialStage > 0 ? 0.2 : 0.12,
      reason: `Objective scoring evidence is incomplete, so exact Outmanoeuvre cap leverage for this objective remains player-confirmed${opponentHome ? "; it is still the opponent's home objective and carries the 10 VP end-of-turn condition" : ""}.`
    });
  }

  const baseSnapshot = {
    nonHomeControlled: context.nonHomeControlled,
    opponentHomeControlled: context.opponentHomeControlled === true
  };
  const captureSnapshot = {
    nonHomeControlled: context.nonHomeControlled + (!controlledNow && nonHome && sameTurnNonHomeActive ? 1 : 0),
    opponentHomeControlled: context.opponentHomeControlled === true || (opponentHome && !controlledNow)
  };
  const lossSnapshot = {
    nonHomeControlled: Math.max(0, context.nonHomeControlled - (controlledNow && nonHome && sameTurnNonHomeActive ? 1 : 0)),
    opponentHomeControlled: context.opponentHomeControlled === true && !(opponentHome && controlledNow)
  };

  const baseProjected = projectedRoundVpForSnapshot(context, baseSnapshot);
  const captureProjected = projectedRoundVpForSnapshot(context, captureSnapshot);
  const lossProjected = projectedRoundVpForSnapshot(context, lossSnapshot);
  const directCaptureLeverage = controlledNow ? 0 : Math.max(0, captureProjected - baseProjected);
  const directPreservationLeverage = controlledNow ? Math.max(0, baseProjected - lossProjected) : 0;
  const stagingRelevant = context.commandCheckpointCompleted && nonHome && context.remainingPrimaryGameVp > 0;
  const stagingVpLeverage = stagingRelevant
    ? Math.min(futureCheckpointVp, context.remainingPrimaryGameVp)
    : 0;
  const nextCheckpointSetup = stagingRelevant && !controlledNow;
  const nextCheckpointPreservation = stagingRelevant && controlledNow;
  const vpLeverage = controlledNow ? directPreservationLeverage : directCaptureLeverage;

  let score = 0.04;
  if (vpLeverage > 0) score = Math.max(score, 0.18 + 0.74 * clamp01(vpLeverage / 15));
  if (stagingVpLeverage > 0) score = Math.max(score, 0.16 + 0.34 * clamp01(stagingVpLeverage / 6));
  if (opponentHome && context.remainingPrimaryGameVp > 0) score = Math.max(score, controlledNow ? 0.88 : 0.82);
  if (context.remainingPrimaryGameVp === 0) score = Math.min(score, 0.05);

  let reason;
  if (context.remainingPrimaryGameVp === 0) {
    reason = "The 45 VP Primary game cap is already filled, so this objective has no additional Outmanoeuvre scoring premium.";
  } else if (opponentHome && controlledNow) {
    reason = directPreservationLeverage > 0
      ? `Preserve the opponent's home objective: losing it can remove ${directPreservationLeverage} same-turn Primary VP after caps, and it remains a non-home scoring position.`
      : `Preserve the opponent's home objective as Outmanoeuvre's highest-value position; current caps suppress extra same-turn VP, but it remains strategically important${nextCheckpointPreservation ? ` for the ${nextCheckpointTiming}` : ""}.`;
  } else if (opponentHome) {
    reason = directCaptureLeverage > 0
      ? `Taking the opponent's home objective can add ${directCaptureLeverage} same-turn Primary VP after caps; it carries the 10 VP end-of-turn condition${sameTurnNonHomeActive ? ` plus the ${context.nonHomeVpEach} VP non-home condition` : ""}.`
      : `The opponent's home objective is the key Outmanoeuvre target, but current caps leave no additional same-turn VP; taking it can still stage the next applicable non-home checkpoint.`;
  } else if (directPreservationLeverage > 0) {
    reason = `Preserve this non-home objective: losing it can remove ${directPreservationLeverage} same-turn Outmanoeuvre VP after caps.`;
  } else if (directCaptureLeverage > 0) {
    reason = `Taking this non-home objective can add ${directCaptureLeverage} same-turn Outmanoeuvre VP after the current Primary caps.`;
  } else if (nextCheckpointSetup) {
    reason = `The current Command checkpoint has already passed. Taking this non-home objective cannot score retroactively, but it stages up to ${stagingVpLeverage} VP for the ${nextCheckpointTiming} if control is preserved.`;
  } else if (nextCheckpointPreservation) {
    reason = `The current Command checkpoint has already passed. Holding this non-home objective protects a position worth up to ${stagingVpLeverage} VP at the ${nextCheckpointTiming} if control is preserved.`;
  } else {
    reason = "This objective does not currently change Outmanoeuvre scoring after the applicable Primary caps.";
  }

  return Object.freeze({
    active: true,
    ownHome: false,
    opponentHome,
    nonHome,
    controlledNow,
    purpose,
    rawVpLeverage: rawPotential,
    vpLeverage,
    captureVpLeverage: directCaptureLeverage,
    preservationVpLeverage: directPreservationLeverage,
    stagingVpLeverage,
    nextCheckpointSetup,
    nextCheckpointPreservation,
    nextCheckpointTiming,
    baseProjectedVp: baseProjected,
    captureProjectedVp: captureProjected,
    lossProjectedVp: lossProjected,
    score: clamp01(score),
    reason
  });
}