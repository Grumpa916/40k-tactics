import test from "node:test";
import assert from "node:assert/strict";
import { getEventCompanionMapForForceDispositions } from "../../src/rules/event-companion-map-catalog.js";
import { createTurnSnapshot } from "../../src/rules/scoring-evidence-state.js";
import {
  getExtractRelicCentralObjectiveOptions,
  getExtractRelicMarkerRemovalOptions,
  getExtractRelicState
} from "../../src/rules/extract-relic-state.js";
import {
  getLocateAndDenySetup,
  getLocateAndDenyState,
  getLocateAndDenyTerrainOptions
} from "../../src/rules/locate-and-deny-state.js";
import { getMissionActionOptions } from "../../src/rules/mission-action-state.js";
import { getShootingCandidates } from "../../src/rules/shooting-candidates.js";
import { getPrimaryObjectiveStrategySignal, getPrimaryStrategyContext } from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { recordShootingActivation } from "../../src/engine/shooting-transitions.js";
import { createMissionActionPicker } from "../../src/ui/mission-action-picker.js";
import { createGameSession } from "../../src/application/game-session.js";
import { activateShootingUnit, recordShootingActivation as recordApplicationShootingActivation } from "../../src/application/shooting-workflow.js";
import { registerCoreCommandHandlers } from "../../src/engine/register-core-commands.js";

registerCoreCommandHandlers();

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function rosterUnit(id, { move = 8, oc = 3, ranged = false } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons: ranged ? [{ name: "Rifle", type: "ranged", characteristics: { range: 24, attacks: 2, skill: 3, strength: 4, ap: 0, damage: 1 } }] : []
    }
  };
}

