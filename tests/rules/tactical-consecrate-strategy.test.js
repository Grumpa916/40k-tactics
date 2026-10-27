import test from "node:test";
import assert from "node:assert/strict";
import {
  getPrimaryStrategyContext,
  getPrimaryObjectiveStrategySignal
} from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { getTargetStrategicContext } from "../../src/rules/tactical-target-context.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function objective(id, layoutObjective, controllerId, x, y) {
  return { id, name: id, layoutObjective, position: { x, y }, control: control(controllerId) };
}

function unit(id, ownerId, x, y, { move = 6, oc = 2, rosterUnitId = id, status = "deployed" } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status,
    position: { x, y },
    wounds: status === "destroyed" ? 0 : 5,
    startingStrength: 1,
    currentStrength: status === "destroyed" ? 0 : 1,
    startingWounds: 5,
    metadata: { rosterUnitId, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function rosterUnit(id, { move = 6, oc = 2, weapons = [] } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons
    }
  };
}

function killEvent(attackerId = "carrier", targetId = "dead-enemy", turn = 2) {
  return {
    type: "combat.attack_resolved",
    payload: {
      turn,
      round: 2,
      phase: "shooting",
      attackerId,
      targetId,
      stateDelta: { target: { unitId: targetId, statusBefore: "deployed", statusAfter: "destroyed" } }
    }
  };
}

function consecratedEvent(unitId, objectiveId, turn = 1) {
  return {
    type: "primary.objective_consecrated",
    payload: { playerId: "p1", unitId, objectiveId, turn, round: Math.max(1, turn), phase: "end_turn", tabletopConfirmed: true }
  };
}

function state({ phase = "movement", consecrated = [], includeCarrier = true } = {}) {
  const history = [
    ...consecrated.map((objectiveId, index) => consecratedEvent(`old-carrier-${index + 1}`, objectiveId, index + 1)),
    ...(includeCarrier ? [killEvent()] : [])
  ];
  return {
    phase,
    turn: 3,
    activePlayer: "p1",
    battle: { status: "active", round: 3, activePlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: {
      missionSetup: {
        myDisposition: "Purge the Foe",
        opponentDisposition: "Reconnaissance",
        layout: "A"
      }
    },
    victoryPoints: { p1: 20, p2: 20 },
    commandPoints: { p1: 2, p2: 2 },
    objectives: [
      objective("event-companion:Attacker Home", "Attacker Home", "p1", 8, 22),
      objective("event-companion:Expansion 1", "Expansion 1", "p1", 20, 22),
      objective("event-companion:Central 1", "Central 1", "p2", 30, 22),
      objective("event-companion:Central 2", "Central 2", null, 36, 22),
      objective("event-companion:Defender Home", "Defender Home", "p2", 52, 22)
    ],
    units: [
      unit("carrier", "p1", 25, 22, { move: 8, oc: 3, rosterUnitId: "r-carrier" }),
      unit("holder", "p1", 20, 22, { move: 6, oc: 3, rosterUnitId: "r-holder" }),
      unit("target", "p2", 32, 22, { move: 6, oc: 2, rosterUnitId: "r-target" }),
      unit("dead-enemy", "p2", 26, 22, { move: 6, oc: 2, rosterUnitId: "r-dead", status: "destroyed" })
    ],
    history,
    scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" } },
    armyRosters: {
      p1: { units: [
        rosterUnit("r-carrier", { move: 8, oc: 3, weapons: [{ name: "Rifle", range: 18, attacks: 2, skill: "3+", strength: 5, ap: -1, damage: 2 }] }),
        rosterUnit("r-holder", { move: 6, oc: 3 })
      ] },
      p2: { units: [rosterUnit("r-target"), rosterUnit("r-dead")] }
    }
  };
}

test("Consecrate context tracks marker tier, carriers, control and endgame separately", () => {
  const s = state({ consecrated: ["event-companion:Expansion 1"] });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.active, true);
  assert.equal(context.missionName, "Consecrate");
  assert.equal(context.consecratedCount, 1);
  assert.equal(context.endTurnConsecrationVp, 3);
  assert.deepEqual(context.consecrationUnitIds, ["carrier"]);
  assert.equal(context.nonHomeSatisfied, true);
  assert.equal(context.majoritySatisfied, false);
  assert.equal(context.opponentHomeConsecrated, false);
  assert.equal(context.opponentHomeEndBattleVpLeverage, 5);
  assert.equal(context.rawRecordedVp, 7);
  assert.equal(context.cappedRecordedVp, 7);
});

