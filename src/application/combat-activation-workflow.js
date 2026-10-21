import { createCommand } from '../commands/command.js';
import { COMMAND_TYPES } from '../commands/game-commands.js';
export function finishCombatUnit(session, unitId) {
  return session.dispatch(createCommand(COMMAND_TYPES.FINISH_COMBAT_ACTIVATION, { unitId }));
}
