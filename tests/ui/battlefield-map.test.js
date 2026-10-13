import test from "node:test";
import assert from "node:assert/strict";
import {
  battlefieldPositionToPercent,
  isValidBattlefieldPosition,
  renderBattlefieldMap
} from "../../src/ui/battlefield-map.js";
import { loadEventCompanionEdgeMeasurements } from "../../src/data/event-companion-edge-measurements.js";

test("battlefield coordinates map to a 60 by 44 board with the player's edge at the bottom", () => {
  assert.deepEqual(battlefieldPositionToPercent({ x: 0, y: 0 }), { left: 0, top: 100 });
  assert.deepEqual(battlefieldPositionToPercent({ x: 60, y: 44 }), { left: 100, top: 0 });
  assert.deepEqual(battlefieldPositionToPercent({ x: 30, y: 22 }), { left: 50, top: 50 });
});

test("invalid and out-of-board positions are not rendered", () => {
  assert.equal(isValidBattlefieldPosition({ x: -1, y: 3 }), false);
  assert.equal(isValidBattlefieldPosition({ x: 4, y: 45 }), false);
  assert.equal(battlefieldPositionToPercent({ x: NaN, y: 2 }), null);
});

test("live map shows both armies from deployed unit positions only", () => {
  const html = renderBattlefieldMap({
    activePlayer: "p1",
    units: [
      { id: "a", ownerId: "p1", name: "Friendly", status: "deployed", position: { x: 5, y: 6 } },
      { id: "b", ownerId: "p2", name: "Enemy", status: "deployed", position: { x: 45, y: 30 } },
      { id: "c", ownerId: "p2", name: "Reserve", status: "reserves", position: { x: 20, y: 20 } }
    ]
  }, { mode: "live", perspectivePlayerId: "p1" });
  assert.match(html, /data-map-unit-id="a"/);
  assert.match(html, /data-map-unit-id="b"/);
  assert.doesNotMatch(html, /data-map-unit-id="c"/);
  assert.match(html, /class="battlefield-map__unit friendly"/);
  assert.match(html, /class="battlefield-map__unit opponent"/);
});

test("planning and actual deployment modes never substitute live positions", () => {
  const state = {
    units: [{ id: "u1", ownerId: "p1", name: "Unit", status: "deployed", position: { x: 9, y: 8 } }],
    battlefieldMap: {
      deploymentPlan: { u1: { x: 12, y: 13 } },
      actualDeployment: { u1: { position: { x: 21, y: 22 } } }
    }
  };
  const plan = renderBattlefieldMap(state, { mode: "planning", perspectivePlayerId: "p1" });
  const deployment = renderBattlefieldMap(state, { mode: "deployment", perspectivePlayerId: "p1" });
  assert.match(plan, /left:20%;top:70.45454545454545%/);
  assert.match(deployment, /left:35%;top:50%/);
  assert.doesNotMatch(plan, /left:15%;top:81.81818181818181%/);
});

test("missing positions remain visibly unrecorded and objectives require explicit coordinates", () => {
  const html = renderBattlefieldMap({
    units: [{ id: "u1", ownerId: "p1", name: "Unit", status: "deployed", position: null }],
    objectives: [{ id: "o1", name: "Objective" }]
  }, { mode: "live", perspectivePlayerId: "p1" });
  assert.match(html, /No positions recorded/);
  assert.doesNotMatch(html, /data-map-objective-id="o1"/);
  assert.match(html, /not inferred by this reference grid/);
});


test("planning and deployment maps omit coordinate measurements", () => {
  const state = {
    units: [{ id: "u1", ownerId: "p1", name: "Unit", status: "deployed" }],
    battlefieldMap: { deploymentPlan: {}, actualDeployment: {} }
  };
  for (const mode of ["planning", "deployment"]) {
    const html = renderBattlefieldMap(state, { mode, perspectivePlayerId: "p1" });
    assert.doesNotMatch(html, /60″ × 44″ reference grid/);
    assert.doesNotMatch(html, /class="battlefield-map__edge-dimension-line"/);
    assert.doesNotMatch(html, /Y=44″|Y=0″/);
    assert.doesNotMatch(html, /60 by 44 inch reference board/);
  }
});

test("live map retains coordinate reference labels", () => {
  const html = renderBattlefieldMap({ units: [] }, { mode: "live" });
  assert.match(html, /60″ × 44″ reference grid/);
  assert.match(html, /Y=44″/);
  assert.match(html, /Y=0″/);
});

test("unknown map mode is rejected", () => {
  assert.throws(() => renderBattlefieldMap({}, { mode: "terrain" }), /Unknown battlefield map mode/);
});

