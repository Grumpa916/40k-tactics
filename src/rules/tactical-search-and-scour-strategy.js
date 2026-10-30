import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getRemainingPrimaryVictoryPoints } from "../engine/victory-points-ledger.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getDeathTrapTerrainAreasForPosition } from "./death-trap-state.js";
import { getLiveUnitPosition } from "./spatial-context.js";
import { getUnitStateAtTurnStart } from "./scoring-evidence-state.js";
import { getTerritoryStatusForPosition } from "./battlefield-territory.js";
import {
  getSearchAndScourState,
  isSearchAndScourCentralObjective,
  isSearchAndScourMissionForPlayer
} from "./search-and-scour-state.js";
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
    entry.category === "primary" && entry.missionDefinitionId === missionId && entry.round === round && entry.turn === turn
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

function commandCheckpointCompleted(round, phase) {
  return round >= 2 && round <= 4 && String(phase ?? "") !== "command";
}

function targetOpportunity(state, search, targetUnitId) {
  if (!targetUnitId) {
    return Object.freeze({
      active: false,
      startedInTerrain: false,
      terrainAreaIds: Object.freeze([]),
      terrainKillVpLeverage: 0,
      territoryBlocker: false,
      territoryStatus: "unknown",
      endgameVpLeverage: 0
    });
  }
  const start = getUnitStateAtTurnStart(state, targetUnitId, search.turn);
  const terrainAreaIds = Object.freeze(getDeathTrapTerrainAreasForPosition(state, start?.position).map((entry) => entry.terrainAreaId));
  const target = (state?.units ?? []).find((unit) => unit?.id === targetUnitId) ?? null;
  const position = target ? getLiveUnitPosition(state, target) : null;
  const territory = getTerritoryStatusForPosition(state, { playerId: search.playerId, position });
  const territoryBlocker = territory.territory === "mine" && territory.confidence !== "low";
  return Object.freeze({
    active: true,
    startedInTerrain: terrainAreaIds.length > 0,
    terrainAreaIds,
    terrainKillVpLeverage: !search.terrainKillSatisfied && terrainAreaIds.length > 0 ? 2 : 0,
    territoryBlocker,
    territoryStatus: territory.territory,
    territoryConfidence: territory.confidence,
    distanceToTerritoryBoundary: territory.distanceToBoundary,
    endgameVpLeverage: territoryBlocker ? 5 : 0
  });
}

export { isSearchAndScourMissionForPlayer } from "./search-and-scour-state.js";

