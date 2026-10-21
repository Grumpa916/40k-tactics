import { getFightWeaponOptions } from './fight-workflow.js';

// Give the existing retaliation evaluator the same roster/catalog profiles the
// weapon picker uses. This is an analysis snapshot, never a session mutation.
export function getFightAdvisorContext(state, gameData) {
  return { ...state, units:state.units.map(unit => ({ ...unit,
    meleeWeapons:[...(unit.meleeWeapons ?? []), ...getFightWeaponOptions(state, { attackerId:unit.id, gameData })]
  })) };
}
