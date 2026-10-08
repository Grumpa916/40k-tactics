import { createGameState } from "../state/game-state.js";
import { createUnit } from "../state/unit.js";
import { registerCoreCommandHandlers } from "../engine/register-core-commands.js";
import { clearCommandHandlers } from "../engine/command-engine.js";
import { createFightScreen } from "./fight-screen.js";
import { createGameSession } from "../application/game-session.js";

const gameData = {
  weapons: [
    {
      id: "power-sword",
      name: "Power Sword",
      type: "melee",
      characteristics: { attacks: 2, strength: 5, ap: 2, damage: 2 }
    }
  ]
};

const state = createGameState({
  phase: "fight",
  turn: 2,
  activePlayer: "p1",
  players: [
    { id: "p1", name: "You" },
    { id: "p2", name: "Opponent" }
  ],
  battle: {
    id: "demo-battle",
    status: "active",
    round: 1,
    firstPlayerId: "p1",
    activePlayerId: "p1"
  },
  units: [
    createUnit({
      id: "captain",
      ownerId: "p1",
      name: "Captain",
      status: "deployed",
      profile: {
        weaponIds: ["power-sword"],
        characteristics: { weaponSkill: 3, toughness: 4, save: 3 }
      }
    }),
    createUnit({
      id: "champion",
      ownerId: "p2",
      name: "Enemy Champion",
      status: "deployed",
      profile: {
        characteristics: { weaponSkill: 4, toughness: 4, save: 4 }
      }
    }),
    createUnit({
      id: "squad",
      ownerId: "p1",
      name: "Battleline Squad",
      status: "deployed",
      profile: {
        weaponIds: ["power-sword"],
        characteristics: { weaponSkill: 4, toughness: 4, save: 4 }
      }
    }),
    createUnit({
      id: "guard",
      ownerId: "p2",
      name: "Enemy Guard",
      status: "deployed",
      profile: {
        characteristics: { weaponSkill: 4, toughness: 3, save: 5 }
      }
    })
  ],
  history: [
    {
      type: "charge.outcome_recorded",
      payload: {
        unitId: "captain",
        outcome: "successful",
        round: 1,
        turn: 2
      }
    },
    {
      type: "charge.outcome_recorded",
      payload: {
        unitId: "champion",
        outcome: "successful",
        round: 1,
        turn: 2
      }
    }
  ]
});

clearCommandHandlers();
registerCoreCommandHandlers();

const session = createGameSession(state);

createFightScreen(document.getElementById("fight-app"), {
  session,
  perspectivePlayerId: "p1",
  gameData
});
