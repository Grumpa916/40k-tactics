export function createWeaponProfile({
  id,
  name,
  type = "ranged",
  characteristics = {}
} = {}) {
  if (!id || !name) {
    throw new TypeError("Weapon id and name are required.");
  }
  if (!["ranged", "melee"].includes(type)) {
    throw new RangeError("Unknown weapon type: " + type);
  }
  return Object.freeze({
    id,
    name,
    type,
    characteristics: { ...characteristics }
  });
}
