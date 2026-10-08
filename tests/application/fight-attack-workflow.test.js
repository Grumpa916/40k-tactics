import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import { clearCommandHandlers } from "../../src/engine/command-engine.js";
import { registerCoreCommandHandlers } from "../../src/engine/register-core-commands.js";
import {
  getFightAttackOptions,
  resolveFightAttack
} from "../../src/application/fight-workflow.js";
import { createGameSession } from "../../src/application/game-session.js";

const meleeWeapon = {
  id: "blade",
  name: "Blade",
  type: "melee",
  characteristics: { attacks: 2, strength: 8, ap: 1, damage: 2 }
};

function fightState() {
  return createGameState({
    phase: "fight",
    turn: 1,
    activePlayer: "p1",
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battle: { id: "b1", status: "active", round: 1 },
    units: [
      createUnit({
        id: "attacker",
        ownerId: "p1",
        name: "Captain",
        status: "deployed",
        wounds: 5,
        profile: { characteristics: { weaponSkill: 4, toughness: 4, save: 3 } }
      }),
      createUnit({
        id: "target",
        ownerId: "p2",
        name: "Enemy",
        status: "deployed",
        wounds: 5,
        profile: { characteristics: { weaponSkill: 4, toughness: 4, save: 3 } }
      })
    ],
    history: [{
      type: "fight.unit_activated",
      payload: {
        unitId: "attacker",
        playerId: "p1",
        round: 1,
        turn: 1,
        fightsFirst: false
      }
    }]
  });
}

test("Fight attack options expose the activated attacker and deployed target", () => {
  const options = getFightAttackOptions(fightState(), { perspectivePlayerId: "p1" });

  assert.deepEqual(options.attackers.map((unit) => unit.unitId), ["attacker"]);
  assert.deepEqual(options.targets.map((unit) => unit.unitId), ["target"]);
});

test("Fight attack workflow dispatches the existing combat command", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();

  const session = createGameSession(fightState());
  const values = [0.9, 0.9, 0.9, 0.9, 0.1, 0.1];
  let index = 0;

  resolveFightAttack(session, {
    attackerId: "attacker",
    targetId: "target",
    weapon: meleeWeapon
  }, {
    random: () => values[index++]
  });

  const event = session.getState().history.at(-1);
  assert.equal(event.type, "combat.attack_resolved");
  assert.equal(event.payload.phase, "fight");
  assert.equal(event.payload.attackerId, "attacker");
  assert.equal(event.payload.targetId, "target");

  clearCommandHandlers();
});
