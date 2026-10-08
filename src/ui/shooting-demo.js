import { createGameState } from "../state/game-state.js";
import { createUnit } from "../state/unit.js";
import { createGameSession } from "../application/game-session.js";
import { registerCoreCommandHandlers } from "../engine/register-core-commands.js";
import { clearCommandHandlers } from "../engine/command-engine.js";
import { createShootingScreen } from "./shooting-screen.js";

clearCommandHandlers();
registerCoreCommandHandlers();

const rifle = {
  id: "rifle",
  name: "Bolt Rifle",
  type: "ranged",
  characteristics: { attacks: 2, strength: 4, ap: 1, damage: 1 }
};

const gameData = { weapons: [rifle] };

const state = createGameState({
  phase: "shooting",
  turn: 2,
  activePlayer: "p1",
  players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
  battle: { id: "demo", status: "active", round: 1, activePlayerId: "p1" },
  units: [
    createUnit({
      id: "intercessors",
      ownerId: "p1",
      name: "Intercessor Squad",
      status: "deployed",
      wounds: 10,
      profile: {
        weaponIds: ["rifle"],
        characteristics: { ballisticSkill: 3, toughness: 4, save: 3 }
      }
    }),
    createUnit({
      id: "captain",
      ownerId: "p1",
      name: "Captain",
      status: "deployed",
      wounds: 5,
      profile: {
        weaponIds: ["rifle"],
        characteristics: { ballisticSkill: 3, toughness: 4, save: 3 }
      }
    }),
    createUnit({
      id: "enemy",
      ownerId: "p2",
      name: "Enemy Guard",
      status: "deployed",
      wounds: 10,
      profile: { characteristics: { ballisticSkill: 4, toughness: 4, save: 4 } }
    })
  ]
});

const session = createGameSession(state);
createShootingScreen(document.getElementById("shooting-app"), {
  session,
  perspectivePlayerId: "p1",
  gameData,
  missionActions: [
    { id: "cleanse", name: "Cleanse" }
  ]
});
