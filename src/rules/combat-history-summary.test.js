import test from "node:test";
import assert from "node:assert/strict";
import { getCombatHistorySummary } from "./combat-history-summary.js";

function unit(id, ownerId, overrides = {}) {
  return {
    id,
    ownerId,
    name: id,
    status: "deployed",
    wounds: 5,
    ...overrides
  };
}

test("summarizes opponent shooting, charge, fight, damage, and current engagement from history", () => {
  const state = {
    battle: { status: "active", round: 2 },
    turn: 3,
    units: [
      unit("my-unit", "p1", { wounds: 3 }),
      unit("my-other", "p1"),
      unit("enemy-shooter", "p2"),
      unit("enemy-charger", "p2")
    ],
    history: [
      {
        type: "charge.outcome_recorded",
        payload: {
          unitId: "enemy-charger",
          playerId: "p2",
          outcome: "successful",
          targetIds: ["my-unit"],
          round: 2,
          turn: 2
        }
      },
      {
        type: "combat.attack_resolved",
        payload: {
          attackerId: "enemy-shooter",
          targetId: "my-unit",
          weaponId: "enemy-gun",
          phase: "shooting",
          round: 2,
          turn: 2,
          expectedDamage: 2,
          actualDamage: 2,
          stateDelta: {
            target: {
              woundsBefore: 5,
              woundsAfter: 3,
              statusBefore: "deployed",
              statusAfter: "deployed"
            }
          }
        }
      },
      {
        type: "fight.unit_activated",
        payload: {
          unitId: "enemy-charger",
          playerId: "p2",
          round: 2,
          turn: 2
        }
      },
      {
        type: "combat.attack_resolved",
        payload: {
          attackerId: "enemy-charger",
          targetId: "my-unit",
          weaponId: "claw",
          phase: "fight",
          round: 2,
          turn: 2,
          expectedDamage: 1,
          actualDamage: 1,
          stateDelta: {
            target: {
              woundsBefore: 4,
              woundsAfter: 3,
              statusBefore: "deployed",
              statusAfter: "deployed"
            }
          }
        }
      }
    ]
  };

  const summary = getCombatHistorySummary(state, { playerId: "p1" });
  const mine = summary.units.find((entry) => entry.unitId === "my-unit");

  assert.deepEqual(summary.opponentPlayerIds, ["p2"]);
  assert.equal(mine.damageTaken, 2);
  assert.equal(mine.shotsReceived.length, 1);
  assert.equal(mine.chargesReceived.length, 1);
  assert.equal(mine.fights.length, 1);
  assert.deepEqual(mine.engagedWith, ["enemy-charger"]);
  assert.equal(summary.opponentActions.length, 3);
});

test("destroyed targets are no longer reported as engaged", () => {
  const state = {
    battle: { status: "active", round: 1 },
    turn: 2,
    units: [
      unit("my-unit", "p1", { wounds: 0, status: "destroyed" }),
      unit("enemy", "p2")
    ],
    history: [
      {
        type: "charge.outcome_recorded",
        payload: {
          unitId: "enemy",
          playerId: "p2",
          outcome: "successful",
          targetIds: ["my-unit"],
          round: 1,
          turn: 1
        }
      },
      {
        type: "combat.attack_resolved",
        payload: {
          attackerId: "enemy",
          targetId: "my-unit",
          weaponId: "claw",
          phase: "fight",
          round: 1,
          turn: 1,
          actualDamage: 5,
          stateDelta: {
            target: {
              woundsBefore: 5,
              woundsAfter: 0,
              statusBefore: "deployed",
              statusAfter: "destroyed"
            }
          }
        }
      }
    ]
  };

  const summary = getCombatHistorySummary(state, { playerId: "p1" });
  assert.deepEqual(summary.units[0].engagedWith, []);
  assert.equal(summary.units[0].destroyed, true);
});
