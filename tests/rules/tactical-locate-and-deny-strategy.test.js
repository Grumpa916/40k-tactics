import test from "node:test";
import assert from "node:assert/strict";
import { getEventCompanionMapForForceDispositions } from "../../src/rules/event-companion-map-catalog.js";
import {
  getLocateAndDenyCentralObjectiveOptions,
  getLocateAndDenyMarkerRemovalOptions,
  getLocateAndDenySetup,
  getLocateAndDenyState,
  getLocateAndDenyTerrainOptions
} from "../../src/rules/locate-and-deny-state.js";
import { getPrimaryStrategyContext, getPrimaryObjectiveStrategySignal } from "../../src/rules/tactical-primary-strategy-router.js";
import { getMissionActionOptions } from "../../src/rules/mission-action-state.js";
import { getShootingCandidates } from "../../src/rules/shooting-candidates.js";
import { recordShootingActivation } from "../../src/engine/shooting-transitions.js";
import { createMissionActionPicker } from "../../src/ui/mission-action-picker.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function rosterUnit(id, { move = 8, oc = 3 } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons: []
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
      playerId: "p1",
      terrainAreaIds: [...terrainAreaIds],
      markerType: "locate-and-deny-operation",
      sourceMissionDefinitionId: "primary-locate-and-deny"
    }
  };
}

function sweepAttempt(terrainAreaId, { round = 1, turn = round, unitId = `sweep-${round}` } = {}) {
  return {
    type: "shooting.unit_activated",
    payload: {
      unitId,
      playerId: "p1",
      round,
      turn,
      actionType: "mission_action",
      actionId: "primary-locate-and-deny",
      missionInstanceId: "primary:p1:primary-locate-and-deny",
      missionDefinitionId: "primary-locate-and-deny",
      missionName: "Locate and Deny — Sensor Sweep",
      reviewTiming: "end-of-turn",
      objectiveId: "event-companion:Central 1",
      terrainAreaId,
      rulesConfirmed: true
    }
  };
}

function sweepReview({ round = 1, turn = round, unitId = `sweep-${round}`, outcome = "completed" } = {}) {
  return {
    type: "mission_action.reviewed",
    payload: {
      actionKey: `${round}:${turn}:${unitId}`,
      playerId: "p1",
      checkpoint: "end-of-turn",
      outcome,
      missionInstanceId: "primary:p1:primary-locate-and-deny",
      round,
      turn
    }
  };
}

function completedSweep(terrainAreaId, options = {}) {
  return [sweepAttempt(terrainAreaId, options), sweepReview(options)];
}

function terrainCentroid(points) {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length
  };
}

function priorPrimaryAwards(total) {
  const events = [];
  let remaining = total;
  let index = 0;
  while (remaining > 0) {
    const amount = Math.min(15, remaining);
    events.push({
      id: `prior-primary-${index}`,
      type: "victory_points.awarded",
      payload: {
        playerId: "p1",
        amount,
        category: "primary",
        missionDefinitionId: `prior-primary-${index}`,
        scoringTiming: "end-of-turn",
        opportunityKey: `prior:${index}`,
        round: index + 1,
        turn: 50 + index,
        scoreBefore: index * 15,
        scoreAfter: index * 15 + amount
      }
    });
    remaining -= amount;
    index += 1;
  }
  return events;
}

