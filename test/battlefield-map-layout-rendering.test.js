import test from "node:test";
import assert from "node:assert/strict";
import { renderBattlefieldMap } from "../src/ui/battlefield-map.js";

test("selected verified Event Companion layout renders terrain, deployment zones and objectives", () => {
  const state = {
    players: [{ id: "me", name: "My Army" }],
    units: [],
    objectives: [],
    history: [],
    battlefieldMap: {
      missionSetup: {
        myDisposition: "Take and Hold",
        opponentDisposition: "Take and Hold",
        layout: "A"
      }
    }
  };
  const html = renderBattlefieldMap(state, { mode: "planning", perspectivePlayerId: "me" });
  assert.match(html, /data-map-layout-status>Event Companion layout A · p\. 9/);
  assert.match(html, /class="battlefield-map__geometry"/);
  assert.match(html, /class="battlefield-map__zone"/);
  assert.match(html, /class="battlefield-map__terrain"/);
  assert.match(html, /data-layout-objective="Defender Home"/);
  assert.match(html, /data-layout-objective="Attacker Home"/);
  assert.match(html, /data-layout-objective="Central 1"/);
});

test("map without a selected verified layout does not invent geometry", () => {
  const html = renderBattlefieldMap({ units: [], objectives: [], history: [] }, { mode: "planning" });
  assert.doesNotMatch(html, /<svg class="battlefield-map__geometry"/);
  assert.doesNotMatch(html, /<div class="battlefield-map__objective battlefield-map__objective--layout" data-layout-objective=/);
  assert.match(html, /Terrain, deployment zones, line of sight/);
});

test("selected Event Companion layout geometry is shared across planning, deployment and live map modes", () => {
  const state = {
    players: [{ id: "me", name: "My Army" }],
    units: [],
    objectives: [],
    history: [],
    battlefieldMap: {
      missionSetup: {
        myDisposition: "Take and Hold",
        opponentDisposition: "Take and Hold",
        layout: "B"
      }
    }
  };
  for (const mode of ["planning", "deployment", "live"]) {
    const html = renderBattlefieldMap(state, { mode, perspectivePlayerId: "me" });
    assert.match(html, /Event Companion layout B · p\. 10/);
    assert.match(html, /battlefield-map__terrain/);
  }
});


test("selected layout renders each canonical objective once at catalog coordinates and links control by explicit key", () => {
  const state = {
    players: [{ id: "me", name: "My Army" }, { id: "opponent", name: "Opponent" }],
    units: [],
    objectives: [
      { id: "obj-home", name: "Home marker", layoutObjective: "Defender Home", position: { x: 2, y: 2 },
        control: { id: "obj-home", controllerId: "me", contestingPlayerIds: [], controlState: "controlled" } },
      { id: "legacy-center", name: "Legacy center", position: { x: 30, y: 22 } }
    ],
    history: [],
    battlefieldMap: { missionSetup: {
      myDisposition: "Take and Hold",
      opponentDisposition: "Take and Hold",
      layout: "A"
    } }
  };
  const html = renderBattlefieldMap(state, { mode: "live", perspectivePlayerId: "me" });
  const markers = [...html.matchAll(/data-layout-objective="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(markers.sort(), ["Attacker Home", "Central 1", "Defender Home", "Expansion 1", "Expansion 2"].sort());
  assert.equal((html.match(/data-map-objective-id=/g) ?? []).length, 5);
  assert.match(html, /data-layout-objective="Defender Home" data-map-objective-id="obj-home" data-objective-control="Controlled by My Army"/);
  assert.match(html, /data-layout-objective="Attacker Home" data-map-objective-id="event-companion:Attacker Home" data-objective-control="Control not recorded"/);
  assert.doesNotMatch(html, /data-map-objective-id="legacy-center"/);
  assert.match(html, /left:21\\.16666666666666[0-9]*%;top:41\\.3636363636363[0-9]*%/);
});

test("layout objective controls link only through stable IDs or explicit layoutObjective keys", () => {
  const state = {
    players: [{ id: "p1", name: "Player 1" }],
    units: [],
    objectives: [{
      id: "event-companion:Central 1",
      name: "Central",
      position: { x: 1, y: 1 },
      control: { id: "event-companion:Central 1", controllerId: "p1", contestingPlayerIds: [], controlState: "controlled" }
    }],
    battlefieldMap: { missionSetup: {
      myDisposition: "Take and Hold",
      opponentDisposition: "Take and Hold",
      layout: "A"
    } }
  };
  const html = renderBattlefieldMap(state, { mode: "planning", perspectivePlayerId: "p1" });
  assert.match(html, /data-layout-objective="Central 1" data-map-objective-id="event-companion:Central 1" data-objective-control="Controlled by Player 1"/);
});
