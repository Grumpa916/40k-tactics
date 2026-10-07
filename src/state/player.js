export const PLAYER_ROLES = Object.freeze({
  PLAYER_ONE: "player_one",
  PLAYER_TWO: "player_two"
});

export function createPlayer({ id, name, role } = {}) {
  if (!id || !name || !role) {
    throw new TypeError("Player id, name, and role are required.");
  }
  if (!Object.values(PLAYER_ROLES).includes(role)) {
    throw new RangeError("Unknown player role: " + role);
  }
  return { id, name, role };
}
