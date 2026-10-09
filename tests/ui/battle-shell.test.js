import test from "node:test";
import assert from "node:assert/strict";
import { createBattleShell } from "../../src/ui/battle-shell.js";
import { createCommandScreen } from "../../src/ui/command-screen.js";
import { createMissionDefinition, SCORING_TIMINGS } from "../../src/rules/mission-definition.js";
import { SCORING_EVIDENCE } from "../../src/rules/scoring-eligibility.js";
import { drawSecondaryMission, getSecondaryMissionHistory } from "../../src/rules/secondary-mission-lifecycle.js";

function sessionFor(initialState) {
  let state = initialState;
  const listeners = new Set();
  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setState(nextState) {
      state = nextState;
      for (const listener of listeners) listener(state);
    }
  };
}

function container() {
  const screens = new Map();
  return {
    children: [],
    html: "",
    listeners: new Map(),
    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      this.listeners.get(type)?.delete(listener);
    },
    contains() { return true; },
    clickPhase(phase) {
      const button = {
        getAttribute(name) {
          return name === "data-battle-phase-button" ? phase : null;
        }
      };
      const event = {
        target: {
          closest(selector) {
            return selector === "[data-battle-phase-button]" ? button : null;
          }
        }
      };
      for (const listener of this.listeners.get("click") ?? []) listener(event);
    },
    replaceChildren(...children) {
      this.children = children;
      this.html = "";
    },
    set innerHTML(value) {
      this.html = value;
      const screen = {
        innerHTML: "",
        querySelector: () => null,
        replaceChildren() { this.innerHTML = ""; }
      };
      screens.set("screen", screen);
      this._screen = screen;
    },
    get innerHTML() {
      return this.html;
    },
    querySelector(selector) {
      if (selector === "[data-battle-screen]") return this._screen;
      if (selector === ".battle-shell__header h1") {
        return {
          set textContent(value) {
            this._heading = value;
          },
          get textContent() {
            return this._heading;
          }
        };
      }
      return null;
    }
  };
}

test("shared battle shell mounts the current implemented phase", () => {
  const session = sessionFor({
    phase: "shooting",
    turn: 1,
    battle: { round: 1 }
  });
  const mounted = [];
  const factories = {
    shooting: (target, options) => {
      mounted.push({ phase: "shooting", target, options });
      return { destroy() { mounted.push({ destroyed: "shooting" }); } };
    }
  };
  const root = container();

  const shell = createBattleShell(root, {
    session,
    perspectivePlayerId: "p1",
    screenFactories: factories
  });

  assert.equal(mounted.length, 1);
  assert.equal(mounted[0].phase, "shooting");
  assert.equal(mounted[0].options.session, session);
  assert.equal(mounted[0].options.perspectivePlayerId, "p1");
  assert.match(root.html, /data-battle-phase-button="shooting"/);
  assert.match(root.html, /data-battle-phase-button="command"/);
  assert.doesNotMatch(root.html, /battle-shell__header/);

  shell.destroy();
});

test("shared battle shell swaps screens when the same session advances phases", () => {
  const session = sessionFor({
    phase: "shooting",
    turn: 1,
    battle: { round: 1 }
  });
  const mounted = [];
  const factories = {
    shooting: () => ({
      destroy() { mounted.push("destroy-shooting"); }
    }),
    charge: () => {
      mounted.push("charge");
      return { destroy() { mounted.push("destroy-charge"); } };
    },
    fight: () => {
      mounted.push("fight");
      return { destroy() { mounted.push("destroy-fight"); } };
    }
  };
  const root = container();
  const shell = createBattleShell(root, { session, screenFactories: factories });

  session.setState({ phase: "charge", turn: 1, battle: { round: 1 } });
  session.setState({ phase: "fight", turn: 1, battle: { round: 1 } });

  assert.deepEqual(mounted, [
    "destroy-shooting",
    "charge",
    "destroy-charge",
    "fight"
  ]);

  shell.destroy();
  assert.deepEqual(mounted, [
    "destroy-shooting",
    "charge",
    "destroy-charge",
    "fight",
    "destroy-fight"
  ]);
});

