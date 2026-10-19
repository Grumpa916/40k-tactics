import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { SECONDARY_MISSION_CATALOG } from "../../src/data/secondary-mission-catalog.js";
import {
  getTargetPrimaryMissionImpact,
  getTargetSecondaryMissionImpact,
  getTargetThreatImpact
} from "../../src/rules/tactical-target-context.js";
import { getShootingTargetComparison } from "../../src/rules/tactical-shooting-comparison.js";

function profile({ keywords = [], toughness = 5, save = 3, wounds = 10 } = {}) {
  return {
    keywords,
    characteristics: {
      ballisticSkill: 3,
      weaponSkill: 3,
      toughness,
      save,
      wounds
    }
  };
}

function baseState() {
  return createGameState({
    phase: "shooting",
    turn: 2,
    activePlayer: "p1",
    battle: { id: "battle", round: 3, activePlayerId: "p1" },
    players: [
      { id: "p1", name: "You" },
      { id: "p2", name: "Opponent" }
    ],
    victoryPoints: { p1: 18, p2: 24 },
    units: [
      {
        id: "shooter",
        ownerId: "p1",
        name: "Shooter",
        status: "deployed",
        position: { x: 6, y: 6 },
        wounds: 10,
        profile: profile({ toughness: 6, wounds: 10 })
      },
      {
        id: "friendly",
        ownerId: "p1",
        name: "Friendly",
        status: "deployed",
        position: { x: 8, y: 6 },
        wounds: 10,
        profile: profile()
      },
      {
        id: "objective-target",
        ownerId: "p2",
        name: "Objective Target",
        status: "deployed",
        position: { x: 18, y: 6 },
        wounds: 10,
        profile: profile()
      },
      {
        id: "plain-target",
        ownerId: "p2",
        name: "Plain Target",
        status: "deployed",
        position: { x: 6, y: 18 },
        wounds: 10,
        profile: profile()
      },
      {
        id: "character-target",
        ownerId: "p2",
        name: "Enemy Character",
        status: "deployed",
        position: { x: 18, y: 18 },
        wounds: 10,
        profile: profile({ keywords: ["Character"] })
      },
      {
        id: "centre-target",
        ownerId: "p2",
        name: "Centre Target",
        status: "deployed",
        position: { x: 30, y: 22 },
        wounds: 10,
        profile: profile()
      }
    ],
    objectives: [
      {
        id: "central-objective",
        position: { x: 18, y: 6 },
        control: {
          controlState: "controlled",
          controllerId: "p2",
          contestingPlayerIds: []
        }
      }
    ],
    history: [],
    scoring: { turnSnapshots: [], secondaryMissionMode: null, secondaryMissions: [] }
  });
}

function activeSecondary(playerId, definition, index = 1) {
  return {
    instanceId: `${playerId}:${definition.id}:3:2:${index}`,
    definitionId: definition.id,
    definition,
    playerId,
    status: "active",
    drawnRound: 3,
    drawnTurn: 2,
    scoringHistory: []
  };
}

const assassination = SECONDARY_MISSION_CATALOG.find((card) => card.id === "secondary-assassination");
const centreGround = SECONDARY_MISSION_CATALOG.find((card) => card.id === "secondary-centre-ground");
const noPrisoners = SECONDARY_MISSION_CATALOG.find((card) => card.id === "secondary-no-prisoners");

const weapon = {
  id: "test-gun",
  name: "Test Gun",
  type: "ranged",
  characteristics: {
    range: 24,
    attacks: 4,
    strength: 6,
    ap: -2,
    damage: 2
  }
};

test("primary impact recognizes an enemy-controlled objective without awarding score", () => {
  const state = baseState();
  const before = JSON.stringify(state);
  const impact = getTargetPrimaryMissionImpact(state, {
    playerId: "p1",
    targetUnitId: "objective-target"
  });
  assert.equal(impact.objectiveId, "central-objective");
  assert.ok(impact.score > 0.4);
  assert.ok(impact.denyScoringValue > 0);
  assert.match(impact.reason, /actual OC determine the score/);
  assert.equal(JSON.stringify(state), before);
});

