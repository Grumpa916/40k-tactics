import test from "node:test";
import assert from "node:assert/strict";
import {
  getActivePunishmentCondemnation,
  getPunishmentCondemnationCandidates,
  getPunishmentCondemnedUnitsLeftThisTurn,
  isPunishmentCondemnationRequired
} from "../../src/rules/punishment-condemnation.js";
import { recordPunishmentCondemnation } from "../../src/engine/punishment-transitions.js";
import { getPhaseProgressionAction } from "../../src/ui/phase-progression-panel.js";
import { renderDecisionReminderHost } from "../../src/ui/battle-decision-reminders-view.js";

function unit(id, ownerId, x, y, status = "deployed") {
  return {
    id, ownerId, name: id, status, position: { x, y }, wounds: 5,
    startingStrength: 1, currentStrength: 1, startingWounds: 5,
    metadata: { rosterUnitId: id, modelCount: 1 },
    profile: { characteristics: { movement: 6, objectiveControl: 2, toughness: 5, save: 3, wounds: 5 } }
  };
}

function state() {
  return {
    phase: "start_turn", turn: 3, activePlayer: "p1",
    battle: { status: "active", round: 2, activePlayerId: "p1" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Purge the Foe", opponentDisposition: "Disruption", layout: "A" } },
    objectives: [
      { id: "myHome", name: "myHome", position: { x: 8, y: 8 }, control: { controlState: "controlled", controllerId: "p1", contestingPlayerIds: [] } },
      { id: "centerA", name: "centerA", position: { x: 24, y: 22 }, control: { controlState: "controlled", controllerId: "p2", contestingPlayerIds: [] } }
    ],
    units: [
      unit("friendly", "p1", 10, 10),
      unit("enemy-killer", "p2", 38, 38),
      unit("enemy-near-objective", "p2", 27, 22),
      unit("enemy-fallback", "p2", 50, 40)
    ],
    history: [{
      type: "combat.attack_resolved",
      payload: {
        turn: 2, attackerId: "enemy-killer", targetOwnerId: "p1", targetId: "lost-friendly",
        stateDelta: { target: { unitId: "lost-friendly", statusBefore: "deployed", statusAfter: "destroyed" } }
      }
    }],
    scoring: { turnSnapshots: [], secondaryMissions: [], punishmentCondemnations: [] },
    armyRosters: {}
  };
}

test("Punishment candidates flag recorded killers and approximate objective-range hints without declaring legality", () => {
  const candidates = getPunishmentCondemnationCandidates(state(), { playerId: "p1" });
  const killer = candidates.find((item) => item.unitId === "enemy-killer");
  const near = candidates.find((item) => item.unitId === "enemy-near-objective");
  const fallback = candidates.find((item) => item.unitId === "enemy-fallback");
  assert.equal(killer.recordedPreviousTurnKiller, true);
  assert.equal(killer.likelyQualifier, true);
  assert.equal(near.mapSuggestsObjectiveRange, true);
  assert.match(near.eligibilityNote, /verify on the tabletop/i);
  assert.equal(fallback.likelyQualifier, false);
  assert.match(fallback.eligibilityNote, /fallback|tabletop/i);
});

test("Punishment start-turn gate requires a recorded selection when enemy units are deployed", () => {
  const s = state();
  assert.equal(isPunishmentCondemnationRequired(s), true);
  const action = getPhaseProgressionAction(s);
  assert.equal(action.disabled, true);
  assert.match(action.label, /Select condemned units/);
  const html = renderDecisionReminderHost(s, { perspectivePlayerId: "p1" });
  assert.match(html, /Select condemned enemy units/);
  assert.match(html, /Recorded killer last turn/);
  assert.match(html, /tabletop positions\/rules/);
});

test("Punishment selection records one to three confirmed enemy battlefield units and releases the phase gate", () => {
  const s = state();
  const next = recordPunishmentCondemnation(s, {
    playerId: "p1",
    unitIds: ["enemy-killer", "enemy-near-objective"],
    tabletopEligibilityConfirmed: true
  });
  const record = getActivePunishmentCondemnation(next, "p1");
  assert.deepEqual(record.unitIds, ["enemy-killer", "enemy-near-objective"]);
  assert.equal(isPunishmentCondemnationRequired(next), false);
  const action = getPhaseProgressionAction(next);
  assert.equal(action.disabled, undefined);
  assert.equal(action.label, "Begin Command phase");
  assert.equal(next.history.at(-1).type, "primary.punishment_condemnation_recorded");
});

test("Punishment refuses an unconfirmed or oversized selection", () => {
  const s = state();
  assert.throws(() => recordPunishmentCondemnation(s, {
    playerId: "p1", unitIds: ["enemy-killer"], tabletopEligibilityConfirmed: false
  }), /Confirm the selected units qualify/);
  assert.throws(() => recordPunishmentCondemnation(s, {
    playerId: "p1",
    unitIds: ["enemy-killer", "enemy-near-objective", "enemy-fallback", "extra"],
    tabletopEligibilityConfirmed: true
  }), /between one and three/);
});

test("Punishment condemnation remains active through the opponent turn and recognizes recorded reserve exit", () => {
  let s = recordPunishmentCondemnation(state(), {
    playerId: "p1", unitIds: ["enemy-killer"], tabletopEligibilityConfirmed: true
  });
  s = {
    ...s,
    phase: "movement",
    turn: 4,
    activePlayer: "p2",
    battle: { ...s.battle, activePlayerId: "p2" },
    history: [...s.history, { type: "unit.entered_reserves", payload: { unitId: "enemy-killer", playerId: "p2", turn: 4, round: 2, phase: "movement" } }]
  };
  assert.ok(getActivePunishmentCondemnation(s, "p1"));
  assert.deepEqual(getPunishmentCondemnedUnitsLeftThisTurn(s, "p1"), ["enemy-killer"]);
  const nextOwnTurn = { ...s, phase: "start_turn", turn: 5, activePlayer: "p1", battle: { ...s.battle, activePlayerId: "p1", round: 3 } };
  assert.equal(getActivePunishmentCondemnation(nextOwnTurn, "p1"), null);
});
