import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import { getFightCandidates } from "../../src/rules/fight-candidates.js";

function fightState(overrides = {}) {
  return createGameState({
    phase: "fight",
    turn: 2,
    activePlayer: "p1",
    battle: { id: "b1", status: "active", round: 1 },
    units: [
      createUnit({ id: "charged", ownerId: "p1", name: "Charged", status: "deployed" }),
      createUnit({ id: "normal", ownerId: "p2", name: "Normal", status: "deployed" }),
      createUnit({ id: "reserve", ownerId: "p1", name: "Reserve", status: "reserves" }),
      createUnit({ id: "destroyed", ownerId: "p2", name: "Destroyed", status: "destroyed" })
    ],
    ...overrides
  });
}

test("returns deployed unactivated units as Fights First or normal", () => {
  const state = fightState({
    history: [{
      type: "charge.outcome_recorded",
      payload: {
        unitId: "charged",
        outcome: "successful",
        round: 1,
        turn: 2
      }
    }]
  });

  assert.deepEqual(getFightCandidates(state), {
    fightsFirst: ["charged"],
    normal: ["normal"],
    activated: []
  });
});

test("excludes reserves and destroyed units", () => {
  const state = fightState({
    history: [{
      type: "charge.outcome_recorded",
      payload: {
        unitId: "reserve",
        outcome: "successful",
        round: 1,
        turn: 2
      }
    }]
  });

  assert.deepEqual(getFightCandidates(state), {
    fightsFirst: [],
    normal: ["charged", "normal"],
    activated: []
  });
});

test("excludes units already activated this turn", () => {
  const state = fightState({
    history: [{
      type: "fight.unit_activated",
      payload: {
        unitId: "normal",
        round: 1,
        turn: 2,
        fightsFirst: false
      }
    }]
  });

  assert.deepEqual(getFightCandidates(state), {
    fightsFirst: [],
    normal: ["charged"],
    activated: ["normal"]
  });
});

test("uses successful charges from the current turn only", () => {
  const state = fightState({
    history: [
      {
        type: "charge.outcome_recorded",
        payload: {
          unitId: "charged",
          outcome: "successful",
          round: 1,
          turn: 1
        }
      },
      {
        type: "charge.outcome_recorded",
        payload: {
          unitId: "normal",
          outcome: "failed",
          round: 1,
          turn: 2
        }
      }
    ]
  });

  assert.deepEqual(getFightCandidates(state), {
    fightsFirst: [],
    normal: ["charged", "normal"],
    activated: []
  });
});

test("does not mutate state", () => {
  const state = fightState({
    history: [{
      type: "charge.outcome_recorded",
      payload: {
        unitId: "charged",
        outcome: "successful",
        round: 1,
        turn: 2
      }
    }]
  });
  const before = structuredClone(state);

  const result = getFightCandidates(state);

  assert.deepEqual(state, before);
  result.normal.push("unexpected");
  result.fightsFirst.push("unexpected");
  result.activated.push("unexpected");
  assert.deepEqual(state, before);
});


test("uses engagement-aware eligibility when engagement history is available", () => {
  const state = fightState({
    history: [
      {
        type: "turn.phase_changed",
        payload: { phase: "fight", round: 1, turn: 2 }
      },
      {
        type: "charge.outcome_recorded",
        payload: {
          unitId: "charged",
          outcome: "successful",
          targetIds: ["normal"],
          round: 1,
          turn: 2
        }
      }
    ]
  });

  assert.deepEqual(getFightCandidates(state), {
    fightsFirst: ["charged"],
    normal: ["normal"],
    activated: []
  });
});

test("does not keep a unit Fight-eligible after it Falls Back and disengages", () => {
  const state = fightState({
    history: [
      {
        type: "turn.phase_changed",
        payload: { phase: "fight", round: 1, turn: 2 }
      },
      {
        type: "combat.attack_resolved",
        payload: {
          phase: "fight",
          attackerId: "charged",
          targetId: "normal",
          round: 1,
          turn: 1
        }
      },
      {
        type: "unit.fell_back",
        payload: {
          unitId: "charged",
          round: 1,
          turn: 2
        }
      }
    ]
  });

  assert.deepEqual(getFightCandidates(state), {
    fightsFirst: [],
    normal: ["normal"],
    activated: []
  });
});

test("preserves Fight-step-start eligibility after later disengagement", () => {
  const state = fightState({
    history: [
      {
        type: "combat.attack_resolved",
        payload: {
          phase: "fight",
          attackerId: "charged",
          targetId: "normal",
          round: 1,
          turn: 1
        }
      },
      {
        type: "turn.phase_changed",
        payload: { phase: "fight", round: 1, turn: 2 }
      },
      {
        type: "unit.fell_back",
        payload: {
          unitId: "normal",
          round: 1,
          turn: 2
        }
      }
    ]
  });

  assert.deepEqual(getFightCandidates(state), {
    fightsFirst: [],
    normal: ["charged"],
    activated: []
  });
});
