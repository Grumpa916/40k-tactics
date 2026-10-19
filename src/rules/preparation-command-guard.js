import { preparationStep } from './event-preparation.js';

/** Guard bookkeeping order even when commands originate outside the wizard. */
export function guardPreparationCommand(state, command) {
  if (!['setup','deployment'].includes(state.battle?.status)) return;
  const step = preparationStep(state);
  const allowed = {
    'battle.apply_army_roster': ['mission'],
    'battle.set_size': ['mission'],
    'battlefield_map.set_event_companion_mission_setup': ['mission'],
    'battle.set_pre_game_roles': ['roles'],
    'secondary_mission.set_mode': ['secondaries'],
    'secondary_mission.draw': ['secondaries'],
    'battlefield_map.set_actual_deployment_position': ['deployment','redeployment','pre-battle'],
    'unit.deploy': ['deployment','redeployment','pre-battle'],
    'battlefield_map.declare_unit_reserve': [],
  };
  if (allowed[command.type] && !allowed[command.type].includes(step)) throw new Error('Complete or return to the appropriate preparation checkpoint first.');
  if (command.type === 'battle.set_pre_game_roles' && command.payload?.firstPlayerId) throw new Error('First turn is determined after redeployment.');
}
