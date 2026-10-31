import test from "node:test";
import assert from "node:assert/strict";
import { getMissionActionOptions } from "../../src/rules/mission-action-state.js";
import { getVanguardOperationState, getVanguardOperationTerrainOptions } from "../../src/rules/vanguard-operation-state.js";
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

function vanguardAttempt(terrainAreaId, { round = 2, turn = round, unitId = "runner" } = {}) {
  return {
    type: "shooting.unit_activated",
    payload: {
      unitId,
      playerId: "p1",
      round,
      turn,
      actionType: "mission_action",
      actionId: "primary-vanguard-operation",
      missionInstanceId: "primary:p1:primary-vanguard-operation",
      missionDefinitionId: "primary-vanguard-operation",
      missionName: "Vanguard Operation — Vanguard Operation",
      reviewTiming: "end-of-turn",
      terrainAreaId,
      rulesConfirmed: true
    }
  };
}

function vanguardReview({ round = 2, turn = round, unitId = "runner", outcome = "completed" } = {}) {
  return {
    type: "mission_action.reviewed",
    payload: {
      actionKey: `${round}:${turn}:${unitId}`,
      playerId: "p1",
      checkpoint: "end-of-turn",
      outcome,
      missionInstanceId: "primary:p1:primary-vanguard-operation",
      round,
      turn
    }
  };
}

