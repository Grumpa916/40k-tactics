import { COMMAND_TYPES } from '../commands/game-commands.js';
export function secondaryCorrectionCommand(container,playerId) {
  const selection=container.querySelector('[data-score-secondary-card]')?.value??'';
  const separator=selection.lastIndexOf('|');
  const instanceId=selection.slice(0,separator),selectedIndex=selection.slice(separator+1);
  const amount=Number(container.querySelector('[data-score-secondary-amount]')?.value);
  const round=Number(container.querySelector('[data-score-secondary-round]')?.value);
  return {type:COMMAND_TYPES.CORRECT_SECONDARY_MISSION_SCORE,payload:{
    playerId,instanceId,amount,round,awardEventIndex:selectedIndex==='new'?null:Number(selectedIndex)
  }};
}
