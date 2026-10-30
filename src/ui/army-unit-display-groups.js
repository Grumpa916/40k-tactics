import { getBattleRosterUnit } from '../rules/battle-unit-reference.js';

// Display groups preserve each member's stats, wounds and action buttons.
// Lost or separated members remain available as independent reference entries.
export function getArmyUnitDisplayGroups(state, units = state?.units ?? []) {
  const rosterFor = unit => getBattleRosterUnit(state, unit) ??
    state?.armyRosters?.[unit.ownerId]?.units?.find(item => item.id === unit.id);
  const rosterUnits = new Map(units.map(unit => [unit.id, rosterFor(unit)]));
  const key = (owner, id) => JSON.stringify([owner, id]);
  const byRosterId = new Map(units.map(unit => [
    key(unit.ownerId, rosterUnits.get(unit.id)?.id ?? unit.metadata?.rosterUnitId ?? unit.id), unit
  ]));
  const proposed = new Map();
  for (const unit of units) {
    const roster = rosterUnits.get(unit.id);
    const listedParents = roster?.id ? units.filter(candidate => candidate.ownerId === unit.ownerId &&
      rosterUnits.get(candidate.id)?.attachedLeaderIds?.includes(roster.id)) : [];
    const parentId = roster?.attachedToBodyguardId ??
      (listedParents.length === 1 ? rosterUnits.get(listedParents[0].id)?.id : null);
    const parent = byRosterId.get(key(unit.ownerId, parentId));
    if (!parent || parent.id === unit.id || rosterUnits.get(parent.id)?.attachedToBodyguardId ||
        unit.status === 'destroyed' || parent.status === 'destroyed' || unit.status !== parent.status) continue;
    proposed.set(unit.id, parent);
  }
  const parents = new Map([...proposed].filter(([, parent]) => !proposed.has(parent.id)));
  const rendered = new Set();
  return units.flatMap(unit => {
    const root = parents.get(unit.id) ?? unit;
    if (rendered.has(root.id)) return [];
    const members = [root, ...units.filter(member => parents.get(member.id)?.id === root.id)];
    members.forEach(member => rendered.add(member.id));
    return [{ root, members, attached: members.length > 1,
      name: members.map(member => member.name ?? member.id).join(' + ') }];
  });
}

export function getArmyUnitDisplayGroup(state, unitId) {
  return getArmyUnitDisplayGroups(state).find(group => group.members.some(unit => unit.id === unitId)) ?? null;
}

export function armyUnitMemberRole(group, unit) {
  return group.attached ? unit.id === group.root.id ? 'Bodyguard' : 'Leader' : '';
}