function commandAward(round = 2, amount = 4) {
  return {
    id: `vanguard-command-${round}`,
    type: "victory_points.awarded",
    payload: {
      playerId: "p1",
      amount,
      category: "primary",
      missionDefinitionId: "primary-vanguard-operation",
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
  controls = { home: true, central1: true, central2: false, enemyHome: false },
  enemyStatus = "deployed"
} = {}) {
  const objectives = [
    { id: "home-p1", name: "Attacker Home", layoutObjective: "Attacker Home", position: { x: 7, y: 22 }, control: control(controls.home ? "p1" : null) },
    { id: "central-1", name: "Central 1", layoutObjective: "Central 1", position: { x: 25, y: 15 }, control: control(controls.central1 ? "p1" : null) },
    { id: "central-2", name: "Central 2", layoutObjective: "Central 2", position: { x: 35, y: 29 }, control: control(controls.central2 ? "p1" : "p2") },
    { id: "home-p2", name: "Defender Home", layoutObjective: "Defender Home", position: { x: 53, y: 22 }, control: control(controls.enemyHome ? "p1" : "p2") }
  ];
  const units = [
    unit("runner", "p1", { x: 30, y: 18 }),
    unit("holder", "p1", { x: 25, y: 15 }),
    unit("home-guard", "p1", { x: 8, y: 22 }),
    unit("enemy", "p2", { x: 45, y: 22 }, { status: enemyStatus }),
    unit("enemy-two", "p2", { x: 48, y: 28 }, { status: enemyStatus })
  ];
  const state = {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Priority Assets", opponentDisposition: "Reconnaissance", layout: "A" } },
    objectives,
    units,
    history: [...history],
    victoryPoints: { p1: 0, p2: 0 },
    commandPoints: { p1: 2, p2: 2 },
    scoring: {
      turnSnapshots: [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: [rosterUnit("r-runner"), rosterUnit("r-holder"), rosterUnit("r-home-guard")] },
      p2: { units: [rosterUnit("r-enemy"), rosterUnit("r-enemy-two")] }
    }
  };
  return { state, objectives };
}

function strategy(state, targetUnitId = null) {
  return getPrimaryStrategyContext(state, { playerId: "p1", perspectivePlayerId: "p1", targetUnitId });
}

function firstTerrain(state) {
  const options = getVanguardOperationTerrainOptions(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.ok(options.length > 0, "expected at least one Vanguard Operation terrain option");
  return options[0];
}

test("Vanguard Operation routes to its dedicated strategy and picker presents terrain selection", () => {
  const { state } = seed({ round: 2, phase: "shooting" });
  const result = strategy(state);
  assert.equal(result.missionId, "primary-vanguard-operation");
  assert.equal(result.actionAvailableThisTurn, true);

  const options = getVanguardOperationTerrainOptions(state, { playerId: "p1" });
  assert.ok(options.length > 0);
  assert.equal(options.some((item) => item.enemyTerritoryByMap === false), false);

  const html = createMissionActionPicker().render(state, "runner");
  assert.match(html, /Terrain area for Vanguard Operation/);
  assert.match(html, new RegExp(`value="${options[0].terrainAreaId}"`));
  assert.match(html, /keep the area clear|no enemy units|no enemy/i);
});

test("starting Vanguard Operation spends its once-per-turn use and records the selected terrain", () => {
  const { state } = seed({ round: 2, phase: "shooting" });
  const terrain = firstTerrain(state);
  const updated = recordShootingActivation(state, {
    unitId: "runner",
    actionType: "mission_action",
    actionId: "primary-vanguard-operation",
    missionInstanceId: "primary:p1:primary-vanguard-operation",
    terrainAreaId: terrain.terrainAreaId,
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  });
  const vanguard = getVanguardOperationState(updated, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(vanguard.usedThisTurn, true);
  assert.deepEqual(vanguard.pendingTerrainAreaIds, [terrain.terrainAreaId]);
  assert.equal(vanguard.actionAvailableThisTurn, false);
  assert.deepEqual(getVanguardOperationTerrainOptions(updated, { playerId: "p1" }), []);
  assert.equal(getMissionActionOptions(updated, "p1").some((item) => item.definitionId === "primary-vanguard-operation"), false);
});

test("completed Vanguard Operation review contributes 4 VP while a failed review still spends the Action", () => {
  const { state: base } = seed({ round: 2, phase: "shooting" });
  const terrain = firstTerrain(base);

  const completedState = seed({
    round: 2,
    phase: "end_turn",
    history: [vanguardAttempt(terrain.terrainAreaId), vanguardReview()]
  }).state;
  assert.equal(getVanguardOperationState(completedState, { playerId: "p1" }).completedThisTurnCount, 1);
  assert.equal(strategy(completedState).actionRawVp, 4);

  const failedState = seed({
    round: 2,
    phase: "end_turn",
    history: [vanguardAttempt(terrain.terrainAreaId), vanguardReview({ outcome: "failed" })]
  }).state;
  const failed = getVanguardOperationState(failedState, { playerId: "p1" });
  assert.equal(failed.usedThisTurn, true);
  assert.equal(failed.completedThisTurnCount, 0);
  assert.equal(failed.actionAvailableThisTurn, false);
  assert.equal(strategy(failedState).actionRawVp, 0);
});

test("pending Vanguard Operation identifies enemy blockers inside the selected terrain on the advisory map", () => {
  const { state: base } = seed({ round: 2, phase: "end_turn" });
  const terrain = firstTerrain(base);
  const blockerPoint = terrain.points[0];
  const state = {
    ...base,
    units: base.units.map((item) => item.id === "enemy" ? { ...item, position: { ...blockerPoint } } : item),
    history: [vanguardAttempt(terrain.terrainAreaId)]
  };
  const vanguard = getVanguardOperationState(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(vanguard.blockerEvidenceKnown, true);
  assert.equal(vanguard.blockerUnitIds.includes("enemy"), true);
  assert.equal(vanguard.blockersByTerrain[terrain.terrainAreaId].includes("enemy"), true);
  assert.match(strategy(state).reason, /enemy units still occupy|blocker/i);
});

test("destroying one or more enemy units satisfies Vanguard Operation's binary 2 VP destruction condition once", () => {
  const history = [
    { type: "unit.destroyed", payload: { unitId: "enemy", ownerId: "p2", round: 2, turn: 2 } },
    { type: "unit.destroyed", payload: { unitId: "enemy-two", ownerId: "p2", round: 2, turn: 2 } }
  ];
  const { state } = seed({ round: 2, phase: "end_turn", history, enemyStatus: "destroyed" });
  const result = strategy(state, "enemy");
  assert.equal(result.killSatisfied, true);
  assert.equal(result.enemyKillsThisTurn, 2);
  assert.equal(result.killRawVp, 2);
  assert.equal(result.nextKillVpLeverage, 0);
});

test("Round 2 Command projects the binary 4 VP non-home condition and locks the recorded checkpoint afterward", () => {
  const atCommand = seed({ round: 2, phase: "command" }).state;
  const commandResult = strategy(atCommand);
  assert.equal(commandResult.controlVpForProjection, 4);
  assert.equal(commandResult.commandCheckpointCompleted, false);

  const afterCommand = seed({
    round: 2,
    phase: "movement",
    history: [commandAward(2, 4)],
    controls: { home: true, central1: false, central2: false, enemyHome: false }
  }).state;
  const locked = strategy(afterCommand);
  assert.equal(locked.commandCheckpointCompleted, true);
  assert.equal(locked.commandAwardAmount, 4);
  assert.equal(locked.controlVpForProjection, 4);
});

test("Round 5 uses the live end-of-turn non-home control state", () => {
  const { state } = seed({ round: 5, phase: "end_turn", controls: { home: true, central1: true, central2: false, enemyHome: false } });
  const result = strategy(state);
  assert.equal(result.commandCheckpointCompleted, false);
  assert.equal(result.controlVpForProjection, 4);
});

test("the opponent home objective carries Vanguard Operation's 10 VP endgame leverage", () => {
  const { state } = seed({ round: 5, phase: "end_turn", controls: { home: true, central1: true, central2: false, enemyHome: true } });
  const result = strategy(state);
  assert.equal(result.opponentHomeControlled, true);
  assert.equal(result.endgameVpLeverage, 10);

  const signal = getPrimaryObjectiveStrategySignal(state, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "home-p2"
  });
  assert.equal(signal.active, true);
  assert.equal(signal.opponentHome, true);
  assert.equal(signal.endgameVpLeverage, 10);
  assert.match(signal.reason, /end of battle/);
});

test("Vanguard Operation movement routing attaches the dedicated primary strategy and terrain opportunity", () => {
  const { state } = seed({ round: 2, phase: "movement", controls: { home: true, central1: false, central2: false, enemyHome: false } });
  const movement = getMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(movement.primaryStrategy?.missionId, "primary-vanguard-operation");
  const choices = movement.recommendations.flatMap((item) => [item, ...(item.alternatives ?? [])]);
  assert.equal(choices.some((item) => item.purpose === "vanguard-operation-terrain"), true);
});

test("45 VP Primary cap suppresses additional Vanguard Operation leverage", () => {
  const { state } = seed({ round: 3, phase: "movement", history: priorPrimaryAwards(45) });
  const result = strategy(state);
  assert.equal(result.remainingPrimaryGameVp, 0);
  assert.equal(result.additionalPrimaryAllowance, 0);
  assert.equal(result.nextActionVpLeverage, 0);
  assert.equal(result.nextKillVpLeverage, 0);
  assert.equal(result.prospectiveEndgameVpLeverage, 0);
  assert.equal(result.objectivePreservationScore <= 0.15, true);
  assert.match(result.reason, /45 VP Primary game cap/);
});
