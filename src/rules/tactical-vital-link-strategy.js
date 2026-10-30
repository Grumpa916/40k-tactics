import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getRemainingPrimaryVictoryPoints } from "../engine/victory-points-ledger.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import {
  getVitalLinkObjectiveOptions,
  getVitalLinkState,
  isVitalLinkCentralObjective,
  isVitalLinkMissionForPlayer
} from "./vital-link-state.js";
import { clamp01 } from "./tactical-context-utils.js";

function players(state) { return Array.isArray(state?.players) ? state.players : []; }
function perspective(state) { return players(state)[0]?.id ?? state?.activePlayer ?? state?.battle?.activePlayerId ?? null; }
function missionForPlayer(state, playerId, perspectivePlayerId = perspective(state)) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!playerId || !setup?.myDisposition || !setup?.opponentDisposition) return null;
  const defs = getBattlePrimaryMissionDefinitions(setup.myDisposition, setup.opponentDisposition);
  if (!defs) return null;
  return playerId === perspectivePlayerId ? defs.myMission : defs.opponentMission;
}
function controlledBy(control, playerId) { return control?.controlState === "controlled" && control?.controllerId === playerId; }

function effectivePrimaryAwards(state, playerId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const undoneIds = new Set(history.filter((e) => ["victory_points.award_undone", "victory_points.adjustment_undone"].includes(e?.type))
    .map((e) => e.payload?.originalAwardEventId).filter((id) => id != null));
  const undoneIndices = new Set(history.filter((e) => ["victory_points.award_undone", "victory_points.adjustment_undone"].includes(e?.type))
    .map((e) => e.payload?.originalAwardEventIndex).filter(Number.isInteger));
  return history.map((event, index) => ({ event, index }))
    .filter(({ event, index }) => event?.type === "victory_points.awarded" && !undoneIndices.has(index) && (!event.id || !undoneIds.has(event.id)))
    .map(({ event }) => event.payload)
    .filter((p) => p?.playerId === playerId && p?.category === "primary");
}

function controlSnapshot(state, playerId, perspectivePlayerId) {
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const ownHomeIds = objectives.filter((o) => isPlayerHomeObjective(state, o, playerId, perspectivePlayerId)).map((o) => o.id);
  const opponentIds = players(state).map((p) => p?.id).filter((id) => id && id !== playerId);
  const opponentHomeIds = objectives.filter((o) => opponentIds.some((id) => isPlayerHomeObjective(state, o, id, perspectivePlayerId))).map((o) => o.id);
  const centralIds = objectives.filter(isVitalLinkCentralObjective).map((o) => o.id);
  const controlled = objectives.filter((o) => controlledBy(o.control, playerId));
  const centralControlledIds = controlled.filter((o) => centralIds.includes(o.id)).map((o) => o.id);
  const nonHomeControlledIds = ownHomeIds.length ? controlled.filter((o) => !ownHomeIds.includes(o.id)).map((o) => o.id) : [];
  return Object.freeze({
    known: objectives.length > 0 && ownHomeIds.length > 0 && centralIds.length > 0 && objectives.every((o) => o?.control != null),
    playerHomeRoleKnown: ownHomeIds.length > 0,
    opponentHomeRoleKnown: opponentHomeIds.length > 0,
    centralRoleKnown: centralIds.length > 0,
    ownHomeIds: Object.freeze(ownHomeIds), opponentHomeIds: Object.freeze(opponentHomeIds), centralIds: Object.freeze(centralIds),
    centralControlledIds: Object.freeze(centralControlledIds), nonHomeControlledIds: Object.freeze(nonHomeControlledIds),
    centralControlled: centralControlledIds.length, nonHomeControlled: nonHomeControlledIds.length,
    opponentHomeControlled: controlled.some((o) => opponentHomeIds.includes(o.id))
  });
}

function checkpointPassed(round, phase) { return round >= 2 && round <= 4 && String(phase ?? "") !== "command"; }
function markerCountOn(vital, ids) { const set = new Set(ids); return (vital.markers ?? []).filter((m) => set.has(m.objectiveId)).length; }
function pendingCountOn(vital, ids) { const set = new Set(ids); return (vital.pendingAttempts ?? []).filter((m) => set.has(m.objectiveId)).length; }
function projected(raw, actual, allowance) {
  const desired = Math.max(actual, Math.min(15, Math.max(0, raw)));
  return actual + Math.min(Math.max(0, desired - actual), Math.max(0, allowance));
}