test("battlefield overview shows verified terrain footprints without invented measurement callouts", () => {
  const html = renderBattlefieldMap({
    units: [{ id: "unit-on-setup-map", ownerId: "p1", name: "Should not appear", status: "deployed", position: { x: 20, y: 20 } }],
    battlefieldMap: { missionSetup: {
      myDisposition: "Take and Hold",
      opponentDisposition: "Take and Hold",
      layout: "A"
    }}
  }, { mode: "planning", perspectivePlayerId: "p1", showUnits: false });

  assert.match(html, /data-terrain="T1"/);
  assert.match(html, /official Event Companion diagram for exact terrain placement/);
  assert.doesNotMatch(html, /data-table-edge-dimension/);
  assert.doesNotMatch(html, /data-table-edge-measurement/);
  assert.doesNotMatch(html, /data-distance-inches/);
  assert.doesNotMatch(html, /data-map-unit-id="unit-on-setup-map"/);
});
test("live map follows current model positions instead of stale deployment-level position", () => {
  const html = renderBattlefieldMap({
    units: [{
      id: "u1",
      ownerId: "p1",
      name: "Moved Unit",
      status: "deployed",
      position: { x: 10, y: 10 },
      models: [
        { id: "m1", position: { x: 20, y: 10 } },
        { id: "m2", position: { x: 40, y: 30 } }
      ]
    }],
    history: [{
      type: "unit.normal_move_resolved",
      payload: { unitId: "u1", moves: [
        { modelId: "m1", from: { x: 10, y: 10 }, to: { x: 20, y: 10 } },
        { modelId: "m2", from: { x: 10, y: 10 }, to: { x: 40, y: 30 } }
      ] }
    }]
  }, { mode: "live", perspectivePlayerId: "p1" });

  assert.match(html, /left:50%;top:54\.54545454545454%/);
  assert.doesNotMatch(html, /left:16\.666666666666664%;top:77\.27272727272727%/);
});


test("live map uses actual deployment anchor until movement records newer model coordinates", () => {
  const html = renderBattlefieldMap({
    units: [{
      id: "u1",
      ownerId: "p1",
      name: "Deployed Unit",
      status: "deployed",
      position: { x: 10, y: 10 },
      models: [
        { id: "m1", position: { x: 20, y: 10 } },
        { id: "m2", position: { x: 40, y: 30 } }
      ]
    }],
    battlefieldMap: { actualDeployment: { u1: { x: 12, y: 14 } } },
    history: []
  }, { mode: "live", perspectivePlayerId: "p1" });

  assert.match(html, /left:20%;top:68\.18181818181817%/);
  assert.doesNotMatch(html, /left:50%;top:54\.54545454545454%/);
});


test("live map displays recorded objective control and current game status", () => {
  const html = renderBattlefieldMap({
    players: [{ id: "p1", name: "Astra" }, { id: "p2", name: "Tyranids" }],
    activePlayer: "p1",
    phase: "movement",
    battle: { id: "b1", status: "active", round: 2, activePlayerId: "p1" },
    units: [],
    objectives: [
      { id: "obj1", name: "Alpha", position: { x: 10, y: 12 }, control: {
        id: "obj1", controllerId: "p1", contestingPlayerIds: [], controlState: "controlled"
      }},
      { id: "obj2", name: "Beta", position: { x: 40, y: 20 }, control: {
        id: "obj2", controllerId: null, contestingPlayerIds: ["p1", "p2"], controlState: "contested"
      }},
      { id: "obj3", name: "Gamma" }
    ]
  }, { mode: "live", perspectivePlayerId: "p1" });

  assert.match(html, /data-map-game-status>Round 2 · movement · Astra/);
  assert.match(html, /data-objective-control="Controlled by Astra"/);
  assert.match(html, /data-objective-control="Contested by Astra and Tyranids"/);
  assert.match(html, /Alpha: Controlled by Astra/);
  assert.match(html, /Beta: Contested by Astra and Tyranids/);
  assert.doesNotMatch(html, /data-map-objective-id="obj3"/);
});

test("live game status is not invented when there is no active battle", () => {
  const html = renderBattlefieldMap({ units: [] }, { mode: "live" });
  assert.doesNotMatch(html, /data-map-game-status/);
});

test("Layout A page 27 renders every stored Event Companion edge callout without changing its value", async () => {
  const measurementsByPage = await loadEventCompanionEdgeMeasurements();
  const sourceMeasurements = measurementsByPage["27"];
  assert.ok(Array.isArray(sourceMeasurements));
  assert.equal(sourceMeasurements.length, 10);

  const html = renderBattlefieldMap({
    battlefieldMap: { missionSetup: {
      myDisposition: "Purge the Foe",
      opponentDisposition: "Disruption",
      layout: "A"
    }},
    units: []
  }, {
    mode: "planning",
    showUnits: false,
    showMeasurements: false,
    showTerrainEdgeMeasurements: true,
    terrainMeasurements: sourceMeasurements,
    mapLabel: "Terrain placement reference"
  });

  const renderedValues = Array.from(html.matchAll(
    /<text class="battlefield-map__dimension-text"[^>]*>(.*?)<\/text>/g
  ), (match) => match[1].replaceAll("&quot;", '"'));
  assert.deepEqual(renderedValues, sourceMeasurements.map((item) => item.value));
  assert.match(html, /Event Companion layout A · p\. 27/);
});

