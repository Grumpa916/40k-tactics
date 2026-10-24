import { executeCommand } from "../engine/command-engine.js";
import { GAME_STATE_VERSION } from "../state/version.js";
import { describeSessionCorrection } from './session-correction.js';

export function createGameSession(initialState, { commandExecutor = executeCommand } = {}) {
  if (!initialState || typeof initialState !== "object") {
    throw new TypeError("A game state is required.");
  }
  if (typeof commandExecutor !== "function") {
    throw new TypeError("A command executor function is required.");
  }

  let state = initialState;
  let correction = null;
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
      correction = null;
      notify();
      return state;
    },

    dispatch(command, context = {}) {
      const previous = state;
      const nextState = commandExecutor(state, command, context);
      if (!nextState || typeof nextState !== "object") {
        throw new TypeError("A command executor must return a game state.");
      }
      const description = describeSessionCorrection(command, previous);
      correction = description && nextState !== previous ? { previous, after: nextState, ...description } : null;
      state = nextState;
      notify();
      return state;
    },

    getLastCorrection() {
      return correction ? { label: correction.label, detail: correction.detail } : null;
    },

    undoLastAction() {
      if (!correction || correction.after !== state) return false;
      // Correct only the immediately preceding action; clocks never run backwards.
      state = { ...correction.previous, timers: state.timers };
      correction = null;
      notify();
      return true;
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

