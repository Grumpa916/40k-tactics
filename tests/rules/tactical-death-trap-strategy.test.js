import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getEventCompanionMapForForceDispositions } from "../../src/rules/event-companion-map-catalog.js";
import { getDeathTrapState, getDeathTrapTerrainOptions } from "../../src/rules/death-trap-state.js";
import {
  getPrimaryStrategyContext,
  getPrimaryObjectiveStrategySignal
} from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { getMissionActionReviews } from "../../src/rules/mission-action-state.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function centroid(points) {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length
  };
}

function trapEvent({ terrainAreaId, round = 2, turn = 2, unitId = "runner" } = {}) {
  return {
    type: "shooting.unit_activated",
    payload: {
      unitId,
      playerId: "p1",
      round,
      turn,
      actionType: "mission_action",
      actionId: "primary-death-trap",
      missionInstanceId: "primary:p1:primary-death-trap",
      missionDefinitionId: "primary-death-trap",
      missionName: "Death Trap — Booby Trap",
      reviewTiming: "end-of-turn",
      terrainAreaId,
      actionCompletedImmediately: true,
      rulesConfirmed: true
    }
  };
}

function killEvent({ targetId = "target", turn = 2 } = {}) {
  return {
    type: "combat.attack_resolved",
    payload: {
      turn,
      phase: "shooting",
      attackerId: "runner",
      targetId,
      targetOwnerId: "p2",
      stateDelta: { target: { unitId: targetId, statusBefore: "deployed", statusAfter: "destroyed" } }
    }
  };
}

function rosterUnit(id, { move = 8, oc = 3 } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: { characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" }, weapons: [] }
  };
}