export function getVitalLinkPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = perspective(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isVitalLinkMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze({
    active: false, supported: false, missionId: null, missionName: null, targetingScore: 0,
    objectivePreservationScore: 0, nextKillVpLeverage: 0, summary: Object.freeze([]),
    reason: "Vital Link strategy is not active for this player."
  });

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const phase = state?.phase ?? null;
  const vital = getVitalLinkState(state, { playerId, perspectivePlayerId });
  const controls = controlSnapshot(state, playerId, perspectivePlayerId);
  const awards = effectivePrimaryAwards(state, playerId);
  const awardsThisTurn = awards.filter((p) => p.missionDefinitionId === mission.id && p.round === round && p.turn === turn);
  const actualMissionVpThisTurn = awardsThisTurn.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const commandAwardAmount = awardsThisTurn.filter((p) => p.scoringTiming === "command-phase" || String(p.opportunityKey ?? "").endsWith(":command-phase"))
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const remainingPrimaryGameVp = Math.max(0, 45 - awards.reduce((s, p) => s + (Number(p.amount) || 0), 0));
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const commandCheckpointCompleted = checkpointPassed(round, phase);

  const controlledMarkerCount = markerCountOn(vital, controls.centralControlledIds);
  const pendingControlledMarkerCount = pendingCountOn(vital, controls.centralControlledIds);
  const endTurnLinkVp = controls.known && controls.centralControlled > 0 ? 2 + controlledMarkerCount : 0;
  const endTurnLinkVpWithPending = endTurnLinkVp + (controls.centralControlled > 0 ? pendingControlledMarkerCount : 0);
  const liveRecurringControlVp = round >= 2 && controls.known ? (controls.nonHomeControlled > 0 ? 4 : 0) + (controls.centralControlled > 0 ? 4 : 0) : 0;
  const recurringControlVpForProjection = round < 2 ? 0 : round <= 4 ? (commandCheckpointCompleted ? commandAwardAmount : liveRecurringControlVp) : liveRecurringControlVp;
  const rawAdvisoryVp = recurringControlVpForProjection + endTurnLinkVp;
  const cappedAdvisoryVp = projected(rawAdvisoryVp, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const projectedPending = projected(recurringControlVpForProjection + endTurnLinkVpWithPending, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const pendingMarkerVpLeverage = Math.max(0, projectedPending - cappedAdvisoryVp);
  const actionOptions = getVitalLinkObjectiveOptions(state, { playerId, perspectivePlayerId });
  const projectedOneMore = projected(recurringControlVpForProjection + endTurnLinkVpWithPending + (controls.centralControlled > 0 ? 1 : 0), actualMissionVpThisTurn, additionalPrimaryAllowance);
  const nextMaintainControlVpLeverage = actionOptions.length ? Math.max(0, projectedOneMore - projectedPending) : 0;
  const currentEndgameHomeVp = controls.opponentHomeControlled ? Math.min(10, remainingPrimaryGameVp) : 0;
  const opponentHomeEndgameVpLeverage = controls.opponentHomeRoleKnown && !controls.opponentHomeControlled ? Math.min(10, remainingPrimaryGameVp) : 0;

  let objectivePreservationScore = 0.28;
  if (controls.centralControlled === 1) objectivePreservationScore = 0.82;
  if (controlledMarkerCount) objectivePreservationScore = Math.max(objectivePreservationScore, clamp01(0.72 + controlledMarkerCount * 0.05));
  if (vital.pendingAttempts.length) objectivePreservationScore = Math.max(objectivePreservationScore, 0.95);
  if (round >= 2 && !commandCheckpointCompleted && controls.nonHomeControlled === 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.84);
  if (round === 5 && controls.opponentHomeControlled) objectivePreservationScore = Math.max(objectivePreservationScore, 0.96);
  if (remainingPrimaryGameVp === 0) objectivePreservationScore = Math.min(objectivePreservationScore, 0.15);

  const summary = Object.freeze([
    controls.centralControlled > 0 ? `${controls.centralControlled} central objective${controls.centralControlled === 1 ? " is" : "s are"} controlled; ${controlledMarkerCount} marker${controlledMarkerCount === 1 ? "" : "s"} contribute for ${endTurnLinkVp} raw end-turn VP.` : "No central objective is controlled; the 2 VP link and all marker bonuses are inactive.",
    vital.usedThisTurn ? (vital.pendingAttempts.length ? "Maintain Control is pending; preserve the acting unit and central control through end of turn." : "Maintain Control has already been used this turn.") : "Maintain Control is available once this turn at a central objective.",
    round < 2 ? "The 4 VP non-home plus 4 VP central checkpoint begins in Round 2." : (commandCheckpointCompleted ? `The Command checkpoint has passed; ${commandAwardAmount} VP is recorded for it.` : `${liveRecurringControlVp} raw VP is currently supported by the recurring control conditions.`),
    controls.opponentHomeControlled ? `Opponent home control supports up to ${currentEndgameHomeVp} end-of-battle VP.` : `Opponent home control is worth up to ${opponentHomeEndgameVpLeverage} end-of-battle VP.`
  ]);

  let reason = "Preserve central control and build persistent markers when that does not compromise more valuable scoring.";
  if (!controls.centralRoleKnown || !controls.playerHomeRoleKnown) reason = "Confirm central and home objective roles before relying on Vital Link calculations.";
  else if (remainingPrimaryGameVp === 0) reason = "The 45 VP Primary game cap is filled, so Vital Link should no longer distort movement or action choices for additional Primary scoring.";
  else if (vital.pendingAttempts.length) reason = "Maintain Control is in progress. Preserve the acting unit and control of its selected central objective through end of turn.";
  else if (controls.centralControlled === 0) reason = "Vital Link depends on central control: losing it disables the link, marker bonuses and the Round 2+ central-control bonus.";
  else if (vital.actionAvailableThisTurn && nextMaintainControlVpLeverage > 0) reason = "Central control is established; a safe Maintain Control action can grow the persistent marker stack and add current-round VP.";
  else if (controlledMarkerCount > 0) reason = "The marker stack is producing recurring VP. Protect the marked central objective or maintain control across marked central objectives.";
  else if (round >= 2 && !commandCheckpointCompleted && controls.nonHomeControlled === 0) reason = "Secure a non-home objective before the active checkpoint, preferably a central objective that also satisfies the separate +4 VP condition.";
  else if (round === 5 && controls.opponentHomeRoleKnown && !controls.opponentHomeControlled && opponentHomeEndgameVpLeverage > 0) reason = "Balance central control with pressure on the opponent home objective for the separate 10 VP end-of-battle condition.";

  return Object.freeze({
    active: true, supported: true, disposition: "Priority Assets", missionId: mission.id, missionName: mission.name,
    round, turn, phase, targetUnitId,
    playerHomeRoleKnown: controls.playerHomeRoleKnown, opponentHomeRoleKnown: controls.opponentHomeRoleKnown, centralRoleKnown: controls.centralRoleKnown,
    playerHomeObjectiveIds: controls.ownHomeIds, opponentHomeObjectiveIds: controls.opponentHomeIds, centralObjectiveIds: controls.centralIds,
    controlledCentralObjectiveIds: controls.centralControlledIds, controlledNonHomeObjectiveIds: controls.nonHomeControlledIds,
    centralControlled: controls.centralControlled, nonHomeControlled: controls.nonHomeControlled, opponentHomeControlled: controls.opponentHomeControlled,
    markerCount: vital.markerCount, markerCountByObjective: vital.markerCountByObjective, controlledMarkerCount, pendingControlledMarkerCount,
    usedMaintainControlThisTurn: vital.usedThisTurn, actionAvailableThisTurn: vital.actionAvailableThisTurn, pendingObjectiveIds: vital.pendingObjectiveIds,
    endTurnLinkVp, endTurnLinkVpWithPending, liveRecurringControlVp, recurringControlVpForProjection,
    commandCheckpointCompleted, commandAwardAmount, actualMissionVpThisTurn, additionalPrimaryAllowance, remainingPrimaryGameVp,
    rawAdvisoryVp, cappedAdvisoryVp, pendingMarkerVpLeverage, nextMaintainControlVpLeverage,
    currentEndgameHomeVp, opponentHomeEndgameVpLeverage,
    targetingScore: 0.04, objectivePreservationScore, nextKillVpLeverage: 0, summary, reason,
    assumptions: Object.freeze([
      "Maintain Control starts in Shooting, is once per turn, and completes at end of turn only if the acting unit controls the selected central objective.",
      "Each completed Maintain Control places a persistent operation marker; repeated turns can stack markers at the same central objective.",
      "At end of turn, controlling at least one central objective gives 2 VP and each friendly operation marker at a controlled central objective adds 1 VP cumulatively.",
      "The Event Companion FAQ allows marker VP to combine across multiple central objectives when each marked objective is controlled.",
      "From Round 2, the checkpoint gives 4 VP for a non-home objective plus 4 VP if at least one controlled objective is central; Round 5 checks this at end of turn.",
      "Opponent-home control at end of battle gives 10 VP; the end-of-battle award bypasses the 15 VP round cap but still respects the 45 VP Primary cap.",
      "Vital Link has no direct kill-scoring condition; the tabletop remains authoritative for action eligibility, range and control."
    ])
  });
}

export function getVitalLinkObjectiveStrategySignal(state, {
  playerId, perspectivePlayerId = perspective(state), objectiveId, control = null, purpose = null, primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId || !isVitalLinkMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Vital Link is not active for this objective." });
  const strategy = primaryStrategy?.missionId === "primary-vital-link" ? primaryStrategy : getVitalLinkPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const objective = (state?.objectives ?? []).find((o) => o?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Objective not found." });
  const vital = getVitalLinkState(state, { playerId, perspectivePlayerId });
  const central = isVitalLinkCentralObjective(objective);
  const ownHome = vital.playerHomeObjectiveIds.includes(objectiveId);
  const opponentHome = vital.opponentHomeObjectiveIds.includes(objectiveId);
  const nonHome = vital.playerHomeRoleKnown && !ownHome;
  const controlled = control === "controlled" || controlledBy(objective.control, playerId);
  const markerCount = vital.markerCountByObjective[objectiveId] ?? 0;
  const pending = vital.pendingObjectiveIds.includes(objectiveId);
  const eligibleMaintainObjective = central && vital.actionAvailableThisTurn;
  const checkpointOpen = strategy.round >= 2 && (strategy.round === 5 || (strategy.round <= 4 && !strategy.commandCheckpointCompleted));
  const otherCentral = strategy.controlledCentralObjectiveIds.filter((id) => id !== objectiveId).length;
  let currentRoundVpLeverage = 0;
  if (central) currentRoundVpLeverage += markerCount + (otherCentral === 0 ? 2 : 0) + (checkpointOpen ? 4 : 0);
  if (nonHome && checkpointOpen && strategy.nonHomeControlled === 0) currentRoundVpLeverage += 4;
  const endgameVpLeverage = opponentHome ? (controlled ? strategy.currentEndgameHomeVp : strategy.opponentHomeEndgameVpLeverage) : 0;
  const markerGrowthLeverage = eligibleMaintainObjective && strategy.remainingPrimaryGameVp > 0 ? Math.max(1, strategy.nextMaintainControlVpLeverage) : 0;
  const vpLeverage = currentRoundVpLeverage + endgameVpLeverage + markerGrowthLeverage;
  let score = 0.08 + (central ? 0.24 : 0) + Math.min(0.24, markerCount * 0.06) + (pending ? 0.34 : 0) + (eligibleMaintainObjective ? 0.16 : 0);
  if (opponentHome && endgameVpLeverage > 0) score += strategy.round >= 4 ? 0.34 : 0.16;
  if (currentRoundVpLeverage > 0) score += Math.min(0.28, currentRoundVpLeverage / 30);
  if (strategy.remainingPrimaryGameVp === 0) score = Math.min(score, 0.12);
  score = clamp01(score);
  let reason = `${objective.name ?? objectiveId} has limited immediate Vital Link leverage at the current checkpoint.`;
  if (pending) reason = `${objective.name ?? objectiveId} has this turn's pending Maintain Control attempt; preserve the acting unit and objective control through end of turn.`;
  else if (central && markerCount > 0 && controlled) reason = `${objective.name ?? objectiveId} is controlled with ${markerCount} Vital Link marker${markerCount === 1 ? "" : "s"}; those markers add recurring VP while control is maintained.`;
  else if (central && markerCount > 0) reason = `${objective.name ?? objectiveId} has ${markerCount} Vital Link marker${markerCount === 1 ? "" : "s"}; regaining control reactivates their cumulative VP.`;
  else if (central && eligibleMaintainObjective) reason = `${objective.name ?? objectiveId} is eligible for this turn's Maintain Control Action and supports central-control scoring.`;
  else if (opponentHome && endgameVpLeverage > 0) reason = `${objective.name ?? objectiveId} carries up to ${endgameVpLeverage} VP of end-of-battle Vital Link value.`;
  else if (nonHome && checkpointOpen) reason = `${objective.name ?? objectiveId} can support Vital Link's active non-home control condition${central ? " and the separate central bonus" : ""}.`;
  else if (central) reason = `${objective.name ?? objectiveId} remains important because central control enables the link and marker scoring.`;
  return Object.freeze({ active: true, missionId: strategy.missionId, objectiveId, central, ownHome, opponentHome, nonHome, controlled,
    markerCount, pending, eligibleMaintainObjective, currentRoundVpLeverage, endgameVpLeverage, markerGrowthLeverage, vpLeverage, score, purpose, reason });
}

export { isVitalLinkMissionForPlayer } from "./vital-link-state.js";
