import test from "node:test";
import assert from "node:assert/strict";
import { renderConsecrateReviewSection } from "../../src/ui/consecrate-review.js";
import { getPhaseProgressionAction, renderPhaseProgressionPanel } from "../../src/ui/phase-progression-panel.js";
import { recordConsecrateReview } from "../../src/engine/consecrate-transitions.js";
import { COMMAND_TYPES } from "../../src/commands/game-commands.js";

function state() {
  return {
    phase: "end_turn",
    turn: 3,
    activePlayer: "p1",
    battle: { status: "active", round: 3, activePlayerId: "p1" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    battlefieldMap: { missionSetup: { myDisposition: "Purge the Foe", opponentDisposition: "Reconnaissance", layout: "A" } },
    objectives: [
      { id: "event-companion:Attacker Home", layoutObjective: "Attacker Home", position: { x: 8, y: 22 }, control: { controlState: "controlled", controllerId: "p1", contestingPlayerIds: [] } },
      { id: "event-companion:Central 1", layoutObjective: "Central 1", position: { x: 30, y: 22 }, control: { controlState: "controlled", controllerId: "p2", contestingPlayerIds: [] } }
    ],
    units: [
      { id: "carrier", ownerId: "p1", name: "Carrier", status: "deployed", position: { x: 28, y: 22 }, wounds: 5 },
      { id: "enemy", ownerId: "p2", name: "Enemy", status: "destroyed", position: { x: 29, y: 22 }, wounds: 0 }
    ],
    history: [{
      type: "combat.attack_resolved",
      payload: {
        turn: 3,
        round: 3,
        phase: "shooting",
        attackerId: "carrier",
        targetId: "enemy",
        stateDelta: { target: { unitId: "enemy", statusBefore: "deployed", statusAfter: "destroyed" } }
      }
    }],
    scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: {} },
    armyRosters: {}
  };
}

test("Consecrate review renders a compact end-of-turn objective selector", () => {
  const html = renderConsecrateReviewSection(state());
  assert.match(html, /Consecrate objectives/);
  assert.match(html, /Carrier/);
  assert.match(html, /Central 1/);
  assert.match(html, /physical tabletop/i);
  assert.match(html, /No consecration this turn/);
  assert.doesNotMatch(html, /Attacker Home/);
});

test("phase progression blocks ending the turn until Consecrate is reviewed", () => {
  const s = state();
  const action = getPhaseProgressionAction(s);
  assert.equal(action.disabled, true);
  assert.match(action.label, /Review Consecrate/);
  assert.match(renderPhaseProgressionPanel(s, "end_turn"), /Complete the Consecrate end-of-turn review/);
});

test("recording a no-assignment review unlocks normal turn progression without clearing the carrier", () => {
  const s = state();
  const reviewed = recordConsecrateReview(s, { playerId: "p1", assignments: [] });
  const action = getPhaseProgressionAction(reviewed);
  assert.equal(action.disabled, undefined);
  assert.equal(action.type, COMMAND_TYPES.END_TURN);
  assert.equal(renderConsecrateReviewSection(reviewed), "");
});
