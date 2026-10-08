import { createGameState } from "../state/game-state.js";
import { createUnit } from "../state/unit.js";
import { createGameSession } from "../application/game-session.js";
import { registerCoreCommandHandlers } from "../engine/register-core-commands.js";
import { clearCommandHandlers } from "../engine/command-engine.js";
import { createChargeScreen } from "./charge-screen.js";

clearCommandHandlers();
registerCoreCommandHandlers();

const state = createGameState({
  phase: "charge",
  turn: 2,
  activePlayer: "p1",
  players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
  battle: { id: "demo", status: "active", round: 1, activePlayerId: "p1" },
  units: [
    createUnit({ id: "captain", ownerId: "p1", name: "Captain", status: "deployed", position: { x: 0, y: 0 } }),
    createUnit({ id: "squad", ownerId: "p1", name: "Battleline Squad", status: "deployed", position: { x: 3, y: 3 } }),
    createUnit({ id: "guard", ownerId: "p2", name: "Enemy Guard", status: "deployed", position: { x: 6, y: 0 } }),
    createUnit({ id: "champion", ownerId: "p2", name: "Enemy Champion", status: "deployed", position: { x: 13, y: 0 } }),
    createUnit({ id: "distant", ownerId: "p2", name: "Distant Enemy", status: "deployed", position: { x: 18, y: 0 } })
  ]
});

createChargeScreen(document.getElementById("charge-app"), {
  session: createGameSession(state),
  perspectivePlayerId: "p1"
});
