import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { getBattleRulesReminders, getTargetDefenseReminders, isRulesPhaseOpening } from '../../src/rules/battle-rules-reminders.js';
import { recordRulesReminderUse, setUnitBattleNote } from '../../src/engine/rules-reminder-transitions.js';
import { recordVenatariAbilityUse } from '../../src/engine/venatari-ability-transitions.js';
import { getCustodesKatahState } from '../../src/rules/custodes-tactical-advisor.js';
import { recordCustodesKatahUse } from '../../src/engine/custodes-katah-transitions.js';
import { ADEPTUS_CUSTODES_DATASHEET_DETAILS as sheets } from '../../src/data/adeptus-custodes-datasheet-details.js';
const defenses=(state,id,strength=8,phase=state.phase)=>getTargetDefenseReminders(state,{targetUnitId:id,weapon:{characteristics:{strength}},phase});

test('opponent shooting shows Warden AP protection and excludes their Auramite option',()=>{
  const state=custodesReminderState();const list=defenses(state,'wardens');
  assert.ok(list.some(item=>item.id==='living-fortress'&&item.effect.includes('AP −2 becomes AP −1')));
  assert.ok(!list.some(item=>item.id==='auramite-option'));
  assert.ok(!list.some(item=>item.id==='personal-fnp'));
  const precision=getTargetDefenseReminders(state,{targetUnitId:'wardens',allocationTargetId:'trajann',phase:'shooting'});
  assert.ok(precision.some(item=>item.id==='living-fortress'));
  assert.ok(precision.some(item=>item.id==='personal-fnp'));
});

test('Sentinel and Galatus strength protection is conditional and Telemon reduction is ranged only',()=>{
  const state=custodesReminderState();
  assert.ok(defenses(state,'sentinel',8).some(item=>item.id==='strong-attack-defense'));
  assert.ok(!defenses(state,'sentinel',7).some(item=>item.id==='strong-attack-defense'));
  assert.ok(defenses(state,'galatus',11).some(item=>item.id==='strong-attack-defense'));
  assert.ok(!defenses(state,'galatus',10).some(item=>item.id==='strong-attack-defense'));
  assert.ok(defenses(state,'telemon').some(item=>item.id==='guardian-eternal'));
  state.phase='fight';assert.ok(!defenses(state,'telemon').some(item=>item.id==='guardian-eternal'));
  assert.deepEqual(defenses(state,'wardens',8,'shooting'),[]);
});

test('destroyed models and obsolete saved rule wording never receive passive defense claims',()=>{
  const state=custodesReminderState();state.units.find(unit=>unit.id==='wardens').status='destroyed';
  assert.deepEqual(defenses(state,'wardens'),[]);
  state.units.find(unit=>unit.id==='wardens').status='deployed';
  const sheet=state.armyRosters.p1.units.find(unit=>unit.id==='r-wardens').datasheet;
  sheet.abilities.find(item=>item.name==='Living Fortress').description='Old edition protection';
  assert.ok(!defenses(state,'wardens').some(item=>item.id==='living-fortress'));
});

test('rules follow datasheet abilities and current phase, including opponent turn',()=>{
  const state=custodesReminderState();
  const list=getBattleRulesReminders(state,{playerId:'p1',unitId:'wardens'});
  assert.ok(list.some(item=>item.ruleId==='living-fortress'));
  assert.ok(list.some(item=>item.ruleId==='moment-shackle'&&item.unitId==='trajann'));
  assert.ok(!list.some(item=>item.ruleId==='purity-of-execution'));
  state.phase='movement';assert.ok(!getBattleRulesReminders(state,{playerId:'p1'}).some(item=>item.ruleId==='living-fortress'));
  state.activePlayer='p1';state.phase='shooting';assert.ok(getBattleRulesReminders(state,{playerId:'p1'}).some(item=>item.ruleId==='purity-of-execution'));
  state.units.push({id:'fake',name:'Trajann Valoris',ownerId:'p2',status:'deployed',metadata:{}});
  assert.ok(!getBattleRulesReminders(state,{playerId:'p2'}).some(item=>item.ruleId==='moment-shackle'));
});

test('start-of-phase windows close after a real activation and reopen for a fresh phase',()=>{
  const state=custodesReminderState();assert.equal(isRulesPhaseOpening(state),true);
  state.history.push({type:'shooting.unit_activated',payload:{unitId:'marine',turn:1,round:1}});
  assert.equal(isRulesPhaseOpening(state),false);
  assert.ok(!getBattleRulesReminders(state,{playerId:'p1'}).some(item=>item.ruleId==='moment-shackle'));
  state.phase='fight';state.history.push({type:'turn.phase_changed',payload:{phase:'fight',turn:1,round:1}});
  assert.equal(isRulesPhaseOpening(state),true);
});

