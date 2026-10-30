import test from "node:test";
import assert from "node:assert/strict";
import { getSurveilTheFoeState, getSurveilTheFoeTargetOptions } from "../../src/rules/surveil-the-foe-state.js";
import { getPrimaryStrategyContext, getPrimaryObjectiveStrategySignal } from "../../src/rules/tactical-primary-strategy-router.js";
import { recordShootingActivation } from "../../src/engine/shooting-transitions.js";
import { createMissionActionPicker } from "../../src/ui/mission-action-picker.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function rosterUnit(id) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: '6"', OC: 2, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons: []
    }
  };
}

function unit(id, ownerId, position, status = "deployed") {
  return {
    id,
    ownerId,
    name: id,
    status,
    position: { ...position },
    wounds: 5,
    startingStrength: 1,
    currentStrength: 1,
    startingWounds: 5,
    metadata: { rosterUnitId: `r-${id}`, modelCount: 1 },
    profile: { characteristics: { movement: 6, objectiveControl: 2, toughness: 5, save: 3, wounds: 5 } }
  };
}

function completedEnemyDecoy(objectiveId, { round = 1, turn = 1, unitId = "enemy-decoy" } = {}) {
  return [
    {
      type: "shooting.unit_activated",
      payload: {
        unitId,
        playerId: "p2",
        round,
        turn,
        actionType: "mission_action",
        actionId: "primary-smoke-and-mirrors",
        missionInstanceId: "primary:p2:primary-smoke-and-mirrors",
        missionDefinitionId: "primary-smoke-and-mirrors",
        missionName: "Smoke and Mirrors — Decoy",
        reviewTiming: "end-of-turn",
        objectiveId,
        rulesConfirmed: true
      }
    },
    {
      type: "mission_action.reviewed",
      payload: {
        actionKey: `${round}:${turn}:${unitId}`,
        playerId: "p2",
        checkpoint: "end-of-turn",
        outcome: "completed",
        missionInstanceId: "primary:p2:primary-smoke-and-mirrors",
        round,
        turn
      }
    }
  ];
}

function surveilEvent(targetUnitId, { round = 2, turn = 2, unitId = "scout" } = {}) {
  return {
    type: "shooting.unit_activated",
    payload: {
      unitId,
      playerId: "p1",
      round,
      turn,
      actionType: "mission_action",
      actionId: "primary-surveil-the-foe",
      missionInstanceId: "primary:p1:primary-surveil-the-foe",
      missionDefinitionId: "primary-surveil-the-foe",
      missionName: "Surveil the Foe — Surveil",
      reviewTiming: "end-of-turn",
      targetUnitId,
      rulesConfirmed: true
    }
  };
}

