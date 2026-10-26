import test from "node:test";
import assert from "node:assert/strict";
import {
  getCustodesFightAdvisorContext,
  getCustodesMoritoiContext,
  getCustodesObjectiveControlBonus,
  getHonouredCompanionsContext
} from "../../src/rules/custodes-tactical-advisor.js";
import { getFormationObjectiveContribution } from "../../src/rules/tactical-objective-swing.js";
import { getFightOpportunityRecommendations } from "../../src/rules/tactical-fight-opportunities.js";

const katahAbilities = [
  { name: "Martial Ka'tah", description: "Readied in Command phase." },
  { name: "Aegis of the Emperor", description: "Faction defensive rule." }
];

function datasheet({
  name = "Custodian Guard Sodality",
  keywords = ["Infantry", "Trusted Sentinel", "Adeptus Custodes"],
  toughness = "7",
  wounds = "5",
  oc = "3",
  weapons = []
} = {}) {
  return {
    name,
    characteristics: {
      Move: "8\"",
      Toughness: toughness,
      Save: "2+",
      Wounds: wounds,
      Leadership: "5+",
      "Objective Control": oc,
      "Invulnerable save": "4+"
    },
    keywords,
    abilities: katahAbilities,
    weapons
  };
}

function enemyDatasheet({
  keywords = ["Infantry"],
  toughness = "8",
  wounds = "12",
  save = "3+",
  weapons = []
} = {}) {
  return {
    name: "Enemy Infantry",
    characteristics: {
      Move: "6\"",
      Toughness: toughness,
      Save: save,
      Wounds: wounds,
      Leadership: "6+",
      "Objective Control": "2"
    },
    keywords,
    abilities: [],
    weapons
  };
}

function battleUnit(id, ownerId, rosterUnitId, position, overrides = {}) {
  return {
    id,
    name: overrides.name ?? id,
    ownerId,
    status: "deployed",
    position,
    wounds: overrides.wounds ?? 5,
    maxWounds: overrides.maxWounds ?? overrides.wounds ?? 5,
    startingWounds: overrides.startingWounds ?? overrides.maxWounds ?? overrides.wounds ?? 5,
    startingStrength: overrides.startingStrength ?? 1,
    currentStrength: overrides.currentStrength ?? 1,
    characteristics: {
      toughness: overrides.toughness ?? 7,
      save: overrides.save ?? 2,
      objectiveControl: overrides.objectiveControl ?? 3,
      weaponSkill: overrides.weaponSkill ?? 2,
      ballisticSkill: overrides.ballisticSkill ?? 2,
      ...(overrides.characteristics ?? {})
    },
    metadata: {
      rosterUnitId,
      modelCount: overrides.modelCount ?? 1,
      currentModelCount: overrides.currentModelCount ?? overrides.modelCount ?? 1
    },
    weapons: overrides.weapons ?? [],
    meleeWeapons: overrides.meleeWeapons ?? []
  };
}

const spear = Object.freeze({
  id: "guardian-spear",
  name: "Guardian Spear",
  type: "melee",
  characteristics: { attacks: 6, skill: 2, strength: 8, ap: -2, damage: 2 }
});

const enemyBlade = Object.freeze({
  id: "enemy-blade",
  name: "Enemy Blade",
  type: "melee",
  characteristics: { attacks: 8, skill: 3, strength: 8, ap: -2, damage: 2 }
});

function makeState({
  detachments = [],
  custodesSheet = datasheet({ weapons: [spear] }),
  enemySheet = enemyDatasheet({ weapons: [enemyBlade] }),
  custodesOverrides = {},
  enemyOverrides = {},
  custodesPosition = { x: 0, y: 0 },
  enemyPosition = { x: 1, y: 0 },
  objectives = [],
  phase = "fight"
} = {}) {
  const friendly = battleUnit("custodes", "p1", "r-custodes", custodesPosition, custodesOverrides);
  const enemy = battleUnit("enemy", "p2", "r-enemy", enemyPosition, {
    wounds: 12,
    maxWounds: 12,
    startingWounds: 12,
    toughness: 8,
    save: 3,
    weaponSkill: 3,
    objectiveControl: 2,
    weapons: [enemyBlade],
    ...enemyOverrides
  });
  return {
    phase,
    turn: 1,
    activePlayer: "p1",
    battle: { id: "battle", status: "active", round: 1, activePlayerId: "p1", firstPlayerId: "p1" },
    players: [{ id: "p1", name: "Custodes" }, { id: "p2", name: "Opponent" }],
    victoryPoints: { p1: 0, p2: 0 },
    commandPoints: { p1: 3, p2: 3 },
    units: [friendly, enemy],
    objectives,
    armyRosters: {
      p1: {
        faction: "Adeptus Custodes",
        detachment: detachments[0] ?? null,
        detachments,
        units: [{ id: "r-custodes", datasheet: custodesSheet, equippedWeapons: [{ name: spear.name, quantity: 1 }] }]
      },
      p2: {
        faction: "Test",
        units: [{ id: "r-enemy", datasheet: enemySheet, equippedWeapons: [{ name: enemyBlade.name, quantity: 1 }] }]
      }
    },
    scoring: { secondaryMissions: [] },
    history: [{
      type: "charge.outcome_recorded",
      payload: { outcome: "successful", unitId: "enemy", targetIds: ["custodes"], turn: 1, round: 1 }
    }]
  };
}

