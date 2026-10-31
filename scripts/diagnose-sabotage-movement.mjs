import { getMovementStrategicRecommendations } from "../src/rules/tactical-movement-router.js";
import { getEventCompanionMapForForceDispositions } from "../src/rules/event-companion-map-catalog.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function rosterUnit(id, { move = 8, oc = 2 } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons: [{ name: "test gun", type: "ranged", range: "24\"", attacks: 1, skill: "3+", strength: 4, ap: 0, damage: 1 }]
    }
  };
}

function unit(id, ownerId, position, { move = 8, oc = 2, battleShocked = false } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status: "deployed",
    battleShocked,
    position: { ...position },
    wounds: 5,
    startingStrength: 1,
    currentStrength: 1,
    startingWounds: 5,
    metadata: { rosterUnitId: `r-${id}`, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

const map = getEventCompanionMapForForceDispositions("Priority Assets", "Priority Assets", "A");
const attackerHome = map.objectivePositions["Attacker Home"];
const defenderHome = map.objectivePositions["Defender Home"];
const central1 = map.objectivePositions["Central 1"];
const expansion1 = map.objectivePositions["Expansion 1"];

const state = {
  phase: "movement",
  turn: 5,
  activePlayer: "p1",
  battle: { id: "b", status: "active", round: 5, activePlayerId: "p1", firstPlayerId: "p1" },
  preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
  players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
  battlefieldMap: { missionSetup: { myDisposition: "Priority Assets", opponentDisposition: "Priority Assets", layout: "A" } },
  objectives: [
    { id: "home-p1", name: "Attacker Home", layoutObjective: "Attacker Home", position: { ...attackerHome }, control: control("p1") },
    { id: "central-1", name: "Central 1", layoutObjective: "Central 1", position: { ...central1 }, control: control(null) },
    { id: "central-2", name: "Expansion 1", layoutObjective: "Expansion 1", position: { ...expansion1 }, control: control("p2") },
    { id: "home-p2", name: "Defender Home", layoutObjective: "Defender Home", position: { ...defenderHome }, control: control("p2") }
  ],
  units: [
    unit("runner", "p1", central1, { battleShocked: true }),
    unit("runner-two", "p1", expansion1),
    unit("runner-three", "p1", defenderHome),
    unit("home-guard", "p1", attackerHome),
    unit("enemy", "p2", defenderHome)
  ],
  history: [],
  victoryPoints: { p1: 0, p2: 0 },
  commandPoints: { p1: 2, p2: 2 },
  scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" } },
  armyRosters: {
    p1: { units: [rosterUnit("r-runner"), rosterUnit("r-runner-two"), rosterUnit("r-runner-three"), rosterUnit("r-home-guard")] },
    p2: { units: [rosterUnit("r-enemy")] }
  }
};

const movement = getMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
console.log(JSON.stringify(movement.recommendations.filter((item) => item.unitId === "runner"), null, 2));
