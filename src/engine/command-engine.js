const COMMAND_HANDLERS = new Map();

export function registerCommandHandler(type, handler) {
  if (!type || typeof handler !== "function") {
    throw new TypeError("A command type and handler function are required.");
  }
  if (COMMAND_HANDLERS.has(type)) {
    throw new Error("Command handler already registered: " + type);
  }
  COMMAND_HANDLERS.set(type, handler);
}

export function executeCommand(state, command, context = {}) {
  if (!command || typeof command.type !== "string") {
    throw new TypeError("A command with a string type is required.");
  }
  const handler = COMMAND_HANDLERS.get(command.type);
  if (!handler) {
    throw new Error("No command handler registered: " + command.type);
  }
  return handler(state, command, context);
}

export function clearCommandHandlers() {
  COMMAND_HANDLERS.clear();
}
