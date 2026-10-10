import { executeCommand } from "../engine/command-engine.js";
import { GAME_STATE_VERSION } from "../state/version.js";

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

    replaceState(restoredState) {
      if (!restoredState || typeof restoredState !== "object" || Array.isArray(restoredState)) {
        throw new TypeError("A restored game-state object is required.");
      }
      if (restoredState.version !== GAME_STATE_VERSION) {
        throw new Error("Cannot restore game-state version " + restoredState.version +
          "; this app supports version " + GAME_STATE_VERSION + ".");
      }
      let snapshot;
      try {
        snapshot = JSON.parse(JSON.stringify(restoredState));
      } catch {
        throw new TypeError("The restored game state must be JSON-serializable.");
      }
      if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
        throw new TypeError("The restored game state must be a JSON object.");
      }
      state = snapshot;
      notify();
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
