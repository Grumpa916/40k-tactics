export const UNIT_STATUS = Object.freeze({
  RESERVES: "reserves",
  DEPLOYED: "deployed",
  DESTROYED: "destroyed"
});

export function createUnit({
  id,
  ownerId,
  name,
  status = UNIT_STATUS.RESERVES,
  wounds = null,
  position = null,
  models = [],
  profile = null,
  metadata = {}
} = {}) {
  if (!id || !ownerId || !name) {
    throw new TypeError("Unit id, ownerId, and name are required.");
  }
  if (!Object.values(UNIT_STATUS).includes(status)) {
    throw new RangeError("Unknown unit status: " + status);
  }
  if (!Array.isArray(models)) {
    throw new TypeError("Unit models must be an array.");
  }
  return { id, ownerId, name, status, wounds, position, models: [...models], profile, metadata };
}
