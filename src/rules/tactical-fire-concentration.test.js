import test from "node:test";
import assert from "node:assert/strict";
import { getFireConcentrationAdvisory } from "./tactical-fire-concentration.js";

function baseState() {
  return {
    phase: "shooting",
    battle: { status: "active", round: 1, activePlayerId: "p1" },
    turn: 1,
    activePlayer: "p1",
    units: [
      {
        id: "shooter-a",
        ownerId: "p1",
        status: "deployed",
        wounds: 10,
        position: { x: 0, y: 0 },
        characteristics: { ballisticSkill: 3 },
        profile: { weaponIds: ["rifle-a"] }
      },
      {
        id: "shooter-b",
        ownerId: "p1",
        status: "deployed",
        wounds: 10,
        position: { x: 4, y: 0 },
        characteristics: { ballisticSkill: 3 },
        profile: { weaponIds: ["rifle-b"] }
      },
      {
        id: "already-shot",
        ownerId: "p1",
        status: "deployed",
        wounds: 10,
        position: { x: 4, y: 4 },
        characteristics: { ballisticSkill: 3 },
        profile: { weaponIds: ["rifle-a"] }
      },
      {
        id: "target",
        ownerId: "p2",
        status: "deployed",
        wounds: 8,
        position: { x: 8, y: 0 },
        characteristics: { toughness: 4, save: 4 }
      }
    ],
    data: {
      weapons: [
        {
          id: "rifle-a",
          name: "Rifle A",
          type: "ranged",
          characteristics: { range: 24, attacks: 4, strength: 5, ap: -1, damage: 2 }
        },
        {
          id: "rifle-b",
          name: "Rifle B",
          type: "ranged",
          characteristics: { range: 24, attacks: 4, strength: 5, ap: -1, damage: 2 }
        }
      ]
    },
    history: [
      {
        type: "shooting.unit_activated",
        payload: {
          unitId: "already-shot",
          playerId: "p1",
          round: 1,
          turn: 1
        }
      }
    ]
  };
}

test("combines expected firepower from currently available friendly units", () => {
  const result = getFireConcentrationAdvisory(baseState(), {
    playerId: "p1",
    targetUnitId: "target"
  });

  assert.equal(result.availableFirepower, 2);
  assert.ok(result.expectedCombinedDamage > 0);
  assert.equal(result.contributors.length, 2);
});

test("classifies enough combined firepower as a concentration opportunity", () => {
  const state = baseState();
  state.units.find((unit) => unit.id === "target").wounds = 3;

  const result = getFireConcentrationAdvisory(state, {
    playerId: "p1",
    targetUnitId: "target"
  });

  assert.equal(result.category, "overkill-opportunity");
});

test("does not include clearly out-of-range weapons", () => {
  const state = baseState();
  state.units.find((unit) => unit.id === "shooter-b").position = { x: 40, y: 0 };

  const result = getFireConcentrationAdvisory(state, {
    playerId: "p1",
    targetUnitId: "target"
  });

  assert.equal(result.contributors.some((item) => item.unitId === "shooter-b"), false);
});

test("does not invent damage for incomplete weapon profiles", () => {
  const state = baseState();
  state.data.weapons[0].characteristics = { range: 24 };

  const result = getFireConcentrationAdvisory(state, {
    playerId: "p1",
    targetUnitId: "target"
  });

  assert.equal(result.contributors.some((item) => item.weaponId === "rifle-a"), false);
});
