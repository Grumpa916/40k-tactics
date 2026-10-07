export function createEvent(type, payload = {}, metadata = {}) {
  if (!type || typeof type !== "string") {
    throw new TypeError("An event type is required.");
  }
  return { type, payload, metadata };
}
