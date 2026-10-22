const ROLE_GROUPS = Object.freeze([
  Object.freeze({ id: 'epic-hero', label: 'Epic Heroes' }),
  Object.freeze({ id: 'character', label: 'Characters' }),
  Object.freeze({ id: 'battleline', label: 'Battleline' }),
  Object.freeze({ id: 'monster', label: 'Monsters' }),
  Object.freeze({ id: 'transport', label: 'Transports' }),
  Object.freeze({ id: 'other', label: 'Other' })
]);

function normalizedKeywords(unit) {
  return (unit?.datasheet?.keywords ?? []).map(keyword => String(keyword).trim().toLowerCase());
}

export function getCatalogRoleGroup(unit) {
  const keywords = normalizedKeywords(unit);
  if (keywords.includes('epic hero')) return 'epic-hero';
  if (keywords.includes('character')) return 'character';
  if (keywords.includes('battleline')) return 'battleline';
  if (keywords.includes('monster')) return 'monster';
  if (keywords.includes('transport') || keywords.includes('dedicated transport')) return 'transport';
  return 'other';
}

export function getCatalogRoleLabel(unit) {
  const id = getCatalogRoleGroup(unit);
  return ROLE_GROUPS.find(group => group.id === id)?.label ?? 'Other';
}

export function compareCatalogRoleOrder(a, b) {
  const roleIndex = new Map(ROLE_GROUPS.map((group, index) => [group.id, index]));
  const roleDelta = (roleIndex.get(getCatalogRoleGroup(a)) ?? ROLE_GROUPS.length) -
    (roleIndex.get(getCatalogRoleGroup(b)) ?? ROLE_GROUPS.length);
  return roleDelta || String(a?.name ?? '').localeCompare(String(b?.name ?? ''));
}

export function getCatalogRoleGroups() {
  return ROLE_GROUPS;
}
