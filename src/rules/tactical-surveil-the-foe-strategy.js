import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getRemainingPrimaryVictoryPoints } from "../engine/victory-points-ledger.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getSurveilTheFoeState, isSurveilTheFoeMissionForPlayer } from "./surveil-the-foe-state.js";
import { clamp01 } from "./tactical-context-utils.js";

const MISSION_ID = "primary-surveil-the-foe";

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

function currentTurnMissionAwards(state, playerId, round, turn) {
  return effectiveAwardEntries(state, playerId).filter((entry) =>
    entry.category === "primary" &&
    entry.missionDefinitionId === MISSION_ID &&
    entry.round === round &&
    entry.turn === turn
  );
}

function commandAwardAmountForTurn(entries) {
  return entries.filter((entry) =>
    entry.scoringTiming === "command-phase" ||
    (typeof entry.opportunityKey === "string" && entry.opportunityKey.endsWith(":command-phase"))
  ).reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
}

function primaryGameRemaining(state, playerId) {
  const used = effectiveAwardEntries(state, playerId)
    .filter((entry) => entry.category === "primary")
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  return Math.max(0, 45 - used);
}

function projectedMissionPrimaryVp(rawMissionVp, actualMissionVpThisTurn, additionalPrimaryAllowance) {
  const raw = Math.max(0, Number(rawMissionVp) || 0);
  const actual = Math.max(0, Number(actualMissionVpThisTurn) || 0);
  const allowance = Math.max(0, Number(additionalPrimaryAllowance) || 0);
  const desired = Math.max(actual, Math.min(15, raw));
  return actual + Math.min(Math.max(0, desired - actual), allowance);
}

function controlledBy(control, playerId) {
  return control?.controlState === "controlled" && control?.controllerId === playerId;
}

function objectiveSnapshot(state, playerId, perspectivePlayerId) {
  const all = Array.isArray(state?.objectives) ? state.objectives : [];
  const home = all.filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const homeObjectiveIds = Object.freeze(home.map((objective) => objective.id));
  const homeRoleKnown = home.length > 0;
  const known = all.length > 0 && homeRoleKnown && all.every((objective) => objective?.control != null);
  if (!known) {
    return Object.freeze({
      known: false,
      homeRoleKnown,
      homeObjectiveIds,
      ownControlled: 0,
      opponentControlled: 0,
      nonHomeControlled: 0,
      nonHomeControlledIds: Object.freeze([]),
      controlMore: null
    });
  }

  const own = all.filter((objective) => controlledBy(objective.control, playerId));
  const opponent = all.filter((objective) => objective?.control?.controlState === "controlled" &&
    objective.control?.controllerId && objective.control.controllerId !== playerId);
  const nonHome = own.filter((objective) => !homeObjectiveIds.includes(objective.id));
  return Object.freeze({
    known: true,
    homeRoleKnown,
    homeObjectiveIds,
    ownControlled: own.length,
    opponentControlled: opponent.length,
    nonHomeControlled: nonHome.length,
    nonHomeControlledIds: Object.freeze(nonHome.map((objective) => objective.id)),
    controlMore: own.length > opponent.length
  });
}

function controlCheckpointCompleted(round, phase) {
  return round >= 2 && round <= 4 && String(phase ?? "") !== "command";
}

function checkpointTiming(round) {
  return round >= 5 ? "end-of-turn" : round >= 2 ? "end-of-command" : "not-active";
}