function removedEnemyDecoy(objectiveId, { round = 2, turn = 2 } = {}) {
  return {
    type: "mission_marker.removed",
    payload: {
      markerType: "smoke-and-mirrors-decoy",
      ownerPlayerId: "p2",
      objectiveId,
      playerId: "p1",
      round,
      turn
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
        opportunityKey: `prior:${index}`,
        scoringTiming: "end-of-turn",
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

function seed({ round = 2, phase = "shooting", history = [] } = {}) {
  const objectives = [
    { id: "home-p1", name: "Attacker Home", layoutObjective: "Attacker Home", position: { x: 8, y: 22 }, control: control("p1") },
    { id: "mid-a", name: "Mid A", layoutObjective: "Objective 1", position: { x: 25, y: 14 }, control: control("p1") },
    { id: "mid-b", name: "Mid B", layoutObjective: "Objective 2", position: { x: 35, y: 30 }, control: control("p2") },
    { id: "home-p2", name: "Defender Home", layoutObjective: "Defender Home", position: { x: 52, y: 22 }, control: control("p2") }
  ];
  const state = {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Reconnaissance", opponentDisposition: "Disruption", layout: "A" } },
    objectives,
    units: [
      unit("scout", "p1", { x: 20, y: 14 }),
      unit("enemy-marked", "p2", { x: 26, y: 14 }),
      unit("enemy-open", "p2", { x: 30, y: 22 }),
      unit("enemy-reserve", "p2", { x: 21, y: 14 }, "reserve")
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
      p1: { units: [rosterUnit("r-scout")] },
      p2: { units: [rosterUnit("r-enemy-marked"), rosterUnit("r-enemy-open"), rosterUnit("r-enemy-reserve")] }
    }
  };
  return { state };
}

function strategy(state) {
  return getPrimaryStrategyContext(state, { playerId: "p1", perspectivePlayerId: "p1" });
}

test("router selects Surveil the Foe and exposes its objective and marker-clear scoring lanes", () => {
  const { state } = seed({ phase: "command" });
  const result = strategy(state);
  assert.equal(result.missionId, "primary-surveil-the-foe");
  assert.equal(result.supported, true);
  assert.equal(result.enemyMarkersCleared, true);
  assert.equal(result.nonHomeControlledObjectives, 1);
  assert.equal(result.controlsMoreObjectives, false);
  assert.equal(result.rawAdvisoryVp, 9);
});

test("Surveil target options include deployed enemies, exclude reserves, and do not hard-gate approximate range", () => {
  const { state } = seed();
  state.units.find((item) => item.id === "enemy-open").position = { x: 55, y: 40 };
  const options = getSurveilTheFoeTargetOptions(state, { playerId: "p1", unitId: "scout", perspectivePlayerId: "p1" });
  assert.deepEqual(options.map((item) => item.targetUnitId).sort(), ["enemy-marked", "enemy-open"]);
  assert.equal(options.find((item) => item.targetUnitId === "enemy-open").rangeEstimate, "outside");
});

test("recording Surveil stores the enemy target and prevents surveilling that same unit twice this turn", () => {
  const { state } = seed();
  const next = recordShootingActivation(state, {
    unitId: "scout",
    actionType: "mission_action",
    actionId: "primary-surveil-the-foe",
    missionInstanceId: "primary:p1:primary-surveil-the-foe",
    targetUnitId: "enemy-open",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  });
  const event = next.history.at(-1);
  assert.equal(event.payload.targetUnitId, "enemy-open");
  const tracked = getSurveilTheFoeState(next, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.deepEqual(tracked.surveilledTargetIds, ["enemy-open"]);
  assert.equal(getSurveilTheFoeTargetOptions(next, { playerId: "p1", unitId: "scout" }).some((item) => item.targetUnitId === "enemy-open"), false);
});

test("mission action picker renders a dedicated enemy Surveil target selector", () => {
  const { state } = seed();
  const html = createMissionActionPicker().render(state, "scout");
  assert.match(html, /Enemy unit to Surveil/);
  assert.match(html, /enemy-marked/);
  assert.match(html, /enemy-open/);
  assert.doesNotMatch(html, /enemy-reserve/);
});

test("removing a protecting enemy operation marker later in the same turn makes an already-surveilled enemy qualify", () => {
  const { state } = seed({ phase: "command" });
  state.history.push(...completedEnemyDecoy("mid-a"), surveilEvent("enemy-marked"));
  const before = getSurveilTheFoeState(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(before.enemyMarkerCount, 1);
  assert.equal(before.qualifyingSurveilEstimate, "blocked");

  state.history.push(removedEnemyDecoy("mid-a"));
  const after = getSurveilTheFoeState(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(after.enemyMarkerCount, 0);
  assert.equal(after.qualifyingSurveilEstimate, "likely");
  assert.equal(strategy(state).rawAdvisoryVp, 13);
});

test("objective signal recognizes a non-home capture that also flips control-more as 8 VP leverage", () => {
  const { state } = seed({ phase: "command" });
  state.objectives.find((item) => item.id === "mid-a").control = control(null);
  const signal = getPrimaryObjectiveStrategySignal(state, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "mid-b"
  });
  assert.equal(signal.rawVpLeverage, 8);
  assert.equal(signal.vpLeverage, 8);
  assert.ok(signal.score > 0.9);
});

test("45 VP Primary cap suppresses Surveil the Foe mission leverage", () => {
  const { state } = seed({ history: priorPrimaryAwards(45) });
  state.history.push(surveilEvent("enemy-open"));
  const result = strategy(state);
  assert.equal(result.remainingPrimaryGameVp, 0);
  assert.equal(result.additionalPrimaryAllowance, 0);
  assert.equal(result.objectivePreservationScore <= 0.15, true);
  assert.match(result.reason, /45 VP Primary game cap/);
});
