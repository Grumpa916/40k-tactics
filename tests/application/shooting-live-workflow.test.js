import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import { clearCommandHandlers } from "../../src/engine/command-engine.js";
import { registerCoreCommandHandlers } from "../../src/engine/register-core-commands.js";
import {
  activateShootingUnit,
  finishShootingPhase,
  resolveShootingAttack,
  getShootingViewModel,
  getShootingWeaponOptions,
  getShootingTargetOptions
} from "../../src/application/shooting-workflow.js";
import { createGameSession } from "../../src/application/game-session.js";

const rangedWeapon = {
  id: "rifle",
  name: "Rifle",
  type: "ranged",
  characteristics: { attacks: 1, strength: 8, ap: 1, damage: 1 }
};

function liveState() {
  return createGameState({
    phase: "shooting",
    turn: 2,
    activePlayer: "p1",
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battle: { id: "b1", status: "active", round: 1, activePlayerId: "p1" },
    units: [
      createUnit({
        id: "shooter",
        ownerId: "p1",
        name: "Shooter",
        status: "deployed",
        wounds: 5,
        profile: {
          weaponIds: ["rifle"],
          characteristics: { ballisticSkill: 4, weaponSkill: 4, toughness: 4, save: 3 }
        }
      }),
      createUnit({
        id: "target",
        ownerId: "p2",
        name: "Target",
        status: "deployed",
        wounds: 5,
        profile: { characteristics: { ballisticSkill: 4, weaponSkill: 4, toughness: 4, save: 3 } }
      })
    ]
  });
}

test("live Shooting workflow records activation and ranged attack", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();

  const session = createGameSession(liveState());
  activateShootingUnit(session, { unitId: "shooter", actionType: "shoot" });

  const model = getShootingViewModel(session.getState(), { perspectivePlayerId: "p1" });
  assert.deepEqual(model.candidates, []);
  assert.equal(model.activations[0].unit.name, "Shooter");
  assert.equal(model.activations[0].actionType, "shoot");
  assert.equal(model.canComplete, true);

  assert.deepEqual(
    getShootingWeaponOptions(session.getState(), {
      attackerId: "shooter",
      gameData: { weapons: [rangedWeapon] }
    }).map((weapon) => weapon.id),
    ["rifle"]
  );
  assert.deepEqual(
    getShootingTargetOptions(session.getState(), {
      attackerId: "shooter",
      perspectivePlayerId: "p1"
    }).map((unit) => unit.unitId),
    ["target"]
  );

  resolveShootingAttack(session, {
    attackerId: "shooter",
    targetId: "target",
    weapon: rangedWeapon
  }, { random: () => 0.99 });

  const attacks = session.getState().history.filter(
    (event) => event.type === "combat.attack_resolved"
  );
  assert.equal(attacks.length, 1);
  assert.equal(attacks[0].payload.phase, "shooting");

  finishShootingPhase(session);
  assert.equal(session.getState().phase, "charge");
  assert.deepEqual(
    session.getState().history.slice(-2).map((event) => event.type),
    ["shooting.phase_completed", "turn.phase_changed"]
  );

  clearCommandHandlers();
});


test("live Shooting workflow records a mission action as the unit's phase choice", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();

  const session = createGameSession(liveState());
  activateShootingUnit(session, {
    unitId: "shooter",
    actionType: "mission_action",
    actionId: "cleanse"
  });

  const model = getShootingViewModel(session.getState(), { perspectivePlayerId: "p1" });
  assert.equal(model.activations[0].actionType, "mission_action");
  assert.equal(model.activations[0].actionId, "cleanse");
  assert.equal(model.canComplete, true);
  assert.deepEqual(
    getShootingWeaponOptions(session.getState(), {
      attackerId: "shooter",
      gameData: { weapons: [rangedWeapon] }
    }),
    []
  );

  assert.throws(
    () => resolveShootingAttack(session, {
      attackerId: "shooter",
      targetId: "target",
      weapon: rangedWeapon
    }),
    /Shooting attack requires the unit to be activated/
  );

  finishShootingPhase(session);
  assert.equal(session.getState().phase, "charge");

  clearCommandHandlers();
});
