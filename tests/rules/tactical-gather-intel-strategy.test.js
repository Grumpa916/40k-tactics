import test from "node:test";
import assert from "node:assert/strict";
import { getGatherIntelObjectiveOptions, getGatherIntelState } from "../../src/rules/gather-intel-state.js";
import { getPrimaryObjectiveStrategySignal, getPrimaryStrategyContext } from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { recordShootingActivation } from "../../src/engine/shooting-transitions.js";
import { createMissionActionPicker } from "../../src/ui/mission-action-picker.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function rosterUnit(id, { move = 8, oc = 2 } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons: []
    }
  };
}

function unit(id, ownerId, position, { move = 8, oc = 2 } = {}) {
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
    metadata: { rosterUnitId: `r-${id}`, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function extractAttempt(objectiveId, { round = 2, turn = round, unitId = `extract-${objectiveId}` } = {}) {
  return {
    type: "shooting.unit_activated",
    payload: {
      unitId,
      playerId: "p1",
      round,
      turn,
      actionType: "mission_action",
      actionId: "primary-gather-intel",
      missionInstanceId: "primary:p1:primary-gather-intel",
      missionDefinitionId: "primary-gather-intel",
      missionName: "Gather Intel — Extract Intelligence",
      reviewTiming: "end-of-turn",
      objectiveId,
      rulesConfirmed: true
    }
  };
}

function extractReview(objectiveId, { round = 2, turn = round, unitId = `extract-${objectiveId}`, outcome = "completed" } = {}) {
  return {
    type: "mission_action.reviewed",
    payload: {
      actionKey: `${round}:${turn}:${unitId}`,
      playerId: "p1",
      checkpoint: "end-of-turn",
      outcome,
      missionInstanceId: "primary:p1:primary-gather-intel",
      round,
      turn
    }
  };
}

function completedExtract(objectiveId, options = {}) {
  return [extractAttempt(objectiveId, options), extractReview(objectiveId, options)];
}

function commandAward(round = 2, amount = 4) {
  return {
    id: `gather-command-${round}`,
    type: "victory_points.awarded",
    payload: {
      playerId: "p1",
      amount,
      category: "primary",
      missionDefinitionId: "primary-gather-intel",
      scoringTiming: "command-phase",
      opportunityKey: `${round}:${round}:p1:command-phase`,
      round,
      turn: round,
      scoreBefore: 0,
      scoreAfter: amount
    }
  };
}

function priorPrimaryAwards(total) {
  const result = [];
  let remaining = total;
  let index = 0;
  while (remaining > 0) {
    const amount = Math.min(15, remaining);
    result.push({
      id: `prior-primary-${index}`,
      type: "victory_points.awarded",
      payload: {
        playerId: "p1",
        amount,
        category: "primary",
        missionDefinitionId: `prior-${index}`,
        scoringTiming: "end-of-turn",
        opportunityKey: `prior:${index}`,
        round: index + 1,
        turn: 40 + index,
        scoreBefore: index * 15,
        scoreAfter: index * 15 + amount
      }
    });
    remaining -= amount;
    index += 1;
  }
  return result;
}

function seed({ round = 2, phase = "shooting", history = [], centralControlled = true } = {}) {
  const objectives = [
    { id: "home-p1", name: "Attacker Home", layoutObjective: "Attacker Home", position: { x: 7, y: 22 }, control: control("p1") },
    { id: "central-1", name: "Central 1", layoutObjective: "Central 1", position: { x: 25, y: 15 }, control: control(centralControlled ? "p1" : null) },
    { id: "central-2", name: "Central 2", layoutObjective: "Central 2", position: { x: 35, y: 29 }, control: control("p2") },
    { id: "home-p2", name: "Defender Home", layoutObjective: "Defender Home", position: { x: 53, y: 22 }, control: control("p2") }
  ];
  const state = {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Reconnaissance", opponentDisposition: "Reconnaissance", layout: "A" } },
    objectives,
    units: [
      unit("scout-a", "p1", { x: 24, y: 15 }),
      unit("scout-b", "p1", { x: 34, y: 29 }),
      unit("scout-c", "p1", { x: 46, y: 22 }),
      unit("enemy", "p2", { x: 38, y: 29 })
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
      p1: { units: [rosterUnit("r-scout-a"), rosterUnit("r-scout-b"), rosterUnit("r-scout-c")] },
      p2: { units: [rosterUnit("r-enemy")] }
    }
  };
  return { state, objectives };
}

function strategy(state) {
  return getPrimaryStrategyContext(state, { playerId: "p1", perspectivePlayerId: "p1" });
}

test("Round 1 Gather Intel prioritizes the 6 VP central-objective window and does not expose Extract Intelligence", () => {
  const { state } = seed({ round: 1, phase: "movement", centralControlled: true });
  const result = strategy(state);
  assert.equal(result.missionId, "primary-gather-intel");
  assert.equal(result.controlVpForProjection, 6);
  assert.equal(result.cappedAdvisoryVp, 6);
  assert.equal(result.actionAvailableThisTurn, false);
  assert.deepEqual(getGatherIntelObjectiveOptions(state, { playerId: "p1" }), []);

  const movement = getMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(movement.primaryStrategy?.missionId, "primary-gather-intel");
});

test("Extract Intelligence is unlimited across different objectives but blocks duplicate objectives in the same turn", () => {
  const { state } = seed({ round: 2, phase: "shooting" });
  const first = recordShootingActivation(state, {
    unitId: "scout-a",
    actionType: "mission_action",
    actionId: "primary-gather-intel",
    missionInstanceId: "primary:p1:primary-gather-intel",
    objectiveId: "central-1",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  });

  assert.throws(() => recordShootingActivation(first, {
    unitId: "scout-b",
    actionType: "mission_action",
    actionId: "primary-gather-intel",
    missionInstanceId: "primary:p1:primary-gather-intel",
    objectiveId: "central-1",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  }), /different eligible non-home objective/);

  const second = recordShootingActivation(first, {
    unitId: "scout-b",
    actionType: "mission_action",
    actionId: "primary-gather-intel",
    missionInstanceId: "primary:p1:primary-gather-intel",
    objectiveId: "central-2",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  });

  const gather = getGatherIntelState(second, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.deepEqual([...gather.pendingObjectiveIds].sort(), ["central-1", "central-2"]);
  assert.equal(gather.actionAvailableThisTurn, true);
  assert.ok(getGatherIntelObjectiveOptions(second, { playerId: "p1" }).some((item) => item.objectiveId === "home-p2"));
});

test("completed Extract Intelligence reviews create persistent markers and 7 VP-per-unit current-turn evidence", () => {
  const history = [commandAward(2), ...completedExtract("central-1", { unitId: "scout-a" }), ...completedExtract("central-2", { unitId: "scout-b" })];
  const { state } = seed({ round: 2, phase: "end_turn", history });
  const gather = getGatherIntelState(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.deepEqual([...gather.markerObjectiveIds].sort(), ["central-1", "central-2"]);
  assert.equal(gather.completedThisTurnCount, 2);
  assert.equal(gather.markerCount, 2);

  const result = strategy(state);
  assert.equal(result.completedExtractRawVp, 14);
  assert.equal(result.actualMissionVpThisTurn, 4);
  assert.equal(result.cappedAdvisoryVp, 15);
});

test("Gather Intel markers persist into later turns and the third marker at opponent home satisfies both 5 VP endgame conditions", () => {
  const history = [
    ...completedExtract("central-1", { round: 2, turn: 2, unitId: "scout-a" }),
    ...completedExtract("central-2", { round: 2, turn: 2, unitId: "scout-b" }),
    ...completedExtract("home-p2", { round: 3, turn: 3, unitId: "scout-c" })
  ];
  const { state } = seed({ round: 4, phase: "command", history });
  const gather = getGatherIntelState(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(gather.completedThisTurnCount, 0);
  assert.equal(gather.markerCount, 3);
  assert.equal(gather.threeMarkerThresholdMet, true);
  assert.equal(gather.markerAtOpponentHome, true);

  const result = strategy(state);
  assert.equal(result.currentEndgameMarkerVp, 10);
});

test("an unmarked opponent home objective carries both third-marker and opponent-home endgame leverage", () => {
  const history = [
    ...completedExtract("central-1", { round: 2, unitId: "scout-a" }),
    ...completedExtract("central-2", { round: 2, unitId: "scout-b" })
  ];
  const { state } = seed({ round: 3, phase: "movement", history });
  const signal = getPrimaryObjectiveStrategySignal(state, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "home-p2"
  });
  assert.equal(signal.eligibleExtractObjective, true);
  assert.equal(signal.opponentHome, true);
  assert.equal(signal.endgameVpLeverage, 10);
});

test("the Gather Intel picker hides home, already-marked and already-reserved objectives", () => {
  const history = [
    ...completedExtract("central-1", { round: 2, turn: 1, unitId: "old-scout" }),
    extractAttempt("central-2", { round: 2, turn: 2, unitId: "scout-b" })
  ];
  const { state } = seed({ round: 2, phase: "shooting", history });
  const html = createMissionActionPicker().render(state, "scout-a");
  assert.match(html, /Objective for Extract Intelligence/);
  assert.doesNotMatch(html, /value="home-p1"/);
  assert.doesNotMatch(html, /value="central-1"/);
  assert.doesNotMatch(html, /value="central-2"/);
  assert.match(html, /value="home-p2"/);
});

test("45 VP Primary cap suppresses Gather Intel current-round mission leverage", () => {
  const { state } = seed({ round: 3, phase: "movement", history: priorPrimaryAwards(45) });
  const result = strategy(state);
  assert.equal(result.remainingPrimaryGameVp, 0);
  assert.equal(result.additionalPrimaryAllowance, 0);
  assert.equal(result.objectivePreservationScore <= 0.15, true);
  assert.match(result.reason, /45 VP Primary game cap/);
});