function seed({ round = 2, phase = "shooting", history = [], controlledObjectiveId = null } = {}) {
  const map = getEventCompanionMapForForceDispositions("Disruption", "Priority Assets", "A");
  assert.ok(map, "Locate and Deny Layout A geometry must exist");
  const objectives = Object.entries(map.objectivePositions).map(([label, position]) => ({
    id: `event-companion:${label}`,
    name: label,
    layoutObjective: label,
    position: { ...position },
    control: control(
      label === "Attacker Home" ? "p1" :
      controlledObjectiveId === `event-companion:${label}` ? "p1" :
      label === "Defender Home" ? "p2" : null
    )
  }));
  const friendlyHome = objectives.find((objective) => objective.layoutObjective === "Attacker Home");
  const enemyHome = objectives.find((objective) => objective.layoutObjective === "Defender Home");
  const nonHome = objectives.find((objective) => objective.id !== friendlyHome?.id && objective.id !== enemyHome?.id);
  assert.ok(friendlyHome && enemyHome && nonHome);
  const state = {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Disruption", opponentDisposition: "Priority Assets", layout: "A" } },
    objectives,
    units: [
      unit("runner", "p1", nonHome.position, { rosterUnitId: "r-runner" }),
      unit("holder", "p1", friendlyHome.position, { move: 6, rosterUnitId: "r-holder" }),
      unit("enemy", "p2", enemyHome.position, { move: 6, oc: 2, rosterUnitId: "r-enemy" })
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
      p2: { units: [rosterUnit("r-enemy", { move: 6, oc: 2 })] }
    }
  };
  return { state, map, friendlyHome, enemyHome, nonHome };
}

function markerSelection(state) {
  const setup = getLocateAndDenySetup(state, { playerId: "p1", perspectivePlayerId: "p1" });
  const eligible = getLocateAndDenyTerrainOptions(state, { playerId: "p1", perspectivePlayerId: "p1" }).filter((item) => item.eligible);
  assert.ok(eligible.length >= setup.expectedMarkerCount, "expected enough eligible terrain for the mission setup");
  return eligible.slice(0, setup.expectedMarkerCount);
}

function strategy(state, options = {}) {
  return getPrimaryStrategyContext(state, { playerId: "p1", perspectivePlayerId: "p1", ...options });
}

test("Locate and Deny routes to the dedicated primary strategy and exposes marker setup before Sensor Sweep", () => {
  const { state } = seed();
  const context = strategy(state);
  assert.equal(context.active, true);
  assert.equal(context.missionId, "primary-locate-and-deny");
  assert.equal(context.setupComplete, false);
  assert.match(context.reason, /record the five|marker/i);

  const options = getMissionActionOptions(state, "p1");
  assert.ok(options.some((item) => item.definitionId === "primary-locate-and-deny"));
  const html = createMissionActionPicker().render(state, "runner");
  assert.match(html, /Record Locate and Deny setup/);
  assert.match(html, /Record marker setup/);
  assert.match(html, /data-locate-setup-terrain/);
});