test("Dacatarai numerically improves melee damage against a non-Monster/Vehicle target", () => {
  const state = makeState();
  const context = getCustodesFightAdvisorContext(state, {
    playerId: "p1",
    unitId: "custodes",
    targetUnitId: "enemy",
    weapon: spear
  });
  const dacatarai = context.options.find((option) => option.id === "dacatarai");
  assert.equal(context.dacataraiEligible, true);
  assert.ok(dacatarai);
  assert.ok(dacatarai.expectedDamage > context.baselineExpectedDamage);
  assert.equal(dacatarai.requiresKatahUse, true);
});

test("Kaptaris compares enemy return damage with and without the defensive -1 to Hit", () => {
  const state = makeState();
  const recommendations = getFightOpportunityRecommendations(state, {
    playerId: "p1",
    options: [{ unitId: "custodes", targetUnitId: "enemy", weapon: spear }]
  });
  assert.equal(recommendations.length, 1);
  const advice = recommendations[0];
  assert.equal(advice.custodesDefence.kaptarisAvailable, true);
  assert.ok(Number.isFinite(advice.custodesDefence.baselineRetaliationExpectedDamage));
  assert.ok(Number.isFinite(advice.custodesDefence.kaptarisExpectedDamage));
  assert.ok(advice.custodesDefence.kaptarisExpectedDamage < advice.custodesDefence.baselineRetaliationExpectedDamage);
  assert.ok(advice.custodesDefence.damagePrevented > 0);
  assert.match(advice.recommendation, /Kaptaris/i);
});

test("Might of the Moritoi gives a starting-strength Dreadnought +2 OC in objective math", () => {
  const telemon = datasheet({
    name: "Telemon Heavy Dreadnought",
    keywords: ["Vehicle", "Walker", "Dreadnought", "Adeptus Custodes"],
    toughness: "11",
    wounds: "14",
    oc: "4",
    weapons: [spear]
  });
  const state = makeState({
    detachments: ["Might of the Moritoi"],
    custodesSheet: telemon,
    custodesOverrides: {
      name: "Telemon Heavy Dreadnought",
      wounds: 14,
      maxWounds: 14,
      startingWounds: 14,
      toughness: 11,
      objectiveControl: 4
    }
  });
  const context = getCustodesMoritoiContext(state, { playerId: "p1", unitId: "custodes" });
  assert.equal(context.active, true);
  assert.equal(context.belowStartingStrength, false);
  assert.equal(context.objectiveControlBonus, 2);
  assert.equal(getCustodesObjectiveControlBonus(state, "custodes"), 2);

  const contribution = getFormationObjectiveContribution(state, "custodes");
  assert.equal(contribution.totalOc, 6);
  assert.equal(contribution.members[0].basePerModel, 4);
  assert.equal(contribution.members[0].ruleBonus, 2);
});

test("Might of the Moritoi changes from hit reroll 1s when damaged to hit+wound reroll 1s below half", () => {
  const telemon = datasheet({
    name: "Telemon Heavy Dreadnought",
    keywords: ["Vehicle", "Walker", "Dreadnought", "Adeptus Custodes"],
    toughness: "11",
    wounds: "14",
    oc: "4",
    weapons: [spear]
  });
  const damaged = makeState({
    detachments: ["Might of the Moritoi"],
    custodesSheet: telemon,
    custodesOverrides: {
      name: "Telemon Heavy Dreadnought",
      wounds: 10,
      maxWounds: 14,
      startingWounds: 14,
      toughness: 11,
      objectiveControl: 4
    }
  });
  const damagedContext = getCustodesMoritoiContext(damaged, { playerId: "p1", unitId: "custodes" });
  assert.equal(damagedContext.objectiveControlBonus, 0);
  assert.equal(damagedContext.hitReroll, "ones");
  assert.equal(damagedContext.woundReroll, "none");

  const belowHalf = {
    ...damaged,
    units: damaged.units.map((unit) => unit.id === "custodes" ? { ...unit, wounds: 7 } : unit)
  };
  const halfContext = getCustodesMoritoiContext(belowHalf, { playerId: "p1", unitId: "custodes" });
  assert.equal(halfContext.hitReroll, "ones");
  assert.equal(halfContext.woundReroll, "ones");

  const fight = getCustodesFightAdvisorContext(belowHalf, {
    playerId: "p1",
    unitId: "custodes",
    targetUnitId: "enemy",
    weapon: spear
  });
  assert.equal(fight.moritoi.hitReroll, "ones");
  assert.equal(fight.moritoi.woundReroll, "ones");
  assert.ok(fight.baselineExpectedDamage > 0);
});

test("Honoured Companions calculates a conditional wound-reroll improvement but requires tabletop objective-range confirmation", () => {
  const state = makeState({
    detachments: ["Honoured Companions"],
    custodesPosition: { x: 2, y: 0 },
    objectives: [{ id: "center", position: { x: 0, y: 0 }, control: { controlState: "contested", controllerId: null, contestingPlayerIds: ["p1", "p2"] } }]
  });
  const context = getHonouredCompanionsContext(state, { playerId: "p1", unitId: "custodes" });
  assert.equal(context.available, true);
  assert.equal(context.approximateObjectiveId, "center");
  assert.equal(context.requiresTableConfirmation, true);
  assert.match(context.reason, /Honoured Companions|objective/i);

  const fight = getCustodesFightAdvisorContext(state, {
    playerId: "p1",
    unitId: "custodes",
    targetUnitId: "enemy",
    weapon: spear
  });
  const honoured = fight.options.find((option) => option.id === "honoured-companions");
  assert.ok(honoured);
  assert.equal(honoured.requiresTableConfirmation, true);
  assert.ok(honoured.expectedDamage > fight.baselineExpectedDamage);
});
