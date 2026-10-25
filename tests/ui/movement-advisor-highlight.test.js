import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderMovementAdvisor } from "../../src/ui/movement-advisor.js";

function unit(id, ownerId, x, y, { oc = 2, move = 6, rosterUnitId = id } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status: "deployed",
    position: { x, y },
    startingStrength: 1,
    currentStrength: 1,
    startingWounds: 5,
    wounds: 5,
    metadata: { rosterUnitId, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function rosterUnit(id, { move = 6, oc = 2, weapons = [] } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons
    }
  };
}

function state() {
  return {
    phase: "movement",
    turn: 1,
    activePlayer: "p1",
    battle: { status: "active", round: 3, activePlayerId: "p1" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    victoryPoints: { p1: 12, p2: 15 },
    commandPoints: { p1: 2, p2: 2 },
    history: [],
    objectives: [
      { id: "centre", position: { x: 24, y: 22 }, control: { controlState: "controlled", controllerId: "p2", contestingPlayerIds: [] } },
      { id: "home", position: { x: 8, y: 8 }, control: { controlState: "controlled", controllerId: "p1", contestingPlayerIds: [] } }
    ],
    units: [
      unit("scorer", "p1", 18, 22, { oc: 4, move: 6, rosterUnitId: "r-scorer" }),
      unit("enemy", "p2", 31, 22, { oc: 2, move: 6, rosterUnitId: "r-enemy" })
    ],
    scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" } },
    armyRosters: {
      p1: { units: [rosterUnit("r-scorer", { move: 6, oc: 4, weapons: [{ name: "Rifle", range: 12, attacks: 2, skill: "3+", strength: 4, ap: 0, damage: 1 }] })] },
      p2: { units: [rosterUnit("r-enemy", { move: 6, oc: 2 })] }
    }
  };
}

test("Movement destination options expose objective/enemy highlight hooks without moving the unit", () => {
  const html = renderMovementAdvisor(state(), { playerId: "p1", selectedUnitId: "scorer" });
  assert.match(html, /data-movement-advisor-unit-id="scorer"/);
  assert.match(html, /data-movement-highlight-kind="objective"/);
  assert.match(html, /data-movement-highlight-id="centre"/);
  assert.match(html, /Highlight only — the unit is not moved and no movement choice is recorded/);
  assert.doesNotMatch(html, /onclick=/);
});

test("Movement destination highlighting is UI-only and has no game-command dispatch path", () => {
  const source = readFileSync(new URL("../../src/ui/movement-advisor.js", import.meta.url), "utf8");
  assert.match(source, /is-advisor-highlight/);
  assert.match(source, /data-map-objective-id/);
  assert.match(source, /data-map-unit-id/);
  assert.match(source, /document\.addEventListener\("click"/);
  assert.doesNotMatch(source, /session\.dispatch|COMMAND_TYPES|RESOLVE_NORMAL_MOVE|ADJUST_LIVE_MAP_POSITION/);
});
