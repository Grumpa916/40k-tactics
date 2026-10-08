import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import { getFightState } from "../../src/rules/fight-state.js";

function fightState(overrides = {}) {
  return createGameState({
    phase: "fight",
    turn: 4,
    activePlayer: "p2",
    battle: { id: "b1", status: "active", round: 2 },
    units: [
      createUnit({ id: "u1", ownerId: "p1", name: "Unit 1", status: "deployed" }),
      createUnit({ id: "u2", ownerId: "p2", name: "Unit 2", status: "deployed" })
    ],
    ...overrides
  });
}

test("returns Fight context, candidates, and completion availability", () => {
  const state = fightState({
    history: [{
      type: "charge.outcome_recorded",
      payload: {
        unitId: "u1",
        outcome: "successful",
        round: 2,
        turn: 4
      }
    }]
  });

  assert.deepEqual(getFightState(state), {
    phase: "fight",
    round: 2,
    turn: 4,
    activePlayerId: "p2",
    candidates: {
      fightsFirst: ["u1"],
      normal: ["u2"],
      activated: []
    },
    activations: [],
    attacks: [],
    activationSummaries: [],
    canComplete: false
  });
});

test("returns current-turn Fight activations in event order", () => {
  const state = fightState({
    history: [
      {
        type: "fight.unit_activated",
        payload: {
          unitId: "u2",
          playerId: "p2",
          round: 2,
          turn: 4,
          fightsFirst: false
        }
      },
      {
        type: "fight.unit_activated",
        payload: {
          unitId: "u1",
          playerId: "p1",
          round: 2,
          turn: 4,
          fightsFirst: true
        }
      },
      {
        type: "fight.unit_activated",
        payload: {
          unitId: "u1",
          playerId: "p1",
          round: 1,
          turn: 3,
          fightsFirst: false
        }
      }
    ]
  });

  assert.deepEqual(getFightState(state).activations, [
    {
      unitId: "u2",
      playerId: "p2",
      round: 2,
      turn: 4,
      fightsFirst: false
    },
    {
      unitId: "u1",
      playerId: "p1",
      round: 2,
      turn: 4,
      fightsFirst: true
    }
  ]);
});

test("returns current-turn Fight attack summaries in event order", () => {
  const state = fightState({
    history: [
      {
        type: "combat.attack_resolved",
        payload: {
          attackerId: "u1",
          targetId: "u2",
          weaponId: "blade",
          phase: "fight",
          round: 2,
          turn: 4,
          result: {
            damage: { totalDamage: 3 }
          },
          stateDelta: {
            target: {
              woundsAfter: 2,
              statusAfter: "deployed"
            }
          }
        }
      },
      {
        type: "combat.attack_resolved",
        payload: {
          attackerId: "u2",
          targetId: "u1",
          weaponId: "claw",
          phase: "fight",
          round: 2,
          turn: 4,
          result: {
            damage: { totalDamage: 1 }
          },
          stateDelta: {
            target: {
              woundsAfter: 4,
              statusAfter: "deployed"
            }
          }
        }
      },
      {
        type: "combat.attack_resolved",
        payload: {
          attackerId: "u1",
          targetId: "u2",
          weaponId: "old-blade",
          phase: "fight",
          round: 2,
          turn: 3,
          result: {
            damage: { totalDamage: 5 }
          },
          stateDelta: {
            target: {
              woundsAfter: 0,
              statusAfter: "destroyed"
            }
          }
        }
      },
      {
        type: "combat.attack_resolved",
        payload: {
          attackerId: "u1",
          targetId: "u2",
          weaponId: "gun",
          phase: "shooting",
          round: 2,
          turn: 4,
          result: {
            damage: { totalDamage: 7 }
          },
          stateDelta: {
            target: {
              woundsAfter: 0,
              statusAfter: "destroyed"
            }
          }
        }
      }
    ]
  });

  assert.deepEqual(getFightState(state).attacks, [
    {
      attackerId: "u1",
      targetId: "u2",
      weaponId: "blade",
      round: 2,
      turn: 4,
      totalDamage: 3,
      targetWoundsAfter: 2,
      targetStatusAfter: "deployed"
    },
    {
      attackerId: "u2",
      targetId: "u1",
      weaponId: "claw",
      round: 2,
      turn: 4,
      totalDamage: 1,
      targetWoundsAfter: 4,
      targetStatusAfter: "deployed"
    }
  ]);
});

