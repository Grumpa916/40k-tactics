import { createGameState } from "../state/game-state.js";
import { createUnit } from "../state/unit.js";
import { registerCoreCommandHandlers } from "../engine/register-core-commands.js";
import { clearCommandHandlers } from "../engine/command-engine.js";
import { createFightScreen } from "./fight-screen.js";

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
      status: "deployed"
    }),
    createUnit({
      id: "champion",
      ownerId: "p2",
      name: "Enemy Champion",
      status: "deployed"
    }),
    createUnit({
      id: "squad",
      ownerId: "p1",
      name: "Battleline Squad",
      status: "deployed"
    }),
    createUnit({
      id: "guard",
      ownerId: "p2",
      name: "Enemy Guard",
      status: "deployed"
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

createFightScreen(document.getElementById("fight-app"), {
  state,
  perspectivePlayerId: "p1"
});