export function getSearchAndScourPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isSearchAndScourMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Search and Scour strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const search = getSearchAndScourState(state, { playerId, perspectivePlayerId });
  const round = search.round;
  const turn = search.turn;
  const phase = state?.phase ?? null;
  const awardsThisTurn = currentTurnMissionAwards(state, playerId, mission.id, round, turn);
  const actualMissionVpThisTurn = awardsThisTurn.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const remainingPrimaryGameVp = primaryGameRemaining(state, playerId);
  const checkpointCompleted = commandCheckpointCompleted(round, phase);
  const commandAwardAmount = round >= 2 && round <= 4 ? commandAwardAmountForTurn(awardsThisTurn) : 0;
  const controlVpForProjection = round < 2
    ? 0
    : round <= 4
      ? checkpointCompleted ? commandAwardAmount : search.nonHomeControlRawVp
      : search.nonHomeControlRawVp;
  const rawAdvisoryVp = search.centralControlVp + search.terrainKillVp + controlVpForProjection;
  const cappedAdvisoryVp = projectedMissionPrimaryVp(rawAdvisoryVp, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const opportunity = targetOpportunity(state, { ...search, playerId }, targetUnitId);
  const nextKillVpLeverage = Math.min(additionalPrimaryAllowance, opportunity.terrainKillVpLeverage);
  const endgameTerritoryVp = search.territoryClearLikelyByMap ? Math.min(5, remainingPrimaryGameVp) : 0;
  const targetEndgameVpLeverage = Math.min(opportunity.endgameVpLeverage, remainingPrimaryGameVp);

  let targetingScore = 0.05;
  if (opportunity.terrainKillVpLeverage > 0) targetingScore += 0.34;
  if (opportunity.territoryBlocker) targetingScore += round >= 5 ? 0.46 : round >= 4 ? 0.3 : 0.16;
  if (opportunity.terrainKillVpLeverage > 0 && opportunity.territoryBlocker) targetingScore += 0.08;
  if (remainingPrimaryGameVp === 0) targetingScore = Math.min(targetingScore, 0.08);
  targetingScore = clamp01(targetingScore);

  let objectivePreservationScore = 0.3;
  if (search.centralControlledCount === 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.72);
  if (round >= 2 && !checkpointCompleted && search.nonHomeControlledCount > 0) objectivePreservationScore = Math.max(objectivePreservationScore, 0.8);
  if (round === 5 && search.nonHomeControlledCount > 0) objectivePreservationScore = Math.max(objectivePreservationScore, 0.9);
  if (remainingPrimaryGameVp === 0) objectivePreservationScore = Math.min(objectivePreservationScore, 0.15);

  const centralProgress = !search.controlKnown
    ? "Objective control is incomplete; confirm central-objective control before relying on the 3 VP end-of-turn condition."
    : search.centralControlledCount > 0
      ? "At least one central objective is controlled, supporting the 3 VP end-of-turn condition."
      : "No central objective is controlled; gaining one is worth 3 VP at end of turn before caps.";
  const killProgress = search.terrainKillSatisfied
    ? `${search.qualifyingKills.length} enemy destruction${search.qualifyingKills.length === 1 ? "" : "s"} began the turn in a terrain area; the single 2 VP destruction condition is satisfied for this turn.`
    : search.enemyKillsThisTurn > 0
      ? `${search.enemyKillsThisTurn} enemy destruction${search.enemyKillsThisTurn === 1 ? " is" : "s are"} recorded this turn, but saved turn-start map evidence does not place one in a terrain area.`
      : "No qualifying terrain-start destruction is recorded this turn; the first enemy destroyed after starting the turn in any terrain area can add 2 VP.";
  const controlProgress = round < 2
    ? "The 4 VP-per-non-home-objective checkpoint begins in Round 2."
    : !search.controlKnown
      ? "Objective control is incomplete; confirm controllers before relying on per-objective Search and Scour scoring."
      : checkpointCompleted
        ? `The Round ${round} Command checkpoint has passed; ${commandAwardAmount} VP from that checkpoint is recorded. New captures stage the next checkpoint rather than scoring retroactively.`
        : `${search.nonHomeControlledCount} non-home objective${search.nonHomeControlledCount === 1 ? " is" : "s are"} controlled, representing ${search.nonHomeControlRawVp} raw VP at the current ${round === 5 ? "end-of-turn" : "Command"} checkpoint before caps.`;
  const territoryProgress = search.territoryBlockerCandidates.length > 0
    ? `${search.territoryBlockerCandidates.length} enemy unit${search.territoryBlockerCandidates.length === 1 ? " is" : "s are"} mapped clearly inside your territory and can block the 5 VP end-of-battle condition; confirm whole-unit placement on the tabletop.`
    : search.uncertainTerritoryEnemies.length > 0
      ? `${search.uncertainTerritoryEnemies.length} enemy unit${search.uncertainTerritoryEnemies.length === 1 ? " is" : "s are"} near the territory boundary or lack reliable position evidence, so the 5 VP endgame condition needs tabletop confirmation.`
      : "No live enemy unit is mapped inside or near your territory boundary; the map supports the 5 VP endgame condition, subject to tabletop confirmation that no enemy unit is wholly within your territory.";

  let reason;
  if (opportunity.terrainKillVpLeverage > 0 && opportunity.territoryBlocker) {
    reason = `This target began the turn in terrain and is currently mapped inside your territory. Destroying it can satisfy the 2 VP terrain-kill condition while also removing a likely blocker to the 5 VP endgame condition.`;
  } else if (opportunity.terrainKillVpLeverage > 0) {
    reason = `This target began the turn in terrain (${opportunity.terrainAreaIds.join(", ")}). Destroying it can satisfy the single 2 VP Search and Scour destruction condition this turn.`;
  } else if (opportunity.territoryBlocker) {
    reason = `This target is mapped clearly inside your territory. Removing or forcing it out protects the 5 VP end-of-battle Search and Scour condition, especially in the late game.`;
  } else if (search.centralControlledCount === 0) {
    reason = "Central control is the repeatable 3 VP end-of-turn lever. Secure a central objective without giving up higher-value non-home control.";
  } else if (round >= 2 && !checkpointCompleted && search.nonHomeControlledCount < 3) {
    reason = "Each additional non-home objective is worth 4 VP at the active control checkpoint, making objective spread the highest scalable Search and Scour lever until the round cap is filled.";
  } else if (search.territoryBlockerCandidates.length > 0) {
    reason = "Current round scoring is stable, but enemy units inside your territory threaten the 5 VP endgame condition. Plan to clear or displace them before battle end.";
  } else {
    reason = "Search and Scour is currently on plan: preserve central control, maximize safe non-home objectives at the applicable checkpoint, and look for the once-per-turn 2 VP terrain-start kill without overcommitting.";
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
    controlStateKnown: search.controlKnown,
    centralObjectiveIds: search.centralObjectiveIds,
    centralControlledIds: search.centralControlledIds,
    centralControlledCount: search.centralControlledCount,
    centralControlVp: search.centralControlVp,
    nonHomeControlledIds: search.nonHomeControlledIds,
    nonHomeControlledCount: search.nonHomeControlledCount,
    nonHomeControlRawVp: search.nonHomeControlRawVp,
    commandCheckpointCompleted: checkpointCompleted,
    commandAwardAmount,
    controlVpForProjection,
    enemyKillsThisTurn: search.enemyKillsThisTurn,
    qualifyingTerrainKills: search.qualifyingKills,
    terrainKillSatisfied: search.terrainKillSatisfied,
    terrainKillVp: search.terrainKillVp,
    territoryBlockerCandidates: search.territoryBlockerCandidates,
    territoryBlockerUnitIds: Object.freeze(search.territoryBlockerCandidates.map((entry) => entry.unitId)),
    uncertainTerritoryEnemies: search.uncertainTerritoryEnemies,
    territoryClearLikelyByMap: search.territoryClearLikelyByMap,
    endgameTerritoryVp,
    targetOpportunity: opportunity,
    nextKillVpLeverage,
    targetEndgameVpLeverage,
    actualMissionVpThisTurn,
    additionalPrimaryAllowance,
    remainingPrimaryGameVp,
    rawAdvisoryVp,
    cappedAdvisoryVp,
    targetingScore,
    objectivePreservationScore,
    protectCheapUnits: false,
    summary: Object.freeze([
      centralProgress,
      killProgress,
      controlProgress,
      territoryProgress,
      `Current recorded Search and Scour conditions project ${cappedAdvisoryVp}/15 Primary VP this round before tabletop confirmation.`
    ]),
    reason,
    assumptions: Object.freeze([
      "The 3 VP central-objective condition and 2 VP terrain-start destruction condition each score once at end of your turn.",
      "The terrain-start destruction condition is binary: destroying multiple qualifying enemy units does not add more than 2 VP that turn.",
      "From Round 2, each controlled non-home objective is worth 4 VP at the Command checkpoint, except Round 5 when it is checked at end of turn.",
      "Saved turn-start positions and verified Event Companion terrain polygons are advisory evidence for whether a destroyed enemy began the turn in a terrain area.",
      "The end-of-battle condition requires no enemy unit to be wholly within your territory. Unit map positions cannot prove whole-model placement, so tabletop confirmation remains authoritative.",
      "Enemy units mapped more than the territory uncertainty band inside your territory are treated as likely blockers, not automatic rules determinations.",
      "Primary scoring is capped at 15 VP per battle round and 45 VP for the battle; end-of-battle VP remains subject to the game cap."
    ])
  });
}

