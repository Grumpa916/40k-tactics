import test from "node:test";
import assert from "node:assert/strict";
import {
  getPrimaryStrategyContext,
  getPrimaryObjectiveStrategySignal
} from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import {
  getReconnaissanceSweepQuarterForPosition,
  getReconnaissanceSweepQuarterState
} from "../../src/rules/tactical-reconnaissance-sweep-strategy.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function objective(id, layoutObjective, controllerId, x, y) {
  return { id, name: id, layoutObjective, position: { x, y }, control: control(controllerId) };
}

function unit(id, ownerId, x, y, { move = 8, oc = 2, rosterUnitId = id, battleShocked = false } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status: "deployed",
    position: { x, y },
    battleShocked,
    wounds: 5,
    startingStrength: 1,
    currentStrength: 1,
    startingWounds: 5,
    metadata: { rosterUnitId, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
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

function destructionEvent(id, turn) {
  return {
    id: `destroy-${id}-${turn}`,
    type: "unit.destroyed",
    payload: { unitId: id, ownerId: "p2", turn }
  };
}

function primaryAward(id, amount, round, turn, {
  missionDefinitionId = "prior-primary",
  scoringTiming = "end-of-turn",
  opportunityKey = id
} = {}) {
  return {
    id,
    type: "victory_points.awarded",
    payload: {
      playerId: "p1",
      amount,
      category: "primary",
      missionDefinitionId,
      scoringTiming,
      opportunityKey,
      round,
      turn,
      scoreBefore: 0,
      scoreAfter: amount
    }
  };
}

function priorPrimaryAwards(total) {
  const events = [];
  let remaining = total;
  let index = 0;
  while (remaining > 0) {
    const amount = Math.min(15, remaining);
    events.push(primaryAward(`prior-${index}`, amount, index + 1, 50 + index, {
      missionDefinitionId: `prior-primary-${index}`,
      opportunityKey: `prior:${index}`
    }));
    remaining -= amount;
    index += 1;
  }
  return events;
}

function state({
  round = 1,
  phase = "movement",
  positions = [[10, 10], [50, 10], [10, 34], [12, 12]],
  centralController = "p2",
  expansionController = "p2",
  commandAward = 0,
  kills = 0,
  priorPrimaryVp = 0,
  nullControl = false,
  rolesKnown = true
} = {}) {
  const turn = round;
  const objectives = [
    objective("event-companion:Attacker Home", "Attacker Home", "p1", 50, 5),
    objective("event-companion:Central 1", "Central 1", centralController, 30, 22),
    objective("event-companion:Expansion 1", "Expansion 1", expansionController, 18, 30),
    objective("event-companion:Defender Home", "Defender Home", "p2", 10, 39)
  ];
  if (nullControl) objectives[2].control = null;

  const friendly = positions.map(([x, y], index) =>
    unit(`scout-${index + 1}`, "p1", x, y, { rosterUnitId: `r-scout-${index + 1}` })
  );
  const history = [
    ...priorPrimaryAwards(priorPrimaryVp),
    ...Array.from({ length: kills }, (_, index) => destructionEvent(`enemy-${index + 1}`, turn)),
    ...(commandAward > 0 ? [primaryAward("recon-command", commandAward, round, turn, {
      missionDefinitionId: "primary-reconnaissance-sweep",
      scoringTiming: "command-phase",
      opportunityKey: `${round}:${turn}:p1:command-phase`
    })] : [])
  ];

  return {
    phase,
    turn,
    activePlayer: "p1",
    battle: { status: "active", round, activePlayerId: "p1" },
    preGameSetup: rolesKnown ? { attackerPlayerId: "p1", defenderPlayerId: "p2" } : {},
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: {
      missionSetup: {
        myDisposition: "Reconnaissance",
        opponentDisposition: "Take and Hold",
        layout: "A"
      }
    },
    victoryPoints: { p1: priorPrimaryVp + commandAward, p2: 0 },
    commandPoints: { p1: 2, p2: 2 },
    objectives,
    units: [
      ...friendly,
      unit("enemy-live", "p2", 45, 35, { rosterUnitId: "r-enemy" })
    ],
    history,
    scoring: {
      turnSnapshots: [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: friendly.map((entry) => rosterUnit(entry.metadata.rosterUnitId)) },
      p2: { units: [rosterUnit("r-enemy")] }
    }
  };
}

function strategy(s, options = {}) {
  return getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1", ...options });
}

function signal(s, objectiveId, options = {}) {
  const primaryStrategy = strategy(s);
  return getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId,
    primaryStrategy,
    ...options
  });
}

test("router selects the dedicated Reconnaissance Sweep strategy", () => {
  const context = strategy(state());
  assert.equal(context.active, true);
  assert.equal(context.supported, true);
  assert.equal(context.missionName, "Reconnaissance Sweep");
  assert.equal(context.disposition, "Reconnaissance");
});

test("approximate positions in three different quarters expose the three-VP tier", () => {
  const s = state();
  const quarters = getReconnaissanceSweepQuarterState(s, { playerId: "p1" });
  const context = strategy(s);
  assert.equal(quarters.representedQuarterCount, 3);
  assert.equal(quarters.mapQuarterVpEstimate, 3);
  assert.equal(context.mapQuarterCount, 3);
  assert.equal(context.mapQuarterVpEstimate, 3);
  assert.match(context.assumptions.join(" "), /advisory only/i);
});

