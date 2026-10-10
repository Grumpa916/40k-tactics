import test from "node:test";
import assert from "node:assert/strict";
import {
  battlefieldPositionToPercent,
  isValidBattlefieldPosition,
  renderBattlefieldMap
} from "../../src/ui/battlefield-map.js";

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

test("unknown map mode is rejected", () => {
  assert.throws(() => renderBattlefieldMap({}, { mode: "terrain" }), /Unknown battlefield map mode/);
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