function unit(id, ownerId, position, { move = 8, oc = 3, rosterUnitId = id } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status: "deployed",
    position: { ...position },
    wounds: 5,
    startingStrength: 1,
    currentStrength: 1,
    startingWounds: 5,
    metadata: { rosterUnitId, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function setupEvent(terrainAreaIds) {
  return {
    type: "locate_and_deny.setup_recorded",
    payload: {
      playerId: "p2",
      terrainAreaIds: [...terrainAreaIds],
      markerType: "locate-and-deny-operation",
      sourceMissionDefinitionId: "primary-locate-and-deny"
    }
  };
}

function extractAttempt(terrainAreaId, {
  round = 2,
  turn = round,
  unitId = `runner-${round}`,
  objectiveId = "event-companion:Central 1"
} = {}) {
  return {
    type: "shooting.unit_activated",
    payload: {
      unitId,
      playerId: "p1",
      round,
      turn,
      actionType: "mission_action",
      actionId: "primary-extract-relic",
      missionInstanceId: "primary:p1:primary-extract-relic",
      missionDefinitionId: "primary-extract-relic",
      missionName: "Extract Relic — Sensor Sweep",
      reviewTiming: "end-of-turn",
      objectiveId,
      terrainAreaId,
      rulesConfirmed: true
    }
  };
}

function extractReview({ round = 2, turn = round, unitId = `runner-${round}`, outcome = "completed" } = {}) {
  return {
    type: "mission_action.reviewed",
    payload: {
      actionKey: `${round}:${turn}:${unitId}`,
      playerId: "p1",
      checkpoint: "end-of-turn",
      outcome,
      missionInstanceId: "primary:p1:primary-extract-relic",
      round,
      turn
    }
  };
}

function completedExtractSweep(terrainAreaId, options = {}) {
  return [extractAttempt(terrainAreaId, options), extractReview(options)];
}

function primaryAward({ amount, round, turn = round, missionDefinitionId = "other-primary", scoringTiming = "end-of-turn", opportunityKey = null }) {
  return {
    id: `award-${missionDefinitionId}-${round}-${turn}-${amount}-${opportunityKey ?? "x"}`,
    type: "victory_points.awarded",
    payload: {
      playerId: "p1",
      amount,
      category: "primary",
      missionDefinitionId,
      scoringTiming,
      opportunityKey: opportunityKey ?? `${round}:${turn}:${missionDefinitionId}`,
      round,
      turn,
      scoreBefore: 0,
      scoreAfter: amount
    }
  };
}

function commandAward(round = 2, amount = 4) {
  return primaryAward({
    amount,
    round,
    missionDefinitionId: "primary-extract-relic",
    scoringTiming: "command-phase",
    opportunityKey: `${round}:${round}:p1:command-phase`
  });
}

function priorPrimaryAwards(total) {
  const result = [];
  let remaining = total;
  let index = 0;
  while (remaining > 0) {
    const amount = Math.min(15, remaining);
    result.push(primaryAward({
      amount,
      round: index + 1,
      turn: 40 + index,
      missionDefinitionId: `prior-${index}`,
      opportunityKey: `prior:${index}`
    }));
    remaining -= amount;
    index += 1;
  }
  return result;
}

function centroid(points) {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length
  };
}

function seed({ round = 2, phase = "shooting", history = [], centralController = "p1", secondCentralController = null } = {}) {
  const map = getEventCompanionMapForForceDispositions("Priority Assets", "Disruption", "A");
  assert.ok(map, "Extract Relic Layout A geometry must exist");
  const objectives = Object.entries(map.objectivePositions).map(([label, position]) => ({
    id: `event-companion:${label}`,
    name: label,
    layoutObjective: label,
    position: { ...position },
    control: control(
      label === "Attacker Home" ? "p1" :
      label === "Defender Home" ? "p2" :
      /Central 1/i.test(label) ? centralController :
      /Central 2/i.test(label) ? secondCentralController : null
    )
  }));
  const friendlyHome = objectives.find((objective) => objective.layoutObjective === "Attacker Home");
  const enemyHome = objectives.find((objective) => objective.layoutObjective === "Defender Home");
  const central = objectives.find((objective) => /Central 1/i.test(objective.layoutObjective)) ?? objectives.find((objective) => /cent(er|ral)/i.test(objective.layoutObjective));
  const secondCentral = objectives.find((objective) => objective !== central && /cent(er|ral)/i.test(objective.layoutObjective));
  assert.ok(friendlyHome && enemyHome && central, "expected home and central objectives");
  const state = {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Priority Assets", opponentDisposition: "Disruption", layout: "A" } },
    objectives,
    units: [
      unit("runner", "p1", central.position, { rosterUnitId: "r-runner" }),
      unit("holder", "p1", secondCentral?.position ?? central.position, { move: 6, rosterUnitId: "r-holder" }),
      unit("enemy", "p2", enemyHome.position, { move: 6, oc: 2, rosterUnitId: "r-enemy" }),
      unit("enemy-b", "p2", enemyHome.position, { move: 6, oc: 2, rosterUnitId: "r-enemy-b" })
    ],
    history: [...history],
    victoryPoints: { p1: 0, p2: 0 },
    commandPoints: { p1: 2, p2: 2 },
    scoring: {
      turnSnapshots: [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: [rosterUnit("r-runner"), rosterUnit("r-holder", { move: 6 })] },
      p2: { units: [rosterUnit("r-enemy", { move: 6, oc: 2, ranged: true }), rosterUnit("r-enemy-b", { move: 6, oc: 2, ranged: true })] }
    }
  };
  return { state, map, friendlyHome, enemyHome, central, secondCentral };
}

function markerSelection(state) {
  const setup = getLocateAndDenySetup(state, { playerId: "p2", perspectivePlayerId: "p1" });
  const eligible = getLocateAndDenyTerrainOptions(state, { playerId: "p2", perspectivePlayerId: "p1" }).filter((item) => item.eligible);
  assert.ok(eligible.length >= setup.expectedMarkerCount, "expected enough eligible terrain for opponent marker setup");
  return eligible.slice(0, setup.expectedMarkerCount);
}

function withMarkerSetup(state) {
  const selected = markerSelection(state).map((entry) => entry.terrainAreaId);
  return { state: { ...state, history: [...state.history, setupEvent(selected)] }, selected };
}

function strategy(state, targetUnitId = null) {
  return getPrimaryStrategyContext(state, { playerId: "p1", perspectivePlayerId: "p1", targetUnitId });
}

test("Extract Relic routes to its strategy and captures opponent marker setup without consuming Shooting activation", () => {
  const { state } = seed({ round: 1, phase: "shooting" });
  const context = strategy(state);
  assert.equal(context.missionId, "primary-extract-relic");
  assert.equal(context.opponentMarkerSetupComplete, false);
  assert.ok(getMissionActionOptions(state, "p1").some((item) => item.definitionId === "primary-extract-relic"));
  const html = createMissionActionPicker().render(state, "runner");
  assert.match(html, /Record opponent operation markers/);

  const selected = markerSelection(state).map((entry) => entry.terrainAreaId);
  const before = getShootingCandidates(state);
  assert.ok(before.available.includes("runner") || before.actionOnly.includes("runner"));
  const payload = {
    unitId: "runner",
    actionType: "mission_action",
    actionId: "primary-extract-relic",
    missionInstanceId: "primary:p1:primary-extract-relic",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true,
    extractRelicSetupOnly: true,
    extractRelicMarkerSetupTerrainAreaIds: selected
  };
  const session = createGameSession(state);
  const sessionResult = activateShootingUnit(session, payload);
  const applicationResult = recordApplicationShootingActivation(state, payload);
  for (const next of [sessionResult, applicationResult]) {
    assert.equal(getExtractRelicState(next, { playerId: "p1", perspectivePlayerId: "p1" }).opponentMarkerSetupComplete, true);
    assert.equal(next.history.filter((event) => event.type === "shooting.unit_activated").length, 0);
    const after = getShootingCandidates(next);
    assert.ok(after.available.includes("runner") || after.actionOnly.includes("runner"));
  }
  assert.equal(session.getState(), sessionResult);
});

test("Extract Relic Sensor Sweep is once per turn and removes the opponent marker from the shared Locate and Deny pool", () => {
  const seeded = seed({ round: 2, phase: "shooting" });
  const { state, selected } = withMarkerSetup(seeded.state);
  const objectives = getExtractRelicCentralObjectiveOptions(state, { playerId: "p1" });
  const markers = getExtractRelicMarkerRemovalOptions(state, { playerId: "p1" });
  assert.ok(objectives.length > 0);
  assert.equal(markers.length, selected.length);

  const started = recordShootingActivation(state, {
    unitId: "runner",
    actionType: "mission_action",
    actionId: "primary-extract-relic",
    missionInstanceId: "primary:p1:primary-extract-relic",
    objectiveId: objectives[0].objectiveId,
    terrainAreaId: markers[0].terrainAreaId,
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  });
  assert.equal(getExtractRelicState(started, { playerId: "p1" }).sensorSweepUsedThisTurn, true);
  assert.equal(getMissionActionOptions(started, "p1").some((item) => item.definitionId === "primary-extract-relic"), false);

  const completed = {
    ...started,
    history: [...started.history, extractReview({ round: 2, turn: 2, unitId: "runner" })]
  };
  const extract = getExtractRelicState(completed, { playerId: "p1", perspectivePlayerId: "p1" });
  const locate = getLocateAndDenyState(completed, { playerId: "p2", perspectivePlayerId: "p1" });
  assert.equal(extract.activeOpponentMarkerCount, selected.length - 1);
  assert.equal(locate.activeMarkerCount, selected.length - 1);
  assert.ok(locate.removedTerrainAreaIds.includes(markers[0].terrainAreaId));
  assert.equal(strategy(completed).actionVp, 4);
});

test("a failed Extract Relic Sensor Sweep spends the turn use but removes no marker", () => {
  const seeded = seed({ round: 2, phase: "shooting" });
  const { state, selected } = withMarkerSetup(seeded.state);
  const central = getExtractRelicCentralObjectiveOptions(state, { playerId: "p1" })[0];
  const marker = getExtractRelicMarkerRemovalOptions(state, { playerId: "p1" })[0];
  const started = recordShootingActivation(state, {
    unitId: "runner", actionType: "mission_action", actionId: "primary-extract-relic",
    missionInstanceId: "primary:p1:primary-extract-relic", objectiveId: central.objectiveId,
    terrainAreaId: marker.terrainAreaId, reviewTiming: "end-of-turn", rulesConfirmed: true
  });
  const failed = { ...started, history: [...started.history, extractReview({ round: 2, turn: 2, unitId: "runner", outcome: "failed" })] };
  const extract = getExtractRelicState(failed, { playerId: "p1" });
  assert.equal(extract.sensorSweepUsedThisTurn, true);
  assert.equal(extract.sensorSweepCompletedThisTurn, false);
  assert.equal(extract.activeOpponentMarkerCount, selected.length);
});

test("Sensor Sweep becomes unavailable when exactly one opponent marker remains", () => {
  const seeded = seed({ round: 5, phase: "shooting" });
  const { state, selected } = withMarkerSetup(seeded.state);
  selected.slice(0, -1).forEach((terrainAreaId, index) => state.history.push(...completedExtractSweep(terrainAreaId, {
    round: index + 1,
    turn: index + 1,
    unitId: `old-runner-${index}`,
    objectiveId: seeded.central.id
  })));
  const extract = getExtractRelicState(state, { playerId: "p1" });
  assert.equal(extract.activeOpponentMarkerCount, 1);
  assert.equal(extract.sensorSweepAvailable, false);
  assert.equal(getMissionActionOptions(state, "p1").some((item) => item.definitionId === "primary-extract-relic"), false);
});

test("objective-range destruction uses saved turn-start position and is a binary 3 VP condition", () => {
  const seeded = seed({ round: 2, phase: "shooting" });
  const { state } = withMarkerSetup(seeded.state);
  const enemy = state.units.find((item) => item.id === "enemy");
  enemy.position = { ...seeded.central.position };
  state.scoring.turnSnapshots = [createTurnSnapshot(state, { turn: 2, round: 2, playerId: "p1" })];
  enemy.position = { ...seeded.enemyHome.position };

  const before = strategy(state, "enemy");
  assert.equal(before.targetKillOpportunity.mapSupportsQualification, true);
  assert.equal(before.nextKillVpLeverage, 3);
  state.history.push({ type: "unit.destroyed", payload: { unitId: "enemy", ownerId: "p2", round: 2, turn: 2 } });
  const after = strategy(state, "enemy-b");
  assert.equal(after.objectiveRangeKillMapSatisfied, true);
  assert.equal(after.killVp, 3);
  assert.equal(after.nextKillVpLeverage, 0);
});

test("exactly one opponent marker plus friendly presence and no enemy supports both last-marker awards", () => {
  const seeded = seed({ round: 5, phase: "end_turn" });
  const { state, selected } = withMarkerSetup(seeded.state);
  selected.slice(0, -1).forEach((terrainAreaId, index) => state.history.push(...completedExtractSweep(terrainAreaId, {
    round: index + 1, turn: index + 1, unitId: `old-runner-${index}`, objectiveId: seeded.central.id
  })));
  const last = selected.at(-1);
  const terrain = seeded.map.terrainGeometry[last];
  assert.ok(terrain?.points?.length >= 3);
  state.units.find((item) => item.id === "runner").position = centroid(terrain.points);
  state.units.find((item) => item.id === "enemy").position = { ...seeded.enemyHome.position };
  state.units.find((item) => item.id === "enemy-b").position = { ...seeded.enemyHome.position };

  const result = strategy(state);
  assert.equal(result.activeOpponentMarkerCount, 1);
  assert.equal(result.lastMarkerPositionMapSatisfied, true);
  assert.equal(result.lastMarkerVp, 4);
  assert.equal(result.endgameLastMarkerVp, 5);
});

test("end-of-battle last-marker value bypasses a filled 15 VP turn cap but still respects the 45 VP game cap", () => {
  const seeded = seed({ round: 5, phase: "end_turn", history: [primaryAward({ amount: 15, round: 5, missionDefinitionId: "other-primary" })] });
  const { state, selected } = withMarkerSetup(seeded.state);
  selected.slice(0, -1).forEach((terrainAreaId, index) => state.history.push(...completedExtractSweep(terrainAreaId, {
    round: index + 1, turn: index + 1, unitId: `old-runner-${index}`, objectiveId: seeded.central.id
  })));
  const terrain = seeded.map.terrainGeometry[selected.at(-1)];
  state.units.find((item) => item.id === "runner").position = centroid(terrain.points);
  const result = strategy(state);
  assert.equal(result.additionalPrimaryAllowance, 0);
  assert.equal(result.cappedAdvisoryVp, 0);
  assert.equal(result.endgameLastMarkerVp, 5);

  state.history.unshift(...priorPrimaryAwards(30));
  const capped = strategy(state);
  assert.equal(capped.remainingPrimaryGameVp, 0);
  assert.equal(capped.endgameLastMarkerVp, 0);
});

test("Round 2 Command control is binary 4 VP and locks to the recorded checkpoint after Command", () => {
  const seeded = seed({ round: 2, phase: "command", centralController: "p1" });
  const { state } = withMarkerSetup(seeded.state);
  const command = strategy(state);
  assert.equal(command.liveControlVp, 4);
  assert.equal(command.controlVpForRound, 4);

  const moved = { ...state, phase: "movement", history: [...state.history, commandAward(2, 4)] };
  const central = moved.objectives.find((objective) => objective.id === seeded.central.id);
  central.control = control("p2");
  const after = strategy(moved);
  assert.equal(after.controlCheckpointCompleted, true);
  assert.equal(after.controlVpForRound, 4);
});

test("Round 5 uses live non-home control at end of turn", () => {
  const seeded = seed({ round: 5, phase: "movement", centralController: "p1" });
  const { state } = withMarkerSetup(seeded.state);
  const result = strategy(state);
  assert.equal(result.controlCheckpointCompleted, false);
  assert.equal(result.liveControlVp, 4);
  assert.equal(result.controlVpForRound, 4);
});

test("a central non-home objective can combine Sensor Sweep and control leverage without duplicating the binary control award", () => {
  const seeded = seed({ round: 2, phase: "movement", centralController: "p1" });
  const { state } = withMarkerSetup(seeded.state);
  const other = state.objectives.find((objective) => /expansion/i.test(objective.layoutObjective));
  assert.ok(other, "the layout must supply a second non-home objective");
  other.control = control("p1");
  const signal = getPrimaryObjectiveStrategySignal(state, {
    playerId: "p1", perspectivePlayerId: "p1", objectiveId: seeded.central.id
  });
  assert.equal(signal.central, true);
  assert.equal(signal.actionVpLeverage, 4);
  assert.equal(signal.controlVpLeverage, 0);

  other.control = control("p2");
  const soleSignal = getPrimaryObjectiveStrategySignal(state, {
    playerId: "p1", perspectivePlayerId: "p1", objectiveId: seeded.central.id
  });
  assert.equal(soleSignal.controlVpLeverage, 4);
  assert.equal(soleSignal.rawVpLeverage, 8);
});

test("movement routing exposes Extract Relic and prioritizes mission-relevant central or last-marker terrain plans", () => {
  const seeded = seed({ round: 2, phase: "movement", centralController: "p2" });
  const { state } = withMarkerSetup(seeded.state);
  const movement = getMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(movement.primaryStrategy?.missionId, "primary-extract-relic");
  assert.ok((movement.recommendations ?? []).some((entry) =>
    entry.primaryStrategySignal?.eligibleSensorSweepObjective === true ||
    entry.alternatives?.some((alt) => alt.primaryStrategySignal?.eligibleSensorSweepObjective === true)
  ));
});

test("a filled 15 VP turn cap suppresses Extract Relic kill target weighting while leaving future endgame logic independent", () => {
  const seeded = seed({ round: 2, phase: "shooting", history: [primaryAward({ amount: 15, round: 2, missionDefinitionId: "other-primary" })] });
  const { state } = withMarkerSetup(seeded.state);
  const enemy = state.units.find((item) => item.id === "enemy");
  enemy.position = { ...seeded.central.position };
  state.scoring.turnSnapshots = [createTurnSnapshot(state, { turn: 2, round: 2, playerId: "p1" })];
  const result = strategy(state, "enemy");
  assert.equal(result.targetKillOpportunity.mapSupportsQualification, true);
  assert.equal(result.nextKillVpLeverage, 0);
  assert.equal(result.targetCurrentVpLeverage, 0);
  assert.ok(result.targetingScore <= 0.1);
});
