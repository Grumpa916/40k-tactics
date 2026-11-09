import { createGameState } from '../state/game-state.js';

// This is a browser-memory-only laboratory. These synthetic events mimic the
// existing event shape; they are never sent to the live game command engine.
export const ADVISOR_IPAD_SCENARIOS = Object.freeze([
  { id:'planning', title:'1 · Command planning', phase:'command', expected:'Full Attack, Shoot Only and Mission positioning appear before moving.' },
  { id:'movement', title:'2 · Movement what-if', phase:'movement', expected:'Hold is out of range; a hypothetical Normal Move creates a Shooting opportunity.' },
  { id:'shooting', title:'3 · Record shooting', phase:'shooting', expected:'Record two separate attacks, then confirm actual damage replaces prior estimates.' },
  { id:'measured', title:'4 · Measured charge', phase:'charge', expected:'Use the measured distance for the updated charge probability and remaining Fight.' },
  { id:'success', title:'5 · Successful charge', phase:'fight', expected:'Recorded successful charge and surviving wounds drive remaining Fight forecast.' },
  { id:'failed', title:'6 · Failed charge', phase:'fight', expected:'A recorded failed charge must not generate a new charge-linked Fight forecast.' },
  { id:'fight', title:'7 · Fight completed', phase:'fight', expected:'Recorded Fight damage and finished activation prevent another full Fight projection.' },
  { id:'destroyed', title:'8 · Target destroyed', phase:'charge', expected:'No further Fight forecast; show manual objective-control review.' },
  { id:'opponent', title:'9 · Opponent turn', phase:'shooting', expected:'Own-turn offensive Adaptive Execution must be unavailable.' }
]);

const sheet = {
  characteristics:{ Toughness:'5', Save:'3+', Wounds:'10', Move:'6', OC:'2' },
  weapons:[
    { name:'Boltstorm',range:'24"',attacks:4,skill:'3+',strength:5,ap:-1,damage:2 },
    { name:'Blade',range:'Melee',attacks:4,skill:'3+',strength:6,ap:-2,damage:2 }
  ]
};

export function advisorTestShot(damage,turn=1,round=1){
  return { type:'combat.attack_resolved',payload:{
    phase:'shooting',round,turn,attackerId:'a',sourceAttackerId:'a',
    targetId:'b',actualDamage:damage,
    stateDelta:{target:{unitId:'b',woundsAfter:null}}
  }};
}

export function advisorTestCharge(outcome,distance=7,turn=1,round=1){
  const declared=outcome!=='declined';
  return {type:'charge.outcome_recorded',payload:{
    unitId:'a',playerId:'p1',round,turn,outcome,
    targetIds:declared?['b']:[],
    measuredDistances:declared?{b:distance}:{}
  }};
}

export function advisorTestFight(damage,turn=1,round=1){
  return {type:'combat.attack_resolved',payload:{
    phase:'fight',round,turn,attackerId:'a',sourceAttackerId:'a',
    targetId:'b',actualDamage:damage,
    stateDelta:{target:{unitId:'b',woundsAfter:null}}
  }};
}

function finishFight(turn=1,round=1) {
  return {type:'combat.activation_finished',
    payload:{unitId:'a',phase:'fight',round,turn}};
}

export function createAdvisorIpadState(id='planning'){
  const scenario=ADVISOR_IPAD_SCENARIOS.find(item=>item.id===id);
  if(!scenario) throw new Error('Unknown iPad Advisor test scenario: '+id);
  const staged=id==='movement';
  const own={x:staged?4:14,y:22};
  const enemy={x:staged?33:21,y:22};
  const state=createGameState({
    phase:scenario.phase,turn:1,activePlayer:id==='opponent'?'p2':'p1',
    battle:{id:'advisor-ipad-sandbox',status:'active',round:1,
      activePlayerId:id==='opponent'?'p2':'p1',firstPlayerId:'p1'},
    players:[{id:'p1',name:'Test Custodes'},{id:'p2',name:'Test Opponent'}],
    history:[],commandPoints:{p1:3,p2:3},
    objectives:[{id:'c1',name:'Center 1',position:{x:30,y:30}}],
    battlefieldMap:{actualDeployment:{a:{position:{...own}},b:{position:{...enemy}}}},
    armyRosters:{
      p1:{faction:'Test',units:[{id:'a',name:'Allarus Test Formation',modelCount:1,
        datasheet:structuredClone(sheet),equippedWeapons:[
          {name:'Boltstorm',quantity:1},{name:'Blade',quantity:1}
        ]}]},
      p2:{faction:'Test',units:[{id:'b',name:'Enemy Objective Holder',modelCount:1,
        datasheet:structuredClone(sheet),equippedWeapons:[
          {name:'Boltstorm',quantity:1},{name:'Blade',quantity:1}
        ]}]}
    },
    units:[
      {id:'a',ownerId:'p1',name:'Allarus Test Formation',status:'deployed',
        position:{...own},wounds:10,startingWounds:10,modelCount:1,
        characteristics:{movement:6,toughness:5,save:3,weaponSkill:3,ballisticSkill:3,objectiveControl:2},
        metadata:{rosterUnitId:'a',modelCount:1}},
      {id:'b',ownerId:'p2',name:'Enemy Objective Holder',status:'deployed',
        position:{...enemy},wounds:10,startingWounds:10,modelCount:1,
        characteristics:{movement:6,toughness:5,save:3,weaponSkill:3,ballisticSkill:3,objectiveControl:2},
        metadata:{rosterUnitId:'b',modelCount:1}}
    ]
  });
  if(['measured','success','failed','fight','destroyed'].includes(id)){
    state.history.push(advisorTestShot(id==='destroyed'?10:3));
    if(id!=='destroyed') state.history.push(advisorTestShot(2));
    state.units[1].wounds=id==='destroyed'?0:5;
    if(id==='destroyed') state.units[1].status='destroyed';
  }
  if(['success','failed','fight'].includes(id)) state.history.push(advisorTestCharge(id==='failed'?'failed':'successful'));
  if(id==='fight'){
    state.history.push(advisorTestFight(3));
    state.units[1].wounds=2;
    state.history.push(finishFight());
  }
  return state;
}