test("aggregates current-turn attacks into activation summaries", () => {
  const state = fightState({
    history: [
      {
        type: "fight.unit_activated",
        payload: {
          unitId: "u1",
          playerId: "p1",
          round: 2,
          turn: 4,
          fightsFirst: true
        }
      },
      {
        type: "fight.unit_activated",
        payload: {
          unitId: "u2",
          playerId: "p2",
          round: 2,
          turn: 4,
          fightsFirst: false
        }
      },
      {
        type: "combat.attack_resolved",
        payload: {
          attackerId: "u1",
          targetId: "u2",
          weaponId: "blade",
          phase: "fight",
          round: 2,
          turn: 4,
          result: { damage: { totalDamage: 3 } },
          stateDelta: {
            target: { woundsAfter: 4, statusAfter: "deployed" }
          }
        }
      },
      {
        type: "combat.attack_resolved",
        payload: {
          attackerId: "u1",
          targetId: "u2",
          weaponId: "fist",
          phase: "fight",
          round: 2,
          turn: 4,
          result: { damage: { totalDamage: 2 } },
          stateDelta: {
            target: { woundsAfter: 2, statusAfter: "deployed" }
          }
        }
      },
      {
        type: "combat.attack_resolved",
        payload: {
          attackerId: "u2",
          targetId: "u1",
          weaponId: "claw",
          phase: "fight",
          round: 2,
          turn: 4,
          result: { damage: { totalDamage: 1 } },
          stateDelta: {
            target: { woundsAfter: 4, statusAfter: "deployed" }
          }
        }
      }
    ]
  });

  assert.deepEqual(getFightState(state).activationSummaries, [
    {
      unitId: "u1",
      playerId: "p1",
      round: 2,
      turn: 4,
      fightsFirst: true,
      attackCount: 2,
      totalDamage: 5,
      targetIds: ["u2"]
    },
    {
      unitId: "u2",
      playerId: "p2",
      round: 2,
      turn: 4,
      fightsFirst: false,
      attackCount: 1,
      totalDamage: 1,
      targetIds: ["u1"]
    }
  ]);
});

test("reports completion available after all candidates are activated", () => {
  const state = fightState({
    history: [
      {
        type: "fight.unit_activated",
        payload: {
          unitId: "u1",
          round: 2,
          turn: 4,
          fightsFirst: false
        }
      },
      {
        type: "fight.unit_activated",
        payload: {
          unitId: "u2",
          round: 2,
          turn: 4,
          fightsFirst: false
        }
      }
    ]
  });

  assert.deepEqual(getFightState(state), {
    phase: "fight",
    round: 2,
    turn: 4,
    activePlayerId: "p2",
    candidates: {
      fightsFirst: [],
      normal: [],
      activated: ["u1", "u2"]
    },
    activations: [
      {
        unitId: "u1",
        playerId: null,
        round: 2,
        turn: 4,
        fightsFirst: false
      },
      {
        unitId: "u2",
        playerId: null,
        round: 2,
        turn: 4,
        fightsFirst: false
      }
    ],
    attacks: [],
    activationSummaries: [
      {
        unitId: "u1",
        playerId: null,
        round: 2,
        turn: 4,
        fightsFirst: false,
        attackCount: 0,
        totalDamage: 0,
        targetIds: []
      },
      {
        unitId: "u2",
        playerId: null,
        round: 2,
        turn: 4,
        fightsFirst: false,
        attackCount: 0,
        totalDamage: 0,
        targetIds: []
      }
    ],
    canComplete: true
  });
});

test("does not report completion available outside an active Fight phase", () => {
  assert.equal(
    getFightState(fightState({ phase: "charge" })).canComplete,
    false
  );
  assert.equal(
    getFightState(fightState({
      battle: { id: "b1", status: "complete", round: 2 }
    })).canComplete,
    false
  );
});

test("handles missing optional state collections without mutating state", () => {
  const state = createGameState({
    phase: "fight",
    turn: 1,
    activePlayer: null,
    battle: { id: "b1", status: "active", round: 1 },
    units: undefined,
    history: undefined
  });

  const before = structuredClone(state);
  const result = getFightState(state);

  assert.deepEqual(result, {
    phase: "fight",
    round: 1,
    turn: 1,
    activePlayerId: null,
    candidates: {
      fightsFirst: [],
      normal: [],
      activated: []
    },
    activations: [],
    attacks: [],
    activationSummaries: [],
    canComplete: true
  });
  assert.deepEqual(state, before);
});
