import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getRemainingPrimaryVictoryPoints } from "../engine/victory-points-ledger.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getEnemyUnitDestructionsForTurn } from "./scoring-evidence-state.js";
import { getLiveUnitPosition } from "./spatial-context.js";
import { clamp01 } from "./tactical-context-utils.js";

const MISSION_ID = "primary-reconnaissance-sweep";
const BATTLEFIELD_WIDTH = 60;
const BATTLEFIELD_HEIGHT = 44;
const CENTRE = Object.freeze({ x: BATTLEFIELD_WIDTH / 2, y: BATTLEFIELD_HEIGHT / 2 });
const CENTRE_EXCLUSION = 6;

export const RECONNAISSANCE_SWEEP_QUARTERS = Object.freeze([
  Object.freeze({ id: "upper-left", label: "upper-left quarter", anchor: Object.freeze({ x: 15, y: 11 }) }),
  Object.freeze({ id: "upper-right", label: "upper-right quarter", anchor: Object.freeze({ x: 45, y: 11 }) }),
  Object.freeze({ id: "lower-left", label: "lower-left quarter", anchor: Object.freeze({ x: 15, y: 33 }) }),
  Object.freeze({ id: "lower-right", label: "lower-right quarter", anchor: Object.freeze({ x: 45, y: 33 }) })
]);

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

export function isReconnaissanceSweepMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === MISSION_ID;
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
      nonHomeControlled: 0,
      nonHomeControlledIds: Object.freeze([])
    });
  }
  const nonHomeControlled = all.filter((objective) =>
    !homeObjectiveIds.includes(objective.id) && controlledBy(objective.control, playerId)
  );
  return Object.freeze({
    known: true,
    homeRoleKnown,
    homeObjectiveIds,
    nonHomeControlled: nonHomeControlled.length,
    nonHomeControlledIds: Object.freeze(nonHomeControlled.map((objective) => objective.id))
  });
}

function validPosition(position) {
  return Number.isFinite(position?.x) && Number.isFinite(position?.y);
}

export function getReconnaissanceSweepQuarterForPosition(position) {
  if (!validPosition(position)) return null;
  const centreDistance = Math.hypot(position.x - CENTRE.x, position.y - CENTRE.y);
  if (centreDistance <= CENTRE_EXCLUSION) {
    return Object.freeze({ quarterId: null, centreDistance, withinCentreExclusion: true, onQuarterBoundary: false });
  }
  if (position.x === CENTRE.x || position.y === CENTRE.y) {
    return Object.freeze({ quarterId: null, centreDistance, withinCentreExclusion: false, onQuarterBoundary: true });
  }
  const horizontal = position.x < CENTRE.x ? "left" : "right";
  const vertical = position.y < CENTRE.y ? "upper" : "lower";
  return Object.freeze({
    quarterId: `${vertical}-${horizontal}`,
    centreDistance,
    withinCentreExclusion: false,
    onQuarterBoundary: false
  });
}