test("shared battle shell mounts the implemented Command phase", () => {
  const session = sessionFor({
    phase: "command",
    turn: 1,
    battle: { round: 1 }
  });
  const root = container();
  const shell = createBattleShell(root, { session });

  assert.match(root.html, /data-battle-phase-button="command"/);
  assert.match(root._screen.innerHTML, /Command Phase/);
  assert.match(root._screen.innerHTML, /Objective control/);

  shell.destroy();
});

test("Command screen shows objective control and makes no unsupported scoring claims", () => {
  const root = { innerHTML: "", replaceChildren() { this.innerHTML = ""; } };
  const state = {
    phase: "command", turn: 1, activePlayer: "p1",
    battle: { round: 1 },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    commandPoints: { p1: 1 },
    objectives: [{ id: "obj-1", name: "Home Objective", control: { controllerId: "p1", controlState: "controlled", contestingPlayerIds: [] } }],
    units: [], history: [], scoring: { turnSnapshots: [] }
  };
  const listeners = new Set();
  const session = { getState: () => state, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
  const screen = createCommandScreen(root, { session });
  assert.match(root.innerHTML, /Command Points/);
  assert.match(root.innerHTML, /Home Objective/);
  assert.match(root.innerHTML, /Controlled by you/);
  assert.match(root.innerHTML, /No mission scoring definitions were supplied/);
  screen.destroy();
});


test("Command scoring review evaluates supplied definitions but never awards VP automatically", () => {
  const root = { innerHTML: "", replaceChildren() { this.innerHTML = ""; } };
  const state = {
    phase: "command", turn: 1, activePlayer: "p1",
    battle: { round: 1 },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    objectives: [{ id: "home", name: "Home Objective", control: {
      controllerId: "p1", controlState: "controlled", contestingPlayerIds: []
    }}],
    units: [], history: [], scoring: { turnSnapshots: [] }
  };
  const session = { getState: () => state, subscribe() { return () => {}; } };
  const definition = createMissionDefinition({
    id: "demo-hold-home",
    name: "Demo check: control Home Objective",
    timing: SCORING_TIMINGS.COMMAND_PHASE,
    category: "primary",
    victoryPoints: 5,
    conditions: [{
      evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
      args: { objectiveId: "home", playerId: "p1", expected: "controlled" }
    }]
  });
  const screen = createCommandScreen(root, { session, missionDefinitions: [definition] });
  assert.match(root.innerHTML, /Demo check: control Home Objective/);
  assert.match(root.innerHTML, /Evidence supports eligibility/);
  assert.match(root.innerHTML, /Primary mission/);
  assert.match(root.innerHTML, /Configured award: 5 VP/);
  assert.match(root.innerHTML, /Confirm \+5 VP/);
  assert.match(root.innerHTML, /Confirm only after checking the mission rules/);
  assert.match(root.innerHTML, /No victory points recorded yet/);
  assert.equal(state.victoryPoints, undefined);
  screen.destroy();
});

test("shared battle shell forwards configured mission definitions to phase screens", () => {
  const session = sessionFor({ phase: "command", turn: 1, battle: { round: 1 } });
  const definition = { id: "configured-definition" };
  let received;
  const root = container();
  const shell = createBattleShell(root, {
    session,
    missionDefinitions: [definition],
    screenFactories: {
      command: (_target, options) => {
        received = options.missionDefinitions;
        return { destroy() {} };
      }
    }
  });
  assert.deepEqual(received, [definition]);
  shell.destroy();
});


test("phase navigation buttons switch the viewed screen without changing recorded game phase", () => {
  const session = sessionFor({ phase: "shooting", turn: 1, battle: { round: 1 } });
  const mounted = [];
  const root = container();
  const shell = createBattleShell(root, {
    session,
    screenFactories: {
      command: () => {
        mounted.push("command");
        return { destroy() { mounted.push("destroy-command"); } };
      },
      shooting: () => {
        mounted.push("shooting");
        return { destroy() { mounted.push("destroy-shooting"); } };
      }
    }
  });

  root.clickPhase("command");
  assert.equal(session.getState().phase, "shooting");
  assert.match(root.html, /Viewing Command/);
  assert.deepEqual(mounted, ["shooting", "destroy-shooting", "command"]);

  root.clickPhase("shooting");
  assert.match(root.html, /Viewing Shooting/);
  assert.deepEqual(mounted, ["shooting", "destroy-shooting", "command", "destroy-command", "shooting"]);

  shell.destroy();
});


test("scoring reminder appears when the opponent finishes their turn", () => {
  const session = sessionFor({
    phase: "end_turn", turn: 2, activePlayer: "p2",
    battle: { round: 1, activePlayerId: "p2" }
  });
  const root = container();
  const shell = createBattleShell(root, {
    session, perspectivePlayerId: "p1",
    missionDefinitions: [{ id: "opponent-window", name: "Opponent-window mission", timing: "end-of-opponent-turn" }],
    screenFactories: {}
  });
  assert.doesNotMatch(root.html, /Opponent-window mission/);
  session.setState({ phase: "start_turn", turn: 3, activePlayer: "p1", battle: { round: 1, activePlayerId: "p1" } });
  assert.match(root.html, /End of your opponent&#039;s turn|End of your opponent's turn/);
  assert.match(root.html, /Opponent-window mission/);
  shell.destroy();
});

test("finishing the perspective player turn does not trigger an opponent-turn reminder", () => {
  const session = sessionFor({
    phase: "end_turn", turn: 1, activePlayer: "p1",
    battle: { round: 1, activePlayerId: "p1" }
  });
  const root = container();
  const shell = createBattleShell(root, {
    session, perspectivePlayerId: "p1",
    missionDefinitions: [{ id: "opponent-window", name: "Opponent-window mission", timing: "end-of-opponent-turn" }],
    screenFactories: {}
  });
  session.setState({ phase: "start_turn", turn: 2, activePlayer: "p2", battle: { round: 1, activePlayerId: "p2" } });
  assert.doesNotMatch(root.html, /Opponent-window mission/);
  shell.destroy();
});


test("scoring checkpoint review includes active secondary cards without changing score or lifecycle", () => {
  let state = {
    phase: "command", turn: 1, activePlayer: "p1",
    battle: { round: 1 }, players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    objectives: [{ id: "home", name: "Home Objective", control: {
      controllerId: "p1", controlState: "controlled", contestingPlayerIds: []
    }}],
    units: [], history: [], scoring: { turnSnapshots: [] }
  };
  const secondary = createMissionDefinition({
    id: "active-secondary-home",
    name: "Active secondary: Hold Home",
    category: "secondary",
    timing: SCORING_TIMINGS.COMMAND_PHASE,
    victoryPoints: 4,
    conditions: [{
      evidence: SCORING_EVIDENCE.OBJECTIVE_CONTROL,
      args: { objectiveId: "home", playerId: "p1", expected: "controlled" }
    }]
  });
  state = drawSecondaryMission(state, { definition: secondary, playerId: "p1" });
  const session = { getState: () => state, subscribe() { return () => {}; } };
  const root = { innerHTML: "", replaceChildren() { this.innerHTML = ""; } };
  const screen = createCommandScreen(root, {
    session, perspectivePlayerId: "p1", scoringCheckpoint: SCORING_TIMINGS.COMMAND_PHASE
  });

  assert.match(root.innerHTML, /Active secondary: Hold Home/);
  assert.match(root.innerHTML, /Active secondary card/);
  assert.match(root.innerHTML, /Evidence supports eligibility/);
  assert.match(root.innerHTML, /does not award VP or change card status/);
  assert.equal(state.victoryPoints, undefined);
  assert.equal(getSecondaryMissionHistory(state, "p1")[0].status, "active");
  screen.destroy();
});

test("checkpoint review uses the supplied opponent-turn context", () => {
  let state = {
    phase: "command", turn: 3, activePlayer: "p1",
    battle: { round: 2, activePlayerId: "p1" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    objectives: [], units: [], history: [], scoring: { turnSnapshots: [] }
  };
  const secondary = createMissionDefinition({
    id: "opponent-end-card",
    name: "Opponent-end secondary",
    category: "secondary",
    timing: "end-of-opponent-turn",
    conditions: [{ evidence: SCORING_EVIDENCE.TURN_SNAPSHOT, args: { turn: 3 } }]
  });
  state = drawSecondaryMission(state, { definition: secondary, playerId: "p1" });
  const session = { getState: () => state, subscribe() { return () => {}; } };
  const root = { innerHTML: "", replaceChildren() { this.innerHTML = ""; } };
  const screen = createCommandScreen(root, {
    session, perspectivePlayerId: "p1",
    scoringCheckpoint: "end-of-opponent-turn",
    scoringCheckpointActivePlayerId: "p2"
  });
  assert.match(root.innerHTML, /End of opponent&#039;s turn scoring review/);
  assert.match(root.innerHTML, /Opponent-end secondary/);
  screen.destroy();
});


test("opponent-turn reminder names active secondary cards for the perspective player", () => {
  let initialState = {
    phase: "end_turn", turn: 2, activePlayer: "p2",
    battle: { round: 1, activePlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    units: [], objectives: [], history: [], scoring: { turnSnapshots: [] }
  };
  initialState = drawSecondaryMission(initialState, {
    playerId: "p1",
    definition: createMissionDefinition({
      id: "active-opponent-window",
      name: "Active opponent-window card",
      category: "secondary",
      timing: SCORING_TIMINGS.END_OF_OPPONENT_TURN,
      conditions: [{ evidence: SCORING_EVIDENCE.TURN_SNAPSHOT, args: { turn: 2 } }]
    })
  });
  const session = sessionFor(initialState);
  const root = container();
  const shell = createBattleShell(root, {
    session, perspectivePlayerId: "p1", screenFactories: {}
  });
  session.setState({
    ...initialState,
    phase: "start_turn", turn: 3, activePlayer: "p1",
    battle: { round: 1, activePlayerId: "p1" }
  });
  assert.match(root.html, /Active opponent-window card/);
  shell.destroy();
});

test("scoring checkpoint review supports end-of-turn and end-of-battle active secondary cards without state changes", () => {
  for (const checkpoint of [SCORING_TIMINGS.END_OF_TURN, SCORING_TIMINGS.END_OF_BATTLE]) {
    let state = {
      phase: "command", turn: 3, activePlayer: "p1",
      battle: { round: 2, activePlayerId: "p1" },
      players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
      objectives: [], units: [], history: [], scoring: { turnSnapshots: [] }
    };
    const secondary = createMissionDefinition({
      id: `secondary-${checkpoint}`,
      name: `Active secondary for ${checkpoint}`,
      category: "secondary",
      timing: checkpoint,
      conditions: [{ evidence: SCORING_EVIDENCE.TURN_SNAPSHOT, args: { turn: 3 } }]
    });
    state = drawSecondaryMission(state, { definition: secondary, playerId: "p1" });
    const beforeStatus = getSecondaryMissionHistory(state, "p1")[0].status;
    const session = { getState: () => state, subscribe() { return () => {}; } };
    const root = { innerHTML: "", replaceChildren() { this.innerHTML = ""; } };
    const screen = createCommandScreen(root, {
      session, perspectivePlayerId: "p1", scoringCheckpoint: checkpoint,
      scoringCheckpointActivePlayerId: "p1"
    });

    assert.match(root.innerHTML, new RegExp(checkpoint === SCORING_TIMINGS.END_OF_TURN
      ? "End of turn scoring review" : "End of battle scoring review"));
    assert.match(root.innerHTML, new RegExp(`Active secondary for ${checkpoint}`));
    assert.match(root.innerHTML, /does not award VP or change card status/);
    assert.equal(state.victoryPoints, undefined);
    assert.equal(getSecondaryMissionHistory(state, "p1")[0].status, beforeStatus);
    screen.destroy();
  }
});
