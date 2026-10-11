import test from "node:test";
import assert from "node:assert/strict";
import { createBattleSetupScreen } from "../../src/ui/battle-setup-screen.js";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit, UNIT_STATUS } from "../../src/state/unit.js";
import { COMMAND_TYPES } from "../../src/commands/game-commands.js";
import { setEventCompanionMissionSetup } from "../../src/engine/battlefield-map-transitions.js";

function setup() {
  let state = createGameState({
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
    querySelector() { return null; }
  };
  const session = {
    getState: () => state,
    dispatch: (command) => {
      commands.push(command);
      if (command.type === COMMAND_TYPES.SET_EVENT_COMPANION_MISSION_SETUP) {
        state = setEventCompanionMissionSetup(state, command.payload);
      }
      return state;
    },
    subscribe() { return () => {}; }
  };
  return { root, session, commands, listeners };
}

test("setup planning map offers only the perspective player's units", () => {
  const { root, session } = setup();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  assert.match(root.innerHTML, /Deployment Planning Map/);
  assert.match(root.innerHTML, /Friendly Unit/);
  assert.doesNotMatch(root.innerHTML, /<option value="enemy"/);
  assert.match(root.innerHTML, /data-battlefield-map/);
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

test("setup screen displays fixed ruleset checklist, readiness, and conditional ability prompts", () => {
  const { root, session } = setup();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  assert.match(root.innerHTML, /Pre-game checklist/);
  assert.match(root.innerHTML, /fixed by the ruleset/);
  assert.match(root.innerHTML, /Confirm the mission/);
  assert.match(root.innerHTML, /Confirm both armies/);
  assert.match(root.innerHTML, /Record actual deployment/);
  assert.match(root.innerHTML, /Infiltrators/);
  assert.match(root.innerHTML, /Scouts/);
  assert.match(root.innerHTML, /Mission selected/);
  assert.match(root.innerHTML, /the map does not validate legality/);
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
