import test from "node:test";
import assert from "node:assert/strict";
import { createBattleSetupScreen } from "../../src/ui/battle-setup-screen.js";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit, UNIT_STATUS } from "../../src/state/unit.js";
import { COMMAND_TYPES } from "../../src/commands/game-commands.js";
import { setEventCompanionMissionSetup } from "../../src/engine/battlefield-map-transitions.js";

function setup({ battle = null, scoring = {} } = {}) {
  let state = createGameState({
    battle,
    scoring,
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    units: [
      createUnit({ id: "friendly", ownerId: "p1", name: "Friendly Unit", status: UNIT_STATUS.RESERVES }),
      createUnit({ id: "enemy", ownerId: "p2", name: "Enemy Unit", status: UNIT_STATUS.RESERVES })
    ]
  });
  const commands = [];
  const listeners = {};
  const root = {
    innerHTML: "",
    addEventListener(type, listener) { listeners[type] = listener; },
    removeEventListener(type) { delete listeners[type]; },
    replaceChildren() { this.innerHTML = ""; },
    contains() { return true; },
    querySelector() { return null; }
  };
  const session = {
    getState: () => state,
    dispatch: (command) => {
      commands.push(command);
      if (command.type === COMMAND_TYPES.SET_EVENT_COMPANION_MISSION_SETUP) {
        state = setEventCompanionMissionSetup(state, command.payload);
      } else if (command.type === COMMAND_TYPES.SET_PRE_GAME_ROLES) {
        state = { ...state, preGameSetup: {
          ...(state.preGameSetup ?? {}),
          ...command.payload,
          defenderPlayerId: command.payload.attackerPlayerId
            ? (state.players ?? []).find((player) => player.id !== command.payload.attackerPlayerId)?.id ?? null
            : state.preGameSetup?.defenderPlayerId ?? null
        }};
      }
      return state;
    },
    subscribe() { return () => {}; }
  };
  return { root, session, commands, listeners };
}

test("planning map can expand to full screen and return without changing setup state", () => {
  const { root, session, listeners } = setup();
  const stateBeforeFullscreen = session.getState();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  screen.setTab("battlefield");
  assert.match(root.innerHTML, /data-toggle-battlefield-fullscreen/);
  assert.doesNotMatch(root.innerHTML, /battlefield-map-section is-fullscreen/);
  listeners.click({
    target: {
      closest(selector) {
        return selector === "[data-toggle-battlefield-fullscreen]" ? {} : null;
      }
    }
  });
  assert.match(root.innerHTML, /battlefield-map-section is-fullscreen/);
  assert.match(root.innerHTML, /Exit full screen/);
  listeners.click({
    target: {
      closest(selector) {
        return selector === "[data-toggle-battlefield-fullscreen]" ? {} : null;
      }
    }
  });
  assert.doesNotMatch(root.innerHTML, /battlefield-map-section is-fullscreen/);
  assert.deepEqual(session.getState(), stateBeforeFullscreen);
  screen.destroy();
});

test("mission and battlefield setup are separate stages", () => {
  const { root, session } = setup();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  assert.match(root.innerHTML, /data-setup-content="mission-map"/);
  assert.match(root.innerHTML, /data-secondary-player-panel="p1"/);
  assert.match(root.innerHTML, /data-event-companion-disposition-choice="my"/);
  screen.setTab("battlefield");
  assert.match(root.innerHTML, /data-setup-content="battlefield"/);
  assert.match(root.innerHTML, /data-battlefield-map/);
  screen.destroy();
});
test("terrain setup map omits unit markers even when armies are loaded", () => {
  const { root, session } = setup();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  screen.setTab("battlefield");

  assert.doesNotMatch(root.innerHTML, /data-map-unit-id=/);
  assert.doesNotMatch(root.innerHTML, /Friendly Unit/);
  assert.doesNotMatch(root.innerHTML, /Opponent Unit/);
  screen.destroy();
});
test("selecting a unit and tapping the planning map records a bounded coordinate command", () => {
  const { root, session, commands, listeners } = setup();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  listeners.click({
    target: {
      closest(selector) {
        return selector === "[data-planning-unit-select]" ? { value: "friendly" } : null;
      }
    }
  });
  const board = {
    closest(selector) { return selector === '[data-map-mode="planning"]' ? {} : null; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 600, height: 440 }; }
  };
  listeners.click({
    clientX: 300,
    clientY: 220,
    target: { closest(selector) { return selector === "[data-battlefield-map-board]" ? board : null; } }
  });
  assert.deepEqual(commands, [{
    type: "battlefield_map.set_deployment_plan_position",
    payload: { unitId: "friendly", playerId: "p1", position: { x: 30, y: 22 } }
  }]);
  screen.destroy();
});

