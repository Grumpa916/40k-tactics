import test from "node:test";
import assert from "node:assert/strict";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-opportunities.js";
import { getTacticalCombatRecommendations } from "../../src/rules/tactical-combat-recommendations.js";
import { renderMovementAdvisor } from "../../src/ui/movement-advisor.js";

function unit(id, ownerId, x, y, { oc = 2, move = 6, battleShocked = false, rosterUnitId = id } = {}) {
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
    battleShocked,
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
      unit("holder", "p1", 8, 8, { oc: 3, move: 6, rosterUnitId: "r-holder" }),
      unit("enemy", "p2", 31, 22, { oc: 2, move: 6, rosterUnitId: "r-enemy" })
    ],
    scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" } },
    armyRosters: {
      p1: { units: [
        rosterUnit("r-scorer", { move: 6, oc: 4, weapons: [{ name: "Rifle", range: 12, attacks: 2, skill: "3+", strength: 4, ap: 0, damage: 1 }] }),
        rosterUnit("r-holder", { move: 6, oc: 3 })
      ] },
      p2: { units: [rosterUnit("r-enemy", { move: 6, oc: 2 })] }
    }
  };
}

test("Movement Advisor prioritizes a reachable enemy-controlled objective for a useful OC unit", () => {
  const result = getMovementStrategicRecommendations(state(), { playerId: "p1" });
  const scorer = result.recommendations.find((item) => item.unitId === "scorer");
  assert.equal(scorer.purpose, "contest-objective");
  assert.equal(scorer.objectiveId, "centre");
  assert.equal(scorer.actionHint, "Normal Move can plausibly reach the area");
  assert.equal(scorer.effectiveOc, 4);
  assert.ok(scorer.priority >= 4);
});

test("Movement Advisor recognizes a unit already holding a friendly objective", () => {
  const result = getMovementStrategicRecommendations(state(), { playerId: "p1" });
  const holder = result.recommendations.find((item) => item.unitId === "holder");
  assert.equal(holder.purpose, "hold-objective");
  assert.equal(holder.objectiveId, "home");
  assert.match(holder.recommendation, /hold home/i);
});

test("Movement Advisor retains multiple ranked purposes for the selected formation", () => {
  const result = getMovementStrategicRecommendations(state(), { playerId: "p1" });
  const scorer = result.recommendations.find((item) => item.unitId === "scorer");
  assert.equal(scorer.alternatives.length, 2);
  assert.ok(scorer.alternatives.every((item) => typeof item.purpose === "string" && Number.isFinite(item.score)));
  assert.ok(scorer.alternatives.every((item) => item.score <= scorer.score));
  assert.ok(scorer.alternatives.some((item) => item.kind === "target" || item.kind === "position" || item.objectiveId !== scorer.objectiveId));
});

test("Battle-shock suppresses saved OC instead of crediting a shocked mover with control", () => {
  const current = state();
  current.units.find((item) => item.id === "scorer").battleShocked = true;
  const result = getMovementStrategicRecommendations(current, { playerId: "p1" });
  const scorer = result.recommendations.find((item) => item.unitId === "scorer");
  assert.equal(scorer.effectiveOc, 0);
  assert.equal(scorer.battleShocked, true);
});

test("Movement recommendations are exposed through the shared tactical API", () => {
  const current = state();
  const result = getTacticalCombatRecommendations(current, { playerId: "p1" });
  assert.ok(result.movement.length >= 2);
  assert.equal(result.recommendations[0].type, "movement");
  assert.equal(result.charge.length, 0);
  assert.equal(result.fight.length, 0);
});

test("Movement Advisor UI shows selected advice, destination comparisons, priorities and map guardrails", () => {
  const current = state();
  const html = renderMovementAdvisor(current, { playerId: "p1", selectedUnitId: "scorer" });
  assert.match(html, /Movement Advisor/);
  assert.match(html, /move toward centre/i);
  assert.match(html, /Possible destinations · 3/);
  assert.match(html, /Objective · centre/);
  assert.match(html, /data-movement-option-rank="2"/);
  assert.match(html, /data-movement-option-rank="3"/);
  assert.match(html, /relative fit/);
  assert.match(html, /not a movement-success probability/);
  assert.match(html, /Move priorities/);
  assert.match(html, /Map distances are approximate/);
  assert.match(html, /Destination options describe strategic purposes, not exact legal endpoints/);
  assert.match(html, /Only verified mission text changes movement ranking/);
});

test('Movement Advisor objective names exactly match named live-map markers without exposing internal IDs', async()=>{
 const {renderBattlefieldMap}=await import('../../src/ui/battlefield-map.js');
 const {applyApprovedLiveMapSymbols}=await import('../../src/ui/live-map-symbols.js');
 const {getBattlePrimaryMissions,getEventCompanionMapLayout}=await import('../../src/rules/event-companion-map-catalog.js');
 const s=state();s.battlefieldMap={missionSetup:{myDisposition:'Take and Hold',opponentDisposition:'Take and Hold',layout:'A'}};
 s.preGameSetup={attackerPlayerId:'p1',defenderPlayerId:'p2'};
 const missions=getBattlePrimaryMissions('Take and Hold','Take and Hold');
 const geometry=getEventCompanionMapLayout(missions.myMission,missions.opponentMission,'A');
 s.objectives=[{id:'event-companion:Expansion 2',layoutObjective:'Expansion 2',position:geometry.objectivePositions['Expansion 2'],control:{controlState:'controlled',controllerId:'p2'}}];
 s.units[0].position={...geometry.objectivePositions['Expansion 2']};
 for(const perspective of ['p1','p2']){
  const result=getMovementStrategicRecommendations(s,{playerId:'p1',perspectivePlayerId:perspective});
  const option=result.recommendations.find(r=>r.unitId==='scorer');
  const objective=[option,...option.alternatives].find(o=>o.objectiveId===s.objectives[0].id);
  assert.ok(objective);assert.match(objective.objectiveName,/^(My|Opp) Exp$/);
  assert.doesNotMatch(objective.reason,/event-companion:/);
  const html=renderMovementAdvisor(s,{playerId:'p1',selectedUnitId:'scorer',perspectivePlayerId:perspective});
  assert.ok(html.includes(`Objective · ${objective.objectiveName}`));
  assert.ok(html.includes('data-movement-highlight-id="event-companion:Expansion 2"'));
  const map=renderBattlefieldMap(s,{perspectivePlayerId:perspective});
  assert.ok(map.includes(`>${objective.objectiveName}</button>`));
  const liveMap=applyApprovedLiveMapSymbols(map,s);
  const [first,second]=objective.objectiveName.split(' ');
  assert.match(liveMap,new RegExp(`data-map-objective-id="event-companion:Expansion 2"[^>]*><span class="battlefield-map__objective-label-line">${first}<\\/span><span class="battlefield-map__objective-label-line">${second}<\\/span><\\/button>`));
  assert.doesNotMatch(liveMap,/data-objective-number=/);
 }
});
