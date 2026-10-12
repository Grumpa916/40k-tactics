import test from "node:test";
import assert from "node:assert/strict";
import {
  renderEventLogPanel,
  renderUnitStatusPanel,
  renderReferencePanel,
  renderArmyRosterOverlay,
  summarizeGameEvent
} from "../../src/ui/battle-context-panels.js";

const state = {
  phase: "command",
  turn: 2,
  activePlayer: "p1",
  battle: { status: "active", round: 1, activePlayerId: "p1" },
  players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
  units: [
    { id: "a", name: "Attacker", ownerId: "p1", status: "deployed", startingStrength: 10, currentStrength: 8 },
    { id: "t", name: "Target", ownerId: "p2", status: "deployed", wounds: 3, startingWounds: 8, metadata: { modelCount: 1 }, battleShocked: true },
    { id: "unknown", name: "Untracked Squad", ownerId: "p1", status: "deployed", metadata: { modelCount: 5 } },
    { id: "dead", name: "Destroyed Unit", ownerId: "p1", status: "destroyed" }
  ],
  history: [
    { type: "combat.attack_resolved", payload: {
      attackerId: "a", targetId: "t", weaponId: "Rifle", actualDamage: 3,
      round: 1, turn: 2, stateDelta: { target: { woundsAfter: 3, statusAfter: "deployed" } }
    }},
    { type: "battle_shock.test_recorded", payload: {
      unitId: "t", result: "failed", battleShockedAfter: true, round: 1, turn: 2
    }},
    { type: "command_points.changed", payload: { playerId: "p1", amount: -1, reason: "spend", balanceAfter: 1, round: 1, turn: 2 }},
    { type: "victory_points.awarded", payload: { playerId: "p1", amount: 3, reason: "Primary objective", round: 1, turn: 2 }}
  ],
  armyRosters: {
    p1: { detachment: "Invasion Fleet" },
    p2: { detachment: "Assault Brethren" }
  }
};

test("Unit Status shows explicit Battle-shock, missing strength, and destroyed status", () => {
  const html = renderUnitStatusPanel(state);
  assert.match(html, /Unit Status/);
  assert.match(html, /Battle-shocked/);
  assert.match(html, /Strength untracked/);
  assert.match(html, /Destroyed/);
  assert.match(html, /data-battle-shock-result="passed"/);
  assert.match(html, /data-battle-shock-result="failed"/);
  assert.match(html, /data-eligibility-confirmed="true"/);
});

test("Unit Status offers result entry only during Command phase", () => {
  const html = renderUnitStatusPanel({ ...state, phase: "movement" });
  assert.doesNotMatch(html, /data-battle-shock-result=/);
});

test("Event Log summarizes combat, damage, battle-shock, CP and scoring events", () => {
  const html = renderEventLogPanel(state, { limit: 10 });
  assert.match(html, /Attacker → Target/);
  assert.match(html, /3 actual damage/);
  assert.match(html, /Battle-shock test/);
  assert.match(html, /Failed/);
  assert.match(html, /Command Points changed/);
  assert.match(html, /Victory Points awarded/);
  assert.match(html, /4 events/);
  assert.match(html, /Round 1/);
});

test("Event Log retains access to older entries beyond the recent view", () => {
  const history = Array.from({ length: 15 }, (_, index) => ({
    type: "turn.phase_changed",
    payload: { phase: "command", round: 1, turn: index + 1 }
  }));
  const html = renderEventLogPanel({ ...state, history }, { limit: 10 });
  assert.match(html, /15 events/);
  assert.match(html, /Show older events \(5\)/);
});

test("Event summary includes target wounds after combat", () => {
  const summary = summarizeGameEvent(state.history[0], state);
  assert.match(summary.detail, /3 Wounds remaining/);
  assert.match(summary.detail, /Rifle/);
});

test("Reference panel has collapsible stratagems, army rules, detachments and terrain", () => {
  const html = renderReferencePanel(state, {
    stratagems: [{ id: "s1", name: "Reactive Stratagem", description: "A sample entry.", cpCost: 1, phases: ["command"] }],
    armyRules: [{ id: "r1", name: "Army Rule", description: "A sample rule." }],
    detachments: [
      { id: "d1", name: "Invasion Fleet", playerId: "p1", description: "Your detachment." },
      { id: "d2", name: "Assault Brethren", playerId: "p2", description: "Opponent detachment." }
    ]
  }, "p1");
  assert.match(html, /<summary>Stratagems<\/summary>/);
  assert.match(html, /<summary>Army Rules<\/summary>/);
  assert.match(html, /<summary>Detachments<\/summary>/);
  assert.match(html, /<summary>Terrain Layout<\/summary>/);
  assert.match(html, /Your stratagems/);
  assert.match(html, /Opponent stratagems/);
  assert.match(html, /Reactive Stratagem/);
  assert.match(html, /Your Army Rules/);
  assert.match(html, /Opponent Army Rules/);
  assert.match(html, /Invasion Fleet/);
  assert.match(html, /Assault Brethren/);
});

test("Reference panel states honestly when rules and terrain catalogs are absent", () => {
  const html = renderReferencePanel({ ...state, armyRosters: {} }, {}, "p1");
  assert.match(html, /No stratagem catalog is connected/);
  assert.match(html, /No opponent detachment has been recorded/);
  assert.match(html, /No terrain layout is recorded/);
});

test("Army roster overlay includes status and avoids inferring untracked model counts", () => {
  const html = renderArmyRosterOverlay(state, "p1");
  assert.match(html, /You Army/);
  assert.match(html, /Destroyed Unit/);
  assert.match(html, /Model count not fully tracked/);
});
