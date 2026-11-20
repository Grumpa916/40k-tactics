import { getCombatFormationMembers, getCombatFormationRoot } from './battle-unit-reference.js';
import { getActiveSpaceMarineUnitDoctrines } from './space-marine-doctrines.js';

// Tactical Doctrine is active when the unit makes its Fall Back move. Its
// permission lasts through that unit's next Command phase.
export function isFallBackActionRestricted(state, unitId) {
  const unit = (state?.units ?? []).find(item => item.id === unitId);
  if (!unit) return false;
  const root = getCombatFormationRoot(state, unit) ?? unit;
  const memberIds = new Set([root.id, ...getCombatFormationMembers(state, root).map(item => item.id)]);
  const fellBack = (state?.history ?? []).some(event =>
    event.type === 'unit.fell_back' &&
    memberIds.has(event.payload?.unitId) &&
    event.payload?.round === state?.battle?.round &&
    event.payload?.turn === state?.turn
  );
  return fellBack && !getActiveSpaceMarineUnitDoctrines(state, root).includes('tactical');
}