export function getSurveilTheFoePrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isSurveilTheFoeMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      summary: Object.freeze([]),
      reason: "Surveil the Foe strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const phase = state?.phase ?? null;
  const objectives = objectiveSnapshot(state, playerId, perspectivePlayerId);
  const surveil = getSurveilTheFoeState(state, { playerId, perspectivePlayerId });
  const awardsThisTurn = currentTurnMissionAwards(state, playerId, round, turn);
  const actualMissionVpThisTurn = awardsThisTurn.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const commandAwardAmount = commandAwardAmountForTurn(awardsThisTurn);
  const checkpointCompleted = controlCheckpointCompleted(round, phase);
  const liveControlVp = round >= 2 && objectives.known
    ? (objectives.nonHomeControlled > 0 ? 4 : 0) + (objectives.controlMore ? 4 : 0)
    : 0;
  const controlVpForProjection = round < 2 ? 0 : checkpointCompleted ? Math.min(8, commandAwardAmount) : liveControlVp;
  const surveilVpEstimate = surveil.qualifyingSurveilEstimate === "likely" ? 4 : 0;
  const markerClearVp = round >= 2 && surveil.enemyMarkersCleared ? 5 : 0;
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const remainingPrimaryGameVp = primaryGameRemaining(state, playerId);
  const rawAdvisoryVp = surveilVpEstimate + controlVpForProjection + markerClearVp;
  const cappedAdvisoryVp = projectedMissionPrimaryVp(rawAdvisoryVp, actualMissionVpThisTurn, additionalPrimaryAllowance);

  let objectivePreservationScore = 0.2;
  if (round >= 2 && objectives.known) {
    const fragileNonHome = objectives.nonHomeControlled === 1;
    const fragileControlMore = objectives.controlMore && objectives.ownControlled - 1 <= objectives.opponentControlled;
    if (fragileNonHome && fragileControlMore) objectivePreservationScore = 0.92;
    else if (fragileNonHome || fragileControlMore) objectivePreservationScore = 0.76;
    else if (objectives.nonHomeControlled > 0 || objectives.controlMore) objectivePreservationScore = 0.5;
    if (checkpointCompleted && round < 5) objectivePreservationScore *= 0.68;
  }
  if (remainingPrimaryGameVp === 0) objectivePreservationScore = Math.min(objectivePreservationScore, 0.15);

  const surveilProgress = surveil.surveilledTargetIds.length === 0
    ? "No enemy unit has been recorded as surveilled this turn. A friendly unit can use Surveil in the Shooting phase on a visible enemy within 18 inches."
    : surveil.qualifyingSurveilEstimate === "likely"
      ? `${surveil.surveilledTargetIds.length} enemy unit${surveil.surveilledTargetIds.length === 1 ? " is" : "s are"} recorded as surveilled; the approximate map currently suggests at least one is not protected by a marked objective, supporting the 4 VP end-of-turn condition if confirmed on the tabletop.`
      : surveil.qualifyingSurveilEstimate === "blocked"
        ? "Every currently surveilled enemy is approximately within range of an objective that still has an enemy operation marker. Remove a relevant marker later this turn or surveil another qualifying enemy to unlock the 4 VP condition."
        : "At least one enemy has been surveilled, but the map cannot determine whether the marked-objective exclusion applies. Confirm the target and nearby operation markers on the tabletop at end of turn.";

  const controlProgress = round < 2
    ? "The two objective-control conditions begin in Round 2."
    : !objectives.known
      ? "Objective-control evidence is incomplete; confirm home-objective roles and all current controllers before relying on the 4 VP non-home or 4 VP control-more conditions."
      : checkpointCompleted
        ? `The Round ${round} Command checkpoint has passed; ${Math.min(8, commandAwardAmount)} VP from its objective conditions is recorded for this mission. Current control can stage the next checkpoint but cannot score the completed checkpoint retroactively.`
        : `${objectives.nonHomeControlled > 0 ? "The non-home condition is currently met" : "The non-home condition is not currently met"}; ${objectives.controlMore ? "you currently control more objectives than the opponent" : "you do not currently control more objectives than the opponent"}.`;

  const markerProgress = round < 2
    ? `${surveil.enemyMarkerCount} enemy operation marker${surveil.enemyMarkerCount === 1 ? " remains" : "s remain"}; the 5 VP marker-clear condition begins in Round 2.`
    : surveil.enemyMarkersCleared
      ? "No enemy operation markers remain, supporting the 5 VP end-of-turn condition before Primary caps."
      : `${surveil.enemyMarkerCount} enemy operation marker${surveil.enemyMarkerCount === 1 ? " remains" : "s remain"}. A friendly unit that ends a move within range of the corresponding objective can remove those markers when the tabletop condition is confirmed.`;

  let reason;
  if (remainingPrimaryGameVp === 0) {
    reason = "The 45 VP Primary game cap is filled, so Surveil the Foe should no longer distort target, movement or objective priorities for additional Primary scoring.";
  } else if (surveil.qualifyingSurveilEstimate === "blocked") {
    reason = "The current surveillance is blocked by enemy operation-marker objectives. Removing one of those markers later in the turn can make that surveilled unit count, so marker removal has direct scoring value before the end-turn check.";
  } else if (surveil.surveilledTargetIds.length === 0) {
    reason = "A Surveil action is still needed for the 4 VP end-of-turn condition. Prefer a safe eligible unit and a target that is not protected by an enemy operation-marker objective.";
  } else if (round >= 2 && surveil.enemyMarkerCount > 0) {
    reason = "Enemy operation markers affect both surveillance qualification and the separate 5 VP marker-clear condition. Removing reachable markers can improve two mission conditions at once.";
  } else if (round >= 2 && objectives.known && (!objectives.nonHomeControlled || !objectives.controlMore) && !checkpointCompleted) {
    reason = "The largest remaining checkpoint leverage is objective control: 4 VP for a non-home objective and another 4 VP for controlling more objectives than the opponent.";
  } else {
    reason = "Current Surveil the Foe conditions are favorable. Preserve the required objective state and confirm the end-turn surveillance and marker conditions rather than overextending.";
  }

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Reconnaissance",
    missionId: mission.id,
    missionName: mission.name,
    round,
    turn,
    phase,
    targetUnitId,
    controlCheckpoint: checkpointTiming(round),
    controlCheckpointCompleted: checkpointCompleted,
    surveilledTargetIds: surveil.surveilledTargetIds,
    qualifyingSurveilEstimate: surveil.qualifyingSurveilEstimate,
    enemyMarkerObjectiveIds: surveil.enemyMarkerObjectiveIds,
    enemyMarkerCount: surveil.enemyMarkerCount,
    enemyMarkersCleared: surveil.enemyMarkersCleared,
    ownControlledObjectives: objectives.known ? objectives.ownControlled : null,
    opponentControlledObjectives: objectives.known ? objectives.opponentControlled : null,
    nonHomeControlledObjectives: objectives.known ? objectives.nonHomeControlled : null,
    controlsMoreObjectives: objectives.known ? objectives.controlMore : null,
    rawAdvisoryVp,
    cappedAdvisoryVp,
    actualMissionVpThisTurn,
    additionalPrimaryAllowance,
    remainingPrimaryGameVp,
    targetingScore: 0,
    objectivePreservationScore: clamp01(objectivePreservationScore),
    summary: Object.freeze([surveilProgress, controlProgress, markerProgress]),
    reason,
    assumptions: Object.freeze([
      "The live map is advisory; visibility, 18-inch Surveil range and objective range must be confirmed on the physical tabletop.",
      "A surveilled enemy protected by an operation-marker objective can become qualifying if the relevant marker is removed later in the same turn.",
      "Primary scoring remains subject to the 15 VP per-turn and 45 VP per-game caps."
    ])
  });
}

