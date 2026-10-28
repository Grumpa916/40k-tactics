import test from "node:test";
import assert from "node:assert/strict";
import { getPrimaryStrategyContext } from "../../src/rules/tactical-primary-strategy-router.js";

const controlled = (controllerId) => ({ controlState: "controlled", controllerId, contestingPlayerIds: [] });

test("Purge and Secure attacker proximity uses live model positions instead of stale unit.position", () => {
  const turn = 2;
  const state = {
    phase: "shooting",
    turn,
    activePlayer: "p1",
    battle: { status: "active", round: 2, activePlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: {
      missionSetup: { myDisposition: "Take and Hold", opponentDisposition: "Reconnaissance", layout: "A" }
    },
    objectives: [
      { id: "event-companion:Attacker Home", layoutObjective: "Attacker Home", position: { x: 50, y: 5 }, control: controlled("p1") },
      { id: "event-companion:Central 1", layoutObjective: "Central 1", position: { x: 30, y: 22 }, control: controlled("p2") },
      { id: "event-companion:Defender Home", layoutObjective: "Defender Home", position: { x: 10, y: 39 }, control: controlled("p2") }
    ],
    units: [
      {
        id: "attacker",
        ownerId: "p1",
        status: "deployed",
        position: { x: 5, y: 5 },
        models: [
          { id: "attacker:1", position: { x: 29, y: 22 } },
          { id: "attacker:2", position: { x: 31, y: 22 } }
        ]
      },
      { id: "far-target", ownerId: "p2", status: "deployed", position: { x: 55, y: 40 } }
    ],
    history: [
      {
        type: "unit.normal_move_resolved",
        payload: {
          turn,
          unitId: "attacker",
          moves: [{ modelId: "attacker:1" }, { modelId: "attacker:2" }]
        }
      }
    ],
    scoring: {
      turnSnapshots: [{
        turn,
        playerId: "p1",
        objectives: [
          { id: "event-companion:Attacker Home", control: controlled("p1") },
          { id: "event-companion:Central 1", control: controlled("p2") },
          { id: "event-companion:Defender Home", control: controlled("p2") }
        ],
        units: [
          { id: "attacker", ownerId: "p1", status: "deployed", wounds: 5, position: { x: 5, y: 5 } },
          { id: "far-target", ownerId: "p2", status: "deployed", wounds: 5, position: { x: 55, y: 40 } }
        ]
      }],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    }
  };

  const context = getPrimaryStrategyContext(state, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    attackerId: "attacker",
    targetUnitId: "far-target"
  });

  assert.equal(context.killOpportunity.targetStartedNearObjective, false);
  assert.equal(context.killOpportunity.attackerNearObjective, true);
  assert.equal(context.killOpportunity.attackerApproximateDistance, 0);
  assert.equal(context.nextKillVpLeverage, 3);
});
