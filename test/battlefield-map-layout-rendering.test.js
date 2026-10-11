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
  assert.doesNotMatch(html, /battlefield-map__geometry/);
  assert.doesNotMatch(html, /data-layout-objective/);
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
