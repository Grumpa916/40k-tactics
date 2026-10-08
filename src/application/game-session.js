import { executeCommand } from "../engine/command-engine.js";

export function createGameSession(initialState, { commandExecutor = executeCommand } = {}) {
  if (!initialState || typeof initialState !== "object") {
    throw new TypeError("A game state is required.");
  }
  if (typeof commandExecutor !== "function") {
    throw new TypeError("A command executor function is required.");
  }

  let state = initialState;
  const subscribers = new Set();

  const notify = () => {
    for (const listener of subscribers) {
      listener(state);
    }
  };

  return Object.freeze({
    getState() {
      return state;
    },

    dispatch(command, context = {}) {
      const nextState = commandExecutor(state, command, context);
      if (!nextState || typeof nextState !== "object") {
        throw new TypeError("A command executor must return a game state.");
      }
      state = nextState;
      notify();
      return state;
    },

    subscribe(listener) {
      if (typeof listener !== "function") {
        throw new TypeError("A session subscriber must be a function.");
      }
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    }
  });
}
