export function createCommand(type, payload = {}, metadata = {}) {
  if (!type || typeof type !== "string") {
    throw new TypeError("A command type is required.");
  }

  return { type, payload, metadata };
}
