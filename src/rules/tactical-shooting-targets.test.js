import test from "node:test";
import assert from "node:assert/strict";
import { getShootingTargetPriorities } from "./tactical-shooting-targets.js";

function baseState() {
  return {
    phase: "shooting",
    battle: { status: "active", round: 1 },
    turn: 1,
    activePlayer: "p1",
    units: [
      {
        id: "shooter",
        ownerId: "p1",
        status: "deployed",
        position: { x: 0, y: 0 },
        characteristics: { ballisticSkill: 3 }
      },
      {
        id: "close-target",
        ownerId: "p2",
        status: "deployed",
        wounds: 5,
        position: { x: 6, y: 0 },
        characteristics: { toughness: 4, save: 4 }
      },
      {
        id: "far-target",
        ownerId: "p2",
        status: "deployed",
        wounds: 5,
        position: { x: 30, y: 0 },
        characteristics: { toughness: 4, save: 4 }
      },
      {
        id: "dead-target",
        ownerId: "p2",
        status: "destroyed",
        wounds: 0,
        position: { x: 3, y: 0 }
      }
    ],
    history: []
  };
}

test("ranks nearby enemy targets ahead of distant targets", () => {
  const result = getShootingTargetPriorities(baseState(), {
    playerId: "p1",
    attackerId: "shooter",
    weapon: {
      id: "rifle",
      name: "Rifle",
      type: "ranged",
      characteristics: { range: 24 }
    }
  });

  assert.equal(result.priorities[0].targetUnitId, "close-target");
  assert.equal(result.priorities[0].targetBand, "close");
  assert.equal(result.priorities[0].weaponId, "rifle");
});

test("uses weapon range as an advisory signal without hiding targets", () => {
  const result = getShootingTargetPriorities(baseState(), {
    playerId: "p1",
    attackerId: "shooter",
    weapon: {
      id: "short",
      name: "Short weapon",
      type: "ranged",
      characteristics: { range: 12 }
    }
  });

  const far = result.priorities.find((item) => item.targetUnitId === "far-target");
  assert.ok(far);
  assert.match(far.reason, /beyond the weapon's approximate range/);
});

test("does not recommend an enemy currently engaged with the shooting unit", () => {
  const state = baseState();
  state.history = [
    {
      type: "charge.outcome_recorded",
      payload: {
        unitId: "close-target",
        playerId: "p2",
        outcome: "successful",
        targetIds: ["shooter"],
        round: 1,
        turn: 1
      }
    }
  ];

  const result = getShootingTargetPriorities(state, {
    playerId: "p1",
    attackerId: "shooter"
  });

  assert.equal(
    result.priorities.some((item) => item.targetUnitId === "close-target"),
    false
  );
  assert.equal(
    result.priorities.some((item) => item.targetUnitId === "far-target"),
    true
  );
});

test("does not recommend destroyed targets", () => {
  const result = getShootingTargetPriorities(baseState(), {
    playerId: "p1",
    attackerId: "shooter"
  });

  assert.equal(result.priorities.some((item) => item.targetUnitId === "dead-target"), false);
});


test("includes baseline expected damage when complete profiles are available", () => {
  const result = getShootingTargetPriorities(baseState(), {
    playerId: "p1",
    attackerId: "shooter",
    weapon: {
      id: "rifle",
      type: "ranged",
      characteristics: { range: 24, attacks: 4, strength: 5, ap: -1, damage: 2 }
    }
  });

  const close = result.priorities.find((item) => item.targetUnitId === "close-target");
  assert.ok(close);
  assert.equal(typeof close.expectedDamage, "number");
  assert.ok(close.expectedDamage > 0);
  assert.match(close.reason, /Baseline expected damage is approximately/);
});

test("keeps targets eligible when expected-damage profiles are incomplete", () => {
  const result = getShootingTargetPriorities(baseState(), {
    playerId: "p1",
    attackerId: "shooter",
    weapon: {
      id: "incomplete",
      type: "ranged",
      characteristics: { range: 24 }
    }
  });

  assert.equal(result.priorities.length, 2);
  assert.equal(result.priorities.every((item) => item.expectedDamage === null), true);
});