test("verified Assassination makes an enemy Character secondary-relevant", () => {
  const state = baseState();
  state.scoring.secondaryMissions = [activeSecondary("p1", assassination)];
  const impact = getTargetSecondaryMissionImpact(state, {
    playerId: "p1",
    targetUnitId: "character-target"
  });
  assert.equal(impact.label, "high");
  assert.equal(impact.scoringSignals[0].missionId, "secondary-assassination");
  assert.match(impact.reason, /CHARACTER/);
});

test("verified Centre Ground can score target removal and opponent denial context", () => {
  const state = baseState();
  state.scoring.secondaryMissions = [
    activeSecondary("p1", centreGround, 1),
    activeSecondary("p2", centreGround, 2)
  ];
  const impact = getTargetSecondaryMissionImpact(state, {
    playerId: "p1",
    targetUnitId: "centre-target"
  });
  assert.ok(impact.score >= 0.9);
  assert.equal(impact.scoringSignals.length, 1);
  assert.equal(impact.denialSignals.length, 1);
  assert.match(impact.reason, /battlefield centre/);
});

test("unverified active secondary remains visible but does not alter ranking score", () => {
  const state = baseState();
  state.scoring.secondaryMissions = [activeSecondary("p1", noPrisoners)];
  const impact = getTargetSecondaryMissionImpact(state, {
    playerId: "p1",
    targetUnitId: "plain-target"
  });
  assert.equal(impact.score, 0);
  assert.deepEqual(impact.unresolvedMissions, ["No Prisoners"]);
  assert.match(impact.reason, /not used for ranking/);
});

test("recorded opponent damage and charges raise recent threat", () => {
  const state = baseState();
  state.history.push(
    {
      type: "combat.attack_resolved",
      payload: {
        attackerId: "plain-target",
        targetId: "friendly",
        phase: "shooting",
        actualDamage: 8,
        round: 2,
        turn: 1
      }
    },
    {
      type: "charge.outcome_recorded",
      payload: {
        unitId: "plain-target",
        targetIds: ["friendly"],
        outcome: "successful",
        round: 2,
        turn: 1
      }
    }
  );
  const impact = getTargetThreatImpact(state, {
    playerId: "p1",
    targetUnitId: "plain-target"
  });
  assert.ok(impact.score > 0.5);
  assert.equal(impact.damageDealt, 8);
  assert.equal(impact.charges, 1);
});

test("objective-linked target outranks an otherwise equivalent target", () => {
  const state = baseState();
  const ranked = getShootingTargetComparison(state, {
    playerId: "p1",
    attackerId: "shooter",
    weapon
  });
  const objective = ranked.comparisons.find((item) => item.targetUnitId === "objective-target");
  const plain = ranked.comparisons.find((item) => item.targetUnitId === "plain-target");
  assert.ok(objective.decisionScore > plain.decisionScore);
  assert.ok(objective.decisionBreakdown.primaryMissionPoints > plain.decisionBreakdown.primaryMissionPoints);
});

test("shooting comparison exposes probabilities and strategic context without mutating state", () => {
  const state = baseState();
  state.scoring.secondaryMissions = [activeSecondary("p1", assassination)];
  const before = JSON.stringify(state);
  const comparison = getShootingTargetComparison(state, {
    playerId: "p1",
    attackerId: "shooter",
    weapon
  });
  const character = comparison.comparisons.find((item) => item.targetUnitId === "character-target");
  assert.ok(character);
  assert.ok(Number.isFinite(character.expectedDamage));
  assert.ok(character.probabilityAnyDamage > 0);
  assert.ok(Number.isFinite(character.probabilityAtLeastExpectedDamage));
  assert.ok(Number.isFinite(character.destructionProbability));
  assert.equal(character.secondaryMissionImpact.scoringSignals[0].missionId, "secondary-assassination");
  assert.match(character.recommendation, /secondary/i);
  assert.equal(JSON.stringify(state), before);
});