test("planning and deployment maps stage unplaced units as selectable markers", () => {
  const state = {
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    units: [
      { id: "friendly", ownerId: "p1", name: "Friendly Unit", status: "reserves" },
      { id: "enemy", ownerId: "p2", name: "Opponent Unit", status: "reserves" },
      { id: "reserve", ownerId: "p1", name: "Declared Reserve", status: "reserves" }
    ],
    battlefieldMap: { deploymentPlan: {}, actualDeployment: {}, declaredReserves: { reserve: true } }
  };
  const planning = renderBattlefieldMap(state, { mode: "planning", perspectivePlayerId: "p1", selectedUnitId: "friendly" });
  assert.match(planning, /data-map-unit-id="friendly"/);
  assert.match(planning, /data-map-unit-unplaced="true"/);
  assert.match(planning, /is-selected/);
  assert.doesNotMatch(planning, /data-map-unit-id="enemy"/);

  const deployment = renderBattlefieldMap(state, { mode: "deployment", perspectivePlayerId: "p1" });
  assert.match(deployment, /data-map-unit-id="friendly"/);
  assert.match(deployment, /data-map-unit-id="enemy"/);
  assert.doesNotMatch(deployment, /data-map-unit-id="reserve"/);
});

test("deployment map shows both armies while excluding declared reserves and destroyed units", () => {
  const html=renderBattlefieldMap({
    players:[{id:"p1",name:"You"},{id:"p2",name:"Opponent"}],
    units:[
      {id:"friendly",ownerId:"p1",name:"Friendly",status:"deployed",position:{x:9,y:8}},
      {id:"opponent",ownerId:"p2",name:"Opponent",status:"deployed",position:{x:46,y:30}},
      {id:"reserve",ownerId:"p1",name:"Reserve",status:"reserves"},
      {id:"destroyed",ownerId:"p2",name:"Destroyed",status:"destroyed"}
    ],
    battlefieldMap:{actualDeployment:{},declaredReserves:{reserve:true}}
  },{mode:"deployment",perspectivePlayerId:"p1"});
  assert.match(html,/data-map-unit-id="friendly"/);
  assert.match(html,/data-map-unit-id="opponent"/);
  assert.doesNotMatch(html,/data-map-unit-id="reserve"/);
  assert.doesNotMatch(html,/data-map-unit-id="destroyed"/);
});



test("terrain setup restores edge-distance callouts and preserves verified source labels", async () => {
  const measurementsByPage = await loadEventCompanionEdgeMeasurements();
  assert.ok(Array.isArray(measurementsByPage["18"]));
  assert.ok(measurementsByPage["18"].some((item) => item.value === '26"' && item.x === -3.45));

  const html = renderBattlefieldMap({
    battlefieldMap: { missionSetup: {
      myDisposition: "Take and Hold",
      opponentDisposition: "Reconnaissance",
      layout: "A"
    }},
    units: []
  }, {
    mode: "planning",
    showUnits: false,
    showMeasurements: false,
    showTerrainEdgeMeasurements: true,
    terrainMeasurements: measurementsByPage["18"],
    mapLabel: "Terrain placement reference"
  });

  assert.match(html, /Terrain placement reference/);
  assert.match(html, /Verified Event Companion terrain to battlefield edge measurements/);
  assert.doesNotMatch(html, /data-zone=/);
  assert.match(html, /Event Companion layout A · p\. 18/);
  assert.match(html, /aria-label="Verified Event Companion terrain to battlefield edge measurements"/);
  assert.match(html, /class="battlefield-map__dimension-text"/);
  assert.match(html, />26&quot;<\/text>/);
  assert.match(html, /data-source-x="-3\.45" data-source-y="9\.16" x="-5\.75"/);
  assert.doesNotMatch(html, /Opponent edge · Y=44″/);
  assert.doesNotMatch(html, /Your edge · Y=0″/);
  assert.doesNotMatch(html, /class="battlefield-map__ruler/);
  assert.doesNotMatch(html, /60″ × 44″ reference grid/);
  assert.doesNotMatch(html, /No positions recorded/);
  assert.doesNotMatch(html, /data-map-unit-id=/);
});

test("terrain measurement overlay renders only explicitly sourced dimension endpoints", () => {
  const state = {
    units: [],
    battlefieldMap: { missionSetup: {
      myDisposition: "Take and Hold",
      opponentDisposition: "Take and Hold",
      layout: "A"
    }}
  };
  const html = renderBattlefieldMap(state, {
    mode: "planning",
    showUnits: false,
    showTerrainEdgeMeasurements: true,
    terrainMeasurements: [
      { value: '12"', x: 20, y: 15, x1: 10, y1: 15, x2: 20, y2: 15 },
      { value: '7"', x: 30, y: 20 }
    ]
  });
  assert.match(html, /class="battlefield-map__dimension-line"[^>]*x1="16\.666666666666664"[^>]*y1="65\.9090909090909"[^>]*x2="33\.33333333333333"[^>]*y2="65\.9090909090909"/);
  assert.match(html, /data-source-measurement="12&quot;"/);
  assert.equal((html.match(/class="battlefield-map__dimension-line"/g) ?? []).length, 2);
  assert.equal((html.match(/class="battlefield-map__dimension-tick"/g) ?? []).length, 4);
  assert.match(html, />7&quot;<\/text>/);
});
