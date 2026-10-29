import { createEndgameReviewScreen } from './endgame-review-screen.js';
import { createChargeScreen } from "./charge-screen.js";
import { createCommandScreen } from "./command-screen.js";
import { createEventPreparationScreen as createBattleSetupScreen } from "./event-preparation-screen.js";
import { createEventPreparationScreen as createDeploymentScreen } from "./event-preparation-screen.js";
import { createFightScreen } from "./fight-screen.js";
import { createMovementScreen } from "./movement-screen.js";
import { createShootingScreen } from "./shooting-screen.js";

export const PHASES = Object.freeze([
  { id: "command", label: "Command", status: "live" },
  { id: "movement", label: "Movement", status: "live" },
  { id: "shooting", label: "Shooting", status: "live" },
  { id: "charge", label: "Charge", status: "live" },
  { id: "fight", label: "Fight", status: "live" }
]);

export const SCREEN_FACTORIES = Object.freeze({
  setup: createBattleSetupScreen,
  deployment: createDeploymentScreen,
  command: createCommandScreen,
  movement: createMovementScreen,
  shooting: createShootingScreen,
  charge: createChargeScreen,
  fight: createFightScreen,
  review: createEndgameReviewScreen
});