function buildState({ round = 2, phase = "movement", history = [], targetTerrainId = null } = {}) {
  const map = getEventCompanionMapForForceDispositions("Disruption", "Take and Hold", "A");
  assert.ok(map, "Death Trap Layout A geometry must exist");
  const objectives = Object.entries(map.objectivePositions).map(([label, position]) => ({
    id: `event-companion:${label}`,
    name: label,
    layoutObjective: label,
    position: { ...position },
    control: control(label === "Attacker Home" || label === "Expansion 1" ? "p1" : label === "Defender Home" ? "p2" : null)
  }));
  const terrainEntries = Object.entries(map.terrainGeometry);
  const targetEntry = targetTerrainId
    ? terrainEntries.find(([id]) => id === targetTerrainId)
    : terrainEntries.find(([, shape]) => !objectives.some((objective) => {
        const box = shape.points;
        const xs = box.map((point) => point.x), ys = box.map((point) => point.y);
        return objective.position.x >= Math.min(...xs) && objective.position.x <= Math.max(...xs) && objective.position.y >= Math.min(...ys) && objective.position.y <= Math.max(...ys);
      })) ?? terrainEntries[0];
  const targetPosition = centroid(targetEntry[1].points);
  const objectiveTerrain = getDeathTrapTerrainOptions({
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { status: "active", round, activePlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1" }, { id: "p2" }],
    battlefieldMap: { missionSetup: { myDisposition: "Disruption", opponentDisposition: "Take and Hold", layout: "A" } },
    objectives,
    units: [],
    history: [],
    scoring: { turnSnapshots: [] }
  }, { playerId: "p1" }).find((entry) => entry.containsObjective && !entry.objectiveIds.includes("event-companion:Attacker Home"));
  const runnerPosition = objectiveTerrain ? centroid(map.terrainGeometry[objectiveTerrain.terrainAreaId].points) : { x: 30, y: 22 };
  const units = [
    {
      id: "runner", ownerId: "p1", name: "Runner", status: "deployed", position: runnerPosition,
      battleShocked: false, wounds: 5, startingStrength: 1, currentStrength: 1,
      metadata: { rosterUnitId: "r-runner", modelCount: 1 },
      profile: { characteristics: { movement: 8, objectiveControl: 3, toughness: 5, save: 3, wounds: 5 } }
    },
    {
      id: "target", ownerId: "p2", name: "Target", status: history.some((event) => event.type === "combat.attack_resolved") ? "destroyed" : "deployed",
      position: targetPosition, wounds: history.some((event) => event.type === "combat.attack_resolved") ? 0 : 5,
      startingStrength: 1, currentStrength: history.some((event) => event.type === "combat.attack_resolved") ? 0 : 1,
      metadata: { rosterUnitId: "r-target", modelCount: 1 },
      profile: { characteristics: { movement: 6, objectiveControl: 2, toughness: 5, save: 3, wounds: 5 } }
    }
  ];
  return {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { status: "active", round, activePlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Disruption", opponentDisposition: "Take and Hold", layout: "A" } },
    objectives,
    units,
    history,
    scoring: {
      turnSnapshots: [{
        turn: round,
        playerId: "p1",
        objectives: objectives.map((objective) => ({ id: objective.id, control: objective.control })),
        units: units.map((unit) => ({ id: unit.id, ownerId: unit.ownerId, status: "deployed", wounds: 5, position: { ...unit.position } }))
      }],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: [rosterUnit("r-runner")] },
      p2: { units: [rosterUnit("r-target", { move: 6, oc: 2 })] }
    },
    __targetTerrainId: targetEntry[0],
    __objectiveTerrainId: objectiveTerrain?.terrainAreaId ?? null
  };
}

test("Death Trap exposes verified Event Companion terrain and objective-bearing terrain", () => {
  const s = buildState();
  const terrain = getDeathTrapTerrainOptions(s, { playerId: "p1" });
  assert.ok(terrain.length > 0);
  assert.ok(terrain.some((entry) => entry.containsObjective));
  assert.ok(terrain.every((entry) => /^T\d+$/.test(entry.terrainAreaId)));
});

test("a newly trapped objective terrain area is worth five VP while ordinary terrain is worth two", () => {
  const base = buildState();
  const objectiveTerrainId = base.__objectiveTerrainId;
  assert.ok(objectiveTerrainId);
  const ordinary = getDeathTrapTerrainOptions(base, { playerId: "p1" }).find((entry) => !entry.containsObjective);
  assert.ok(ordinary);
  const objectiveState = buildState({ history: [trapEvent({ terrainAreaId: objectiveTerrainId })] });
  const ordinaryState = buildState({ history: [trapEvent({ terrainAreaId: ordinary.terrainAreaId })] });
  assert.equal(getDeathTrapState(objectiveState, { playerId: "p1" }).trapVp, 5);
  assert.equal(getDeathTrapState(ordinaryState, { playerId: "p1" }).trapVp, 2);
});

test("trapped terrain remains persistent and is removed from available Booby Trap choices", () => {
  const s = buildState();
  const terrainAreaId = s.__targetTerrainId;
  s.history.push(trapEvent({ terrainAreaId }));
  const option = getDeathTrapTerrainOptions(s, { playerId: "p1" }).find((entry) => entry.terrainAreaId === terrainAreaId);
  assert.equal(option.trapped, true);
  assert.equal(option.trappedThisTurn, true);
});

test("Event Companion FAQ line works: kill first and trap the terrain later in the same turn still scores the three VP kill condition", () => {
  const s = buildState();
  const terrainAreaId = s.__targetTerrainId;
  s.history.push(killEvent(), trapEvent({ terrainAreaId }));
  s.units.find((unit) => unit.id === "target").status = "destroyed";
  s.units.find((unit) => unit.id === "target").wounds = 0;
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.missionName, "Death Trap");
  assert.equal(context.trappedKillSatisfied, true);
  assert.equal(context.trappedKillVp, 3);
  assert.equal(context.qualifyingKillCount, 1);
});

test("targeting an enemy that began in untrapped terrain preserves the conditional kill-now trap-later line", () => {
  const s = buildState({ phase: "shooting" });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1", targetUnitId: "target" });
  assert.equal(context.killOpportunity.terrainAreaId, s.__targetTerrainId);
  assert.equal(context.killOpportunity.conditionalOnLaterTrap, true);
  assert.equal(context.nextKillVpLeverage, 3);
  assert.ok(context.targetingScore >= 0.5);
  assert.match(context.reason, /trap does not need to exist/i);
});