test("marker setup excludes terrain wholly within the player's deployment zone and requires the exact mission count", () => {
  const { state } = seed();
  const options = getLocateAndDenyTerrainOptions(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.ok(options.some((item) => item.withinOwnDeploymentZone === true));
  assert.ok(options.some((item) => item.eligible));
  assert.equal(options.some((item) => item.eligible && item.withinOwnDeploymentZone === true), false);
  const setup = getLocateAndDenySetup(state, { playerId: "p1" });
  assert.equal(setup.expectedMarkerCount, Math.min(5, options.filter((item) => item.eligible).length));
});

test("late app capture records the physical marker setup without consuming the selected unit's Shooting activation", () => {
  const { state } = seed({ round: 2, phase: "shooting" });
  const selected = markerSelection(state).map((item) => item.terrainAreaId);
  const before = getShootingCandidates(state);
  assert.ok(before.available.includes("runner") || before.actionOnly.includes("runner"));

  const next = recordShootingActivation(state, {
    unitId: "runner",
    actionType: "mission_action",
    actionId: "primary-locate-and-deny",
    missionInstanceId: "primary:p1:primary-locate-and-deny",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true,
    locateSetupOnly: true,
    locateMarkerSetupTerrainAreaIds: selected
  });

  assert.equal(getLocateAndDenySetup(next, { playerId: "p1" }).setupComplete, true);
  assert.equal(next.history.filter((event) => event.type === "shooting.unit_activated").length, 0);
  const after = getShootingCandidates(next);
  assert.ok(after.available.includes("runner") || after.actionOnly.includes("runner"));
});

test("Sensor Sweep is once per turn, targets a central objective, and removes a marker only after a completed review", () => {
  const { state } = seed({ round: 2, phase: "shooting" });
  const selected = markerSelection(state).map((item) => item.terrainAreaId);
  const withSetup = { ...state, history: [setupEvent(selected)] };
  const central = getLocateAndDenyCentralObjectiveOptions(withSetup, { playerId: "p1" });
  const markers = getLocateAndDenyMarkerRemovalOptions(withSetup, { playerId: "p1" });
  assert.ok(central.length > 0);
  assert.equal(markers.length, selected.length);

  const started = recordShootingActivation(withSetup, {
    unitId: "runner",
    actionType: "mission_action",
    actionId: "primary-locate-and-deny",
    missionInstanceId: "primary:p1:primary-locate-and-deny",
    objectiveId: central[0].objectiveId,
    terrainAreaId: markers[0].terrainAreaId,
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  });
  assert.equal(getLocateAndDenyState(started, { playerId: "p1" }).sensorSweepUsedThisTurn, true);
  assert.equal(getMissionActionOptions(started, "p1").some((item) => item.definitionId === "primary-locate-and-deny"), false);

  const failed = {
    ...started,
    history: [...started.history, sweepReview({ round: 2, turn: 2, unitId: "runner", outcome: "failed" })]
  };
  assert.equal(getLocateAndDenyState(failed, { playerId: "p1" }).activeMarkerCount, selected.length);

  const completed = {
    ...started,
    history: [...started.history, sweepReview({ round: 2, turn: 2, unitId: "runner", outcome: "completed" })]
  };
  assert.equal(getLocateAndDenyState(completed, { playerId: "p1" }).activeMarkerCount, selected.length - 1);
  assert.ok(getLocateAndDenyState(completed, { playerId: "p1" }).removedTerrainAreaIds.includes(markers[0].terrainAreaId));
});

test("Sensor Sweep becomes unavailable when only one operation marker remains", () => {
  const { state } = seed({ round: 5, phase: "shooting" });
  const selected = markerSelection(state).map((item) => item.terrainAreaId);
  const removed = selected.slice(0, Math.max(0, selected.length - 1));
  state.history.push(setupEvent(selected));
  removed.forEach((terrainAreaId, index) => state.history.push(...completedSweep(terrainAreaId, {
    round: index + 1,
    turn: index + 1,
    unitId: `old-sweep-${index}`
  })));
  const locate = getLocateAndDenyState(state, { playerId: "p1" });
  assert.equal(locate.activeMarkerCount, 1);
  assert.equal(locate.sensorSweepAvailable, false);
  assert.equal(getMissionActionOptions(state, "p1").some((item) => item.definitionId === "primary-locate-and-deny"), false);
});

test("objective-range destruction leverage uses saved turn-start position and stops after the condition is satisfied", () => {
  const { state, nonHome } = seed({ round: 2, phase: "shooting" });
  const selected = markerSelection(state).map((item) => item.terrainAreaId);
  state.history.push(setupEvent(selected));
  state.scoring.turnSnapshots = [{
    turn: 2,
    round: 2,
    playerId: "p1",
    objectives: state.objectives.map((objective) => ({ id: objective.id, control: objective.control })),
    units: state.units.map((item) => ({
      id: item.id,
      ownerId: item.ownerId,
      status: item.status,
      wounds: item.wounds,
      position: item.id === "enemy" ? { ...nonHome.position } : { ...item.position }
    }))
  }];

  const before = strategy(state, { targetUnitId: "enemy" });
  assert.equal(before.targetKillOpportunity.mapSupportsQualification, true);
  assert.equal(before.nextKillVpLeverage, 4);
  assert.ok(before.targetingScore > 0.5);

  state.history.push({
    type: "unit.destroyed",
    payload: { unitId: "enemy", ownerId: "p2", round: 2, turn: 2 }
  });
  const after = strategy(state, { targetUnitId: "enemy" });
  assert.equal(after.objectiveRangeKillMapSatisfied, true);
  assert.equal(after.nextKillVpLeverage, 0);
  assert.ok(after.targetingScore < before.targetingScore);
});

test("the four VP non-home control condition is binary and respects the Command-versus-Round-5 timing", () => {
  const roundThree = seed({ round: 3, phase: "movement" });
  const controlledA = roundThree.nonHome;
  const controlledB = roundThree.state.objectives.find((objective) =>
    objective.id !== roundThree.friendlyHome.id && objective.id !== roundThree.enemyHome.id && objective.id !== controlledA.id);
  controlledA.control = control("p1");
  if (controlledB) controlledB.control = control("p1");
  const r3 = strategy(roundThree.state);
  assert.equal(r3.controlCheckpointCompleted, true);
  assert.equal(r3.liveControlVp, 4);
  assert.equal(r3.controlVpForRound, 0);

  const roundFive = seed({ round: 5, phase: "movement" });
  roundFive.nonHome.control = control("p1");
  const r5 = strategy(roundFive.state);
  assert.equal(r5.controlCheckpointCompleted, false);
  assert.equal(r5.liveControlVp, 4);
  assert.equal(r5.controlVpForRound, 4);
  const signal = getPrimaryObjectiveStrategySignal(roundFive.state, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: roundFive.nonHome.id,
    control: "controlled",
    primaryStrategy: r5
  });
  assert.ok(signal.score > 0);
});

