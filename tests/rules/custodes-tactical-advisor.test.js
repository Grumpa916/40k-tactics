import test from "node:test";
import assert from "node:assert/strict";
import {
  getCustodesChargeAdvisorContext,
  getCustodesFightAdvisorContext,
  getCustodesKatahState,
  getCustodesMovementContext,
  getCustodesPhaseRecommendations,
  getCustodesShootingRangeContext
} from "../../src/rules/custodes-tactical-advisor.js";
import { getCustodesMovementRecommendations } from "../../src/rules/custodes-movement-advisor.js";
import { recordCustodesKatahUse } from "../../src/engine/custodes-katah-transitions.js";
import { getFightCandidates } from "../../src/rules/fight-candidates.js";
import { getChargeOpportunity, getChargeSuccessProbability } from "../../src/rules/tactical-charge-opportunity.js";
import { getShootingTargetPriorities } from "../../src/rules/tactical-shooting-targets.js";
import { getTacticalCombatRecommendations } from "../../src/rules/tactical-combat-recommendations.js";

function custodesDatasheet({ name = "Custodian Guard Sodality", move = "8\"", keywords = ["Infantry", "Adeptus Custodes"] } = {}) {
  return {
    name,
    characteristics: {
      Move: move,
      Toughness: "7",
      Save: "2+",
      Wounds: "5",
      Leadership: "5+",
      "Objective Control": "2",
      "Invulnerable save": "4+"
    },
    keywords,
    abilities: [
      { name: "Martial Ka'tah", description: "This unit becomes readied in its Command phase." },
      { name: "Aegis of the Emperor", description: "Feel No Pain against mortal wounds." }
    ],
    weapons: []
  };
}

function enemyDatasheet({ keywords = ["Infantry"], toughness = "7", wounds = "12" } = {}) {
  return {
    name: "Enemy",
    characteristics: {
      Move: "6\"",
      Toughness: toughness,
      Save: "3+",
      Wounds: wounds,
      Leadership: "6+",
      "Objective Control": "2"
    },
    keywords,
    abilities: [],
    weapons: []
  };
}

function unit(id, ownerId, rosterUnitId, position = { x: 0, y: 0 }, overrides = {}) {
  return {
    id,
    name: id,
    ownerId,
    status: "deployed",
    position,
    wounds: overrides.wounds ?? 10,
    maxWounds: overrides.maxWounds ?? overrides.wounds ?? 10,
    characteristics: {
      toughness: overrides.toughness ?? 7,
      save: overrides.save ?? 2,
      objectiveControl: overrides.objectiveControl ?? 2,
      weaponSkill: overrides.weaponSkill ?? 2,
      ballisticSkill: overrides.ballisticSkill ?? 2,
      ...(overrides.characteristics ?? {})
    },
    metadata: { rosterUnitId },
    ...(overrides.extra ?? {})
  };
}

function state({ phase = "fight", detachments = [], round = 1, activePlayerId = "p1", firstPlayerId = "p1", enemyPosition = { x: 9, y: 0 }, enemyKeywords = ["Vehicle"], history = [] } = {}) {
  const custodesSheet = custodesDatasheet();
  const enemySheet = enemyDatasheet({ keywords: enemyKeywords, toughness: "12", wounds: "16" });
  return {
    phase,
    turn: round * 2 - (activePlayerId === firstPlayerId ? 1 : 0),
    activePlayer: activePlayerId,
    battle: { id: "battle", status: "active", round, activePlayerId, firstPlayerId },
    players: [{ id: "p1", name: "Custodes" }, { id: "p2", name: "Opponent" }],
    victoryPoints: { p1: 0, p2: 0 },
    commandPoints: { p1: 3, p2: 3 },
    units: [
      unit("custodes", "p1", "r-custodes", { x: 0, y: 0 }, { wounds: 5 }),
      unit("enemy", "p2", "r-enemy", enemyPosition, { wounds: 16, toughness: 12, save: 3 })
    ],
    armyRosters: {
      p1: {
        faction: "Adeptus Custodes",
        detachment: detachments[0] ?? null,
        detachments,
        units: [{ id: "r-custodes", datasheet: custodesSheet, equippedWeapons: [] }]
      },
      p2: {
        faction: "Test",
        units: [{ id: "r-enemy", datasheet: enemySheet, equippedWeapons: [] }]
      }
    },
    objectives: [],
    scoring: { secondaryMissions: [] },
    history
  };
}

