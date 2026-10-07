export function createUnitProfile({
  id,
  name,
  factionId = null,
  keywords = [],
  characteristics = {},
  weaponIds = []
} = {}) {
  if (!id || !name) {
    throw new TypeError("Unit id and name are required.");
  }
  return Object.freeze({
    id,
    name,
    factionId,
    keywords: [...keywords],
    characteristics: { ...characteristics },
    weaponIds: [...weaponIds]
  });
}