test("attacker and first-turn role buttons dispatch on click", () => {
  const { root, session, commands, listeners } = setup();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  function tapRole(kind, playerId) {
    const button = {
      getAttribute(name) {
        return name === "data-pre-game-role-choice" ? kind
          : name === "data-player-id" ? playerId : null;
      }
    };
    listeners.click({
      target: { closest(selector) {
        return selector === "[data-pre-game-role-choice]" ? button : null;
      }}
    });
  }
  tapRole("attackerPlayerId", "p2");
  tapRole("firstPlayerId", "p1");
  assert.deepEqual(commands, [
    { type: COMMAND_TYPES.SET_PRE_GAME_ROLES, payload: { attackerPlayerId: "p2", firstPlayerId: null } },
    { type: COMMAND_TYPES.SET_PRE_GAME_ROLES, payload: { attackerPlayerId: "p2", firstPlayerId: "p1" } }
  ]);
  screen.destroy();
});

test("selected Event Companion layout renders its map in the pre-game workspace", () => {
  const { root, session, listeners } = setup();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  function tapDisposition(kind, value) {
    const button = { getAttribute(name) {
      return name === "data-event-companion-disposition-choice" ? kind
        : name === "data-disposition-value" ? value : null;
    }};
    listeners.click({ target: { closest(selector) {
      return selector === "[data-event-companion-disposition-choice]" ? button : null;
    }}});
  }
  tapDisposition("my", "Take and Hold");
  tapDisposition("opponent", "Take and Hold");
  assert.match(root.innerHTML, /data-map-layout-status/);
  assert.match(root.innerHTML, /data-terrain=/);
  assert.match(root.innerHTML, /data-layout-objective=/);
  screen.destroy();
});

test("setup screen uses touch-friendly battle role choices without the pre-game checklist", () => {
  const { root, session } = setup();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  assert.doesNotMatch(root.innerHTML, /Pre-game checklist/);
  assert.match(root.innerHTML, /data-pre-game-role-choice="attackerPlayerId"/);
  assert.match(root.innerHTML, /data-pre-game-role-choice="firstPlayerId"/);
  assert.match(root.innerHTML, /Choose attacker/);
  assert.match(root.innerHTML, /Choose first player/);
  assert.match(root.innerHTML, /Defender:/);
  assert.match(root.innerHTML, /Primary Missions &amp; Battlefield/);
  screen.destroy();
});


test("Force Disposition touch buttons update mission setup and unlock layout choices", () => {
  const { root, session, commands, listeners } = setup();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });

  function tapDisposition(kind, value) {
    const button = {
      getAttribute(name) {
        return name === "data-event-companion-disposition-choice" ? kind
          : name === "data-disposition-value" ? value : null;
      }
    };
    listeners.click({
      target: {
        closest(selector) {
          return selector === "[data-event-companion-disposition-choice]" ? button : null;
        }
      }
    });
  }

  assert.match(root.innerHTML, /data-event-companion-disposition-choice="my"/);
  tapDisposition("my", "Take and Hold");
  assert.equal(session.getState().battlefieldMap.missionSetup.myDisposition, "Take and Hold");
  assert.match(root.innerHTML, /Disposition recorded/);

  tapDisposition("opponent", "Disruption");
  assert.equal(session.getState().battlefieldMap.missionSetup.opponentDisposition, "Disruption");
  assert.match(root.innerHTML, /Your Primary Mission:/);
  assert.match(root.innerHTML, /Opponent Primary Mission:/);
  assert.match(root.innerHTML, /data-event-companion-layout="A"/);
  assert.equal(commands.length, 2);
  assert.equal(commands[0].type, COMMAND_TYPES.SET_EVENT_COMPANION_MISSION_SETUP);
  assert.equal(commands[1].payload.myDisposition, "Take and Hold");
  assert.equal(commands[1].payload.opponentDisposition, "Disruption");
  screen.destroy();
});


