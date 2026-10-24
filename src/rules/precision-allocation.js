import { getCombatFormationMembers, getCombatFormationRoot } from './battle-unit-reference.js';

export function getPrecisionAllocationOptions(state, targetId) {
  const target = (state?.units ?? []).find((unit) => unit?.id === targetId);
  if (!target) return [];
  const root = getCombatFormationRoot(state, target);
  if (!root || root.id !== target.id) return [];
  return getCombatFormationMembers(state, root)
    .filter((member) => member.id !== root.id && member.status === 'deployed')
    .map((member) => ({
      unitId: member.id,
      name: member.name ?? member.id,
      ownerId: member.ownerId
    }));
}

export function validatePrecisionAllocation(state, { targetId, allocationTargetId, weapon } = {}) {
  if (!allocationTargetId) return null;
  if (weapon?.characteristics?.precision !== true) {
    throw new Error('Damage can only be allocated to an attached Character with a Precision weapon.');
  }
  const option = getPrecisionAllocationOptions(state, targetId)
    .find((candidate) => candidate.unitId === allocationTargetId);
  if (!option) {
    throw new Error('The selected Precision allocation is not an attached Leader in the target unit.');
  }
  return (state?.units ?? []).find((unit) => unit?.id === allocationTargetId) ?? null;
}
