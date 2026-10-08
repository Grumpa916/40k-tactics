import test from "node:test";
import assert from "node:assert/strict";
import { getTacticalPriorities } from "./tactical-priorities.js";

test("surfaces engagement, survival, threat, and objective priorities", () => {
  const state = {
    phase: "movement",
    battle: { status: "active", round: 2 },
    turn: 3,
    units: [
      { id: "my-unit", ownerId: "p1", status: "deployed", wounds: 3, position: { x: 10, y: 10 } },
      { id: "other-unit", ownerId: "p2", status: "deployed", wounds: 5, position: { x: 16, y: 10 } }
    ],
    objectives: [{ id: "obj-1", position: { x: 13, y: 10 } }],
    history: [
      {
        type: "charge.outcome_recorded",
        payload: {
          unitId: "other-unit",
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
          attackerId: "other-unit",
          targetId: "my-unit",
          phase: "shooting",
          actualDamage: 2,
          expectedDamage: 2,
          stateDelta: {
            target: {
              woundsBefore: 5,
              woundsAfter: 3,
              statusBefore: "deployed",
              statusAfter: "deployed"
            }
          }
        }
      }
    ]
  };

  const result = getTacticalPriorities(state, { playerId: "p1" });
  assert.equal(result.phase, "movement");
  assert.ok(result.priorities.some((item) => item.type === "engagement"));
  assert.ok(result.priorities.some((item) => item.type === "survival"));
  assert.ok(result.priorities.some((item) => item.type === "threat"));
  assert.ok(result.priorities.some((item) => item.type === "objective"));
});

test("does not generate priorities for destroyed units", () => {
  const state = {
    phase: "movement",
    battle: { status: "active", round: 1 },
    turn: 1,
    units: [
      { id: "dead-unit", ownerId: "p1", status: "destroyed", wounds: 0, position: { x: 10, y: 10 } },
      { id: "other-unit", ownerId: "p2", status: "deployed", wounds: 5, position: { x: 12, y: 10 } }
    ],
    history: []
  };
  const result = getTacticalPriorities(state, { playerId: "p1" });
  assert.equal(result.priorities.some((item) => item.unitId === "dead-unit"), false);
});

import { SCORING_EVIDENCE } from "./scoring-eligibility.js";
import { SCORING_TIMINGS, createMissionDefinition } from "./mission-definition.js";

test("exposes actionable scoring context alongside tactical priorities", () => {
  const state = {
    phase: "command",
    units: [
      { id: "my-unit", ownerId: "p1", status: "deployed", position: { x: 10, y: 10 } }
    ],
    objectives: [{ id: "obj-1", position: { x: 10, y: 10 } }],
    history: []
  };

  const definition = createMissionDefinition({
    id: "score-objective",
    name: "Score Objective",
    timing: SCORING_TIMINGS.COMMAND_PHASE,
    conditions: [{
      evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
      args: { objectiveId: "obj-1", playerId: "p1", expected: "controlled" }
    }]
  });

  const result = getTacticalPriorities(state, {
    playerId: "p1",
    scoringDefinitions: [definition],
    scoringTiming: SCORING_TIMINGS.COMMAND_PHASE
  });

  assert.equal(result.scoringActions.length, 1);
  assert.equal(result.scoringActions[0].actions[0].type, "secure-objective");
  assert.equal(result.scoringActions[0].actions[0].candidates[0].unitId, "my-unit");
});