test("non-home control is a single four VP condition, not four VP per objective", () => {
  const s = buildState();
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.nonHomeControlled, 1);
  assert.equal(context.nonHomeControlVp, 4);
  const second = s.objectives.find((objective) => objective.layoutObjective === "Central 1");
  second.control = control("p1");
  const updated = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(updated.nonHomeControlled, 2);
  assert.equal(updated.nonHomeControlVp, 4);
});

test("Death Trap outlook respects the fifteen VP round cap", () => {
  const s = buildState();
  const terrain = getDeathTrapTerrainOptions(s, { playerId: "p1" });
  const objectiveTerrain = terrain.filter((entry) => entry.containsObjective && !entry.objectiveIds.includes("event-companion:Attacker Home")).slice(0, 2);
  const ordinary = terrain.find((entry) => !entry.containsObjective);
  assert.ok(objectiveTerrain.length >= 2 && ordinary);
  s.history.push(
    trapEvent({ terrainAreaId: objectiveTerrain[0].terrainAreaId, unitId: "runner" }),
    trapEvent({ terrainAreaId: objectiveTerrain[1].terrainAreaId, unitId: "runner-2" }),
    trapEvent({ terrainAreaId: ordinary.terrainAreaId, unitId: "runner-3" }),
    killEvent()
  );
  const targetTerrain = s.__targetTerrainId;
  if (!s.history.some((event) => event.payload?.terrainAreaId === targetTerrain)) s.history.push(trapEvent({ terrainAreaId: targetTerrain, unitId: "runner-4" }));
  s.units.find((unit) => unit.id === "target").status = "destroyed";
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.ok(context.rawRecordedVp >= 15);
  assert.equal(context.cappedRecordedVp, 15);
});

test("objective signal combines available objective-terrain trap value with the binary non-home control breakpoint", () => {
  const s = buildState();
  const terrain = getDeathTrapTerrainOptions(s, { playerId: "p1" }).find((entry) => entry.containsObjective && !entry.objectiveIds.includes("event-companion:Attacker Home") && entry.objectiveIds.some((id) => s.objectives.find((objective) => objective.id === id)?.control?.controllerId !== "p1"));
  assert.ok(terrain);
  const objectiveId = terrain.objectiveIds[0];
  const objective = s.objectives.find((item) => item.id === objectiveId);
  objective.control = control(null);
  s.objectives.find((item) => item.layoutObjective === "Expansion 1").control = control(null);
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1", perspectivePlayerId: "p1", objectiveId, control: "uncontrolled", purpose: "claim-objective", primaryStrategy: context
  });
  assert.equal(signal.trapVpLeverage, 5);
  assert.equal(signal.controlVpLeverage, 4);
  assert.equal(signal.vpLeverage, 9);
});

test("movement router can elevate an untrapped objective terrain area for Booby Trap", () => {
  const s = buildState();
  const result = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(result.primaryStrategy?.missionName, "Death Trap");
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(runner);
  const options = [runner, ...(runner.alternatives ?? [])];
  assert.ok(options.some((item) => item.purpose === "booby-trap-terrain" || item.terrainAreaId));
});

test("immediately completed Booby Trap actions do not create a later mission-action completion review", () => {
  const s = buildState({ phase: "shooting" });
  s.history.push(trapEvent({ terrainAreaId: s.__targetTerrainId }));
  const reviews = getMissionActionReviews(s, { playerId: "p1", checkpoint: "end-of-turn", round: 2, turn: 2 });
  assert.equal(reviews.length, 0);
});

test("Shooting Action picker exposes Death Trap terrain-area selection and immediate completion copy", () => {
  const source = readFileSync(new URL("../../src/ui/mission-action-picker.js", import.meta.url), "utf8");
  const transition = readFileSync(new URL("../../src/engine/shooting-transitions.js", import.meta.url), "utf8");
  assert.match(source, /data-action-terrain/);
  assert.match(source, /Booby Trap completes immediately/);
  assert.match(transition, /terrainAreaId/);
  assert.match(transition, /That terrain area is already trapped/);
  assert.match(transition, /actionCompletedImmediately: true/);
});