export function getReconnaissanceSweepQuarterState(state, { playerId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const units = (Array.isArray(state?.units) ? state.units : [])
    .filter((unit) => unit?.ownerId === playerId && unit?.status === "deployed");
  const unitEntries = units.map((unit) => {
    const position = getLiveUnitPosition(state, unit);
    const quarter = getReconnaissanceSweepQuarterForPosition(position);
    return Object.freeze({
      unitId: unit.id,
      position: position ? Object.freeze({ ...position }) : null,
      quarterId: quarter?.quarterId ?? null,
      withinCentreExclusion: quarter?.withinCentreExclusion === true,
      onQuarterBoundary: quarter?.onQuarterBoundary === true
    });
  });
  const counts = Object.fromEntries(RECONNAISSANCE_SWEEP_QUARTERS.map((quarter) => [quarter.id, 0]));
  for (const entry of unitEntries) if (entry.quarterId) counts[entry.quarterId] += 1;
  const representedQuarterIds = RECONNAISSANCE_SWEEP_QUARTERS.filter((quarter) => counts[quarter.id] > 0).map((quarter) => quarter.id);
  const missingQuarterIds = RECONNAISSANCE_SWEEP_QUARTERS.filter((quarter) => counts[quarter.id] === 0).map((quarter) => quarter.id);
  const representedQuarterCount = representedQuarterIds.length;
  const mapQuarterVpEstimate = representedQuarterCount >= 4 ? 6 : representedQuarterCount >= 3 ? 3 : 0;
  return Object.freeze({
    representedQuarterCount,
    representedQuarterIds: Object.freeze(representedQuarterIds),
    missingQuarterIds: Object.freeze(missingQuarterIds),
    mapQuarterVpEstimate,
    counts: Object.freeze({ ...counts }),
    units: Object.freeze(unitEntries),
    unitQuarterById: Object.freeze(Object.fromEntries(unitEntries.map((entry) => [entry.unitId, entry.quarterId])))
  });
}

function controlCheckpointCompleted(round, phase) {
  return round >= 2 && round <= 4 && String(phase ?? "") !== "command";
}

function checkpointTiming(round) {
  return round >= 5 ? "end-of-turn" : round >= 2 ? "end-of-command" : "not-active";
}

export function getReconnaissanceSweepPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isReconnaissanceSweepMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Reconnaissance Sweep strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const phase = state?.phase ?? null;
  const objectives = objectiveSnapshot(state, playerId, perspectivePlayerId);
  const quarters = getReconnaissanceSweepQuarterState(state, { playerId });
  const enemyKillsThisTurn = getEnemyUnitDestructionsForTurn(state, playerId, turn).length;
  const awardsThisTurn = currentTurnMissionAwards(state, playerId, round, turn);
  const actualMissionVpThisTurn = awardsThisTurn.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const commandAwardAmount = commandAwardAmountForTurn(awardsThisTurn);
  const checkpointCompleted = controlCheckpointCompleted(round, phase);
  const controlSatisfied = round >= 2 && objectives.known ? objectives.nonHomeControlled > 0 : round >= 2 ? null : false;
  const liveControlVp = round >= 2 && controlSatisfied ? 3 : 0;
  const controlVpForProjection = round < 2 ? 0 : checkpointCompleted ? Math.min(3, commandAwardAmount) : liveControlVp;
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const remainingPrimaryGameVp = primaryGameRemaining(state, playerId);
  const rawAdvisoryVp = quarters.mapQuarterVpEstimate + enemyKillsThisTurn + controlVpForProjection;
  const cappedAdvisoryVp = projectedMissionPrimaryVp(rawAdvisoryVp, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const oneMoreKillProjectedVp = projectedMissionPrimaryVp(rawAdvisoryVp + 1, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const nextKillVpLeverage = Math.max(0, Math.min(1, oneMoreKillProjectedVp - cappedAdvisoryVp));

  let objectivePreservationScore = 0.25;
  if (round >= 2 && objectives.known && objectives.nonHomeControlled === 1) objectivePreservationScore = checkpointCompleted ? 0.58 : 0.82;
  if (round === 5 && objectives.known && objectives.nonHomeControlled === 1) objectivePreservationScore = 0.9;
  if (remainingPrimaryGameVp === 0) objectivePreservationScore = Math.min(objectivePreservationScore, 0.15);

  const quarterProgress = quarters.representedQuarterCount >= 4
    ? "Approximate map positions currently suggest friendly units in all four table quarters, which would correspond to the 6 VP tier if the tabletop wholly-within and 6-inch-centre conditions are confirmed."
    : quarters.representedQuarterCount === 3
      ? "Approximate map positions currently suggest three table quarters represented, corresponding to the 3 VP tier if tabletop placement is confirmed; filling the fourth quarter raises that tier to 6 VP."
      : `Approximate map positions currently suggest ${quarters.representedQuarterCount} table quarter${quarters.representedQuarterCount === 1 ? "" : "s"} represented; three are needed for the first 3 VP tier.`;
  const killProgress = `${enemyKillsThisTurn} enemy unit${enemyKillsThisTurn === 1 ? " has" : "s have"} been destroyed this turn, representing ${enemyKillsThisTurn} raw Reconnaissance Sweep VP before caps.`;
  const controlProgress = round < 2
    ? "The non-home objective condition begins in Round 2."
    : !objectives.known
      ? "Non-home objective control is incomplete; confirm the player's home objective and all controllers before relying on the 3 VP control condition."
      : checkpointCompleted
        ? `The Round ${round} Command checkpoint has passed; ${Math.min(3, commandAwardAmount)} VP from that checkpoint is recorded for this mission. Current control can stage the next checkpoint but cannot score the completed checkpoint retroactively.`
        : controlSatisfied
          ? `At least one non-home objective is controlled, satisfying the 3 VP ${round === 5 ? "end-of-turn" : "Command"} condition before caps.`
          : `No non-home objective is currently controlled; gaining one can satisfy the 3 VP ${round === 5 ? "end-of-turn" : "Command"} condition.`;

  let reason;
  if (remainingPrimaryGameVp === 0) {
    reason = "The 45 VP Primary game cap is filled, so Reconnaissance Sweep should no longer distort movement or target priorities for additional Primary scoring.";
  } else if (quarters.representedQuarterCount === 3) {
    reason = "A fourth confirmed table quarter changes the positional tier from 3 VP to 6 VP. Favor a safe dispersal move when it does not give up the non-home objective condition or expose a key unit.";
  } else if (quarters.representedQuarterCount < 3) {
    reason = "Reconnaissance Sweep needs presence across at least three table quarters. Spread units toward missing quarters while keeping them more than 6 inches from the battlefield centre on the tabletop.";
  } else if (round >= 2 && objectives.known && !controlSatisfied && !checkpointCompleted) {
    reason = "Quarter coverage is currently favorable, but the 3 VP non-home objective condition is not. Establishing one controlled non-home objective is the clearest additional Primary opportunity.";
  } else if (nextKillVpLeverage > 0) {
    reason = "Each additional enemy unit destroyed this turn adds 1 VP before Primary caps. Prefer reliable finishes when they do not compromise quarter coverage or objective control.";
  } else {
    reason = "Current Reconnaissance Sweep conditions are near their capped value. Preserve confirmed quarter coverage and useful non-home control rather than overextending for low-value damage.";
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
    enemyKillsThisTurn,
    mapQuarterCount: quarters.representedQuarterCount,
    representedQuarterIds: quarters.representedQuarterIds,
    missingQuarterIds: quarters.missingQuarterIds,
    quarterCounts: quarters.counts,
    mapQuarterVpEstimate: quarters.mapQuarterVpEstimate,
    unitQuarterById: quarters.unitQuarterById,
    objectiveStateKnown: objectives.known,
    homeRoleKnown: objectives.homeRoleKnown,
    homeObjectiveIds: objectives.homeObjectiveIds,
    nonHomeControlled: objectives.nonHomeControlled,
    nonHomeControlledIds: objectives.nonHomeControlledIds,
    controlSatisfied,
    controlCheckpointTiming: checkpointTiming(round),
    controlCheckpointCompleted: checkpointCompleted,
    commandAwardAmount,
    controlVpForProjection,
    actualMissionVpThisTurn,
    additionalPrimaryAllowance,
    remainingPrimaryGameVp,
    rawAdvisoryVp,
    cappedAdvisoryVp,
    nextKillVpLeverage,
    targetingScore: nextKillVpLeverage > 0 ? 0.34 : 0.05,
    objectivePreservationScore,
    summary: Object.freeze([
      quarterProgress,
      killProgress,
      controlProgress,
      `Advisory current-turn projection: up to ${cappedAdvisoryVp}/15 Primary VP after recorded awards and caps.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Quarter coverage is advisory only. The map uses approximate positions for deployed units and cannot prove that an entire unit is wholly within one quarter or more than 6 inches from the battlefield centre.",
      "Reconnaissance Sweep itself does not exclude Battle-shocked units or AIRCRAFT from its quarter condition; no Engage on All Fronts restrictions are imported.",
      "Enemy destruction VP uses recorded destruction events at 1 VP per enemy unit destroyed this turn.",
      "The 3 VP non-home objective condition is binary: controlling additional non-home objectives does not multiply it.",
      "The 15 VP Primary turn cap and 45 VP Primary game cap are applied to tactical leverage."
    ])
  });
}

export function getReconnaissanceSweepObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId) {
    return Object.freeze({ active: false, score: 0, vpLeverage: 0, stagingVpLeverage: 0, reason: "Objective strategy requires player and objective identifiers." });
  }
  const context = primaryStrategy ?? getReconnaissanceSweepPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context.active) return Object.freeze({ active: false, score: 0, vpLeverage: 0, stagingVpLeverage: 0, reason: context.reason });
  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: true, score: 0, vpLeverage: 0, stagingVpLeverage: 0, reason: "Objective is not present in the recorded battlefield state." });

  const ownHome = context.homeObjectiveIds.includes(objectiveId);
  if (!context.homeRoleKnown || !context.objectiveStateKnown) {
    return Object.freeze({
      active: true,
      score: 0.05,
      vpLeverage: 0,
      stagingVpLeverage: 0,
      ownHome,
      nonHome: false,
      reason: "Home-objective roles or objective control are incomplete; Reconnaissance Sweep non-home leverage remains player-confirmed."
    });
  }
  if (ownHome) {
    return Object.freeze({
      active: true,
      score: 0.03,
      vpLeverage: 0,
      stagingVpLeverage: 0,
      ownHome: true,
      nonHome: false,
      reason: "Your home objective is excluded from Reconnaissance Sweep's 3 VP control condition."
    });
  }
  if (context.remainingPrimaryGameVp === 0) {
    return Object.freeze({
      active: true,
      score: 0.03,
      vpLeverage: 0,
      stagingVpLeverage: 0,
      ownHome: false,
      nonHome: true,
      reason: "The 45 VP Primary game cap is filled, so this objective has no remaining Reconnaissance Sweep VP leverage."
    });
  }

  const controlled = control === "controlled" || controlledBy(objective.control, playerId);
  const soleControlledNonHome = controlled && context.nonHomeControlled === 1;
  let vpLeverage = 0;
  let stagingVpLeverage = 0;
  let nextCheckpointTiming = null;

  if (context.round >= 5) {
    if (!context.controlSatisfied && !controlled) vpLeverage = Math.min(3, context.additionalPrimaryAllowance, context.remainingPrimaryGameVp);
    else if (soleControlledNonHome) vpLeverage = Math.min(3, context.additionalPrimaryAllowance + context.controlVpForProjection, context.remainingPrimaryGameVp);
  } else if (context.round >= 2 && !context.controlCheckpointCompleted) {
    if (!context.controlSatisfied && !controlled) vpLeverage = Math.min(3, context.additionalPrimaryAllowance, context.remainingPrimaryGameVp);
    else if (soleControlledNonHome) vpLeverage = Math.min(3, context.additionalPrimaryAllowance + context.controlVpForProjection, context.remainingPrimaryGameVp);
  } else {
    const nextRound = Math.min(5, context.round + 1);
    nextCheckpointTiming = nextRound >= 5 ? "Round 5 end of turn" : `Round ${nextRound} Command phase`;
    if (!context.controlSatisfied && !controlled) stagingVpLeverage = 3;
    else if (soleControlledNonHome) stagingVpLeverage = 3;
  }

  let reason;
  if (vpLeverage > 0) {
    reason = soleControlledNonHome
      ? "This is the only controlled non-home objective; losing it can lose the binary 3 VP Reconnaissance Sweep control condition at the active checkpoint."
      : "No non-home objective is currently controlled; taking this one can satisfy the binary 3 VP Reconnaissance Sweep control condition."
  } else if (stagingVpLeverage > 0) {
    reason = `${context.round >= 2 ? "The current Command checkpoint has already passed, so this cannot score retroactively. " : ""}Controlling this non-home objective can stage the 3 VP condition for the ${nextCheckpointTiming}.`;
  } else if (context.controlSatisfied) {
    reason = "The binary non-home control condition is already covered by another objective, so this objective does not add another 3 VP by itself."
  } else {
    reason = "This non-home objective has no immediate Reconnaissance Sweep control leverage in the current timing window."
  }

  const score = clamp01(
    vpLeverage > 0 ? 0.68 + vpLeverage / 15 :
      stagingVpLeverage > 0 ? 0.38 :
        controlled ? 0.12 : 0.08
  );
  return Object.freeze({
    active: true,
    score,
    vpLeverage,
    stagingVpLeverage,
    nextCheckpointTiming,
    ownHome: false,
    nonHome: true,
    controlled,
    soleControlledNonHome,
    purpose,
    reason
  });
}
