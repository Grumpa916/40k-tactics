export function appendHistoryEntry(state, event) {
  if (!event || typeof event.type !== "string") {
    throw new TypeError("A typed event is required.");
  }

  return {
    ...state,
    history: [...state.history, event]
  };
}

export function getHistory(state) {
  return [...state.history];
}
