import { createGameState } from "../state/game-state.js";
import { createUnit } from "../state/unit.js";
import { createGameSession } from "../application/game-session.js";
import { registerCoreCommandHandlers } from "../engine/register-core-commands.js";
import { clearCommandHandlers } from "../engine/command-engine.js";
import { createBattleShell } from "./battle-shell.js";

clearCommandHandlers();
registerCoreCommandHandlers();

const gameData = {
  weapons: [
    {
      id: "rifle",
      name: "Bolt Rifle",
      type: "ranged",
      characteristics: { range: 24, attacks: 2, strength: 4, ap: -1, damage: 1 }
    },
    {
      id: "blade",
      name: "Power Blade",
      type: "melee",
      characteristics: { attacks: 2, strength: 5, ap: -2, damage: 2 }
    }
  ]
};

const state = createGameState({
  phase: "shooting",
  turn: 2,
  activePlayer: "p1",
  players: [
    { id: "p1", name: "You" },
    { id: "p2", name: "Opponent" }
  ],
  battle: {
    id: "integrated-demo",
    status: "active",
    round: 1,
    firstPlayerId: "p1",
    activePlayerId: "p1"
  },
  units: [
    createUnit({
      id: "intercessors",
      ownerId: "p1",
      name: "Intercessor Squad",
      status: "deployed",
      wounds: 10,
      position: { x: 0, y: 0 },
      profile: {
        weaponIds: ["rifle", "blade"],
        characteristics: { ballisticSkill: 3, weaponSkill: 3, toughness: 4, save: 3 }
      }
    }),
    createUnit({
      id: "captain",
      ownerId: "p1",
      name: "Captain",
      status: "deployed",
      wounds: 5,
      position: { x: 3, y: 0 },
      profile: {
        weaponIds: ["rifle", "blade"],
        characteristics: { ballisticSkill: 3, weaponSkill: 3, toughness: 4, save: 3 }
      }
    }),
    createUnit({
      id: "enemy",
      ownerId: "p2",
      name: "Enemy Guard",
      status: "deployed",
      wounds: 10,
      position: { x: 6, y: 0 },
      profile: {
        weaponIds: ["blade"],
        characteristics: { ballisticSkill: 4, weaponSkill: 4, toughness: 4, save: 4 }
      }
    })
  ]
});

const session = createGameSession(state);

createBattleShell(document.getElementById("battle-app"), {
  session,
  perspectivePlayerId: "p1",
  gameData,
  missionActions: [{ id: "cleanse", name: "Cleanse" }]
});