test('once-per-battle tracking survives save/resume, rejects reuse, and expires active save at phase end',()=>{
  let state=custodesReminderState();state=recordRulesReminderUse(state,{playerId:'p1',unitId:'trajann',ruleId:'moment-shackle',choice:'save'});
  state=JSON.parse(JSON.stringify(state));
  assert.throws(()=>recordRulesReminderUse(state,{playerId:'p1',unitId:'trajann',ruleId:'moment-shackle',choice:'attacks'}),/already used/);
  assert.ok(getTargetDefenseReminders(state,{targetUnitId:'wardens',allocationTargetId:'trajann'}).some(item=>item.id==='shackle-save'));
  assert.ok(!getTargetDefenseReminders(state,{targetUnitId:'wardens'}).some(item=>item.id==='shackle-save'));
  state.phase='fight';state.history.push({type:'turn.phase_changed',payload:{phase:'fight'}});
  assert.ok(!getTargetDefenseReminders(state,{targetUnitId:'wardens',allocationTargetId:'trajann'}).some(item=>item.id==='shackle-save'));
  const spent=getBattleRulesReminders(state,{playerId:'p1'}).find(item=>item.ruleId==='moment-shackle');
  assert.ok(spent.used);assert.equal(spent.activeThisPhase,false);
});

test('Venatari mine is once per unit while Swift Ruin is once per phase for the army',()=>{
  let state=custodesReminderState({phase:'movement'});
  const mine={playerId:'p1',ruleId:'cascade-mine',targetId:'marine',rangeConfirmed:true,actualWounds:0};
  state=recordVenatariAbilityUse(state,{...mine,unitId:'venatari'});
  state=recordVenatariAbilityUse(state,{...mine,unitId:'venatari2'});
  assert.throws(()=>recordVenatariAbilityUse(state,{...mine,unitId:'venatari'}));
  state.units.filter(unit=>unit.id.startsWith('venatari')).forEach(unit=>unit.status='reserves');
  state.battle.round=2;
  const ingress={playerId:'p1',ruleId:'swift-ruin',phaseEndConfirmed:true,ingressConfirmed:true};
  state=recordVenatariAbilityUse(state,{...ingress,unitId:'venatari'});
  assert.throws(()=>recordVenatariAbilityUse(state,{...ingress,unitId:'venatari2'}));
});

test('known engagement suppresses Take Wing; fallback releases that reminder',()=>{
  const state=custodesReminderState({phase:'fight'});
  state.history.push({type:'charge.outcome_recorded',payload:{unitId:'marine',targetIds:['venatari'],outcome:'successful'}});
  assert.ok(!getBattleRulesReminders(state,{playerId:'p1',unitId:'venatari'}).some(item=>item.ruleId==='take-wing'));
  state.history.push({type:'unit.fell_back',payload:{unitId:'marine'}});
  assert.ok(getBattleRulesReminders(state,{playerId:'p1',unitId:'venatari'}).some(item=>item.ruleId==='take-wing'));
});

test('Aquila confirmation records one extra CP per army per round and rejects repeat',()=>{
  let state=custodesReminderState({phase:'command'});
  state=recordRulesReminderUse(state,{playerId:'p1',unitId:'trajann',ruleId:'aquila-commander'});
  assert.equal(state.commandPoints.p1,4);
  assert.throws(()=>recordRulesReminderUse(state,{playerId:'p1',unitId:'trajann',ruleId:'aquila-commander'}));
  state.battle.round=2;state=recordRulesReminderUse(state,{playerId:'p1',unitId:'trajann',ruleId:'aquila-commander'});
  assert.equal(state.commandPoints.p1,5);
});

test('Superhuman Focus spends CP, re-readies a formation once per round, and rejects wrong owner',()=>{
  let state=custodesReminderState({phase:'fight',activePlayer:'p1'});state.battle.firstPlayerId='p1';
  const spend=()=>state.history.push({type:'custodes.katah_expended',payload:{playerId:'p1',unitId:'wardens',cycleRound:1,katahName:'Salvus',round:1,turn:1,phase:'shooting'}});
  spend();assert.equal(getCustodesKatahState(state,{playerId:'p1',unitId:'wardens'}).readied,false);
  state=recordRulesReminderUse(state,{playerId:'p1',unitId:'wardens',ruleId:'superhuman-focus'});
  assert.equal(state.commandPoints.p1,2);assert.equal(getCustodesKatahState(state,{playerId:'p1',unitId:'wardens'}).readied,true);
  spend();assert.throws(()=>recordRulesReminderUse(state,{playerId:'p1',unitId:'wardens',ruleId:'superhuman-focus'}));
  assert.throws(()=>recordRulesReminderUse(state,{playerId:'p2',unitId:'wardens',ruleId:'superhuman-focus'}));
});