test("one remaining marker exposes both end-turn and endgame leverage when friendly occupancy is recorded without an enemy", () => {
  const { state } = seed({ round: 5, phase: "movement" });
  const selectedOptions = markerSelection(state);
  const selected = selectedOptions.map((item) => item.terrainAreaId);
  state.history.push(setupEvent(selected));
  selected.slice(0, selected.length - 1).forEach((terrainAreaId, index) => state.history.push(...completedSweep(terrainAreaId, {
    round: index + 1,
    turn: index + 1,
    unitId: `old-sweep-${index}`
  })));
  const remaining = selectedOptions.find((item) => item.terrainAreaId === selected[selected.length - 1]);
  assert.ok(remaining?.points?.length >= 3);
  state.units = state.units.map((item) => item.id === "runner"
    ? { ...item, position: terrainCentroid(remaining.points) }
    : item.id === "enemy" ? { ...item, position: { x: 60, y: 44 } } : item);

  const locate = getLocateAndDenyState(state, { playerId: "p1" });
  assert.equal(locate.activeMarkerCount, 1);
  assert.equal(locate.lastMarkerPositionMapSatisfied, true);
  const context = strategy(state);
  assert.ok(context.rawRecordedVp >= 4);
  assert.equal(context.endgameLastMarkerVp, 5);
  assert.match(context.reason, /protect and occupy|recorded Locate and Deny conditions/i);
});

test("round and game caps limit Locate and Deny tactical leverage without counting endgame VP twice", () => {
  const { state } = seed({ round: 5, phase: "movement" });
  const selectedOptions = markerSelection(state);
  const selected = selectedOptions.map((item) => item.terrainAreaId);
  state.history.push(...priorPrimaryAwards(44), setupEvent(selected));
  selected.slice(0, selected.length - 1).forEach((terrainAreaId, index) => state.history.push(...completedSweep(terrainAreaId, {
    round: index + 1,
    turn: index + 1,
    unitId: `old-sweep-${index}`
  })));
  const remaining = selectedOptions.find((item) => item.terrainAreaId === selected[selected.length - 1]);
  state.units = state.units.map((item) => item.id === "runner"
    ? { ...item, position: terrainCentroid(remaining.points) }
    : item.id === "enemy" ? { ...item, position: { x: 60, y: 44 } } : item);
  const context = strategy(state);
  assert.equal(context.remainingPrimaryGameVp, 1);
  assert.equal(context.cappedRecordedVp, 1);
  assert.equal(context.endgameLastMarkerVp, 0);
});
