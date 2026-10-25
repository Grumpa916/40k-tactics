import test from "node:test";
import assert from "node:assert/strict";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-opportunities.js";
import { renderMovementAdvisor } from "../../src/ui/movement-advisor.js";

function unitAt(x, y = 22) {
  return {
    id: "mover",
    ownerId: "p1",
    name: "Forward Unit",
    status: "deployed",
    position: { x, y },
    startingStrength: 1,
    currentStrength: 1,
    startingWounds: 5,
    wounds: 5,
    metadata: { rosterUnitId: "r-mover", modelCount: 1 },
    profile: { characteristics: { movement: 6, objectiveControl: 2, toughness: 5, save: 3, wounds: 5 } }
  };
}

function activeSecondary({ verified = true, summary = "The unit is not within your territory.", name = "Territory Mission" } = {}) {
  return {
    instanceId: "secondary-1",
    playerId: "p1",
    status: "active",
    definition: {
      id: "territory-mission",
      name,
      rulesVerified: verified,
      scoringWindows: [{ tiers: [{ vp: 5, summary }] }]
    }
  };
}

function stateAt(x, secondary = activeSecondary()) {
  return {
    phase: "movement",
    turn: 1,
    activePlayer: "p1",
    battle: { status: "active", round: 3, activePlayerId: "p1" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    victoryPoints: { p1: 12, p2: 15 },
    commandPoints: { p1: 2, p2: 2 },
    history: [],
    objectives: [],
    units: [unitAt(x)],
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    battlefieldMap: {
      missionSetup: { myDisposition: "Take and Hold", opponentDisposition: "Take and Hold", layout: "A" },
      actualDeployment: {}
    },
    scoring: {
      turnSnapshots: [],
      secondaryMissions: secondary ? [secondary] : [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: {
        units: [{
          id: "r-mover",
          loadoutValidation: { status: "valid" },
          datasheet: { characteristics: { Move: '6"', OC: 2, Wounds: 5, Toughness: 5, Save: "3+" }, weapons: [] }
        }]
      },
      p2: { units: [] }
    }
  };
}

test("verified outside-own-territory secondary can elevate crossing the territory line", () => {
  const result = getMovementStrategicRecommendations(stateAt(36), { playerId: "p1" });
  const mover = result.recommendations[0];

  assert.equal(mover.purpose, "enter-opponent-territory");
  assert.equal(mover.territoryTarget, "opponent");
  assert.equal(mover.territory?.territory, "mine");
  assert.equal(result.territorySignal.directOutsideOwn, 0.24);
  assert.deepEqual(result.territorySignal.missions, ["Territory Mission"]);
  assert.match(mover.actionHint, /Normal Move can plausibly cross/i);
  assert.match(mover.reason, /Verified territory-relevant secondary context/i);
});

test("review-only territory mission stays visible but contributes no ranking bonus", () => {
  const reviewState = stateAt(36, activeSecondary({ verified: false, name: "Review Beacon" }));
  const reviewResult = getMovementStrategicRecommendations(reviewState, { playerId: "p1" });
  const reviewMover = reviewResult.recommendations[0];
  const options = [reviewMover, ...(reviewMover.alternatives ?? [])];
  const territoryOption = options.find((option) => option.territoryTarget === "opponent");

  assert.equal(reviewResult.territorySignal.score, 0);
  assert.deepEqual(reviewResult.territorySignal.missions, []);
  assert.deepEqual(reviewResult.territorySignal.reviewOnlyMissions, ["Review Beacon"]);
  assert.ok(territoryOption);
  assert.match(territoryOption.reason, /does not change the numeric ranking/i);
});

test("unit already beyond the dotted line can be advised to preserve opponent territory", () => {
  const result = getMovementStrategicRecommendations(stateAt(24), { playerId: "p1" });
  const mover = result.recommendations[0];

  assert.equal(mover.purpose, "hold-opponent-territory");
  assert.equal(mover.territory?.territory, "opponent");
  assert.match(mover.recommendation, /preserve the opponent-territory position/i);
});

test("positions inside the uncertainty band require tabletop confirmation", () => {
  const result = getMovementStrategicRecommendations(stateAt(30), { playerId: "p1" });
  const mover = result.recommendations[0];
  const options = [mover, ...(mover.alternatives ?? [])];
  const boundary = options.find((option) => option.purpose === "confirm-territory-boundary");

  assert.ok(boundary);
  assert.equal(boundary.territoryTarget, "boundary");
  assert.equal(boundary.confidence, "low");
  assert.match(boundary.reason, /±3" advisory band/i);
});

test("opponent deployment-zone text is forward staging, not equivalent to opponent territory", () => {
  const result = getMovementStrategicRecommendations(stateAt(36, activeSecondary({
    summary: "A friendly unit is wholly within the opponent's deployment zone.",
    name: "Behind Enemy Lines"
  })), { playerId: "p1" });

  assert.equal(result.territorySignal.directOutsideOwn, 0);
  assert.equal(result.territorySignal.forwardStaging, 0.08);
  assert.deepEqual(result.territorySignal.missions, ["Behind Enemy Lines"]);
});

test("Movement Advisor renders territory destinations and the dotted-line guardrail", () => {
  const current = stateAt(36);
  const html = renderMovementAdvisor(current, { playerId: "p1", selectedUnitId: "mover" });

  assert.match(html, /Territory · Opponent/);
  assert.match(html, /dotted territory boundary/i);
  assert.match(html, /Positions within ±3&quot;|Positions within ±3"/i);
  assert.match(html, /Only verified mission text changes movement ranking/i);
});
