import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import { clearCommandHandlers } from "../../src/engine/command-engine.js";
import { registerCoreCommandHandlers } from "../../src/engine/register-core-commands.js";
import {
  activateFightUnit,
  finishFightPhase,
  resolveFightAttack,
  getFightViewModel
} from "../../src/application/fight-workflow.js";
import { createGameSession } from "../../src/application/game-session.js";

const meleeWeapon = {
  id: "blade",
  name: "Blade",
  type: "melee",
  characteristics: { attacks: 1, strength: 8, ap: 1, damage: 1 }
};

function liveFightState() {
  return createGameState({
    phase: "fight",
    turn: 3,
    activePlayer: "p1",
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battle: { id: "b1", status: "active", round: 1 },
    units: [
      createUnit({
        id: "charged",
        ownerId: "p1",
        name: "Charged Captain",
        status: "deployed",
        wounds: 5,
        profile: { characteristics: { weaponSkill: 3, toughness: 4, save: 3 } }
      }),
      createUnit({
        id: "opponent-first",
        ownerId: "p2",
        name: "Opponent Charger",
        status: "deployed",
        wounds: 5,
        profile: { characteristics: { weaponSkill: 4, toughness: 4, save: 3 } }
      }),
      createUnit({
        id: "normal",
        ownerId: "p1",
        name: "Battleline",
        status: "deployed",
        wounds: 5,
        profile: { characteristics: { weaponSkill: 4, toughness: 4, save: 4 } }
      })
    ],
    history: [
      {
        type: "charge.outcome_recorded",
        payload: {
          unitId: "charged",
          outcome: "successful",
          targetIds: ["opponent-first", "second-target"],
          round: 1,
          turn: 3
        }
      },
      {
        type: "charge.outcome_recorded",
        payload: {
          unitId: "opponent-first",
          outcome: "successful",
          targetIds: ["charged"],
          round: 1,
          turn: 3
        }
      },
      {
        type: "combat.attack_resolved",
        payload: {
          attackerId: "normal",
          targetId: "opponent-first",
          phase: "fight",
          round: 1,
          turn: 2
        }
      }
    ]
  });
}


test("Fight activation supports split attacks against multiple targets with actual damage", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();

  const base = liveFightState();
  const state = {
    ...base,
    units: [
      ...base.units,
      createUnit({
        id: "second-target",
        ownerId: "p2",
        name: "Second Target",
        status: "deployed",
        wounds: 5,
        profile: { characteristics: { weaponSkill: 4, toughness: 4, save: 4 } }
      })
    ]
  };
  const session = createGameSession(state);

  activateFightUnit(session, { unitId: "charged" });

  let firstRoll = 0;
  resolveFightAttack(session, {
    attackerId: "charged",
    targetId: "opponent-first",
    weapon: meleeWeapon,
    actualDamage: 1
  }, { random: () => [0.9, 0.9, 0.1][firstRoll++] });

  let secondRoll = 0;
  resolveFightAttack(session, {
    attackerId: "charged",
    targetId: "second-target",
    weapon: meleeWeapon,
    actualDamage: 2
  }, { random: () => [0.9, 0.9, 0.1][secondRoll++] });

  const model = getFightViewModel(session.getState(), { perspectivePlayerId: "p1" });
  assert.equal(model.attacks.length, 2);
  assert.deepEqual(model.attacks.map((attack) => attack.targetId), [
    "opponent-first",
    "second-target"
  ]);
  assert.deepEqual(model.attacks.map((attack) => attack.actualDamage), [1, 2]);
  assert.deepEqual(model.attacks.map((attack) => attack.expectedDamage), [1, 1]);

  const firstTarget = session.getState().units.find((unit) => unit.id === "opponent-first");
  const secondTarget = session.getState().units.find((unit) => unit.id === "second-target");
  assert.equal(firstTarget.wounds, 4);
  assert.equal(secondTarget.wounds, 3);

  const activation = model.activations.find((item) => item.unitId === "charged");
  assert.equal(activation.attackCount, 2);
  assert.equal(activation.totalDamage, 3);
  assert.deepEqual(activation.targetIds, ["opponent-first", "second-target"]);

  clearCommandHandlers();
});

test("live Fight workflow records both players, attacks, and completion", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();

  const session = createGameSession(liveFightState());

  // Fights First candidates can be activated by either player in table order.
  activateFightUnit(session, { unitId: "opponent-first" });
  activateFightUnit(session, { unitId: "charged" });

  let model = getFightViewModel(session.getState(), { perspectivePlayerId: "p1" });
  assert.deepEqual(model.candidates.fightsFirst, []);
  assert.deepEqual(model.candidates.normal.map((unit) => unit.unitId), ["normal"]);
  assert.equal(model.canComplete, false);

  // Normal activation remains available without enforcing alternating players.
  activateFightUnit(session, { unitId: "normal" });

  model = getFightViewModel(session.getState(), { perspectivePlayerId: "p1" });
  assert.deepEqual(model.candidates.normal, []);
  assert.equal(model.canComplete, true);

  // Activated units can enter the existing combat engine for melee attacks.
  resolveFightAttack(session, {
    attackerId: "charged",
    targetId: "opponent-first",
    weapon: meleeWeapon
  }, { random: () => 0.99 });

  resolveFightAttack(session, {
    attackerId: "opponent-first",
    targetId: "charged",
    weapon: meleeWeapon
  }, { random: () => 0.99 });

  const attacks = session.getState().history.filter(
    (event) => event.type === "combat.attack_resolved"
  );
  assert.equal(attacks.length, 2);
  assert.deepEqual(attacks.map((event) => event.payload.attackerId), [
    "charged",
    "opponent-first"
  ]);

  finishFightPhase(session);

  const state = session.getState();
  assert.equal(state.phase, "end_turn");
  assert.deepEqual(
    state.history.slice(-2).map((event) => event.type),
    ["fight.phase_completed", "turn.phase_changed"]
  );

  clearCommandHandlers();
});
