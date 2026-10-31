import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getRemainingPrimaryVictoryPoints } from "../engine/victory-points-ledger.js";
import { isOpponentHomeObjectiveForPlayer, isPlayerHomeObjective } from "./consecrate-state.js";
import { getVanguardOperationState, isVanguardOperationMissionForPlayer } from "./vanguard-operation-state.js";
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

function currentTurnMissionAwards(state, playerId, missionId, round, turn) {
  return effectiveAwardEntries(state, playerId).filter((entry) =>
    entry.category === "primary" &&
    entry.missionDefinitionId === missionId &&
    entry.round === round &&
    entry.turn === turn
  );
}

function commandAwardAmountForTurn(entries) {
  return entries
    .filter((entry) => entry.scoringTiming === "command-phase" ||
      (typeof entry.opportunityKey === "string" && entry.opportunityKey.endsWith(":command-phase")))
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
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

function controlSnapshot(state, playerId, perspectivePlayerId) {
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const ownHome = objectives.filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const opponentHome = objectives.filter((objective) => isOpponentHomeObjectiveForPlayer(state, objective, playerId, perspectivePlayerId));
  const ownHomeIds = Object.freeze(ownHome.map((objective) => objective.id));
  const opponentHomeIds = Object.freeze(opponentHome.map((objective) => objective.id));
  const roleKnown = ownHomeIds.length > 0 && opponentHomeIds.length > 0;
  const known = objectives.length > 0 && roleKnown && objectives.every((objective) => objective?.control != null);
  if (!known) {
    return Object.freeze({
      known: false,
      roleKnown,
      ownHomeIds,
      opponentHomeIds,
      controlledIds: Object.freeze([]),
      nonHomeControlled: 0,
      nonHomeControlledIds: Object.freeze([]),
      opponentHomeControlled: false
    });
  }
  const controlled = objectives.filter((objective) => controlledBy(objective.control, playerId));
  const nonHome = controlled.filter((objective) => !ownHomeIds.includes(objective.id));
  return Object.freeze({
    known: true,
    roleKnown,
    ownHomeIds,
    opponentHomeIds,
    controlledIds: Object.freeze(controlled.map((objective) => objective.id)),
    nonHomeControlled: nonHome.length,
    nonHomeControlledIds: Object.freeze(nonHome.map((objective) => objective.id)),
    opponentHomeControlled: opponentHomeIds.some((id) => controlled.some((objective) => objective.id === id))
  });
}

function commandCheckpointCompleted(round, phase) {
  return round >= 2 && round <= 4 && String(phase ?? "") !== "command";
}

export function getVanguardOperationPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isVanguardOperationMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Vanguard Operation strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const phase = state?.phase ?? null;
  const vanguard = getVanguardOperationState(state, { playerId, perspectivePlayerId });
  const controls = controlSnapshot(state, playerId, perspectivePlayerId);
  const awardsThisTurn = currentTurnMissionAwards(state, playerId, mission.id, round, turn);
  const actualMissionVpThisTurn = awardsThisTurn.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const remainingPrimaryGameVp = primaryGameRemaining(state, playerId);
  const checkpointCompleted = commandCheckpointCompleted(round, phase);
  const commandAwardAmount = round >= 2 && round <= 4 ? commandAwardAmountForTurn(awardsThisTurn) : 0;

  const liveControlVp = round >= 2 && controls.known && controls.nonHomeControlled > 0 ? 4 : 0;
  const controlVpForProjection = round >= 2 && round <= 4
    ? checkpointCompleted ? commandAwardAmount : liveControlVp
    : round >= 5 ? liveControlVp : 0;
  const actionRawVp = vanguard.completedThisTurnCount > 0 ? 4 : 0;
  const killRawVp = vanguard.killSatisfied ? 2 : 0;
  const rawAdvisoryVp = actionRawVp + killRawVp + controlVpForProjection;
  const cappedAdvisoryVp = projectedMissionPrimaryVp(rawAdvisoryVp, actualMissionVpThisTurn, additionalPrimaryAllowance);

  const pendingActionRawVp = vanguard.pendingTerrainAreaIds.length > 0 ? 4 : 0;
  const withPendingAction = projectedMissionPrimaryVp(rawAdvisoryVp + pendingActionRawVp, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const pendingActionVpLeverage = Math.max(0, withPendingAction - cappedAdvisoryVp);
  const withNextAction = projectedMissionPrimaryVp(rawAdvisoryVp + pendingActionRawVp + (vanguard.actionAvailableThisTurn ? 4 : 0), actualMissionVpThisTurn, additionalPrimaryAllowance);
  const nextActionVpLeverage = vanguard.actionAvailableThisTurn ? Math.max(0, withNextAction - withPendingAction) : 0;
  const liveEnemies = (state?.units ?? []).filter((unit) => unit?.ownerId && unit.ownerId !== playerId && unit.status !== "destroyed");
  const withKill = projectedMissionPrimaryVp(rawAdvisoryVp + pendingActionRawVp + (vanguard.killSatisfied ? 0 : 2), actualMissionVpThisTurn, additionalPrimaryAllowance);
  const nextKillVpLeverage = !vanguard.killSatisfied && liveEnemies.length > 0
    ? Math.max(0, withKill - withPendingAction)
    : 0;

  const targetIsEnemy = !!targetUnitId && liveEnemies.some((unit) => unit.id === targetUnitId);
  let targetingScore = 0.05;
  if (!vanguard.killSatisfied && nextKillVpLeverage > 0) targetingScore = 0.35 + nextKillVpLeverage * 0.12;
  if (targetIsEnemy && nextKillVpLeverage > 0) targetingScore += 0.18;
  if (vanguard.killSatisfied || remainingPrimaryGameVp === 0) targetingScore = Math.min(targetingScore, 0.12);
  targetingScore = clamp01(targetingScore);

  let objectivePreservationScore = 0.28;
  if (round >= 2 && controls.known && controls.nonHomeControlled === 1 && !checkpointCompleted) objectivePreservationScore = Math.max(objectivePreservationScore, 0.86);
  if (round === 5 && controls.known && controls.nonHomeControlled === 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.92);
  if (controls.opponentHomeControlled) objectivePreservationScore = Math.max(objectivePreservationScore, round >= 4 ? 0.98 : 0.72);
  if (remainingPrimaryGameVp === 0) objectivePreservationScore = Math.min(objectivePreservationScore, 0.15);

  const pendingBlockerCount = vanguard.blockerUnitIds.length;
  const actionProgress = vanguard.completedThisTurnCount > 0
    ? "Vanguard Operation is completed this turn, satisfying the 4 VP end-of-turn Action condition before caps."
    : vanguard.pendingTerrainAreaIds.length > 0
      ? `Vanguard Operation is pending in ${vanguard.pendingTerrainAreaIds.join(", ")}; ${pendingBlockerCount ? `${pendingBlockerCount} enemy unit${pendingBlockerCount === 1 ? " is" : "s are"} currently recorded in the pending terrain area${vanguard.pendingTerrainAreaIds.length === 1 ? "" : "s"}.` : "the map currently shows no enemy blocker in the pending terrain area."} Preserve the acting unit and clear the terrain through end of turn for up to ${pendingActionVpLeverage} additional Primary VP.`
      : vanguard.actionAvailableThisTurn
        ? `Vanguard Operation is still available once this turn in eligible enemy-territory terrain for up to ${nextActionVpLeverage} Primary VP before caps.`
        : "Vanguard Operation has no remaining Action use this turn or no eligible terrain area is currently identified.";
  const killProgress = vanguard.killSatisfied
    ? "The binary 2 VP destruction condition is already satisfied this turn."
    : liveEnemies.length > 0
      ? `Destroying any enemy unit can satisfy the separate 2 VP condition, with up to ${nextKillVpLeverage} Primary VP of current-round leverage after caps.`
      : "No remaining enemy unit is recorded as available to satisfy the 2 VP destruction condition.";
  const controlProgress = round < 2
    ? "The recurring 4 VP non-home control condition begins in Round 2."
    : !controls.known
      ? "Objective control or home-objective role evidence is incomplete; confirm the non-home control condition on the tabletop."
      : checkpointCompleted
        ? `The Round ${round} Command checkpoint has passed; ${commandAwardAmount} VP from that checkpoint is recorded. Later movement cannot retroactively change it.`
        : controls.nonHomeControlled > 0
          ? "The recurring 4 VP non-home control condition is currently met."
          : "The recurring 4 VP non-home control condition is not currently met.";
  const endgameProgress = !controls.roleKnown
    ? "Opponent-home objective identity is not confirmed for the 10 VP end-of-battle condition."
    : controls.opponentHomeControlled
      ? `You currently control the opponent's home objective, preserving up to ${Math.min(10, remainingPrimaryGameVp)} end-of-battle Primary VP under the 45 VP game cap.`
      : `The opponent's home objective remains a 10 VP end-of-battle opportunity, with up to ${Math.min(10, remainingPrimaryGameVp)} VP still available under the Primary game cap.`;

  let reason;
  if (remainingPrimaryGameVp === 0) {
    reason = "The 45 VP Primary game cap is filled, so Vanguard Operation should no longer distort Action, target, or objective choices for additional Primary scoring.";
  } else if (vanguard.pendingTerrainAreaIds.length > 0 && pendingActionVpLeverage > 0) {
    reason = pendingBlockerCount > 0
      ? "A Vanguard Operation attempt is in progress but enemy units still occupy its terrain area on the approximate map. Prioritize clearing those blockers while preserving the acting unit through end of turn."
      : "A Vanguard Operation attempt is in progress. Preserve the acting unit and keep the selected terrain area clear through end of turn before spending resources on lower-value Primary opportunities.";
  } else if (vanguard.actionAvailableThisTurn && nextActionVpLeverage > 0) {
    reason = "Vanguard Operation is a once-per-turn 4 VP opportunity. Prefer enemy-territory terrain that the acting unit can reach and that can realistically be cleared of enemies by end of turn.";
  } else if (nextKillVpLeverage > 0) {
    reason = "The Action opportunity is covered or unavailable. Any enemy destruction can still secure the separate binary 2 VP condition this turn.";
  } else if (round >= 2 && controls.known && !checkpointCompleted && controls.nonHomeControlled === 0) {
    reason = "Build the active control checkpoint by securing at least one objective other than your home objective for 4 VP."
  } else if (round >= 4 && controls.roleKnown && !controls.opponentHomeControlled) {
    reason = "Current round scoring is largely covered. Begin positioning for the opponent's home objective because it is worth 10 VP at the end of the battle and bypasses the 15 VP battle-round cap."
  } else {
    reason = "Current Vanguard Operation scoring is largely covered. Preserve the non-home control checkpoint and avoid sacrificing units solely for Primary value that is already capped or satisfied.";
  }

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Priority Assets",
    missionId: mission.id,
    missionName: mission.name,
    round,
    turn,
    phase,
    targetUnitId,
    usedActionThisTurn: vanguard.usedThisTurn,
    completedActionsThisTurn: vanguard.completedThisTurnCount,
    pendingTerrainAreaIds: vanguard.pendingTerrainAreaIds,
    eligibleTerrainAreaIds: vanguard.eligibleTerrainAreaIds,
    actionAvailableThisTurn: vanguard.actionAvailableThisTurn,
    blockerEvidenceKnown: vanguard.blockerEvidenceKnown,
    blockerUnitIds: vanguard.blockerUnitIds,
    blockersByTerrain: vanguard.blockersByTerrain,
    killSatisfied: vanguard.killSatisfied,
    enemyKillsThisTurn: vanguard.enemyKillsThisTurn,
    qualifyingDestroyedUnitIds: vanguard.qualifyingDestroyedUnitIds,
    objectiveStateKnown: controls.known,
    homeRoleKnown: controls.roleKnown,
    playerHomeObjectiveIds: controls.ownHomeIds,
    opponentHomeObjectiveIds: controls.opponentHomeIds,
    controlledObjectiveIds: controls.controlledIds,
    nonHomeControlled: controls.nonHomeControlled,
    nonHomeControlledIds: controls.nonHomeControlledIds,
    opponentHomeControlled: controls.opponentHomeControlled,
    commandCheckpointCompleted: checkpointCompleted,
    commandAwardAmount,
    controlVpForProjection,
    actionRawVp,
    killRawVp,
    pendingActionVpLeverage,
    nextActionVpLeverage,
    nextKillVpLeverage,
    endgameVpLeverage: controls.opponentHomeControlled ? Math.min(10, remainingPrimaryGameVp) : 0,
    prospectiveEndgameVpLeverage: controls.opponentHomeControlled ? 0 : Math.min(10, remainingPrimaryGameVp),
    actualMissionVpThisTurn,
    additionalPrimaryAllowance,
    remainingPrimaryGameVp,
    rawAdvisoryVp,
    cappedAdvisoryVp,
    targetingScore,
    objectivePreservationScore,
    protectCheapUnits: vanguard.pendingTerrainAreaIds.length > 0,
    summary: Object.freeze([
      actionProgress,
      killProgress,
      controlProgress,
      endgameProgress,
      `Current recorded Vanguard Operation conditions project ${cappedAdvisoryVp}/15 Primary VP this round before unresolved tabletop checks.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Vanguard Operation starts in the Shooting phase, is limited to one use per turn, and requires the acting unit to be within a terrain area that is within the opponent's territory.",
      "The Action completes at end of turn only if no enemy units are within that terrain area. Event Companion map geometry is advisory; physical terrain placement and unit positions remain authoritative.",
      "The 2 VP destruction condition is binary: destroying one or more enemy units in the turn satisfies it once.",
      "Rounds 2-4 non-home control scoring is fixed at the Command checkpoint; Round 5 uses the end-of-turn control state instead.",
      "Primary scoring is capped at 15 VP per battle round and 45 VP for the battle; the 10 VP end-of-battle award bypasses only the battle-round cap."
    ])
  });
}

export function getVanguardOperationObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId || !isVanguardOperationMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Vanguard Operation is not active for this objective." });
  }

  const strategy = primaryStrategy ?? getVanguardOperationPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const objective = (state?.objectives ?? []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Objective is not available." });

  const ownHome = strategy.playerHomeObjectiveIds.includes(objectiveId);
  const opponentHome = strategy.opponentHomeObjectiveIds.includes(objectiveId);
  const controlled = control === "controlled" || controlledBy(objective.control, playerId);
  const controlWindowOpen = strategy.round >= 2 && (strategy.round >= 5 || !strategy.commandCheckpointCompleted);

  let controlVpLeverage = 0;
  if (controlWindowOpen && !ownHome) {
    if (controlled && strategy.nonHomeControlled === 1) controlVpLeverage = 4;
    if (!controlled && strategy.nonHomeControlled === 0) controlVpLeverage = 4;
  }
  const endgameVpLeverage = opponentHome ? Math.min(10, strategy.remainingPrimaryGameVp) : 0;
  const rawVpLeverage = controlVpLeverage + endgameVpLeverage;
  const vpLeverage = Math.min(strategy.remainingPrimaryGameVp, rawVpLeverage);

  let score = 0.08 + controlVpLeverage * 0.1;
  if (opponentHome) score += strategy.round >= 4 ? 0.5 : 0.26;
  if (controlled && controlVpLeverage > 0) score += 0.16;
  if (strategy.remainingPrimaryGameVp === 0) score = Math.min(score, 0.12);
  score = clamp01(score);

  let reason;
  if (ownHome) {
    reason = "Your home objective is excluded from Vanguard Operation's recurring 4 VP control condition; preserve it only for ordinary board-control value.";
  } else if (opponentHome) {
    reason = controlled
      ? `Preserve the opponent's home objective: it can satisfy the recurring non-home checkpoint and is worth up to ${endgameVpLeverage} VP at end of battle under the remaining Primary game cap.`
      : `Pressure the opponent's home objective: it can satisfy the recurring non-home checkpoint and is worth up to ${endgameVpLeverage} VP at end of battle.`;
  } else if (controlVpLeverage > 0) {
    reason = controlled
      ? "Preserve this non-home objective; it is currently the objective carrying Vanguard Operation's binary 4 VP control condition."
      : "Taking this non-home objective can establish Vanguard Operation's binary 4 VP control condition at the active checkpoint.";
  } else {
    reason = "This objective has ordinary board-control value but no additional immediate Vanguard Operation leverage beyond the current plan.";
  }

  return Object.freeze({
    active: true,
    score,
    vpLeverage,
    rawVpLeverage,
    controlVpLeverage,
    endgameVpLeverage,
    ownHome,
    opponentHome,
    controlled,
    purpose,
    reason
  });
}

export { isVanguardOperationMissionForPlayer } from "./vanguard-operation-state.js";
