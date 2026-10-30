import test from "node:test";
import assert from "node:assert/strict";
import { getMissionActionOptions } from "../../src/rules/mission-action-state.js";
import { getSecureAssetObjectiveOptions, getSecureAssetState } from "../../src/rules/secure-asset-state.js";
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
      weapons: [{ name: "test gun", type: "ranged", range: "24\"", attacks: 1, skill: "3+", strength: 4, ap: 0, damage: 1 }]
    }
  };
}

function unit(id, ownerId, position, { move = 8, oc = 2, status = "deployed" } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status,
    position: { ...position },
    wounds: status === "destroyed" ? 0 : 5,
    startingStrength: 1,
    currentStrength: status === "destroyed" ? 0 : 1,
    startingWounds: 5,
    metadata: { rosterUnitId: `r-${id}`, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function secureAttempt(objectiveId, { round = 2, turn = round, unitId = "runner" } = {}) {
  return {
    type: "shooting.unit_activated",
    payload: {
      unitId,
      playerId: "p1",
      round,
      turn,
      actionType: "mission_action",
      actionId: "primary-secure-asset",
      missionInstanceId: "primary:p1:primary-secure-asset",
      missionDefinitionId: "primary-secure-asset",
      missionName: "Secure Asset — Secure Asset",
      reviewTiming: "end-of-turn",
      objectiveId,
      rulesConfirmed: true
    }
  };
}

function secureReview({ round = 2, turn = round, unitId = "runner", outcome = "completed" } = {}) {
  return {
    type: "mission_action.reviewed",
    payload: {
      actionKey: `${round}:${turn}:${unitId}`,
      playerId: "p1",
      checkpoint: "end-of-turn",
      outcome,
      missionInstanceId: "primary:p1:primary-secure-asset",
      round,
      turn
    }
  };
}

function commandAward(round = 2, amount = 8) {
  return {
    id: `secure-command-${round}`,
    type: "victory_points.awarded",
    payload: {
      playerId: "p1",
      amount,
      category: "primary",
      missionDefinitionId: "primary-secure-asset",
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

function seed({
  round = 2,
  phase = "shooting",
  history = [],
  controls = { home: true, central1: true, central2: true, enemyHome: false },
  includeTurnSnapshot = false,
  enemyStart = { x: 27, y: 15 },
  enemyStatus = "deployed"
} = {}) {
  const objectives = [
    { id: "home-p1", name: "Attacker Home", layoutObjective: "Attacker Home", position: { x: 7, y: 22 }, control: control(controls.home ? "p1" : null) },
    { id: "central-1", name: "Central 1", layoutObjective: "Central 1", position: { x: 25, y: 15 }, control: control(controls.central1 ? "p1" : null) },
    { id: "central-2", name: "Central 2", layoutObjective: "Central 2", position: { x: 35, y: 29 }, control: control(controls.central2 ? "p1" : "p2") },
    { id: "home-p2", name: "Defender Home", layoutObjective: "Defender Home", position: { x: 53, y: 22 }, control: control(controls.enemyHome ? "p1" : "p2") }
  ];
  const units = [
    unit("runner", "p1", { x: 24, y: 15 }),
    unit("holder", "p1", { x: 34, y: 29 }),
    unit("home-guard", "p1", { x: 8, y: 22 }),
    unit("enemy-central", "p2", { x: 31, y: 15 }, { status: enemyStatus })
  ];
  const turnSnapshots = includeTurnSnapshot ? [{
    turn: round,
    round,
    playerId: "p1",
    objectives: objectives.map((objective) => ({ id: objective.id, control: objective.control })),
    units: [
      { id: "runner", ownerId: "p1", status: "deployed", wounds: 5, position: { x: 24, y: 15 } },
      { id: "holder", ownerId: "p1", status: "deployed", wounds: 5, position: { x: 34, y: 29 } },
      { id: "home-guard", ownerId: "p1", status: "deployed", wounds: 5, position: { x: 8, y: 22 } },
      { id: "enemy-central", ownerId: "p2", status: "deployed", wounds: 5, position: { ...enemyStart } }
    ]
  }] : [];
  const state = {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Priority Assets", opponentDisposition: "Take and Hold", layout: "A" } },
    objectives,
    units,
    history: [...history],
    victoryPoints: { p1: 0, p2: 0 },
    commandPoints: { p1: 2, p2: 2 },
    scoring: {
      turnSnapshots,
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: [rosterUnit("r-runner"), rosterUnit("r-holder"), rosterUnit("r-home-guard")] },
      p2: { units: [rosterUnit("r-enemy-central")] }
    }
  };
  return { state, objectives };
}

function strategy(state, targetUnitId = null) {
  return getPrimaryStrategyContext(state, { playerId: "p1", perspectivePlayerId: "p1", targetUnitId });
}

test("Secure Asset routes to its dedicated strategy and picker excludes the player's home objective", () => {
  const { state } = seed({ round: 2, phase: "shooting" });
  const result = strategy(state);
  assert.equal(result.missionId, "primary-secure-asset");
  assert.equal(result.actionAvailableThisTurn, true);

  const options = getSecureAssetObjectiveOptions(state, { playerId: "p1" });
  assert.equal(options.some((item) => item.objectiveId === "home-p1"), false);
  assert.equal(options.some((item) => item.objectiveId === "central-1"), true);
  assert.equal(options.some((item) => item.objectiveId === "home-p2"), true);

  const html = createMissionActionPicker().render(state, "runner");
  assert.match(html, /Objective to Secure/);
  assert.doesNotMatch(html, /value="home-p1"/);
  assert.match(html, /value="central-1"/);
});

test("starting Secure Asset spends its once-per-turn use and records the selected non-home objective", () => {
  const { state } = seed({ round: 2, phase: "shooting" });
  const updated = recordShootingActivation(state, {
    unitId: "runner",
    actionType: "mission_action",
    actionId: "primary-secure-asset",
    missionInstanceId: "primary:p1:primary-secure-asset",
    objectiveId: "central-1",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  });
  const secure = getSecureAssetState(updated, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(secure.usedThisTurn, true);
  assert.deepEqual(secure.pendingObjectiveIds, ["central-1"]);
  assert.equal(secure.actionAvailableThisTurn, false);
  assert.deepEqual(getSecureAssetObjectiveOptions(updated, { playerId: "p1" }), []);
  assert.equal(getMissionActionOptions(updated, "p1").some((item) => item.definitionId === "primary-secure-asset"), false);
});

test("a completed Secure Asset review contributes the binary 4 VP Action condition", () => {
  const history = [secureAttempt("central-1"), secureReview()];
  const { state } = seed({ round: 2, phase: "end_turn", history });
  const secure = getSecureAssetState(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(secure.completedThisTurnCount, 1);
  const result = strategy(state);
  assert.equal(result.actionRawVp, 4);
  assert.equal(result.usedActionThisTurn, true);
});

test("central-objective destruction uses turn-start position evidence and is binary", () => {
  const history = [{
    type: "unit.destroyed",
    payload: { unitId: "enemy-central", ownerId: "p2", round: 2, turn: 2 }
  }];
  const { state } = seed({ round: 2, phase: "end_turn", history, includeTurnSnapshot: true, enemyStart: { x: 27, y: 15 }, enemyStatus: "destroyed" });
  const result = strategy(state, "enemy-central");
  assert.equal(result.centralKillEvidenceKnown, true);
  assert.equal(result.centralKillSatisfied, true);
  assert.deepEqual(result.qualifyingDestroyedUnitIds, ["enemy-central"]);
  assert.equal(result.killRawVp, 2);
  assert.equal(result.nextKillVpLeverage, 0);
});

test("an enemy outside central-objective range at turn start does not satisfy the 2 VP destruction condition", () => {
  const history = [{
    type: "unit.destroyed",
    payload: { unitId: "enemy-central", ownerId: "p2", round: 2, turn: 2 }
  }];
  const { state } = seed({ round: 2, phase: "end_turn", history, includeTurnSnapshot: true, enemyStart: { x: 31, y: 15 }, enemyStatus: "destroyed" });
  const result = strategy(state);
  assert.equal(result.centralKillEvidenceKnown, true);
  assert.equal(result.centralKillSatisfied, false);
  assert.equal(result.killRawVp, 0);
});

test("Round 2 Command scoring projects both 4 VP control thresholds and locks the recorded checkpoint afterward", () => {
  const atCommand = seed({ round: 2, phase: "command" }).state;
  const commandResult = strategy(atCommand);
  assert.equal(commandResult.controlVpForProjection, 8);
  assert.equal(commandResult.commandCheckpointCompleted, false);

  const afterCommand = seed({
    round: 2,
    phase: "movement",
    history: [commandAward(2, 8)],
    controls: { home: true, central1: false, central2: false, enemyHome: false }
  }).state;
  const locked = strategy(afterCommand);
  assert.equal(locked.commandCheckpointCompleted, true);
  assert.equal(locked.commandAwardAmount, 8);
  assert.equal(locked.controlVpForProjection, 8);
});

test("Secure Asset objective signals combine the once-per-turn Action and control-threshold leverage", () => {
  const { state } = seed({
    round: 2,
    phase: "movement",
    controls: { home: true, central1: false, central2: true, enemyHome: false }
  });
  const signal = getPrimaryObjectiveStrategySignal(state, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "central-1"
  });
  assert.equal(signal.active, true);
  assert.equal(signal.eligibleActionObjective, true);
  assert.equal(signal.nonHomeVpLeverage, 0);
  assert.equal(signal.threeObjectiveVpLeverage, 4);
  assert.equal(signal.actionVpLeverage > 0, true);
});

test("Secure Asset movement routing attaches the dedicated primary strategy", () => {
  const { state } = seed({
    round: 2,
    phase: "movement",
    controls: { home: true, central1: false, central2: true, enemyHome: false }
  });
  const movement = getMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(movement.primaryStrategy?.missionId, "primary-secure-asset");
  assert.equal(movement.recommendations.some((item) => item.primaryStrategySignal?.eligibleActionObjective === true), true);
});

test("45 VP Primary cap suppresses additional Secure Asset leverage", () => {
  const { state } = seed({ round: 3, phase: "movement", history: priorPrimaryAwards(45) });
  const result = strategy(state);
  assert.equal(result.remainingPrimaryGameVp, 0);
  assert.equal(result.additionalPrimaryAllowance, 0);
  assert.equal(result.nextActionVpLeverage, 0);
  assert.equal(result.nextKillVpLeverage, 0);
  assert.equal(result.objectivePreservationScore <= 0.15, true);
  assert.match(result.reason, /45 VP Primary game cap/);
});
