import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import { clearCommandHandlers } from "../../src/engine/command-engine.js";
import { registerCoreCommandHandlers } from "../../src/engine/register-core-commands.js";
import {
  getChargeViewModel,
  recordChargeOutcomeForSession,
  finishChargePhase
} from "../../src/application/charge-workflow.js";
import { createGameSession } from "../../src/application/game-session.js";

function chargeState() {
  return createGameState({
    phase: "charge",
    turn: 2,
    activePlayer: "p1",
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battle: { id: "b1", status: "active", round: 1, activePlayerId: "p1" },
    units: [
      createUnit({ id: "charger", ownerId: "p1", name: "Charger", status: "deployed", position: { x: 0, y: 0 } }),
      createUnit({ id: "near", ownerId: "p2", name: "Near Target", status: "deployed", position: { x: 6, y: 0 } }),
      createUnit({ id: "borderline", ownerId: "p2", name: "Borderline Target", status: "deployed", position: { x: 14, y: 0 } }),
      createUnit({ id: "outside", ownerId: "p2", name: "Outside Target", status: "deployed", position: { x: 18, y: 0 } })
    ]
  });
}

test("Charge workflow groups approximate targets and preserves the uncertainty band", () => {
  const model = getChargeViewModel(chargeState(), { perspectivePlayerId: "p1" });
  assert.equal(model.candidates.length, 1);
  assert.deepEqual(
    model.candidates[0].targets.map((item) => [item.targetUnitId, item.rangeStatus, item.confidence]),
    [["near", "within", "high"], ["borderline", "borderline", "low"]]
  );
});

test("Charge workflow records success with multiple targets, measured distances, and advances to Fight", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const session = createGameSession(chargeState());

  recordChargeOutcomeForSession(session, {
    unitId: "charger",
    succeeded: true,
    targetIds: ["near", "borderline"],
    measuredDistances: { near: 8.5, borderline: 12.25 }
  });

  const model = getChargeViewModel(session.getState(), { perspectivePlayerId: "p1" });
  assert.equal(model.candidates.length, 0);
  assert.equal(model.outcomes[0].outcome, "successful");
  assert.deepEqual(model.outcomes[0].targets.map((unit) => unit.unitId), ["near", "borderline"]);
  assert.deepEqual(model.outcomes[0].measuredDistances, { near: 8.5, borderline: 12.25 });

  finishChargePhase(session);
  assert.equal(session.getState().phase, "fight");
  clearCommandHandlers();
});

test("Charge workflow records a failed attempt with its declared target and measured distance", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const session = createGameSession(chargeState());

  recordChargeOutcomeForSession(session, {
    unitId: "charger",
    succeeded: false,
    targetIds: ["near"],
    measuredDistances: { near: 11.75 }
  });

  const outcome = getChargeViewModel(session.getState(), { perspectivePlayerId: "p1" }).outcomes[0];
  assert.equal(outcome.outcome, "failed");
  assert.deepEqual(outcome.targets.map((unit) => unit.unitId), ["near"]);
  assert.deepEqual(outcome.measuredDistances, { near: 11.75 });
  clearCommandHandlers();
});
