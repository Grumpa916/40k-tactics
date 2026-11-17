import test from "node:test";
import assert from "node:assert/strict";
import { classifyMovementDestination, classifyMovementRecommendations } from "../../src/rules/tactical-movement-reachability.js";

test("10 inch move never reaches objectives 24, 33 or 39 inches away", () => {
  for (const distance of [24, 33, 39]) {
    const reach = classifyMovementDestination(distance, 10);
    assert.equal(reach.status, "future");
    assert.ok(reach.remainingGap >= 11);
  }
});

test("reachable, staging, future and unknown have distinct statuses", () => {
  assert.equal(classifyMovementDestination(12, 10).status, "reachable");
  assert.equal(classifyMovementDestination(16, 10).status, "staging");
  assert.equal(classifyMovementDestination(24, 10).status, "future");
  assert.equal(classifyMovementDestination(24, null).status, "unknown");
});

test("far objective cannot outrank plausible current-turn capture on VP alone", () => {
  const result = classifyMovementRecommendations({ recommendations: [{
    unitId: "tank", unitName: "Caladius", movement: 10, type: "movement",
    objectiveId: "enemy-home", objectiveName: "Enemy Home", distance: 39,
    score: 0.99, priority: 5, purpose: "set-decoy", recommendation: "Set decoy now",
    actionHint: "Set decoy", alternatives: [{
      kind: "objective", objectiveId: "centre", objectiveName: "Centre", distance: 9,
      score: 0.65, purpose: "claim-objective", actionHint: "Normal Move can plausibly reach"
    }]
  }] });
  const best = result.recommendations[0];
  assert.equal(best.objectiveId, "centre");
  assert.equal(best.reachability, "reachable");
  assert.equal(best.alternatives[0].reachability, "future");
  assert.ok(best.alternatives[0].score <= 0.27);
  assert.doesNotMatch(best.recommendation, /Set decoy now/);
});

test("staging does not claim an action is legal now", () => {
  const result = classifyMovementRecommendations({ recommendations: [{
    unitId: "u", unitName: "Mover", movement: 10, type: "movement",
    objectiveId: "o", objectiveName: "Target", distance: 16,
    score: 0.9, priority: 5, purpose: "claim-objective",
    recommendation: "Capture target", alternatives: []
  }] });
  const item = result.recommendations[0];
  assert.equal(item.reachability, "staging");
  assert.equal(item.remainingGap, 3);
  assert.match(item.actionHint, /Advance might help/);
  assert.doesNotMatch(item.recommendation, /Capture target/);
});