export function applyAdvisorIpadAction(state,action,{distance=7,position=null}={}){
  if(!state || !action) throw new TypeError('Test state and action are required.');
  if(action==='move-marker'){
    if(!position || !Number.isFinite(position.x) || !Number.isFinite(position.y) ||
      position.x<0 || position.x>60 || position.y<0 || position.y>44) throw new Error('Choose a location on the test battlefield.');
    const next={x:Math.round(position.x*10)/10,y:Math.round(position.y*10)/10};
    return {...state,units:state.units.map(unit=>unit.id==='a'?{...unit,position:next}:unit),
      battlefieldMap:{...(state.battlefieldMap??{}),
        actualDeployment:{...(state.battlefieldMap?.actualDeployment??{}),a:{position:next}}}};
  }
  if(action.startsWith('phase:')){
    const phase=action.slice(6);
    if(!['command','movement','shooting','charge','fight'].includes(phase)) throw new Error('Unknown test phase.');
    return {...state,phase};
  }
  const ownTurn=state.activePlayer==='p1';
  if(!ownTurn) throw new Error('Opponent-turn test is intentionally read-only.');
  const target=state.units.find(unit=>unit.id==='b');
  const round=state.battle.round,turn=state.turn;
  const updated=(damage,event)=>{
    if(!target || target.status==='destroyed') throw new Error('The test target is already destroyed.');
    const wounds=Math.max(0,target.wounds-damage);
    event.payload.stateDelta.target.woundsAfter=wounds;
    return {...state,history:[...state.history,event],
      units:state.units.map(unit=>unit.id==='b'?
        {...unit,wounds,status:wounds===0?'destroyed':'deployed'}:unit)};
  };
  if(action==='shoot-3'||action==='shoot-2'){
    if(state.phase!=='shooting') throw new Error('Switch to Shooting to record a test shot.');
    const damage=action==='shoot-3'?3:2;
    return updated(damage,advisorTestShot(damage,turn,round));
  }
  if(action==='charge-success'||action==='charge-failed'||action==='charge-declined'){
    if(state.phase!=='charge') throw new Error('Switch to Charge to record an outcome.');
    if(state.history.some(event=>event.type==='charge.outcome_recorded' &&
        event.payload?.round===round && event.payload?.turn===turn))
      throw new Error('Charge already recorded. Reset the scenario to try a different outcome.');
    if(!Number.isFinite(distance)||distance<2||distance>12)
      throw new Error('Choose a measured distance from 2 to 12 inches.');
    const outcome=action==='charge-success'?'successful':action.slice('charge-'.length);
    return {...state,history:[...state.history,advisorTestCharge(outcome,distance,turn,round)]};
  }
  if(action==='fight-3'){
    if(state.phase!=='fight') throw new Error('Switch to Fight to record an attack.');
    const ok=state.history.some(event=>event.type==='charge.outcome_recorded' &&
      event.payload?.outcome==='successful' && event.payload?.round===round && event.payload?.turn===turn);
    if(!ok) throw new Error('Use the successful charge scenario or record a successful charge first.');
    return updated(3,advisorTestFight(3,turn,round));
  }
  if(action==='finish-fight'){
    if(state.phase!=='fight') throw new Error('Switch to Fight to finish an activation.');
    return {...state,history:[...state.history,finishFight(turn,round)]};
  }
  throw new Error('Unknown test action: '+action);
}