const spear = Object.freeze({
  id: "guardian-spear",
  name: "Guardian Spear",
  type: "melee",
  characteristics: { attacks: 8, skill: 2, strength: 8, ap: -2, damage: 2 }
});

const guardianBolt = Object.freeze({
  id: "guardian-bolt",
  name: "Guardian Spear (ranged)",
  type: "ranged",
  characteristics: { range: 24, attacks: 2, skill: 2, strength: 5, ap: -1, damage: 2 }
});

test("Martial Ka'tah readiness is per-unit, is manually expended, and resets with the next readiness cycle", () => {
  let current = state({ phase: "fight", round: 1, activePlayerId: "p1", firstPlayerId: "p1" });
  assert.equal(getCustodesKatahState(current, { playerId: "p1", unitId: "custodes" }).readied, true);

  current = recordCustodesKatahUse(current, { playerId: "p1", unitId: "custodes", katahName: "Rendax" });
  const spent = getCustodesKatahState(current, { playerId: "p1", unitId: "custodes" });
  assert.equal(spent.readied, false);
  assert.equal(spent.lastKatah, "Rendax");
  assert.throws(() => recordCustodesKatahUse(current, { playerId: "p1", unitId: "custodes", katahName: "Kaptaris" }), /already expended/i);

  current = {
    ...current,
    phase: "command",
    activePlayer: "p1",
    battle: { ...current.battle, round: 2, activePlayerId: "p1" }
  };
  assert.equal(getCustodesKatahState(current, { playerId: "p1", unitId: "custodes" }).readied, true);
});

test("a second-player Custodes army does not start a new round readied before its own Command phase", () => {
  const beforeOwnTurn = state({ phase: "movement", round: 1, activePlayerId: "p1", firstPlayerId: "p1" });
  beforeOwnTurn.armyRosters.p2 = beforeOwnTurn.armyRosters.p1;
  beforeOwnTurn.armyRosters.p1 = { faction: "Test", units: [] };
  beforeOwnTurn.units[0] = { ...beforeOwnTurn.units[0], ownerId: "p2" };
  assert.equal(getCustodesKatahState(beforeOwnTurn, { playerId: "p2", unitId: "custodes" }).readied, false);

  const ownTurn = {
    ...beforeOwnTurn,
    phase: "command",
    activePlayer: "p2",
    battle: { ...beforeOwnTurn.battle, activePlayerId: "p2" }
  };
  assert.equal(getCustodesKatahState(ownTurn, { playerId: "p2", unitId: "custodes" }).readied, true);
});

test("phase-specific Ka'tah advice surfaces Conservai for an engaged readied unit", () => {
  const current = state({
    phase: "command",
    history: [{ type: "charge.outcome_recorded", payload: { outcome: "successful", unitId: "enemy", targetIds: ["custodes"], turn: 1 } }]
  });
  const recommendations = getCustodesPhaseRecommendations(current, { playerId: "p1" });
  assert.ok(recommendations.some((item) => item.katahName === "Conservai"));
  assert.ok(getTacticalCombatRecommendations(current, { playerId: "p1" }).custodes.some((item) => item.katahName === "Conservai"));
});

test("Rendax compares expected melee damage against a Monster or Vehicle and disappears after readiness is spent", () => {
  let current = state({ phase: "fight", enemyKeywords: ["Vehicle"] });
  const context = getCustodesFightAdvisorContext(current, {
    playerId: "p1",
    unitId: "custodes",
    targetUnitId: "enemy",
    weapon: spear
  });
  const rendax = context.options.find((item) => item.id === "rendax");
  assert.ok(rendax);
  assert.ok(rendax.expectedDamage > context.baselineExpectedDamage);
  assert.match(context.recommendation, /Rendax|projected melee damage/i);

  current = recordCustodesKatahUse(current, { playerId: "p1", unitId: "custodes", katahName: "Rendax" });
  const after = getCustodesFightAdvisorContext(current, {
    playerId: "p1",
    unitId: "custodes",
    targetUnitId: "enemy",
    weapon: spear
  });
  assert.equal(after.options.some((item) => item.id === "rendax"), false);
});