export function getSurveilTheFoeObjectiveStrategySignal(state, {
  playerId,
  objectiveId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId || !objectiveId || !isSurveilTheFoeMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({ score: 0, vpLeverage: 0, reason: null });
  }
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const phase = state?.phase ?? null;
  const objectives = objectiveSnapshot(state, playerId, perspectivePlayerId);
  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId);
  if (!objective || !objectives.known || round < 2) {
    return Object.freeze({ score: 0.1, vpLeverage: 0, reason: "Objective leverage is not yet fully known for Surveil the Foe." });
  }

  const checkpointCompleted = controlCheckpointCompleted(round, phase);
  const isHome = objectives.homeObjectiveIds.includes(objectiveId);
  const controlled = controlledBy(objective.control, playerId);
  const controlledByOpponent = objective?.control?.controlState === "controlled" && objective.control?.controllerId && objective.control.controllerId !== playerId;
  let rawLeverage = 0;

  if (!checkpointCompleted || round >= 5) {
    if (controlled) {
      if (!isHome && objectives.nonHomeControlled === 1) rawLeverage += 4;
      if (objectives.controlMore && objectives.ownControlled - 1 <= objectives.opponentControlled) rawLeverage += 4;
    } else {
      if (!isHome && objectives.nonHomeControlled === 0) rawLeverage += 4;
      const projectedOwn = objectives.ownControlled + 1;
      const projectedOpponent = objectives.opponentControlled - (controlledByOpponent ? 1 : 0);
      if (!objectives.controlMore && projectedOwn > projectedOpponent) rawLeverage += 4;
    }
  }

  const remainingPrimaryGameVp = primaryGameRemaining(state, playerId);
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const vpLeverage = Math.max(0, Math.min(rawLeverage, remainingPrimaryGameVp, additionalPrimaryAllowance));
  const score = vpLeverage >= 8 ? 0.96 : vpLeverage >= 4 ? 0.8 : checkpointCompleted && round < 5 ? 0.24 : 0.18;
  const reason = vpLeverage >= 8
    ? "This objective can swing both Surveil the Foe control conditions: the non-home 4 VP condition and the 4 VP control-more condition."
    : vpLeverage >= 4
      ? "This objective can preserve or establish a 4 VP Surveil the Foe control condition at the active checkpoint."
      : checkpointCompleted && round < 5
        ? "This round's Command scoring checkpoint has passed; current control mainly stages the next Surveil the Foe checkpoint."
        : "This objective does not currently change a Surveil the Foe control threshold.";

  return Object.freeze({
    score: clamp01(score),
    vpLeverage,
    rawVpLeverage: rawLeverage,
    isHomeObjective: isHome,
    controlledByPlayer: controlled,
    reason
  });
}

export { isSurveilTheFoeMissionForPlayer };
