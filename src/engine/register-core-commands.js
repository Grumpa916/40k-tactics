import { COMMAND_TYPES } from "../commands/game-commands.js";
import { registerCommandHandler } from "./command-engine.js";
import {
  startBattle,
  enterDeployment,
  deployUnit,
  startFirstTurn,
  changePhase,
  endTurn,
  advanceBattleRound,
  completeBattle
} from "./state-transitions.js";
import { resolveUnitAttack } from "./combat-transitions.js";
import { resolveNormalMove } from "./movement-transitions.js";
import { recordChargeOutcome } from "./charge-transitions.js";

export function registerCoreCommandHandlers() {
  const handlers = [
    [COMMAND_TYPES.START_BATTLE, (state, command) => startBattle(state, command.payload)],
    [COMMAND_TYPES.ENTER_DEPLOYMENT, (state) => enterDeployment(state)],
    [COMMAND_TYPES.DEPLOY_UNIT, (state, command) => deployUnit(state, command.payload)],
    [COMMAND_TYPES.START_FIRST_TURN, (state, command) => startFirstTurn(state, command.payload)],
    [COMMAND_TYPES.CHANGE_PHASE, (state, command) => changePhase(state, command.payload)],
    [COMMAND_TYPES.END_TURN, (state, command) => endTurn(state, command.payload)],
    [COMMAND_TYPES.ADVANCE_BATTLE_ROUND, (state) => advanceBattleRound(state)],
    [COMMAND_TYPES.COMPLETE_BATTLE, (state) => completeBattle(state)],
    [COMMAND_TYPES.RESOLVE_NORMAL_MOVE, (state, command) =>
      resolveNormalMove(state, command.payload)],
    [COMMAND_TYPES.RECORD_CHARGE_OUTCOME, (state, command) =>
      recordChargeOutcome(state, command.payload)],
    [COMMAND_TYPES.RESOLVE_ATTACK, (state, command, context) =>
      resolveUnitAttack(state, { ...command.payload, random: context.random ?? Math.random })
    ]
  ];

  for (const [type, handler] of handlers) {
    registerCommandHandler(type, handler);
  }
}