test("Guardians of the Throne compares Sustained Hits 1 and Lethal Hits and identifies the better modeled option", () => {
  const current = state({ phase: "fight", detachments: ["Guardians of the Throne"], enemyKeywords: ["Infantry"] });
  const context = getCustodesFightAdvisorContext(current, {
    playerId: "p1",
    unitId: "custodes",
    targetUnitId: "enemy",
    weapon: spear
  });
  const sustained = context.options.find((item) => item.id === "guardians-sustained");
  const lethal = context.options.find((item) => item.id === "guardians-lethal");
  assert.ok(sustained);
  assert.ok(lethal);
  assert.equal(context.bestOption.expectedDamage, Math.max(...context.options.map((item) => item.expectedDamage)));
  assert.match(context.recommendation, /Martial Mastery|Guardians of the Throne/i);
});

test("Dread Host re-rolls raise a measured 9-inch charge from 27.8% to about 47.8%", () => {
  const current = state({ phase: "charge", detachments: ["Dread Host"], enemyPosition: { x: 9, y: 0 } });
  const base = getChargeSuccessProbability(9);
  const context = getCustodesChargeAdvisorContext(current, { playerId: "p1", unitId: "custodes", baseProbability: base });
  assert.ok(Math.abs(base - 10 / 36) < 1e-12);
  assert.ok(Math.abs(context.adjustedProbability - (1 - (26 / 36) ** 2)) < 1e-12);

  const opportunity = getChargeOpportunity(current, {
    playerId: "p1",
    attackerId: "custodes",
    targetUnitId: "enemy",
    measuredDistance: 9,
    mapDistance: 9
  });
  assert.equal(opportunity.custodesCharge.rerollCharge, true);
  assert.ok(Math.abs(opportunity.successProbability - context.adjustedProbability) < 1e-12);
});

test("Emissaries Imperatus places an eligible Custodes unit in Fights First without requiring a charge", () => {
  const current = state({ phase: "fight", detachments: ["Emissaries Imperatus"], enemyKeywords: ["Infantry"] });
  const candidates = getFightCandidates(current);
  assert.ok(candidates.fightsFirst.includes("custodes"));
  assert.equal(candidates.normal.includes("custodes"), false);
});

test("Solar Watch Calistus exposes +2 Move and marks a newly reachable approximate movement target", () => {
  const current = state({ phase: "movement", detachments: ["Solar Watch"], enemyPosition: { x: 12, y: 0 }, enemyKeywords: ["Infantry"] });
  const context = getCustodesMovementContext(current, { playerId: "p1", unitId: "custodes", baseMovement: 8 });
  assert.equal(context.available, true);
  assert.equal(context.effectiveMovement, 10);

  const recommendations = getCustodesMovementRecommendations(current, { playerId: "p1" });
  const calistus = recommendations.find((item) => item.unitId === "custodes" && item.katahName === "Calistus");
  assert.ok(calistus);
  assert.equal(calistus.baseMovement, 8);
  assert.equal(calistus.effectiveMovement, 10);
  assert.equal(calistus.newlyReachableTargetUnitId, "enemy");
});

test("Aquilan Shield Salvus extends a 24-inch weapon to a 30-inch advisory range and adds the target to Shooting advice", () => {
  const current = state({ phase: "shooting", detachments: ["Aquilan Shield"], enemyPosition: { x: 30, y: 0 }, enemyKeywords: ["Infantry"] });
  const context = getCustodesShootingRangeContext(current, { playerId: "p1", unitId: "custodes", baseRange: 24 });
  assert.equal(context.available, true);
  assert.equal(context.extendedRange, 30);

  const result = getShootingTargetPriorities(current, {
    playerId: "p1",
    attackerId: "custodes",
    weapon: guardianBolt
  });
  const target = result.priorities.find((item) => item.targetUnitId === "enemy");
  assert.ok(target);
  assert.equal(target.baseRange, 24);
  assert.equal(target.effectiveRange, 30);
  assert.equal(target.rangeStatus, "within");
  assert.match(target.reason, /Salvus/i);
});