test("all four represented quarters expose the six-VP tier", () => {
  const context = strategy(state({ positions: [[10, 10], [50, 10], [10, 34], [50, 34]] }));
  assert.equal(context.mapQuarterCount, 4);
  assert.equal(context.mapQuarterVpEstimate, 6);
  assert.match(context.reason, /preserve|additional|current/i);
});

test("positions within six inches of centre or on a quarter boundary are not treated as a represented quarter", () => {
  assert.equal(getReconnaissanceSweepQuarterForPosition({ x: 31, y: 22 }).quarterId, null);
  assert.equal(getReconnaissanceSweepQuarterForPosition({ x: 31, y: 22 }).withinCentreExclusion, true);
  assert.equal(getReconnaissanceSweepQuarterForPosition({ x: 30, y: 10 }).quarterId, null);
  assert.equal(getReconnaissanceSweepQuarterForPosition({ x: 30, y: 10 }).onQuarterBoundary, true);

  const context = strategy(state({ positions: [[10, 10], [50, 10], [31, 22], [30, 10]] }));
  assert.equal(context.mapQuarterCount, 2);
  assert.equal(context.mapQuarterVpEstimate, 0);
});

test("each recorded enemy destruction adds one raw VP and one more kill has one VP leverage before caps", () => {
  const context = strategy(state({ kills: 2 }));
  assert.equal(context.enemyKillsThisTurn, 2);
  assert.equal(context.rawAdvisoryVp, 5);
  assert.equal(context.nextKillVpLeverage, 1);
  assert.equal(context.targetingScore, 0.34);
});

test("Round 2 Command control of any non-home objective is a binary three-VP condition", () => {
  const s = state({ round: 2, phase: "command", centralController: "p1", expansionController: "p1" });
  const context = strategy(s);
  assert.equal(context.nonHomeControlled, 2);
  assert.equal(context.controlSatisfied, true);
  assert.equal(context.controlVpForProjection, 3);

  const extra = signal(s, "event-companion:Expansion 1", { control: "controlled", purpose: "hold-objective" });
  assert.equal(extra.vpLeverage, 0);
  assert.match(extra.reason, /already covered|only controlled/i);
});

test("post-Command Round 2 capture cannot retroactively score and instead stages the next checkpoint", () => {
  const s = state({ round: 2, phase: "movement", centralController: "p2", expansionController: "p2" });
  const context = strategy(s);
  const objectiveSignal = signal(s, "event-companion:Central 1", { control: "enemy-controlled", purpose: "contest-objective" });
  assert.equal(context.controlCheckpointCompleted, true);
  assert.equal(context.controlVpForProjection, 0);
  assert.equal(objectiveSignal.vpLeverage, 0);
  assert.equal(objectiveSignal.stagingVpLeverage, 3);
  assert.match(objectiveSignal.reason, /cannot score retroactively/i);
});

test("Round 5 moves the non-home control checkpoint to end of turn", () => {
  const s = state({ round: 5, phase: "movement", centralController: "p2", expansionController: "p2" });
  const context = strategy(s);
  const objectiveSignal = signal(s, "event-companion:Central 1", { control: "enemy-controlled" });
  assert.equal(context.controlCheckpointTiming, "end-of-turn");
  assert.equal(context.controlCheckpointCompleted, false);
  assert.equal(objectiveSignal.vpLeverage, 3);
});

test("player home objective is excluded from the Reconnaissance Sweep control condition", () => {
  const s = state({ round: 5 });
  const objectiveSignal = signal(s, "event-companion:Attacker Home", { control: "controlled", purpose: "hold-objective" });
  assert.equal(objectiveSignal.ownHome, true);
  assert.equal(objectiveSignal.vpLeverage, 0);
  assert.equal(objectiveSignal.stagingVpLeverage, 0);
  assert.match(objectiveSignal.reason, /excluded/i);
});

test("incomplete objective evidence does not fabricate exact control leverage", () => {
  const s = state({ round: 5, nullControl: true });
  const context = strategy(s);
  const objectiveSignal = signal(s, "event-companion:Central 1", { control: "enemy-controlled" });
  assert.equal(context.objectiveStateKnown, false);
  assert.equal(context.controlVpForProjection, 0);
  assert.equal(objectiveSignal.vpLeverage, 0);
  assert.match(objectiveSignal.reason, /player-confirmed|incomplete/i);
});

test("Primary game cap removes further kill and objective leverage", () => {
  const s = state({ round: 5, priorPrimaryVp: 45, centralController: "p2", expansionController: "p2" });
  const context = strategy(s);
  const objectiveSignal = signal(s, "event-companion:Central 1", { control: "enemy-controlled" });
  assert.equal(context.remainingPrimaryGameVp, 0);
  assert.equal(context.additionalPrimaryAllowance, 0);
  assert.equal(context.nextKillVpLeverage, 0);
  assert.equal(objectiveSignal.vpLeverage, 0);
  assert.match(objectiveSignal.reason, /45 VP Primary game cap/i);
});

test("Movement routing elevates spreading a duplicate-quarter unit into the missing fourth quarter", () => {
  const s = state({ positions: [[10, 10], [50, 10], [10, 34], [12, 12]] });
  const movement = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(movement.primaryStrategy?.missionName, "Reconnaissance Sweep");
  const spread = movement.recommendations.find((entry) => entry.territoryTarget === "lower-right quarter");
  assert.ok(spread);
  assert.match(spread.recommendation, /spread toward the lower-right quarter/i);
  assert.match(spread.reason, /wholly-within|wholly inside|positional tier/i);
});