test("Force Disposition buttons remain enabled during setup and locked during active battle", () => {
  const setupState = setup();
  const setupScreen = createBattleSetupScreen(setupState.root, { session: setupState.session, perspectivePlayerId: "p1" });
  const setupButtons = setupState.root.innerHTML.match(/<button type="button" data-event-companion-disposition-choice=/g) ?? [];
  assert.equal(setupButtons.length, 10);
  assert.doesNotMatch(setupState.root.innerHTML, /data-event-companion-disposition-choice="my"[^>]*disabled/);
  setupScreen.destroy();

  const activeState = setup({ battle: { id: "active-battle", status: "active", round: 1 } });
  const activeScreen = createBattleSetupScreen(activeState.root, { session: activeState.session, perspectivePlayerId: "p1" });
  assert.match(activeState.root.innerHTML, /data-event-companion-disposition-choice="my"[^>]*disabled/);
  assert.match(activeState.root.innerHTML, /data-event-companion-disposition-choice="opponent"[^>]*disabled/);
  activeScreen.destroy();
});


test("Fixed secondary card selectors use the shipped catalog when no catalog is injected", () => {
  const { root, session } = setup({
    scoring: { secondaryMissionModeByPlayer: { p1: "fixed", p2: "fixed" }, secondaryMissions: [] }
  });
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  assert.match(root.innerHTML, /data-setup-secondary-definition/);
  assert.match(root.innerHTML, /Select a Fixed card/);
  assert.match(root.innerHTML, /A Grievous Blow|Assassination|Bring it Down|Engage on All Fronts/);
  const p1Panel = root.innerHTML.split('data-secondary-player-panel="p1"')[1].split("</section>")[0];
  const p2Panel = root.innerHTML.split('data-secondary-player-panel="p2"')[1].split("</section>")[0];
  assert.match(p1Panel, /<option value="secondary-/);
  assert.match(p2Panel, /<option value="secondary-/);
  screen.destroy();
});

test("secondary mission setup shows both players at once with independent mode controls", () => {
  const { root, session } = setup();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  assert.match(root.innerHTML, /class="secondary-player-panels"/);
  assert.match(root.innerHTML, /data-secondary-player-panel="p1"/);
  assert.match(root.innerHTML, /data-secondary-player-panel="p2"/);
  assert.match(root.innerHTML, /data-setup-secondary-mode="p1"/);
  assert.match(root.innerHTML, /data-setup-secondary-mode="p2"/);
  assert.doesNotMatch(root.innerHTML, /data-setup-secondary-player/);
  screen.destroy();
});

test("Fixed secondary selection validates the selected player's mode without an undefined player reference", () => {
  const { root, session, listeners } = setup({
    scoring: { secondaryMissionModeByPlayer: { p1: "fixed" }, secondaryMissions: [] }
  });
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  const button = {
    getAttribute(name) { return name === "data-setup-fixed-add" ? "p1" : null; },
    closest(selector) { return selector === "[data-setup-fixed-add]" ? this : null; }
  };
  assert.doesNotThrow(() => listeners.click({ target: button }));
  assert.match(root.innerHTML, /Select a Fixed card|Choose Fixed mode|secondary/i);
  screen.destroy();
});


test("terrain setup displays the selected official Event Companion PDF page without army units", () => {
  const { root, session, listeners } = setup();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  function tapDisposition(kind, value) {
    const button = { getAttribute(name) {
      return name === "data-event-companion-disposition-choice" ? kind
        : name === "data-disposition-value" ? value : null;
    }};
    listeners.click({ target: { closest(selector) {
      return selector === "[data-event-companion-disposition-choice]" ? button : null;
    }}});
  }
  tapDisposition("my", "Take and Hold");
  tapDisposition("opponent", "Take and Hold");
  const layoutButton = { getAttribute(name) {
    return name === "data-event-companion-layout" ? "A" : null;
  }};
  listeners.click({ target: { closest(selector) {
    return selector === "[data-event-companion-layout]" ? layoutButton : null;
  }}});
  screen.setTab("battlefield");

  assert.match(root.innerHTML, /official Event Companion terrain layout A · page 9/i);
  assert.match(root.innerHTML, /eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x\.pdf#page=9&amp;zoom=125/);
  assert.match(root.innerHTML, /<iframe[^>]+title="Official Event Companion terrain layout A, page 9"/);
  assert.doesNotMatch(root.innerHTML, /data-map-unit-id=/);
  assert.doesNotMatch(root.innerHTML, /data-terrain-measurement=/);
  assert.doesNotMatch(root.innerHTML, /data-table-edge-measurement=/);
  assert.doesNotMatch(root.innerHTML, /data-planning-unit-select/);
  assert.match(root.innerHTML, /data-toggle-battlefield-fullscreen/);
  screen.destroy();
});
