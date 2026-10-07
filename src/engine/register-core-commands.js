import { COMMAND_TYPES } from "../commands/game-commands.js";
import { registerCommandHandler } from "./command-engine.js";
import {
  startBattle,
  enterDeployment,
  deployUnit,
  startFirstTurn,
  changePhase,
  changeActivePlayer,
  completeBattle
} from "./state-transitions.js";
import { resolveUnitAttack } from "./combat-transitions.js";

export function registerCoreCommandHandlers() {
  const handlers = [
    [COMMAND_TYPES.START_BATTLE, (state, command) => startBattle(state, command.payload)],
    [COMMAND_TYPES.ENTER_DEPLOYMENT, (state) => enterDeployment(state)],
    [COMMAND_TYPES.DEPLOY_UNIT, (state, command) => deployUnit(state, command.payload)],
    [COMMAND_TYPES.START_FIRST_TURN, (state, command) => startFirstTurn(state, command.payload)],
    [COMMAND_TYPES.CHANGE_PHASE, (state, command) => changePhase(state, command.payload)],
    [COMMAND_TYPES.CHANGE_ACTIVE_PLAYER, (state, command) => changeActivePlayer(state, command.payload)],
    [COMMAND_TYPES.COMPLETE_BATTLE, (state) => completeBattle(state)],
    [COMMAND_TYPES.RESOLVE_ATTACK, (state, command, context) =>
      resolveUnitAttack(state, { ...command.payload, random: context.random ?? Math.random })
    ]
  ];

  for (const [type, handler] of handlers) {
    registerCommandHandler(type, handler);
  }
}
