import test from "node:test";
import assert from "node:assert/strict";
import { renderConsecrateReviewSection } from "../../src/ui/consecrate-review.js";
import { getPhaseProgressionAction, renderPhaseProgressionPanel } from "../../src/ui/phase-progression-panel.js";
import { recordConsecrateReview } from "../../src/engine/consecrate-transitions.js";
import { COMMAND_TYPES } from "../../src/commands/game-commands.js";
import { renderEndTurnContent, createEndTurnScreen } from "../../src/ui/end-turn-screen.js";
import { SCREEN_FACTORIES } from "../../src/ui/battle-screen-registry.js";

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

test("phase progression allows ending the turn even when Consecrate review is pending", () => {
  const s = state();
  const action = getPhaseProgressionAction(s);
  assert.equal(action.disabled, undefined);
  assert.equal(action.type, COMMAND_TYPES.END_TURN);
  assert.match(action.label, /Finish turn/);
  assert.match(renderPhaseProgressionPanel(s, "end_turn"), /data-advance-game-phase/);
  assert.doesNotMatch(renderPhaseProgressionPanel(s, "end_turn"), /disabled|Complete the Consecrate end-of-turn review/);
});

test("recording a no-assignment review unlocks normal turn progression without clearing the carrier", () => {
  const s = state();
  const reviewed = recordConsecrateReview(s, { playerId: "p1", assignments: [] });
  const action = getPhaseProgressionAction(reviewed);
  assert.equal(action.disabled, undefined);
  assert.equal(action.type, COMMAND_TYPES.END_TURN);
  assert.equal(renderConsecrateReviewSection(reviewed), "");
});

test("end_turn has a real screen with optional Consecrate recording and an accessible Continue", () => {
  const s = state();
  assert.equal(SCREEN_FACTORIES.end_turn, createEndTurnScreen);
  const html = renderEndTurnContent(s, { perspectivePlayerId: "p1" });
  assert.match(html, /data-end-turn-screen/);
  assert.match(html, /End of turn/);
  assert.match(html, /data-consecrate-review-form/);
  assert.match(html, /No consecration this turn/);
  assert.match(html, /Review mission scoring/);
  assert.match(html, /finish without recording a Consecrate selection/i);
  assert.doesNotMatch(html, /reserved in the shared battle flow|will be added later/);
});

test("end-turn screen refreshes after an optional Consecrate review and unsubscribes on teardown", () => {
  let current=state();
  const listeners = new Set();
  const session={
    getState:()=>current,
    subscribe(listener) { listeners.add(listener); return ()=>listeners.delete(listener); },
    dispatch() { throw new Error("Unexpected dispatch in static DOM test"); }
  };
  const container={innerHTML:"",querySelector:()=>null};
  const view=createEndTurnScreen(container,{session,perspectivePlayerId:"p1"});
  assert.match(container.innerHTML,/data-consecrate-review-form/);
  assert.equal(listeners.size,1);
  current=recordConsecrateReview(current,{playerId:"p1",assignments:[]});
  for(const listener of listeners)listener();
  assert.match(container.innerHTML,/Consecrate review recorded/);
  assert.doesNotMatch(container.innerHTML,/data-consecrate-review-form/);
  assert.equal(getPhaseProgressionAction(current).type,COMMAND_TYPES.END_TURN);
  view.destroy();
  assert.equal(listeners.size,0);
});

test("end-turn screen never blocks other missions or reintroduces an Action gate", () => {
  const s=state();
  s.battlefieldMap.missionSetup={myDisposition:"Take and Hold",opponentDisposition:"Take and Hold",layout:"A"};
  assert.equal(getPhaseProgressionAction(s).type,COMMAND_TYPES.END_TURN);
  const html=renderEndTurnContent(s);
  assert.match(html,/data-end-turn-screen/);
  assert.doesNotMatch(html,/data-consecrate-review-form/);
  assert.match(html,/Scoring remains manual|Scoring remains manual/i);
});