test('unit notes persist independently for each army and validate owner and text length',()=>{
  let state=custodesReminderState();state=setUnitBattleNote(state,{playerId:'p1',unitId:'wardens',note:'  Remember AP protection  '});
  state=setUnitBattleNote(state,{playerId:'p2',unitId:'marine',note:'Opponent reminder'});
  state=JSON.parse(JSON.stringify(state));
  assert.equal(state.units.find(unit=>unit.id==='wardens').metadata.battleRulesNote,'Remember AP protection');
  assert.equal(state.units.find(unit=>unit.id==='marine').metadata.battleRulesNote,'Opponent reminder');
  assert.throws(()=>setUnitBattleNote(state,{playerId:'p1',unitId:'marine',note:'wrong'}));
  assert.throws(()=>setUnitBattleNote(state,{playerId:'p1',unitId:'wardens',note:'x'.repeat(2001)}));
});

test('late Fight-start Ka’tahs are rejected while Rendax remains available at activation',()=>{
  let state=custodesReminderState({phase:'fight',activePlayer:'p1'});state.battle.firstPlayerId='p1';
  state.history.push({type:'fight.unit_activated',payload:{unitId:'sentinel',turn:1,round:1}});
  assert.throws(()=>recordCustodesKatahUse(state,{playerId:'p1',unitId:'wardens',katahName:'Kaptaris'}),/start of the Fight phase/);
  state=recordCustodesKatahUse(state,{playerId:'p1',unitId:'wardens',katahName:'Rendax'});
  assert.equal(state.history.at(-1).payload.katahName,'Rendax');
});

test('optional Telemon weapons only receive reminders after the saved loadout selects them',()=>{
  const state=custodesReminderState({phase:'fight'});
  const selected=()=>getBattleRulesReminders(state,{playerId:'p1',unitId:'telemon'}).find(item=>item.ruleId==='weapon-keywords');
  assert.equal(selected(),undefined);
  state.armyRosters.p1.units.find(unit=>unit.id==='r-telemon').equippedWeapons=[{name:'Dual Caestus Fists',quantity:1}];
  assert.match(selected().effect,/Twin-linked/);
});

test('defensive Ka’tah choices remain accessible for the user at the start of opponent Fight',()=>{
  let state=custodesReminderState({phase:'fight',activePlayer:'p2'});state.battle.round=2;
  const entry=getBattleRulesReminders(state,{playerId:'p1',unitId:'wardens'}).find(item=>item.ruleId==='katah-fight-window');
  assert.ok(entry.katahChoices.some(item=>item.id==='Kaptaris'));
  state=recordCustodesKatahUse(state,{playerId:'p1',unitId:'wardens',katahName:'Kaptaris'});
  assert.ok(defenses(state,'wardens').some(item=>item.id==='kaptaris'));
});

test('aura reminders ask for range confirmation and do not grant Trajann’s aura to vehicles',()=>{
  const state=custodesReminderState();
  assert.ok(getBattleRulesReminders(state,{playerId:'p1',unitId:'sentinel'}).some(item=>item.ruleId==='captain-general-range-check'));
  assert.ok(!getBattleRulesReminders(state,{playerId:'p1',unitId:'telemon'}).some(item=>item.ruleId==='captain-general-range-check'));
  const psychic=getTargetDefenseReminders(state,{targetUnitId:'wardens',weapon:{characteristics:{psychic:true}}});
  assert.ok(psychic.some(item=>item.id==='psychic-aura-check'&&item.conditional));
});

test('a Captain shield never receives the Sentinel shield’s different defensive effect',()=>{
  const state=custodesReminderState();const captain=state.armyRosters.p1.units.find(unit=>unit.id==='r-trajann');
  captain.datasheet=structuredClone(sheets['adeptus-custodes:shield-captain']);captain.equippedWargear=[{name:'Praesidium Shield',quantity:1}];
  const result=getTargetDefenseReminders(state,{targetUnitId:'wardens',allocationTargetId:'trajann',weapon:{characteristics:{strength:10}}});
  assert.ok(result.some(item=>item.id==='captain-shield'&&item.effect.includes('Reduce Damage by 1')));
  assert.ok(!result.some(item=>item.id==='strong-attack-defense'));
});
