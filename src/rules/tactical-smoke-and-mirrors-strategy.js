import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getRemainingPrimaryVictoryPoints } from "../engine/victory-points-ledger.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getTerritoryStatusForPosition } from "./battlefield-territory.js";
import {
  getSmokeAndMirrorsState,
  isSmokeAndMirrorsMissionForPlayer
} from "./smoke-and-mirrors-state.js";
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

function controlledBy(control, playerId) {
  return control?.controlState === "controlled" && control?.controllerId === playerId;
}

function controlSnapshot(state, playerId, perspectivePlayerId) {
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const home = objectives.filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const homeRoleKnown = home.length > 0;
  const homeIds = Object.freeze(home.map((objective) => objective.id));
  const known = objectives.length > 0 && homeRoleKnown && objectives.every((objective) => objective?.control != null);
  if (!known) {
    return Object.freeze({
      known: false,
      homeRoleKnown,
      homeIds,
      nonHomeControlled: 0,
      nonHomeControlledIds: Object.freeze([])
    });
  }
  const nonHome = objectives.filter((objective) => !homeIds.includes(objective.id));
  const controlled = nonHome.filter((objective) => controlledBy(objective.control, playerId));
  return Object.freeze({
    known: true,
    homeRoleKnown,
    homeIds,
    nonHomeControlled: controlled.length,
    nonHomeControlledIds: Object.freeze(controlled.map((objective) => objective.id))
  });
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

function commandCheckpointCompleted(round, phase) {
  return round >= 2 && round < 5 && String(phase ?? "") !== "command";
}

function territoryForObjective(state, playerId, objective) {
  if (!Number.isFinite(objective?.position?.x) || !Number.isFinite(objective?.position?.y)) {
    return Object.freeze({ territory: "unknown", confidence: "low", distanceToBoundary: null });
  }
  return getTerritoryStatusForPosition(state, { playerId, position: objective.position });
}

export function getSmokeAndMirrorsPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isSmokeAndMirrorsMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Smoke and Mirrors strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const phase = state?.phase ?? null;
  const decoys = getSmokeAndMirrorsState(state, { playerId, perspectivePlayerId });
  const controls = controlSnapshot(state, playerId, perspectivePlayerId);
  const checkpointCompleted = commandCheckpointCompleted(round, phase);
  const awardsThisTurn = currentTurnMissionAwards(state, playerId, mission.id, round, turn);
  const actualMissionVpThisTurn = awardsThisTurn.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const commandAwardAmount = round >= 2 && round < 5 ? commandAwardAmountForTurn(awardsThisTurn) : 0;
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const remainingPrimaryGameVp = primaryGameRemaining(state, playerId);
  const liveControlVp = round >= 2 && controls.known && controls.nonHomeControlled > 0 ? 4 : 0;
  const controlVpForRoundCap = round < 2
    ? 0
    : checkpointCompleted
      ? commandAwardAmount
      : liveControlVp;
  const rawRecordedVp = decoys.recurringDecoyVp + controlVpForRoundCap;
  const cappedRecordedVp = projectedMissionPrimaryVp(rawRecordedVp, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const projectedAdditionalThisTurn = Math.max(0, cappedRecordedVp - actualMissionVpThisTurn);
  const remainingGameAfterProjectedTurn = Math.max(0, remainingPrimaryGameVp - projectedAdditionalThisTurn);
  const endgameVpIfThreshold = decoys.endgameThresholdMet ? Math.min(10, remainingGameAfterProjectedTurn) : 0;
  const remainingRoundCap = Math.max(0, 15 - Math.min(15, rawRecordedVp));

  let objectivePreservationScore = decoys.decoyCount > 0 ? 0.7 : 0.42;
  if (decoys.enemyTerritoryDecoyObjectiveIds.length > 0) objectivePreservationScore = Math.max(objectivePreservationScore, 0.88);
  if (decoys.decoyCount >= 3) objectivePreservationScore = Math.max(objectivePreservationScore, 0.95);
  if (remainingPrimaryGameVp === 0) objectivePreservationScore = Math.min(objectivePreservationScore, 0.2);

  const decoyProgress = decoys.decoyCount === 0
    ? "No completed Decoy markers are currently recorded. Each completed non-home Decoy is worth 2 VP at every end-of-turn checkpoint while it remains on the battlefield."
    : `${decoys.decoyCount} objective${decoys.decoyCount === 1 ? " is" : "s are"} currently decoyed for ${decoys.recurringDecoyVp} raw end-of-turn VP; ${decoys.enemyTerritoryDecoyObjectiveIds.length} confirmed enemy-territory decoy${decoys.enemyTerritoryDecoyObjectiveIds.length === 1 ? " receives" : "s receive"} the cumulative +2 VP bonus.`;
  const pendingProgress = decoys.pendingObjectiveIds.length > 0
    ? `${decoys.pendingObjectiveIds.length} Decoy attempt${decoys.pendingObjectiveIds.length === 1 ? " is" : "s are"} awaiting the end-of-turn control check before becoming persistent markers.`
    : "No Decoy attempts are currently awaiting completion.";
  const controlProgress = round < 2
    ? "The binary 4 VP non-home control condition begins in Round 2."
    : !controls.known
      ? "Objective control or home-objective role evidence is incomplete; no exact 4 VP control projection is assumed."
      : checkpointCompleted
        ? `The Round ${round} Command checkpoint has passed; ${commandAwardAmount} VP from that completed control checkpoint is recorded for cap projection.`
        : controls.nonHomeControlled > 0
          ? "At least one non-home objective is controlled, satisfying the 4 VP control condition at the current applicable checkpoint before caps."
          : "No non-home objective is currently controlled; taking one can satisfy the 4 VP control condition at the current applicable checkpoint.";
  const endgameProgress = decoys.endgameThresholdMet
    ? `The four-decoy endgame threshold is currently met; it can contribute up to ${endgameVpIfThreshold} additional VP at end of battle after the 45 VP Primary game cap.`
    : `${decoys.decoysNeededForEndgame} more persistent Decoy marker${decoys.decoysNeededForEndgame === 1 ? " is" : "s are"} needed to reach the 10 VP end-of-battle threshold.`;

  let reason;
  if (!decoys.homeRoleKnown) {
    reason = "Confirm the home-objective role before relying on Decoy eligibility. Smoke and Mirrors cannot Decoy your home objective, so the advisor fails closed when that role is unknown.";
  } else if (remainingPrimaryGameVp === 0) {
    reason = "The 45 VP Primary game cap is already filled, so additional Decoys or objective control should not distort tactical priorities for Primary scoring.";
  } else if (decoys.decoyCount < 4) {
    reason = "Build persistent Decoy coverage while preserving action economy. Enemy-territory objectives are premium targets because each completed marker scores 4 VP every end turn and also advances the four-decoy endgame threshold.";
  } else if (decoys.enemyTerritoryDecoyObjectiveIds.length > 0) {
    reason = "The endgame threshold is established. Protect the existing marker network—especially enemy-territory decoys—and use new Decoys only when they add useful recurring VP within the remaining Primary caps.";
  } else {
    reason = "The four-decoy threshold is established. Preserve marker survival and the binary non-home control condition rather than sacrificing units merely to create redundant markers.";
  }

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Disruption",
    missionId: mission.id,
    missionName: mission.name,
    round,
    phase,
    turn,
    targetUnitId,
    homeRoleKnown: decoys.homeRoleKnown,
    playerHomeObjectiveIds: decoys.playerHomeObjectiveIds,
    objectiveStateKnown: controls.known,
    nonHomeControlled: controls.nonHomeControlled,
    nonHomeControlledObjectiveIds: controls.nonHomeControlledIds,
    commandCheckpointCompleted: checkpointCompleted,
    commandAwardAmount,
    liveControlVp,
    controlVpForRoundCap,
    decoyObjectiveIds: decoys.decoyObjectiveIds,
    enemyTerritoryDecoyObjectiveIds: decoys.enemyTerritoryDecoyObjectiveIds,
    territoryUncertainDecoyObjectiveIds: decoys.territoryUncertainDecoyObjectiveIds,
    pendingDecoyObjectiveIds: decoys.pendingObjectiveIds,
    decoyCount: decoys.decoyCount,
    recurringDecoyVp: decoys.recurringDecoyVp,
    endgameThresholdMet: decoys.endgameThresholdMet,
    decoysNeededForEndgame: decoys.decoysNeededForEndgame,
    endgameVpIfThreshold,
    actualMissionVpThisTurn,
    additionalPrimaryAllowance,
    remainingPrimaryGameVp,
    rawRecordedVp,
    cappedRecordedVp,
    remainingRoundCap,
    remainingGameAfterProjectedTurn,
    nextKillVpLeverage: 0,
    targetingScore: 0.05,
    objectivePreservationScore,
    protectCheapUnits: false,
    summary: Object.freeze([
      "Any battle round: each active Decoy scores 2 VP at end of turn, plus a cumulative +2 VP for each Decoy in enemy territory.",
      decoyProgress,
      pendingProgress,
      controlProgress,
      endgameProgress,
      `Current Smoke and Mirrors conditions project ${cappedRecordedVp}/15 Primary VP for this turn after recorded awards and caps.`
    ]),
    reason,
    assumptions: Object.freeze([
      "A Decoy becomes persistent only after its Action review is confirmed completed at end of turn; an attempt alone is not treated as a marker.",
      "A completed Decoy continues scoring on later turns while its operation marker remains on the battlefield; friendly control is not required for the recurring Decoy VP after placement.",
      "Enemy-territory bonuses use verified Event Companion territory geometry. Objectives inside the map uncertainty band receive only the certain 2 VP base value until confirmed.",
      "Rounds 2-4 resolve the binary 4 VP non-home control condition in the Command phase; Round 5 resolves it at end of turn.",
      "The binary 4 VP control condition does not multiply for extra non-home objectives; additional objectives provide resilience only.",
      "The 10 VP four-decoy endgame award is separate from the 15 VP battle-round cap but still respects the 45 VP Primary game cap.",
      "Smoke and Mirrors has no direct kill-scoring condition, so target destruction receives no automatic Primary VP premium.",
      "Recorded mission_marker.removed events remove Decoys from persistent state; approximate map proximity never removes a marker automatically."
    ])
  });
}

export function getSmokeAndMirrorsObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const context = primaryStrategy ?? getSmokeAndMirrorsPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context?.active) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });

  const ownHome = context.playerHomeObjectiveIds.includes(objectiveId) || isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId);
  const decoyed = context.decoyObjectiveIds.includes(objectiveId);
  const pendingDecoy = context.pendingDecoyObjectiveIds.includes(objectiveId);
  const controlledNow = control === "controlled" || controlledBy(objective.control, playerId);
  const territory = territoryForObjective(state, playerId, objective);
  const enemyTerritory = territory.territory === "opponent";
  const territoryKnown = !["boundary", "unknown"].includes(territory.territory);

  if (ownHome) {
    return Object.freeze({
      active: true,
      ownHome: true,
      nonHome: false,
      decoyed: false,
      pendingDecoy: false,
      controlledNow,
      purpose,
      vpLeverage: 0,
      decoyActionVpLeverage: 0,
      controlVpLeverage: 0,
      stagingVpLeverage: 0,
      endgameVpLeverage: 0,
      score: 0.04,
      reason: "Your home objective cannot be Decoyed and does not satisfy Smoke and Mirrors' binary non-home control condition."
    });
  }

  if (!context.homeRoleKnown) {
    return Object.freeze({
      active: true,
      ownHome: false,
      nonHome: null,
      decoyed,
      pendingDecoy,
      controlledNow,
      purpose,
      vpLeverage: 0,
      decoyActionVpLeverage: 0,
      controlVpLeverage: 0,
      stagingVpLeverage: 0,
      endgameVpLeverage: 0,
      score: 0.08,
      reason: "Home-objective roles are incomplete, so the advisor will not assume this objective is eligible for a Decoy or non-home control scoring."
    });
  }

  const recurringValue = 2 + (enemyTerritory ? 2 : 0);
  const rawProspectiveDecoyVp = decoyed ? 0 : recurringValue;
  let rawControlVpLeverage = 0;
  let stagingVpLeverage = 0;
  let controlPreservationVpLeverage = 0;

  if (context.round >= 2 && context.objectiveStateKnown) {
    if (context.commandCheckpointCompleted) {
      const establishesNextCheckpoint = context.nonHomeControlled === 0 && !controlledNow;
      const preservesOnlyNextCheckpoint = context.nonHomeControlled === 1 && controlledNow;
      stagingVpLeverage = context.remainingPrimaryGameVp > 0 && (establishesNextCheckpoint || preservesOnlyNextCheckpoint) ? 4 : 0;
    } else if (context.nonHomeControlled === 0 && !controlledNow) {
      rawControlVpLeverage = 4;
    } else if (context.nonHomeControlled === 1 && controlledNow) {
      const withoutControl = projectedMissionPrimaryVp(
        Math.max(0, context.rawRecordedVp - 4),
        context.actualMissionVpThisTurn,
        context.additionalPrimaryAllowance
      );
      controlPreservationVpLeverage = Math.max(0, context.cappedRecordedVp - withoutControl);
    }
  }

  const prospectiveProjectedVp = projectedMissionPrimaryVp(
    context.rawRecordedVp + rawProspectiveDecoyVp + rawControlVpLeverage,
    context.actualMissionVpThisTurn,
    context.additionalPrimaryAllowance
  );
  const prospectiveSameTurnGain = Math.max(0, prospectiveProjectedVp - context.cappedRecordedVp);
  let prospectiveRemaining = prospectiveSameTurnGain;
  const decoyGain = Math.min(rawProspectiveDecoyVp, prospectiveRemaining);
  prospectiveRemaining -= decoyGain;
  const controlVpLeverage = Math.min(rawControlVpLeverage, prospectiveRemaining);
  const decoyActionVpLeverage = !decoyed && !pendingDecoy ? decoyGain : 0;
  const pendingCompletionVpLeverage = pendingDecoy ? decoyGain : 0;

  const wouldReachEndgameThreshold = !decoyed && context.decoyCount === 3;
  const pendingWouldReachEndgameThreshold = pendingDecoy && context.decoyCount === 3;
  const remainingGameAfterProspective = Math.max(0, context.remainingGameAfterProjectedTurn - prospectiveSameTurnGain);
  const endgameVpLeverage = (wouldReachEndgameThreshold || pendingWouldReachEndgameThreshold)
    ? Math.min(10, remainingGameAfterProspective)
    : 0;
  const directVpLeverage = prospectiveSameTurnGain + controlPreservationVpLeverage;

  let score = 0.05;
  if (decoyActionVpLeverage > 0) score = Math.max(score, 0.28 + 0.46 * clamp01(decoyActionVpLeverage / 4));
  if (pendingCompletionVpLeverage > 0) score = Math.max(score, 0.72);
  if (controlVpLeverage > 0 || controlPreservationVpLeverage > 0) score = Math.max(score, 0.62);
  if (stagingVpLeverage > 0) score = Math.max(score, 0.42);
  if (endgameVpLeverage > 0) score = Math.max(score, 0.96);
  if (decoyed) score = Math.max(score, enemyTerritory ? 0.54 : 0.4);
  if (context.remainingPrimaryGameVp === 0) score = Math.min(score, 0.05);

  let reason;
  if (context.remainingPrimaryGameVp === 0) {
    reason = "The 45 VP Primary game cap is already filled, so this objective has no additional Smoke and Mirrors scoring premium.";
  } else if (pendingDecoy) {
    reason = `A Decoy attempt is already pending here. Preserve control through end of turn so it can become a persistent ${territoryKnown ? recurringValue : 2}+ VP-per-turn marker${endgameVpLeverage > 0 ? ` and complete the four-Decoy threshold worth up to ${endgameVpLeverage} VP at end of battle` : ""}.`;
  } else if (decoyed) {
    reason = enemyTerritory
      ? "This objective is already Decoyed in enemy territory and is worth 4 VP at each end-of-turn checkpoint while the marker survives. Friendly control is not required for that recurring Decoy VP."
      : "This objective is already Decoyed and is worth 2 VP at each end-of-turn checkpoint while the marker survives. Friendly control is not required for that recurring Decoy VP.";
  } else if (endgameVpLeverage > 0) {
    reason = `Completing a Decoy here can add ${decoyActionVpLeverage} same-turn VP after caps and establish the fourth persistent marker, unlocking up to ${endgameVpLeverage} VP at end of battle.`;
  } else if (decoyActionVpLeverage > 0) {
    reason = enemyTerritory
      ? `This is a premium Decoy target: a completed marker can add ${decoyActionVpLeverage} same-turn VP after caps and is worth 4 raw VP every later end turn while it survives.`
      : territoryKnown
        ? `A completed Decoy here can add ${decoyActionVpLeverage} same-turn VP after caps and is worth 2 raw VP every later end turn while it survives.`
        : `A completed Decoy here has a certain 2 VP recurring base value; the +2 enemy-territory bonus is not assumed because this objective lies in the map's territory uncertainty band.`;
  } else if (controlVpLeverage > 0) {
    reason = `Taking this non-home objective can add ${controlVpLeverage} same-turn Primary VP through Smoke and Mirrors' binary control condition after caps.`;
  } else if (controlPreservationVpLeverage > 0) {
    reason = `Preserve this objective: losing your only non-home control can remove ${controlPreservationVpLeverage} same-turn Primary VP after caps.`;
  } else if (stagingVpLeverage > 0) {
    reason = controlledNow
      ? "The current Command checkpoint has passed. Preserving this only controlled non-home objective protects the next binary 4 VP control checkpoint."
      : "The current Command checkpoint has passed. Control here cannot score retroactively, but it establishes the next binary 4 VP non-home control checkpoint.";
  } else {
    reason = "This objective does not currently add Smoke and Mirrors VP after the applicable caps; additional non-home control can add resilience but does not multiply the binary 4 VP condition."
  }

  return Object.freeze({
    active: true,
    ownHome: false,
    nonHome: true,
    decoyed,
    pendingDecoy,
    controlledNow,
    enemyTerritory,
    territoryKnown,
    territory: territory.territory,
    purpose,
    recurringDecoyVp: recurringValue,
    vpLeverage: directVpLeverage,
    decoyActionVpLeverage,
    pendingCompletionVpLeverage,
    controlVpLeverage,
    controlPreservationVpLeverage,
    stagingVpLeverage,
    endgameVpLeverage,
    prospectiveSameTurnGain,
    remainingGameAfterProspective,
    score: clamp01(score),
    reason
  });
}
