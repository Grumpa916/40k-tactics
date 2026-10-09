import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../state/game-state.js";
import {
  drawSecondaryMission,
  resolveSecondaryMission,
  getActiveSecondaryMissionDefinitions,
  getSecondaryMissionHistory,
  SECONDARY_MISSION_STATUS
} from "./secondary-mission-lifecycle.js";

const definition = { id: "sec-1", name: "Demo secondary", category: "secondary", timing: "end-of-turn", conditions: [{ evidence: "unit.status", args: {} }] };

test("drawing a secondary makes it active and preserves draw timing", () => {
  const state = createGameState({ battle: { round: 2 }, turn: 4 });
  const next = drawSecondaryMission(state, { definition, playerId: "p1" });
  const [entry] = getSecondaryMissionHistory(next, "p1");
  assert.equal(entry.status, SECONDARY_MISSION_STATUS.ACTIVE);
  assert.equal(entry.drawnRound, 2);
  assert.equal(entry.drawnTurn, 4);
  assert.deepEqual(getActiveSecondaryMissionDefinitions(next, "p1").map((item) => item.id), ["sec-1"]);
  assert.equal(next.scoring.secondaryMissions.length, 1);
});

test("resolving a secondary removes it from active advisor definitions but retains history", () => {
  let state = drawSecondaryMission(createGameState(), { definition, playerId: "p1", round: 1, turn: 1 });
  const [entry] = getSecondaryMissionHistory(state, "p1");
  state = resolveSecondaryMission(state, { instanceId: entry.instanceId, playerId: "p1", status: SECONDARY_MISSION_STATUS.DISCARDED, round: 1, turn: 2 });
  assert.deepEqual(getActiveSecondaryMissionDefinitions(state, "p1"), []);
  assert.equal(getSecondaryMissionHistory(state, "p1")[0].status, SECONDARY_MISSION_STATUS.DISCARDED);
});

test("rejects primary definitions and duplicate active mission draws", () => {
  assert.throws(() => drawSecondaryMission(createGameState(), { definition: { ...definition, category: "primary" }, playerId: "p1" }), /categorized as secondary/);
  const state = drawSecondaryMission(createGameState(), { definition, playerId: "p1" });
  assert.throws(() => drawSecondaryMission(state, { definition, playerId: "p1" }), /already active/);
});

test("only the owning player may resolve an active secondary", () => {
  const state = drawSecondaryMission(createGameState(), { definition, playerId: "p1" });
  const [entry] = getSecondaryMissionHistory(state);
  assert.throws(() => resolveSecondaryMission(state, { instanceId: entry.instanceId, playerId: "p2", status: SECONDARY_MISSION_STATUS.SCORED }), /owning player/);
});
