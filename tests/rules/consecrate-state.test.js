import test from "node:test";
import assert from "node:assert/strict";
import {
  getConsecratedObjectiveIds,
  getConsecrationUnitIds,
  getConsecrateReviewState,
  isConsecrateReviewRequired
} from "../../src/rules/consecrate-state.js";
import { recordConsecrateReview } from "../../src/engine/consecrate-transitions.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function unit(id, ownerId, status = "deployed", x = 10, y = 10) {
  return { id, ownerId, name: id, status, position: { x, y }, wounds: status === "destroyed" ? 0 : 5 };
}

function killEvent({ turn = 3, attackerId = "carrier", targetId = "enemy" } = {}) {
  return {
    type: "combat.attack_resolved",
    payload: {
      turn,
      round: 3,
      phase: "shooting",
      attackerId,
      targetId,
      stateDelta: {
        target: {
          unitId: targetId,
          statusBefore: "deployed",
          statusAfter: "destroyed",
          woundsBefore: 5,
          woundsAfter: 0
        }
      }
    }
  };
}

function state() {
  return {
    phase: "end_turn",
    turn: 3,
    activePlayer: "p1",
    battle: { status: "active", round: 3, activePlayerId: "p1" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    battlefieldMap: {
      missionSetup: {
        myDisposition: "Purge the Foe",
        opponentDisposition: "Reconnaissance",
        layout: "A"
      }
    },
    objectives: [
      { id: "event-companion:Attacker Home", layoutObjective: "Attacker Home", position: { x: 8, y: 22 }, control: control("p1") },
      { id: "event-companion:Expansion 1", layoutObjective: "Expansion 1", position: { x: 18, y: 22 }, control: control("p1") },
      { id: "event-companion:Central 1", layoutObjective: "Central 1", position: { x: 30, y: 22 }, control: control("p2") },
      { id: "event-companion:Defender Home", layoutObjective: "Defender Home", position: { x: 52, y: 22 }, control: control("p2") }
    ],
    units: [
      unit("carrier", "p1", "deployed", 27, 22),
      unit("enemy", "p2", "destroyed", 28, 22)
    ],
    history: [killEvent()],
    scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: {} },
    armyRosters: {}
  };
}

test("destroying an enemy makes the attacker a persistent consecration unit", () => {
  const s = state();
  assert.deepEqual(getConsecrationUnitIds(s, "p1"), ["carrier"]);
  const review = getConsecrateReviewState(s, { playerId: "p1" });
  assert.equal(review.required, true);
  assert.equal(review.consecratedCount, 0);
  assert.equal(review.endTurnConsecrationVp, 0);
  assert.deepEqual(review.deployedConsecrationUnits.map((item) => item.id), ["carrier"]);
  assert.ok(review.availableObjectives.some((item) => item.id === "event-companion:Defender Home"));
  assert.ok(!review.availableObjectives.some((item) => item.id === "event-companion:Attacker Home"));
});

test("recording a consecration marks the objective and clears that unit's consecration status", () => {
  const s = state();
  const next = recordConsecrateReview(s, {
    playerId: "p1",
    assignments: [{ unitId: "carrier", objectiveId: "event-companion:Central 1" }],
    tabletopConfirmed: true
  });
  assert.deepEqual(getConsecratedObjectiveIds(next, "p1"), ["event-companion:Central 1"]);
  assert.deepEqual(getConsecrationUnitIds(next, "p1"), []);
  const review = getConsecrateReviewState(next, { playerId: "p1" });
  assert.equal(review.reviewedThisTurn, true);
  assert.equal(review.required, false);
  assert.equal(review.consecratedCount, 1);
  assert.equal(review.endTurnConsecrationVp, 3);
});

test("reviewing with no assignment leaves the unit as a consecration unit for a later turn", () => {
  const s = state();
  const reviewed = recordConsecrateReview(s, { playerId: "p1", assignments: [] });
  assert.deepEqual(getConsecrationUnitIds(reviewed, "p1"), ["carrier"]);
  assert.equal(getConsecrateReviewState(reviewed, { playerId: "p1" }).required, false);

  const later = {
    ...reviewed,
    turn: 5,
    battle: { ...reviewed.battle, round: 4 },
    phase: "end_turn"
  };
  const laterReview = getConsecrateReviewState(later, { playerId: "p1" });
  assert.equal(laterReview.required, true);
  assert.deepEqual(laterReview.allConsecrationUnitIds, ["carrier"]);
});

test("Consecrate review is gated to the active player's end of turn", () => {
  const s = state();
  assert.equal(isConsecrateReviewRequired(s, { playerId: "p1" }), true);
  assert.equal(isConsecrateReviewRequired({ ...s, phase: "fight" }, { playerId: "p1" }), false);
  assert.equal(isConsecrateReviewRequired({ ...s, activePlayer: "p2", battle: { ...s.battle, activePlayerId: "p2" } }, { playerId: "p1" }), false);
});

test("own home cannot be consecrated, but opponent home can be", () => {
  const s = state();
  assert.throws(() => recordConsecrateReview(s, {
    playerId: "p1",
    assignments: [{ unitId: "carrier", objectiveId: "event-companion:Attacker Home" }],
    tabletopConfirmed: true
  }), /home objective cannot be consecrated/i);

  const next = recordConsecrateReview(s, {
    playerId: "p1",
    assignments: [{ unitId: "carrier", objectiveId: "event-companion:Defender Home" }],
    tabletopConfirmed: true
  });
  const review = getConsecrateReviewState(next, { playerId: "p1" });
  assert.equal(review.opponentHomeConsecrated, true);
  assert.deepEqual(review.opponentHomeObjectiveIds, ["event-companion:Defender Home"]);
});

test("selected objective range remains tabletop-confirmed rather than map-authoritative", () => {
  const s = state();
  assert.throws(() => recordConsecrateReview(s, {
    playerId: "p1",
    assignments: [{ unitId: "carrier", objectiveId: "event-companion:Central 1" }],
    tabletopConfirmed: false
  }), /physical tabletop/i);
});