export function getSearchAndScourObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId || !isSearchAndScourMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Search and Scour is not active for this objective." });
  }
  const strategy = primaryStrategy ?? getSearchAndScourPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const objective = (state?.objectives ?? []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Objective is not available." });

  const ownHome = isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId);
  const central = isSearchAndScourCentralObjective(objective);
  const controlled = control === "controlled" || (objective.control?.controlState === "controlled" && objective.control?.controllerId === playerId);

  let centralVpLeverage = 0;
  if (central) {
    if (controlled && strategy.centralControlledCount === 1) centralVpLeverage = 3;
    if (!controlled && strategy.centralControlledCount === 0) centralVpLeverage = 3;
  }

  let nonHomeVpLeverage = 0;
  let nextCheckpointVpLeverage = 0;
  if (!ownHome && strategy.round >= 2) {
    if (strategy.round === 5 || !strategy.commandCheckpointCompleted) nonHomeVpLeverage = 4;
    else nextCheckpointVpLeverage = 4;
  }

  const rawCurrentVpLeverage = centralVpLeverage + nonHomeVpLeverage;
  const vpLeverage = Math.min(strategy.additionalPrimaryAllowance, rawCurrentVpLeverage);
  let score = 0.08 + vpLeverage * 0.08 + nextCheckpointVpLeverage * 0.035;
  if (central) score += 0.12;
  if (!ownHome && strategy.round >= 2) score += 0.12;
  if (controlled && rawCurrentVpLeverage > 0) score += 0.08;
  if (strategy.round === 5 && !ownHome) score += 0.07;
  if (ownHome) score = Math.min(score, 0.22);
  if (strategy.remainingPrimaryGameVp === 0) score = Math.min(score, 0.12);
  score = clamp01(score);

  let reason;
  if (ownHome) {
    reason = central ? "Your home objective does not score the 4 VP non-home condition; only its central-role value would matter if applicable." : "Your home objective is excluded from Search and Scour's 4 VP-per-objective condition.";
  } else if (central && centralVpLeverage > 0 && nonHomeVpLeverage > 0) {
    reason = `This central non-home objective can support both the 3 VP end-of-turn central condition and 4 VP at the active control checkpoint, for up to ${vpLeverage} current-round VP before caps.`;
  } else if (centralVpLeverage > 0) {
    reason = "This objective is important for the 3 VP central-control condition at end of turn.";
  } else if (nonHomeVpLeverage > 0) {
    reason = "This non-home objective is worth 4 VP at the active Search and Scour control checkpoint before caps.";
  } else if (nextCheckpointVpLeverage > 0) {
    reason = "The current Command checkpoint has passed; controlling this non-home objective now stages 4 VP for the next Search and Scour checkpoint rather than scoring retroactively.";
  } else {
    reason = "This objective has ordinary board-control value but no additional immediate Search and Scour leverage beyond the current plan.";
  }

  return Object.freeze({
    active: true,
    score,
    vpLeverage,
    rawVpLeverage: rawCurrentVpLeverage,
    centralVpLeverage,
    nonHomeVpLeverage,
    nextCheckpointVpLeverage,
    ownHome,
    central,
    controlled,
    purpose,
    reason
  });
}