test("the third consecrated objective raises the marker tier from 3 VP to 6 VP", () => {
  const s = state({ consecrated: ["event-companion:Expansion 1", "event-companion:Central 2"] });
  const context = getPrimaryStrategyContext(s, { playerId: "p1" });
  assert.equal(context.consecratedCount, 2);
  assert.equal(context.endTurnConsecrationVp, 3);
  assert.equal(context.nextKillVpLeverage, 3);

  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    objectiveId: "event-companion:Central 1",
    unitId: "carrier",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.equal(signal.unitIsConsecration, true);
  assert.equal(signal.availableToConsecrate, true);
  assert.ok(signal.vpLeverage >= 3);
  assert.match(signal.reason, /unlock 3 additional VP/i);
});

test("opponent home is a five VP Consecrate destination for an active consecration unit", () => {
  const s = state({ consecrated: ["event-companion:Expansion 1"] });
  const context = getPrimaryStrategyContext(s, { playerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    objectiveId: "event-companion:Defender Home",
    unitId: "carrier",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.equal(signal.opponentHome, true);
  assert.equal(signal.unitIsConsecration, true);
  assert.ok(signal.vpLeverage >= 5);
  assert.match(signal.reason, /5 VP end-of-battle condition/i);
});

test("Consecrate does not model an enemy kill as automatic Primary VP", () => {
  const s = state({ consecrated: [], includeCarrier: false });
  s.phase = "shooting";
  const strategic = getTargetStrategicContext(s, { playerId: "p1", perspectivePlayerId: "p1", targetUnitId: "target" });
  assert.equal(strategic.primaryStrategy.active, true);
  assert.equal(strategic.primaryStrategy.missionName, "Consecrate");
  assert.equal(strategic.primaryStrategy.nextKillVpLeverage, 3);
  assert.match(strategic.primaryStrategy.reason, /can create a consecration unit|must still finish a turn/i);
  assert.ok(strategic.primaryStrategy.targetingScore < 0.5);
});

test("movement advisor prioritizes an active consecration unit toward an unconsecrated objective", () => {
  const s = state({ consecrated: ["event-companion:Expansion 1", "event-companion:Central 2"] });
  const result = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(result.primaryStrategy.missionName, "Consecrate");
  const carrier = result.recommendations.find((item) => item.unitId === "carrier");
  assert.ok(carrier);
  const options = [carrier, ...(carrier.alternatives ?? [])];
  const consecrateOption = options.find((item) => item.primaryStrategySignal?.unitIsConsecration && item.primaryStrategySignal?.availableToConsecrate);
  assert.ok(consecrateOption, "carrier should retain a Consecrate destination among its top movement options");
  assert.match(consecrateOption.reason, /consecration unit/i);
  assert.ok(consecrateOption.primaryStrategySignal.vpLeverage >= 3);
});

test("already consecrated objectives do not receive another marker opportunity", () => {
  const s = state({ consecrated: ["event-companion:Expansion 1"] });
  const context = getPrimaryStrategyContext(s, { playerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    objectiveId: "event-companion:Expansion 1",
    unitId: "carrier",
    control: "controlled",
    purpose: "hold-objective",
    primaryStrategy: context
  });
  assert.equal(signal.alreadyConsecrated, true);
  assert.equal(signal.availableToConsecrate, false);
  assert.match(signal.reason, /already consecrated/i);
});
