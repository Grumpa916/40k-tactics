import test from 'node:test';
import assert from 'node:assert/strict';
import { SECONDARY_MISSION_CATALOG } from '../../src/data/secondary-mission-catalog.js';
import {
  SECONDARY_INTELLIGENCE_ROLES,
  getSecondaryMissionIntelligence,
  getSecondaryObjectivePlanningSignal,
  getSecondaryTerritoryPlanningSignal
} from '../../src/rules/secondary-mission-intelligence.js';
import { getTargetSecondaryMissionImpact } from '../../src/rules/tactical-secondary-target-impact.js';
import { getMovementStrategicRecommendations } from '../../src/rules/tactical-movement-opportunities.js';
import { renderMovementAdvisor } from '../../src/ui/movement-advisor.js';
import { readFileSync } from 'node:fs';

function unit(id,ownerId,{wounds=4,startingStrength=1,position={x:28,y:20},keywords=[]}={}){
  return {id,ownerId,name:id,status:'deployed',position,startingStrength,currentStrength:startingStrength,
    wounds,startingWounds:wounds,profile:{keywords,characteristics:{wounds,objectiveControl:2,movement:6,toughness:5,save:3}},
    metadata:{rosterUnitId:id,modelCount:startingStrength}};
}
function obj(id,name,position){
  return {id:'event-companion:'+id,name,layoutObjective:id,position,control:{
    controlState:'uncontrolled',controllerId:null,contestingPlayerIds:[]}};
}
function seed(){
  return {
    phase:'movement',turn:3,activePlayer:'p1',
    battle:{id:'b',status:'active',round:3,activePlayerId:'p1'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    preGameSetup:{attackerPlayerId:'p1',defenderPlayerId:'p2'},
    battlefieldMap:{missionSetup:{myDisposition:'Disruption',opponentDisposition:'Reconnaissance',layout:'A'}},
    objectives:[
      obj('Attacker Home','Attacker Home',{x:50,y:22}),
      obj('Defender Home','Defender Home',{x:10,y:22}),
      obj('Central 1','Central 1',{x:30,y:22}),
      obj('Central 2','Central 2',{x:32,y:24}),
      obj('Expansion 1','Expansion 1',{x:38,y:22}),
      obj('Expansion 2','Expansion 2',{x:22,y:22})
    ],
    units:[
      unit('mover','p1',{position:{x:36,y:22}}),
      unit('ally','p1',{position:{x:40,y:20}}),
      unit('enemy','p2',{position:{x:28,y:22}}),
      unit('large','p2',{startingStrength:13,position:{x:25,y:21}}),
      unit('monster','p2',{wounds:12,position:{x:20,y:22}}),
      unit('character','p2',{keywords:['Character'],position:{x:30,y:22}})
    ],
    scoring:{secondaryMissionModeByPlayer:{p1:'tactical',p2:'tactical'},secondaryMissions:[],turnSnapshots:[]},
    history:[],armyRosters:{}
  };
}
function add(state,id,{owner='p1',cardState={},mode='tactical'}={}){
  const definition=SECONDARY_MISSION_CATALOG.find(m=>m.id===id);
  assert.ok(definition,'card exists: '+id);
  state.scoring.secondaryMissionModeByPlayer[owner]=mode;
  state.scoring.secondaryMissions.push({
    instanceId:owner+':'+id,definitionId:id,definition,playerId:owner,
    status:'active',drawnRound:3,drawnTurn:3,cardState,scoringHistory:[]
  });
}
function signal(state,id,unitId='mover'){
  return getSecondaryObjectivePlanningSignal(state,{playerId:'p1',objectiveId:'event-companion:'+id,unitId});
}
function target(state,id){
  return getTargetSecondaryMissionImpact(state,{playerId:'p1',targetUnitId:id});
}

test('all 18 physical secondary cards have explicit verified intelligence and valid Fixed/Tactical scoring checkpoints',()=>{
  assert.equal(SECONDARY_MISSION_CATALOG.length,18);
  assert.equal(Object.keys(SECONDARY_INTELLIGENCE_ROLES).length,18);
  for(const card of SECONDARY_MISSION_CATALOG){
    assert.ok(SECONDARY_INTELLIGENCE_ROLES[card.id],card.name+' has an intelligence role');
    assert.equal(card.rulesVerified,true,card.name+' has source-reviewed card text');
    assert.ok(card.scoringWindows.length>0,card.name+' has scoring windows');
    for(const window of card.scoringWindows){
      assert.ok(['end-of-turn','end-of-opponent-turn'].includes(window.timing));
      assert.ok(window.tiers.length>0,card.name+' has condition text');
      assert.ok(window.tiers.every(tier=>typeof tier.summary==='string'&&tier.summary.length>0));
    }
    const state=seed();
    add(state,card.id,{mode:card.fixedAvailable?'fixed':'tactical'});
    const [plan]=getSecondaryMissionIntelligence(state,{playerId:'p1'});
    assert.equal(plan.definitionId,card.id);
    assert.ok(plan.verified,card.id+' has current-mode scoring window');
    assert.ok(plan.timingLabels.length>0);
    assert.ok(plan.advice.length>20);
  }
});

test('Tempting Target selection boosts only the recorded chosen objective',()=>{
 const s=seed();
 add(s,'secondary-a-tempting-target',{cardState:{temptingTargetObjectiveId:'event-companion:Central 2'}});
 assert.equal(signal(s,'Central 1').score,0);
 assert.ok(signal(s,'Central 2').score>0.3);
 assert.equal(signal(s,'Attacker Home').score,0);
});

test('Defend Stronghold and Burden of Trust use home/recorded guard and round checks',()=>{
 const s=seed();
 add(s,'secondary-defend-stronghold');
 assert.ok(signal(s,'Attacker Home').score>0);
 assert.equal(signal(s,'Defender Home').score,0);
 s.battle.round=1;
 assert.equal(signal(s,'Attacker Home').score,0,'no Defend score before round 2');
 const t=seed();
 add(t,'secondary-burden-of-trust',{cardState:{burdenTrustAssignments:[
   {objectiveId:'event-companion:Expansion 1',unitId:'mover',expiresAtTurn:6}
 ]}});
 assert.ok(signal(t,'Expansion 1','mover').score>0);
 assert.equal(signal(t,'Expansion 1','ally').score,0);
 assert.equal(signal(t,'Central 1','mover').score,0);
});

test('Only relevant non-home or No Mans Land objectives get Cleanse, Forward and Secure value',()=>{
 for(const [id,positive,negative] of [
  ['secondary-cleanse','Central 1','Attacker Home'],
  ['secondary-forward-position','Defender Home','Central 1'],
  ['secondary-secure-no-mans-land','Central 1','Attacker Home']
 ]) {
  const s=seed();add(s,id);
  assert.ok(signal(s,positive).score>0,id+' relevant objective');
  assert.equal(signal(s,negative).score,0,id+' irrelevant objective');
 }
});

test('combat, terrain-only, and quarter-only secondaries do not inflate arbitrary objective rankings',()=>{
 for(const id of [
  'secondary-a-grievous-blow','secondary-assassination','secondary-beacon',
  'secondary-behind-enemy-lines','secondary-bring-it-down','secondary-centre-ground',
  'secondary-display-of-might','secondary-engage-on-all-fronts','secondary-no-prisoners',
  'secondary-outflank','secondary-overwhelming-force','secondary-plunder'
 ]) {
  const s=seed();add(s,id);
  assert.equal(signal(s,'Central 1').score,0,id+' must not add a general objective bonus');
  assert.equal(signal(s,'Defender Home').score,0,id+' must not add a general home bonus');
 }
});

test('Beacon staging and denial are tied to the exact designated unit',()=>{
 const s=seed();
 add(s,'secondary-beacon',{cardState:{beaconUnitId:'mover'}});
 assert.ok(getSecondaryTerritoryPlanningSignal(s,{playerId:'p1',unit:s.units[0]}).score>0);
 assert.equal(getSecondaryTerritoryPlanningSignal(s,{playerId:'p1',unit:s.units[1]}).score,0);
 const opp=seed();
 add(opp,'secondary-beacon',{owner:'p2',cardState:{beaconUnitId:'enemy'}});
 assert.ok(target(opp,'enemy').denialVp>0);
 assert.equal(target(opp,'large').denialVp,0);
});

test('A Grievous Blow, Bring it Down, No Prisoners and Overwhelming Force use their distinct target eligibility',()=>{
 const cases=[
   ['secondary-a-grievous-blow','large','enemy',5],
   ['secondary-bring-it-down','monster','enemy',5],
   ['secondary-no-prisoners','enemy',null,2]
 ];
 for(const [card,wanted,excluded,vp] of cases){
  const s=seed();add(s,card);
  const yes=target(s,wanted);
  assert.ok(yes.score>0,card+' should recognize a valid target');
  assert.equal(yes.scoringSignals[0].vpAtStake,vp);
  if(excluded)assert.equal(target(s,excluded).score,0,card+' must not rank a non-qualifying target');
 }
 const s=seed();add(s,'secondary-overwhelming-force');
 assert.equal(target(s,'enemy').score,0,'current map position without turn-start evidence cannot qualify');
 s.scoring.turnSnapshots=[{turn:3,units:[
  {id:'enemy',position:{x:29,y:22}},
  {id:'large',position:{x:55,y:42}}
 ],objectives:[]}];
 assert.equal(target(s,'enemy').scoringSignals[0].vpAtStake,3);
 assert.equal(target(s,'large').score,0);
});

test('Fixed destruction card values use Fixed printed per-model/per-unit tiers, not Tactical totals',()=>{
 for(const [id,unitId,value] of [
  ['secondary-a-grievous-blow','large',4],
  ['secondary-bring-it-down','monster',4]
 ]){
  const s=seed();add(s,id,{mode:'fixed'});
  assert.equal(target(s,unitId).scoringSignals[0].vpAtStake,value);
 }
});

test('Movement UI shows card-specific scoring windows and Shooting preserves manual Action authority',()=>{
 const s=seed();add(s,'secondary-cleanse');add(s,'secondary-a-tempting-target',{cardState:{temptingTargetObjectiveId:'event-companion:Central 2'}});
 const advisory=getMovementStrategicRecommendations(s,{playerId:'p1'});
 assert.ok(advisory.secondaryPlans.length===2);
 const text=renderMovementAdvisor(s,{playerId:'p1',selectedUnitId:'mover'});
 assert.match(text,/data-secondary-mission-intelligence/);
 assert.match(text,/Reserve eligible non-home objectives/);
 assert.match(text,/opponent-designated/);
 const source=readFileSync(new URL('../../src/ui/shooting-screen.js',import.meta.url),'utf8');
 assert.match(source,/data-secondary-shooting-intelligence/);
 assert.match(source,/not an Action recording control/);
 const checkpoint=readFileSync(new URL('../../src/ui/scoring-checkpoint-review.js',import.meta.url),'utf8');
 assert.match(checkpoint,/All 18 Secondary card faces were checked/);
});

test('Centre Ground and quarter/edge secondaries produce specific physical-check movement options',async()=>{
 const {getSecondaryPositionalPlanningOptions}=await import('../../src/rules/secondary-positioning-plans.js');
 const cases=[
  ['secondary-centre-ground','stage-centre-ground','battlefield centre'],
  ['secondary-behind-enemy-lines','stage-enemy-deployment','deployment zone'],
  ['secondary-display-of-might','stage-no-mans-land','No Man'],
  ['secondary-engage-on-all-fronts','stage-empty-quarter','quarter'],
  ['secondary-outflank','stage-outflank-edge','edge']
 ];
 for(const [id,purpose,text] of cases){
   const s=seed();add(s,id);
   const options=getSecondaryPositionalPlanningOptions(s,{playerId:'p1',unit:s.units[0],movement:6});
   const option=options.find(candidate=>candidate.purpose===purpose);
   assert.ok(option,id+' has its own positioning option');
   assert.match(option.actionHint,new RegExp(text,'i'));
   assert.equal(option.confidence,'low','map advisory cannot claim whole-unit legality');
   assert.ok(option.score>0 && option.score<0.8);
   s.units[0].battleShocked=true;
   assert.equal(getSecondaryPositionalPlanningOptions(s,{playerId:'p1',unit:s.units[0],movement:6}).length,0,
     id+' should not stage a Battle-shocked unit as mission-eligible');
 }
});

test('the opponent Movement Advisor surfaces opponent-turn Secondary reviews as defensive reminders',()=>{
 const s=seed();
 add(s,'secondary-beacon',{cardState:{beaconUnitId:'mover'}});
 add(s,'secondary-defend-stronghold');
 s.activePlayer='p2';s.battle.activePlayerId='p2';
 const html=renderMovementAdvisor(s,{playerId:'p2',perspectivePlayerId:'p1'});
 assert.match(html,/data-secondary-opponent-turn-intelligence/);
 assert.match(html,/Beacon/);
 assert.match(html,/Defend Stronghold/);
 assert.match(html,/Confirm the printed conditions and VP/);
});
